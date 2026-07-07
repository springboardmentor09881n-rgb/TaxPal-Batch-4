const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/authMiddleware');

// @route   GET api/transactions
// @desc    Get all users transactions
// @access  Private
router.get('/', auth, transactionController.getTransactions);

// @route   POST api/transactions
// @desc    Add new transaction
// @access  Private
router.post('/', auth, transactionController.createTransaction);

// @route   DELETE api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', auth, transactionController.deleteTransaction);

module.exports = router;
