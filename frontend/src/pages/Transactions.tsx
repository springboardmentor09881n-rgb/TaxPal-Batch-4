import React, { useState } from 'react';
import { Transaction } from '../types';

export default function Transactions({ transactions, setTransactions }: { transactions: Transaction[]; setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>> }) {
  const [mode, setMode] = useState<'Income' | 'Expense'>('Income');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

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
  };

  return (
    <div className="grid-layout">
      <div className="panel-block">
        <div className="section-title">Record New {mode}</div>
        <div className="toggle-row">
          <button className={mode === 'Income' ? 'toggle active' : 'toggle'} onClick={() => setMode('Income')}>
            Add Income
          </button>
          <button className={mode === 'Expense' ? 'toggle active' : 'toggle'} onClick={() => setMode('Expense')}>
            Add Expense
          </button>
        </div>
        <form className="form-grid" onSubmit={handleSave}>
          <label>
            Description
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Web Design Project" />
          </label>
          <label>
            Amount
            <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" placeholder="$0.00" />
          </label>
          <label>
            Category
            <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Select a category" />
          </label>
          <label>
            Date
            <input value={date} onChange={(event) => setDate(event.target.value)} type="date" />
          </label>
          <button type="submit">Save</button>
        </form>
      </div>

      <div className="panel-block">
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
    </div>
  );
}
