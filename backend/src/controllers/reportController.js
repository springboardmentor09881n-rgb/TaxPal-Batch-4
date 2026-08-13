const PDFDocument = require('pdfkit');
const Report = require('../models/report.model');
const Transaction = require('../models/transaction.model');
const Budget = require('../models/budgets.model');
const TaxEstimate = require('../models/taxEstimates.model');
const User = require('../models/user.model');

// Helper: Calculate Date Range based on period identifier
function getDateRange(period, customStart, customEnd) {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'this_month': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
    case 'last_month': {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case 'this_quarter': {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
      break;
    }
    case 'this_year': {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    }
    case 'last_year': {
      startDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    }
    case 'all_time': {
      startDate = new Date(1970, 0, 1, 0, 0, 0, 0);
      endDate = new Date(2099, 11, 31, 23, 59, 59, 999);
      break;
    }
    case 'custom':
    default: {
      startDate = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = customEnd ? new Date(customEnd) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      // Ensure start is beginning of day and end is end of day
      if (customStart) startDate.setHours(0, 0, 0, 0);
      if (customEnd) endDate.setHours(23, 59, 59, 999);
      break;
    }
  }

  return { startDate, endDate };
}

// Helper: Format numbers as standard currency string
function formatCurrency(amount, currency = 'USD') {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Helper: Core reporting engine computing metrics, category breakdowns, budgets, and tax estimates
async function computeReportData(userId, { reportType = 'income_expense', period = 'this_month', startDate: customStart, endDate: customEnd }) {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd);

  const [user, transactions, budgets, taxEstimates] = await Promise.all([
    User.findById(userId).select('-password'),
    Transaction.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 }),
    Budget.find({ userId }),
    TaxEstimate.find({ userId }).sort({ dueDate: -1 }),
  ]);

  // Aggregate totals
  let totalIncome = 0;
  let totalExpenses = 0;
  const incomeCategoryMap = {};
  const expenseCategoryMap = {};
  const monthlyTrendMap = {};

  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const cat = tx.category || 'Uncategorized';
    const txDate = new Date(tx.date);
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyTrendMap[monthKey]) {
      monthlyTrendMap[monthKey] = { month: monthKey, income: 0, expenses: 0, net: 0 };
    }

    if (tx.type === 'income') {
      totalIncome += amt;
      monthlyTrendMap[monthKey].income += amt;
      if (!incomeCategoryMap[cat]) {
        incomeCategoryMap[cat] = { category: cat, total: 0, count: 0 };
      }
      incomeCategoryMap[cat].total += amt;
      incomeCategoryMap[cat].count += 1;
    } else if (tx.type === 'expense') {
      totalExpenses += amt;
      monthlyTrendMap[monthKey].expenses += amt;
      if (!expenseCategoryMap[cat]) {
        expenseCategoryMap[cat] = { category: cat, total: 0, count: 0 };
      }
      expenseCategoryMap[cat].total += amt;
      expenseCategoryMap[cat].count += 1;
    }
  });

  // Calculate net trends
  Object.values(monthlyTrendMap).forEach((m) => {
    m.net = m.income - m.expenses;
  });

  const monthlyTrends = Object.values(monthlyTrendMap).sort((a, b) => a.month.localeCompare(b.month));

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(2) : '0.00';

  // Category breakdowns with percentages
  const incomeCategories = Object.values(incomeCategoryMap)
    .map((item) => ({
      ...item,
      percentage: totalIncome > 0 ? Number(((item.total / totalIncome) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Budget mapping for expense categories
  const budgetMap = {};
  budgets.forEach((b) => {
    budgetMap[b.category] = Number(b.budget_amount) || 0;
  });

  const expenseCategories = Object.values(expenseCategoryMap)
    .map((item) => {
      const budgetAmount = budgetMap[item.category] || 0;
      const remaining = budgetAmount > 0 ? budgetAmount - item.total : 0;
      const isOverBudget = budgetAmount > 0 && item.total > budgetAmount;
      const utilization = budgetAmount > 0 ? Number(((item.total / budgetAmount) * 100).toFixed(2)) : 0;

      return {
        ...item,
        percentage: totalExpenses > 0 ? Number(((item.total / totalExpenses) * 100).toFixed(2)) : 0,
        budgetAmount,
        remaining,
        isOverBudget,
        utilization,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Filter relevant tax estimates for the period / user
  const relevantTaxEstimates = taxEstimates.map((t) => ({
    id: t._id,
    quarter: t.quarter,
    country: t.country,
    state: t.state,
    filingStatus: t.filingStatus,
    estimatedTax: t.estimatedTax,
    dueDate: t.dueDate,
    grossIncomeForQuarter: t.grossIncomeForQuarter,
    businessExpenses: t.businessExpenses,
    retirementContributions: t.retirementContributions,
    healthInsurancePremiums: t.healthInsurancePremiums,
    homeOfficeDeductions: t.homeOfficeDeductions,
  }));

  const totalEstimatedTax = relevantTaxEstimates.reduce((acc, curr) => acc + (Number(curr.estimatedTax) || 0), 0);

  // Formatted human readable report name
  const typeTitles = {
    income_expense: 'Income vs Expense Summary Report',
    category_spending: 'Category Expense Breakdown Report',
    tax_summary: 'Tax Liability & Estimates Summary',
    transaction_ledger: 'Detailed Transaction Ledger Statement',
    annual_summary: 'Comprehensive Annual Financial Report',
  };

  const reportTitle = typeTitles[reportType] || 'Financial Summary Report';

  const summary = {
    reportTitle,
    period,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate: Number(savingsRate),
    transactionCount: transactions.length,
    totalEstimatedTax,
    user: {
      name: user ? user.fullName || user.username : 'TaxPal User',
      email: user ? user.email : '',
      country: user ? user.country : 'India',
      incomeBracket: user ? user.incomeBracket : '',
    },
  };

  return {
    reportType,
    period,
    startDate,
    endDate,
    summary,
    incomeCategories,
    expenseCategories,
    monthlyTrends,
    transactions,
    taxEstimates: relevantTaxEstimates,
  };
}

// -------------------------------------------------------------
// CONTROLLER ACTIONS
// -------------------------------------------------------------

// @desc    Preview generated report data (JSON)
// @route   POST /api/reports/preview
// @access  Private
exports.previewReport = async (req, res) => {
  try {
    const { reportType, period, startDate, endDate } = req.body;
    const reportData = await computeReportData(req.user.id, {
      reportType,
      period,
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Error previewing report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report preview',
      error: error.message,
    });
  }
};

// @desc    Generate and save a report record
// @route   POST /api/reports/generate
// @access  Private
exports.generateReport = async (req, res) => {
  try {
    const { name, reportType, period, startDate: customStart, endDate: customEnd, format = 'PDF' } = req.body;

    const reportData = await computeReportData(req.user.id, {
      reportType,
      period,
      startDate: customStart,
      endDate: customEnd,
    });

    const reportName =
      name ||
      `${reportData.summary.reportTitle.replace(/\s+/g, '_')}_${reportData.summary.startDate}_to_${reportData.summary.endDate}`;

    const newReport = new Report({
      userId: req.user.id,
      name: reportName,
      reportType: reportData.reportType,
      period: reportData.period,
      format: format.toUpperCase(),
      startDate: reportData.startDate,
      endDate: reportData.endDate,
      summaryData: reportData.summary,
      generatedDate: new Date(),
    });

    const savedReport = await newReport.save();

    res.status(201).json({
      success: true,
      message: 'Report generated and saved successfully',
      report: savedReport,
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message,
    });
  }
};

// @desc    Get all saved reports for user
// @route   GET /api/reports
// @access  Private
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id }).sort({ generatedDate: -1 });
    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message,
    });
  }
};

// @desc    Get single report by ID
// @route   GET /api/reports/:id
// @access  Private
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user.id });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const reportData = await computeReportData(req.user.id, {
      reportType: report.reportType,
      period: report.period,
      startDate: report.startDate,
      endDate: report.endDate,
    });

    res.status(200).json({
      success: true,
      report,
      data: reportData,
    });
  } catch (error) {
    console.error('Error fetching report details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report details',
      error: error.message,
    });
  }
};

