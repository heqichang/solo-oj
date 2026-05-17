const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProblemSetRating = sequelize.define('ProblemSetRating', {
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
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  comment: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
}, {
  timestamps: true,
  tableName: 'problem_set_ratings',
  indexes: [
    {
      unique: true,
      fields: ['problemSetId', 'userId'],
    },
    {
      fields: ['problemSetId'],
    },
    {
      fields: ['userId'],
    },
  ],
});

module.exports = ProblemSetRating;
