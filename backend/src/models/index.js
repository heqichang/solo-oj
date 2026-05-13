const { sequelize } = require('../config/database');
const User = require('./User');
const Problem = require('./Problem');
const Tag = require('./Tag');
const Submission = require('./Submission');

const ProblemTags = sequelize.define('ProblemTags', {
  problemId: {
    type: require('sequelize').DataTypes.UUID,
    references: { model: 'problems', key: 'id' },
    field: 'problem_id',
  },
  tagId: {
    type: require('sequelize').DataTypes.UUID,
    references: { model: 'tags', key: 'id' },
    field: 'tag_id',
  },
}, { 
  tableName: 'problem_tags',
  timestamps: false,
});

Problem.belongsToMany(Tag, { 
  through: ProblemTags, 
  as: 'tags',
  foreignKey: 'problemId',
  otherKey: 'tagId',
});
Tag.belongsToMany(Problem, { 
  through: ProblemTags,
  foreignKey: 'tagId',
  otherKey: 'problemId',
});

Submission.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Submission.belongsTo(Problem, { as: 'problem', foreignKey: 'problemId' });

User.hasMany(Submission, { as: 'submissions', foreignKey: 'userId' });
Problem.hasMany(Submission, { as: 'submissions', foreignKey: 'problemId' });

module.exports = {
  User,
  Problem,
  Tag,
  Submission,
  ProblemTags,
  sequelize,
};
