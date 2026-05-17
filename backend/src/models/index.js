const { sequelize } = require('../config/database');
const User = require('./User');
const Problem = require('./Problem');
const Tag = require('./Tag');
const Submission = require('./Submission');
const Contest = require('./Contest');
const ContestProblem = require('./ContestProblem');
const ContestParticipant = require('./ContestParticipant');
const ContestSubmission = require('./ContestSubmission');
const DiscussionPost = require('./DiscussionPost');
const DiscussionReply = require('./DiscussionReply');
const Like = require('./Like');
const CodeFavorite = require('./CodeFavorite');
const CodeNote = require('./CodeNote');
const SubmissionStats = require('./SubmissionStats');
const PlagiarismReport = require('./PlagiarismReport');
const PlagiarismMatch = require('./PlagiarismMatch');
const CheatingRecord = require('./CheatingRecord');
const JudgeNode = require('./JudgeNode');
const ProblemSet = require('./ProblemSet');
const ProblemSetProblem = require('./ProblemSetProblem');
const ProblemSetProgress = require('./ProblemSetProgress');
const ProblemSetRating = require('./ProblemSetRating');
const ProblemHint = require('./ProblemHint');
const UserWeakTag = require('./UserWeakTag');
const SubmissionIpRecord = require('./SubmissionIpRecord');

const ProblemTags = sequelize.define('ProblemTags', {
  problemId: {
    type: require('sequelize').DataTypes.UUID,
    references: { model: 'problems', key: 'id' },
    field: 'problem_id',
  },
  tagId: {
    type: require('sequelize').DataTypes.UUID,
    references: { model: 'tags', key: 'id' },
    field: 'tag_id',
  },
}, { 
  tableName: 'problem_tags',
  timestamps: false,
});

Problem.belongsToMany(Tag, { 
  through: ProblemTags, 
  as: 'tags',
  foreignKey: 'problemId',
  otherKey: 'tagId',
});
Tag.belongsToMany(Problem, { 
  through: ProblemTags,
  foreignKey: 'tagId',
  otherKey: 'problemId',
});

Submission.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Submission.belongsTo(Problem, { as: 'problem', foreignKey: 'problemId' });

User.hasMany(Submission, { as: 'submissions', foreignKey: 'userId' });
Problem.hasMany(Submission, { as: 'submissions', foreignKey: 'problemId' });

Contest.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(Contest, { as: 'createdContests', foreignKey: 'createdBy' });

ContestProblem.belongsTo(Contest, { as: 'contest', foreignKey: 'contestId' });
ContestProblem.belongsTo(Problem, { as: 'problem', foreignKey: 'problemId' });
Contest.hasMany(ContestProblem, { as: 'contestProblems', foreignKey: 'contestId' });
Problem.hasMany(ContestProblem, { as: 'contestProblems', foreignKey: 'problemId' });

ContestParticipant.belongsTo(Contest, { as: 'contest', foreignKey: 'contestId' });
ContestParticipant.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Contest.hasMany(ContestParticipant, { as: 'participants', foreignKey: 'contestId' });
User.hasMany(ContestParticipant, { as: 'contestParticipations', foreignKey: 'userId' });

ContestSubmission.belongsTo(Contest, { as: 'contest', foreignKey: 'contestId' });
ContestSubmission.belongsTo(Submission, { as: 'submission', foreignKey: 'submissionId' });
ContestSubmission.belongsTo(ContestProblem, { as: 'contestProblem', foreignKey: 'contestProblemId' });
ContestSubmission.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Contest.hasMany(ContestSubmission, { as: 'contestSubmissions', foreignKey: 'contestId' });
Submission.hasOne(ContestSubmission, { as: 'contestSubmission', foreignKey: 'submissionId' });
ContestProblem.hasMany(ContestSubmission, { as: 'contestSubmissions', foreignKey: 'contestProblemId' });
User.hasMany(ContestSubmission, { as: 'contestSubmissions', foreignKey: 'userId' });

