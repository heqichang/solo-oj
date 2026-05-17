const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserWeakTag = sequelize.define('UserWeakTag', {
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
  tagId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tags',
      key: 'id',
    },
  },
  tagName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  totalAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  correctAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  accuracy: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  averageTimeSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  weaknessScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  level: {
    type: DataTypes.ENUM('STRONG', 'MODERATE', 'WEAK', 'VERY_WEAK'),
    allowNull: false,
    defaultValue: 'MODERATE',
  },
  lastPracticed: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  recommendations: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  timestamps: true,
  tableName: 'user_weak_tags',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'tagId'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['weaknessScore'],
    },
    {
      fields: ['level'],
    },
  ],
});

module.exports = UserWeakTag;
