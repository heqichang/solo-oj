const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DiscussionPost = sequelize.define('DiscussionPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  problemId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'problems',
      key: 'id',
    },
  },
  contestId: {
    type: DataTypes.UUID,
    allowNull: true,
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
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  replyCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  tableName: 'discussion_posts',
  indexes: [
    {
      fields: ['problemId'],
    },
    {
      fields: ['contestId'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['likeCount'],
    },
    {
      fields: ['createdAt'],
    },
  ],
});

module.exports = DiscussionPost;
