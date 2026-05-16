const { Op } = require('sequelize');
const { redis } = require('../config/redis');
const { CONTEST_RULES, CONTEST_STATUS, ACM_PENALTY, PROBLEM_STATUS } = require('../config/constants');
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

const getContestStatus = (contest) => {
  const now = new Date();
  if (now < contest.startTime) return CONTEST_STATUS.UPCOMING;
  if (now > contest.endTime) return CONTEST_STATUS.ENDED;
  return CONTEST_STATUS.RUNNING;
};

const isInFreezeTime = (contest) => {
  if (!contest.isFrozen || !contest.freezeTime) return false;
  const now = new Date();
  return now >= contest.freezeTime && now < contest.endTime;
};

const isProblemAccessible = (contest, userIsAdmin) => {
  const status = getContestStatus(contest);
  if (userIsAdmin) return true;
  if (status === CONTEST_STATUS.ENDED) return true;
  if (status === CONTEST_STATUS.RUNNING) return true;
  return false;
};

const getRankingKey = (contestId) => `contest:${contestId}:ranking`;

const getACMSortKey = (solvedCount, penalty) => {
  const solvedScore = solvedCount * 10000000;
  const maxPenalty = 999999;
  return solvedScore + (maxPenalty - Math.min(penalty, maxPenalty));
};

const updateContestantRankACM = async (contest, participant) => {
  const key = getRankingKey(contest.id);
  const score = getACMSortKey(participant.solvedCount, participant.penalty);
  await redis.zadd(key, score, participant.userId);
};

const updateContestantRankOI = async (contest, participant) => {
  const key = getRankingKey(contest.id);
  await redis.zadd(key, participant.totalScore, participant.userId);
};

const updateContestantRank = async (contest, participant) => {
  if (contest.ruleType === CONTEST_RULES.OI || contest.ruleType === CONTEST_RULES.IOI) {
    await updateContestantRankOI(contest, participant);
  } else {
    await updateContestantRankACM(contest, participant);
  }
};

const refreshContestRankings = async (contestId) => {
  const contest = await Contest.findByPk(contestId);
  if (!contest) return;

  const participants = await ContestParticipant.findAll({
    where: { contestId },
  });

  for (const p of participants) {
    await updateContestantRank(contest, p);
  }
};

const calculateParticipantStats = async (contest, userId) => {
  const contestProblems = await ContestProblem.findAll({
    where: { contestId: contest.id },
    order: [['index', 'ASC']],
  });

  const problemMap = {};
  contestProblems.forEach((cp) => {
    problemMap[cp.id] = cp;
  });

  const contestSubmissions = await ContestSubmission.findAll({
    where: { contestId: contest.id, userId },
    order: [['submittedAt', 'ASC']],
  });

  const problemStats = {};
  let totalSolved = 0;
  let totalScore = 0;
  let totalPenalty = 0;

  contestProblems.forEach((cp) => {
    problemStats[cp.id] = {
      id: cp.id,
      index: cp.index,
      problemId: cp.problemId,
      score: 0,
      maxScore: cp.score,
      solved: false,
      submissions: 0,
      wrongAttempts: 0,
      firstAcceptedAt: null,
      submissionTimeMinutes: 0,
    };
  });

  for (const cs of contestSubmissions) {
    const cp = problemMap[cs.contestProblemId];
    if (!cp) continue;

    const stat = problemStats[cp.id];
    stat.submissions++;

    if (contest.ruleType === CONTEST_RULES.ACM) {
      if (!stat.solved) {
        if (cs.isAccepted) {
          stat.solved = true;
          stat.score = 1;
          stat.firstAcceptedAt = cs.submittedAt;
          stat.submissionTimeMinutes = cs.submissionTimeMinutes;
          totalSolved++;
          totalPenalty += cs.submissionTimeMinutes + stat.wrongAttempts * ACM_PENALTY;
        } else {
          stat.wrongAttempts++;
        }
      }
    } else if (contest.ruleType === CONTEST_RULES.OI) {
      stat.score = Math.max(stat.score, cs.score);
    } else if (contest.ruleType === CONTEST_RULES.IOI) {
      stat.score = Math.max(stat.score, cs.score);
    }
  }

  if (contest.ruleType !== CONTEST_RULES.ACM) {
    totalScore = Object.values(problemStats).reduce((sum, s) => sum + s.score, 0);
  }

  return {
    problemStats,
    solvedCount: totalSolved,
    totalScore,
    penalty: totalPenalty,
  };
};

