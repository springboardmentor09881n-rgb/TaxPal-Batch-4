import React, { useState } from 'react';
import { Budget } from '../types';

export default function Budgets({ budgets, setBudgets }: { budgets: Budget[]; setBudgets: React.Dispatch<React.SetStateAction<Budget[]>> }) {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

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

  return (
    <div className="grid-layout">
      <div className="panel-block">
        <div className="section-title">Create New Budget</div>
        <form className="form-grid" onSubmit={handleSave}>
          <label>
            Category
            <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Select a category" />
          </label>
          <label>
            Budget Amount
            <input value={limit} onChange={(event) => setLimit(event.target.value)} type="number" placeholder="$0.00" />
          </label>
          <label>
            Month
            <input value={month} onChange={(event) => setMonth(event.target.value)} type="month" />
          </label>
          <label>
            Description (Optional)
            <input placeholder="Add any additional details..." />
          </label>
          <button type="submit">Create Budget</button>
        </form>
      </div>

      <div className="panel-block">
        <div className="section-title">Budget Overview</div>
        <div className="table-card">
          <div className="table-row header-row">
            <span>Category</span>
            <span>Budget</span>
            <span>Month</span>
            <span>Action</span>
          </div>
          {budgets.map((budget) => (
            <div className="table-row" key={budget.id}>
              <span>{budget.category}</span>
              <span>${budget.limit.toFixed(2)}</span>
              <span>{budget.month}</span>
              <span>Edit</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
