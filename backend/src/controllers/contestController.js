const { Op } = require('sequelize');
const {
  Contest,
  ContestProblem,
  ContestParticipant,
  ContestSubmission,
  Problem,
  Tag,
  User,
  Submission,
} = require('../models');
const { success, error, paginate } = require('../utils/response');
const { generateUniqueSlug } = require('../utils/slug');
const { CONTEST_STATUS, CONTEST_RULES, PROBLEM_STATUS, JUDGE_STATUS } = require('../config/constants');
const {
  getContestStatus,
  isInFreezeTime,
  isProblemAccessible,
  processContestSubmission,
  getContestLeaderboard,
  unfreezeContest,
  refreshContestRankings,
  getRankingKey,
} = require('../services/contestService');
const { judgeQueue, redis } = require('../config/redis');

const listContests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const now = new Date();

    const where = {};

    if (status) {
      if (status === CONTEST_STATUS.UPCOMING) {
        where.startTime = { [Op.gt]: now };
      } else if (status === CONTEST_STATUS.RUNNING) {
        where.startTime = { [Op.lte]: now };
        where.endTime = { [Op.gt]: now };
      } else if (status === CONTEST_STATUS.ENDED) {
        where.endTime = { [Op.lte]: now };
      }
    }

    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    const include = [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'nickname', 'avatar'],
      },
    ];

    const { count, rows } = await Contest.findAndCountAll({
      where,
      include,
      order: [['startTime', 'DESC']],
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
    });

    const contestsWithStatus = rows.map((contest) => ({
      ...contest.toJSON(),
      status: getContestStatus(contest),
    }));

    return paginate(res, contestsWithStatus, count, pageNum, limitNum);
  } catch (err) {
    console.error('List contests error:', err);
    return error(res, 'Failed to fetch contests', 500);
  }
};

const getContest = async (req, res) => {
  try {
    const { slug } = req.params;
    const user = req.user;

    const contest = await Contest.findOne({
      where: { slug },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nickname', 'avatar'],
        },
      ],
    });

    if (!contest) {
      return error(res, 'Contest not found', 404);
    }

    const isAdmin = user && user.isAdmin;
    const isCreator = user && user.id === contest.createdBy;
    const status = getContestStatus(contest);

    let isParticipant = false;
    if (user) {
      const participant = await ContestParticipant.findOne({
        where: { contestId: contest.id, userId: user.id },
      });
      isParticipant = !!participant;
    }

    const contestProblems = await ContestProblem.findAll({
      where: { contestId: contest.id },
      include: [
        {
          model: Problem,
          as: 'problem',
          attributes: [
            'id', 'slug', 'title', 'difficulty',
            'timeLimitMs', 'memoryLimitMB', 'submissionsCount', 'acceptedCount',
          ],
        },
      ],
      order: [['index', 'ASC']],
    });

    const accessible = isProblemAccessible(contest, isAdmin || isCreator);

    let problems = contestProblems.map((cp) => ({
      id: cp.id,
      index: cp.index,
      score: cp.score,
      submissionsCount: cp.submissionsCount,
      acceptedCount: cp.acceptedCount,
      problem: accessible ? cp.problem : {
        id: cp.problem.id,
        slug: cp.problem.slug,
        title: '???',
        difficulty: cp.problem.difficulty,
      },
    }));

    const contestData = {
      ...contest.toJSON(),
      status,
      isFrozen: isInFreezeTime(contest),
      isParticipant,
      isAdmin: isAdmin || isCreator,
      problems,
    };

    return success(res, { contest: contestData });
  } catch (err) {
    console.error('Get contest error:', err);
    return error(res, 'Failed to fetch contest', 500);
  }
};

const createContest = async (req, res) => {
  try {
    const {
      title,
      description = '',
      ruleType = CONTEST_RULES.ACM,
      startTime,
      endTime,
      freezeTime,
      isFrozen = false,
      isPublic = true,
      problemIds = [],
    } = req.body;

    const user = req.user;

    if (!startTime || !endTime) {
      return error(res, 'Start time and end time are required', 400);
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return error(res, 'End time must be after start time', 400);
    }

    if (freezeTime && (new Date(freezeTime) <= new Date(startTime) || new Date(freezeTime) >= new Date(endTime))) {
      return error(res, 'Freeze time must be between start and end time', 400);
    }

    const slug = await generateUniqueSlug(Contest, title);

    const contest = await Contest.create({
      title,
      slug,
      description,
      ruleType,
      startTime,
      endTime,
      freezeTime,
      isFrozen,
      isPublic,
      createdBy: user.id,
    });

    if (problemIds && problemIds.length > 0) {
      const indexLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < problemIds.length; i++) {
        const problemId = problemIds[i];
        const problem = await Problem.findByPk(problemId);

        if (problem) {
          await ContestProblem.create({
            contestId: contest.id,
            problemId: problem.id,
            index: indexLetters[i] || `P${i + 1}`,
            score: 100,
          });
        }
      }
    }

    const contestWithCreator = await Contest.findByPk(contest.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nickname', 'avatar'],
        },
      ],
    });

    return success(res, { contest: contestWithCreator.toJSON() }, 201);
  } catch (err) {
    console.error('Create contest error:', err);
    return error(res, 'Failed to create contest', 500);
  }
};

