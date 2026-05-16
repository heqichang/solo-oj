const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
  listContests,
  getContest,
  createContest,
  updateContest,
  addContestProblems,
  removeContestProblem,
  registerForContest,
  getContestProblem,
  submitContestCode,
  getContestLeaderboardRoute,
  unfreezeContestRoute,
  getMyContestSubmissions,
} = require('../controllers/contestController');

const router = express.Router();

router.get('/', listContests);
router.get('/:slug', authenticate, getContest);

router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('startTime').notEmpty().withMessage('Start time is required'),
    body('endTime').notEmpty().withMessage('End time is required'),
    validate,
  ],
  createContest
);

router.put('/:id', authenticate, updateContest);

router.post('/:contestId/problems', authenticate, addContestProblems);
router.delete('/:contestId/problems/:problemId', authenticate, removeContestProblem);

router.post('/:contestId/register', authenticate, registerForContest);

router.get('/:contestId/problems/:index', authenticate, getContestProblem);

router.post(
  '/:contestId/problems/:index/submit',
  authenticate,
  [
    body('code').notEmpty().withMessage('Code is required'),
    body('language').isIn(['cpp', 'c', 'java', 'python', 'javascript']).withMessage('Invalid language'),
    validate,
  ],
  submitContestCode
);

router.get('/:contestId/leaderboard', authenticate, getContestLeaderboardRoute);
router.post('/:contestId/unfreeze', authenticate, unfreezeContestRoute);
router.get('/:contestId/submissions/me', authenticate, getMyContestSubmissions);

module.exports = router;
