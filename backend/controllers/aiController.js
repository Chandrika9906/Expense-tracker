const geminiService = require('../services/geminiService');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

const getFinancialAdvice = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).limit(20).sort({ date: -1 });
    const budgets = await Budget.find({ userId: req.user.id });

    const advice = await geminiService.generateBudgetAdvice(expenses, budgets);
    res.json({ advice });
  } catch (error) {
    res.status(500).json({ message: 'Error generating advice' });
  }
};

const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    // Fetch context
    const expenses = await Expense.find({ userId }).sort({ date: -1 }).limit(10);
    const budgets = await Budget.find({ userId });

    // Calculate basics (simplified for speed)
    // In a real app, use aggregation for totals
    const context = {
      recentExpenses: expenses,
      budgets: budgets,
      // You could fetch real income/balance here if needed
    };

    const response = await geminiService.chatWithFinancialAdvisor(message, context);

    // If action is ADD_EXPENSE, we could actually save it here if confidence is high,
    // or just return the data for the frontend to confirm.
    // For now, let's return it to frontend to confirm.

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing chat' });
  }
};

const getSpendingPrediction = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).limit(50).sort({ date: -1 });
    const prediction = await geminiService.predictNextMonthSpending(expenses);
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: 'Error generating prediction' });
  }
};

const categorizeExpense = async (req, res) => {
  try {
    const { title, merchant } = req.body;
    const category = await geminiService.categorizeExpense(title, merchant);
    res.json({ category });
  } catch (error) {
    res.status(500).json({ message: 'Error categorizing expense' });
  }
};

const getSmartSuggestions = async (req, res) => {
  try {
    const { partialInput } = req.body;
    const expenses = await Expense.find({ userId: req.user.id }).limit(20).sort({ date: -1 });
    const suggestions = await geminiService.suggestExpenseCompletion(partialInput, expenses);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching suggestions' });
  }
};

const getSmartBudgets = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).limit(100).sort({ date: -1 });
    const budgetSuggestions = await geminiService.generateSmartBudgets(expenses);
    res.json(budgetSuggestions);
  } catch (error) {
    res.status(500).json({ message: 'Error generating smart budgets' });
  }
};

const predictBill = async (req, res) => {
  try {
    const { billId, history, title } = req.body;
    const prediction = await geminiService.predictBillAmount(history, title);
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: 'Error predicting bill' });
  }
};

const parseVoice = async (req, res) => {
  try {
    const { text } = req.body;
    const parsedData = await geminiService.parseVoiceExpense(text);
    res.json(parsedData);
  } catch (error) {
    res.status(500).json({ message: 'Error parsing voice input' });
  }
};

module.exports = {
  getFinancialAdvice,
  getSpendingPrediction,
  categorizeExpense,
  handleChat,
  getSmartSuggestions,
  getSmartBudgets,
  predictBill,
  parseVoice
};