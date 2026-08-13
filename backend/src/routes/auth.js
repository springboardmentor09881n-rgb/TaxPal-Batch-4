const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authController.registerUser);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.loginUser);

// @route   POST api/auth/forgot-password
// @desc    Send password reset email with a 5-minute token
// @access  Public
router.post('/forgot-password', authController.forgotPassword);

// @route   POST api/auth/reset-password
// @desc    Reset password using a valid token
// @access  Public
router.post('/reset-password', authController.resetPassword);

// @route   PUT api/auth/change-password
// @desc    Change password for authenticated user
// @access  Private
router.put('/change-password', auth, authController.changePassword);

module.exports = router;
