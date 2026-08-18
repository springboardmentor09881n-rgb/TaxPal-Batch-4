const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const auth = require('../middleware/authMiddleware');

// @route   POST api/chatbot/query
// @desc    Process chatbot query & return knowledge answer (Personalized if authenticated)
// @access  Public / Private
router.post('/query', auth.optionalAuth, chatbotController.processChatQuery);

module.exports = router;

