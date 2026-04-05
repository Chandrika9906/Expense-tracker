const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    }
}, { _id: true });

const goalSchema = new mongoose.Schema({
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
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Emergency Fund', 'Vacation', 'Education', 'House', 'Car', 'Investment', 'Other'],
        default: 'Other'
    },
    targetAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    targetDate: {
        type: Date
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Paused', 'Cancelled'],
        default: 'Active'
    },
    contributions: [contributionSchema],
    milestones: {
        twentyFive: { type: Boolean, default: false },
        fifty: { type: Boolean, default: false },
        seventyFive: { type: Boolean, default: false },
        hundred: { type: Boolean, default: false }
    },
    color: {
        type: String,
        default: '#6366F1' // Primary color
    },
    icon: {
        type: String,
        default: '🎯'
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, category: 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function () {
    if (this.targetAmount === 0) return 0;
    return Math.min(Math.round((this.currentAmount / this.targetAmount) * 100), 100);
});

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function () {
    return Math.max(this.targetAmount - this.currentAmount, 0);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function () {
    if (!this.targetDate) return null;
    const today = new Date();
    const target = new Date(this.targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Virtual for checking if goal is overdue
goalSchema.virtual('isOverdue').get(function () {
    if (!this.targetDate || this.status === 'Completed') return false;
    return new Date() > new Date(this.targetDate);
});

// Ensure virtuals are included in JSON
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

// Method to check and update milestones
goalSchema.methods.checkMilestones = function () {
    const progress = this.progressPercentage;
    const newMilestones = [];

    if (progress >= 25 && !this.milestones.twentyFive) {
        this.milestones.twentyFive = true;
        newMilestones.push(25);
    }
    if (progress >= 50 && !this.milestones.fifty) {
        this.milestones.fifty = true;
        newMilestones.push(50);
    }
    if (progress >= 75 && !this.milestones.seventyFive) {
        this.milestones.seventyFive = true;
        newMilestones.push(75);
    }
    if (progress >= 100 && !this.milestones.hundred) {
        this.milestones.hundred = true;
        newMilestones.push(100);
    }

    return newMilestones;
};

module.exports = mongoose.model('Goal', goalSchema);
