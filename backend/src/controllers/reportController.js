const Report = require('../models/report.model');
const Transaction = require('../models/transaction.model');
const User = require('../models/User.model');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

// Maps a user's registered country to the correct currency symbol
const getCurrencySymbol = (country) => {
  const map = {
    'United States': '$',
    'India': '\u20b9',
    'United Kingdom': '\u00a3',
    'European Union': '\u20ac',
    'Japan': '\u00a5',
    'Canada': 'CA$',
    'Australia': 'A$',
    'Singapore': 'S$',
    'United Arab Emirates': 'AED ',
  };
  return map[country] || '$';
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

const getDatesForPeriod = (period) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  switch (period) {
    case 'Current Month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'Last Month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'Current Quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      endDate = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0, 23, 59, 59, 999);
      break;
    case 'Last Quarter':
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      let qYear = now.getFullYear();
      let qStart = lastQuarter * 3;
      if (lastQuarter < 0) {
        qYear -= 1;
        qStart = 9; // Q4 of previous year
      }
      startDate = new Date(qYear, qStart, 1);
      endDate = new Date(qYear, qStart + 3, 0, 23, 59, 59, 999);
      break;
    case 'Year to Date':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { startDate, endDate };
};

exports.generateReport = async (req, res) => {
  try {
    const { reportType, period, format } = req.body;
    
    const { startDate, endDate } = getDatesForPeriod(period);
    
    const name = `${reportType} - ${period}`;

    const report = await Report.create({
      userId: req.user.id,
      reportType,
      period,
      format,
      name,
      startDate,
      endDate
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Server error generating report' });
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

    const transactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: report.startDate, $lte: report.endDate }
    }).sort({ date: 1 });

    // Derive currency symbol from the user's registered country
    const user = await User.findById(req.user.id).select('country');
    const currencySymbol = getCurrencySymbol(user ? user.country : '');

    if (report.format === 'PDF') {
      const doc = new PDFDocument();
      let filename = `${report.name.replace(/\s+/g, '_')}.pdf`;
      filename = encodeURIComponent(filename);

      res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-type', 'application/pdf');

      doc.pipe(res);

      doc.fontSize(20).text(report.name, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`);
      doc.text(`Period: ${report.startDate.toLocaleDateString()} to ${report.endDate.toLocaleDateString()}`);
      doc.moveDown();

      let totalIncome = 0;
      let totalExpense = 0;

      transactions.forEach(t => {
        if (t.type === 'income') totalIncome += t.amount;
        if (t.type === 'expense') totalExpense += t.amount;
      });

      if (report.reportType === 'Income Statement' || report.reportType === 'Tax Summary') {
        doc.fontSize(16).text('Summary');
        doc.fontSize(12).text(`Total Income: ${currencySymbol}${totalIncome.toFixed(2)}`);
        doc.text(`Total Expense: ${currencySymbol}${totalExpense.toFixed(2)}`);
        doc.text(`Net Income: ${currencySymbol}${(totalIncome - totalExpense).toFixed(2)}`);
        doc.moveDown();
      }

      doc.fontSize(16).text('Transactions');
      doc.moveDown();
      
      const tableTop = doc.y;
      const columnSpacing = 20;
      const dateX = 50;
      const descX = 150;
      const typeX = 350;
      const amountX = 450;
      
      doc.fontSize(12).text('Date', dateX, tableTop, { underline: true });
      doc.text('Description', descX, tableTop, { underline: true });
      doc.text('Type', typeX, tableTop, { underline: true });
      doc.text('Amount', amountX, tableTop, { underline: true });
      
      let y = tableTop + 20;
      
      transactions.forEach(t => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        
        doc.fontSize(10).text(new Date(t.date).toLocaleDateString(), dateX, y);
        doc.text(t.description || t.category, descX, y);
        doc.text(t.type, typeX, y);
        doc.text(`${currencySymbol}${t.amount.toFixed(2)}`, amountX, y);
        
        y += 20;
      });

      // Persist the download URL path in the report document
      const filePath = `/api/reports/${report._id}/download`;
      await Report.findByIdAndUpdate(report._id, { filePath });

      doc.end();
    } else if (report.format === 'CSV') {
      const fields = ['date', 'type', 'category', 'description', 'amount'];
      const data = transactions.map(t => ({
        date: new Date(t.date).toLocaleDateString(),
        type: t.type,
        category: t.category,
        description: t.description || '',
        amount: t.amount
      }));
      
      const parser = new Parser({ fields });
      const csv = parser.parse(data);

      let filename = `${report.name.replace(/\s+/g, '_')}.csv`;
      res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-type', 'text/csv');
      res.send(csv);
    } else {
      res.status(400).json({ message: 'Invalid format' });
    }

  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ message: 'Server error downloading report' });
  }
};
