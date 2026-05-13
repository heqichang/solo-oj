const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
  submitCode,
  getSubmission,
  listSubmissions,
  listMySubmissions,
} = require('../controllers/submissionController');

const router = express.Router();

router.get('/', authenticate, listSubmissions);
router.get('/me', authenticate, listMySubmissions);
router.get('/:id', authenticate, getSubmission);

router.post(
  '/',
  authenticate,
  [
    body('problemId').notEmpty().withMessage('Problem ID is required'),
    body('code').notEmpty().withMessage('Code is required'),
    body('language').isIn(['cpp', 'c', 'java', 'python', 'javascript']).withMessage('Invalid language'),
    validate,
  ],
  submitCode
);

module.exports = router;
