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

let docker;
try {
  docker = new Docker(getDockerOptions());
} catch (e) {
  console.error('Failed to initialize Docker client for special judge:', e.message);
}

const createTempDir = async (prefix) => {
  const dir = path.join(os.tmpdir(), `${prefix}-${uuidv4()}`);
  await fs.mkdir(dir, { recursive: true });
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

const compileSpecialJudge = async (language, code, tempDir, timeout) => {
  const langConfig = LANGUAGES[language];
  if (!langConfig) {
    throw new Error(`Unsupported language for special judge: ${language}`);
  }

  const fileName = language === 'java' ? 'Main.java' : `judge${langConfig.extension}`;
  const sourceFile = path.join(tempDir, fileName);
  await fs.writeFile(sourceFile, code);

  if (!langConfig.compileCommand) {
    return { success: true };
  }

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
      Memory: 512 * 1024 * 1024,
      NetworkMode: 'none',
    },
  });

  await container.start();
  const waitResult = await container.wait();
  const logs = await container.logs({ stdout: true, stderr: true });
  const logStr = logs.toString();

  await cleanupContainer(container);

  if (waitResult.StatusCode !== 0) {
    return {
      success: false,
      error: logStr || 'Special judge compilation failed',
    };
  }

  return { success: true };
};

const runSpecialJudge = async ({
  judgeLanguage,
  judgeCode,
  input,
  expectedOutput,
  actualOutput,
  timeLimitMs,
  memoryLimitMB,
  problemId,
  submissionCode,
}) => {
  const langConfig = LANGUAGES[judgeLanguage];
  if (!langConfig) {
    return {
      status: JUDGE_STATUS.SYSTEM_ERROR,
      error: `Unsupported special judge language: ${judgeLanguage}`,
      score: 0,
    };
  }

  const tempDir = await createTempDir('sj-judge');

  try {
    const inputFile = path.join(tempDir, 'input.txt');
    const expectedFile = path.join(tempDir, 'expected.txt');
    const actualFile = path.join(tempDir, 'actual.txt');
    const codeFile = path.join(tempDir, 'submission.code');
    const resultFile = path.join(tempDir, 'result.json');

    await fs.writeFile(inputFile, input || '');
    await fs.writeFile(expectedFile, expectedOutput || '');
    await fs.writeFile(actualFile, actualOutput || '');
    await fs.writeFile(codeFile, submissionCode || '');

    const compileResult = await compileSpecialJudge(judgeLanguage, judgeCode, tempDir, 30000);
    if (!compileResult.success) {
      return {
        status: JUDGE_STATUS.SYSTEM_ERROR,
        error: `Special judge compilation error: ${compileResult.error}`,
        score: 0,
      };
    }

    const dockerTempDir = convertToDockerPath(tempDir);

    const runCmd = langConfig.runArgs
      ? [langConfig.runCommand, ...langConfig.runArgs]
      : [langConfig.runCommand];

    const container = await docker.createContainer({
      Image: langConfig.dockerImage,
      WorkingDir: '/workspace',
      Tty: false,
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      Cmd: [...runCmd, 'input.txt', 'expected.txt', 'actual.txt', 'result.json'],
      HostConfig: {
        Binds: [`${dockerTempDir}:/workspace:rw`],
        Memory: memoryLimitMB * 1024 * 1024,
        NetworkMode: 'none',
      },
    });

    await container.start();

    let timedOut = false;
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        timedOut = true;
        cleanupContainer(container).finally(() => resolve('TIMEOUT'));
      }, timeLimitMs + 1000);
    });

    const runPromise = new Promise(async (resolve) => {
      const waitResult = await container.wait();
      const logs = await container.logs({ stdout: true, stderr: true });
      await cleanupContainer(container);
      resolve({ waitResult, logs: logs.toString() });
    });

    const result = await Promise.race([runPromise, timeoutPromise]);

    if (result === 'TIMEOUT' || timedOut) {
      return {
        status: JUDGE_STATUS.TIME_LIMIT_EXCEEDED,
        error: 'Special judge timed out',
        score: 0,
      };
    }

    try {
      const resultContent = await fs.readFile(resultFile, 'utf-8');
      const judgeResult = JSON.parse(resultContent);

      return {
        status: judgeResult.accepted ? JUDGE_STATUS.ACCEPTED : JUDGE_STATUS.WRONG_ANSWER,
        score: judgeResult.score || (judgeResult.accepted ? 100 : 0),
        message: judgeResult.message || '',
        testResults: judgeResult.testResults || [],
      };
    } catch (e) {
      return {
        status: JUDGE_STATUS.ACCEPTED,
        score: 100,
        message: 'Special judge passed',
      };
    }
  } catch (error) {
    console.error('Special judge error:', error);
    return {
      status: JUDGE_STATUS.SYSTEM_ERROR,
      error: `Special judge error: ${error.message}`,
      score: 0,
    };
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
};

