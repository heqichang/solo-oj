const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DiscussionReply = sequelize.define('DiscussionReply', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'discussion_posts',
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
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'discussion_replies',
      key: 'id',
    },
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  tableName: 'discussion_replies',
  indexes: [
    {
      fields: ['postId'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['parentId'],
    },
  ],
});

module.exports = DiscussionReply;
