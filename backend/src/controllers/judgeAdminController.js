const { response } = require('../utils/response');
const {
  rejudgeSubmission,
  rejudgeProblemSubmissions,
  rejudgeContestSubmissions,
  rejudgeSelectedSubmissions,
  registerJudgeNode,
  updateJudgeNodeHeartbeat,
  getJudgeNodes,
  updateJudgeNode,
  deleteJudgeNode,
  getJudgeQueueStatus,
  pauseJudgeQueue,
  resumeJudgeQueue,
  emptyJudgeQueue,
} = require('../services/judgeAdminService');

const rejudgeSub = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await rejudgeSubmission(id, userId);
    return response(res, 200, true, 'Submission rejudged', result);
  } catch (error) {
    console.error('Rejudge submission error:', error);
    return response(res, 500, false, error.message);
  }
};

const rejudgeProblem = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user.id;
    const result = await rejudgeProblemSubmissions(problemId, userId);
    return response(res, 200, true, 'Problem submissions rejudged', result);
  } catch (error) {
    console.error('Rejudge problem error:', error);
    return response(res, 500, false, error.message);
  }
};

const rejudgeContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.user.id;
    const result = await rejudgeContestSubmissions(contestId, userId);
    return response(res, 200, true, 'Contest submissions rejudged', result);
  } catch (error) {
    console.error('Rejudge contest error:', error);
    return response(res, 500, false, error.message);
  }
};

const rejudgeSelected = async (req, res) => {
  try {
    const { submissionIds } = req.body;
    const userId = req.user.id;
    const result = await rejudgeSelectedSubmissions(submissionIds, userId);
    return response(res, 200, true, 'Selected submissions rejudged', result);
  } catch (error) {
    console.error('Rejudge selected error:', error);
    return response(res, 500, false, error.message);
  }
};

const registerNode = async (req, res) => {
  try {
    const node = await registerJudgeNode(req.body);
    return response(res, 201, true, 'Judge node registered', node);
  } catch (error) {
    console.error('Register judge node error:', error);
    return response(res, 500, false, error.message);
  }
};

const heartbeat = async (req, res) => {
  try {
    const { id } = req.params;
    const node = await updateJudgeNodeHeartbeat(id, req.body);
    return response(res, 200, true, 'Heartbeat updated', node);
  } catch (error) {
    console.error('Heartbeat error:', error);
    return response(res, 500, false, error.message);
  }
};

const listNodes = async (req, res) => {
  try {
    const { status, type, isEnabled } = req.query;
    const filters = {
      status,
      type,
      isEnabled: isEnabled !== undefined ? isEnabled === 'true' : undefined,
    };
    const nodes = await getJudgeNodes(filters);
    return response(res, 200, true, 'Judge nodes retrieved', nodes);
  } catch (error) {
    console.error('List judge nodes error:', error);
    return response(res, 500, false, error.message);
  }
};

const updateNode = async (req, res) => {
  try {
    const { id } = req.params;
    const node = await updateJudgeNode(id, req.body);
    return response(res, 200, true, 'Judge node updated', node);
  } catch (error) {
    console.error('Update judge node error:', error);
    return response(res, 500, false, error.message);
  }
};

const deleteNode = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteJudgeNode(id);
    return response(res, 200, true, 'Judge node deleted');
  } catch (error) {
    console.error('Delete judge node error:', error);
    return response(res, 500, false, error.message);
  }
};

const getQueueStatus = async (req, res) => {
  try {
    const status = await getJudgeQueueStatus();
    return response(res, 200, true, 'Queue status retrieved', status);
  } catch (error) {
    console.error('Get queue status error:', error);
    return response(res, 500, false, error.message);
  }
};

const pauseQueue = async (req, res) => {
  try {
    const result = await pauseJudgeQueue();
    return response(res, 200, true, 'Queue paused', result);
  } catch (error) {
    console.error('Pause queue error:', error);
    return response(res, 500, false, error.message);
  }
};

const resumeQueue = async (req, res) => {
  try {
    const result = await resumeJudgeQueue();
    return response(res, 200, true, 'Queue resumed', result);
  } catch (error) {
    console.error('Resume queue error:', error);
    return response(res, 500, false, error.message);
  }
};

const emptyQueue = async (req, res) => {
  try {
    const result = await emptyJudgeQueue();
    return response(res, 200, true, 'Queue emptied', result);
  } catch (error) {
    console.error('Empty queue error:', error);
    return response(res, 500, false, error.message);
  }
};

module.exports = {
  rejudgeSub,
  rejudgeProblem,
  rejudgeContest,
  rejudgeSelected,
  registerNode,
  heartbeat,
  listNodes,
  updateNode,
  deleteNode,
  getQueueStatus,
  pauseQueue,
  resumeQueue,
  emptyQueue,
};
