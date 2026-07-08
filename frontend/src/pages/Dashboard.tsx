import React from 'react';
import { Transaction, Budget } from '../types';

export default function Dashboard({ transactions, budgets, taxEstimate }: { transactions: Transaction[]; budgets: Budget[]; taxEstimate: number }) {
  const incomeTotal = transactions.filter((tx) => tx.type === 'Income').reduce((sum, tx) => sum + tx.amount, 0);
  const expenseTotal = transactions.filter((tx) => tx.type === 'Expense').reduce((sum, tx) => sum + tx.amount, 0);
  const remainingBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0) - expenseTotal;

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

  return (
    <div className="grid-layout">
      <div className="card-grid">
        <div className="card card-small">
          <span className="card-label">Monthly Income</span>
          <strong>${incomeTotal.toFixed(2)}</strong>
          <p>+ {incomeTotal > expenseTotal ? '8%' : '2%'} from last month</p>
        </div>
        <div className="card card-small">
          <span className="card-label">Monthly Expenses</span>
          <strong>${expenseTotal.toFixed(2)}</strong>
          <p>- {expenseTotal > incomeTotal ? '4%' : '10%'} from last month</p>
        </div>
        <div className="card card-small">
          <span className="card-label">Estimated Tax Due</span>
          <strong>${taxEstimate.toFixed(2)}</strong>
          <p>Review tax planning</p>
        </div>
        <div className="card card-small">
          <span className="card-label">Budget Health</span>
          <strong>{remainingBudget >= 0 ? 'Good' : 'Over budget'}</strong>
          <p>{remainingBudget >= 0 ? 'You are on track' : 'Review spending'}</p>
        </div>
      </div>

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
          <div className="section-title">Tax Calendar</div>
          <div className="timeline-card">
            <div className="timeline-item">
              <strong>Q2 Estimated Tax Payment</strong>
              <span>Jun 15, 2025</span>
            </div>
            <div className="timeline-item">
              <strong>Q3 Estimated Tax Reminder</strong>
              <span>Sep 15, 2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
