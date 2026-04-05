const Expense = require('../models/Expense');
const Income = require('../models/Income');

exports.exportData = async (req, res) => {
    try {
        const userId = req.user.id;
        const expenses = await Expense.find({ userId }).sort({ date: -1 });
        const incomes = await Income.find({ userId }).sort({ date: -1 });

        let csvContent = "Type,Date,Category,Title,Amount,Notes\n";

        incomes.forEach(income => {
            csvContent += `Income,${income.date.toISOString().split('T')[0]},Income,${income.source},${income.amount},"${income.notes || ''}"\n`;
        });

        expenses.forEach(expense => {
            csvContent += `Expense,${expense.date.toISOString().split('T')[0]},${expense.category},${expense.title},${expense.amount},"${expense.notes || ''}"\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('financial_data.csv');
        return res.send(csvContent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error exporting data' });
    }
};
