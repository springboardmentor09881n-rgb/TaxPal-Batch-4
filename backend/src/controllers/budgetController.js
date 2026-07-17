const Budget = require('../models/budgets.model');
const Transaction = require('../models/Transaction.model');

// @desc    Get all budgets for a user
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id });
    
    // Calculate spent amount for each budget
    const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
      const budgetObj = budget.toObject();
      
      // Attempt to calculate spent amount from transactions
      // Assuming budget.month format is like "May, 2025" or similar parseable date,
      // or frontend sends it in a consistent format. 
      // For a more robust solution, we can just aggregate all expenses for the category
      // that fall in the same month.
      try {
         const budgetMonthDate = new Date(budget.month);
         const startOfMonth = new Date(budgetMonthDate.getFullYear(), budgetMonthDate.getMonth(), 1);
         const endOfMonth = new Date(budgetMonthDate.getFullYear(), budgetMonthDate.getMonth() + 1, 0, 23, 59, 59);

         const transactions = await Transaction.find({
            userId: req.user._id,
            category: budget.category,
            type: 'expense',
            date: { $gte: startOfMonth, $lte: endOfMonth }
         });

         const spent = transactions.reduce((acc, curr) => acc + curr.amount, 0);
         budgetObj.spent = spent;
         budgetObj.remaining = budgetObj.budget_amount - spent;
      } catch (err) {
         budgetObj.spent = 0;
         budgetObj.remaining = budgetObj.budget_amount;
      }

      return budgetObj;
    }));

    res.status(200).json(budgetsWithSpent);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets', error: error.message });
  }
};

// @desc    Create a new budget
// @route   POST /api/budgets
// @access  Private
exports.createBudget = async (req, res) => {
  const { category, budget_amount, month, description } = req.body;

  try {
    const existingBudget = await Budget.findOne({ userId: req.user._id, category, month });
    if (existingBudget) {
      return res.status(400).json({ message: 'Budget for this category and month already exists' });
    }

    const budget = new Budget({
      userId: req.user._id,
      category,
      budget_amount,
      month,
      description
    });

    const savedBudget = await budget.save();
    res.status(201).json(savedBudget);
  } catch (error) {
    res.status(500).json({ message: 'Error creating budget', error: error.message });
  }
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private
exports.updateBudget = async (req, res) => {
  const { category, budget_amount, month, description } = req.body;

  try {
    let budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    budget.category = category || budget.category;
    budget.budget_amount = budget_amount || budget.budget_amount;
    budget.month = month || budget.month;
    budget.description = description !== undefined ? description : budget.description;

    const updatedBudget = await budget.save();
    res.status(200).json(updatedBudget);
  } catch (error) {
    res.status(500).json({ message: 'Error updating budget', error: error.message });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.status(200).json({ message: 'Budget removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting budget', error: error.message });
  }
};
