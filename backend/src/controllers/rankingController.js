const {
  getGlobalLeaderboard,
  refreshGlobalRanking,
  getUserStats,
  getProblemStats,
  getUserRank,
} = require('../services/rankingService');
const { success, error } = require('../utils/response');
const { User, Problem } = require('../models');

const getLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const leaderboard = await getGlobalLeaderboard(
      parseInt(page),
      parseInt(limit)
    );

    return success(res, leaderboard);
  } catch (err) {
    console.error('Get leaderboard error:', err);
    return error(res, 'Failed to fetch leaderboard', 500);
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'nickname', 'avatar', 'bio', 'solvedCount', 'submissionsCount', 'createdAt'],
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    const stats = await getUserStats(userId);
    const rank = await getUserRank(userId);

    return success(res, {
      user: user.toJSON(),
      stats,
      rank,
    });
  } catch (err) {
    console.error('Get user profile error:', err);
    return error(res, 'Failed to fetch user profile', 500);
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = req.user;
    const stats = await getUserStats(user.id);
    const rank = await getUserRank(user.id);

    const userData = user.toJSON();
    delete userData.password;

    return success(res, {
      user: userData,
      stats,
      rank,
    });
  } catch (err) {
    console.error('Get my profile error:', err);
    return error(res, 'Failed to fetch profile', 500);
  }
};

const getProblemStatistics = async (req, res) => {
  try {
    const { problemId } = req.params;

    const problem = await Problem.findByPk(problemId);
    if (!problem) {
      return error(res, 'Problem not found', 404);
    }

    const stats = await getProblemStats(problemId);
    return success(res, { problem: problem.toJSON(), stats });
  } catch (err) {
    console.error('Get problem statistics error:', err);
    return error(res, 'Failed to fetch problem statistics', 500);
  }
};

const refreshLeaderboard = async (req, res) => {
  try {
    const user = req.user;

    if (!user.isAdmin) {
      return error(res, 'Admin access required', 403);
    }

    await refreshGlobalRanking();

    return success(res, { refreshed: true });
  } catch (err) {
    console.error('Refresh leaderboard error:', err);
    return error(res, 'Failed to refresh leaderboard', 500);
  }
};

module.exports = {
  getLeaderboard,
  getUserProfile,
  getMyProfile,
  getProblemStatistics,
  refreshLeaderboard,
};
