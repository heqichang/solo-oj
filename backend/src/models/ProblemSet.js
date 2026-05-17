const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProblemSet = sequelize.define('ProblemSet', {
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
    defaultValue: '',
  },
  category: {
    type: DataTypes.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'SPECIAL_TOPIC', 'INTERVIEW_PREP', 'CONTEST'),
    allowNull: false,
    defaultValue: 'BEGINNER',
  },
  difficulty: {
    type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD', 'MIXED'),
    allowNull: false,
    defaultValue: 'EASY',
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  coverImage: {
    type: DataTypes.STRING(500),
    defaultValue: null,
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  problemCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalEnrolled: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalCompleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  averageRating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  estimatedTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  prerequisites: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  learningObjectives: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  timestamps: true,
  tableName: 'problem_sets',
  indexes: [
    {
      fields: ['slug'],
      unique: true,
    },
    {
      fields: ['category'],
    },
    {
      fields: ['difficulty'],
    },
    {
      fields: ['isPublic'],
    },
    {
      fields: ['isFeatured'],
    },
    {
      fields: ['createdBy'],
    },
    {
      fields: ['averageRating'],
    },
  ],
});

module.exports = ProblemSet;
