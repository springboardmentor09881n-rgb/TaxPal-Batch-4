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

// Get all tax alerts/notifications
router.get('/alerts', auth, taxController.getTaxAlerts);

// Delete/dismiss a tax alert
router.delete('/alerts/:id', auth, taxController.deleteTaxAlert);

module.exports = router;