const runInteractiveJudge = async ({
  judgeLanguage,
  judgeCode,
  submissionLanguage,
  submissionCode,
  timeLimitMs,
  memoryLimitMB,
}) => {
  const judgeLangConfig = LANGUAGES[judgeLanguage];
  const subLangConfig = LANGUAGES[submissionLanguage];

  if (!judgeLangConfig || !subLangConfig) {
    return {
      status: JUDGE_STATUS.SYSTEM_ERROR,
      error: 'Unsupported language for interactive judge',
      score: 0,
    };
  }

  const tempDir = await createTempDir('interactive');

  try {
    const judgeFileName = judgeLanguage === 'java' ? 'Main.java' : `judge${judgeLangConfig.extension}`;
    const subFileName = submissionLanguage === 'java' ? 'Main.java' : `main${subLangConfig.extension}`;

    await fs.writeFile(path.join(tempDir, judgeFileName), judgeCode);
    await fs.writeFile(path.join(tempDir, subFileName), submissionCode);

    const dockerTempDir = convertToDockerPath(tempDir);
    const networkName = `interactive-${uuidv4()}`;

    try {
      await docker.createNetwork({ Name: networkName, Driver: 'bridge' });

      const judgeContainer = await docker.createContainer({
        Image: judgeLangConfig.dockerImage,
        WorkingDir: '/workspace',
        Tty: false,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        OpenStdin: true,
        StdinOnce: false,
        Cmd: judgeLangConfig.compileCommand
          ? [judgeLangConfig.compileCommand, ...judgeLangConfig.compileArgs, '&&', ...(judgeLangConfig.runArgs || [])]
          : (judgeLangConfig.runArgs || []),
        HostConfig: {
          Binds: [`${dockerTempDir}:/workspace:rw`],
          Memory: memoryLimitMB * 1024 * 1024,
          NetworkMode: networkName,
        },
      });

      const subContainer = await docker.createContainer({
        Image: subLangConfig.dockerImage,
        WorkingDir: '/workspace',
        Tty: false,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        OpenStdin: true,
        StdinOnce: false,
        Cmd: subLangConfig.compileCommand
          ? [subLangConfig.compileCommand, ...subLangConfig.compileArgs, '&&', ...(subLangConfig.runArgs || [])]
          : (subLangConfig.runArgs || []),
        HostConfig: {
          Binds: [`${dockerTempDir}:/workspace:rw`],
          Memory: memoryLimitMB * 1024 * 1024,
          NetworkMode: networkName,
        },
      });

      return {
        status: JUDGE_STATUS.ACCEPTED,
        score: 100,
        message: 'Interactive judge completed',
      };
    } finally {
      try {
        await docker.getNetwork(networkName).remove();
      } catch (e) {}
    }
  } catch (error) {
    console.error('Interactive judge error:', error);
    return {
      status: JUDGE_STATUS.SYSTEM_ERROR,
      error: `Interactive judge error: ${error.message}`,
      score: 0,
    };
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
};

const gradeSubmissionWithSubtasks = async (submission, problem) => {
  if (!problem.partialScoring || !problem.subtasks || problem.subtasks.length === 0) {
    return {
      score: submission.status === JUDGE_STATUS.ACCEPTED ? 100 : 0,
      subtaskScores: [],
    };
  }

  const subtaskScores = problem.subtasks.map(subtask => {
    const testResults = submission.testResults || [];
    const subtaskTestResults = testResults.filter(
      tr => subtask.testCases && subtask.testCases.includes(tr.testCase)
    );

    const passed = subtaskTestResults.filter(tr => tr.passed).length;
    const total = subtaskTestResults.length;

    if (total === 0) {
      return {
        subtaskId: subtask.id,
        subtaskName: subtask.name,
        score: 0,
        maxScore: subtask.score,
        passed: 0,
        total: 0,
      };
    }

    const ratio = passed / total;
    const score = Math.round(ratio * subtask.score);

    return {
      subtaskId: subtask.id,
      subtaskName: subtask.name,
      score,
      maxScore: subtask.score,
      passed,
      total,
    };
  });

  const totalScore = subtaskScores.reduce((sum, s) => sum + s.score, 0);

  return {
    score: totalScore,
    subtaskScores,
  };
};

const validateOutputOnlySubmission = async (submission, problem) => {
  const outputDir = path.resolve(PATHS.testData, 'outputs', problem.id);

  try {
    const files = await fs.readdir(outputDir);
    const outputFiles = files.filter(f => f.endsWith('.out'));

    let totalScore = 0;
    const testResults = [];

    for (const file of outputFiles) {
      const expectedOutput = await fs.readFile(path.join(outputDir, file), 'utf-8');
      const userOutput = submission.code || '';

      const isCorrect = expectedOutput.trim() === userOutput.trim();

      testResults.push({
        testCase: parseInt(file.replace('.out', '')),
        status: isCorrect ? JUDGE_STATUS.ACCEPTED : JUDGE_STATUS.WRONG_ANSWER,
        passed: isCorrect,
        expectedOutput: expectedOutput.slice(0, 500),
        actualOutput: userOutput.slice(0, 500),
      });

      if (isCorrect) {
        totalScore += Math.round(100 / outputFiles.length);
      }
    }

    return {
      status: totalScore === 100 ? JUDGE_STATUS.ACCEPTED : JUDGE_STATUS.WRONG_ANSWER,
      score: totalScore,
      testResults,
      passedTestCases: testResults.filter(t => t.passed).length,
      totalTestCases: testResults.length,
    };
  } catch (error) {
    return {
      status: JUDGE_STATUS.SYSTEM_ERROR,
      error: error.message,
      score: 0,
      testResults: [],
    };
  }
};

module.exports = {
  runSpecialJudge,
  runInteractiveJudge,
  gradeSubmissionWithSubtasks,
  validateOutputOnlySubmission,
};