// @desc    Delete a report
// @route   DELETE /api/reports/:id
// @access  Private
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: error.message,
    });
  }
};

// -------------------------------------------------------------
// EXPORT CSV SERVICE
// -------------------------------------------------------------

// Helper: Escape CSV fields
function escapeCsv(field) {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

// @desc    Export report as CSV
// @route   GET or POST /api/reports/export/csv
// @access  Private
exports.exportCsv = async (req, res) => {
  try {
    const params = req.method === 'POST' ? req.body : req.query;
    const { reportType = 'income_expense', period = 'this_month', startDate, endDate } = params;

    const reportData = await computeReportData(req.user.id, {
      reportType,
      period,
      startDate,
      endDate,
    });

    const lines = [];

    // Header metadata
    lines.push(`# TaxPal Financial Report`);
    lines.push(`# Report Type: ${reportData.summary.reportTitle}`);
    lines.push(`# User: ${reportData.summary.user.name} (${reportData.summary.user.email})`);
    lines.push(`# Period: ${reportData.summary.startDate} to ${reportData.summary.endDate}`);
    lines.push(`# Generated At: ${new Date().toISOString()}`);
    lines.push('');

    // Summary Metrics Section
    lines.push('--- FINANCIAL SUMMARY ---');
    lines.push(['Metric', 'Amount / Value'].map(escapeCsv).join(','));
    lines.push([escapeCsv('Total Income'), escapeCsv(reportData.summary.totalIncome.toFixed(2))].join(','));
    lines.push([escapeCsv('Total Expenses'), escapeCsv(reportData.summary.totalExpenses.toFixed(2))].join(','));
    lines.push([escapeCsv('Net Savings'), escapeCsv(reportData.summary.netSavings.toFixed(2))].join(','));
    lines.push([escapeCsv('Savings Rate (%)'), escapeCsv(`${reportData.summary.savingsRate}%`)].join(','));
    lines.push([escapeCsv('Total Transactions'), escapeCsv(reportData.summary.transactionCount)].join(','));
    if (reportData.summary.totalEstimatedTax > 0) {
      lines.push([escapeCsv('Estimated Tax Liability'), escapeCsv(reportData.summary.totalEstimatedTax.toFixed(2))].join(','));
    }
    lines.push('');

    // Expense Category Breakdown Section
    if (reportData.expenseCategories && reportData.expenseCategories.length > 0) {
      lines.push('--- EXPENSE CATEGORY BREAKDOWN ---');
      lines.push(['Category', 'Total Spent', '% of Expenses', 'Budget Target', 'Remaining Budget', 'Over Budget?'].map(escapeCsv).join(','));
      reportData.expenseCategories.forEach((cat) => {
        lines.push([
          escapeCsv(cat.category),
          escapeCsv(cat.total.toFixed(2)),
          escapeCsv(`${cat.percentage}%`),
          escapeCsv(cat.budgetAmount ? cat.budgetAmount.toFixed(2) : 'N/A'),
          escapeCsv(cat.budgetAmount ? cat.remaining.toFixed(2) : 'N/A'),
          escapeCsv(cat.isOverBudget ? 'YES' : 'NO'),
        ].join(','));
      });
      lines.push('');
    }

    // Income Category Breakdown Section
    if (reportData.incomeCategories && reportData.incomeCategories.length > 0) {
      lines.push('--- INCOME CATEGORY BREAKDOWN ---');
      lines.push(['Category', 'Total Income', '% of Income', 'Transaction Count'].map(escapeCsv).join(','));
      reportData.incomeCategories.forEach((cat) => {
        lines.push([
          escapeCsv(cat.category),
          escapeCsv(cat.total.toFixed(2)),
          escapeCsv(`${cat.percentage}%`),
          escapeCsv(cat.count),
        ].join(','));
      });
      lines.push('');
    }

    // Tax Estimates Section (if applicable)
    if (reportData.taxEstimates && reportData.taxEstimates.length > 0) {
      lines.push('--- TAX ESTIMATES & DEDUCTIONS ---');
      lines.push(['Quarter', 'Country', 'State', 'Filing Status', 'Gross Income', 'Business Expenses', 'Estimated Tax', 'Due Date'].map(escapeCsv).join(','));
      reportData.taxEstimates.forEach((t) => {
        lines.push([
          escapeCsv(t.quarter),
          escapeCsv(t.country),
          escapeCsv(t.state),
          escapeCsv(t.filingStatus),
          escapeCsv(t.grossIncomeForQuarter.toFixed(2)),
          escapeCsv(t.businessExpenses.toFixed(2)),
          escapeCsv(t.estimatedTax.toFixed(2)),
          escapeCsv(new Date(t.dueDate).toISOString().split('T')[0]),
        ].join(','));
      });
      lines.push('');
    }

    // Detailed Itemized Transactions Ledger Section
    lines.push('--- ITEMIZED TRANSACTION LEDGER ---');
    lines.push(['Date', 'Type', 'Category', 'Description', 'Notes', 'Amount'].map(escapeCsv).join(','));
    reportData.transactions.forEach((tx) => {
      lines.push([
        escapeCsv(new Date(tx.date).toISOString().split('T')[0]),
        escapeCsv(tx.type.toUpperCase()),
        escapeCsv(tx.category),
        escapeCsv(tx.description),
        escapeCsv(tx.notes || ''),
        escapeCsv(Number(tx.amount).toFixed(2)),
      ].join(','));
    });

    const csvContent = lines.join('\r\n');
    const filename = `taxpal_report_${reportType}_${reportData.summary.startDate}_${reportData.summary.endDate}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export CSV report',
      error: error.message,
    });
  }
};

// -------------------------------------------------------------
// EXPORT PDF SERVICE
// -------------------------------------------------------------

// @desc    Export report as PDF
// @route   GET or POST /api/reports/export/pdf
// @access  Private
exports.exportPdf = async (req, res) => {
  try {
    const params = req.method === 'POST' ? req.body : req.query;
    const { reportType = 'income_expense', period = 'this_month', startDate, endDate } = params;

    const reportData = await computeReportData(req.user.id, {
      reportType,
      period,
      startDate,
      endDate,
    });

    const filename = `taxpal_report_${reportType}_${reportData.summary.startDate}_${reportData.summary.endDate}.pdf`;

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
      info: {
        Title: reportData.summary.reportTitle,
        Author: 'TaxPal Financial Management',
        Subject: 'Financial Summary Report',
      },
    });

    // Set Response Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF directly to response stream
    doc.pipe(res);

    const primaryColor = '#2563eb'; // Royal Blue
    const darkSlate = '#0f172a';
    const textGray = '#475569';
    const lightBg = '#f1f5f9';
    const greenColor = '#16a34a';
    const redColor = '#dc2626';

    // 1. BRAND HEADER BANNER
    doc.rect(0, 0, 595.28, 80).fill('#0f172a');

    // Logo icon & Text
    doc.roundedRect(40, 20, 36, 36, 8).fill('#2563eb');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('TP', 49, 30);

    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('TaxPal', 88, 22);
    doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text('Full-Stack Financial & Tax Management', 88, 44);

    // Right-aligned report label in banner
    doc.fillColor('#38bdf8').fontSize(11).font('Helvetica-Bold').text('FINANCIAL REPORT', 400, 26, { align: 'right', width: 155 });
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}`, 400, 42, { align: 'right', width: 155 });

    doc.moveDown(3);

    // 2. REPORT TITLE & USER META CARD
    const startY = 95;
    doc.roundedRect(40, startY, 515.28, 65, 8).fill(lightBg);

    doc.fillColor(darkSlate).fontSize(14).font('Helvetica-Bold').text(reportData.summary.reportTitle, 55, startY + 12);
    doc.fillColor(textGray).fontSize(9).font('Helvetica').text(`Period: ${reportData.summary.startDate} to ${reportData.summary.endDate} (${reportData.period.replace('_', ' ').toUpperCase()})`, 55, startY + 30);
    doc.text(`Prepared for: ${reportData.summary.user.name} • ${reportData.summary.user.email} • ${reportData.summary.user.country}`, 55, startY + 45);

    // 3. KPI SUMMARY CARDS (4 horizontal cards)
    const kpiY = startY + 75;
    const cardWidth = 120;
    const cardHeight = 55;
    const cardGap = 11.76;

    // Card 1: Total Income
    const c1X = 40;
    doc.roundedRect(c1X, kpiY, cardWidth, cardHeight, 6).fill('#ecfdf5');
    doc.roundedRect(c1X, kpiY, cardWidth, cardHeight, 6).lineWidth(1).stroke('#a7f3d0');
    doc.fillColor('#065f46').fontSize(8).font('Helvetica-Bold').text('TOTAL INCOME', c1X + 10, kpiY + 10);
    doc.fillColor(greenColor).fontSize(12).font('Helvetica-Bold').text(`$${formatCurrency(reportData.summary.totalIncome)}`, c1X + 10, kpiY + 26);

    // Card 2: Total Expenses
    const c2X = c1X + cardWidth + cardGap;
    doc.roundedRect(c2X, kpiY, cardWidth, cardHeight, 6).fill('#fef2f2');
    doc.roundedRect(c2X, kpiY, cardWidth, cardHeight, 6).lineWidth(1).stroke('#fecaca');
    doc.fillColor('#991b1b').fontSize(8).font('Helvetica-Bold').text('TOTAL EXPENSES', c2X + 10, kpiY + 10);
    doc.fillColor(redColor).fontSize(12).font('Helvetica-Bold').text(`$${formatCurrency(reportData.summary.totalExpenses)}`, c2X + 10, kpiY + 26);

    // Card 3: Net Savings
    const c3X = c2X + cardWidth + cardGap;
    const netBg = reportData.summary.netSavings >= 0 ? '#eff6ff' : '#fef2f2';
    const netStroke = reportData.summary.netSavings >= 0 ? '#bfdbfe' : '#fecaca';
    const netColor = reportData.summary.netSavings >= 0 ? primaryColor : redColor;

    doc.roundedRect(c3X, kpiY, cardWidth, cardHeight, 6).fill(netBg);
    doc.roundedRect(c3X, kpiY, cardWidth, cardHeight, 6).lineWidth(1).stroke(netStroke);
    doc.fillColor(darkSlate).fontSize(8).font('Helvetica-Bold').text('NET BALANCE', c3X + 10, kpiY + 10);
    doc.fillColor(netColor).fontSize(12).font('Helvetica-Bold').text(`$${formatCurrency(reportData.summary.netSavings)}`, c3X + 10, kpiY + 26);

    // Card 4: Savings Rate / Est. Tax
    const c4X = c3X + cardWidth + cardGap;
    doc.roundedRect(c4X, kpiY, cardWidth, cardHeight, 6).fill(lightBg);
    doc.roundedRect(c4X, kpiY, cardWidth, cardHeight, 6).lineWidth(1).stroke('#cbd5e1');
    doc.fillColor(darkSlate).fontSize(8).font('Helvetica-Bold').text('SAVINGS RATE', c4X + 10, kpiY + 10);
    doc.fillColor(darkSlate).fontSize(12).font('Helvetica-Bold').text(`${reportData.summary.savingsRate}%`, c4X + 10, kpiY + 26);

    // 4. CATEGORY BREAKDOWN TABLE
    let currentY = kpiY + cardHeight + 20;

    doc.fillColor(darkSlate).fontSize(12).font('Helvetica-Bold').text('Category Expense Breakdown', 40, currentY);
    currentY += 18;

    // Table Header
    doc.rect(40, currentY, 515.28, 22).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
    doc.text('Category', 50, currentY + 6, { width: 140 });
    doc.text('Total Spent', 200, currentY + 6, { width: 80, align: 'right' });
    doc.text('% Share', 290, currentY + 6, { width: 60, align: 'right' });
    doc.text('Budget Limit', 360, currentY + 6, { width: 80, align: 'right' });
    doc.text('Remaining / Status', 450, currentY + 6, { width: 95, align: 'right' });
    currentY += 22;

    if (reportData.expenseCategories && reportData.expenseCategories.length > 0) {
      reportData.expenseCategories.forEach((cat, idx) => {
        if (currentY > 740) {
          doc.addPage();
          currentY = 50;
        }

        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, currentY, 515.28, 20).fill(rowBg);

        doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica');
        doc.text(cat.category, 50, currentY + 5, { width: 140 });
        doc.text(`$${formatCurrency(cat.total)}`, 200, currentY + 5, { width: 80, align: 'right' });
        doc.text(`${cat.percentage}%`, 290, currentY + 5, { width: 60, align: 'right' });

        const budgetText = cat.budgetAmount > 0 ? `$${formatCurrency(cat.budgetAmount)}` : '—';
        doc.text(budgetText, 360, currentY + 5, { width: 80, align: 'right' });

        if (cat.budgetAmount > 0) {
          if (cat.isOverBudget) {
            doc.fillColor(redColor).font('Helvetica-Bold').text(`Over ($${formatCurrency(Math.abs(cat.remaining))})`, 450, currentY + 5, { width: 95, align: 'right' });
          } else {
            doc.fillColor(greenColor).font('Helvetica').text(`$${formatCurrency(cat.remaining)} left`, 450, currentY + 5, { width: 95, align: 'right' });
          }
        } else {
          doc.fillColor(textGray).font('Helvetica').text('No limit', 450, currentY + 5, { width: 95, align: 'right' });
        }

        currentY += 20;
      });
    } else {
      doc.rect(40, currentY, 515.28, 25).fill('#ffffff');
      doc.fillColor(textGray).fontSize(9).font('Helvetica-Oblique').text('No expense records in selected period.', 50, currentY + 8);
      currentY += 25;
    }

    currentY += 15;

    // 5. TRANSACTION STATEMENT TABLE
    if (currentY > 650) {
      doc.addPage();
      currentY = 50;
    }

    doc.fillColor(darkSlate).fontSize(12).font('Helvetica-Bold').text('Recent Transaction Records', 40, currentY);
    currentY += 18;

    // Table Header
    doc.rect(40, currentY, 515.28, 22).fill('#334155');
    doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
    doc.text('Date', 50, currentY + 6, { width: 65 });
    doc.text('Description', 120, currentY + 6, { width: 170 });
    doc.text('Category', 300, currentY + 6, { width: 100 });
    doc.text('Type', 410, currentY + 6, { width: 50 });
    doc.text('Amount', 470, currentY + 6, { width: 75, align: 'right' });
    currentY += 22;

    const sampleTransactions = reportData.transactions.slice(0, 25);

    if (sampleTransactions.length > 0) {
      sampleTransactions.forEach((tx, idx) => {
        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
        }

        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, currentY, 515.28, 19).fill(rowBg);

        const txDateStr = new Date(tx.date).toISOString().split('T')[0];
        doc.fillColor(textGray).fontSize(8).font('Helvetica').text(txDateStr, 50, currentY + 5, { width: 65 });
        doc.fillColor(darkSlate).text(tx.description.substring(0, 32), 120, currentY + 5, { width: 170 });
        doc.fillColor(textGray).text(tx.category.substring(0, 20), 300, currentY + 5, { width: 100 });

        const isIncome = tx.type === 'income';
        doc.fillColor(isIncome ? greenColor : textGray).font('Helvetica-Bold').text(tx.type.toUpperCase(), 410, currentY + 5, { width: 50 });

        const amountStr = `${isIncome ? '+' : '-'}$${formatCurrency(tx.amount)}`;
        doc.fillColor(isIncome ? greenColor : redColor).text(amountStr, 470, currentY + 5, { width: 75, align: 'right' });

        currentY += 19;
      });
    } else {
      doc.rect(40, currentY, 515.28, 25).fill('#ffffff');
      doc.fillColor(textGray).fontSize(9).font('Helvetica-Oblique').text('No transaction records found.', 50, currentY + 8);
      currentY += 25;
    }

    // 6. PAGE NUMBERING & FOOTER (Applied to all pages)
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.rect(40, 800, 515.28, 0.5).fill('#cbd5e1');
      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text(
        `TaxPal Financial Management • Confidential Financial Document • Page ${i + 1} of ${range.count}`,
        40,
        810,
        { align: 'center', width: 515.28 }
      );
    }

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF report',
        error: error.message,
      });
    }
  }
};

// @desc    Download saved report in requested format
// @route   GET /api/reports/:id/download
// @access  Private
exports.downloadSavedReport = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user.id });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const requestedFormat = (req.query.format || report.format || 'PDF').toUpperCase();

    // Attach report parameters and call appropriate export function
    req.body = {
      reportType: report.reportType,
      period: report.period,
      startDate: report.startDate,
      endDate: report.endDate,
    };

    if (requestedFormat === 'CSV') {
      return exports.exportCsv(req, res);
    } else {
      return exports.exportPdf(req, res);
    }
  } catch (error) {
    console.error('Error downloading saved report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download saved report',
      error: error.message,
    });
  }
};
