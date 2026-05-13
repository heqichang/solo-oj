const Docker = require('dockerode');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { LANGUAGES, PATHS, JUDGE_STATUS } = require('../config/constants');

const isWindows = os.platform() === 'win32';

const getDockerOptions = () => {
  if (process.env.DOCKER_HOST) {
    return {};
  }
  
  if (isWindows) {
    return { socketPath: '//./pipe/docker_engine' };
  }
  
  return { socketPath: '/var/run/docker.sock' };
};

const convertToDockerPath = (windowsPath) => {
  if (!isWindows) return windowsPath;
  
  try {
    let normalized = path.normalize(windowsPath);
    normalized = normalized.replace(/^([A-Z]):\\/, (match, drive) => `/${drive.toLowerCase()}/`);
    normalized = normalized.replace(/\\/g, '/');
    return normalized;
  } catch (e) {
    return windowsPath;
  }
};

const docker = new Docker(getDockerOptions());

const createTempDir = async (prefix) => {
  const dir = path.join(require('os').tmpdir(), `${prefix}-${uuidv4()}`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
};

const cleanupContainer = async (container) => {
  try {
    await container.stop();
  } catch (e) {}
  try {
    await container.remove();
  } catch (e) {}
};

const normalizeOutput = (output) => {
  if (!output) return '';
  return output
    .toString()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\s+$/g, '');
};

const compareOutputs = (actual, expected) => {
  const normalizedActual = normalizeOutput(actual);
  const normalizedExpected = normalizeOutput(expected);
  return normalizedActual === normalizedExpected;
};

const pullImageIfNeeded = async (imageName) => {
  try {
    const images = await docker.listImages({ filters: { reference: [imageName] } });
    if (images.length > 0) {
      return;
    }
    
    console.log(`Pulling image ${imageName}...`);
    const pullStream = await docker.pull(imageName);
    await new Promise((resolve, reject) => {
      docker.modem.followProgress(pullStream, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });
    console.log(`Image ${imageName} pulled successfully`);
  } catch (error) {
    console.error(`Failed to pull image ${imageName}:`, error.message);
  }
};

const compileCode = async (language, code, tempDir, timeout) => {
  const langConfig = LANGUAGES[language];
  
  if (!langConfig.compileCommand) {
    return { success: true };
  }
  
  const sourceFile = path.join(tempDir, language === 'java' ? 'Main.java' : `main${langConfig.extension}`);
  await fs.writeFile(sourceFile, code);
  
  try {
    await pullImageIfNeeded(langConfig.dockerImage);
    
    const dockerTempDir = convertToDockerPath(tempDir);
    
    const container = await docker.createContainer({
      Image: langConfig.dockerImage,
      WorkingDir: '/workspace',
      Tty: false,
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      Cmd: [langConfig.compileCommand, ...langConfig.compileArgs],
      HostConfig: {
        Binds: [`${dockerTempDir}:/workspace:rw`],
        MemoryLimit: 512 * 1024 * 1024,
        NetworkMode: 'none',
        ReadonlyRootfs: false,
        Privileged: false,
      },
    });
    
    await container.start();
    
    const waitResult = await container.wait();
    const logs = await container.logs({ stdout: true, stderr: true });
    
    await cleanupContainer(container);
    
    if (waitResult.StatusCode !== 0) {
      return {
        success: false,
        error: logs.toString(),
      };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

const runTest = async (language, tempDir, input, timeLimit, memoryLimit) => {
  const langConfig = LANGUAGES[language];
  const dockerTempDir = convertToDockerPath(tempDir);
  
  try {
    const container = await docker.createContainer({
      Image: langConfig.dockerImage,
      WorkingDir: '/workspace',
      Tty: false,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      StdinOnce: true,
      Cmd: langConfig.runArgs
        ? [langConfig.runCommand, ...langConfig.runArgs]
        : [langConfig.runCommand],
      HostConfig: {
        Binds: [`${dockerTempDir}:/workspace:ro`],
        MemoryLimit: memoryLimit * 1024 * 1024,
        MemorySwap: memoryLimit * 1024 * 1024,
        CpuQuota: Math.round(50000 * (langConfig.cpuLimit || 0.5)),
        NetworkMode: 'none',
        ReadonlyRootfs: false,
        Privileged: false,
        PidsLimit: 32,
        Ulimits: [
          { Name: 'nproc', Soft: 32, Hard: 32 },
          { Name: 'nofile', Soft: 1024, Hard: 1024 },
        ],
      },
    });
    
    const startTime = Date.now();
    await container.start();
    
    const attachStream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
    });
    
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        timedOut = true;
        cleanupContainer(container).finally(() => resolve('TIMEOUT'));
      }, timeLimit + 1000);
    });
    
    const runPromise = new Promise(async (resolve) => {
      if (input) {
        attachStream.write(input);
        attachStream.end();
      }
      
      let outputBuffer = Buffer.alloc(0);
      attachStream.on('data', (chunk) => {
        outputBuffer = Buffer.concat([outputBuffer, chunk]);
      });
      
      const waitResult = await container.wait();
      
      if (outputBuffer.length > 0) {
        const headerSize = 8;
        for (let i = 0; i < outputBuffer.length; ) {
          const streamType = outputBuffer[i];
          const payloadSize = outputBuffer.readUInt32BE(i + 4);
          const payload = outputBuffer.slice(i + headerSize, i + headerSize + payloadSize);
          
          if (streamType === 1) {
            stdout += payload.toString();
          } else if (streamType === 2) {
            stderr += payload.toString();
          }
          
          i += headerSize + payloadSize;
        }
      }
      
      await cleanupContainer(container);
      resolve({ waitResult, stdout, stderr });
    });
    
    const result = await Promise.race([runPromise, timeoutPromise]);
    
    if (result === 'TIMEOUT' || timedOut) {
      return {
        status: JUDGE_STATUS.TIME_LIMIT_EXCEEDED,
        runtime: timeLimit,
        memory: memoryLimit,
        output: '',
      };
    }
    
    const endTime = Date.now();
    const runtime = endTime - startTime;
    
    if (result.waitResult.StatusCode === 137) {
      return {
        status: JUDGE_STATUS.MEMORY_LIMIT_EXCEEDED,
        runtime,
        memory: memoryLimit,
        output: result.stdout,
      };
    }
    
    if (result.waitResult.StatusCode !== 0) {
      return {
        status: JUDGE_STATUS.RUNTIME_ERROR,
        runtime,
        memory: 0,
        output: result.stdout,
        error: result.stderr,
      };
    }
    
    return {
      status: 'SUCCESS',
      runtime,
      memory: 0,
      output: result.stdout,
    };
  } catch (error) {
    return {
      status: JUDGE_STATUS.SYSTEM_ERROR,
      runtime: 0,
      memory: 0,
      output: '',
      error: error.message,
    };
  }
};

