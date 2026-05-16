const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContestParticipant = sequelize.define('ContestParticipant', {
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  solvedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  penalty: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  problemStats: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  rank: {
    type: DataTypes.INTEGER,
    defaultValue: null,
  },
}, {
  timestamps: true,
  tableName: 'contest_participants',
  indexes: [
    {
      unique: true,
      fields: ['contestId', 'userId'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['contestId', 'solvedCount', 'penalty'],
    },
    {
      fields: ['contestId', 'totalScore'],
    },
  ],
});

module.exports = ContestParticipant;
