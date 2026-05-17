const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
  createProblemHint,
  updateProblemHint,
  deleteProblemHint,
  getHints,
  unlock,
  analyzeWeakTags,
  getMyWeakTags,
  getRelated,
  getLearningPath,
} = require('../controllers/hintController');

router.get('/problems/:problemId/hints', getHints);
router.post('/problems/:problemId/hints', authenticate, requireAdmin, createProblemHint);
router.put('/hints/:id', authenticate, requireAdmin, updateProblemHint);
router.delete('/hints/:id', authenticate, requireAdmin, deleteProblemHint);
router.post('/hints/:id/unlock', authenticate, unlock);

router.get('/me/weak-tags', authenticate, getMyWeakTags);
router.post('/me/analyze-weak-tags', authenticate, analyzeWeakTags);
router.get('/me/learning-path', authenticate, getLearningPath);

router.get('/problems/:problemId/related', getRelated);

module.exports = router;
