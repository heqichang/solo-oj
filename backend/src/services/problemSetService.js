const { Op } = require('sequelize');
const {
  ProblemSet,
  ProblemSetProblem,
  ProblemSetProgress,
  ProblemSetRating,
  Problem,
  Tag,
  User,
  Submission,
} = require('../models');
const { PROBLEM_SET_STATUS } = require('../config/constants');
const { generateSlug } = require('../utils/slug');

const createProblemSet = async (data, userId) => {
  const slug = await generateSlug(data.title, ProblemSet);

  const problemSet = await ProblemSet.create({
    ...data,
    slug,
    createdBy: userId,
    problemCount: 0,
  });

  return problemSet;
};

const updateProblemSet = async (id, data, userId) => {
  const problemSet = await ProblemSet.findByPk(id);
  if (!problemSet) {
    throw new Error('Problem set not found');
  }

  if (problemSet.createdBy !== userId) {
    throw new Error('Permission denied');
  }

  if (data.title && data.title !== problemSet.title) {
    data.slug = await generateSlug(data.title, ProblemSet);
  }

  await problemSet.update(data);
  return problemSet;
};

const deleteProblemSet = async (id, userId) => {
  const problemSet = await ProblemSet.findByPk(id);
  if (!problemSet) {
    throw new Error('Problem set not found');
  }

  if (problemSet.createdBy !== userId) {
    throw new Error('Permission denied');
  }

  await ProblemSetProblem.destroy({ where: { problemSetId: id } });
  await ProblemSetProgress.destroy({ where: { problemSetId: id } });
  await ProblemSetRating.destroy({ where: { problemSetId: id } });
  await problemSet.destroy();

  return true;
};

const getProblemSetBySlug = async (slug, userId) => {
  const problemSet = await ProblemSet.findOne({
    where: { slug },
    include: [
      { model: User, as: 'creator', attributes: ['id', 'username', 'nickname', 'avatar'] },
    ],
  });

  if (!problemSet) {
    throw new Error('Problem set not found');
  }

  if (!problemSet.isPublic && problemSet.createdBy !== userId) {
    throw new Error('Permission denied');
  }

  const problems = await ProblemSetProblem.findAll({
    where: { problemSetId: problemSet.id },
    include: [
      {
        model: Problem,
        as: 'problem',
        attributes: ['id', 'title', 'slug', 'difficulty', 'status'],
        include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
      },
    ],
    order: [['position', 'ASC']],
  });

  let progress = null;
  if (userId) {
    progress = await ProblemSetProgress.findOne({
      where: { problemSetId: problemSet.id, userId },
    });
  }

  return {
    ...problemSet.toJSON(),
    problems: problems.map(p => ({
      ...p.toJSON(),
      problem: p.problem,
    })),
    progress,
  };
};

