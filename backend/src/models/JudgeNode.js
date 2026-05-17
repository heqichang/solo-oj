const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JudgeNode = sequelize.define('JudgeNode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  endpoint: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('ONLINE', 'OFFLINE', 'BUSY', 'MAINTENANCE', 'ERROR'),
    allowNull: false,
    defaultValue: 'OFFLINE',
  },
  type: {
    type: DataTypes.ENUM('STANDARD', 'SPECIAL', 'INTERACTIVE', 'UNIVERSAL'),
    allowNull: false,
    defaultValue: 'STANDARD',
  },
  supportedLanguages: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  maxConcurrentJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  currentJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalJobsProcessed: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
  },
  totalErrors: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
  },
  cpuUsage: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  memoryUsage: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  memoryTotal: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  diskUsage: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  lastHeartbeat: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastError: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  lastErrorAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  version: {
    type: DataTypes.STRING(50),
    defaultValue: null,
  },
  region: {
    type: DataTypes.STRING(100),
    defaultValue: null,
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'judge_nodes',
  indexes: [
    {
      fields: ['status'],
    },
    {
      fields: ['type'],
    },
    {
      fields: ['isEnabled'],
    },
    {
      fields: ['lastHeartbeat'],
    },
  ],
});

module.exports = JudgeNode;
