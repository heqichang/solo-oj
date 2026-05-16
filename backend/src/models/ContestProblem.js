const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContestProblem = sequelize.define('ContestProblem', {
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
  problemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'problems',
      key: 'id',
    },
  },
  index: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
  submissionsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  acceptedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  tableName: 'contest_problems',
  indexes: [
    {
      unique: true,
      fields: ['contestId', 'problemId'],
    },
    {
      unique: true,
      fields: ['contestId', 'index'],
    },
    {
      fields: ['problemId'],
    },
  ],
});

module.exports = ContestProblem;
