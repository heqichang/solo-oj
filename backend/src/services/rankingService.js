const { Op } = require('sequelize');
const { redis } = require('../config/redis');
const {
  User,
  Submission,
  Problem,
  Tag,
  SubmissionStats,
  ProblemTags,
} = require('../models');
const { JUDGE_STATUS } = require('../config/constants');

const GLOBAL_RANKING_KEY = 'ranking:global';

const getGlobalRankingScore = (user, stats) => {
  const solvedScore = (user.solvedCount || 0) * 1000000;
  const submissionScore = Math.min((user.submissionsCount || 0) / 1000, 999999);
  return solvedScore + (999999 - submissionScore);
};

const updateGlobalRanking = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return;

  const score = getGlobalRankingScore(user);
  await redis.zadd(GLOBAL_RANKING_KEY, score, userId);
};

const getUserRank = async (userId) => {
  const rank = await redis.zrevrank(GLOBAL_RANKING_KEY, userId);
  return rank !== null ? rank + 1 : null;
};

const getGlobalLeaderboard = async (page = 1, limit = 50) => {
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const ranking = await redis.zrevrange(GLOBAL_RANKING_KEY, start, end, 'WITHSCORES');
  const total = await redis.zcard(GLOBAL_RANKING_KEY);

  const users = [];

  for (let i = 0; i < ranking.length; i += 2) {
    const userId = ranking[i];
    const score = parseFloat(ranking[i + 1]);

    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'nickname', 'avatar', 'solvedCount', 'submissionsCount'],
      include: [{ model: SubmissionStats, as: 'stats' }],
    });

    if (user) {
      users.push({
        rank: start + (i / 2) + 1,
        user: user.toJSON(),
        score,
      });
    }
  }

  return {
    users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
    },
  };
};

const refreshGlobalRanking = async () => {
  await redis.del(GLOBAL_RANKING_KEY);

  const users = await User.findAll({
    attributes: ['id', 'solvedCount', 'submissionsCount'],
  });

  for (const user of users) {
    const score = getGlobalRankingScore(user);
    await redis.zadd(GLOBAL_RANKING_KEY, score, user.id);
  }
};

const getProblemStats = async (problemId) => {
  const problem = await Problem.findByPk(problemId);
  if (!problem) return null;

  const submissions = await Submission.findAll({
    where: { problemId },
    attributes: ['id', 'userId', 'status', 'createdAt'],
  });

  const userAttempts = {};
  submissions.forEach((s) => {
    if (!userAttempts[s.userId]) {
      userAttempts[s.userId] = { accepted: false, attempts: 0 };
    }
    userAttempts[s.userId].attempts++;
    if (s.status === JUDGE_STATUS.ACCEPTED) {
      userAttempts[s.userId].accepted = true;
    }
  });

  const acceptedUsers = Object.values(userAttempts).filter((u) => u.accepted).length;
  const totalAttempts = submissions.length;
  const uniqueUsers = Object.keys(userAttempts).length;

  let avgAttempts = 0;
  if (acceptedUsers > 0) {
    const totalAcceptedAttempts = Object.values(userAttempts)
      .filter((u) => u.accepted)
      .reduce((sum, u) => sum + u.attempts, 0);
    avgAttempts = totalAcceptedAttempts / acceptedUsers;
  }

  return {
    problemId,
    submissionsCount: totalAttempts,
    acceptedCount: problem.acceptedCount || 0,
    uniqueUsers,
    acceptedUsers,
    averageAttempts: Math.round(avgAttempts * 100) / 100,
    acceptanceRate: totalAttempts > 0
      ? Math.round((problem.acceptedCount / totalAttempts) * 100)
      : 0,
  };
};

const getUserStats = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: SubmissionStats, as: 'stats' }],
  });

  if (!user) return null;

  const submissions = await Submission.findAll({
    where: { userId, status: JUDGE_STATUS.ACCEPTED },
    include: [
      {
        model: Problem,
        as: 'problem',
        attributes: ['id', 'difficulty'],
        include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
      },
    ],
  });

  const stats = {
    easy: 0,
    medium: 0,
    hard: 0,
    tags: {},
    totalSolved: submissions.length,
  };

  const solvedProblemIds = new Set();

  for (const sub of submissions) {
    if (solvedProblemIds.has(sub.problem.id)) continue;
    solvedProblemIds.add(sub.problem.id);

    const diff = sub.problem.difficulty.toLowerCase();
    if (diff === 'easy') stats.easy++;
    else if (diff === 'medium') stats.medium++;
    else if (diff === 'hard') stats.hard++;

    for (const tag of sub.problem.tags) {
      stats.tags[tag.name] = (stats.tags[tag.name] || 0) + 1;
    }
  }

  const heatmap = await generateSubmissionHeatmap(userId);

  return {
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      solvedCount: user.solvedCount,
      submissionsCount: user.submissionsCount,
    },
    difficultyStats: {
      easy: stats.easy,
      medium: stats.medium,
      hard: stats.hard,
    },
    tagStats: stats.tags,
    totalSolved: stats.totalSolved,
    heatmap,
  };
};

const generateSubmissionHeatmap = async (userId) => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const submissions = await Submission.findAll({
    where: {
      userId,
      createdAt: { [Op.gte]: oneYearAgo },
    },
    attributes: ['id', 'createdAt'],
    order: [['createdAt', 'ASC']],
  });

  const heatmap = {};

  submissions.forEach((sub) => {
    const date = sub.createdAt.toISOString().split('T')[0];
    heatmap[date] = (heatmap[date] || 0) + 1;
  });

  return heatmap;
};

const recordSubmissionInStats = async (userId, submission, isNewSolve = false) => {
  let stats = await SubmissionStats.findOne({ where: { userId } });

  if (!stats) {
    stats = await SubmissionStats.create({
      userId,
      tagStats: {},
      submissionHeatmap: {},
      rankingHistory: [],
    });
  }

  const date = submission.createdAt.toISOString().split('T')[0];
  const heatmap = { ...stats.submissionHeatmap };
  heatmap[date] = (heatmap[date] || 0) + 1;

  let tagStats = { ...stats.tagStats };

  if (isNewSolve && submission.status === JUDGE_STATUS.ACCEPTED) {
    const problem = await Problem.findByPk(submission.problemId, {
      include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
    });

    if (problem) {
      const diffStats = {
        easySolved: stats.easySolved,
        mediumSolved: stats.mediumSolved,
        hardSolved: stats.hardSolved,
      };

      const diff = problem.difficulty.toLowerCase();
      if (diff === 'easy') diffStats.easySolved++;
      else if (diff === 'medium') diffStats.mediumSolved++;
      else if (diff === 'hard') diffStats.hardSolved++;

      for (const tag of problem.tags) {
        tagStats[tag.name] = (tagStats[tag.name] || 0) + 1;
      }

      await stats.update({
        ...diffStats,
        tagStats,
        submissionHeatmap: heatmap,
      });
    }
  } else {
    await stats.update({
      submissionHeatmap: heatmap,
    });
  }

  await updateGlobalRanking(userId);
};

module.exports = {
  updateGlobalRanking,
  getUserRank,
  getGlobalLeaderboard,
  refreshGlobalRanking,
  getProblemStats,
  getUserStats,
  generateSubmissionHeatmap,
  recordSubmissionInStats,
  GLOBAL_RANKING_KEY,
};
