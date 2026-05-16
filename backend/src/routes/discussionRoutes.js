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
  createReply,
  updateReply,
  deleteReply,
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

router.post(
  '/:postId/replies',
  authenticate,
  [
    body('content').notEmpty().withMessage('Content is required'),
    validate,
  ],
  createReply
);

router.put('/replies/:id', authenticate, updateReply);
router.delete('/replies/:id', authenticate, deleteReply);

router.post('/likes/:targetType/:targetId', authenticate, toggleLike);

router.post('/:id/pin', authenticate, requireAdmin, pinPost);

module.exports = router;
