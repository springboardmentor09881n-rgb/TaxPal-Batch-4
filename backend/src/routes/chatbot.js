const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// @route   POST api/chatbot/query
// @desc    Process chatbot query & return knowledge answer
// @access  Public / Private (Open to active users)
router.post('/query', chatbotController.processChatQuery);

module.exports = router;
