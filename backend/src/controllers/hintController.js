const { response } = require('../utils/response');
const {
  createHint,
  updateHint,
  deleteHint,
  getAvailableHints,
  unlockHint,
  analyzeUserWeakTags,
  getUserWeakTags,
  getRelatedProblems,
  getLearningPathRecommendations,
} = require('../services/hintService');

const createProblemHint = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user.id;
    const hint = await createHint(problemId, req.body, userId);
    return response(res, 201, true, 'Hint created', hint);
  } catch (error) {
    console.error('Create hint error:', error);
    return response(res, 500, false, error.message);
  }
};

const updateProblemHint = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const hint = await updateHint(id, req.body, userId);
    return response(res, 200, true, 'Hint updated', hint);
  } catch (error) {
    console.error('Update hint error:', error);
    return response(res, 500, false, error.message);
  }
};

const deleteProblemHint = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await deleteHint(id, userId);
    return response(res, 200, true, 'Hint deleted');
  } catch (error) {
    console.error('Delete hint error:', error);
    return response(res, 500, false, error.message);
  }
};

const getHints = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user?.id;
    const hints = await getAvailableHints(problemId, userId);
    return response(res, 200, true, 'Hints retrieved', hints);
  } catch (error) {
    console.error('Get hints error:', error);
    return response(res, 500, false, error.message);
  }
};

const unlock = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await unlockHint(id, userId);
    return response(res, 200, true, 'Hint unlock status', result);
  } catch (error) {
    console.error('Unlock hint error:', error);
    return response(res, 500, false, error.message);
  }
};

const analyzeWeakTags = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await analyzeUserWeakTags(userId);
    return response(res, 200, true, 'Weak tags analyzed', result);
  } catch (error) {
    console.error('Analyze weak tags error:', error);
    return response(res, 500, false, error.message);
  }
};

const getMyWeakTags = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;
    const weakTags = await getUserWeakTags(userId, parseInt(limit));
    return response(res, 200, true, 'Weak tags retrieved', weakTags);
  } catch (error) {
    console.error('Get weak tags error:', error);
    return response(res, 500, false, error.message);
  }
};

const getRelated = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { limit = 10 } = req.query;
    const problems = await getRelatedProblems(problemId, parseInt(limit));
    return response(res, 200, true, 'Related problems retrieved', problems);
  } catch (error) {
    console.error('Get related problems error:', error);
    return response(res, 500, false, error.message);
  }
};

const getLearningPath = async (req, res) => {
  try {
    const userId = req.user.id;
    const recommendations = await getLearningPathRecommendations(userId);
    return response(res, 200, true, 'Learning path recommendations retrieved', recommendations);
  } catch (error) {
    console.error('Get learning path error:', error);
    return response(res, 500, false, error.message);
  }
};

module.exports = {
  createProblemHint,
  updateProblemHint,
  deleteProblemHint,
  getHints,
  unlock,
  analyzeWeakTags,
  getMyWeakTags,
  getRelated,
  getLearningPath,
};
