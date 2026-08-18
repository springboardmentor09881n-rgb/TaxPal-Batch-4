/**
 * Chatbot Controller - TaxPal Assist Knowledge & Query Engine
 * Standalone Rule-Based Engine + Personalized User Financial AI Engine
 */

const User = require('../models/User.model');
const Transaction = require('../models/Transaction.model');
const Budget = require('../models/budgets.model');
const TaxEstimate = require('../models/taxEstimates.model');
const Report = require('../models/report.model');
const { getDatesForPeriod, calculateReportSnapshot } = require('./reportController');


const KNOWLEDGE_BASE = [
  {
    id: 'greeting',
    category: 'General',
    keywords: ['hi', 'hello', 'hey', 'greetings', 'help', 'start', 'bot', 'who are you', 'what can you do', 'taxpal'],
    patterns: [/^hi$/i, /^hello$/i, /^hey$/i, /what can you do/i, /who are you/i, /help me/i],
    answer: `👋 Welcome to **TaxPal Assist**! I'm your dedicated financial assistant. 

I can help you navigate TaxPal and answer questions about:
- 💳 **Smart Auto-Categorization & Transactions**
- 🎯 **Monthly Category Budgeting & Over-Budget Alerts**
- 🧮 **Multi-Country Advance Tax Estimations** (USA, India, UK, Canada)
- 📅 **Tax Calendar & Due Date Reminders**
- ⚙️ **Custom Category Creation & Profile Settings**

What would you like to explore today?`,
    quickPrompts: [
      'What is Smart Auto-Categorization?',
      'How do I set monthly budget limits?',
      'How does the Tax Estimator work?',
      'How to add custom categories?'
    ]
  },
  {
    id: 'auto_categorization',
    category: 'Transactions',
    keywords: ['auto', 'categorize', 'category', 'smart', 'suggest', 'swiggy', 'uber', 'zomato', 'aws', 'udemy', 'coursera', 'merchant'],
    patterns: [/auto.*categor/i, /smart.*categor/i, /how.*categorize/i, /suggest.*category/i],
    answer: `💳 **Smart Auto-Categorization Engine**

TaxPal automatically suggests categories as you type transaction descriptions:
- 🍔 **Swiggy / Zomato / Restaurant** ➔ *Meals & Entertainment*
- 🚗 **Uber / Ola / Fuel / Gas** ➔ *Travel & Transportation*
- 💻 **AWS / Cloud / Hosting / Software** ➔ *Business Expenses*
- 📚 **Udemy / Coursera / Books** ➔ *Professional Development*
- 🛍️ **Amazon / Shopping** ➔ *Shopping*

You can always override the suggested category or create custom categories in Settings!`,
    actionRoute: '/transactions',
    actionLabel: 'Go to Transactions',
    quickPrompts: [
      'How to add a new transaction?',
      'How to add custom categories?',
      'How to filter transactions?'
    ]
  },
  {
    id: 'transactions_crud',
    category: 'Transactions',
    keywords: ['transaction', 'add transaction', 'record', 'income', 'expense', 'delete transaction', 'edit transaction', 'search', 'filter'],
    patterns: [/add.*transaction/i, /create.*transaction/i, /how to add income/i, /how to add expense/i, /filter.*transaction/i],
    answer: `📝 **Managing Transactions in TaxPal**

1. Navigate to the **Transactions** page.
2. Click **+ Record Income/Expense** button.
3. Fill in details: Amount, Type (*Income* or *Expense*), Date, Description, and Category.
4. **Search & Filter**: Use the top filter bar to filter entries by Category, Date range, or Type, or type keywords in the search bar.
5. **Edit / Delete**: Click the edit or delete icon on any row to manage past entries.`,
    actionRoute: '/transactions',
    actionLabel: 'Open Transactions',
    quickPrompts: [
      'What is Smart Auto-Categorization?',
      'How to set category budgets?'
    ]
  },
  {
    id: 'category_budgets',
    category: 'Budgets',
    keywords: ['budget', 'budgets', 'limit', 'spending', 'over budget', 'cap', 'warning', 'progress bar', 'exceed', 'monthly budget'],
    patterns: [/set.*budget/i, /budget.*limit/i, /how.*budget/i, /over.*budget/i, /budget.*warning/i],
    answer: `🎯 **Category Budgeting & Progress Warnings**

TaxPal helps you control monthly spending with customizable budget caps:
- **Set Limits**: Set spending caps per category for any specific month (e.g., May 2025).
- **Auto Aggregation**: Automatically sums your month-to-date expenses for each category.
- **Color-Coded Status Bar**:
  - 🟢 **Safe**: Spent less than 75% of your cap.
  - 🟡 **Near Limit**: Spent between 75% - 100% (Warning).
  - 🔴 **Over Budget**: Spent over 100% of your allocated budget cap.`,
    actionRoute: '/budgets',
    actionLabel: 'Manage Budgets',
    quickPrompts: [
      'How to add a transaction?',
      'How to create custom categories?'
    ]
  },
  {
    id: 'tax_estimator',
    category: 'Taxes',
    keywords: ['tax', 'taxes', 'estimate', 'advance tax', 'tax bracket', 'usa', 'india', 'uk', 'canada', 'slab', 'deduction', 'quarterly', 'q1', 'q2', 'q3', 'q4'],
    patterns: [/tax.*estimate/i, /advance.*tax/i, /how.*tax.*work/i, /tax.*bracket/i, /tax.*deduction/i, /quarterly.*tax/i],
    answer: `🧮 **Multi-Country Advance Tax Estimator**

TaxPal calculates estimated advance tax liability based on your income and region:
- 🇺🇸 **USA**: Federal tax brackets (Single, Joint, Head of Household) + State income tax for all 50 States + DC.
- 🇮🇳 **India**: New Tax Regime tax slabs and standard exemptions.
- 🇬🇧 **UK**: Standard UK income tax rates & personal allowance deductions.
- 🇨🇦 **Canada**: Federal tax brackets & provincial considerations.
- 💡 **Deductions**: Factors in business expenses, retirement contributions, health insurance, and home office costs to lower your tax liability.
- 📅 **Quarterly Breakdown**: Calculates estimated payments for Q1, Q2, Q3, and Q4.`,
    actionRoute: '/tax-estimator',
    actionLabel: 'Go to Tax Estimator',
    quickPrompts: [
      'How to check tax calendar due dates?',
      'Supported tax countries?',
      'How deductions work?'
    ]
  },
  {
    id: 'tax_calendar',
    category: 'Taxes',
    keywords: ['calendar', 'reminder', 'due date', 'alert', 'deadline', 'notification', 'tax calendar', 'quarterly due date'],
    patterns: [/tax.*calendar/i, /due.*date/i, /tax.*deadline/i, /reminder/i, /notification/i],
    answer: `📅 **Tax Calendar & Due Date Alerts**

- **Quarterly Deadlines**: Stay on top of estimated quarterly tax payment deadlines (e.g. April 15, June 15, Sept 15, Jan 15).
- **Automated Alerts**: Interactive floating panels notify you of upcoming deadlines directly on your dashboard.
- **Mark Done**: You can dismiss or mark reminders as done once payments are filed.`,
    actionRoute: '/tax-estimator',
    actionLabel: 'View Tax Calendar',
    quickPrompts: [
      'How does the Tax Estimator work?',
      'What countries are supported?'
    ]
  },
  {
    id: 'supported_countries',
    category: 'Taxes',
    keywords: ['country', 'countries', 'state', 'us', 'usa', 'india', 'uk', 'canada', 'jurisdiction'],
    patterns: [/which.*countr/i, /supported.*countr/i, /country.*support/i],
    answer: `🌍 **Supported Tax Jurisdictions**

TaxPal supports tax estimations for 4 key regions:
1. **United States (USA)**: Federal brackets + state rates for all 50 US states & Washington D.C.
2. **India**: New Tax Regime slabs & exemptions.
3. **United Kingdom (UK)**: HMRC brackets & basic/higher rate thresholds.
4. **Canada**: Federal income tax brackets & provincial calculation.`,
    actionRoute: '/tax-estimator',
    actionLabel: 'Open Tax Estimator',
    quickPrompts: [
      'How does the Tax Estimator work?',
      'How to update user profile location?'
    ]
  },
  {
    id: 'custom_categories',
    category: 'Settings',
    keywords: ['custom category', 'new category', 'create category', 'color', 'hex color', 'delete category', 'manage category'],
    patterns: [/custom.*categor/i, /add.*category/i, /create.*category/i, /change.*color/i],
    answer: `🎨 **Custom Categories & Personalization**

You can personalize how your transactions and budgets are grouped:
1. Go to **Settings** ➔ **Categories** tab.
2. Click **+ Add Custom Category**.
3. Pick a Name, Type (*Income* or *Expense*), and assign a custom **Hex Color**.
4. Save to immediately use it across Dashboard, Transactions, and Budgets!`,
    actionRoute: '/settings',
    actionLabel: 'Open Category Settings',
    quickPrompts: [
      'What is Smart Auto-Categorization?',
      'How to edit profile settings?'
    ]
  },
  {
    id: 'dashboard_overview',
    category: 'Dashboard',
    keywords: ['dashboard', 'kpi', 'metrics', 'income card', 'expense card', 'savings rate', 'chart', 'analytics', 'cash flow'],
    patterns: [/dashboard/i, /kpi/i, /savings rate/i, /analytics/i, /cash flow/i],
    answer: `📊 **Dashboard & Financial Health KPIs**

Your Dashboard displays real-time key performance indicators:
- **Total Income**: Sum of all income transactions recorded this month.
- **Total Expenses**: Sum of all expense transactions recorded this month.
- **Estimated Tax**: Live tax estimate calculation based on your selected tax jurisdiction.
- **Savings Rate**: Percentage of income retained ` + '`((Income - Expense) / Income) * 100`' + `.
- **Charts & Feed**: Interactive area charts showing net balances over time and live transaction feeds.`,
    actionRoute: '/dashboard',
    actionLabel: 'Go to Dashboard',
    quickPrompts: [
      'How to record a transaction?',
      'How to set monthly budgets?'
    ]
  },
  {
    id: 'auth_security',
    category: 'Settings',
    keywords: ['password', 'change password', 'forgot password', 'reset password', 'security', 'login', 'token', 'profile', 'email'],
    patterns: [/change.*password/i, /forgot.*password/i, /reset.*password/i, /update.*profile/i],
    answer: `🔐 **Account Security & Password Management**

- **Change Password**: Go to **Settings** ➔ **Security** tab to update your current password.
- **Forgot Password**: If locked out, click *Forgot Password?* on the login screen to receive a reset token via email.
- **Security**: TaxPal uses industry-standard JWT tokens and Bcrypt password hashing to ensure your financial data remains secure.`,
    actionRoute: '/settings',
    actionLabel: 'Security Settings',
    quickPrompts: [
      'How to update user profile?',
      'How to add custom categories?'
    ]
  },
  {
    id: 'reports_generation',
    category: 'Reports',
    keywords: ['report', 'reports', 'tax summary report', 'download report', 'export pdf', 'csv', 'generate report', 'statement', 'download tax summary'],
    patterns: [/generate.*report/i, /tax.*summary.*report/i, /download.*report/i, /export.*pdf/i, /export.*csv/i],
    answer: `📊 **Generating Financial & Tax Summary Reports**

You can generate and download official PDF or CSV financial reports on TaxPal:
1. Ask me directly: *"Generate tax summary report PDF"* or *"Download income statement CSV"*.
2. Or click **Go to Reports** to view all generated report history.`,
    actionRoute: '/reports',
    actionLabel: 'Go to Reports',
    quickPrompts: [
      'Generate tax summary report PDF',
      'How does Tax Estimator work?'
    ]
  }
];

