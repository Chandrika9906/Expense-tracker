const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  period: {
    type: String,
    enum: ['monthly', 'weekly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  alertThresholds: {
    warning: { type: Number, default: 80 },
    critical: { type: Number, default: 90 }
  }
}, {
  timestamps: true
});

budgetSchema.index({ userId: 1, category: 1, period: 1 });

module.exports = mongoose.model('Budget', budgetSchema);