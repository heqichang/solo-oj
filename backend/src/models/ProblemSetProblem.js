const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProblemSetProblem = sequelize.define('ProblemSetProblem', {
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
  problemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'problems',
      key: 'id',
    },
  },
  position: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  section: {
    type: DataTypes.STRING(100),
    defaultValue: null,
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
}, {
  timestamps: true,
  tableName: 'problem_set_problems',
  indexes: [
    {
      fields: ['problemSetId', 'position'],
    },
    {
      fields: ['problemId'],
    },
    {
      unique: true,
      fields: ['problemSetId', 'problemId'],
    },
  ],
});

module.exports = ProblemSetProblem;
