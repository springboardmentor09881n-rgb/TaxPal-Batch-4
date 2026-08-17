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
    enum: ['Income Statement', 'Tax Summary', 'Budget Performance'],
  },
  period: {
    type: String,
    required: true,
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
  },
  data: {
    type: Object,
    default: {},
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
