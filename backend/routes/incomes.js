const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const incomeController = require('../controllers/incomeController');

// @route   GET /api/incomes
// @desc    Get all user incomes
// @access  Private
router.get('/', auth, incomeController.getIncomes);

// @route   POST /api/incomes
// @desc    Add new income
// @access  Private
router.post(
    '/',
    [
        auth,
        [
            check('source', 'Source is required').not().isEmpty(),
            check('amount', 'Amount is required').isNumeric()
        ]
    ],
    incomeController.addIncome
);

// @route   DELETE /api/incomes/:id
// @desc    Delete income
// @access  Private
router.delete('/:id', auth, incomeController.deleteIncome);

module.exports = router;
