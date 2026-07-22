const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const protect = require('../middleware/authMiddleware');

// @route   GET api/categories/recommend
// @desc    Recommend a category based on transaction description and type
// @access  Private
router.get('/recommend', protect, categoryController.recommendCategory);

module.exports = router;
