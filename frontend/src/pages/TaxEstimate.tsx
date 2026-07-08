import React, { useState } from 'react';

export default function TaxEstimate({ estimate, setEstimate }: { estimate: number; setEstimate: React.Dispatch<React.SetStateAction<number>> }) {
  const [country, setCountry] = useState('United States');
  const [region, setRegion] = useState('California');
  const [status, setStatus] = useState('Single');
  const [quarter, setQuarter] = useState('Q2');
  const [grossIncome, setGrossIncome] = useState('5000');
  const [businessExpenses, setBusinessExpenses] = useState('500');
  const [retirement, setRetirement] = useState('200');
  const [insurance, setInsurance] = useState('150');
  const [homeOffice, setHomeOffice] = useState('100');

  const calculate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const totalExpenses = [businessExpenses, retirement, insurance, homeOffice].reduce((sum, value) => sum + Number(value), 0);
    const tax = Math.max(0, Number(grossIncome) * 0.15 - totalExpenses * 0.05);
    setEstimate(Number(tax.toFixed(2)));
  };

  return (
    <div className="grid-layout">
      <div className="panel-block">
        <div className="section-title">Quarterly Tax Calculator</div>
        <form className="form-grid" onSubmit={calculate}>
          <label>
            Country/Region
            <input value={country} onChange={(event) => setCountry(event.target.value)} />
          </label>
          <label>
            State/Province
            <input value={region} onChange={(event) => setRegion(event.target.value)} />
          </label>
          <label>
            Filing Status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>Single</option>
              <option>Married</option>
              <option>Head of Household</option>
            </select>
          </label>
          <label>
            Quarter
            <select value={quarter} onChange={(event) => setQuarter(event.target.value)}>
              <option>Q1</option>
              <option>Q2</option>
              <option>Q3</option>
              <option>Q4</option>
            </select>
          </label>
          <label>
            Gross Income for Quarter
            <input value={grossIncome} type="number" onChange={(event) => setGrossIncome(event.target.value)} />
          </label>
          <label>
            Business Expenses
            <input value={businessExpenses} type="number" onChange={(event) => setBusinessExpenses(event.target.value)} />
          </label>
          <label>
            Retirement Contributions
            <input value={retirement} type="number" onChange={(event) => setRetirement(event.target.value)} />
          </label>
          <label>
            Health Insurance Premiums
            <input value={insurance} type="number" onChange={(event) => setInsurance(event.target.value)} />
          </label>
          <label>
            Home Office Deduction
            <input value={homeOffice} type="number" onChange={(event) => setHomeOffice(event.target.value)} />
          </label>
          <button type="submit">Calculate Estimated Tax</button>
        </form>
      </div>
      <div className="panel-block">
        <div className="section-title">Tax Summary</div>
        <div className="summary-card">
          <p>Your estimated quarterly tax obligation is</p>
          <strong>${estimate.toFixed(2)}</strong>
          <p>Review your deductions or update income details to refine this estimate.</p>
        </div>
        <div className="section-title">Tax Calendar</div>
        <div className="timeline-card">
          <div className="timeline-item">
            <strong>Reminder: Q2 Estimated Tax Payment</strong>
            <span>Jun 15, 2025</span>
          </div>
          <div className="timeline-item">
            <strong>Q3 Estimated Tax Payment</strong>
            <span>Sep 15, 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
}
