const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/authMiddleware');

// @route   GET api/reports
// @desc    Get user reports history
// @access  Private
router.get('/', auth, reportController.getReports);

// @route   POST api/reports/generate
// @desc    Generate a new report
// @access  Private
router.post('/generate', auth, reportController.generateReport);

// @route   GET api/reports/download/:id
// @desc    Download a generated report
// @access  Private
router.get('/download/:id', auth, reportController.downloadReport);

module.exports = router;