/**
 * Normalizes query string for intent matching
 */
function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Scores a knowledge base entry against user query and optional current route
 */
function scoreKnowledgeEntry(entry, text, normalizedText, currentRoute) {
  let score = 0;

  // Pattern matching
  for (const pattern of entry.patterns) {
    if (pattern.test(text) || pattern.test(normalizedText)) {
      score += 10;
    }
  }

  // Keyword matching
  const words = normalizedText.split(' ');
  for (const kw of entry.keywords) {
    if (normalizedText.includes(kw)) {
      score += 3;
    }
    for (const w of words) {
      if (w === kw && w.length > 2) {
        score += 2;
      }
    }
  }

  // Context route weighting boost
  if (currentRoute && entry.actionRoute && currentRoute.includes(entry.actionRoute)) {
    score += 1;
  }

  return score;
}

/**
 * Helper to map country to local currency symbol
 */
function getCurrencySymbol(country) {
  if (!country) return '$';
  const c = country.trim().toLowerCase();
  if (c === 'india' || c === 'in' || c === 'ind') return '₹';
  if (c === 'united kingdom' || c === 'uk' || c === 'gb') return '£';
  if (c === 'canada' || c === 'ca') return 'CA$';
  if (c === 'australia' || c === 'au') return 'A$';
  if (c === 'japan' || c === 'jp') return '¥';
  if (c === 'germany' || c === 'european union' || c === 'eu') return '€';
  if (c === 'united arab emirates' || c === 'uae') return 'AED ';
  return '$';
}

