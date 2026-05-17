const { Op } = require('sequelize');
const {
  Submission,
  Problem,
  JudgeNode,
  User,
  Contest,
} = require('../models');
const { judgeQueue } = require('../config/redis');
const { JUDGE_STATUS, SUBMISSION_PRIORITY, JUDGE_NODE_STATUS } = require('../config/constants');

const rejudgeSubmission = async (submissionId, userId) => {
  const submission = await Submission.findByPk(submissionId);
  if (!submission) {
    throw new Error('Submission not found');
  }

  const problem = await Problem.findByPk(submission.problemId);
  if (!problem) {
    throw new Error('Problem not found');
  }

  await submission.update({
    status: JUDGE_STATUS.PENDING,
    runtimeMs: null,
    memoryMB: null,
    errorMessage: null,
    testResults: [],
    passedTestCases: 0,
    totalTestCases: 0,
    score: 0,
    rejudgeCount: submission.rejudgeCount + 1,
    lastRejudgedAt: new Date(),
    lastRejudgedBy: userId,
    priority: SUBMISSION_PRIORITY.REJUDGE,
  });

  const job = await judgeQueue.add({
    submissionId: submission.id,
    problemId: problem.id,
    language: submission.language,
    code: submission.code,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMB: problem.memoryLimitMB,
    priority: SUBMISSION_PRIORITY.REJUDGE,
  });

  return { submission, jobId: job.id };
};

const rejudgeProblemSubmissions = async (problemId, userId) => {
  const problem = await Problem.findByPk(problemId);
  if (!problem) {
    throw new Error('Problem not found');
  }

  const submissions = await Submission.findAll({
    where: { problemId },
    order: [['createdAt', 'DESC']],
  });

  const results = [];

  for (const submission of submissions) {
    try {
      const result = await rejudgeSubmission(submission.id, userId);
      results.push(result);
    } catch (error) {
      results.push({ submissionId: submission.id, error: error.message });
    }
  }

  return {
    total: submissions.length,
    rejudged: results.filter(r => !r.error).length,
    results,
  };
};

const rejudgeContestSubmissions = async (contestId, userId) => {
  const { ContestSubmission } = require('../models');

  const contestSubmissions = await ContestSubmission.findAll({
    where: { contestId },
    include: [{ model: Submission, as: 'submission' }],
  });

  const results = [];

  for (const cs of contestSubmissions) {
    if (!cs.submission) continue;

    try {
      const result = await rejudgeSubmission(cs.submission.id, userId);
      results.push(result);
    } catch (error) {
      results.push({ submissionId: cs.submission.id, error: error.message });
    }
  }

  return {
    total: contestSubmissions.length,
    rejudged: results.filter(r => !r.error).length,
    results,
  };
};

const rejudgeSelectedSubmissions = async (submissionIds, userId) => {
  const results = [];

  for (const submissionId of submissionIds) {
    try {
      const result = await rejudgeSubmission(submissionId, userId);
      results.push(result);
    } catch (error) {
      results.push({ submissionId, error: error.message });
    }
  }

  return {
    total: submissionIds.length,
    rejudged: results.filter(r => !r.error).length,
    results,
  };
};

const registerJudgeNode = async (nodeData) => {
  const node = await JudgeNode.create({
    ...nodeData,
    status: JUDGE_NODE_STATUS.ONLINE,
    lastHeartbeat: new Date(),
  });

  return node;
};

const updateJudgeNodeHeartbeat = async (nodeId, statusData = {}) => {
  const node = await JudgeNode.findByPk(nodeId);
  if (!node) {
    throw new Error('Judge node not found');
  }

  await node.update({
    ...statusData,
    lastHeartbeat: new Date(),
    status: statusData.status || node.status,
  });

  return node;
};

const getJudgeNodes = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.isEnabled !== undefined) {
    where.isEnabled = filters.isEnabled;
  }

  const nodes = await JudgeNode.findAll({
    where,
    order: [['priority', 'DESC'], ['name', 'ASC']],
  });

  return nodes;
};

const updateJudgeNode = async (nodeId, data) => {
  const node = await JudgeNode.findByPk(nodeId);
  if (!node) {
    throw new Error('Judge node not found');
  }

  await node.update(data);
  return node;
};

const deleteJudgeNode = async (nodeId) => {
  const node = await JudgeNode.findByPk(nodeId);
  if (!node) {
    throw new Error('Judge node not found');
  }

  await node.destroy();
  return true;
};

const checkAndUpdateOfflineNodes = async (timeoutSeconds = 120) => {
  const threshold = new Date(Date.now() - timeoutSeconds * 1000);

  const offlineNodes = await JudgeNode.update(
    { status: JUDGE_NODE_STATUS.OFFLINE },
    {
      where: {
        lastHeartbeat: { [Op.lt]: threshold },
        status: { [Op.in]: [JUDGE_NODE_STATUS.ONLINE, JUDGE_NODE_STATUS.BUSY] },
      },
      returning: true,
    }
  );

  return offlineNodes[1];
};

const getBestJudgeNode = async (type, language) => {
  const nodes = await JudgeNode.findAll({
    where: {
      isEnabled: true,
      status: JUDGE_NODE_STATUS.ONLINE,
      [Op.or]: [
        { type: 'UNIVERSAL' },
        { type },
      ],
    },
    order: [['priority', 'DESC'], ['currentJobs', 'ASC']],
  });

  for (const node of nodes) {
    if (node.type === 'UNIVERSAL' || !node.supportedLanguages || node.supportedLanguages.length === 0) {
      return node;
    }
    if (node.supportedLanguages.includes(language)) {
      return node;
    }
  }

  return nodes[0] || null;
};

const getJudgeQueueStatus = async () => {
  const [waiting, active, completed, failed] = await Promise.all([
    judgeQueue.getWaitingCount(),
    judgeQueue.getActiveCount(),
    judgeQueue.getCompletedCount(),
    judgeQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
  };
};

const getJudgeWorkerStatus = async () => {
  const workers = await judgeQueue.getWorkers();
  return workers;
};

const pauseJudgeQueue = async () => {
  await judgeQueue.pause();
  return { paused: true };
};

const resumeJudgeQueue = async () => {
  await judgeQueue.resume();
  return { paused: false };
};

const emptyJudgeQueue = async () => {
  await judgeQueue.empty();
  return { emptied: true };
};

module.exports = {
  rejudgeSubmission,
  rejudgeProblemSubmissions,
  rejudgeContestSubmissions,
  rejudgeSelectedSubmissions,
  registerJudgeNode,
  updateJudgeNodeHeartbeat,
  getJudgeNodes,
  updateJudgeNode,
  deleteJudgeNode,
  checkAndUpdateOfflineNodes,
  getBestJudgeNode,
  getJudgeQueueStatus,
  getJudgeWorkerStatus,
  pauseJudgeQueue,
  resumeJudgeQueue,
  emptyJudgeQueue,
};
