const { Op } = require('sequelize');
const { Problem, Tag, Submission, User } = require('../models');
const { generateUniqueSlug } = require('../utils/slug');
const { success, error, paginate } = require('../utils/response');

const { PROBLEM_STATUS } = require('../config/constants');

const listProblems = async (req, res) => {
  try {
    const { page = 1, limit = 10, difficulty, tag, search } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const where = { isPublic: true, status: PROBLEM_STATUS.PUBLISHED };
    
    if (difficulty) {
      where.difficulty = difficulty.toUpperCase();
    }
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    const include = [{ model: Tag, as: 'tags', through: { attributes: [] } }];
    
    if (tag) {
      include[0].where = { name: { [Op.iLike]: tag } };
    }
    
    const { count, rows } = await Problem.findAndCountAll({
      where,
      include,
      attributes: [
        'id', 'slug', 'title', 'difficulty', 'timeLimitMs', 'memoryLimitMB',
        'submissionsCount', 'acceptedCount', 'createdAt'
      ],
      order: [['createdAt', 'DESC']],
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
      distinct: true,
    });
    
    const problemsWithStats = rows.map((problem) => ({
      ...problem.toJSON(),
      acceptanceRate: problem.submissionsCount > 0
        ? Math.round((problem.acceptedCount / problem.submissionsCount) * 100)
        : 0,
    }));
    
    return paginate(res, problemsWithStats, count, pageNum, limitNum);
  } catch (err) {
    console.error('List problems error:', err);
    return error(res, 'Failed to fetch problems', 500);
  }
};

const getProblem = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const problem = await Problem.findOne({
      where: { slug, isPublic: true, status: PROBLEM_STATUS.PUBLISHED },
      include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
    });
    
    if (!problem) {
      return error(res, 'Problem not found', 404);
    }
    
    return success(res, { problem: problem.toJSON() });
  } catch (err) {
    console.error('Get problem error:', err);
    return error(res, 'Failed to fetch problem', 500);
  }
};

const createProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      inputFormat,
      outputFormat,
      examples = [],
      hints = [],
      difficulty = 'EASY',
      timeLimitMs = 1000,
      memoryLimitMB = 128,
      tags = [],
      isPublic = true,
    } = req.body;
    
    const slug = await generateUniqueSlug(Problem, title);
    
    const problem = await Problem.create({
      title,
      slug,
      description,
      inputFormat,
      outputFormat,
      examples,
      hints,
      difficulty: difficulty.toUpperCase(),
      timeLimitMs,
      memoryLimitMB,
      isPublic,
    });
    
    if (tags.length > 0) {
      const tagInstances = [];
      for (const tagName of tags) {
        const [tag] = await Tag.findOrCreate({
          where: { name: tagName.toLowerCase() },
          defaults: { name: tagName.toLowerCase(), description: '' },
        });
        tagInstances.push(tag);
      }
      await problem.setTags(tagInstances);
    }
    
    const problemWithTags = await Problem.findByPk(problem.id, {
      include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
    });
    
    return success(res, { problem: problemWithTags.toJSON() }, 201);
  } catch (err) {
    console.error('Create problem error:', err);
    return error(res, 'Failed to create problem', 400);
  }
};

const listTags = async (req, res) => {
  try {
    const tags = await Tag.findAll({
      attributes: ['id', 'name', 'description'],
      order: [['name', 'ASC']],
    });
    
    return success(res, { tags });
  } catch (err) {
    console.error('List tags error:', err);
    return error(res, 'Failed to fetch tags', 500);
  }
};

module.exports = {
  listProblems,
  getProblem,
  createProblem,
  listTags,
};
