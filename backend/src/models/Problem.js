const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { PROBLEM_STATUS } = require('../config/constants');

const Problem = sequelize.define('Problem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  inputFormat: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  outputFormat: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  examples: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  hints: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
  },
  difficulty: {
    type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD'),
    allowNull: false,
    defaultValue: 'EASY',
  },
  timeLimitMs: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1000,
  },
  memoryLimitMB: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 128,
  },
  testCaseCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  submissionsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  acceptedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  averageAttempts: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  status: {
    type: DataTypes.ENUM(
      PROBLEM_STATUS.DRAFT,
      PROBLEM_STATUS.PENDING_REVIEW,
      PROBLEM_STATUS.PUBLISHED,
      PROBLEM_STATUS.REJECTED
    ),
    allowNull: false,
    defaultValue: PROBLEM_STATUS.DRAFT,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  reviewComment: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  ioFormat: {
    type: DataTypes.JSONB,
    defaultValue: null,
  },
  judgeType: {
    type: DataTypes.ENUM('STANDARD', 'SPECIAL_JUDGE', 'INTERACTIVE', 'OUTPUT_ONLY'),
    allowNull: false,
    defaultValue: 'STANDARD',
  },
  specialJudgeCode: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  specialJudgeLanguage: {
    type: DataTypes.STRING(50),
    defaultValue: null,
  },
  specialJudgeTimeout: {
    type: DataTypes.INTEGER,
    defaultValue: 10000,
  },
  subtasks: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  partialScoring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  interactionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  outputOnlyFileSizeLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 10000000,
  },
}, {
  timestamps: true,
  tableName: 'problems',
  indexes: [
    {
      fields: ['status'],
    },
    {
      fields: ['createdBy'],
    },
    {
      fields: ['difficulty'],
    },
  ],
});

module.exports = Problem;