/**
 * Aggregates live financial context for a given logged-in user
 */
async function getUserFinancialContext(userId) {
  if (!userId) return null;
  try {
    const user = await User.findById(userId).select('fullName email country incomeBracket').lean();
    if (!user) return null;

    const currencySymbol = getCurrencySymbol(user.country);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Fetch transactions
    const allTransactions = await Transaction.find({ userId }).sort({ date: -1 }).lean();

    let totalIncomeThisMonth = 0;
    let totalExpenseThisMonth = 0;
    let totalIncomeAllTime = 0;
    let totalExpenseAllTime = 0;
    const categoryTotalsThisMonth = {};

    allTransactions.forEach(tx => {
      if (tx.type === 'income') {
        totalIncomeAllTime += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpenseAllTime += tx.amount;
      }

      const txDate = new Date(tx.date);
      if (txDate >= startOfMonth && txDate <= endOfMonth) {
        if (tx.type === 'income') {
          totalIncomeThisMonth += tx.amount;
        } else if (tx.type === 'expense') {
          totalExpenseThisMonth += tx.amount;
          categoryTotalsThisMonth[tx.category] = (categoryTotalsThisMonth[tx.category] || 0) + tx.amount;
        }
      }
    });

    const recentTxList = allTransactions.slice(0, 10).map(tx =>
      `- ${tx.type.toUpperCase()}: ${tx.description} (${currencySymbol}${tx.amount}) [Category: ${tx.category}] on ${new Date(tx.date).toLocaleDateString()}`
    ).join('\n');

    // Fetch budgets
    const budgets = await Budget.find({ userId }).lean();
    const budgetSummaryList = budgets.map(b => {
      const spent = categoryTotalsThisMonth[b.category] || 0;
      const pct = b.budget_amount > 0 ? Math.round((spent / b.budget_amount) * 100) : 0;
      let status = 'Safe';
      if (pct >= 100) status = 'OVER BUDGET (Exceeded cap)';
      else if (pct >= 75) status = 'Warning (Near budget cap)';
      return `- Category "${b.category}": Monthly Cap ${currencySymbol}${b.budget_amount}, Spent ${currencySymbol}${spent} (${pct}% used - ${status})`;
    }).join('\n');

    // Fetch latest Tax Estimate
    const latestTaxEstimate = await TaxEstimate.findOne({ userId }).sort({ updatedAt: -1 }).lean();
    let taxSummary = 'No tax estimate created yet.';
    if (latestTaxEstimate) {
      const taxCurrency = getCurrencySymbol(latestTaxEstimate.country || user.country);
      taxSummary = `Country: ${latestTaxEstimate.country}, Quarter: ${latestTaxEstimate.quarter}, Estimated Tax: ${taxCurrency}${latestTaxEstimate.estimatedTax}, Gross Income for Quarter: ${taxCurrency}${latestTaxEstimate.grossIncomeForQuarter || 0}, Filing Status: ${latestTaxEstimate.filingStatus}, State: ${latestTaxEstimate.state}, Due Date: ${new Date(latestTaxEstimate.dueDate).toLocaleDateString()}`;
    }

    return {
      fullName: user.fullName,
      country: user.country,
      currencySymbol,
      email: user.email,
      incomeBracket: user.incomeBracket,
      totalIncomeThisMonth,
      totalExpenseThisMonth,
      totalIncomeAllTime,
      totalExpenseAllTime,
      categoryTotalsThisMonth,
      recentTxList: recentTxList || 'No recent transactions recorded.',
      budgetSummaryList: budgetSummaryList || 'No category budget caps configured.',
      taxSummary
    };
  } catch (err) {
    console.error('[Chatbot Controller] Error fetching user financial context:', err);
    return null;
  }
}

