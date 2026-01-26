const express = require('express');
const { body } = require('express-validator');
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget
} = require('../controllers/budgetController');
const auth = require('../middleware/auth');

const router = express.Router();

const budgetValidation = [
  body('category').isIn(['Food', 'Travel', 'Rent', 'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Other'])
    .withMessage('Invalid category'),
  body('amount').isNumeric().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('period').isIn(['monthly', 'weekly']).withMessage('Period must be monthly or weekly'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date')
];

router.use(auth);

router.post('/', budgetValidation, createBudget);
router.get('/', getBudgets);
router.put('/:id', budgetValidation, updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;