const processContestSubmission = async (contest, contestProblem, submission, isAccepted, score = 0) => {
  const user = await User.findByPk(submission.userId);
  if (!user) return;

  let participant = await ContestParticipant.findOne({
    where: { contestId: contest.id, userId: user.id },
  });

  if (!participant) {
    participant = await ContestParticipant.create({
      contestId: contest.id,
      userId: user.id,
      problemStats: {},
    });
  }

  const submissionTimeMs = new Date(submission.createdAt) - new Date(contest.startTime);
  const submissionTimeMinutes = Math.max(0, Math.floor(submissionTimeMs / 60000));

  const existingAccepted = await ContestSubmission.findOne({
    where: {
      contestId: contest.id,
      contestProblemId: contestProblem.id,
      userId: user.id,
      isAccepted: true,
    },
  });

  let isFirstBlood = false;
  if (isAccepted && !existingAccepted) {
    const firstBloodCount = await ContestSubmission.count({
      where: {
        contestProblemId: contestProblem.id,
        isAccepted: true,
      },
    });
    if (firstBloodCount === 0) {
      isFirstBlood = true;
    }
  }

  await ContestSubmission.create({
    contestId: contest.id,
    submissionId: submission.id,
    contestProblemId: contestProblem.id,
    userId: user.id,
    submittedAt: submission.createdAt,
    score,
    isAccepted,
    isFirstBlood,
    submissionTimeMinutes,
  });

  await contestProblem.increment('submissionsCount');
  if (isAccepted) {
    await contestProblem.increment('acceptedCount');
  }

  const stats = await calculateParticipantStats(contest, user.id);

  await participant.update({
    solvedCount: stats.solvedCount,
    totalScore: stats.totalScore,
    penalty: stats.penalty,
    problemStats: stats.problemStats,
  });

  await updateContestantRank(contest, participant);
};

const getContestLeaderboard = async (contest, page = 1, limit = 50, currentUserId = null) => {
  const key = getRankingKey(contest.id);
  const isFrozen = isInFreezeTime(contest);

  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const ranking = await redis.zrevrange(key, start, end, 'WITHSCORES');
  const total = await redis.zcard(key);

  const participants = [];

  for (let i = 0; i < ranking.length; i += 2) {
    const userId = ranking[i];
    const score = parseFloat(ranking[i + 1]);

    const participant = await ContestParticipant.findOne({
      where: { contestId: contest.id, userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar'],
        },
      ],
    });

    if (participant) {
      const isCurrentUser = currentUserId && currentUserId === userId;

      let problemStats = participant.problemStats;
      if (isFrozen && !isCurrentUser) {
        const frozenStats = {};
        Object.keys(problemStats).forEach((key) => {
          const stat = { ...problemStats[key] };
          if (contest.ruleType === CONTEST_RULES.ACM) {
            if (!stat.solved) {
              stat.score = null;
              stat.solved = null;
            }
          } else {
            stat.score = null;
          }
          stat.submissions = null;
          frozenStats[key] = stat;
        });
        problemStats = frozenStats;
      }

      participants.push({
        rank: start + (i / 2) + 1,
        user: participant.user,
        solvedCount: participant.solvedCount,
        totalScore: participant.totalScore,
        penalty: participant.penalty,
        problemStats,
        score,
      });
    }
  }

  return {
    participants,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
    },
    isFrozen,
    contestStatus: getContestStatus(contest),
  };
};

const unfreezeContest = async (contestId) => {
  const contest = await Contest.findByPk(contestId);
  if (!contest) return;

  await contest.update({ isFrozen: false });
  await refreshContestRankings(contestId);
};

module.exports = {
  getContestStatus,
  isInFreezeTime,
  isProblemAccessible,
  getRankingKey,
  updateContestantRank,
  refreshContestRankings,
  processContestSubmission,
  getContestLeaderboard,
  unfreezeContest,
  calculateParticipantStats,
};
