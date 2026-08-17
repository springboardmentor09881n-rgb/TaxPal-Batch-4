const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

// Rate limiter for authentication endpoints (20 requests per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authLimiter, authController.registerUser);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authLimiter, authController.loginUser);

// @route   POST api/auth/forgot-password
// @desc    Send password reset email with a 5-minute token
// @access  Public
router.post('/forgot-password', authLimiter, authController.forgotPassword);

// @route   POST api/auth/reset-password
// @desc    Reset password using a valid token
// @access  Public
router.post('/reset-password', authLimiter, authController.resetPassword);

// @route   PUT api/auth/change-password
// @desc    Change password for authenticated user
// @access  Private
router.put('/change-password', auth, authController.changePassword);

module.exports = router;

