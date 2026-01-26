const express = require('express');
const { body } = require('express-validator');
const {
    getGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    getGoalProgress,
    completeGoal,
    getGoalStats
} = require('../controllers/goalController');
const auth = require('../middleware/auth');

const router = express.Router();

const goalValidation = [
    body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
    body('targetAmount').isNumeric().isFloat({ min: 0 }).withMessage('Target amount must be a positive number'),
    body('category').isIn(['Emergency Fund', 'Vacation', 'Education', 'House', 'Car', 'Investment', 'Other'])
        .withMessage('Invalid category')
];

const contributionValidation = [
    body('amount').isNumeric().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
];

// All routes require authentication
router.use(auth);

// Goal CRUD routes
router.get('/', getGoals);
router.post('/', goalValidation, createGoal);
router.put('/:id', goalValidation, updateGoal);
router.delete('/:id', deleteGoal);

// Special routes
router.post('/:id/contribute', contributionValidation, addContribution);
router.get('/:id/progress', getGoalProgress);
router.patch('/:id/complete', completeGoal);
router.get('/stats/summary', getGoalStats);

module.exports = router;
