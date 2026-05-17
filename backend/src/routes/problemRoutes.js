const express = require('express');
const { authenticate, authenticateOptional, requireAdmin } = require('../middlewares/auth');
const {
  listProblems,
  getProblem,
  createProblem,
  listTags,
} = require('../controllers/problemController');

const router = express.Router();

router.get('/', authenticateOptional, listProblems);
router.get('/tags', listTags);
router.get('/:slug', authenticateOptional, getProblem);
router.post('/', authenticate, requireAdmin, createProblem);

module.exports = router;
