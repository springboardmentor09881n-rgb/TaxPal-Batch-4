import React, { useState } from 'react';
import { Transaction } from '../types';

export default function Transactions({ transactions, setTransactions }: { transactions: Transaction[]; setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>> }) {
  const [mode, setMode] = useState<'Income' | 'Expense'>('Income');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Refund', 'Other Income'];
  const expenseCategories = ['Groceries', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Education', 'Housing', 'Dining', 'Shopping', 'Other'];
  const categories = mode === 'Income' ? incomeCategories : expenseCategories;

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!description || !amount || !category) return;
    setTransactions((prev) => [
      {
        id: prev.length + 1,
        type: mode,
        description,
        category,
        amount: Number(amount),
        date,
      },
      ...prev,
    ]);
    setDescription('');
    setAmount('');
    setCategory('');
    setDate(new Date().toISOString().slice(0, 10));
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || tx.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const allCategories = ['All', ...new Set(transactions.map((tx) => tx.category))];

  return (
    <div className="grid-layout">
      <div className="panel-block">
        <div className="section-title">Record New {mode}</div>
        <div className="toggle-row">
          <button className={mode === 'Income' ? 'toggle active' : 'toggle'} onClick={() => setMode('Income')}>
            ➕ Add Income
          </button>
          <button className={mode === 'Expense' ? 'toggle active' : 'toggle'} onClick={() => setMode('Expense')}>
            ➖ Add Expense
          </button>
        </div>
        <form className="form-grid" onSubmit={handleSave}>
          <label>
            Description
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Web Design Project" />
          </label>
          <label>
            Amount
            <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" placeholder="$0.00" step="0.01" />
          </label>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input value={date} onChange={(event) => setDate(event.target.value)} type="date" />
          </label>
          <button type="submit" style={{ gridColumn: '1 / -1' }}>💾 Save Transaction</button>
        </form>
      </div>

      <div className="panel-block">
        <div className="section-title">Transaction History</div>
        <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="🔍 Search by description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
          />
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="table-card">
          <div className="table-row header-row">
            <span>Date</span>
            <span>Description</span>
            <span>Category</span>
            <span>Amount</span>
            <span>Type</span>
          </div>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => (
              <div 
                className="table-row" 
                key={tx.id}
                style={{ backgroundColor: tx.type === 'Income' ? '#f0f8f0' : '#fff5f5' }}
              >
                <span>{tx.date}</span>
                <span>{tx.description}</span>
                <span style={{ fontSize: '12px', backgroundColor: tx.type === 'Income' ? '#d4edda' : '#f8d7da', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>{tx.category}</span>
                <span style={{ fontWeight: '600', color: tx.type === 'Income' ? '#28a745' : '#dc3545' }}>
                  {tx.type === 'Income' ? '+' : '-'}${tx.amount.toFixed(2)}
                </span>
                <span>{tx.type === 'Income' ? '📈' : '📉'} {tx.type}</span>
              </div>
            ))
          ) : (
            <div className="table-row" style={{ backgroundColor: '#f8f9fa' }}>
              <span style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999', padding: '20px' }}>No transactions found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
