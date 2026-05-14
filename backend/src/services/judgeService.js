const Docker = require('dockerode');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { LANGUAGES, PATHS, JUDGE_STATUS } = require('../config/constants');

const isWindows = os.platform() === 'win32';

const getDockerOptions = () => {
  if (process.env.DOCKER_HOST) {
    console.log(`[Docker] Using DOCKER_HOST from env: ${process.env.DOCKER_HOST}`);
    return {};
  }
  
  if (isWindows) {
    console.log('[Docker] Windows detected, using named pipe: //./pipe/docker_engine');
    return { socketPath: '//./pipe/docker_engine' };
  }
  
  console.log('[Docker] Unix-like system, using socket: /var/run/docker.sock');
  return { socketPath: '/var/run/docker.sock' };
};

const convertToDockerPath = (windowsPath) => {
  if (!isWindows) return windowsPath;
  
  try {
    let normalized = path.normalize(windowsPath);
    normalized = normalized.replace(/^([A-Z]):\\/, (match, drive) => `/${drive.toLowerCase()}/`);
    normalized = normalized.replace(/\\/g, '/');
    console.log(`[Path] Converted: ${windowsPath} -> ${normalized}`);
    return normalized;
  } catch (e) {
    console.error(`[Path] Conversion error: ${e.message}`);
    return windowsPath;
  }
};

let docker;
try {
  docker = new Docker(getDockerOptions());
  console.log('[Docker] Docker client initialized');
} catch (e) {
  console.error('[Docker] Failed to initialize Docker client:', e.message);
}

const testDockerConnection = async () => {
  try {
    const info = await docker.info();
    console.log(`[Docker] Connected successfully. Server version: ${info.ServerVersion}`);
    return true;
  } catch (error) {
    console.error('[Docker] Connection failed:', error.message);
    return false;
  }
};

const createTempDir = async (prefix) => {
  const dir = path.join(os.tmpdir(), `${prefix}-${uuidv4()}`);
  await fs.mkdir(dir, { recursive: true });
  console.log(`[Temp] Created temp dir: ${dir}`);
  return dir;
};

const cleanupContainer = async (container) => {
  try {
    await container.kill();
  } catch (e) {}
  try {
    await container.remove({ force: true });
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
      console.log(`[Docker] Image already exists: ${imageName}`);
      return;
    }
    
    console.log(`[Docker] Pulling image ${imageName}... (this may take a while)`);
    const pullStream = await docker.pull(imageName);
    await new Promise((resolve, reject) => {
      docker.modem.followProgress(pullStream, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });
    console.log(`[Docker] Image ${imageName} pulled successfully`);
  } catch (error) {
    console.error(`[Docker] Failed to pull image ${imageName}:`, error.message);
    throw error;
  }
};

const writeSourceFile = async (language, code, tempDir) => {
  const langConfig = LANGUAGES[language];
  const fileName = language === 'java' ? 'Main.java' : `main${langConfig.extension}`;
  const sourceFile = path.join(tempDir, fileName);
  await fs.writeFile(sourceFile, code);
  console.log(`[Source] Wrote source file: ${sourceFile}`);
  return sourceFile;
};

const compileCode = async (language, code, tempDir, timeout) => {
  const langConfig = LANGUAGES[language];
  
  await writeSourceFile(language, code, tempDir);
  
  if (!langConfig.compileCommand) {
    console.log(`[Compile] ${language} is interpreted, skipping compilation`);
    return { success: true };
  }
  
  console.log(`[Compile] Compiling ${language} code...`);
  
  try {
    await pullImageIfNeeded(langConfig.dockerImage);
    
    const dockerTempDir = convertToDockerPath(tempDir);
    
    console.log(`[Compile] Creating container for compilation...`);
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
        Memory: 512 * 1024 * 1024,
        NetworkMode: 'none',
      },
    });
    
    console.log(`[Compile] Starting container...`);
    await container.start();
    
    const waitResult = await container.wait();
    console.log(`[Compile] Container exited with code: ${waitResult.StatusCode}`);
    
    const logs = await container.logs({ stdout: true, stderr: true });
    const logStr = logs.toString();
    if (logStr) {
      console.log(`[Compile] Output:\n${logStr}`);
    }
    
    await cleanupContainer(container);
    
    if (waitResult.StatusCode !== 0) {
      return {
        success: false,
        error: logStr || 'Compilation failed with unknown error',
      };
    }
    
    console.log(`[Compile] Compilation successful`);
    return { success: true };
  } catch (error) {
    console.error(`[Compile] Error:`, error.message);
    return {
      success: false,
      error: `Compilation error: ${error.message}`,
    };
  }
};

