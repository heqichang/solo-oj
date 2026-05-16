const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
  listProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
  submitForReview,
  reviewProblem,
  uploadTestCases,
  importProblems,
} = require('../controllers/adminProblemController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

router.get('/', authenticate, requireAdmin, listProblems);
router.get('/:id', authenticate, requireAdmin, getProblem);

router.post(
  '/',
  authenticate,
  requireAdmin,
  createProblem
);

router.put('/:id', authenticate, requireAdmin, updateProblem);
router.delete('/:id', authenticate, requireAdmin, deleteProblem);

router.post('/:id/submit-review', authenticate, submitForReview);
router.post('/:id/review', authenticate, requireAdmin, reviewProblem);

router.post(
  '/:id/test-cases',
  authenticate,
  requireAdmin,
  upload.array('files'),
  uploadTestCases
);

router.post('/import', authenticate, requireAdmin, importProblems);

module.exports = router;
