const express = require('express');
const { body } = require('express-validator');
const {
    getBills,
    createBill,
    updateBill,
    deleteBill,
    markAsPaid,
    getUpcomingBills,
    getBillHistory
} = require('../controllers/billController');
const auth = require('../middleware/auth');

const router = express.Router();

const billValidation = [
    body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
    body('amount').isNumeric().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('category').isIn(['Food', 'Travel', 'Rent', 'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Other'])
        .withMessage('Invalid category'),
    body('dueDate').isISO8601().withMessage('Invalid date format')
];

// All routes require authentication
router.use(auth);

// Bill CRUD routes
router.get('/', getBills);
router.post('/', billValidation, createBill);
router.put('/:id', billValidation, updateBill);
router.delete('/:id', deleteBill);

// Special routes
router.patch('/:id/pay', markAsPaid);
router.get('/upcoming', getUpcomingBills);
router.get('/:id/history', getBillHistory);

module.exports = router;
