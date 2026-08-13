const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    reportType: {
      type: String,
      enum: ['income_expense', 'category_spending', 'tax_summary', 'transaction_ledger', 'annual_summary'],
      default: 'income_expense',
      required: true,
    },
    period: {
      type: String,
      enum: ['this_month', 'last_month', 'this_quarter', 'this_year', 'last_year', 'all_time', 'custom'],
      default: 'this_month',
      required: true,
    },
    format: {
      type: String,
      enum: ['PDF', 'CSV'],
      default: 'PDF',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    summaryData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    generatedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);
