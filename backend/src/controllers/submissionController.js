const { Op } = require('sequelize');
const { Submission, Problem, User } = require('../models');
const { judgeQueue } = require('../config/redis');
const { success, error, paginate } = require('../utils/response');

const submitCode = async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    const user = req.user;
    
    const problem = await Problem.findByPk(problemId);
    
    if (!problem || !problem.isPublic) {
      return error(res, 'Problem not found', 404);
    }
    
    const submission = await Submission.create({
      code,
      language,
      userId: user.id,
      problemId: problem.id,
      status: 'PENDING',
      totalTestCases: problem.testCaseCount,
    });
    
    await problem.increment('submissionsCount');
    await user.increment('submissionsCount');
    
    await judgeQueue.add({
      submissionId: submission.id,
      problemId: problem.id,
      language,
      code,
      timeLimitMs: problem.timeLimitMs,
      memoryLimitMB: problem.memoryLimitMB,
    });
    
    return success(res, { submission: submission.toJSON() }, 201);
  } catch (err) {
    console.error('Submit code error:', err);
    return error(res, 'Failed to submit code', 500);
  }
};

const getSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await Submission.findByPk(id, {
      include: [
        { model: Problem, as: 'problem', attributes: ['id', 'slug', 'title', 'difficulty'] },
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
    });
    
    if (!submission) {
      return error(res, 'Submission not found', 404);
    }
    
    const isOwner = req.user && req.user.id === submission.userId;
    const isAdmin = req.user && req.user.isAdmin;
    
    if (!isOwner && !isAdmin) {
      const safeSubmission = submission.toJSON();
      delete safeSubmission.code;
      return success(res, { submission: safeSubmission });
    }
    
    return success(res, { submission: submission.toJSON() });
  } catch (err) {
    console.error('Get submission error:', err);
    return error(res, 'Failed to fetch submission', 500);
  }
};

const listSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 20, problemId, userId, status, language } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const where = {};
    
    if (problemId) where.problemId = problemId;
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (language) where.language = language;
    
    const { count, rows } = await Submission.findAndCountAll({
      where,
      include: [
        { model: Problem, as: 'problem', attributes: ['id', 'slug', 'title'] },
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname'] },
      ],
      attributes: { exclude: ['code'] },
      order: [['createdAt', 'DESC']],
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
    });
    
    return paginate(res, rows, count, pageNum, limitNum);
  } catch (err) {
    console.error('List submissions error:', err);
    return error(res, 'Failed to fetch submissions', 500);
  }
};

const listMySubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 20, problemId, status, language } = req.query;
    const user = req.user;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const where = { userId: user.id };
    
    if (problemId) where.problemId = problemId;
    if (status) where.status = status;
    if (language) where.language = language;
    
    const { count, rows } = await Submission.findAndCountAll({
      where,
      include: [
        { model: Problem, as: 'problem', attributes: ['id', 'slug', 'title', 'difficulty'] },
      ],
      order: [['createdAt', 'DESC']],
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
    });
    
    return paginate(res, rows, count, pageNum, limitNum);
  } catch (err) {
    console.error('List my submissions error:', err);
    return error(res, 'Failed to fetch submissions', 500);
  }
};

module.exports = {
  submitCode,
  getSubmission,
  listSubmissions,
  listMySubmissions,
};
