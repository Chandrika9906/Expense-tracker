const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');

const createExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, amount, category, date, notes, isRecurring, recurringInterval } = req.body;

    const expenseData = {
      title,
      amount,
      category,
      date,
      notes,
      userId: req.user._id,
      isRecurring: isRecurring === 'true' || isRecurring === true || false,
      receiptImage: req.file ? `uploads/${req.file.filename}` : null
    };

    if (isRecurring) {
      expenseData.recurringInterval = recurringInterval;
      const nextDate = new Date(date);
      switch (recurringInterval) {
        case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }
      expenseData.nextRecurringDate = nextDate;
    }

    const expense = await Expense.create(expenseData);

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getExpenses = async (req, res) => {
  try {
    const {
      category,
      startDate,
      endDate,
      search,
      minAmount,
      maxAmount,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = { userId: req.user._id };
    console.log('Fetching expenses for user:', req.user._id);

    if (category) query.category = category;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const parsedMinAmount = minAmount !== undefined && minAmount !== '' ? Number(minAmount) : null;
    const parsedMaxAmount = maxAmount !== undefined && maxAmount !== '' ? Number(maxAmount) : null;

    if ((parsedMinAmount !== null && Number.isFinite(parsedMinAmount)) || (parsedMaxAmount !== null && Number.isFinite(parsedMaxAmount))) {
      query.amount = {};
      if (parsedMinAmount !== null && Number.isFinite(parsedMinAmount)) query.amount.$gte = parsedMinAmount;
      if (parsedMaxAmount !== null && Number.isFinite(parsedMaxAmount)) query.amount.$lte = parsedMaxAmount;
    }

    if (search) {
      const safeSearch = String(search).trim();
      const ignoredTerms = ['all', 'expense', 'expenses'];

      if (safeSearch && !ignoredTerms.includes(safeSearch.toLowerCase())) {
        query.$or = [
          { title: { $regex: safeSearch, $options: 'i' } },
          { notes: { $regex: safeSearch, $options: 'i' } }
        ];
      }
    }

    const allowedSortBy = ['date', 'amount', 'category'];
    const effectiveSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'date';
    const effectiveSortOrder = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

    const numericLimit = Math.max(1, Number(limit) || 10);
    const numericPage = Math.max(1, Number(page) || 1);

    const expenses = await Expense.find(query)
      .sort({ [effectiveSortBy]: effectiveSortOrder })
      .limit(numericLimit)
      .skip((numericPage - 1) * numericLimit);

    const total = await Expense.countDocuments(query);

    res.json({
      expenses,
      totalPages: Math.ceil(total / numericLimit),
      currentPage: numericPage,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Category breakdown
    const categoryBreakdown = await Expense.aggregate([
      { $match: { userId } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    // Monthly trends (last 12 months)
    const monthlyTrends = await Expense.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Predictive analysis - average spending trend
    const avgMonthlySpend = monthlyTrends.length > 0 ?
      monthlyTrends.reduce((sum, month) => sum + month.total, 0) / monthlyTrends.length : 0;

    const predictedNextMonth = avgMonthlySpend * 1.05; // 5% growth prediction

    // Weekly spending pattern
    const weeklyPattern = await Expense.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dayOfWeek: '$date' },
          avgSpending: { $avg: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Total expenses
    const totalExpenses = await Expense.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Current month expenses
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Spending insights
    const insights = {
      highestSpendingDay: weeklyPattern.reduce((max, day) =>
        day.avgSpending > max.avgSpending ? day : max, weeklyPattern[0] || {}),
      predictedNextMonth,
      avgDailySpend: (monthlyExpenses[0]?.total || 0) / new Date().getDate(),
      spendingTrend: monthlyTrends.length >= 2 ?
        ((monthlyTrends[0].total - monthlyTrends[1].total) / monthlyTrends[1].total * 100).toFixed(1) : 0
    };

    res.json({
      categoryBreakdown,
      monthlyTrends,
      weeklyPattern,
      totalExpenses: totalExpenses[0] || { total: 0, count: 0 },
      monthlyExpenses: monthlyExpenses[0] || { total: 0, count: 0 },
      topCategory: categoryBreakdown[0]?._id || 'None',
      insights
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getAnalytics
};