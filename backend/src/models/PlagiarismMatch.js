const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlagiarismMatch = sequelize.define('PlagiarismMatch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  reportId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'plagiarism_reports',
      key: 'id',
    },
  },
  submissionId1: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'submissions',
      key: 'id',
    },
  },
  submissionId2: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'submissions',
      key: 'id',
    },
  },
  userId1: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  userId2: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  similarityScore: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  tokenSimilarity: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  structureSimilarity: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  variableSimilarity: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  matchedLines1: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  matchedLines2: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  highlightedCode1: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  highlightedCode2: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  status: {
    type: DataTypes.ENUM('PENDING_REVIEW', 'REVIEWED', 'CONFIRMED_CHEATING', 'FALSE_POSITIVE'),
    allowNull: false,
    defaultValue: 'PENDING_REVIEW',
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reviewComment: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
}, {
  timestamps: true,
  tableName: 'plagiarism_matches',
  indexes: [
    {
      fields: ['reportId'],
    },
    {
      fields: ['submissionId1'],
    },
    {
      fields: ['submissionId2'],
    },
    {
      fields: ['userId1'],
    },
    {
      fields: ['userId2'],
    },
    {
      fields: ['similarityScore'],
    },
    {
      fields: ['status'],
    },
  ],
});

module.exports = PlagiarismMatch;
