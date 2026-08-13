const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportType: {
    type: String,
    required: true,
    enum: ['Income Statement', 'Expense Report', 'Tax Summary'],
  },
  period: {
    type: String,
    required: true,
    // No enum restriction — supports both preset labels (e.g. 'Current Month')
    // and custom period strings (e.g. 'Jan 2025', 'Q2 2024')
  },
  format: {
    type: String,
    required: true,
    enum: ['PDF', 'CSV'],
  },
  name: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  generatedDate: {
    type: Date,
    default: Date.now,
  },
  filePath: {
    type: String,
    default: null,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
