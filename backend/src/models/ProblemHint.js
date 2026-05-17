const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProblemHint = sequelize.define('ProblemHint', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  problemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'problems',
      key: 'id',
    },
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  type: {
    type: DataTypes.ENUM('DIRECTIONAL', 'APPROACH', 'CODE_SNIPPET', 'FULL_SOLUTION'),
    allowNull: false,
    defaultValue: 'DIRECTIONAL',
  },
  title: {
    type: DataTypes.STRING(200),
    defaultValue: null,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING(50),
    defaultValue: null,
  },
  isFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  requiredAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  pointsCost: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  timestamps: true,
  tableName: 'problem_hints',
  indexes: [
    {
      fields: ['problemId', 'level'],
    },
    {
      fields: ['type'],
    },
  ],
});

module.exports = ProblemHint;
