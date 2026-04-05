const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Bill = require('../models/Bill');
const Income = require('../models/Income');
const Goal = require('../models/Goal');

const seedTestData = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Seed Income
        const incomes = [
            { userId, source: 'Monthly Salary', amount: 50000, category: 'Salary', date: new Date() },
            { userId, source: 'Freelancing', amount: 15000, category: 'Side Hustle', date: new Date() }
        ];
        await Income.insertMany(incomes);

        // 2. Seed Budgets
        const budgets = [
            {
                userId,
                category: 'Food',
                amount: 8000,
                period: 'monthly',
                startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
            },
            {
                userId,
                category: 'Travel',
                amount: 3000,
                period: 'monthly',
                startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
            },
            {
                userId,
                category: 'Entertainment',
                amount: 2000,
                period: 'monthly',
                startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
            }
        ];
        await Budget.insertMany(budgets);

        // 3. Seed Expenses
        const expenses = [
            { userId, title: 'Grocery Shopping', amount: 3500, category: 'Food', date: new Date() },
            { userId, title: 'Restaurant Dinner', amount: 1200, category: 'Food', date: new Date() },
            { userId, title: 'Uber Ride', amount: 450, category: 'Travel', date: new Date() },
            { userId, title: 'Netflix Subscription', amount: 499, category: 'Entertainment', date: new Date() },
            { userId, title: 'Electric Bill', amount: 2200, category: 'Utilities', date: new Date() }
        ];
        await Expense.insertMany(expenses);

        // 4. Seed Bills
        const bills = [
            {
                userId,
                title: 'Rent',
                amount: 15000,
                category: 'Rent',
                dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 5),
                isRecurring: true,
                recurringInterval: 'monthly'
            },
            {
                userId,
                title: 'Phone Bill',
                amount: 599,
                category: 'Utilities',
                dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
                isRecurring: true,
                recurringInterval: 'monthly'
            }
        ];
        await Bill.insertMany(bills);

        // 5. Seed Goals
        const goals = [
            {
                userId,
                title: 'Emergency Fund',
                targetAmount: 100000,
                currentAmount: 25000,
                category: 'Emergency Fund',
                priority: 'High',
                status: 'Active'
            },
            {
                userId,
                title: 'Summer Vacation',
                targetAmount: 50000,
                currentAmount: 5000,
                category: 'Vacation',
                priority: 'Medium',
                status: 'Active',
                targetDate: new Date(2025, 5, 1)
            }
        ];
        await Goal.insertMany(goals);

        res.status(200).json({ message: 'Successfully seeded test data for your account!' });
    } catch (error) {
        console.error('Seeding error:', error);
        res.status(500).json({ message: 'Error seeding test data', error: error.message });
    }
};

const clearTestData = async (req, res) => {
    try {
        const userId = req.user._id;
        await Promise.all([
            Expense.deleteMany({ userId }),
            Budget.deleteMany({ userId }),
            Bill.deleteMany({ userId }),
            Income.deleteMany({ userId }),
            Goal.deleteMany({ userId })
        ]);
        res.status(200).json({ message: 'Successfully cleared all your data!' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing test data', error: error.message });
    }
};

module.exports = {
    seedTestData,
    clearTestData
};