const listProblemSets = async (filters = {}, page = 1, limit = 20) => {
  const where = {};

  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }
  if (filters.isPublic !== undefined) {
    where.isPublic = filters.isPublic;
  }
  if (filters.isFeatured !== undefined) {
    where.isFeatured = filters.isFeatured;
  }
  if (filters.createdBy) {
    where.createdBy = filters.createdBy;
  }
  if (filters.search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${filters.search}%` } },
      { description: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  const { count, rows } = await ProblemSet.findAndCountAll({
    where,
    include: [
      { model: User, as: 'creator', attributes: ['id', 'username', 'nickname', 'avatar'] },
    ],
    order: [
      ['isFeatured', 'DESC'],
      ['averageRating', 'DESC'],
      ['totalEnrolled', 'DESC'],
    ],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    problemSets: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
};

const addProblemToSet = async (problemSetId, problemId, data = {}, userId) => {
  const problemSet = await ProblemSet.findByPk(problemSetId);
  if (!problemSet) {
    throw new Error('Problem set not found');
  }

  if (problemSet.createdBy !== userId) {
    throw new Error('Permission denied');
  }

  const problem = await Problem.findByPk(problemId);
  if (!problem) {
    throw new Error('Problem not found');
  }

  const existing = await ProblemSetProblem.findOne({
    where: { problemSetId, problemId },
  });

  if (existing) {
    throw new Error('Problem already in set');
  }

  const maxPosition = await ProblemSetProblem.max('position', {
    where: { problemSetId },
  });

  const problemSetProblem = await ProblemSetProblem.create({
    problemSetId,
    problemId,
    position: (maxPosition || 0) + 1,
    section: data.section,
    points: data.points || 100,
    isRequired: data.isRequired !== false,
    notes: data.notes,
  });

  await problemSet.increment('problemCount');

  return problemSetProblem;
};

const removeProblemFromSet = async (problemSetId, problemId, userId) => {
  const problemSet = await ProblemSet.findByPk(problemSetId);
  if (!problemSet) {
    throw new Error('Problem set not found');
  }

  if (problemSet.createdBy !== userId) {
    throw new Error('Permission denied');
  }

  const result = await ProblemSetProblem.destroy({
    where: { problemSetId, problemId },
  });

  if (result > 0) {
    await problemSet.decrement('problemCount');
  }

  return result > 0;
};

const updateProblemInSet = async (problemSetId, problemId, data, userId) => {
  const problemSet = await ProblemSet.findByPk(problemSetId);
  if (!problemSet) {
    throw new Error('Problem set not found');
  }

  if (problemSet.createdBy !== userId) {
    throw new Error('Permission denied');
  }

  const problemSetProblem = await ProblemSetProblem.findOne({
    where: { problemSetId, problemId },
  });

  if (!problemSetProblem) {
    throw new Error('Problem not found in set');
  }

  await problemSetProblem.update(data);
  return problemSetProblem;
};

const enrollInProblemSet = async (problemSetId, userId) => {
  const problemSet = await ProblemSet.findByPk(problemSetId);
  if (!problemSet) {
    throw new Error('Problem set not found');
  }

  const [progress, created] = await ProblemSetProgress.findOrCreate({
    where: { problemSetId, userId },
    defaults: {
      status: PROBLEM_SET_STATUS.IN_PROGRESS,
      totalProblems: problemSet.problemCount,
      solvedProblems: 0,
      startedAt: new Date(),
      lastActivityAt: new Date(),
    },
  });

  if (created) {
    await problemSet.increment('totalEnrolled');
  }

  return progress;
};

const updateProgress = async (problemSetId, userId, problemId, solved) => {
  const progress = await ProblemSetProgress.findOne({
    where: { problemSetId, userId },
  });

  if (!progress) {
    throw new Error('Progress not found');
  }

  const problemStatuses = progress.problemStatuses || {};
  const previousStatus = problemStatuses[problemId];

  problemStatuses[problemId] = solved ? 'SOLVED' : 'ATTEMPTED';

  const setProblems = await ProblemSetProblem.findAll({
    where: { problemSetId },
    include: [{ model: Problem, as: 'problem' }],
  });

  let solvedCount = 0;
  let attemptedCount = 0;
  let earnedPoints = 0;
  let totalPoints = 0;

  for (const sp of setProblems) {
    const status = problemStatuses[sp.problemId];
    totalPoints += sp.points;
    if (status === 'SOLVED') {
      solvedCount++;
      earnedPoints += sp.points;
    }
    if (status) {
      attemptedCount++;
    }
  }

  let status = progress.status;
  if (solvedCount === setProblems.length && setProblems.length > 0) {
    status = PROBLEM_SET_STATUS.COMPLETED;
    const problemSet = await ProblemSet.findByPk(problemSetId);
    if (problemSet && progress.status !== PROBLEM_SET_STATUS.COMPLETED) {
      await problemSet.increment('totalCompleted');
    }
  } else if (attemptedCount > 0) {
    status = PROBLEM_SET_STATUS.IN_PROGRESS;
  }

  await progress.update({
    problemStatuses,
    solvedProblems: solvedCount,
    attemptedProblems: attemptedCount,
    progressPercentage: setProblems.length > 0 ? (solvedCount / setProblems.length) * 100 : 0,
    earnedPoints,
    totalPoints,
    lastProblemId: problemId,
    lastActivityAt: new Date(),
    status,
    completedAt: status === PROBLEM_SET_STATUS.COMPLETED ? new Date() : null,
  });

  return progress;
};

const rateProblemSet = async (problemSetId, userId, rating, comment) => {
  const problemSet = await ProblemSet.findByPk(problemSetId);
  if (!problemSet) {
    throw new Error('Problem set not found');
  }

  const [ratingRecord, created] = await ProblemSetRating.findOrCreate({
    where: { problemSetId, userId },
    defaults: { rating, comment },
  });

  if (!created) {
    await ratingRecord.update({ rating, comment });
  }

  const allRatings = await ProblemSetRating.findAll({
    where: { problemSetId },
  });

  const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

  await problemSet.update({
    averageRating,
    ratingCount: allRatings.length,
  });

  return ratingRecord;
};

const getRecommendedProblemSets = async (userId, limit = 10) => {
  const userSubmissions = await Submission.findAll({
    where: { userId },
    include: [{ model: Problem, as: 'problem', include: [{ model: Tag, as: 'tags' }] }],
    group: ['problem.id'],
  });

  const solvedTags = new Set();
  const difficulties = [];

  for (const sub of userSubmissions) {
    if (sub.problem?.tags) {
      for (const tag of sub.problem.tags) {
        solvedTags.add(tag.name);
      }
    }
    if (sub.problem?.difficulty) {
      difficulties.push(sub.problem.difficulty);
    }
  }

  const avgDifficulty = difficulties.length > 0
    ? difficulties.reduce((a, b) => {
        const val = { EASY: 1, MEDIUM: 2, HARD: 3 };
        return a + (val[b] || 2);
      }, 0) / difficulties.length
    : 2;

  const difficultyFilter = avgDifficulty < 1.5 ? 'EASY' : avgDifficulty < 2.5 ? 'MEDIUM' : 'HARD';

  const sets = await ProblemSet.findAll({
    where: {
      isPublic: true,
      [Op.or]: [
        { difficulty: difficultyFilter },
        { difficulty: 'MIXED' },
      ],
    },
    include: [
      { model: User, as: 'creator', attributes: ['id', 'username', 'nickname'] },
    ],
    order: [
      ['averageRating', 'DESC'],
      ['totalEnrolled', 'DESC'],
    ],
    limit,
  });

  return sets;
};

const getUserProgress = async (userId, filters = {}) => {
  const where = { userId };

  if (filters.status) {
    where.status = filters.status;
  }

  const progress = await ProblemSetProgress.findAll({
    where,
    include: [
      {
        model: ProblemSet,
        as: 'problemSet',
        attributes: ['id', 'title', 'slug', 'description', 'category', 'difficulty', 'isPublic'],
        include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'nickname'] }],
      },
    ],
    order: [['lastActivityAt', 'DESC']],
    limit: filters.limit || 20,
  });

  return progress;
};

module.exports = {
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
};
