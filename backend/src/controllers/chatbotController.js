/**
 * Chatbot Controller - TaxPal Assist Knowledge & Query Engine
 * 100% Standalone Rule-Based Engine (Zero LLM / External API required)
 */

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

    let bestMatch = null;
    let highestScore = 0;

    for (const entry of KNOWLEDGE_BASE) {
      const score = scoreKnowledgeEntry(entry, rawText, normalized, currentRoute);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = entry;
      }
    }

    // Threshold cutoff for confidence
    if (bestMatch && highestScore >= 3) {
      return res.json({
        success: true,
        answer: bestMatch.answer,
        category: bestMatch.category,
        actionRoute: bestMatch.actionRoute || null,
        actionLabel: bestMatch.actionLabel || null,
        quickPrompts: bestMatch.quickPrompts || []
      });
    }

    // Fallback to Groq API if GROQ_API_KEY is configured
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [
              {
                role: 'system',
                content: 'You are TaxPal Assist, a helpful financial assistant for TaxPal. Keep your answers concise, accurate, and under 4 sentences. Format important terms in bold.'
              },
              {
                role: 'user',
                content: rawText
              }
            ],
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiAnswer = data.choices?.[0]?.message?.content;
          if (aiAnswer) {
            return res.json({
              success: true,
              answer: aiAnswer,
              quickPrompts: [
                'What is Smart Auto-Categorization?',
                'How to set monthly budgets?',
                'How does Tax Estimator work?'
              ]
            });
          }
        } else {
          console.error('Groq API returned error status:', response.status, await response.text());
        }
      } catch (err) {
        console.error('Groq API request failed:', err);
      }
    }

    // Fallback response with structured category help menu
    return res.json({
      success: true,
      answer: `I'm **TaxPal Assist**, specialized in helping you navigate and manage your finances on TaxPal!

I didn't quite catch the exact topic, but here are quick topics I can help you with:
- 💳 **Transactions & Smart Auto-Categorization**
- 🎯 **Category Budget Caps & Over-Budget Alerts**
- 🧮 **Multi-Country Advance Tax Estimator**
- 📅 **Tax Calendar & Payment Deadlines**
- 🎨 **Custom Category Creation & Hex Colors**`,
      actionRoute: null,
      actionLabel: null,
      quickPrompts: [
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
