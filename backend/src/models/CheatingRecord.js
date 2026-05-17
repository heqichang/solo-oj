const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CheatingRecord = sequelize.define('CheatingRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
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
  submissionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'submissions',
      key: 'id',
    },
  },
  plagiarismMatchId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'plagiarism_matches',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('PLAGIARISM', 'COLLUSION', 'MULTIPLE_ACCOUNTS', 'IP_SHARING', 'OTHER'),
    allowNull: false,
    defaultValue: 'PLAGIARISM',
  },
  severity: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    allowNull: false,
    defaultValue: 'MEDIUM',
  },
  punishment: {
    type: DataTypes.ENUM('WARNING', 'SCORE_CANCELLATION', 'CONTEST_DISQUALIFICATION', 'TEMPORARY_BAN', 'PERMANENT_BAN'),
    allowNull: false,
    defaultValue: 'WARNING',
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  evidence: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  punishmentStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  punishmentEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  appealed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  appealComment: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  appealReviewed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  appealReviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  appealDecision: {
    type: DataTypes.ENUM('UPHELD', 'OVERTURNED', 'REDUCED'),
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  timestamps: true,
  tableName: 'cheating_records',
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['contestId'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['severity'],
    },
    {
      fields: ['isActive'],
    },
    {
      fields: ['createdAt'],
    },
  ],
});

module.exports = CheatingRecord;
