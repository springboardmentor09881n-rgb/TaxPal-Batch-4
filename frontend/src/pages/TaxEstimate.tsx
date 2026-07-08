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

  const totalDeductions = [businessExpenses, retirement, insurance, homeOffice].reduce((sum, value) => sum + Number(value), 0);
  const taxableIncome = Math.max(0, Number(grossIncome) - totalDeductions);

  return (
    <div className="grid-layout">
      <div className="panel-block">
        <div className="section-title">Quarterly Tax Calculator</div>
        <form className="form-grid" onSubmit={calculate}>
          <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid #e0e0e0', paddingBottom: '15px', marginBottom: '10px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#666' }}>Filing Information</h3>
          </div>
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
          <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid #e0e0e0', paddingBottom: '15px', marginBottom: '10px', marginTop: '10px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#666' }}>Income & Deductions</h3>
          </div>
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
          <button type="submit" style={{ gridColumn: '1 / -1' }}>Calculate Estimated Tax</button>
        </form>
      </div>
      <div className="panel-block">
        <div className="section-title">Tax Summary</div>
        <div className="summary-card" style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <p style={{ color: '#666', margin: '0 0 8px 0', fontSize: '13px' }}>Gross Income</p>
            <strong style={{ fontSize: '18px', color: '#333' }}>${Number(grossIncome).toFixed(2)}</strong>
          </div>
          <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
            <p style={{ color: '#666', margin: '0 0 8px 0', fontSize: '13px' }}>Total Deductions</p>
            <strong style={{ fontSize: '18px', color: '#333' }}>-${totalDeductions.toFixed(2)}</strong>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <p style={{ color: '#666', margin: '0 0 8px 0', fontSize: '13px' }}>Taxable Income</p>
            <strong style={{ fontSize: '18px', color: '#333' }}>${taxableIncome.toFixed(2)}</strong>
          </div>
          <div style={{ paddingTop: '15px', borderTop: '2px solid #007bff', backgroundColor: '#e7f3ff', padding: '15px', borderRadius: '6px' }}>
            <p style={{ color: '#666', margin: '0 0 8px 0', fontSize: '13px' }}>Estimated Tax Obligation</p>
            <strong style={{ fontSize: '24px', color: '#007bff' }}>${estimate.toFixed(2)}</strong>
          </div>
        </div>
        <div className="section-title">Important Dates</div>
        <div className="timeline-card">
          <div className="timeline-item">
            <strong>Q1 Estimated Tax Payment</strong>
            <span>Apr 15, 2025</span>
          </div>
          <div className="timeline-item">
            <strong>Q2 Estimated Tax Payment</strong>
            <span>Jun 15, 2025</span>
          </div>
          <div className="timeline-item">
            <strong>Q3 Estimated Tax Payment</strong>
            <span>Sep 15, 2025</span>
          </div>
          <div className="timeline-item">
            <strong>Q4 Estimated Tax Payment</strong>
            <span>Jan 15, 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
