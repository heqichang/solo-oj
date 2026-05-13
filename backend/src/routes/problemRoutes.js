const express = require('express');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
  listProblems,
  getProblem,
  createProblem,
  listTags,
} = require('../controllers/problemController');

const router = express.Router();

router.get('/', listProblems);
router.get('/tags', listTags);
router.get('/:slug', getProblem);
router.post('/', authenticate, requireAdmin, createProblem);

module.exports = router;
