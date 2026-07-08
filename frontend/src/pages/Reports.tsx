import React from 'react';

export default function Reports({ reportPeriod, setReportPeriod, reportType, setReportType, reportFormat, setReportFormat }: { reportPeriod: string; setReportPeriod: React.Dispatch<React.SetStateAction<string>>; reportType: string; setReportType: React.Dispatch<React.SetStateAction<string>>; reportFormat: string; setReportFormat: React.Dispatch<React.SetStateAction<string>>; }) {
  return (
    <div className="grid-layout">
      <div className="panel-block">
        <div className="section-title">Financial Reports</div>
        <form className="form-grid">
          <label>
            Report Type
            <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
              <option>Income Statement</option>
              <option>Summary</option>
              <option>Tax</option>
            </select>
          </label>
          <label>
            Period
            <select value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value)}>
              <option>Current Month</option>
              <option>Last Quarter</option>
              <option>Year to Date</option>
            </select>
          </label>
          <label>
            Format
            <select value={reportFormat} onChange={(event) => setReportFormat(event.target.value)}>
              <option>PDF</option>
              <option>CSV</option>
            </select>
          </label>
          <button type="button">Generate Report</button>
        </form>
      </div>
      <div className="panel-block">
        <div className="section-title">Recent Reports</div>
        <div className="table-card placeholder-list">
          <div className="placeholder">No results.</div>
        </div>
        <div className="section-title">Report Preview</div>
        <div className="report-preview">
          <div className="placeholder">Select a report to preview before downloading.</div>
          <div className="preview-actions">
            <button type="button" className="secondary-button">Print</button>
            <button type="button">Download</button>
          </div>
        </div>
      </div>
    </div>
  );
}