DiscussionPost.belongsTo(Problem, { as: 'problem', foreignKey: 'problemId' });
DiscussionPost.belongsTo(Contest, { as: 'contest', foreignKey: 'contestId' });
DiscussionPost.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Problem.hasMany(DiscussionPost, { as: 'discussionPosts', foreignKey: 'problemId' });
Contest.hasMany(DiscussionPost, { as: 'discussionPosts', foreignKey: 'contestId' });
User.hasMany(DiscussionPost, { as: 'discussionPosts', foreignKey: 'userId' });

DiscussionReply.belongsTo(DiscussionPost, { as: 'post', foreignKey: 'postId' });
DiscussionReply.belongsTo(User, { as: 'user', foreignKey: 'userId' });
DiscussionReply.belongsTo(DiscussionReply, { as: 'parent', foreignKey: 'parentId' });
DiscussionPost.hasMany(DiscussionReply, { as: 'replies', foreignKey: 'postId' });
User.hasMany(DiscussionReply, { as: 'discussionReplies', foreignKey: 'userId' });
DiscussionReply.hasMany(DiscussionReply, { as: 'children', foreignKey: 'parentId' });

CodeFavorite.belongsTo(User, { as: 'user', foreignKey: 'userId' });
CodeFavorite.belongsTo(Submission, { as: 'submission', foreignKey: 'submissionId' });
User.hasMany(CodeFavorite, { as: 'codeFavorites', foreignKey: 'userId' });
Submission.hasMany(CodeFavorite, { as: 'favorites', foreignKey: 'submissionId' });

CodeNote.belongsTo(User, { as: 'user', foreignKey: 'userId' });
CodeNote.belongsTo(Submission, { as: 'submission', foreignKey: 'submissionId' });
CodeNote.belongsTo(Problem, { as: 'problem', foreignKey: 'problemId' });
User.hasMany(CodeNote, { as: 'codeNotes', foreignKey: 'userId' });
Submission.hasMany(CodeNote, { as: 'notes', foreignKey: 'submissionId' });
Problem.hasMany(CodeNote, { as: 'codeNotes', foreignKey: 'problemId' });

SubmissionStats.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasOne(SubmissionStats, { as: 'stats', foreignKey: 'userId' });

Problem.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Problem.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewedBy' });
User.hasMany(Problem, { as: 'createdProblems', foreignKey: 'createdBy' });
User.hasMany(Problem, { as: 'reviewedProblems', foreignKey: 'reviewedBy' });

PlagiarismReport.belongsTo(Problem, { as: 'problem', foreignKey: 'problemId' });
PlagiarismReport.belongsTo(Contest, { as: 'contest', foreignKey: 'contestId' });
PlagiarismReport.belongsTo(User, { as: 'generator', foreignKey: 'generatedBy' });
PlagiarismReport.hasMany(PlagiarismMatch, { as: 'matches', foreignKey: 'reportId' });
Problem.hasMany(PlagiarismReport, { as: 'plagiarismReports', foreignKey: 'problemId' });
Contest.hasMany(PlagiarismReport, { as: 'plagiarismReports', foreignKey: 'contestId' });
User.hasMany(PlagiarismReport, { as: 'generatedPlagiarismReports', foreignKey: 'generatedBy' });

PlagiarismMatch.belongsTo(PlagiarismReport, { as: 'report', foreignKey: 'reportId' });
PlagiarismMatch.belongsTo(Submission, { as: 'submission1', foreignKey: 'submissionId1' });
PlagiarismMatch.belongsTo(Submission, { as: 'submission2', foreignKey: 'submissionId2' });
PlagiarismMatch.belongsTo(User, { as: 'user1', foreignKey: 'userId1' });
PlagiarismMatch.belongsTo(User, { as: 'user2', foreignKey: 'userId2' });
PlagiarismMatch.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewedBy' });
Submission.hasMany(PlagiarismMatch, { as: 'plagiarismMatches1', foreignKey: 'submissionId1' });
Submission.hasMany(PlagiarismMatch, { as: 'plagiarismMatches2', foreignKey: 'submissionId2' });

