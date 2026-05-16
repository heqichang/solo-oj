const { Op } = require('sequelize');
const {
  CodeFavorite,
  CodeNote,
  Submission,
  Problem,
  User,
} = require('../models');
const { success, error, paginate } = require('../utils/response');
const { JUDGE_STATUS, CONTEST_STATUS } = require('../config/constants');
const { Contest, ContestParticipant } = require('../models');

const canViewSubmission = async (submission, currentUser) => {
  if (!submission) return false;

  if (currentUser && (currentUser.isAdmin || currentUser.id === submission.userId)) {
    return true;
  }

  const problem = await Problem.findByPk(submission.problemId);
  if (problem && problem.isPublic) {
    if (currentUser) {
      const userAccepted = await Submission.findOne({
        where: {
          userId: currentUser.id,
          problemId: submission.problemId,
          status: JUDGE_STATUS.ACCEPTED,
        },
      });
      if (userAccepted) return true;
    }
  }

  const contestSubmission = await submission.getContestSubmission();
  if (contestSubmission) {
    const contest = await Contest.findByPk(contestSubmission.contestId);
    if (contest) {
      const now = new Date();
      if (now >= contest.endTime) {
        return true;
      }
    }
  }

  return false;
};

const listFavorites = async (req, res) => {
  try {
    const { page = 1, limit = 20, problemId } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const user = req.user;

    const where = { userId: user.id };
    if (problemId) where.problemId = problemId;

    const { count, rows } = await CodeFavorite.findAndCountAll({
      where,
      include: [
        {
          model: Submission,
          as: 'submission',
          include: [
            {
              model: Problem,
              as: 'problem',
              attributes: ['id', 'slug', 'title', 'difficulty'],
            },
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'nickname', 'avatar'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
    });

    return paginate(res, rows, count, pageNum, limitNum);
  } catch (err) {
    console.error('List favorites error:', err);
    return error(res, 'Failed to fetch favorites', 500);
  }
};

const addFavorite = async (req, res) => {
  try {
    const { submissionId, note = '' } = req.body;
    const user = req.user;

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return error(res, 'Submission not found', 404);
    }

    if (submission.status !== JUDGE_STATUS.ACCEPTED) {
      return error(res, 'Can only favorite accepted submissions', 400);
    }

    const canView = await canViewSubmission(submission, user);
    if (!canView) {
      return error(res, 'Permission denied', 403);
    }

    const [favorite, created] = await CodeFavorite.findOrCreate({
      where: { userId: user.id, submissionId },
      defaults: { userId: user.id, submissionId, note },
    });

    if (!created && note) {
      await favorite.update({ note });
    }

    return success(res, { favorite: favorite.toJSON(), created }, 201);
  } catch (err) {
    console.error('Add favorite error:', err);
    return error(res, 'Failed to add favorite', 500);
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const user = req.user;

    const favorite = await CodeFavorite.findOne({
      where: { userId: user.id, submissionId },
    });

    if (favorite) {
      await favorite.destroy();
    }

    return success(res, { removed: true });
  } catch (err) {
    console.error('Remove favorite error:', err);
    return error(res, 'Failed to remove favorite', 500);
  }
};

const listNotes = async (req, res) => {
  try {
    const { page = 1, limit = 20, problemId, submissionId } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const user = req.user;

    const where = { userId: user.id };
    if (problemId) where.problemId = problemId;
    if (submissionId) where.submissionId = submissionId;

    const { count, rows } = await CodeNote.findAndCountAll({
      where,
      include: [
        {
          model: Problem,
          as: 'problem',
          attributes: ['id', 'slug', 'title', 'difficulty'],
        },
        {
          model: Submission,
          as: 'submission',
          attributes: ['id', 'status', 'language', 'createdAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
    });

    return paginate(res, rows, count, pageNum, limitNum);
  } catch (err) {
    console.error('List notes error:', err);
    return error(res, 'Failed to fetch notes', 500);
  }
};

const createNote = async (req, res) => {
  try {
    const { submissionId, title = '', content, lineStart, lineEnd } = req.body;
    const user = req.user;

    if (!content) {
      return error(res, 'Content is required', 400);
    }

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return error(res, 'Submission not found', 404);
    }

    const canView = await canViewSubmission(submission, user);
    if (!canView) {
      return error(res, 'Permission denied', 403);
    }

    const note = await CodeNote.create({
      userId: user.id,
      submissionId,
      problemId: submission.problemId,
      title,
      content,
      lineStart,
      lineEnd,
    });

    return success(res, { note: note.toJSON() }, 201);
  } catch (err) {
    console.error('Create note error:', err);
    return error(res, 'Failed to create note', 500);
  }
};

const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, lineStart, lineEnd } = req.body;
    const user = req.user;

    const note = await CodeNote.findOne({ where: { id, userId: user.id } });
    if (!note) {
      return error(res, 'Note not found', 404);
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (lineStart !== undefined) updates.lineStart = lineStart;
    if (lineEnd !== undefined) updates.lineEnd = lineEnd;

    await note.update(updates);

    return success(res, { note: note.toJSON() });
  } catch (err) {
    console.error('Update note error:', err);
    return error(res, 'Failed to update note', 500);
  }
};

const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const note = await CodeNote.findOne({ where: { id, userId: user.id } });
    if (note) {
      await note.destroy();
    }

    return success(res, { deleted: true });
  } catch (err) {
    console.error('Delete note error:', err);
    return error(res, 'Failed to delete note', 500);
  }
};

const viewOtherSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const submission = await Submission.findByPk(id, {
      include: [
        {
          model: Problem,
          as: 'problem',
          attributes: ['id', 'slug', 'title', 'difficulty'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar'],
        },
      ],
    });

    if (!submission) {
      return error(res, 'Submission not found', 404);
    }

    const canView = await canViewSubmission(submission, user);
    if (!canView) {
      const safeSubmission = submission.toJSON();
      delete safeSubmission.code;
      return success(res, { submission: safeSubmission, canViewCode: false });
    }

    return success(res, { submission: submission.toJSON(), canViewCode: true });
  } catch (err) {
    console.error('View other submission error:', err);
    return error(res, 'Failed to fetch submission', 500);
  }
};

const listProblemSolutions = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { page = 1, limit = 20, language } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const user = req.user;

    const userAccepted = user ? await Submission.findOne({
      where: {
        userId: user.id,
        problemId,
        status: JUDGE_STATUS.ACCEPTED,
      },
    }) : null;

    if (!userAccepted) {
      return error(res, 'You must solve this problem first to view other solutions', 403);
    }

    const where = {
      problemId,
      status: JUDGE_STATUS.ACCEPTED,
    };

    if (language) where.language = language;

    const { count, rows } = await Submission.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar'],
        },
      ],
      order: [['runtimeMs', 'ASC'], ['memoryMB', 'ASC']],
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
    });

    return paginate(res, rows, count, pageNum, limitNum);
  } catch (err) {
    console.error('List problem solutions error:', err);
    return error(res, 'Failed to fetch solutions', 500);
  }
};

module.exports = {
  listFavorites,
  addFavorite,
  removeFavorite,
  listNotes,
  createNote,
  updateNote,
  deleteNote,
  viewOtherSubmission,
  listProblemSolutions,
};