const runTest = async (language, tempDir, input, timeLimit, memoryLimit) => {
  const langConfig = LANGUAGES[language];
  const dockerTempDir = convertToDockerPath(tempDir);
  
  console.log(`[Run] Running test with ${language}, timeLimit=${timeLimit}ms, memory=${memoryLimit}MB`);
  
  try {
    console.log(`[Run] Creating container...`);
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
        Memory: memoryLimit * 1024 * 1024,
        NetworkMode: 'none',
      },
    });
    
    const startTime = Date.now();
    console.log(`[Run] Starting container...`);
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
        console.log(`[Run] Timeout reached (${timeLimit + 1000}ms), forcing cleanup...`);
        cleanupContainer(container).finally(() => resolve('TIMEOUT'));
      }, timeLimit + 1000);
    });
    
    const runPromise = new Promise(async (resolve) => {
      if (input) {
        console.log(`[Run] Writing input (${input.length} chars)...`);
        attachStream.write(input);
        attachStream.end();
      }
      
      let outputBuffer = Buffer.alloc(0);
      attachStream.on('data', (chunk) => {
        outputBuffer = Buffer.concat([outputBuffer, chunk]);
      });
      
      const waitResult = await container.wait();
      console.log(`[Run] Container exited with code: ${waitResult.StatusCode}`);
      
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
      
      console.log(`[Run] stdout: ${stdout.substring(0, 200)}${stdout.length > 200 ? '...' : ''}`);
      if (stderr) console.log(`[Run] stderr: ${stderr}`);
      
      await cleanupContainer(container);
      resolve({ waitResult, stdout, stderr });
    });
    
    const result = await Promise.race([runPromise, timeoutPromise]);
    
    if (result === 'TIMEOUT' || timedOut) {
      console.log(`[Run] Result: TIME_LIMIT_EXCEEDED`);
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
      console.log(`[Run] Result: MEMORY_LIMIT_EXCEEDED`);
      return {
        status: JUDGE_STATUS.MEMORY_LIMIT_EXCEEDED,
        runtime,
        memory: memoryLimit,
        output: result.stdout,
      };
    }
    
    if (result.waitResult.StatusCode !== 0) {
      console.log(`[Run] Result: RUNTIME_ERROR (exit code ${result.waitResult.StatusCode})`);
      return {
        status: JUDGE_STATUS.RUNTIME_ERROR,
        runtime,
        memory: 0,
        output: result.stdout,
        error: result.stderr,
      };
    }
    
    console.log(`[Run] Result: SUCCESS (${runtime}ms)`);
    return {
      status: 'SUCCESS',
      runtime,
      memory: 0,
      output: result.stdout,
    };
  } catch (error) {
    console.error(`[Run] Error:`, error.message);
    console.error(error.stack);
    return {
      status: JUDGE_STATUS.SYSTEM_ERROR,
      runtime: 0,
      memory: 0,
      output: '',
      error: `Runtime error: ${error.message}`,
    };
  }
};

