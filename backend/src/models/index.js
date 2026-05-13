const { sequelize } = require('../config/database');
const User = require('./User');
const Problem = require('./Problem');
const Tag = require('./Tag');
const Submission = require('./Submission');

Problem.belongsToMany(Tag, { through: 'ProblemTags', as: 'tags' });
Tag.belongsToMany(Problem, { through: 'ProblemTags' });

Submission.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Submission.belongsTo(Problem, { as: 'problem', foreignKey: 'problemId' });

User.hasMany(Submission, { as: 'submissions', foreignKey: 'userId' });
Problem.hasMany(Submission, { as: 'submissions', foreignKey: 'problemId' });

const ProblemTags = sequelize.define('ProblemTags', {}, { tableName: 'ProblemTags' });

module.exports = {
  User,
  Problem,
  Tag,
  Submission,
  ProblemTags,
  sequelize,
};