const loadTestCases = async (problemId) => {
  try {
    const inputDir = path.join(PATHS.testData, 'inputs', problemId);
    const outputDir = path.join(PATHS.testData, 'outputs', problemId);
    
    const files = await fs.readdir(inputDir);
    const testCases = [];
    
    for (const file of files) {
      if (file.endsWith('.in')) {
        const testNum = file.replace('.in', '');
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, `${testNum}.out`);
        
        try {
          const input = await fs.readFile(inputPath, 'utf-8');
          const expectedOutput = await fs.readFile(outputPath, 'utf-8');
          
          testCases.push({
            index: parseInt(testNum),
            input,
            expectedOutput,
          });
        } catch (e) {
          console.error(`Error reading test case ${testNum}:`, e.message);
        }
      }
    }
    
    return testCases.sort((a, b) => a.index - b.index);
  } catch (error) {
    console.error('Error loading test cases:', error);
    return [];
  }
};

const judge = async ({ language, code, problemId, timeLimitMs, memoryLimitMB }) => {
  const langConfig = LANGUAGES[language];
  
  if (!langConfig) {
    return {
      status: JUDGE_STATUS.SYSTEM_ERROR,
      error: 'Unsupported language',
    };
  }
  
  const tempDir = await createTempDir('oj-judge');
  
  try {
    const compileResult = await compileCode(language, code, tempDir, 30000);
    
    if (!compileResult.success) {
      return {
        status: JUDGE_STATUS.COMPILATION_ERROR,
        error: compileResult.error,
        testResults: [],
        passedTestCases: 0,
        totalTestCases: 0,
      };
    }
    
    const testCases = await loadTestCases(problemId);
    
    if (testCases.length === 0) {
      return {
        status: JUDGE_STATUS.SYSTEM_ERROR,
        error: 'No test cases found for this problem. Please configure test data.',
        testResults: [],
        passedTestCases: 0,
        totalTestCases: 0,
      };
    }
    
    const testResults = [];
    let totalRuntime = 0;
    let maxMemory = 0;
    let finalStatus = JUDGE_STATUS.ACCEPTED;
    let passedCount = 0;
    
    for (const testCase of testCases) {
      const result = await runTest(
        language,
        tempDir,
        testCase.input,
        timeLimitMs,
        memoryLimitMB
      );
      
      let testStatus = result.status;
      let passed = false;
      
      if (result.status === 'SUCCESS') {
        const isCorrect = compareOutputs(result.output, testCase.expectedOutput);
        if (isCorrect) {
          testStatus = JUDGE_STATUS.ACCEPTED;
          passed = true;
          passedCount++;
        } else {
          testStatus = JUDGE_STATUS.WRONG_ANSWER;
          finalStatus = JUDGE_STATUS.WRONG_ANSWER;
        }
      } else {
        finalStatus = result.status;
      }
      
      totalRuntime = Math.max(totalRuntime, result.runtime);
      maxMemory = Math.max(maxMemory, result.memory);
      
      testResults.push({
        testCase: testCase.index,
        status: testStatus,
        runtime: result.runtime,
        memory: result.memory,
        passed,
        input: testCase.input.slice(0, 500),
        expectedOutput: testCase.expectedOutput.slice(0, 500),
        actualOutput: result.output.slice(0, 500),
      });
      
      if (finalStatus !== JUDGE_STATUS.ACCEPTED) {
        break;
      }
    }
    
    return {
      status: finalStatus,
      runtimeMs: totalRuntime,
      memoryMB: maxMemory,
      testResults,
      passedTestCases: passedCount,
      totalTestCases: testCases.length,
    };
  } catch (error) {
    console.error('Judge error:', error);
    return {
      status: JUDGE_STATUS.SYSTEM_ERROR,
      error: error.message,
      testResults: [],
      passedTestCases: 0,
      totalTestCases: 0,
    };
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
};

module.exports = { judge };