/**
 * Handles Direct Chat Commands for Budgets, Transactions, and Reports
 */
async function processDirectChatActions(rawText, userId, userContext) {
  if (!userId) return null;
  const text = rawText.trim();
  const lower = text.toLowerCase();
  const currencySymbol = userContext?.currencySymbol || '$';

  // -------------------------------------------------------------
  // 1. BUDGET ACTIONS (Create/Update or Delete Budget)
  // -------------------------------------------------------------

  // Delete budget: e.g. "delete budget for Food", "remove food budget"
  if (lower.includes('budget') && (lower.includes('delete') || lower.includes('remove') || lower.includes('clear'))) {
    const match = text.match(/(?:delete|remove|clear)\s*(?:a\s*)?budget(?:\s*for|\s*category)?\s*([a-zA-Z0-9\s]+)/i) ||
                  text.match(/(?:delete|remove|clear)\s*([a-zA-Z0-9\s]+)\s*budget/i);
    if (match && match[1]) {
      const categoryName = match[1].trim();
      const deleted = await Budget.findOneAndDelete({
        userId,
        category: new RegExp(`^${categoryName}$`, 'i')
      });
      if (deleted) {
        return {
          success: true,
          answer: `🗑️ **Budget Removed**: Successfully deleted monthly budget cap for **${deleted.category}**!`,
          category: 'Budgets',
          actionRoute: '/budgets',
          actionLabel: 'View Budgets',
          quickPrompts: ['Am I over budget on any category?', 'What is my total spending this month?']
        };
      } else {
        return {
          success: true,
          answer: `⚠️ Could not find an active budget for category **"${categoryName}"** to delete.`,
          category: 'Budgets',
          actionRoute: '/budgets',
          actionLabel: 'View Budgets'
        };
      }
    }
  }

  // Create / Update budget: e.g. "set budget of $500 for Food", "create $300 budget for Travel", "set Food budget to 500"
  if (lower.includes('budget') && (lower.includes('set') || lower.includes('create') || lower.includes('add') || lower.includes('cap'))) {
    let categoryName = null;
    let amount = null;

    const matchA = text.match(/(?:set|create|add)\s*(?:a\s*)?budget(?:\s*cap)?\s*(?:of\s*|to\s*)?\$?(\d+(?:\.\d+)?)\s*(?:for\s*|under\s*|in\s*|category\s*)?([a-zA-Z0-9\s]+)/i);
    const matchB = text.match(/(?:set|create|add)\s*([a-zA-Z0-9\s]+)\s*budget\s*(?:to|of|at)?\s*\$?(\d+(?:\.\d+)?)/i);

    if (matchA && matchA[1] && matchA[2]) {
      amount = parseFloat(matchA[1]);
      categoryName = matchA[2].trim();
    } else if (matchB && matchB[1] && matchB[2]) {
      categoryName = matchB[1].trim();
      amount = parseFloat(matchB[2]);
    }

    if (categoryName && !isNaN(amount) && amount > 0) {
      categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      let budget = await Budget.findOne({
        userId,
        category: new RegExp(`^${categoryName}$`, 'i'),
        month: currentMonth
      });

      if (budget) {
        budget.budget_amount = amount;
        await budget.save();
      } else {
        budget = await Budget.create({
          userId,
          category: categoryName,
          budget_amount: amount,
          month: currentMonth,
          description: 'Created via TaxPal Assist Chatbot'
        });
      }

      return {
        success: true,
        answer: `🎯 **Budget Configured**: Successfully set a monthly budget cap of **${currencySymbol}${amount}** for **${categoryName}** (${currentMonth})!`,
        category: 'Budgets',
        actionRoute: '/budgets',
        actionLabel: 'View Budgets',
        quickPrompts: ['Am I over budget on any category?', 'What is my total spending this month?']
      };
    }
  }

  // -------------------------------------------------------------
  // 2. TRANSACTION ACTIONS (Record/Create or Delete Transaction)
  // -------------------------------------------------------------

  // Delete transaction: e.g. "delete transaction Swiggy", "remove expense Uber"
  if ((lower.includes('transaction') || lower.includes('expense') || lower.includes('income')) && (lower.includes('delete') || lower.includes('remove'))) {
    const match = text.match(/(?:delete|remove)\s*(?:transaction|expense|income)?\s*(?:for\s*)?([a-zA-Z0-9\s]+)/i);
    if (match && match[1]) {
      const searchTerm = match[1].trim();
      const deleted = await Transaction.findOneAndDelete({
        userId,
        $or: [
          { description: new RegExp(searchTerm, 'i') },
          { category: new RegExp(searchTerm, 'i') }
        ]
      });

      if (deleted) {
        return {
          success: true,
          answer: `🗑️ **Transaction Removed**: Deleted ${deleted.type.toUpperCase()} entry **"${deleted.description}"** (${currencySymbol}${deleted.amount})!`,
          category: 'Transactions',
          actionRoute: '/transactions',
          actionLabel: 'View Transactions',
          quickPrompts: ['What is my total income this month?', 'What is my total spending this month?']
        };
      } else {
        return {
          success: true,
          answer: `⚠️ Could not find a recent transaction matching **"${searchTerm}"** to delete.`,
          category: 'Transactions',
          actionRoute: '/transactions',
          actionLabel: 'View Transactions'
        };
      }
    }
  }

  // Create / Record Transaction: e.g. "add expense $45 for Swiggy under Food", "record income $2000 for Salary"
  if (lower.includes('add') || lower.includes('record') || lower.includes('log') || lower.includes('spent') || lower.includes('paid') || lower.includes('earned') || lower.includes('received')) {
    const isIncome = lower.includes('income') || lower.includes('earned') || lower.includes('received') || lower.includes('salary');
    const type = isIncome ? 'income' : 'expense';

    const match = text.match(/(?:add|record|log|spent|paid|received|earned)\s*(?:an?\s*)?(?:expense|income)?\s*(?:of\s*|at\s*)?\$?(\d+(?:\.\d+)?)\s*(?:for\s*|on\s*|under\s*|in\s*)?([a-zA-Z0-9\s\-_]+)?/i);

    if (match && match[1]) {
      const amount = parseFloat(match[1]);
      let descAndCat = (match[2] || '').trim();
      
      let categoryName = isIncome ? 'Salary' : 'General';
      let descriptionText = descAndCat || `${type.toUpperCase()} Entry`;

      if (descAndCat) {
        if (descAndCat.toLowerCase().includes('food') || descAndCat.toLowerCase().includes('swiggy') || descAndCat.toLowerCase().includes('zomato')) {
          categoryName = 'Food';
        } else if (descAndCat.toLowerCase().includes('uber') || descAndCat.toLowerCase().includes('ola') || descAndCat.toLowerCase().includes('travel') || descAndCat.toLowerCase().includes('fuel')) {
          categoryName = 'Transportation';
        } else if (descAndCat.toLowerCase().includes('rent') || descAndCat.toLowerCase().includes('house')) {
          categoryName = 'Housing';
        } else if (descAndCat.toLowerCase().includes('shopping') || descAndCat.toLowerCase().includes('amazon')) {
          categoryName = 'Shopping';
        } else {
          categoryName = isIncome ? 'Salary' : 'General';
        }
      }

      const newTx = await Transaction.create({
        userId,
        type,
        amount,
        category: categoryName,
        description: descriptionText,
        date: new Date()
      });

      return {
        success: true,
        answer: `💳 **Transaction Recorded**: Added ${type.toUpperCase()} entry **"${newTx.description}"** of **${currencySymbol}${amount}** under category **${categoryName}**!`,
        category: 'Transactions',
        actionRoute: '/transactions',
        actionLabel: 'View Transactions',
        quickPrompts: ['What is my total income this month?', 'What is my total spending this month?']
      };
    }
  }

  // -------------------------------------------------------------
  // 3. REPORT ACTIONS (Generate Report & Provide Direct Download Button)
  // -------------------------------------------------------------

  if (lower.includes('report') && (lower.includes('generate') || lower.includes('download') || lower.includes('export') || lower.includes('create') || lower.includes('tax summary') || lower.includes('pdf') || lower.includes('csv'))) {
    let reportType = 'Income Statement';
    if (lower.includes('tax')) reportType = 'Tax Summary';
    else if (lower.includes('budget')) reportType = 'Budget Performance';

    let format = lower.includes('csv') ? 'CSV' : 'PDF';
    let period = 'Current Month';
    if (lower.includes('q1') || lower.includes('quarter 1')) period = 'Quarter 1';
    else if (lower.includes('q2') || lower.includes('quarter 2')) period = 'Quarter 2';
    else if (lower.includes('q3') || lower.includes('quarter 3')) period = 'Quarter 3';
    else if (lower.includes('q4') || lower.includes('quarter 4')) period = 'Quarter 4';
    else if (lower.includes('year') || lower.includes('ytd')) period = 'Current Year';
    else if (lower.includes('last month')) period = 'Last Month';

    const { startDate, endDate } = getDatesForPeriod(period);
    const dataSnapshot = await calculateReportSnapshot(userId, startDate, endDate, reportType, period);

    const report = await Report.create({
      userId,
      reportType,
      period,
      format,
      name: `${reportType} (${period})`,
      startDate,
      endDate,
      data: dataSnapshot
    });

    const downloadUrl = `/api/reports/download/${report._id}`;
    const filename = `TaxPal-${reportType.replace(/\s+/g, '-')}-${format}.${format.toLowerCase()}`;

    return {
      success: true,
      answer: `📄 **Generated ${reportType} Report (${format})**\n\nYour **${reportType}** statement for **${period}** has been compiled successfully. Click the button below to download the ${format} file directly to your device!`,
      category: 'Reports',
      actionRoute: '/reports',
      actionLabel: 'View All Reports',
      downloadUrl: downloadUrl,
      downloadLabel: `Download ${reportType} (${format})`,
      downloadFilename: filename,
      quickPrompts: ['How does Tax Estimator work?', 'What is my total spending this month?']
    };
  }

  return null;
}

