const { Op } = require('sequelize');
const {
  DiscussionPost,
  DiscussionReply,
  Like,
  User,
  Problem,
  Contest,
} = require('../models');
const { success, error, paginate } = require('../utils/response');
const { DISCUSSION_SORT } = require('../config/constants');

const listPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, problemId, contestId, sort = DISCUSSION_SORT.LATEST, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where = { isDeleted: false };

    if (problemId) where.problemId = problemId;
    if (contestId) where.contestId = contestId;

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const order = sort === DISCUSSION_SORT.HOTTEST
      ? [['likeCount', 'DESC'], ['createdAt', 'DESC']]
      : [['isPinned', 'DESC'], ['createdAt', 'DESC']];

    const include = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar'],
      },
    ];

    const { count, rows } = await DiscussionPost.findAndCountAll({
      where,
      include,
      order,
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
    });

    return paginate(res, rows, count, pageNum, limitNum);
  } catch (err) {
    console.error('List posts error:', err);
    return error(res, 'Failed to fetch posts', 500);
  }
};

const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const post = await DiscussionPost.findOne({
      where: { id, isDeleted: false },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar'],
        },
        {
          model: Problem,
          as: 'problem',
          attributes: ['id', 'slug', 'title'],
        },
        {
          model: Contest,
          as: 'contest',
          attributes: ['id', 'slug', 'title'],
        },
      ],
    });

    if (!post) {
      return error(res, 'Post not found', 404);
    }

    await post.increment('viewCount');

    let liked = false;
    if (user) {
      const existingLike = await Like.findOne({
        where: { userId: user.id, targetType: 'POST', targetId: post.id },
      });
      liked = !!existingLike;
    }

    const replies = await DiscussionReply.findAll({
      where: { postId: post.id, isDeleted: false, parentId: null },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar'],
        },
        {
          model: DiscussionReply,
          as: 'children',
          where: { isDeleted: false },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'nickname', 'avatar'],
            },
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    return success(res, {
      post: {
        ...post.toJSON(),
        liked,
      },
      replies,
    });
  } catch (err) {
    console.error('Get post error:', err);
    return error(res, 'Failed to fetch post', 500);
  }
};

const createPost = async (req, res) => {
  try {
    const { title, content, problemId, contestId } = req.body;
    const user = req.user;

    if (!title || !content) {
      return error(res, 'Title and content are required', 400);
    }

    if (problemId) {
      const problem = await Problem.findByPk(problemId);
      if (!problem) {
        return error(res, 'Problem not found', 404);
      }
    }

    if (contestId) {
      const contest = await Contest.findByPk(contestId);
      if (!contest) {
        return error(res, 'Contest not found', 404);
      }
    }

    const post = await DiscussionPost.create({
      title,
      content,
      problemId: problemId || null,
      contestId: contestId || null,
      userId: user.id,
    });

    const postWithUser = await DiscussionPost.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar'],
        },
      ],
    });

    return success(res, { post: postWithUser.toJSON() }, 201);
  } catch (err) {
    console.error('Create post error:', err);
    return error(res, 'Failed to create post', 500);
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const user = req.user;

    const post = await DiscussionPost.findOne({ where: { id, isDeleted: false } });
    if (!post) {
      return error(res, 'Post not found', 404);
    }

    if (!user.isAdmin && post.userId !== user.id) {
      return error(res, 'Permission denied', 403);
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;

    await post.update(updates);

    return success(res, { post: post.toJSON() });
  } catch (err) {
    console.error('Update post error:', err);
    return error(res, 'Failed to update post', 500);
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const post = await DiscussionPost.findOne({ where: { id, isDeleted: false } });
    if (!post) {
      return error(res, 'Post not found', 404);
    }

    if (!user.isAdmin && post.userId !== user.id) {
      return error(res, 'Permission denied', 403);
    }

    await post.update({ isDeleted: true });

    return success(res, { deleted: true });
  } catch (err) {
    console.error('Delete post error:', err);
    return error(res, 'Failed to delete post', 500);
  }
};

