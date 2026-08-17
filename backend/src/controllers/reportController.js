const mongoose = require('mongoose');
const Report = require('../models/report.model');
const Transaction = require('../models/Transaction.model');
const Budget = require('../models/budgets.model');
const User = require('../models/User.model');
const TaxEstimate = require('../models/taxEstimates.model');
const PDFDocument = require('pdfkit');

// Maps a user's registered country to the correct currency symbol
const getCurrencySymbol = (country) => {
  const map = {
    'United States': '$',
    'India': '\u20b9',
    'United Kingdom': '\u00a3',
    'European Union': '\u20ac',
    'Germany': '\u20ac',
    'Japan': '\u00a5',
    'Canada': 'CA$',
    'Australia': 'A$',
    'Singapore': 'S$',
    'United Arab Emirates': 'AED ',
    'UAE': 'AED ',
  };
  return map[country ? country.trim() : ''] || '$';
};

const getDatesForPeriod = (period) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  const periodStr = (period || '').toLowerCase();

  if (periodStr.includes('current_month') || periodStr.includes('current month')) {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (periodStr.includes('last_month') || periodStr.includes('last month')) {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (periodStr.includes('q1') || periodStr.includes('quarter 1')) {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 3, 0, 23, 59, 59, 999);
  } else if (periodStr.includes('q2') || periodStr.includes('quarter 2')) {
    startDate = new Date(now.getFullYear(), 3, 1);
    endDate = new Date(now.getFullYear(), 6, 0, 23, 59, 59, 999);
  } else if (periodStr.includes('q3') || periodStr.includes('quarter 3')) {
    startDate = new Date(now.getFullYear(), 6, 1);
    endDate = new Date(now.getFullYear(), 9, 0, 23, 59, 59, 999);
  } else if (periodStr.includes('q4') || periodStr.includes('quarter 4')) {
    startDate = new Date(now.getFullYear(), 9, 1);
    endDate = new Date(now.getFullYear(), 12, 0, 23, 59, 59, 999);
  } else if (periodStr.includes('year') || periodStr.includes('ytd')) {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { startDate, endDate };
};

const calculateReportSnapshot = async (userId, startDate, endDate, reportType, period) => {
  const transactions = await Transaction.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });

  let totalIncome = 0;
  let totalExpenses = 0;
  const incomeCategoryMap = new Map();
  const expenseCategoryMap = new Map();

  transactions.forEach(t => {
    const amt = t.amount || 0;
    if (t.type === 'income') {
      totalIncome += amt;
      incomeCategoryMap.set(t.category, (incomeCategoryMap.get(t.category) || 0) + amt);
    } else if (t.type === 'expense') {
      totalExpenses += amt;
      expenseCategoryMap.set(t.category, (expenseCategoryMap.get(t.category) || 0) + amt);
    }
  });

  const net = totalIncome - totalExpenses;

  const incomeBreakdown = [...incomeCategoryMap.entries()].map(([category, amount]) => ({
    category,
    amount,
    percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
  })).sort((a, b) => b.amount - a.amount);

  const expenseBreakdown = [...expenseCategoryMap.entries()].map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
  })).sort((a, b) => b.amount - a.amount);

  // Budget comparison calculation
  const allBudgets = await Budget.find({ userId });
  const rangeStartMonth = startDate.toISOString().slice(0, 7);
  const relevantBudgets = allBudgets.filter(b => {
    if (!b.month) return false;
    return b.month >= rangeStartMonth && b.month <= endDate.toISOString().slice(0, 7);
  });

  const budgetCategoryTotals = new Map();
  relevantBudgets.forEach(b => {
    const budgeted = b.budget_amount || 0;
    const spent = expenseCategoryMap.get(b.category) || 0;
    const existing = budgetCategoryTotals.get(b.category);
    if (existing) {
      existing.budgeted += budgeted;
      existing.remaining = existing.budgeted - existing.spent;
    } else {
      budgetCategoryTotals.set(b.category, {
        category: b.category,
        budgeted,
        spent,
        remaining: budgeted - spent
      });
    }
  });
  const budgetComparison = [...budgetCategoryTotals.values()].sort((a, b) => b.budgeted - a.budgeted);

  // Tax estimate calculation
  const taxEstimates = await TaxEstimate.find({ userId });
  let estimatedTax = 0;
  let estimatedTaxNote = '';

  const periodLower = (period || '').toLowerCase();
  let matchedQuarter = '';
  if (periodLower.includes('q1')) matchedQuarter = 'Q1';
  else if (periodLower.includes('q2')) matchedQuarter = 'Q2';
  else if (periodLower.includes('q3')) matchedQuarter = 'Q3';
  else if (periodLower.includes('q4')) matchedQuarter = 'Q4';

  if (matchedQuarter) {
    const matched = taxEstimates.find(e => (e.quarter || '').toUpperCase() === matchedQuarter);
    if (matched) {
      estimatedTax = matched.estimatedTax || 0;
      estimatedTaxNote = 'Based on your saved Tax Estimator figures for this quarter.';
    } else {
      estimatedTax = Math.max(0, net) * 0.25;
      estimatedTaxNote = 'Approximate figure (25% of net income). Visit Tax Estimator for a precise calculation.';
    }
  } else if (taxEstimates.length > 0) {
    estimatedTax = taxEstimates.reduce((acc, curr) => acc + (curr.estimatedTax || 0), 0);
    estimatedTaxNote = 'Aggregated from your saved quarterly Tax Estimator entries.';
  } else {
    estimatedTax = Math.max(0, net) * 0.25;
    estimatedTaxNote = 'Approximate figure (25% of net income). Visit Tax Estimator for a precise calculation.';
  }

  const formattedTransactions = transactions.map(t => ({
    id: t._id ? t._id.toString() : t.id,
    userId: t.userId ? t.userId.toString() : '',
    type: t.type,
    description: t.description || '',
    category: t.category || '',
    amount: t.amount || 0,
    date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
    notes: t.notes || ''
  }));

  return {
    totalIncome,
    totalExpenses,
    net,
    incomeBreakdown,
    expenseBreakdown,
    budgetComparison,
    estimatedTax,
    estimatedTaxNote,
    transactions: formattedTransactions
  };
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id }).sort({ generatedDate: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error fetching reports' });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { reportType, period, format, name: customName } = req.body;
    if (!reportType || !period || !format) {
      return res.status(400).json({ message: 'reportType, period, and format are required fields.' });
    }

    const { startDate, endDate } = getDatesForPeriod(period);
    const name = customName || `${reportType} - ${period}`;

    const dataSnapshot = await calculateReportSnapshot(req.user.id, startDate, endDate, reportType, period);

    const report = new Report({
      userId: req.user.id,
      reportType,
      period,
      format,
      name,
      startDate,
      endDate,
      data: dataSnapshot
    });

    report.filePath = `/api/reports/download/${report._id}`;
    await report.save();

    res.status(201).json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Server error generating report', error: error.message });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.user.id).select('country');
    const currencySymbol = getCurrencySymbol(user ? user.country : '');

    // Get snapshot data or fallback to live query
    let data = report.data;
    if (!data || Object.keys(data).length === 0) {
      data = await calculateReportSnapshot(req.user.id, report.startDate, report.endDate, report.reportType, report.period);
    }

    if (report.format === 'PDF') {
      const doc = new PDFDocument({ margin: 40 });
      let filename = `${report.name.replace(/\s+/g, '_')}.pdf`;
      filename = encodeURIComponent(filename);

      res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-type', 'application/pdf');

      doc.pipe(res);

      const marginX = 40;
      let y = 40;

      // Header Brand
      doc.fontSize(20).fillColor('#1a73e8').text('TaxPal Financial Report', marginX, y);
      y += 28;
      doc.fontSize(14).fillColor('#1e293b').text(report.name, marginX, y);
      y += 18;
      doc.fontSize(10).fillColor('#64748b').text(`Period: ${report.period}   |   Generated: ${new Date(report.generatedDate).toLocaleDateString()}`, marginX, y);
      y += 25;

      doc.moveTo(marginX, y).lineTo(550, y).strokeColor('#cbd5e1').stroke();
      y += 15;

      // Summary Section
      doc.fontSize(13).fillColor('#0f172a').text('Summary', marginX, y);
      y += 18;

      doc.fontSize(10).fillColor('#334155');
      doc.text(`Total Income: ${currencySymbol}${(data.totalIncome || 0).toFixed(2)}`, marginX, y); y += 15;
      doc.text(`Total Expenses: ${currencySymbol}${(data.totalExpenses || 0).toFixed(2)}`, marginX, y); y += 15;
      doc.text(`Net Income: ${currencySymbol}${(data.net || 0).toFixed(2)}`, marginX, y); y += 15;
      if (data.estimatedTax !== undefined) {
        doc.text(`Estimated Tax: ${currencySymbol}${(data.estimatedTax || 0).toFixed(2)}`, marginX, y); y += 15;
      }
      y += 15;

      const ensureSpace = (needed = 40) => {
        if (y + needed > 750) {
          doc.addPage();
          y = 40;
        }
      };

      // Income Breakdown
      if (data.incomeBreakdown && data.incomeBreakdown.length > 0) {
        ensureSpace(50);
        doc.fontSize(12).fillColor('#0f172a').text('Income by Category', marginX, y);
        y += 16;
        doc.fontSize(9).fillColor('#475569');
        data.incomeBreakdown.forEach(row => {
          ensureSpace(16);
          doc.text(`${row.category}`, marginX, y);
          doc.text(`${currencySymbol}${row.amount.toFixed(2)} (${row.percentage.toFixed(1)}%)`, marginX + 300, y);
          y += 14;
        });
        y += 15;
      }

      // Expense Breakdown
      if (data.expenseBreakdown && data.expenseBreakdown.length > 0) {
        ensureSpace(50);
        doc.fontSize(12).fillColor('#0f172a').text('Expenses by Category', marginX, y);
        y += 16;
        doc.fontSize(9).fillColor('#475569');
        data.expenseBreakdown.forEach(row => {
          ensureSpace(16);
          doc.text(`${row.category}`, marginX, y);
          doc.text(`${currencySymbol}${row.amount.toFixed(2)} (${row.percentage.toFixed(1)}%)`, marginX + 300, y);
          y += 14;
        });
        y += 15;
      }

      // Budget Comparison
      if (data.budgetComparison && data.budgetComparison.length > 0) {
        ensureSpace(50);
        doc.fontSize(12).fillColor('#0f172a').text('Budget vs Actual Performance', marginX, y);
        y += 16;
        doc.fontSize(9).fillColor('#475569');
        data.budgetComparison.forEach(row => {
          ensureSpace(16);
          const status = row.spent > row.budgeted ? '[Exceeded]' : '[On Track]';
          doc.text(`${row.category}`, marginX, y);
          doc.text(`Budgeted: ${currencySymbol}${row.budgeted.toFixed(2)} | Spent: ${currencySymbol}${row.spent.toFixed(2)} ${status}`, marginX + 180, y);
          y += 14;
        });
        y += 15;
      }

      // Transactions
      if (data.transactions && data.transactions.length > 0) {
        ensureSpace(60);
        doc.fontSize(12).fillColor('#0f172a').text('Transactions', marginX, y);
        y += 18;

        doc.fontSize(9).fillColor('#1e293b');
        doc.text('Date', marginX, y);
        doc.text('Category', marginX + 80, y);
        doc.text('Description', marginX + 200, y);
        doc.text('Amount', marginX + 420, y);
        y += 14;

        doc.fontSize(8).fillColor('#475569');
        data.transactions.forEach(t => {
          ensureSpace(16);
          const sign = t.type === 'income' ? '+' : '-';
          doc.text(t.date || '', marginX, y);
          doc.text((t.category || '').slice(0, 20), marginX + 80, y);
          doc.text((t.description || '').slice(0, 35), marginX + 200, y);
          doc.text(`${sign}${currencySymbol}${(t.amount || 0).toFixed(2)}`, marginX + 420, y);
          y += 14;
        });
      }

      doc.end();
    } else if (report.format === 'CSV') {
      const csvLines = [];
      csvLines.push('TaxPal Financial Report');
      csvLines.push(`Report Name,${report.name}`);
      csvLines.push(`Report Type,${report.reportType}`);
      csvLines.push(`Period,${report.period}`);
      csvLines.push(`Generated,${new Date(report.generatedDate).toLocaleDateString()}`);
      csvLines.push('');

      csvLines.push('SUMMARY');
      csvLines.push(`Total Income,${(data.totalIncome || 0).toFixed(2)}`);
      csvLines.push(`Total Expenses,${(data.totalExpenses || 0).toFixed(2)}`);
      csvLines.push(`Net Income,${(data.net || 0).toFixed(2)}`);
      if (data.estimatedTax !== undefined) {
        csvLines.push(`Estimated Tax,${(data.estimatedTax || 0).toFixed(2)}`);
      }
      csvLines.push('');

      if (data.incomeBreakdown && data.incomeBreakdown.length > 0) {
        csvLines.push('INCOME BY CATEGORY', 'Category,Amount,Percentage');
        data.incomeBreakdown.forEach(r => csvLines.push(`"${r.category}",${r.amount.toFixed(2)},${r.percentage.toFixed(1)}%`));
        csvLines.push('');
      }

      if (data.expenseBreakdown && data.expenseBreakdown.length > 0) {
        csvLines.push('EXPENSES BY CATEGORY', 'Category,Amount,Percentage');
        data.expenseBreakdown.forEach(r => csvLines.push(`"${r.category}",${r.amount.toFixed(2)},${r.percentage.toFixed(1)}%`));
        csvLines.push('');
      }

      if (data.budgetComparison && data.budgetComparison.length > 0) {
        csvLines.push('BUDGET VS ACTUAL', 'Category,Budgeted,Spent,Remaining');
        data.budgetComparison.forEach(r => csvLines.push(`"${r.category}",${r.budgeted.toFixed(2)},${r.spent.toFixed(2)},${r.remaining.toFixed(2)}`));
        csvLines.push('');
      }

      if (data.transactions && data.transactions.length > 0) {
        csvLines.push('TRANSACTIONS', 'Date,Type,Category,Description,Amount');
        data.transactions.forEach(t => {
          csvLines.push(`${t.date},${t.type},"${t.category}","${(t.description || '').replace(/"/g, '""')}",${(t.amount || 0).toFixed(2)}`);
        });
      }

      const csvContent = csvLines.join('\n');

      let filename = `${report.name.replace(/\s+/g, '_')}.csv`;
      res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-type', 'text/csv');
      res.send(csvContent);
    } else {
      res.status(400).json({ message: 'Invalid report format' });
    }

  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ message: 'Server error downloading report', error: error.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    let report = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      report = await Report.findOneAndDelete({ _id: id, userId: req.user.id });
    }

    if (!report) {
      report = await Report.findOneAndDelete({ userId: req.user.id, name: id });
    }

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Server error deleting report', error: error.message });
  }
};