CheatingRecord.belongsTo(User, { as: 'user', foreignKey: 'userId' });
CheatingRecord.belongsTo(Contest, { as: 'contest', foreignKey: 'contestId' });
CheatingRecord.belongsTo(Submission, { as: 'submission', foreignKey: 'submissionId' });
CheatingRecord.belongsTo(PlagiarismMatch, { as: 'plagiarismMatch', foreignKey: 'plagiarismMatchId' });
CheatingRecord.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
CheatingRecord.belongsTo(User, { as: 'appealReviewer', foreignKey: 'appealReviewedBy' });
User.hasMany(CheatingRecord, { as: 'cheatingRecords', foreignKey: 'userId' });
User.hasMany(CheatingRecord, { as: 'createdCheatingRecords', foreignKey: 'createdBy' });

Submission.belongsTo(JudgeNode, { as: 'judgeNode', foreignKey: 'judgeNodeId' });
JudgeNode.hasMany(Submission, { as: 'submissions', foreignKey: 'judgeNodeId' });

ProblemSet.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(ProblemSet, { as: 'createdProblemSets', foreignKey: 'createdBy' });

ProblemSetProblem.belongsTo(ProblemSet, { as: 'problemSet', foreignKey: 'problemSetId' });
ProblemSetProblem.belongsTo(Problem, { as: 'problem', foreignKey: 'problemId' });
ProblemSet.hasMany(ProblemSetProblem, { as: 'problemSetProblems', foreignKey: 'problemSetId' });
Problem.hasMany(ProblemSetProblem, { as: 'problemSetProblems', foreignKey: 'problemId' });

ProblemSetProgress.belongsTo(ProblemSet, { as: 'problemSet', foreignKey: 'problemSetId' });
ProblemSetProgress.belongsTo(User, { as: 'user', foreignKey: 'userId' });
ProblemSetProgress.belongsTo(Problem, { as: 'lastProblem', foreignKey: 'lastProblemId' });
ProblemSet.hasMany(ProblemSetProgress, { as: 'progresses', foreignKey: 'problemSetId' });
User.hasMany(ProblemSetProgress, { as: 'problemSetProgresses', foreignKey: 'userId' });

ProblemSetRating.belongsTo(ProblemSet, { as: 'problemSet', foreignKey: 'problemSetId' });
ProblemSetRating.belongsTo(User, { as: 'user', foreignKey: 'userId' });
ProblemSet.hasMany(ProblemSetRating, { as: 'ratings', foreignKey: 'problemSetId' });
User.hasMany(ProblemSetRating, { as: 'problemSetRatings', foreignKey: 'userId' });

ProblemHint.belongsTo(Problem, { as: 'problem', foreignKey: 'problemId' });
ProblemHint.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Problem.hasMany(ProblemHint, { as: 'problemHints', foreignKey: 'problemId' });
User.hasMany(ProblemHint, { as: 'createdHints', foreignKey: 'createdBy' });

UserWeakTag.belongsTo(User, { as: 'user', foreignKey: 'userId' });
UserWeakTag.belongsTo(Tag, { as: 'tag', foreignKey: 'tagId' });
User.hasMany(UserWeakTag, { as: 'weakTags', foreignKey: 'userId' });
Tag.hasMany(UserWeakTag, { as: 'userWeakTags', foreignKey: 'tagId' });

SubmissionIpRecord.belongsTo(Submission, { as: 'submission', foreignKey: 'submissionId' });
SubmissionIpRecord.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Submission.hasMany(SubmissionIpRecord, { as: 'ipRecords', foreignKey: 'submissionId' });
User.hasMany(SubmissionIpRecord, { as: 'submissionIpRecords', foreignKey: 'userId' });

module.exports = {
  User,
  Problem,
  Tag,
  Submission,
  ProblemTags,
  Contest,
  ContestProblem,
  ContestParticipant,
  ContestSubmission,
  DiscussionPost,
  DiscussionReply,
  Like,
  CodeFavorite,
  CodeNote,
  SubmissionStats,
  PlagiarismReport,
  PlagiarismMatch,
  CheatingRecord,
  JudgeNode,
  ProblemSet,
  ProblemSetProblem,
  ProblemSetProgress,
  ProblemSetRating,
  ProblemHint,
  UserWeakTag,
  SubmissionIpRecord,
  sequelize,
};
