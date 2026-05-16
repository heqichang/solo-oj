const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContestSubmission = sequelize.define('ContestSubmission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  contestId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'contests',
      key: 'id',
    },
  },
  submissionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'submissions',
      key: 'id',
    },
  },
  contestProblemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'contest_problems',
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
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isFirstBlood: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  submissionTimeMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: false,
  tableName: 'contest_submissions',
  indexes: [
    {
      fields: ['contestId', 'userId'],
    },
    {
      fields: ['contestId', 'contestProblemId'],
    },
    {
      fields: ['submissionId'],
    },
    {
      fields: ['contestProblemId', 'isAccepted'],
    },
  ],
});

module.exports = ContestSubmission;
