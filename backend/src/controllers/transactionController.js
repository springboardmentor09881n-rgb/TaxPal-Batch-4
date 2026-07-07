const Transaction = require('../models/Transaction');

// Get all transactions for a user
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']],
    });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    const { type, amount, category, date, description, notes } = req.body;

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      amount,
      category,
      date: date || new Date(),
      description,
      notes,
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Server error creating transaction' });
  }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Make sure user owns transaction
    if (transaction.userId !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await transaction.destroy();

    res.json({ message: 'Transaction removed' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Server error deleting transaction' });
  }
};
