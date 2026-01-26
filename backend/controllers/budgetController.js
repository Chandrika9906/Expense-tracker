const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

const createBudget = async (req, res) => {
  try {
    const budget = await Budget.create({
      ...req.body,
      userId: req.user._id
    });
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getBudgets = async (req, res) => {
  try {
    console.log('Fetching budgets for user:', req.user._id);
    const budgets = await Budget.find({ userId: req.user._id }).sort({ createdAt: -1 });
    console.log('Found budgets count:', budgets.length);

    // Calculate spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await Expense.aggregate([
          {
            $match: {
              userId: req.user._id,
              category: budget.category,
              date: { $gte: budget.startDate, $lte: budget.endDate }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalSpent = spent[0]?.total || 0;
        const percentage = (totalSpent / budget.amount) * 100;

        return {
          ...budget.toObject(),
          spent: totalSpent,
          remaining: budget.amount - totalSpent,
          percentage: Math.round(percentage),
          status: percentage >= 100 ? 'exceeded' :
            percentage >= (budget.alertThresholds?.critical || 90) ? 'critical' :
              percentage >= (budget.alertThresholds?.warning || 80) ? 'warning' : 'safe'
        };
      })
    );

    res.json(budgetsWithSpending);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget
};