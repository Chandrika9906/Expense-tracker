const express = require('express');
const { body } = require('express-validator');
const {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getAnalytics
} = require('../controllers/expenseController');
const auth = require('../middleware/auth');

const router = express.Router();

const expenseValidation = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('amount').isNumeric().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').isIn(['Food', 'Travel', 'Rent', 'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Other'])
    .withMessage('Invalid category'),
  body('date').isISO8601().withMessage('Invalid date format')
];

const upload = require('../middleware/upload');

router.use(auth);

router.post('/', [upload.single('receipt'), expenseValidation], createExpense);
router.get('/', getExpenses);
router.get('/analytics', getAnalytics);
router.put('/:id', expenseValidation, updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;