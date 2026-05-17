const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProblemSetProgress = sequelize.define('ProblemSetProgress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  problemSetId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'problem_sets',
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'),
    allowNull: false,
    defaultValue: 'NOT_STARTED',
  },
  totalProblems: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  solvedProblems: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  attemptedProblems: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  progressPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  earnedPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  problemStatuses: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  lastProblemId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'problems',
      key: 'id',
    },
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  totalTimeSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  tableName: 'problem_set_progress',
  indexes: [
    {
      unique: true,
      fields: ['problemSetId', 'userId'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['lastActivityAt'],
    },
  ],
});

module.exports = ProblemSetProgress;
