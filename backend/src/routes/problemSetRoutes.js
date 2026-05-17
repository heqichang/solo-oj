const express = require('express');
const router = express.Router();
const { authenticate, authenticateOptional, requireAdmin } = require('../middlewares/auth');
const {
  createSet,
  updateSet,
  deleteSet,
  getSetBySlug,
  listSets,
  addProblem,
  removeProblem,
  updateProblem,
  enroll,
  rate,
  getRecommended,
  getMyProgress,
} = require('../controllers/problemSetController');

router.post('/', authenticate, createSet);
router.get('/', listSets);
router.get('/recommended', authenticate, getRecommended);
router.get('/me/progress', authenticate, getMyProgress);
router.get('/:slug', authenticateOptional, getSetBySlug);
router.put('/:id', authenticate, updateSet);
router.delete('/:id', authenticate, deleteSet);

router.post('/:id/problems', authenticate, addProblem);
router.delete('/:id/problems/:problemId', authenticate, removeProblem);
router.put('/:id/problems/:problemId', authenticate, updateProblem);

router.post('/:id/enroll', authenticate, enroll);
router.post('/:id/rate', authenticate, rate);

module.exports = router;
