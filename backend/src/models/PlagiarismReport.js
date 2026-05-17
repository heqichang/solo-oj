const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlagiarismReport = sequelize.define('PlagiarismReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  problemId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'problems',
      key: 'id',
    },
  },
  contestId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'contests',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('PROBLEM', 'CONTEST', 'MANUAL'),
    allowNull: false,
    defaultValue: 'PROBLEM',
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  totalSubmissions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  suspiciousPairs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  algorithm: {
    type: DataTypes.ENUM('TOKEN_SIMILARITY', 'AST_SIMILARITY', 'MOSS', 'SIMIAN'),
    allowNull: false,
    defaultValue: 'TOKEN_SIMILARITY',
  },
  threshold: {
    type: DataTypes.FLOAT,
    defaultValue: 0.8,
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  generatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  timestamps: true,
  tableName: 'plagiarism_reports',
  indexes: [
    {
      fields: ['problemId'],
    },
    {
      fields: ['contestId'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['createdAt'],
    },
  ],
});

module.exports = PlagiarismReport;