/**
 * Controller endpoint: POST /api/chatbot/query
 */
exports.processChatQuery = async (req, res) => {
  try {
    const { query, currentRoute } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Query text is required.'
      });
    }

    const rawText = query.trim();
    const normalized = normalizeText(rawText);

    // 1. Calculate Rule Engine Best Match
    let bestMatch = null;
    let highestScore = 0;

    for (const entry of KNOWLEDGE_BASE) {
      const score = scoreKnowledgeEntry(entry, rawText, normalized, currentRoute);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = entry;
      }
    }

    // 2. Fetch User Financial Context if Authenticated
    const userId = req.user?.id || req.user?._id;
    const userContext = await getUserFinancialContext(userId);

    // 2.5 Try Direct Chat Commands (Budgets, Transactions, Reports)
    if (userId) {
      const actionResult = await processDirectChatActions(rawText, userId, userContext);
      if (actionResult) {
        return res.json(actionResult);
      }
    }

    // 3. Try Personalized Groq AI Engine First (If GROQ_API_KEY is available)
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey && groqApiKey.trim()) {
      try {
        const modelsToTry = [
          'groq/compound-mini',
          'groq/compound',
          'qwen/qwen3.6-27b',
          'llama-3.3-70b-versatile',
          'llama-3.1-8b-instant'
        ];

        let systemPrompt = `You are TaxPal Assist, an intelligent, friendly financial assistant for TaxPal (a personal finance & advance tax estimation app).`;

        if (userContext) {
          systemPrompt += `

Current Logged-In User Profile & Live Financial Context:
- User Name: ${userContext.fullName}
- Registered Country: ${userContext.country}
- Currency Symbol: "${userContext.currencySymbol}"
- Total Income (Current Month): ${userContext.currencySymbol}${userContext.totalIncomeThisMonth}
- Total Income (All-Time Total Recorded): ${userContext.currencySymbol}${userContext.totalIncomeAllTime}
- Total Expenses (Current Month): ${userContext.currencySymbol}${userContext.totalExpenseThisMonth}
- Total Expenses (All-Time Total Recorded): ${userContext.currencySymbol}${userContext.totalExpenseAllTime}
- Category Monthly Budgets Progress:
${userContext.budgetSummaryList}
- Tax Estimation Data: ${userContext.taxSummary}
- Recent Transactions Feed:
${userContext.recentTxList}

Personalized Instructions:
1. Address ${userContext.fullName} warmly.
2. The user's local currency symbol is "${userContext.currencySymbol}". ALWAYS display all monetary amounts, balances, incomes, expenses, budgets, and tax estimates using "${userContext.currencySymbol}" (e.g. ${userContext.currencySymbol}${userContext.totalIncomeThisMonth || 5000}) rather than dollar signs ($) unless explicitly requested.
3. If the user asks about their income, expenses, budgets, taxes, transactions, balance, or financial status, use the EXACT live numbers provided in their context above.
4. Keep answers concise, accurate, and under 4 sentences or bullet points.
5. Format key numbers and important terms in **bold** and code elements in \`code\`.`;
        } else {
          systemPrompt += `

App Features Knowledge:
- Smart Auto-Categorization & Transactions (Route: /transactions)
- Category Monthly Budgets & Over-budget alerts (Route: /budgets)
- Multi-Country Advance Tax Estimator for USA, India, UK, Canada (Route: /tax-estimator)
- Tax Calendar & Payment Deadlines (Route: /tax-estimator)
- Custom Categories & Settings (Route: /settings)
- Financial Health KPIs Dashboard (Route: /dashboard)

Guidelines:
- Give concise, accurate, and helpful answers (under 4 sentences).
- Format key terms in **bold** and code in \`code\`.`;
        }

        let aiAnswer = null;
        let usedModel = null;

        for (const model of modelsToTry) {
          try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${groqApiKey.trim()}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: rawText }
                ],
                temperature: 0.7,
                max_tokens: 500
              })
            });

            if (response.ok) {
              const data = await response.json();
              aiAnswer = data.choices?.[0]?.message?.content?.trim();
              if (aiAnswer) {
                break;
              }
            } else {
              const errText = await response.text();
              console.warn(`[Chatbot Controller] Groq model ${model} status ${response.status}: ${errText}`);
            }
          } catch (mErr) {
            console.warn(`[Chatbot Controller] Groq model ${model} request error:`, mErr.message);
          }
        }

        if (aiAnswer) {
          return res.json({
            success: true,
            answer: aiAnswer,
            category: bestMatch?.category || 'Personalized AI',
            actionRoute: (bestMatch && highestScore >= 3) ? bestMatch.actionRoute : null,
            actionLabel: (bestMatch && highestScore >= 3) ? bestMatch.actionLabel : null,
            quickPrompts: userContext ? [
              'What is my total spending this month?',
              'Am I over budget on any category?',
              'What is my tax estimate?'
            ] : (bestMatch?.quickPrompts || [
              'What is Smart Auto-Categorization?',
              'How to set monthly budgets?',
              'How does Tax Estimator work?'
            ])
          });
        }
      } catch (err) {
        console.error('[Chatbot Controller] Error with Groq API:', err.message);
      }
    }

    // 4. Rule Engine Fallback (Personalized if user context exists)
    if (bestMatch && highestScore >= 3) {
      let finalAnswer = bestMatch.answer;
      if (userContext && bestMatch.id === 'greeting') {
        finalAnswer = `👋 Welcome back, **${userContext.fullName}**! 

I'm **TaxPal Assist**, your personalized financial assistant.

Here is your current snapshot for this month:
- 💵 **Total Income**: ${userContext.currencySymbol}${userContext.totalIncomeThisMonth}
- 💸 **Total Expenses**: ${userContext.currencySymbol}${userContext.totalExpenseThisMonth}
- 🧮 **Tax Estimation**: ${userContext.taxSummary}

How can I help you manage your finances today?`;
      }

      return res.json({
        success: true,
        answer: finalAnswer,
        category: bestMatch.category,
        actionRoute: bestMatch.actionRoute || null,
        actionLabel: bestMatch.actionLabel || null,
        quickPrompts: bestMatch.quickPrompts || []
      });
    }

    // 5. Default Fallback response
    const greetingName = userContext ? ` **${userContext.fullName}**` : '';
    return res.json({
      success: true,
      answer: `I'm **TaxPal Assist**, specialized in helping${greetingName} navigate and manage finances on TaxPal!

I didn't quite catch the exact topic, but here are quick topics I can help you with:
- 💳 **Transactions & Smart Auto-Categorization**
- 🎯 **Category Budget Caps & Over-Budget Alerts**
- 🧮 **Multi-Country Advance Tax Estimator**
- 📅 **Tax Calendar & Payment Deadlines**
- 🎨 **Custom Category Creation & Hex Colors**`,
      actionRoute: null,
      actionLabel: null,
      quickPrompts: userContext ? [
        'What is my total spending this month?',
        'Am I over budget on any category?',
        'What is my tax estimate?'
      ] : [
        'What is Smart Auto-Categorization?',
        'How to set category budgets?',
        'How does the Tax Estimator work?',
        'How to create custom categories?'
      ]
    });
  } catch (error) {
    console.error('Chatbot Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing chatbot query.'
    });
  }
};