const updateContest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const contest = await Contest.findByPk(id);
    if (!contest) {
      return error(res, 'Contest not found', 404);
    }

    if (!user.isAdmin && user.id !== contest.createdBy) {
      return error(res, 'Permission denied', 403);
    }

    const updates = {};
    const allowedFields = ['title', 'description', 'startTime', 'endTime', 'freezeTime', 'isFrozen', 'isPublic', 'ruleType'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.title) {
      updates.slug = await generateUniqueSlug(Contest, req.body.title);
    }

    await contest.update(updates);

    const updatedContest = await Contest.findByPk(contest.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nickname', 'avatar'],
        },
      ],
    });

    return success(res, { contest: updatedContest.toJSON() });
  } catch (err) {
    console.error('Update contest error:', err);
    return error(res, 'Failed to update contest', 500);
  }
};

const addContestProblems = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { problemIds, scores = {} } = req.body;
    const user = req.user;

    const contest = await Contest.findByPk(contestId);
    if (!contest) {
      return error(res, 'Contest not found', 404);
    }

    if (!user.isAdmin && user.id !== contest.createdBy) {
      return error(res, 'Permission denied', 403);
    }

    const existingProblems = await ContestProblem.findAll({
      where: { contestId },
      order: [['index', 'ASC']],
    });

    const indexLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let nextIndex = existingProblems.length;

    const added = [];

    for (const problemId of problemIds) {
      const existing = existingProblems.find((p) => p.problemId === problemId);
      if (existing) continue;

      const problem = await Problem.findByPk(problemId);
      if (!problem) continue;

      const index = indexLetters[nextIndex] || `P${nextIndex + 1}`;
      const score = scores[problemId] || 100;

      const cp = await ContestProblem.create({
        contestId,
        problemId,
        index,
        score,
      });

      added.push(cp);
      nextIndex++;
    }

    return success(res, { added: added.length, problems: added });
  } catch (err) {
    console.error('Add contest problems error:', err);
    return error(res, 'Failed to add problems', 500);
  }
};

const removeContestProblem = async (req, res) => {
  try {
    const { contestId, problemId } = req.params;
    const user = req.user;

    const contest = await Contest.findByPk(contestId);
    if (!contest) {
      return error(res, 'Contest not found', 404);
    }

    if (!user.isAdmin && user.id !== contest.createdBy) {
      return error(res, 'Permission denied', 403);
    }

    const contestProblem = await ContestProblem.findOne({
      where: { contestId, problemId },
    });

    if (contestProblem) {
      await contestProblem.destroy();
    }

    return success(res, { removed: true });
  } catch (err) {
    console.error('Remove contest problem error:', err);
    return error(res, 'Failed to remove problem', 500);
  }
};

const registerForContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    const user = req.user;

    const contest = await Contest.findByPk(contestId);
    if (!contest) {
      return error(res, 'Contest not found', 404);
    }

    const status = getContestStatus(contest);
    if (status === CONTEST_STATUS.ENDED) {
      return error(res, 'Contest has ended', 400);
    }

    const existing = await ContestParticipant.findOne({
      where: { contestId, userId: user.id },
    });

    if (existing) {
      return success(res, { participant: existing.toJSON(), registered: true });
    }

    const participant = await ContestParticipant.create({
      contestId,
      userId: user.id,
      problemStats: {},
    });

    await contest.increment('participantCount');

    return success(res, { participant: participant.toJSON(), registered: true }, 201);
  } catch (err) {
    console.error('Register for contest error:', err);
    return error(res, 'Failed to register for contest', 500);
  }
};

const getContestProblem = async (req, res) => {
  try {
    const { contestId, index } = req.params;
    const user = req.user;

    const contest = await Contest.findByPk(contestId);
    if (!contest) {
      return error(res, 'Contest not found', 404);
    }

    const isAdmin = user && user.isAdmin;
    const isCreator = user && user.id === contest.createdBy;
    const accessible = isProblemAccessible(contest, isAdmin || isCreator);

    if (!accessible) {
      return error(res, 'Problem not accessible yet', 403);
    }

    const contestProblem = await ContestProblem.findOne({
      where: { contestId, index: index.toUpperCase() },
      include: [
        {
          model: Problem,
          as: 'problem',
          include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
        },
      ],
    });

    if (!contestProblem) {
      return error(res, 'Problem not found', 404);
    }

    const problemData = contestProblem.problem.toJSON();
    problemData.contestIndex = contestProblem.index;
    problemData.contestScore = contestProblem.score;

    return success(res, { problem: problemData });
  } catch (err) {
    console.error('Get contest problem error:', err);
    return error(res, 'Failed to fetch problem', 500);
  }
};

