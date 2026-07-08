import React, { useState } from 'react';
import { Budget, Transaction } from '../types';

export default function Budgets({ budgets, setBudgets, transactions = [] }: { budgets: Budget[]; setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>; transactions?: Transaction[] }) {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [deletedBudgetId, setDeletedBudgetId] = useState<number | null>(null);

  const categoryOptions = ['Groceries', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Education', 'Housing', 'Dining', 'Shopping', 'Other'];

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!category || !limit) return;
    setBudgets((prev) => [
      { id: prev.length + 1, category, limit: Number(limit), month },
      ...prev,
    ]);
    setCategory('');
    setLimit('');
  };

  const handleDeleteBudget = (id: number) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    setDeletedBudgetId(id);
  };

  const getCategorySpent = (budgetCategory: string, budgetMonth: string) => {
    return transactions
      .filter((tx) => tx.type === 'Expense' && tx.category === budgetCategory && tx.date.startsWith(budgetMonth))
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const getProgressPercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const getStatusColor = (spent: number, limit: number) => {
    const percentage = getProgressPercentage(spent, limit);
    if (percentage >= 100) return '#dc3545'; // Red
    if (percentage >= 80) return '#ff9800'; // Orange
    return '#28a745'; // Green
  };

  return (
    <div className="grid-layout">
      <div className="panel-block">
        <div className="section-title">Create New Budget</div>
        <form className="form-grid" onSubmit={handleSave}>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">Select a category</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
          <label>
            Budget Amount
            <input value={limit} onChange={(event) => setLimit(event.target.value)} type="number" placeholder="$0.00" step="0.01" />
          </label>
          <label>
            Month
            <input value={month} onChange={(event) => setMonth(event.target.value)} type="month" />
          </label>
          <button type="submit" style={{ gridColumn: '1 / -1' }}>💰 Create Budget</button>
        </form>
      </div>

      <div className="panel-block">
        <div className="section-title">Budget Overview</div>
        {budgets.length > 0 ? (
          <div style={{ display: 'grid', gap: '15px' }}>
            {budgets.map((budget) => {
              const spent = getCategorySpent(budget.category, budget.month);
              const percentage = getProgressPercentage(spent, budget.limit);
              const statusColor = getStatusColor(spent, budget.limit);
              const isExceeded = spent > budget.limit;

              return (
                <div 
                  key={budget.id} 
                  style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    borderLeft: `4px solid ${statusColor}`,
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '15px', fontWeight: '600' }}>
                        {budget.category}
                        {isExceeded && <span style={{ marginLeft: '8px', color: '#dc3545', fontSize: '12px' }}>⚠️ Over Budget</span>}
                      </h4>
                      <p style={{ margin: '0', color: '#999', fontSize: '12px' }}>{budget.month}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteBudget(budget.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                      title="Delete budget"
                    >
                      🗑️
                    </button>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ backgroundColor: '#e0e0e0', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          backgroundColor: statusColor, 
                          height: '100%', 
                          width: `${percentage}%`,
                          transition: 'width 0.3s ease'
                        }} 
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666' }}>
                    <span>💵 Spent: <strong style={{ color: statusColor }}>${spent.toFixed(2)}</strong></span>
                    <span>📊 {percentage.toFixed(0)}% of ${budget.limit.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
            📭 No budgets created yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}
