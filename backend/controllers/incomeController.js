const Income = require('../models/Income');
const { validationResult } = require('express-validator');

// @desc    Get all incomes
// @route   GET /api/incomes
// @access  Private
exports.getIncomes = async (req, res) => {
    try {
        const incomes = await Income.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(incomes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add new income
// @route   POST /api/incomes
// @access  Private
exports.addIncome = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { source, amount, date, notes } = req.body;

    try {
        const newIncome = new Income({
            source,
            amount,
            date,
            notes,
            userId: req.user.id
        });

        const income = await newIncome.save();
        res.json(income);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete income
// @route   DELETE /api/incomes/:id
// @access  Private
exports.deleteIncome = async (req, res) => {
    try {
        const income = await Income.findById(req.params.id);

        if (!income) {
            return res.status(404).json({ msg: 'Income not found' });
        }

        // Make sure user owns income
        if (income.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await income.deleteOne();

        res.json({ msg: 'Income removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