const submitContestCode = async (req, res) => {
  try {
    const { contestId, index } = req.params;
    const { code, language } = req.body;
    const user = req.user;

    const contest = await Contest.findByPk(contestId);
    if (!contest) {
      return error(res, 'Contest not found', 404);
    }

    const status = getContestStatus(contest);
    if (status !== CONTEST_STATUS.RUNNING) {
      return error(res, 'Contest is not running', 400);
    }

    const participant = await ContestParticipant.findOne({
      where: { contestId, userId: user.id },
    });

    if (!participant) {
      return error(res, 'You are not registered for this contest', 400);
    }

    const contestProblem = await ContestProblem.findOne({
      where: { contestId, index: index.toUpperCase() },
      include: [{ model: Problem, as: 'problem' }],
    });

    if (!contestProblem) {
      return error(res, 'Problem not found', 404);
    }

    const problem = contestProblem.problem;

    const submission = await Submission.create({
      code,
      language,
      userId: user.id,
      problemId: problem.id,
      status: JUDGE_STATUS.PENDING,
      totalTestCases: problem.testCaseCount,
    });

    await problem.increment('submissionsCount');
    await user.increment('submissionsCount');

    await judgeQueue.add(
      {
        submissionId: submission.id,
        problemId: problem.id,
        language,
        code,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMB: problem.memoryLimitMB,
        contestId,
        contestProblemId: contestProblem.id,
      },
      { priority: 1 }
    );

    return success(res, { submission: submission.toJSON() }, 201);
  } catch (err) {
    console.error('Submit contest code error:', err);
    return error(res, 'Failed to submit code', 500);
  }
};

const getContestLeaderboardRoute = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const user = req.user;

    const contest = await Contest.findByPk(contestId);
    if (!contest) {
      return error(res, 'Contest not found', 404);
    }

    const leaderboard = await getContestLeaderboard(
      contest,
      parseInt(page),
      parseInt(limit),
      user ? user.id : null
    );

    return success(res, leaderboard);
  } catch (err) {
    console.error('Get contest leaderboard error:', err);
    return error(res, 'Failed to fetch leaderboard', 500);
  }
};

const unfreezeContestRoute = async (req, res) => {
  try {
    const { contestId } = req.params;
    const user = req.user;

    const contest = await Contest.findByPk(contestId);
    if (!contest) {
      return error(res, 'Contest not found', 404);
    }

    if (!user.isAdmin && user.id !== contest.createdBy) {
      return error(res, 'Permission denied', 403);
    }

    await unfreezeContest(contestId);

    return success(res, { unfrozen: true });
  } catch (err) {
    console.error('Unfreeze contest error:', err);
    return error(res, 'Failed to unfreeze contest', 500);
  }
};

const getMyContestSubmissions = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { problemIndex } = req.query;
    const user = req.user;

    const contest = await Contest.findByPk(contestId);
    if (!contest) {
      return error(res, 'Contest not found', 404);
    }

    let contestProblemId = null;
    if (problemIndex) {
      const cp = await ContestProblem.findOne({
        where: { contestId, index: problemIndex.toUpperCase() },
      });
      if (cp) contestProblemId = cp.id;
    }

    const contestSubmissionWhere = { contestId, userId: user.id };
    if (contestProblemId) contestSubmissionWhere.contestProblemId = contestProblemId;

    const contestSubmissions = await Submission.findAll({
      include: [
        {
          model: ContestSubmission,
          as: 'contestSubmission',
          where: contestSubmissionWhere,
          required: true,
          include: [
            {
              model: ContestProblem,
              as: 'contestProblem',
              attributes: ['id', 'index', 'score'],
            },
          ],
        },
        { model: Problem, as: 'problem', attributes: ['id', 'slug', 'title'] },
      ],
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    return success(res, { submissions: contestSubmissions });
  } catch (err) {
    console.error('Get my contest submissions error:', err);
    return error(res, 'Failed to fetch submissions', 500);
  }
};

module.exports = {
  listContests,
  getContest,
  createContest,
  updateContest,
  addContestProblems,
  removeContestProblem,
  registerForContest,
  getContestProblem,
  submitContestCode,
  getContestLeaderboardRoute,
  unfreezeContestRoute,
  getMyContestSubmissions,
};
