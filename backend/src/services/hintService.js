const { Op } = require('sequelize');
const {
  ProblemHint,
  UserWeakTag,
  Problem,
  Tag,
  Submission,
  ProblemSet,
} = require('../models');
const { HINT_TYPE, WEAK_TAG_LEVEL } = require('../config/constants');

const createHint = async (problemId, hintData, userId) => {
  const problem = await Problem.findByPk(problemId);
  if (!problem) {
    throw new Error('Problem not found');
  }

  const hint = await ProblemHint.create({
    ...hintData,
    problemId,
    createdBy: userId,
  });

  return hint;
};

const updateHint = async (hintId, hintData, userId) => {
  const hint = await ProblemHint.findByPk(hintId);
  if (!hint) {
    throw new Error('Hint not found');
  }

  if (hint.createdBy !== userId) {
    throw new Error('Permission denied');
  }

  await hint.update(hintData);
  return hint;
};

const deleteHint = async (hintId, userId) => {
  const hint = await ProblemHint.findByPk(hintId);
  if (!hint) {
    throw new Error('Hint not found');
  }

  if (hint.createdBy !== userId) {
    throw new Error('Permission denied');
  }

  await hint.destroy();
  return true;
};

const getHintsForProblem = async (problemId, userId, userAttempts = 0) => {
  const hints = await ProblemHint.findAll({
    where: { problemId },
    order: [['level', 'ASC']],
  });

  return hints.map(hint => {
    const canAccess = hint.isFree || userAttempts >= hint.requiredAttempts;

    return {
      ...hint.toJSON(),
      canAccess,
      content: canAccess ? hint.content : null,
      locked: !canAccess,
    };
  });
};

const getAvailableHints = async (problemId, userId) => {
  let submissions = 0;
  if (userId) {
    submissions = await Submission.count({
      where: { userId, problemId },
    });
  }

  return await getHintsForProblem(problemId, userId, submissions);
};

const unlockHint = async (hintId, userId) => {
  const hint = await ProblemHint.findByPk(hintId);
  if (!hint) {
    throw new Error('Hint not found');
  }

  if (hint.isFree) {
    return { unlocked: true, hint };
  }

  const submissions = await Submission.count({
    where: { userId, problemId: hint.problemId },
  });

  if (submissions >= hint.requiredAttempts) {
    return { unlocked: true, hint };
  }

  return {
    unlocked: false,
    requiredAttempts: hint.requiredAttempts,
    currentAttempts: submissions,
  };
};

const analyzeUserWeakTags = async (userId) => {
  const submissions = await Submission.findAll({
    where: { userId },
    include: [
      {
        model: Problem,
        as: 'problem',
        include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: 100,
  });

  const tagStats = new Map();

  for (const submission of submissions) {
    if (!submission.problem?.tags) continue;

    for (const tag of submission.problem.tags) {
      if (!tagStats.has(tag.id)) {
        tagStats.set(tag.id, {
          tagId: tag.id,
          tagName: tag.name,
          totalAttempts: 0,
          correctAttempts: 0,
          timeSpent: 0,
        });
      }

      const stats = tagStats.get(tag.id);
      stats.totalAttempts++;

      if (submission.status === 'ACCEPTED') {
        stats.correctAttempts++;
      }

      if (submission.runtimeMs) {
        stats.timeSpent += submission.runtimeMs;
      }
    }
  }

  const results = [];

  for (const [tagId, stats] of tagStats) {
    const accuracy = stats.totalAttempts > 0
      ? stats.correctAttempts / stats.totalAttempts
      : 0;

    const averageTimeSpent = stats.totalAttempts > 0
      ? stats.timeSpent / stats.totalAttempts
      : 0;

    const weaknessScore = (1 - accuracy) * 100;

    let level = WEAK_TAG_LEVEL.MODERATE;
    if (accuracy >= 0.8) level = WEAK_TAG_LEVEL.STRONG;
    else if (accuracy >= 0.6) level = WEAK_TAG_LEVEL.MODERATE;
    else if (accuracy >= 0.4) level = WEAK_TAG_LEVEL.WEAK;
    else level = WEAK_TAG_LEVEL.VERY_WEAK;

    results.push({
      tagId,
      tagName: stats.tagName,
      totalAttempts: stats.totalAttempts,
      correctAttempts: stats.correctAttempts,
      accuracy,
      averageTimeSpent,
      weaknessScore,
      level,
    });
  }

  results.sort((a, b) => b.weaknessScore - a.weaknessScore);

  for (const result of results) {
    const recommended = await Problem.findAll({
      include: [
        {
          model: Tag,
          as: 'tags',
          where: { id: result.tagId },
          through: { attributes: [] },
        },
      ],
      where: { status: 'PUBLISHED' },
      limit: 5,
      order: [['acceptedCount', 'DESC']],
    });

    result.recommendations = recommended.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
    }));

    await UserWeakTag.upsert({
      userId,
      tagId: result.tagId,
      tagName: result.tagName,
      totalAttempts: result.totalAttempts,
      correctAttempts: result.correctAttempts,
      accuracy: result.accuracy,
      averageTimeSpent: result.averageTimeSpent,
      weaknessScore: result.weaknessScore,
      level: result.level,
      lastPracticed: new Date(),
      recommendations: result.recommendations,
    });
  }

  return results;
};

