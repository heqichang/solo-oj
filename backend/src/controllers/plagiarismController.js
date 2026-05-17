const { response } = require('../utils/response');
const {
  createPlagiarismReport,
  getReportById,
  getMatchById,
  reviewMatch: reviewMatchService,
  detectSuspiciousActivity,
} = require('../services/plagiarismService');
const { PlagiarismReport, PlagiarismMatch, CheatingRecord } = require('../models');
const { plagiarismQueue } = require('../config/redis');

const createReport = async (req, res) => {
  try {
    const { problemId, contestId, type, algorithm, threshold } = req.body;
    const userId = req.user.id;

    const report = await createPlagiarismReport({
      problemId,
      contestId,
      type,
      algorithm,
      threshold,
      generatedBy: userId,
    });

    await plagiarismQueue.add({ reportId: report.id });

    return response(res, 201, true, 'Plagiarism report created', report);
  } catch (error) {
    console.error('Create plagiarism report error:', error);
    return response(res, 500, false, error.message);
  }
};

const listReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, problemId, contestId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (problemId) where.problemId = problemId;
    if (contestId) where.contestId = contestId;

    const { count, rows } = await PlagiarismReport.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return response(res, 200, true, 'Reports retrieved', {
      reports: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
    });
  } catch (error) {
    console.error('List reports error:', error);
    return response(res, 500, false, error.message);
  }
};

const getReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await getReportById(id);

    if (!report) {
      return response(res, 404, false, 'Report not found');
    }

    return response(res, 200, true, 'Report retrieved', report);
  } catch (error) {
    console.error('Get report error:', error);
    return response(res, 500, false, error.message);
  }
};

const getMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const match = await getMatchById(id);

    if (!match) {
      return response(res, 404, false, 'Match not found');
    }

    return response(res, 200, true, 'Match retrieved', match);
  } catch (error) {
    console.error('Get match error:', error);
    return response(res, 500, false, error.message);
  }
};

const listMatches = async (req, res) => {
  try {
    const { reportId, page = 1, limit = 50, status, minSimilarity } = req.query;

    const where = {};
    if (reportId) where.reportId = reportId;
    if (status) where.status = status;
    if (minSimilarity) where.similarityScore = { [require('sequelize').Op.gte]: parseFloat(minSimilarity) };

    const { count, rows } = await PlagiarismMatch.findAndCountAll({
      where,
      order: [['similarityScore', 'DESC']],
      include: [
        { model: require('../models').User, as: 'user1', attributes: ['id', 'username', 'nickname'] },
        { model: require('../models').User, as: 'user2', attributes: ['id', 'username', 'nickname'] },
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return response(res, 200, true, 'Matches retrieved', {
      matches: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
    });
  } catch (error) {
    console.error('List matches error:', error);
    return response(res, 500, false, error.message);
  }
};

const reviewMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewComment } = req.body;
    const userId = req.user.id;

    const match = await reviewMatchService(id, status, reviewComment, userId);

    return response(res, 200, true, 'Match reviewed', match);
  } catch (error) {
    console.error('Review match error:', error);
    return response(res, 500, false, error.message);
  }
};

const createCheatingRecord = async (req, res) => {
  try {
    const { userId, contestId, submissionId, plagiarismMatchId, type, severity, punishment, description, evidence } = req.body;
    const createdBy = req.user.id;

    const record = await CheatingRecord.create({
      userId,
      contestId,
      submissionId,
      plagiarismMatchId,
      type,
      severity,
      punishment,
      description,
      evidence,
      createdBy,
      punishmentStartDate: new Date(),
    });

    return response(res, 201, true, 'Cheating record created', record);
  } catch (error) {
    console.error('Create cheating record error:', error);
    return response(res, 500, false, error.message);
  }
};

const listCheatingRecords = async (req, res) => {
  try {
    const { userId, contestId, type, severity, page = 1, limit = 20 } = req.query;

    const where = {};
    if (userId) where.userId = userId;
    if (contestId) where.contestId = contestId;
    if (type) where.type = type;
    if (severity) where.severity = severity;

    const { count, rows } = await CheatingRecord.findAndCountAll({
      where,
      include: [
        { model: require('../models').User, as: 'user', attributes: ['id', 'username', 'nickname'] },
        { model: require('../models').User, as: 'creator', attributes: ['id', 'username', 'nickname'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return response(res, 200, true, 'Cheating records retrieved', {
      records: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
    });
  } catch (error) {
    console.error('List cheating records error:', error);
    return response(res, 500, false, error.message);
  }
};

const checkSuspiciousActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const activity = await detectSuspiciousActivity(userId);

    return response(res, 200, true, 'Suspicious activity checked', activity);
  } catch (error) {
    console.error('Check suspicious activity error:', error);
    return response(res, 500, false, error.message);
  }
};

const appealCheatingRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { appealComment } = req.body;

    const record = await CheatingRecord.findByPk(id);
    if (!record) {
      return response(res, 404, false, 'Record not found');
    }

    if (record.userId !== req.user.id) {
      return response(res, 403, false, 'Permission denied');
    }

    await record.update({
      appealed: true,
      appealComment,
    });

    return response(res, 200, true, 'Appeal submitted', record);
  } catch (error) {
    console.error('Appeal cheating record error:', error);
    return response(res, 500, false, error.message);
  }
};

const reviewAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { appealDecision } = req.body;
    const userId = req.user.id;

    const record = await CheatingRecord.findByPk(id);
    if (!record) {
      return response(res, 404, false, 'Record not found');
    }

    if (appealDecision === 'OVERTURNED') {
      await record.update({
        isActive: false,
        appealReviewed: true,
        appealReviewedBy: userId,
        appealDecision,
      });
    } else {
      await record.update({
        appealReviewed: true,
        appealReviewedBy: userId,
        appealDecision,
      });
    }

    return response(res, 200, true, 'Appeal reviewed', record);
  } catch (error) {
    console.error('Review appeal error:', error);
    return response(res, 500, false, error.message);
  }
};

module.exports = {
  createReport,
  listReports,
  getReport,
  getMatch,
  listMatches,
  reviewMatch,
  createCheatingRecord,
  listCheatingRecords,
  checkSuspiciousActivity,
  appealCheatingRecord,
  reviewAppeal,
};