const loadTestCases = async (problemId) => {
  try {
    const inputDir = path.resolve(PATHS.testData, 'inputs', problemId);
    const outputDir = path.resolve(PATHS.testData, 'outputs', problemId);
    
    console.log(`[TestCases] Loading from: ${inputDir}`);
    console.log(`[TestCases] Full path resolved: ${path.resolve(inputDir)}`);
    
    const files = await fs.readdir(inputDir);
    console.log(`[TestCases] Found ${files.length} files in input directory`);
    
    const testCases = [];
    
    for (const file of files) {
      if (file.endsWith('.in')) {
        const testNum = file.replace('.in', '');
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, `${testNum}.out`);
        
        try {
          const input = await fs.readFile(inputPath, 'utf-8');
          const expectedOutput = await fs.readFile(outputPath, 'utf-8');
          
          console.log(`[TestCases] Loaded test case ${testNum}: ${input.length} bytes input, ${expectedOutput.length} bytes expected`);
          
          testCases.push({
            index: parseInt(testNum),
            input,
            expectedOutput,
          });
        } catch (e) {
          console.error(`[TestCases] Error reading test case ${testNum}:`, e.message);
        }
      }
    }
    
    testCases.sort((a, b) => a.index - b.index);
    console.log(`[TestCases] Total loaded: ${testCases.length} test cases`);
    return testCases;
  } catch (error) {
    console.error('[TestCases] Error loading test cases:', error.message);
    console.error(error.stack);
    return [];
  }
};

const judge = async ({ language, code, problemId, timeLimitMs, memoryLimitMB }) => {
  console.log(`\n========== Judge Started ==========`);
  console.log(`[Judge] Language: ${language}`);
  console.log(`[Judge] Problem ID: ${problemId}`);
  console.log(`[Judge] Time limit: ${timeLimitMs}ms, Memory limit: ${memoryLimitMB}MB`);
  
  const langConfig = LANGUAGES[language];
  
  if (!langConfig) {
    console.log(`[Judge] Unsupported language: ${language}`);
    return {
      status: JUDGE_STATUS.SYSTEM_ERROR,
      error: 'Unsupported language',
    };
  }
  
  const dockerOk = await testDockerConnection();
  if (!dockerOk) {
    return {
      status: JUDGE_STATUS.SYSTEM_ERROR,
      error: 'Docker connection failed. Please ensure Docker Desktop is running.',
      testResults: [],
      passedTestCases: 0,
      totalTestCases: 0,
    };
  }
  
  const tempDir = await createTempDir('oj-judge');
  
  try {
    const compileResult = await compileCode(language, code, tempDir, 30000);
    
    if (!compileResult.success) {
      console.log(`[Judge] Compilation failed`);
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
      console.log(`[Judge] No test cases found`);
      return {
        status: JUDGE_STATUS.SYSTEM_ERROR,
        error: `No test cases found for problem ${problemId}. Please run 'npm run auto-setup-test-data' to generate test data.`,
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
      console.log(`\n[Judge] Running test case ${testCase.index}...`);
      
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
          console.log(`[Judge] Test case ${testCase.index}: PASSED`);
        } else {
          testStatus = JUDGE_STATUS.WRONG_ANSWER;
          finalStatus = JUDGE_STATUS.WRONG_ANSWER;
          console.log(`[Judge] Test case ${testCase.index}: WRONG_ANSWER`);
          console.log(`[Judge]   Expected: "${testCase.expectedOutput.trim()}"`);
          console.log(`[Judge]   Actual:   "${result.output.trim()}"`);
        }
      } else {
        finalStatus = result.status;
        console.log(`[Judge] Test case ${testCase.index}: ${result.status}`);
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
        console.log(`[Judge] Stopping at first failed test case`);
        break;
      }
    }
    
    console.log(`\n========== Judge Complete ==========`);
    console.log(`[Judge] Final status: ${finalStatus}`);
    console.log(`[Judge] Passed: ${passedCount}/${testCases.length}`);
    console.log(`[Judge] Runtime: ${totalRuntime}ms`);
    
    return {
      status: finalStatus,
      runtimeMs: totalRuntime,
      memoryMB: maxMemory,
      testResults,
      passedTestCases: passedCount,
      totalTestCases: testCases.length,
    };
  } catch (error) {
    console.error('[Judge] Unexpected error:', error);
    console.error(error.stack);
    return {
      status: JUDGE_STATUS.SYSTEM_ERROR,
      error: `System error: ${error.message}`,
      testResults: [],
      passedTestCases: 0,
      totalTestCases: 0,
    };
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`[Temp] Cleaned up: ${tempDir}`);
    } catch (e) {}
  }
};

module.exports = { judge };
