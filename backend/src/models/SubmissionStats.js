const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubmissionStats = sequelize.define('SubmissionStats', {
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
    unique: true,
  },
  easySolved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  mediumSolved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  hardSolved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  tagStats: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  submissionHeatmap: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  rankingHistory: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  timestamps: true,
  tableName: 'submission_stats',
  indexes: [
    {
      fields: ['userId'],
    },
  ],
});

module.exports = SubmissionStats;
