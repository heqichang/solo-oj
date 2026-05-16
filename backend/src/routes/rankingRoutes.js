const express = require('express');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
  getLeaderboard,
  getUserProfile,
  getMyProfile,
  getProblemStatistics,
  refreshLeaderboard,
} = require('../controllers/rankingController');

const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/users/me', authenticate, getMyProfile);
router.get('/users/:userId', getUserProfile);
router.get('/problems/:problemId/stats', getProblemStatistics);
router.post('/leaderboard/refresh', authenticate, requireAdmin, refreshLeaderboard);

module.exports = router;
