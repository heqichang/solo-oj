const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  language: {
    type: DataTypes.ENUM('cpp', 'c', 'java', 'python', 'javascript'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      'PENDING',
      'RUNNING',
      'ACCEPTED',
      'WRONG_ANSWER',
      'TIME_LIMIT_EXCEEDED',
      'MEMORY_LIMIT_EXCEEDED',
      'RUNTIME_ERROR',
      'COMPILATION_ERROR',
      'SYSTEM_ERROR'
    ),
    defaultValue: 'PENDING',
  },
  runtimeMs: {
    type: DataTypes.INTEGER,
    defaultValue: null,
  },
  memoryMB: {
    type: DataTypes.FLOAT,
    defaultValue: null,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  testResults: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  passedTestCases: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalTestCases: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  tableName: 'submissions',
  indexes: [
    {
      fields: ['userId', 'problemId'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['createdAt'],
    },
  ],
});

module.exports = Submission;