const createReply = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;
    const user = req.user;

    if (!content) {
      return error(res, 'Content is required', 400);
    }

    const post = await DiscussionPost.findOne({ where: { id: postId, isDeleted: false } });
    if (!post) {
      return error(res, 'Post not found', 404);
    }

    if (parentId) {
      const parent = await DiscussionReply.findOne({ where: { id: parentId, isDeleted: false } });
      if (!parent) {
        return error(res, 'Parent reply not found', 404);
      }
    }

    const reply = await DiscussionReply.create({
      content,
      postId,
      userId: user.id,
      parentId: parentId || null,
    });

    await post.increment('replyCount');

    const replyWithUser = await DiscussionReply.findByPk(reply.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar'],
        },
      ],
    });

    return success(res, { reply: replyWithUser.toJSON() }, 201);
  } catch (err) {
    console.error('Create reply error:', err);
    return error(res, 'Failed to create reply', 500);
  }
};

const updateReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user = req.user;

    const reply = await DiscussionReply.findOne({ where: { id, isDeleted: false } });
    if (!reply) {
      return error(res, 'Reply not found', 404);
    }

    if (!user.isAdmin && reply.userId !== user.id) {
      return error(res, 'Permission denied', 403);
    }

    await reply.update({ content });

    return success(res, { reply: reply.toJSON() });
  } catch (err) {
    console.error('Update reply error:', err);
    return error(res, 'Failed to update reply', 500);
  }
};

const deleteReply = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const reply = await DiscussionReply.findOne({ where: { id, isDeleted: false } });
    if (!reply) {
      return error(res, 'Reply not found', 404);
    }

    if (!user.isAdmin && reply.userId !== user.id) {
      return error(res, 'Permission denied', 403);
    }

    await reply.update({ isDeleted: true });

    const post = await DiscussionPost.findByPk(reply.postId);
    if (post) {
      await post.decrement('replyCount');
    }

    return success(res, { deleted: true });
  } catch (err) {
    console.error('Delete reply error:', err);
    return error(res, 'Failed to delete reply', 500);
  }
};

const toggleLike = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const user = req.user;

    if (!['POST', 'REPLY'].includes(targetType.toUpperCase())) {
      return error(res, 'Invalid target type', 400);
    }

    const type = targetType.toUpperCase();

    const existingLike = await Like.findOne({
      where: { userId: user.id, targetType: type, targetId },
    });

    let liked = false;

    if (existingLike) {
      await existingLike.destroy();

      if (type === 'POST') {
        const post = await DiscussionPost.findByPk(targetId);
        if (post) await post.decrement('likeCount');
      } else {
        const reply = await DiscussionReply.findByPk(targetId);
        if (reply) await reply.decrement('likeCount');
      }
    } else {
      await Like.create({
        userId: user.id,
        targetType: type,
        targetId,
      });

      if (type === 'POST') {
        const post = await DiscussionPost.findByPk(targetId);
        if (post) await post.increment('likeCount');
      } else {
        const reply = await DiscussionReply.findByPk(targetId);
        if (reply) await reply.increment('likeCount');
      }

      liked = true;
    }

    return success(res, { liked });
  } catch (err) {
    console.error('Toggle like error:', err);
    return error(res, 'Failed to toggle like', 500);
  }
};

const pinPost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user.isAdmin) {
      return error(res, 'Admin access required', 403);
    }

    const post = await DiscussionPost.findOne({ where: { id, isDeleted: false } });
    if (!post) {
      return error(res, 'Post not found', 404);
    }

    await post.update({ isPinned: !post.isPinned });

    return success(res, { post: post.toJSON() });
  } catch (err) {
    console.error('Pin post error:', err);
    return error(res, 'Failed to pin post', 500);
  }
};

module.exports = {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  createReply,
  updateReply,
  deleteReply,
  toggleLike,
  pinPost,
};
