const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/authMiddleware');

// @route   GET /api/reports
// @desc    Get all saved reports for the authenticated user
// @access  Private
router.get('/', auth, reportController.getReports);

// @route   POST /api/reports/preview
// @desc    Preview generated report data (JSON) before downloading
// @access  Private
router.post('/preview', auth, reportController.previewReport);

// @route   POST /api/reports/generate
// @desc    Generate and save a report record in history
// @access  Private
router.post('/generate', auth, reportController.generateReport);

// @route   POST /api/reports/export/pdf & GET /api/reports/export/pdf
// @desc    Export dynamic report as a styled PDF document
// @access  Private
router.post('/export/pdf', auth, reportController.exportPdf);
router.get('/export/pdf', auth, reportController.exportPdf);

// @route   POST /api/reports/export/csv & GET /api/reports/export/csv
// @desc    Export dynamic report as a structured CSV document
// @access  Private
router.post('/export/csv', auth, reportController.exportCsv);
router.get('/export/csv', auth, reportController.exportCsv);

// @route   GET /api/reports/:id/download
// @desc    Download a previously saved report by ID (PDF or CSV)
// @access  Private
router.get('/:id/download', auth, reportController.downloadSavedReport);

// @route   GET /api/reports/:id
// @desc    Get details of a specific saved report
// @access  Private
router.get('/:id', auth, reportController.getReportById);

// @route   DELETE /api/reports/:id
// @desc    Delete a saved report record
// @access  Private
router.delete('/:id', auth, reportController.deleteReport);

module.exports = router;
