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
    enum: ['Current Month', 'Last Month', 'Current Quarter', 'Last Quarter', 'Year to Date'],
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
