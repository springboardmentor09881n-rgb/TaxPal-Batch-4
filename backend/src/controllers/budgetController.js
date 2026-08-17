const Budget = require('../models/budgets.model');
const Transaction = require('../models/Transaction.model');

// Helper to calculate spent and remaining for a budget document
async function formatBudgetWithSpent(budgetDoc, userId) {
  const budgetObj = budgetDoc.toObject ? budgetDoc.toObject() : { ...budgetDoc };
  try {
    let year, month;
    const rawMonth = (budgetObj.month || '').trim();

    if (rawMonth.includes('-')) {
      const parts = rawMonth.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1; // 0-indexed month
    } else {
      const tempDate = new Date(rawMonth);
      if (!isNaN(tempDate.getTime())) {
        year = tempDate.getFullYear();
        month = tempDate.getMonth();
      } else {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth();
      }
    }

    // Default fallbacks if parsing resulted in NaN
    if (isNaN(year) || isNaN(month)) {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
    }

    const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const transactions = await Transaction.find({
      userId: userId,
      category: budgetObj.category,
      type: 'expense',
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const spent = transactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    budgetObj.spent = spent;
    budgetObj.remaining = (Number(budgetObj.budget_amount) || 0) - spent;
  } catch (err) {
    budgetObj.spent = 0;
    budgetObj.remaining = Number(budgetObj.budget_amount) || 0;
  }
  return budgetObj;
}

// @desc    Get all budgets for a user
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id });
    const budgetsWithSpent = await Promise.all(budgets.map(b => formatBudgetWithSpent(b, req.user.id)));
    res.status(200).json(budgetsWithSpent);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching budgets', error: error.message });
  }
};

// @desc    Create a new budget
// @route   POST /api/budgets
// @access  Private
exports.createBudget = async (req, res) => {
  const { category, budget_amount, month, description } = req.body;

  try {
    const existingBudget = await Budget.findOne({ userId: req.user.id, category, month });
    if (existingBudget) {
      return res.status(400).json({ success: false, message: 'Budget for this category and month already exists' });
    }

    const budget = new Budget({
      userId: req.user.id,
      category,
      budget_amount,
      month,
      description
    });

    const savedBudget = await budget.save();
    const formatted = await formatBudgetWithSpent(savedBudget, req.user.id);
    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating budget', error: error.message });
  }
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private
exports.updateBudget = async (req, res) => {
  const { category, budget_amount, month, description } = req.body;

  try {
    let budget = await Budget.findOne({ _id: req.params.id, userId: req.user.id });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    budget.category = category || budget.category;
    budget.budget_amount = budget_amount !== undefined ? budget_amount : budget.budget_amount;
    budget.month = month || budget.month;
    budget.description = description !== undefined ? description : budget.description;

    const updatedBudget = await budget.save();
    const formatted = await formatBudgetWithSpent(updatedBudget, req.user.id);
    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating budget', error: error.message });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    res.status(200).json({ success: true, message: 'Budget removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting budget', error: error.message });
  }
};
