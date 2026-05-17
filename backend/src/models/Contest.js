const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { CONTEST_RULES } = require('../config/constants');

const Contest = sequelize.define('Contest', {
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
  ruleType: {
    type: DataTypes.ENUM(CONTEST_RULES.ACM, CONTEST_RULES.OI, CONTEST_RULES.IOI),
    allowNull: false,
    defaultValue: CONTEST_RULES.ACM,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  freezeTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isFrozen: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  participantCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  autoPlagiarismCheck: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  plagiarismThreshold: {
    type: DataTypes.FLOAT,
    defaultValue: 0.8,
  },
  plagiarismCheckDelay: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  allowAppeals: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  appealDeadline: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  antiCheatingEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  ipRestriction: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  allowedIpRanges: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  timestamps: true,
  tableName: 'contests',
  indexes: [
    {
      fields: ['startTime'],
    },
    {
      fields: ['endTime'],
    },
    {
      fields: ['ruleType'],
    },
    {
      fields: ['createdBy'],
    },
  ],
});

module.exports = Contest;
