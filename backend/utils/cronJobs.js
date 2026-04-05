const cron = require('node-cron');
const Expense = require('../models/Expense');
const Bill = require('../models/Bill');

const initCronJobs = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily cron jobs...');

        // ===== RECURRING EXPENSES =====
        try {
            const today = new Date();

            // Find expenses that are recurring and due
            const dueExpenses = await Expense.find({
                isRecurring: true,
                nextRecurringDate: { $lte: today }
            });

            console.log(`Found ${dueExpenses.length} recurring expenses due.`);

            for (const expense of dueExpenses) {
                // Create new expense based on the recurring one
                const newExpense = new Expense({
                    title: expense.title,
                    amount: expense.amount,
                    category: expense.category,
                    date: today,
                    notes: `Recurring expense: ${expense.title}`,
                    userId: expense.userId,
                    isRecurring: false
                });

                await newExpense.save();

                // Calculate next recurring date
                const nextDate = new Date(expense.nextRecurringDate);
                switch (expense.recurringInterval) {
                    case 'daily':
                        nextDate.setDate(nextDate.getDate() + 1);
                        break;
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

                expense.nextRecurringDate = nextDate;
                await expense.save();
            }
        } catch (error) {
            console.error('Error in recurring expenses cron job:', error);
        }

        // ===== BILL REMINDERS =====
        try {
            const today = new Date();

            // Find bills that need reminders (unpaid, due within reminder days, reminder not sent)
            const bills = await Bill.find({
                isPaid: false,
                reminderSent: false
            });

            let remindersCount = 0;
            for (const bill of bills) {
                const dueDate = new Date(bill.dueDate);
                const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

                if (daysUntilDue <= bill.reminderDays && daysUntilDue >= 0) {
                    // Log reminder (in production, send email/notification)
                    console.log(`REMINDER: Bill "${bill.title}" is due in ${daysUntilDue} days (Amount: ₹${bill.amount})`);

                    bill.reminderSent = true;
                    await bill.save();
                    remindersCount++;
                }
            }

            console.log(`Sent ${remindersCount} bill reminders.`);
        } catch (error) {
            console.error('Error in bill reminders cron job:', error);
        }

        // ===== RECURRING BILLS RESET =====
        try {
            const today = new Date();

            // Find recurring bills that are paid and past their next due date
            const recurringBills = await Bill.find({
                isRecurring: true,
                isPaid: true,
                nextDueDate: { $lte: today }
            });

            console.log(`Found ${recurringBills.length} recurring bills to reset.`);

            for (const bill of recurringBills) {
                // Move to next period
                bill.dueDate = bill.nextDueDate;

                // Calculate next due date
                const nextDate = new Date(bill.nextDueDate);
                switch (bill.recurringInterval) {
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

                bill.nextDueDate = nextDate;
                bill.isPaid = false;
                bill.reminderSent = false;

                await bill.save();
                console.log(`Reset recurring bill: ${bill.title}`);
            }
        } catch (error) {
            console.error('Error in recurring bills reset cron job:', error);
        }
    });
};

module.exports = initCronJobs;
