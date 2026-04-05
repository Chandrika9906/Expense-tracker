const Bill = require('../models/Bill');
const Expense = require('../models/Expense');

// Get all bills for user
exports.getBills = async (req, res) => {
    try {
        const { status, upcoming, recurring } = req.query;
        const query = { userId: req.user.id };

        // Filter by payment status
        if (status === 'paid') {
            query.isPaid = true;
        } else if (status === 'unpaid') {
            query.isPaid = false;
        }

        // Filter by recurring
        if (recurring === 'true') {
            query.isRecurring = true;
        }

        let bills = await Bill.find(query).sort({ dueDate: 1 });

        // Filter upcoming bills (next 30 days)
        if (upcoming === 'true') {
            const today = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(today.getDate() + 30);
            bills = bills.filter(bill => {
                const dueDate = new Date(bill.dueDate);
                return dueDate >= today && dueDate <= thirtyDaysFromNow && !bill.isPaid;
            });
        }

        res.json(bills);
    } catch (error) {
        console.error('Error fetching bills:', error);
        res.status(500).json({ message: 'Error fetching bills' });
    }
};

// Create new bill
exports.createBill = async (req, res) => {
    try {
        const billData = {
            ...req.body,
            userId: req.user.id
        };

        // If recurring, set nextDueDate
        if (billData.isRecurring) {
            billData.nextDueDate = calculateNextDueDate(
                new Date(billData.dueDate),
                billData.recurringInterval
            );
        }

        const bill = new Bill(billData);
        await bill.save();

        res.status(201).json(bill);
    } catch (error) {
        console.error('Error creating bill:', error);
        res.status(500).json({ message: 'Error creating bill' });
    }
};

// Update bill
exports.updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await Bill.findOne({ _id: id, userId: req.user.id });

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            bill[key] = req.body[key];
        });

        // Recalculate nextDueDate if recurring settings changed
        if (bill.isRecurring && (req.body.dueDate || req.body.recurringInterval)) {
            bill.nextDueDate = calculateNextDueDate(
                new Date(bill.dueDate),
                bill.recurringInterval
            );
        }

        await bill.save();
        res.json(bill);
    } catch (error) {
        console.error('Error updating bill:', error);
        res.status(500).json({ message: 'Error updating bill' });
    }
};

// Delete bill
exports.deleteBill = async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await Bill.findOneAndDelete({ _id: id, userId: req.user.id });

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        res.json({ message: 'Bill deleted successfully' });
    } catch (error) {
        console.error('Error deleting bill:', error);
        res.status(500).json({ message: 'Error deleting bill' });
    }
};

// Mark bill as paid
exports.markAsPaid = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, notes, paidDate } = req.body;

        const bill = await Bill.findOne({ _id: id, userId: req.user.id });

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Create expense if autoCreateExpense is enabled
        let expenseId = null;
        if (bill.autoCreateExpense) {
            const expense = new Expense({
                title: bill.title,
                amount: amount || bill.amount,
                category: bill.category,
                date: paidDate || new Date(),
                notes: notes || `Payment for ${bill.title}`,
                userId: req.user.id
            });
            await expense.save();
            expenseId = expense._id;
        }

        // Add to payment history
        bill.paymentHistory.push({
            paidDate: paidDate || new Date(),
            amount: amount || bill.amount,
            notes: notes || '',
            expenseId
        });

        bill.isPaid = true;
        bill.reminderSent = false;

        // If recurring, update for next period
        if (bill.isRecurring) {
            bill.dueDate = bill.nextDueDate;
            bill.nextDueDate = calculateNextDueDate(
                new Date(bill.nextDueDate),
                bill.recurringInterval
            );
            bill.isPaid = false; // Reset for next period
        }

        await bill.save();
        res.json(bill);
    } catch (error) {
        console.error('Error marking bill as paid:', error);
        res.status(500).json({ message: 'Error marking bill as paid' });
    }
};

// Get upcoming bills (next 7 days)
exports.getUpcomingBills = async (req, res) => {
    try {
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const bills = await Bill.find({
            userId: req.user.id,
            isPaid: false,
            dueDate: { $gte: today, $lte: sevenDaysFromNow }
        }).sort({ dueDate: 1 });

        res.json(bills);
    } catch (error) {
        console.error('Error fetching upcoming bills:', error);
        res.status(500).json({ message: 'Error fetching upcoming bills' });
    }
};

// Get bill payment history
exports.getBillHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await Bill.findOne({ _id: id, userId: req.user.id });

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        res.json(bill.paymentHistory);
    } catch (error) {
        console.error('Error fetching bill history:', error);
        res.status(500).json({ message: 'Error fetching bill history' });
    }
};

// Helper function to calculate next due date
function calculateNextDueDate(currentDate, interval) {
    const nextDate = new Date(currentDate);

    switch (interval) {
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }

    return nextDate;
}
