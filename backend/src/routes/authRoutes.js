const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
  register,
  login,
  getCurrentUser,
  updateProfile,
} = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('username').isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6, max: 100 }).withMessage('Password must be at least 6 characters'),
    validate,
  ],
  register
);

router.post(
  '/login',
  [
    body('login').notEmpty().withMessage('Login is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

router.get('/me', authenticate, getCurrentUser);

router.put('/profile', authenticate, updateProfile);

module.exports = router;
