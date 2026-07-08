import React from 'react';
import { Transaction, Budget } from '../types';

export default function Dashboard({ transactions, budgets, taxEstimate }: { transactions: Transaction[]; budgets: Budget[]; taxEstimate: number }) {
  const incomeTotal = transactions.filter((tx) => tx.type === 'Income').reduce((sum, tx) => sum + tx.amount, 0);
  const expenseTotal = transactions.filter((tx) => tx.type === 'Expense').reduce((sum, tx) => sum + tx.amount, 0);
  const remainingBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0) - expenseTotal;
  const netIncome = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? ((netIncome / incomeTotal) * 100).toFixed(1) : '0';

  const expenseCategories = transactions
    .filter((tx) => tx.type === 'Expense')
    .reduce<Record<string, number>>((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {});

  const expenseBreakdown = Object.entries(expenseCategories).sort((a, b) => b[1] - a[1]);
  const totalExpense = expenseTotal || 1;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthTotals = new Map<string, { income: number; expense: number }>();

  transactions.forEach((tx) => {
    const [year, month] = tx.date.split('-');
    if (year && month) {
      const key = `${year}-${month}`;
      const totals = monthTotals.get(key) || { income: 0, expense: 0 };
      if (tx.type === 'Income') totals.income += tx.amount;
      else totals.expense += tx.amount;
      monthTotals.set(key, totals);
    }
  });

  const chartMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;
    const totals = monthTotals.get(key) || { income: 0, expense: 0 };
    return {
      label: monthNames[date.getMonth()],
      income: totals.income,
      expense: totals.expense,
    };
  });

  const maxValue = Math.max(100, ...chartMonths.flatMap((item) => [item.income, item.expense]));

  // Tax Savings Tips
  const taxTips = [
    { title: 'Maximize Retirement Contributions', description: 'Contribute to 401(k) or IRA to reduce taxable income', icon: '📈' },
    { title: 'Track Home Office Expenses', description: 'Deduct office supplies, utilities, and equipment', icon: '🏠' },
    { title: 'Health Insurance Savings', description: 'HSA and FSA accounts offer tax advantages', icon: '🏥' },
    { title: 'Quarterly Estimated Taxes', description: 'Avoid penalties by paying quarterly estimates', icon: '📅' },
  ];

  // Get budgets exceeding 80%
  const budgetAlerts = budgets.filter((b) => {
    const spent = transactions
      .filter((tx) => tx.type === 'Expense' && tx.category === b.category && tx.date.startsWith(b.month))
      .reduce((sum, tx) => sum + tx.amount, 0);
    return (spent / b.limit) * 100 >= 80;
  });

  return (
    <div className="grid-layout">
      <div className="card-grid">
        <div className="card card-small" style={{ borderLeft: '4px solid #007bff' }}>
          <span className="card-label">Monthly Income</span>
          <strong style={{ fontSize: '24px' }}>${incomeTotal.toFixed(2)}</strong>
          <p style={{ color: '#28a745', fontSize: '12px', margin: 0 }}>✓ {transactions.filter((t) => t.type === 'Income').length} income entries</p>
        </div>
        <div className="card card-small" style={{ borderLeft: '4px solid #ff6b6b' }}>
          <span className="card-label">Monthly Expenses</span>
          <strong style={{ fontSize: '24px' }}>${expenseTotal.toFixed(2)}</strong>
          <p style={{ color: expenseTotal > incomeTotal ? '#dc3545' : '#666', fontSize: '12px', margin: 0 }}>{expenseTotal > incomeTotal ? '⚠️ Exceeds income!' : '✓ Within budget'}</p>
        </div>
        <div className="card card-small" style={{ borderLeft: '4px solid #ffc107' }}>
          <span className="card-label">Savings Rate</span>
          <strong style={{ fontSize: '24px' }}>{savingsRate}%</strong>
          <p style={{ color: netIncome > 0 ? '#28a745' : '#dc3545', fontSize: '12px', margin: 0 }}>{netIncome > 0 ? `+$${netIncome.toFixed(2)}` : `-$${Math.abs(netIncome).toFixed(2)}`} this month</p>
        </div>
        <div className="card card-small" style={{ borderLeft: '4px solid #17a2b8' }}>
          <span className="card-label">Estimated Tax Due</span>
          <strong style={{ fontSize: '24px' }}>${taxEstimate.toFixed(2)}</strong>
          <p style={{ fontSize: '12px', margin: 0 }}>💡 Plan ahead for next quarter</p>
        </div>
      </div>

      {budgetAlerts.length > 0 && (
        <div className="panel-block" style={{ backgroundColor: '#fff5f5', borderLeft: '4px solid #dc3545' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <span style={{ fontWeight: '600', color: '#dc3545' }}>Budget Alerts</span>
          </div>
          {budgetAlerts.map((b) => (
            <div key={b.id} style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              📊 <strong>{b.category}</strong> budget is {((transactions
                .filter((tx) => tx.type === 'Expense' && tx.category === b.category && tx.date.startsWith(b.month))
                .reduce((sum, tx) => sum + tx.amount, 0) / b.limit) * 100).toFixed(0)}% utilized
            </div>
          ))}
        </div>
      )}

      <div className="panel-block dashboard-grid">
        <div className="dashboard-panel chart-card">
          <div className="chart-title">Income vs Expenses</div>
          <div className="bar-chart">
            <div className="bar-legend">
              <span><span className="legend-dot income"></span>Income</span>
              <span><span className="legend-dot expense"></span>Expenses</span>
            </div>
            <div className="bars">
              {chartMonths.map((item) => (
                <div key={item.label} className="bar-item">
                  <div className="bar-column">
                    <div className="bar income" style={{ height: `${(item.income / maxValue) * 100}%` }} title={`Income $${item.income.toFixed(2)}`} />
                    <div className="bar expense" style={{ height: `${(item.expense / maxValue) * 100}%` }} title={`Expense $${item.expense.toFixed(2)}`} />
                  </div>
                  <span className="bar-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-panel chart-card">
          <div className="chart-title">Expense Breakdown</div>
          <div className="breakdown-list">
            {expenseBreakdown.length ? expenseBreakdown.map(([category, amount]) => (
              <div key={category} className="breakdown-row">
                <div className="breakdown-row-label">
                  <span className="category-dot" />
                  {category}
                </div>
                <div className="breakdown-bar">
                  <div className="breakdown-fill" style={{ width: `${(amount / totalExpense) * 100}%` }} />
                </div>
                <div className="breakdown-value">${amount.toFixed(2)}</div>
              </div>
            )) : <div className="placeholder-list">No expense data available.</div>}
          </div>
        </div>
      </div>

      <div className="panel-block dashboard-grid">
        <div>
          <div className="section-title">Recent Transactions</div>
          <div className="table-card">
            <div className="table-row header-row">
              <span>Date</span>
              <span>Description</span>
              <span>Category</span>
              <span>Amount</span>
              <span>Type</span>
            </div>
            {transactions.map((tx) => (
              <div className="table-row" key={tx.id}>
                <span>{tx.date}</span>
                <span>{tx.description}</span>
                <span>{tx.category}</span>
                <span>${tx.amount.toFixed(2)}</span>
                <span>{tx.type}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="section-title">Tax Savings Tips</div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {taxTips.map((tip, index) => (
              <div key={index} style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #007bff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px' }}>{tip.icon}</span>
                  <strong style={{ fontSize: '13px', color: '#333' }}>{tip.title}</strong>
                </div>
                <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-block dashboard-grid">
        <div>
          <div className="section-title">Recent Transactions</div>
          <div className="table-card">
            <div className="table-row header-row">
              <span>Date</span>
              <span>Description</span>
              <span>Category</span>
              <span>Amount</span>
              <span>Type</span>
            </div>
            {transactions.length > 0 ? transactions.slice(0, 5).map((tx) => (
              <div className="table-row" key={tx.id} style={{ backgroundColor: tx.type === 'Income' ? '#f0f8f0' : '#fff5f5' }}>
                <span>{tx.date}</span>
                <span>{tx.description}</span>
                <span style={{ fontSize: '11px', backgroundColor: tx.type === 'Income' ? '#d4edda' : '#f8d7da', padding: '3px 6px', borderRadius: '3px', display: 'inline-block' }}>{tx.category}</span>
                <span style={{ fontWeight: '600', color: tx.type === 'Income' ? '#28a745' : '#dc3545' }}>{tx.type === 'Income' ? '+' : '-'}${tx.amount.toFixed(2)}</span>
                <span>{tx.type === 'Income' ? '📈' : '📉'}</span>
              </div>
            )) : (
              <div className="table-row" style={{ backgroundColor: '#f8f9fa' }}>
                <span style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999', padding: '20px' }}>No transactions yet</span>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="section-title">📅 Tax Payment Deadlines</div>
          <div className="timeline-card">
            <div className="timeline-item" style={{ borderLeft: '3px solid #007bff', paddingLeft: '12px' }}>
              <strong>Q1 Estimated Tax</strong>
              <span style={{ fontSize: '12px', color: '#666' }}>Apr 15, 2025</span>
            </div>
            <div className="timeline-item" style={{ borderLeft: '3px solid #28a745', paddingLeft: '12px' }}>
              <strong>Q2 Estimated Tax</strong>
              <span style={{ fontSize: '12px', color: '#666' }}>Jun 15, 2025</span>
            </div>
            <div className="timeline-item" style={{ borderLeft: '3px solid #ffc107', paddingLeft: '12px' }}>
              <strong>Q3 Estimated Tax</strong>
              <span style={{ fontSize: '12px', color: '#666' }}>Sep 15, 2025</span>
            </div>
            <div className="timeline-item" style={{ borderLeft: '3px solid #dc3545', paddingLeft: '12px' }}>
              <strong>Q4 Estimated Tax</strong>
              <span style={{ fontSize: '12px', color: '#666' }}>Jan 15, 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
