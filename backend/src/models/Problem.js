const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'problems',
});

module.exports = Problem;
