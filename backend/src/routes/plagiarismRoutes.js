const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
  createReport,
  listReports,
  getReport,
  getMatch,
  listMatches,
  reviewMatch,
  createCheatingRecord,
  listCheatingRecords,
  checkSuspiciousActivity,
  appealCheatingRecord,
  reviewAppeal,
} = require('../controllers/plagiarismController');

router.post('/reports', authenticate, requireAdmin, createReport);
router.get('/reports', authenticate, requireAdmin, listReports);
router.get('/reports/:id', authenticate, requireAdmin, getReport);

router.get('/matches', authenticate, requireAdmin, listMatches);
router.get('/matches/:id', authenticate, requireAdmin, getMatch);
router.put('/matches/:id/review', authenticate, requireAdmin, reviewMatch);

router.post('/cheating', authenticate, requireAdmin, createCheatingRecord);
router.get('/cheating', authenticate, requireAdmin, listCheatingRecords);
router.post('/cheating/:id/appeal', authenticate, appealCheatingRecord);
router.put('/cheating/:id/appeal', authenticate, requireAdmin, reviewAppeal);

router.get('/suspicious/:userId', authenticate, requireAdmin, checkSuspiciousActivity);

module.exports = router;
