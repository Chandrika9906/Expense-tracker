const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Income = require('../models/Income');
const Goal = require('../models/Goal');
const geminiService = require('../services/geminiService');
const mongoose = require('mongoose');

const getAdvancedFinancialInsights = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Fetch current month data for Health Score
        const [expenses, budgets, incomes, goals] = await Promise.all([
            Expense.find({ userId, date: { $gte: firstDayOfMonth } }),
            Budget.find({ userId }),
            Income.find({ userId, date: { $gte: firstDayOfMonth } }),
            Goal.find({ userId })
        ]);

        const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        // Calculate Budget Adherence
        const budgetStats = budgets.map(b => {
            const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + e.amount, 0);
            return { category: b.category, limit: b.amount, spent, exceeded: spent > b.amount };
        });
        const budgetAdherence = budgets.length > 0
            ? ((budgets.length - budgetStats.filter(b => b.exceeded).length) / budgets.length) * 100
            : 100;

        // Calculate Goal Progress
        const goalsProgress = goals.length > 0
            ? goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / goals.length * 100
            : 0;

        const healthContext = {
            totalIncome,
            totalExpenses,
            savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
            budgetAdherence,
            goalsProgress: Math.min(goalsProgress, 100)
        };

        // 2. Anomaly Detection (Last 7 days vs Historical)
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const recentExpenses = await Expense.find({ userId, date: { $gte: sevenDaysAgo } }).limit(10);

        // Simplified Historical Averages (last 3 months)
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 90);

        const historicalStats = await Expense.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: ninetyDaysAgo, $lt: sevenDaysAgo } } },
            { $group: { _id: "$category", avgAmount: { $avg: "$amount" } } }
        ]);

        const historicalAverages = {};
        historicalStats.forEach(stat => {
            historicalAverages[stat._id] = stat.avgAmount;
        });

        const [healthScore, anomalies] = await Promise.all([
            geminiService.calculateFinancialHealth(healthContext),
            geminiService.detectSpendingAnomalies(recentExpenses, historicalAverages)
        ]);

        res.json({
            healthScore,
            anomalies,
            summary: {
                totalIncome,
                totalExpenses,
                budgetAdherence: Math.round(budgetAdherence),
                goalsProgress: Math.round(goalsProgress)
            }
        });
    } catch (error) {
        console.error('Advanced Insights Error:', error);
        res.status(500).json({ message: 'Error generating advanced insights', error: error.message });
    }
};

const getBudgetRollovers = async (req, res) => {
    try {
        const userId = req.user.id;
        const lastMonthFirst = new Date();
        lastMonthFirst.setMonth(lastMonthFirst.getMonth() - 1);
        lastMonthFirst.setDate(1);

        const lastMonthLast = new Date();
        lastMonthLast.setDate(0); // Last day of previous month

        // Get budgets and expenses for LAST month
        const [lastBudgets, lastExpenses] = await Promise.all([
            Budget.find({ userId }), // Assuming budgets are recurring templates for now
            Expense.find({ userId, date: { $gte: lastMonthFirst, $lt: lastMonthLast } })
        ]);

        const rollovers = lastBudgets.map(b => {
            const spent = lastExpenses.filter(e => e.category === b.category).reduce((sum, e) => sum + e.amount, 0);
            const remaining = Math.max(0, b.amount - spent);
            return {
                category: b.category,
                lastMonthLimit: b.amount,
                lastMonthSpent: spent,
                rolloverAmount: remaining
            };
        }).filter(r => r.rolloverAmount > 0);

        res.json({ rollovers });
    } catch (error) {
        res.status(500).json({ message: 'Error calculating rollovers' });
    }
};

module.exports = {
    getAdvancedFinancialInsights,
    getBudgetRollovers
};
