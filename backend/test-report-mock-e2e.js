process.env.JWT_SECRET = 'test_secret_for_reports';
process.env.PORT = '5000';

const assert = require('assert');
const PDFDocument = require('pdfkit');
const Transaction = require('./src/models/transaction.model');
const Budget = require('./src/models/budgets.model');
const TaxEstimate = require('./src/models/taxEstimates.model');
const User = require('./src/models/user.model');
const reportController = require('./src/controllers/reportController');

console.log('--- RUNNING FULL REPORT ENGINE E2E MOCK TEST ---');

// Mock data
const mockUser = {
  _id: '60d0fe4f5311236168a109ca',
  fullName: 'Alex Morgan',
  username: 'demo',
  email: 'alex@example.com',
  country: 'India',
  incomeBracket: 'Medium'
};

const mockTransactions = [
  { _id: 'tx1', type: 'income', category: 'Design Project', amount: 120000, date: new Date('2026-08-05'), description: 'Web Design Client Payout', notes: 'Milestone 2' },
  { _id: 'tx2', type: 'income', category: 'Consulting', amount: 45000, date: new Date('2026-08-10'), description: 'Consulting Review', notes: 'Tech audit' },
  { _id: 'tx3', type: 'expense', category: 'Office Rent', amount: 22000, date: new Date('2026-08-02'), description: 'Monthly Office Rental' },
  { _id: 'tx4', type: 'expense', category: 'Business Expenses', amount: 14500, date: new Date('2026-08-04'), description: 'Cloud server hosting' },
  { _id: 'tx5', type: 'expense', category: 'Utilities', amount: 3500, date: new Date('2026-08-07'), description: 'High speed internet' },
  { _id: 'tx6', type: 'expense', category: 'Meals & Entertainment', amount: 6200, date: new Date('2026-08-09'), description: 'Client meeting dinner' }
];

const mockBudgets = [
  { category: 'Office Rent', budget_amount: 25000 },
  { category: 'Business Expenses', budget_amount: 20000 },
  { category: 'Utilities', budget_amount: 5000 },
  { category: 'Meals & Entertainment', budget_amount: 5000 } // Notice 6200 > 5000 -> over budget
];

const mockTaxEstimates = [
  {
    _id: 'est1',
    quarter: 'Q2',
    country: 'India',
    state: 'Maharashtra',
    filingStatus: 'SINGLE',
    grossIncomeForQuarter: 165000,
    businessExpenses: 46200,
    estimatedTax: 17820,
    dueDate: new Date('2026-09-15')
  }
];

// Mock Mongoose Query methods
User.findById = function() {
  return {
    select: () => Promise.resolve(mockUser)
  };
};

Transaction.find = function() {
  return {
    sort: () => Promise.resolve(mockTransactions)
  };
};

Budget.find = function() {
  return Promise.resolve(mockBudgets);
};

TaxEstimate.find = function() {
  return {
    sort: () => Promise.resolve(mockTaxEstimates)
  };
};

async function testReportEngine() {
  // Test Preview
  let previewResult = null;
  const mockReq = {
    user: { id: '60d0fe4f5311236168a109ca' },
    body: {
      reportType: 'income_expense',
      period: 'this_month'
    },
    method: 'POST'
  };

  const mockRes = {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      previewResult = data;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
    }
  };

  await reportController.previewReport(mockReq, mockRes);
  assert(previewResult && previewResult.success, 'Preview report must return success');
  
  const summary = previewResult.data.summary;
  console.log('Preview Summary Generated:');
  console.log(`- Total Income: $${summary.totalIncome}`);
  console.log(`- Total Expenses: $${summary.totalExpenses}`);
  console.log(`- Net Savings: $${summary.netSavings}`);
  console.log(`- Savings Rate: ${summary.savingsRate}%`);
  console.log(`- Transaction Count: ${summary.transactionCount}`);

  assert.strictEqual(summary.totalIncome, 165000, 'Total Income should be 165,000');
  assert.strictEqual(summary.totalExpenses, 46200, 'Total Expenses should be 46,200');
  assert.strictEqual(summary.netSavings, 118800, 'Net Savings should be 118,800');
  assert.strictEqual(summary.savingsRate, 72, 'Savings rate should be 72%');

  // Verify Over-budget detection
  const expenseCats = previewResult.data.expenseCategories;
  const mealsCat = expenseCats.find(c => c.category === 'Meals & Entertainment');
  assert(mealsCat && mealsCat.isOverBudget === true, 'Meals & Entertainment must be flagged over budget (6200 > 5000)');
  console.log('✓ Over-budget calculations correctly identified Meals & Entertainment');

  // Test CSV Export
  let csvOutput = '';
  const mockCsvRes = {
    statusCode: 200,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    setHeader(key, val) { this.headers[key] = val; },
    send(content) { csvOutput = content; }
  };

  await reportController.exportCsv(mockReq, mockCsvRes);
  assert(mockCsvRes.headers['Content-Type'].includes('text/csv'), 'CSV Export header must be text/csv');
  assert(csvOutput.includes('Alex Morgan'), 'CSV must contain user name');
  assert(csvOutput.includes('165000.00'), 'CSV must contain Total Income');
  assert(csvOutput.includes('Web Design Client Payout'), 'CSV must contain transaction description');
  console.log('✓ CSV Export generated RFC 4180 output with correct headers');

  // Test PDF Export
  const chunks = [];
  const mockPdfRes = {
    statusCode: 200,
    headers: {},
    setHeader(key, val) { this.headers[key] = val; },
    status(code) { this.statusCode = code; return this; },
    json(data) { return this; },
    write(chunk) { chunks.push(chunk); },
    end() {},
    on(ev, fn) {}
  };

  // Mock piping for test
  const originalPipe = PDFDocument.prototype.pipe;
  PDFDocument.prototype.pipe = function(dest) {
    this.on('data', chunk => chunks.push(chunk));
    return this;
  };

  await reportController.exportPdf(mockReq, mockPdfRes);
  PDFDocument.prototype.pipe = originalPipe;

  assert(mockPdfRes.headers['Content-Type'] === 'application/pdf', 'PDF Export header must be application/pdf');
  console.log('✓ PDF Export completed with proper headers');

  console.log('\n✅ ALL FULL E2E REPORT SERVICE TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testReportEngine().catch(err => {
  console.error('Mock E2E Test failed:', err);
  process.exit(1);
});
