const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const taxController = require('../controllers/taxController');

// Calculate and save tax estimate
router.post('/estimate', auth, taxController.calculateTaxEstimate);

// Get all tax estimates for user
router.get('/estimates', auth, taxController.getTaxEstimates);

// Get calendar events (estimates + alerts)
router.get('/calendar', auth, taxController.getTaxCalendar);

// Delete a tax estimate
router.delete('/estimates/:id', auth, taxController.deleteTaxEstimate);

module.exports = router;


