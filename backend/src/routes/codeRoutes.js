const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
  listFavorites,
  addFavorite,
  removeFavorite,
  listNotes,
  createNote,
  updateNote,
  deleteNote,
  viewOtherSubmission,
  listProblemSolutions,
} = require('../controllers/codeController');

const router = express.Router();

router.get('/favorites', authenticate, listFavorites);
router.post(
  '/favorites',
  authenticate,
  [
    body('submissionId').notEmpty().withMessage('Submission ID is required'),
    validate,
  ],
  addFavorite
);
router.delete('/favorites/:submissionId', authenticate, removeFavorite);

router.get('/notes', authenticate, listNotes);
router.post(
  '/notes',
  authenticate,
  [
    body('submissionId').notEmpty().withMessage('Submission ID is required'),
    body('content').notEmpty().withMessage('Content is required'),
    validate,
  ],
  createNote
);
router.put('/notes/:id', authenticate, updateNote);
router.delete('/notes/:id', authenticate, deleteNote);

router.get('/submissions/:id', authenticate, viewOtherSubmission);
router.get('/problems/:problemId/solutions', authenticate, listProblemSolutions);

module.exports = router;
