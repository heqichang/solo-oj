const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CodeNote = sequelize.define('CodeNote', {
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
  problemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'problems',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING(200),
    defaultValue: '',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  lineStart: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  lineEnd: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'code_notes',
  indexes: [
    {
      fields: ['userId', 'submissionId'],
    },
    {
      fields: ['userId', 'problemId'],
    },
  ],
});

module.exports = CodeNote;
