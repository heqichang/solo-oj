const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubmissionIpRecord = sequelize.define('SubmissionIpRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  submissionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'submissions',
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
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  userAgent: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  country: {
    type: DataTypes.STRING(100),
    defaultValue: null,
  },
  region: {
    type: DataTypes.STRING(100),
    defaultValue: null,
  },
  city: {
    type: DataTypes.STRING(100),
    defaultValue: null,
  },
  isProxy: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isVPN: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  riskLevel: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    defaultValue: 'LOW',
  },
}, {
  timestamps: true,
  tableName: 'submission_ip_records',
  indexes: [
    {
      fields: ['submissionId'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['ipAddress'],
    },
    {
      fields: ['createdAt'],
    },
  ],
});

module.exports = SubmissionIpRecord;
