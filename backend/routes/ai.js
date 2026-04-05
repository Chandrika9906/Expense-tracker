const express = require('express');
const {
  getFinancialAdvice,
  getSpendingPrediction,
  categorizeExpense,
  handleChat,
  getSmartSuggestions,
  getSmartBudgets,
  predictBill,
  parseVoice
} = require('../controllers/aiController');
const auth = require('../middleware/auth');
const geminiService = require('../services/geminiService');

const router = express.Router();

router.get('/advice', auth, getFinancialAdvice);
router.get('/prediction', auth, getSpendingPrediction);
router.post('/categorize', auth, categorizeExpense);
router.post('/chat', auth, handleChat);
router.post('/smart-suggestions', auth, getSmartSuggestions);
router.post('/smart-budgets', auth, getSmartBudgets);
router.post('/predict-bill', auth, predictBill);
router.post('/parse-voice', auth, parseVoice);

router.post('/generate-note', auth, async (req, res) => {
  try {
    const { title, amount, category } = req.body;
    const note = await geminiService.generateExpenseNote(title, amount, category);
    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: 'Error generating note' });
  }
});

router.post('/parse-query', auth, async (req, res) => {
  try {
    const { query } = req.body;
    const filters = await geminiService.parseNaturalLanguageQuery(query);
    res.json({ filters });
  } catch (error) {
    res.status(500).json({ message: 'Error parsing natural language query' });
  }
});

module.exports = router;