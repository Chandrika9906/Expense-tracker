const geminiService = require('../services/geminiService');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');

const generatePredictiveAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch user data
    const [expenses, budgets, goals] = await Promise.all([
      Expense.find({ userId, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 }),
      Budget.find({ userId }),
      Goal.find({ userId })
    ]);

    // Generate AI-powered alerts and predictions
    const alertsData = await geminiService.generatePredictiveAlerts({
      expenses,
      budgets,
      goals,
      currentDate: now
    });

    res.json(alertsData);
  } catch (error) {
    console.error('Predictive alerts error:', error);
    res.status(500).json({ message: 'Error generating predictive alerts' });
  }
};

const dismissAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    // In a real app, you'd store dismissed alerts in database
    // For now, just return success
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error dismissing alert' });
  }
};

module.exports = {
  generatePredictiveAlerts,
  dismissAlert
};