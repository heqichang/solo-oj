const { response } = require('../utils/response');
const {
  createProblemSet,
  updateProblemSet,
  deleteProblemSet,
  getProblemSetBySlug,
  listProblemSets,
  addProblemToSet,
  removeProblemFromSet,
  updateProblemInSet,
  enrollInProblemSet,
  updateProgress,
  rateProblemSet,
  getRecommendedProblemSets,
  getUserProgress,
} = require('../services/problemSetService');

const createSet = async (req, res) => {
  try {
    const userId = req.user.id;
    const problemSet = await createProblemSet(req.body, userId);
    return response(res, 201, true, 'Problem set created', problemSet);
  } catch (error) {
    console.error('Create problem set error:', error);
    return response(res, 500, false, error.message);
  }
};

const updateSet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const problemSet = await updateProblemSet(id, req.body, userId);
    return response(res, 200, true, 'Problem set updated', problemSet);
  } catch (error) {
    console.error('Update problem set error:', error);
    return response(res, 500, false, error.message);
  }
};

const deleteSet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await deleteProblemSet(id, userId);
    return response(res, 200, true, 'Problem set deleted');
  } catch (error) {
    console.error('Delete problem set error:', error);
    return response(res, 500, false, error.message);
  }
};

const getSetBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.id;
    const problemSet = await getProblemSetBySlug(slug, userId);
    return response(res, 200, true, 'Problem set retrieved', problemSet);
  } catch (error) {
    console.error('Get problem set error:', error);
    return response(res, 500, false, error.message);
  }
};

const listSets = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, difficulty, search, isFeatured, createdBy } = req.query;

    const filters = {
      category,
      difficulty,
      search,
      isFeatured: isFeatured ? isFeatured === 'true' : undefined,
      createdBy,
      isPublic: true,
    };

    const result = await listProblemSets(filters, parseInt(page), parseInt(limit));
    return response(res, 200, true, 'Problem sets retrieved', result);
  } catch (error) {
    console.error('List problem sets error:', error);
    return response(res, 500, false, error.message);
  }
};

const addProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { problemId, section, points, isRequired, notes } = req.body;
    const userId = req.user.id;

    const result = await addProblemToSet(id, problemId, { section, points, isRequired, notes }, userId);
    return response(res, 201, true, 'Problem added to set', result);
  } catch (error) {
    console.error('Add problem to set error:', error);
    return response(res, 500, false, error.message);
  }
};

const removeProblem = async (req, res) => {
  try {
    const { id, problemId } = req.params;
    const userId = req.user.id;

    const result = await removeProblemFromSet(id, problemId, userId);
    if (!result) {
      return response(res, 404, false, 'Problem not found in set');
    }
    return response(res, 200, true, 'Problem removed from set');
  } catch (error) {
    console.error('Remove problem from set error:', error);
    return response(res, 500, false, error.message);
  }
};

const updateProblem = async (req, res) => {
  try {
    const { id, problemId } = req.params;
    const userId = req.user.id;

    const result = await updateProblemInSet(id, problemId, req.body, userId);
    return response(res, 200, true, 'Problem in set updated', result);
  } catch (error) {
    console.error('Update problem in set error:', error);
    return response(res, 500, false, error.message);
  }
};

const enroll = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const progress = await enrollInProblemSet(id, userId);
    return response(res, 200, true, 'Enrolled in problem set', progress);
  } catch (error) {
    console.error('Enroll in problem set error:', error);
    return response(res, 500, false, error.message);
  }
};

const rate = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const result = await rateProblemSet(id, userId, rating, comment);
    return response(res, 200, true, 'Rating submitted', result);
  } catch (error) {
    console.error('Rate problem set error:', error);
    return response(res, 500, false, error.message);
  }
};

const getRecommended = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const sets = await getRecommendedProblemSets(userId, parseInt(limit));
    return response(res, 200, true, 'Recommended problem sets retrieved', sets);
  } catch (error) {
    console.error('Get recommended problem sets error:', error);
    return response(res, 500, false, error.message);
  }
};

const getMyProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20 } = req.query;

    const progress = await getUserProgress(userId, { status, limit: parseInt(limit) });
    return response(res, 200, true, 'User progress retrieved', progress);
  } catch (error) {
    console.error('Get user progress error:', error);
    return response(res, 500, false, error.message);
  }
};

module.exports = {
  createSet,
  updateSet,
  deleteSet,
  getSetBySlug,
  listSets,
  addProblem,
  removeProblem,
  updateProblem,
  enroll,
  rate,
  getRecommended,
  getMyProgress,
};
