const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CodeFavorite = sequelize.define('CodeFavorite', {
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
  submissionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'submissions',
      key: 'id',
    },
  },
  note: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
}, {
  timestamps: true,
  tableName: 'code_favorites',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'submissionId'],
    },
    {
      fields: ['userId'],
    },
  ],
});

module.exports = CodeFavorite;
