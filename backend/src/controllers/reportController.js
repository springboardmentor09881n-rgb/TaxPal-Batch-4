const mongoose = require('mongoose');
const Report = require('../models/report.model');
const Transaction = require('../models/Transaction.model');
const Budget = require('../models/budgets.model');
const User = require('../models/User.model');
const TaxEstimate = require('../models/taxEstimates.model');
const PDFDocument = require('pdfkit');

// Maps a user's registered country to PDF-safe and CSV-safe currency details
const getCurrencyDetails = (country) => {
  const normalized = country ? country.trim() : '';
  const map = {
    'United States': { pdf: '$', csv: '$', code: 'USD' },
    'India': { pdf: 'INR ', csv: '₹', code: 'INR' },
    'United Kingdom': { pdf: 'GBP ', csv: '£', code: 'GBP' },
    'European Union': { pdf: 'EUR ', csv: '€', code: 'EUR' },
    'Germany': { pdf: 'EUR ', csv: '€', code: 'EUR' },
    'Japan': { pdf: 'JPY ', csv: '¥', code: 'JPY' },
    'Canada': { pdf: 'CA$', csv: 'CA$', code: 'CAD' },
    'Australia': { pdf: 'A$', csv: 'A$', code: 'AUD' },
    'Singapore': { pdf: 'S$', csv: 'S$', code: 'SGD' },
    'United Arab Emirates': { pdf: 'AED ', csv: 'AED ', code: 'AED' },
    'UAE': { pdf: 'AED ', csv: 'AED ', code: 'AED' },
  };
  return map[normalized] || { pdf: '$', csv: '$', code: 'USD' };
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

  const budgetComparison = [...budgetCategoryTotals.values()];

  // Estimate tax if tax summary report
  let estimatedTax;
  let estimatedTaxNote;
  let deductionsBreakdown;
  let taxCalculations;

  if ((reportType || '').toLowerCase().includes('tax')) {
    const userEsts = await TaxEstimate.find({ userId }).sort({ createdAt: -1 });
    const periodLower = (period || '').toLowerCase();
    const matchedEst = userEsts.find(e => {
      const q = (e.quarter || '').toLowerCase();
      return periodLower.includes(q) || (q && periodLower.includes(q.replace('q', 'quarter ')));
    }) || (userEsts.length > 0 ? userEsts[0] : null);

    const businessExpenses = matchedEst ? (matchedEst.businessExpenses || 0) : totalExpenses;
    const retirement = matchedEst ? (matchedEst.retirementContributions || 0) : 0;
    const healthInsurance = matchedEst ? (matchedEst.healthInsurancePremiums || 0) : 0;
    const homeOffice = matchedEst ? (matchedEst.homeOfficeDeductions || 0) : 0;
    const totalDeductions = businessExpenses + retirement + healthInsurance + homeOffice;

    estimatedTax = matchedEst ? matchedEst.estimatedTax : Math.max(0, net * 0.25);
    estimatedTaxNote = matchedEst ? `Based on saved estimate for ${matchedEst.quarter}` : 'Estimated at ~25% benchmark rate';

    deductionsBreakdown = {
      businessExpenses,
      retirement,
      healthInsurance,
      homeOffice,
      totalDeductions
    };

    const nationalTax = estimatedTax * 0.70;
    const stateTax = estimatedTax * 0.30;
    const effectiveTaxRate = totalIncome > 0 ? (estimatedTax / totalIncome) * 100 : 0;
    const dueDate = matchedEst?.dueDate ? new Date(matchedEst.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Quarterly Due Date';

    taxCalculations = {
      grossIncome: totalIncome,
      totalDeductions,
      taxableIncome: Math.max(0, totalIncome - totalDeductions),
      estimatedTax,
      nationalTax,
      stateTax,
      effectiveTaxRate,
      dueDate
    };
  }

  return {
    totalIncome,
    totalExpenses,
    net,
    incomeBreakdown,
    expenseBreakdown,
    budgetComparison,
    transactions: transactions.map(t => ({
      date: t.date ? new Date(t.date).toISOString().slice(0, 10) : '',
      type: t.type,
      category: t.category,
      description: t.description,
      amount: t.amount
    })),
    estimatedTax,
    estimatedTaxNote,
    deductionsBreakdown,
    taxCalculations
  };
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error fetching reports' });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { reportType, period, format, name } = req.body;

    if (!reportType || !period || !format) {
      return res.status(400).json({ message: 'reportType, period, and format are required' });
    }

    const { startDate, endDate } = getDatesForPeriod(period);
    const dataSnapshot = await calculateReportSnapshot(req.user.id, startDate, endDate, reportType, period);

    const report = new Report({
      userId: req.user.id,
      reportType,
      period,
      format,
      name: name || `${reportType} (${period})`,
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
    const currency = getCurrencyDetails(user ? user.country : '');

    // Always compute fresh snapshot data so downloads always reflect latest data and breakdown structures
    const data = await calculateReportSnapshot(req.user.id, report.startDate, report.endDate, report.reportType, report.period);

    // Set anti-caching headers so browser never serves stale downloaded files
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const rawType = (report.reportType || '').toLowerCase();
    const isBudgetReport = rawType.includes('budget');
    const isTaxReport = rawType.includes('tax');
    const isIncomeReport = !isBudgetReport && !isTaxReport;
    const formatUpper = (report.format || 'PDF').toUpperCase();

    if (formatUpper === 'PDF') {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      let filename = `${report.name.replace(/\s+/g, '_')}.pdf`;
      filename = encodeURIComponent(filename);

      res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-type', 'application/pdf');

      doc.pipe(res);

      const marginX = 40;
      const pageWidth = 515; // A4 width (595) minus 80 margins
      let y = 40;

      const ensureSpace = (needed = 40) => {
        if (y + needed > 750) {
          doc.addPage();
          y = 40;
        }
      };

      const drawSectionHeader = (title) => {
        ensureSpace(45);
        doc.fontSize(11).fillColor('#0f172a').text(title.toUpperCase(), marginX, y);
        y += 16;
      };

      const drawTableHeader = (cols) => {
        ensureSpace(30);
        doc.rect(marginX, y, pageWidth, 20).fill('#f1f5f9');
        doc.fontSize(8).fillColor('#475569');
        cols.forEach(col => {
          doc.text(col.text, marginX + col.x, y + 5, { width: col.w, align: col.align || 'left' });
        });
        y += 24;
      };

      const drawStatusBadge = (status, x, yPos) => {
        const isTrack = status === 'On Track';
        const bg = isTrack ? '#dcfce7' : '#fee2e2';
        const fg = isTrack ? '#15803d' : '#b91c1c';
        const bw = 65;
        const bh = 14;
        doc.roundedRect(x, yPos - 2, bw, bh, 7).fill(bg);
        doc.fontSize(7).fillColor(fg).text(status, x, yPos + 1, { width: bw, align: 'center' });
      };

      // --- BRAND HEADER ---
      doc.fontSize(22).fillColor('#1a73e8').text('TaxPal', marginX, y, { continued: true });
      doc.fontSize(14).fillColor('#64748b').text('  Financial Report');
      y += 26;

      doc.fontSize(15).fillColor('#0f172a').text(report.name, marginX, y);
      y += 18;

      doc.fontSize(9).fillColor('#64748b').text(`Period: ${report.period}   |   Generated: ${new Date(report.generatedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, marginX, y);
      y += 22;

      doc.moveTo(marginX, y).lineTo(marginX + pageWidth, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
      y += 20;

      if (isIncomeReport) {
        // --- INCOME STATEMENT PDF ---
        const totalInc = data.totalIncome || 0;
        const totalExp = data.totalExpenses || 0;
        const netInc = data.net || 0;

        // Metric Cards (3 Cards)
        const cardW = 162;
        const cardH = 48;
        const gap = 14;

        const metrics = [
          { label: 'TOTAL INCOME', val: `${currency.pdf}${totalInc.toFixed(2)}`, color: '#16a34a' },
          { label: 'TOTAL EXPENSES', val: `${currency.pdf}${totalExp.toFixed(2)}`, color: '#dc2626' },
          { label: 'NET INCOME', val: `${currency.pdf}${netInc.toFixed(2)}`, color: netInc >= 0 ? '#16a34a' : '#dc2626' }
        ];

        metrics.forEach((m, idx) => {
          const cx = marginX + idx * (cardW + gap);
          doc.roundedRect(cx, y, cardW, cardH, 6).fillAndStroke('#f8fafc', '#e2e8f0');
          doc.fontSize(7.5).fillColor('#64748b').text(m.label, cx + 10, y + 8);
          doc.fontSize(12).fillColor(m.color).text(m.val, cx + 10, y + 23, { width: cardW - 20 });
        });
        y += cardH + 24;

        // Income Breakdown Table
        if (data.incomeBreakdown && data.incomeBreakdown.length > 0) {
          drawSectionHeader('Income Breakdown by Category');
          drawTableHeader([
            { text: 'CATEGORY', x: 10, w: 250, align: 'left' },
            { text: 'AMOUNT', x: 270, w: 120, align: 'right' },
            { text: 'SHARE', x: 400, w: 100, align: 'right' }
          ]);

          data.incomeBreakdown.forEach((row, i) => {
            ensureSpace(20);
            if (i % 2 === 1) {
              doc.rect(marginX, y - 2, pageWidth, 18).fill('#f8fafc');
            }
            doc.fontSize(8.5).fillColor('#334155');
            doc.text(row.category || '', marginX + 10, y + 2, { width: 250 });
            doc.text(`${currency.pdf}${row.amount.toFixed(2)}`, marginX + 270, y + 2, { width: 120, align: 'right' });
            doc.text(`${row.percentage.toFixed(1)}%`, marginX + 400, y + 2, { width: 100, align: 'right' });
            y += 18;
          });
          y += 16;
        }

        // Expense Breakdown Table
        if (data.expenseBreakdown && data.expenseBreakdown.length > 0) {
          drawSectionHeader('Expense Breakdown by Category');
          drawTableHeader([
            { text: 'CATEGORY', x: 10, w: 250, align: 'left' },
            { text: 'AMOUNT', x: 270, w: 120, align: 'right' },
            { text: 'SHARE', x: 400, w: 100, align: 'right' }
          ]);

          data.expenseBreakdown.forEach((row, i) => {
            ensureSpace(20);
            if (i % 2 === 1) {
              doc.rect(marginX, y - 2, pageWidth, 18).fill('#f8fafc');
            }
            doc.fontSize(8.5).fillColor('#334155');
            doc.text(row.category || '', marginX + 10, y + 2, { width: 250 });
            doc.text(`${currency.pdf}${row.amount.toFixed(2)}`, marginX + 270, y + 2, { width: 120, align: 'right' });
            doc.text(`${row.percentage.toFixed(1)}%`, marginX + 400, y + 2, { width: 100, align: 'right' });
            y += 18;
          });
          y += 16;
        }

        // Transactions List Table
        if (data.transactions && data.transactions.length > 0) {
          drawSectionHeader('Transactions for Period');
          drawTableHeader([
            { text: 'DATE', x: 10, w: 80, align: 'left' },
            { text: 'CATEGORY', x: 95, w: 140, align: 'left' },
            { text: 'DESCRIPTION', x: 240, w: 160, align: 'left' },
            { text: 'AMOUNT', x: 405, w: 100, align: 'right' }
          ]);

          data.transactions.forEach((t, i) => {
            ensureSpace(20);
            if (i % 2 === 1) {
              doc.rect(marginX, y - 2, pageWidth, 18).fill('#f8fafc');
            }
            const sign = t.type === 'income' ? '+' : '-';
            const amtColor = t.type === 'income' ? '#16a34a' : '#dc2626';

            doc.fontSize(8).fillColor('#475569');
            doc.text(t.date || '', marginX + 10, y + 2, { width: 80 });
            doc.text((t.category || '').slice(0, 22), marginX + 95, y + 2, { width: 140 });
            doc.text((t.description || '').slice(0, 28), marginX + 240, y + 2, { width: 160 });
            doc.fillColor(amtColor).text(`${sign}${currency.pdf}${(t.amount || 0).toFixed(2)}`, marginX + 405, y + 2, { width: 100, align: 'right' });
            y += 18;
          });
        }

      } else if (isBudgetReport) {
        // --- BUDGET PERFORMANCE PDF ---
        const budgetRows = data.budgetComparison || [];
        const totalLimit = budgetRows.reduce((s, b) => s + (b.budgeted || 0), 0);
        const totalSpent = budgetRows.reduce((s, b) => s + (b.spent || 0), 0);
        const remainingBalance = totalLimit - totalSpent;
        const overBudget = totalSpent > totalLimit;

        // Metric Cards (3 Cards)
        const cardW = 162;
        const cardH = 48;
        const gap = 14;

        const metrics = [
          { label: 'TOTAL LIMIT', val: `${currency.pdf}${totalLimit.toFixed(2)}`, color: '#0f172a' },
          { label: 'TOTAL ACTUAL SPENT', val: `${currency.pdf}${totalSpent.toFixed(2)}`, color: '#dc2626' },
          { label: 'REMAINING BALANCE', val: `${currency.pdf}${remainingBalance.toFixed(2)}`, color: remainingBalance >= 0 ? '#16a34a' : '#dc2626' }
        ];

        metrics.forEach((m, idx) => {
          const cx = marginX + idx * (cardW + gap);
          doc.roundedRect(cx, y, cardW, cardH, 6).fillAndStroke('#f8fafc', '#e2e8f0');
          doc.fontSize(7.5).fillColor('#64748b').text(m.label, cx + 10, y + 8);
          doc.fontSize(12).fillColor(m.color).text(m.val, cx + 10, y + 23, { width: cardW - 20 });
        });
        y += cardH + 16;

        // Overall Status Banner
        ensureSpace(35);
        const bannerBg = overBudget ? '#fef2f2' : '#f0fdf4';
        const bannerBorder = overBudget ? '#fca5a5' : '#bbf7d0';
        const bannerFg = overBudget ? '#991b1b' : '#166534';
        const bannerText = overBudget
          ? 'OVERALL BUDGET LIMIT EXCEEDED: Total actual expenses have surpassed allocated budget limits.'
          : 'WITHIN BUDGET LIMITS: Total actual expenses are within total allocated budget limits.';

        doc.roundedRect(marginX, y, pageWidth, 28, 5).fillAndStroke(bannerBg, bannerBorder);
        doc.fontSize(8.5).fillColor(bannerFg).text(bannerText, marginX + 12, y + 8, { width: pageWidth - 24 });
        y += 40;

        // Category Performance Grid Table
        if (budgetRows.length > 0) {
          drawSectionHeader('Category Performance Grid');
          drawTableHeader([
            { text: 'CATEGORY', x: 10, w: 140, align: 'left' },
            { text: 'BUDGET LIMIT', x: 155, w: 90, align: 'right' },
            { text: 'ACTUAL SPENT', x: 250, w: 90, align: 'right' },
            { text: 'VARIANCE', x: 345, w: 85, align: 'right' },
            { text: 'STATUS', x: 440, w: 65, align: 'center' }
          ]);

          budgetRows.forEach((row, i) => {
            ensureSpace(20);
            if (i % 2 === 1) {
              doc.rect(marginX, y - 2, pageWidth, 20).fill('#f8fafc');
            }
            const status = row.spent > row.budgeted ? 'Exceeded' : 'On Track';
            const varColor = row.remaining >= 0 ? '#16a34a' : '#dc2626';

            doc.fontSize(8.5).fillColor('#334155');
            doc.text(row.category || '', marginX + 10, y + 3, { width: 140 });
            doc.text(`${currency.pdf}${(row.budgeted || 0).toFixed(2)}`, marginX + 155, y + 3, { width: 90, align: 'right' });
            doc.text(`${currency.pdf}${(row.spent || 0).toFixed(2)}`, marginX + 250, y + 3, { width: 90, align: 'right' });
            doc.fillColor(varColor).text(`${currency.pdf}${(row.remaining || 0).toFixed(2)}`, marginX + 345, y + 3, { width: 85, align: 'right' });

            drawStatusBadge(status, marginX + 440, y + 3);
            y += 20;
          });
        }

      } else if (isTaxReport) {
        // --- TAX SUMMARY PDF ---
        const deductions = data.deductionsBreakdown || {
          businessExpenses: data.totalExpenses || 0,
          retirement: 0,
          healthInsurance: 0,
          homeOffice: 0,
          totalDeductions: data.totalExpenses || 0
        };
        const grossInc = data.totalIncome || 0;
        const totalDed = deductions.totalDeductions;
        const taxableInc = Math.max(0, grossInc - totalDed);
        const estTax = data.estimatedTax ?? Math.max(0, (data.net || 0) * 0.25);
        const fedTax = estTax * 0.70;
        const stateTax = estTax * 0.30;
        const effRate = grossInc > 0 ? (estTax / grossInc) * 100 : 0;
        const taxCalcs = data.taxCalculations || {
          nationalTax: fedTax,
          stateTax: stateTax,
          effectiveTaxRate: effRate,
          dueDate: 'Quarterly Due Date'
        };

        // Metric Cards (4 Cards)
        const cardW = 118;
        const cardH = 48;
        const gap = 14;

        const metrics = [
          { label: 'GROSS INCOME', val: `${currency.pdf}${grossInc.toFixed(2)}`, color: '#0f172a' },
          { label: 'DEDUCTIONS', val: `${currency.pdf}${totalDed.toFixed(2)}`, color: '#0f172a' },
          { label: 'TAXABLE INCOME', val: `${currency.pdf}${taxableInc.toFixed(2)}`, color: '#0f172a' },
          { label: 'ESTIMATED TAX', val: `${currency.pdf}${estTax.toFixed(2)}`, color: '#1a73e8' }
        ];

        metrics.forEach((m, idx) => {
          const cx = marginX + idx * (cardW + gap);
          doc.roundedRect(cx, y, cardW, cardH, 6).fillAndStroke('#f8fafc', '#e2e8f0');
          doc.fontSize(7).fillColor('#64748b').text(m.label, cx + 8, y + 8);
          doc.fontSize(11).fillColor(m.color).text(m.val, cx + 8, y + 23, { width: cardW - 16 });
        });
        y += cardH + 24;

        // Deductions Breakdown Table
        drawSectionHeader('Deductions Breakdown Detail');
        drawTableHeader([
          { text: 'DEDUCTION TYPE', x: 10, w: 300, align: 'left' },
          { text: 'AMOUNT', x: 320, w: 180, align: 'right' }
        ]);

        const deductionRows = [
          { name: 'Business Expenses', val: deductions.businessExpenses },
          { name: 'Retirement Contributions', val: deductions.retirement },
          { name: 'Health Insurance Premiums', val: deductions.healthInsurance },
          { name: 'Home Office Deduction', val: deductions.homeOffice }
        ];

        deductionRows.forEach((d, i) => {
          ensureSpace(20);
          if (i % 2 === 1) {
            doc.rect(marginX, y - 2, pageWidth, 18).fill('#f8fafc');
          }
          doc.fontSize(8.5).fillColor('#334155');
          doc.text(d.name, marginX + 10, y + 2, { width: 300 });
          doc.text(`${currency.pdf}${d.val.toFixed(2)}`, marginX + 320, y + 2, { width: 180, align: 'right' });
          y += 18;
        });
        y += 16;

        // Tax Calculations & Projections Table
        drawSectionHeader('Tax Calculations & Projections');
        drawTableHeader([
          { text: 'METRIC / ESTIMATION', x: 10, w: 300, align: 'left' },
          { text: 'VALUE', x: 320, w: 180, align: 'right' }
        ]);

        const taxRows = [
          { name: 'National Tax Estimation', val: `${currency.pdf}${taxCalcs.nationalTax.toFixed(2)}` },
          { name: 'State Tax Estimation', val: `${currency.pdf}${taxCalcs.stateTax.toFixed(2)}` },
          { name: 'Effective Tax Rate', val: `${taxCalcs.effectiveTaxRate.toFixed(2)}%` },
          { name: 'Target Payment Due Date', val: `${taxCalcs.dueDate}` }
        ];

        taxRows.forEach((r, i) => {
          ensureSpace(20);
          if (i % 2 === 1) {
            doc.rect(marginX, y - 2, pageWidth, 18).fill('#f8fafc');
          }
          doc.fontSize(8.5).fillColor('#334155');
          doc.text(r.name, marginX + 10, y + 2, { width: 300 });
          doc.text(r.val, marginX + 320, y + 2, { width: 180, align: 'right' });
          y += 18;
        });

        if (data.estimatedTaxNote) {
          y += 12;
          ensureSpace(24);
          doc.fontSize(8).fillColor('#64748b').text(`Note: ${data.estimatedTaxNote}`, marginX + 10, y);
        }
      }

      // --- ELEGANT FOOTER ---
      doc.fontSize(7.5).fillColor('#94a3b8').text(
        'Generated by TaxPal • Private & Confidential • For review only',
        marginX,
        780,
        { width: pageWidth, align: 'center' }
      );

      doc.end();

    } else if (formatUpper === 'CSV') {
      const csvLines = [];
      csvLines.push('TaxPal Financial Report');
      csvLines.push(`Report Name,"${(report.name || '').replace(/"/g, '""')}"`);
      csvLines.push(`Report Type,${report.reportType}`);
      csvLines.push(`Period,${report.period}`);
      csvLines.push(`Currency,${currency.code} (${currency.csv})`);
      csvLines.push(`Generated,${new Date(report.generatedDate).toLocaleDateString()}`);
      csvLines.push('');

      if (isIncomeReport) {
        // --- INCOME STATEMENT CSV ---
        csvLines.push('SUMMARY');
        csvLines.push(`Total Income (${currency.code}),${(data.totalIncome || 0).toFixed(2)}`);
        csvLines.push(`Total Expenses (${currency.code}),${(data.totalExpenses || 0).toFixed(2)}`);
        csvLines.push(`Net Income (${currency.code}),${(data.net || 0).toFixed(2)}`);
        csvLines.push('');

        if (data.incomeBreakdown && data.incomeBreakdown.length > 0) {
          csvLines.push('INCOME BY CATEGORY', `Category,Amount (${currency.code}),Percentage`);
          data.incomeBreakdown.forEach(r => csvLines.push(`"${(r.category || '').replace(/"/g, '""')}",${r.amount.toFixed(2)},${r.percentage.toFixed(1)}%`));
          csvLines.push('');
        }

        if (data.expenseBreakdown && data.expenseBreakdown.length > 0) {
          csvLines.push('EXPENSES BY CATEGORY', `Category,Amount (${currency.code}),Percentage`);
          data.expenseBreakdown.forEach(r => csvLines.push(`"${(r.category || '').replace(/"/g, '""')}",${r.amount.toFixed(2)},${r.percentage.toFixed(1)}%`));
          csvLines.push('');
        }

        if (data.transactions && data.transactions.length > 0) {
          csvLines.push('TRANSACTIONS FOR PERIOD', `Date,Type,Category,Description,Amount (${currency.code})`);
          data.transactions.forEach(t => {
            csvLines.push(`${t.date},${t.type},"${(t.category || '').replace(/"/g, '""')}","${(t.description || '').replace(/"/g, '""')}",${(t.amount || 0).toFixed(2)}`);
          });
        }

      } else if (isBudgetReport) {
        // --- BUDGET PERFORMANCE CSV ---
        const budgetRows = data.budgetComparison || [];
        const totalLimit = budgetRows.reduce((s, b) => s + (b.budgeted || 0), 0);
        const totalSpent = budgetRows.reduce((s, b) => s + (b.spent || 0), 0);
        const remainingBalance = totalLimit - totalSpent;
        const overBudget = totalSpent > totalLimit;

        csvLines.push('BUDGET PERFORMANCE SUMMARY');
        csvLines.push(`Total Budget Limit (${currency.code}),${totalLimit.toFixed(2)}`);
        csvLines.push(`Total Actual Spent (${currency.code}),${totalSpent.toFixed(2)}`);
        csvLines.push(`Remaining Balance (${currency.code}),${remainingBalance.toFixed(2)}`);
        csvLines.push(`Budget Status,${overBudget ? 'Limit Exceeded' : 'Within Budget Limits'}`);
        csvLines.push('');

        if (budgetRows.length > 0) {
          csvLines.push('CATEGORY PERFORMANCE GRID', `Category,Budget Limit (${currency.code}),Actual Spent (${currency.code}),Variance (${currency.code}),Status`);
          budgetRows.forEach(r => {
            const status = r.spent > r.budgeted ? 'Exceeded' : 'On Track';
            csvLines.push(`"${(r.category || '').replace(/"/g, '""')}",${(r.budgeted || 0).toFixed(2)},${(r.spent || 0).toFixed(2)},${(r.remaining || 0).toFixed(2)},${status}`);
          });
        }

      } else if (isTaxReport) {
        // --- TAX SUMMARY CSV ---
        const deductions = data.deductionsBreakdown || {
          businessExpenses: data.totalExpenses || 0,
          retirement: 0,
          healthInsurance: 0,
          homeOffice: 0,
          totalDeductions: data.totalExpenses || 0
        };
        const grossInc = data.totalIncome || 0;
        const totalDed = deductions.totalDeductions;
        const taxableInc = Math.max(0, grossInc - totalDed);
        const estTax = data.estimatedTax ?? Math.max(0, (data.net || 0) * 0.25);
        const fedTax = estTax * 0.70;
        const stateTax = estTax * 0.30;
        const effRate = grossInc > 0 ? (estTax / grossInc) * 100 : 0;
        const taxCalcs = data.taxCalculations || {
          nationalTax: fedTax,
          stateTax: stateTax,
          effectiveTaxRate: effRate,
          dueDate: 'Quarterly Due Date'
        };

        csvLines.push('TAX SUMMARY OVERVIEW');
        csvLines.push(`Gross Income (${currency.code}),${grossInc.toFixed(2)}`);
        csvLines.push(`Total Deductions (${currency.code}),${totalDed.toFixed(2)}`);
        csvLines.push(`Taxable Income (${currency.code}),${taxableInc.toFixed(2)}`);
        csvLines.push(`Estimated Tax (${currency.code}),${estTax.toFixed(2)}`);
        csvLines.push('');

        csvLines.push('DEDUCTIONS BREAKDOWN DETAIL', `Deduction Type,Amount (${currency.code})`);
        csvLines.push(`Business Expenses,${deductions.businessExpenses.toFixed(2)}`);
        csvLines.push(`Retirement Contributions,${deductions.retirement.toFixed(2)}`);
        csvLines.push(`Health Insurance Premiums,${deductions.healthInsurance.toFixed(2)}`);
        csvLines.push(`Home Office Deduction,${deductions.homeOffice.toFixed(2)}`);
        csvLines.push('');

        csvLines.push('TAX CALCULATIONS & PROJECTIONS', `Metric,Value`);
        csvLines.push(`National Tax Estimation (${currency.code}),${taxCalcs.nationalTax.toFixed(2)}`);
        csvLines.push(`State Tax Estimation (${currency.code}),${taxCalcs.stateTax.toFixed(2)}`);
        csvLines.push(`Effective Tax Rate,${taxCalcs.effectiveTaxRate.toFixed(2)}%`);
        csvLines.push(`Target Payment Due Date,${taxCalcs.dueDate}`);

        if (data.estimatedTaxNote) {
          csvLines.push('');
          csvLines.push(`Note,"${data.estimatedTaxNote.replace(/"/g, '""')}"`);
        }
      }

      // Prepend UTF-8 Byte Order Mark (\uFEFF) so Excel, Numbers, and Sheets render symbols correctly
      const csvContent = '\uFEFF' + csvLines.join('\n');

      let filename = `${report.name.replace(/\s+/g, '_')}.csv`;
      res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-type', 'text/csv; charset=utf-8');
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

exports.getDatesForPeriod = getDatesForPeriod;
exports.calculateReportSnapshot = calculateReportSnapshot;

