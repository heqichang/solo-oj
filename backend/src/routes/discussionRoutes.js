const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  listReplies,
  createReply,
  updateReply,
  deleteReply,
  togglePostLike,
  toggleReplyLike,
  toggleLike,
  pinPost,
} = require('../controllers/discussionController');

const router = express.Router();

router.get('/', listPosts);
router.get('/:id', authenticate, getPost);

router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    validate,
  ],
  createPost
);

router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);

router.post('/:id/like', authenticate, togglePostLike);

router.get('/:postId/replies', authenticate, listReplies);
router.post(
  '/:postId/replies',
  authenticate,
  [
    body('content').notEmpty().withMessage('Content is required'),
    validate,
  ],
  createReply
);
router.post('/:postId/replies/:replyId/like', authenticate, toggleReplyLike);

router.put('/replies/:id', authenticate, updateReply);
router.delete('/replies/:id', authenticate, deleteReply);
router.delete('/:postId/replies/:replyId', authenticate, deleteReply);

router.post('/likes/:targetType/:targetId', authenticate, toggleLike);

router.post('/:id/pin', authenticate, requireAdmin, pinPost);

module.exports = router;
