const { Op } = require('sequelize');
const {
  Problem,
  Tag,
  Submission,
  User,
} = require('../models');
const { success, error, paginate } = require('../utils/response');
const { generateUniqueSlug } = require('../utils/slug');
const { PROBLEM_STATUS } = require('../config/constants');
const { getProblemStats } = require('../services/rankingService');
const fs = require('fs').promises;
const path = require('path');
const { PATHS } = require('../config/constants');

const listProblems = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, difficulty } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where = {};

    if (status) where.status = status;
    if (difficulty) where.difficulty = difficulty.toUpperCase();
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const include = [
      { model: Tag, as: 'tags', through: { attributes: [] } },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'nickname'],
      },
    ];

    const { count, rows } = await Problem.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
      distinct: true,
    });

    return paginate(res, rows, count, pageNum, limitNum);
  } catch (err) {
    console.error('Admin list problems error:', err);
    return error(res, 'Failed to fetch problems', 500);
  }
};

const getProblem = async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await Problem.findByPk(id, {
      include: [
        { model: Tag, as: 'tags', through: { attributes: [] } },
        { model: User, as: 'creator', attributes: ['id', 'username', 'nickname'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username', 'nickname'] },
      ],
    });

    if (!problem) {
      return error(res, 'Problem not found', 404);
    }

    const stats = await getProblemStats(id);

    return success(res, { problem: problem.toJSON(), stats });
  } catch (err) {
    console.error('Admin get problem error:', err);
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
      status = PROBLEM_STATUS.DRAFT,
      ioFormat = null,
    } = req.body;

    const user = req.user;

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
      status,
      createdBy: user.id,
      ioFormat,
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
    console.error('Admin create problem error:', err);
    return error(res, 'Failed to create problem', 500);
  }
};

const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const problem = await Problem.findByPk(id);
    if (!problem) {
      return error(res, 'Problem not found', 404);
    }

    if (!user.isAdmin && problem.createdBy !== user.id) {
      return error(res, 'Permission denied', 403);
    }

    const updates = {};
    const allowedFields = [
      'title', 'description', 'inputFormat', 'outputFormat',
      'examples', 'hints', 'difficulty', 'timeLimitMs', 'memoryLimitMB',
      'isPublic', 'status', 'ioFormat', 'reviewComment',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.title) {
      updates.slug = await generateUniqueSlug(Problem, req.body.title, id);
    }

    if (updates.difficulty) {
      updates.difficulty = updates.difficulty.toUpperCase();
    }

    await problem.update(updates);

    if (req.body.tags) {
      const tagInstances = [];
      for (const tagName of req.body.tags) {
        const [tag] = await Tag.findOrCreate({
          where: { name: tagName.toLowerCase() },
          defaults: { name: tagName.toLowerCase(), description: '' },
        });
        tagInstances.push(tag);
      }
      await problem.setTags(tagInstances);
    }

    const updatedProblem = await Problem.findByPk(id, {
      include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
    });

    return success(res, { problem: updatedProblem.toJSON() });
  } catch (err) {
    console.error('Admin update problem error:', err);
    return error(res, 'Failed to update problem', 500);
  }
};

const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const problem = await Problem.findByPk(id);
    if (!problem) {
      return error(res, 'Problem not found', 404);
    }

    if (!user.isAdmin) {
      return error(res, 'Admin access required', 403);
    }

    await problem.destroy();

    return success(res, { deleted: true });
  } catch (err) {
    console.error('Admin delete problem error:', err);
    return error(res, 'Failed to delete problem', 500);
  }
};

const submitForReview = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const problem = await Problem.findByPk(id);
    if (!problem) {
      return error(res, 'Problem not found', 404);
    }

    if (!user.isAdmin && problem.createdBy !== user.id) {
      return error(res, 'Permission denied', 403);
    }

    if (problem.status !== PROBLEM_STATUS.DRAFT && problem.status !== PROBLEM_STATUS.REJECTED) {
      return error(res, 'Problem is not in draft or rejected status', 400);
    }

    await problem.update({ status: PROBLEM_STATUS.PENDING_REVIEW });

    return success(res, { problem: problem.toJSON() });
  } catch (err) {
    console.error('Submit for review error:', err);
    return error(res, 'Failed to submit for review', 500);
  }
};

const reviewProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment = '' } = req.body;
    const user = req.user;

    if (!user.isAdmin) {
      return error(res, 'Admin access required', 403);
    }

    const problem = await Problem.findByPk(id);
    if (!problem) {
      return error(res, 'Problem not found', 404);
    }

    if (problem.status !== PROBLEM_STATUS.PENDING_REVIEW) {
      return error(res, 'Problem is not pending review', 400);
    }

    const newStatus = action === 'approve' ? PROBLEM_STATUS.PUBLISHED : PROBLEM_STATUS.REJECTED;

    await problem.update({
      status: newStatus,
      reviewedBy: user.id,
      reviewComment: comment,
      isPublic: action === 'approve',
    });

    return success(res, { problem: problem.toJSON(), action });
  } catch (err) {
    console.error('Review problem error:', err);
    return error(res, 'Failed to review problem', 500);
  }
};

const uploadTestCases = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const problem = await Problem.findByPk(id);
    if (!problem) {
      return error(res, 'Problem not found', 404);
    }

    if (!user.isAdmin && problem.createdBy !== user.id) {
      return error(res, 'Permission denied', 403);
    }

    const files = req.files || [];
    if (files.length === 0) {
      return error(res, 'No files uploaded', 400);
    }

    const inputDir = path.resolve(PATHS.testData, 'inputs', id);
    const outputDir = path.resolve(PATHS.testData, 'outputs', id);

    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    let testCaseCount = 0;

    for (const file of files) {
      const originalName = file.originalname;
      const match = originalName.match(/^(\d+)\.(in|out)$/);
      
      if (match) {
        const testNum = match[1];
        const ext = match[2];
        const targetDir = ext === 'in' ? inputDir : outputDir;
        const targetPath = path.join(targetDir, `${testNum}.${ext}`);
        
        await fs.rename(file.path, targetPath);
        if (ext === 'in') testCaseCount++;
      }
    }

    if (testCaseCount > 0) {
      await problem.update({ testCaseCount });
    }

    return success(res, {
      uploaded: files.length,
      testCaseCount,
      problemId: id,
    });
  } catch (err) {
    console.error('Upload test cases error:', err);
    return error(res, 'Failed to upload test cases', 500);
  }
};

const importProblems = async (req, res) => {
  try {
    const user = req.user;
    const { problems } = req.body;

    if (!problems || !Array.isArray(problems)) {
      return error(res, 'Invalid import data', 400);
    }

    const imported = [];
    const errors = [];

    for (let i = 0; i < problems.length; i++) {
      try {
        const p = problems[i];
        const slug = await generateUniqueSlug(Problem, p.title);

        const problem = await Problem.create({
          title: p.title,
          slug,
          description: p.description || '',
          inputFormat: p.inputFormat || '',
          outputFormat: p.outputFormat || '',
          examples: p.examples || [],
          hints: p.hints || [],
          difficulty: (p.difficulty || 'EASY').toUpperCase(),
          timeLimitMs: p.timeLimitMs || 1000,
          memoryLimitMB: p.memoryLimitMB || 128,
          status: p.status || PROBLEM_STATUS.DRAFT,
          createdBy: user.id,
          isPublic: p.isPublic !== undefined ? p.isPublic : false,
        });

        if (p.tags && Array.isArray(p.tags)) {
          const tagInstances = [];
          for (const tagName of p.tags) {
            const [tag] = await Tag.findOrCreate({
              where: { name: tagName.toLowerCase() },
              defaults: { name: tagName.toLowerCase(), description: '' },
            });
            tagInstances.push(tag);
          }
          await problem.setTags(tagInstances);
        }

        imported.push({ index: i, id: problem.id, title: problem.title });
      } catch (e) {
        errors.push({ index: i, error: e.message });
      }
    }

    return success(res, {
      imported: imported.length,
      failed: errors.length,
      importedProblems: imported,
      errors,
    });
  } catch (err) {
    console.error('Import problems error:', err);
    return error(res, 'Failed to import problems', 500);
  }
};

module.exports = {
  listProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
  submitForReview,
  reviewProblem,
  uploadTestCases,
  importProblems,
};
