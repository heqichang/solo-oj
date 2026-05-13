const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING(255),
    defaultValue: '',
  },
}, {
  timestamps: true,
  tableName: 'tags',
});

module.exports = Tag;