const getUserWeakTags = async (userId, limit = 20) => {
  const weakTags = await UserWeakTag.findAll({
    where: { userId },
    order: [['weaknessScore', 'DESC']],
    limit,
  });

  return weakTags;
};

const getRelatedProblems = async (problemId, limit = 10) => {
  const problem = await Problem.findByPk(problemId, {
    include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
  });

  if (!problem) {
    throw new Error('Problem not found');
  }

  const tagIds = problem.tags?.map(t => t.id) || [];

  if (tagIds.length === 0) {
    return [];
  }

  const related = await Problem.findAll({
    where: {
      id: { [Op.ne]: problemId },
      status: 'PUBLISHED',
    },
    include: [
      {
        model: Tag,
        as: 'tags',
        where: { id: { [Op.in]: tagIds } },
        through: { attributes: [] },
      },
    ],
    limit,
    order: [['acceptedCount', 'DESC']],
  });

  return related.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    acceptedCount: p.acceptedCount,
  }));
};

const getLearningPathRecommendations = async (userId) => {
  const weakTags = await analyzeUserWeakTags(userId);

  const problemSets = await ProblemSet.findAll({
    where: { isPublic: true },
    include: [
      { model: User, as: 'creator', attributes: ['id', 'username', 'nickname'] },
    ],
    limit: 10,
    order: [['averageRating', 'DESC']],
  });

  const userLevel = weakTags.length > 0
    ? weakTags.reduce((sum, t) => {
        const val = { STRONG: 3, MODERATE: 2, WEAK: 1, VERY_WEAK: 0 };
        return sum + (val[t.level] || 2);
      }, 0) / weakTags.length
    : 2;

  let recommendedLevel = 'BEGINNER';
  if (userLevel > 2.5) recommendedLevel = 'ADVANCED';
  else if (userLevel > 1.5) recommendedLevel = 'INTERMEDIATE';

  return {
    weakAreas: weakTags.slice(0, 5),
    strongAreas: weakTags.filter(t => t.level === 'STRONG').slice(0, 5),
    recommendedLevel,
    recommendedSets: problemSets.filter(s =>
      s.category === recommendedLevel || s.category === 'SPECIAL_TOPIC'
    ).slice(0, 5),
    nextTopics: weakTags
      .filter(t => t.level === 'WEAK' || t.level === 'VERY_WEAK')
      .slice(0, 5)
      .map(t => ({
        tagName: t.tagName,
        recommendations: t.recommendations?.slice(0, 3) || [],
      })),
  };
};

module.exports = {
  createHint,
  updateHint,
  deleteHint,
  getHintsForProblem,
  getAvailableHints,
  unlockHint,
  analyzeUserWeakTags,
  getUserWeakTags,
  getRelatedProblems,
  getLearningPathRecommendations,
};
