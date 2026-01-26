const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
    paidDate: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
        trim: true
    },
    expenseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense'
    }
}, { _id: true });

const billSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Food', 'Travel', 'Rent', 'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Other']
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    dueDate: {
        type: Date,
        required: true
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringInterval: {
        type: String,
        enum: ['weekly', 'monthly', 'yearly'],
        default: 'monthly'
    },
    nextDueDate: {
        type: Date
    },
    reminderDays: {
        type: Number,
        default: 3,
        min: 0
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        trim: true
    },
    paymentHistory: [paymentHistorySchema],
    autoCreateExpense: {
        type: Boolean,
        default: true
    },
    reminderSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
billSchema.index({ userId: 1, dueDate: 1 });
billSchema.index({ userId: 1, isPaid: 1 });
billSchema.index({ userId: 1, isRecurring: 1 });

// Virtual for checking if bill is overdue
billSchema.virtual('isOverdue').get(function () {
    return !this.isPaid && new Date() > this.dueDate;
});

// Virtual for days until due
billSchema.virtual('daysUntilDue').get(function () {
    const today = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Ensure virtuals are included in JSON
billSchema.set('toJSON', { virtuals: true });
billSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Bill', billSchema);
