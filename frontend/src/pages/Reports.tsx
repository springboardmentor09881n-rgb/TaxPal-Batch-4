import React, { useState } from 'react';

export default function Reports({ reportPeriod, setReportPeriod, reportType, setReportType, reportFormat, setReportFormat }: { reportPeriod: string; setReportPeriod: React.Dispatch<React.SetStateAction<string>>; reportType: string; setReportType: React.Dispatch<React.SetStateAction<string>>; reportFormat: string; setReportFormat: React.Dispatch<React.SetStateAction<string>>; }) {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [generatedReports] = useState([
    { id: 1, type: 'Income Statement', period: 'Year to Date', date: '2025-06-15', format: 'PDF' },
    { id: 2, type: 'Summary', period: 'Last Quarter', date: '2025-06-10', format: 'CSV' },
    { id: 3, type: 'Tax', period: 'Current Month', date: '2025-06-08', format: 'PDF' },
  ]);

  const handleGenerateReport = () => {
    const newReport = { id: generatedReports.length + 1, type: reportType, period: reportPeriod, date: new Date().toISOString().slice(0, 10), format: reportFormat };
    setSelectedReport(newReport);
  };

  return (
    <div className="grid-layout">
      <div className="panel-block">
        <div className="section-title">Generate Financial Reports</div>
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); handleGenerateReport(); }}>
          <label>
            Report Type
            <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
              <option>Income Statement</option>
              <option>Summary</option>
              <option>Tax</option>
              <option>Cash Flow</option>
            </select>
          </label>
          <label>
            Period
            <select value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value)}>
              <option>Current Month</option>
              <option>Last Quarter</option>
              <option>Year to Date</option>
              <option>Custom Range</option>
            </select>
          </label>
          <label>
            Format
            <select value={reportFormat} onChange={(event) => setReportFormat(event.target.value)}>
              <option>PDF</option>
              <option>CSV</option>
              <option>Excel</option>
            </select>
          </label>
          <button type="submit" style={{ gridColumn: '1 / -1' }}>Generate Report</button>
        </form>
      </div>
      <div className="panel-block">
        <div className="section-title">Recently Generated Reports</div>
        <div className="table-card">
          {generatedReports.length > 0 ? (
            <>
              <div className="table-row header-row">
                <span>Report Type</span>
                <span>Period</span>
                <span>Generated</span>
                <span>Format</span>
                <span>Action</span>
              </div>
              {generatedReports.map((report) => (
                <div 
                  className="table-row" 
                  key={report.id}
                  style={{ cursor: 'pointer', backgroundColor: selectedReport?.id === report.id ? '#e3f2fd' : 'transparent' }}
                >
                  <span>{report.type}</span>
                  <span>{report.period}</span>
                  <span>{report.date}</span>
                  <span>{report.format}</span>
                  <span>
                    <button 
                      type="button"
                      onClick={() => setSelectedReport(report)}
                      style={{ background: '#007bff', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                    >
                      View
                    </button>
                  </span>
                </div>
              ))}
            </>
          ) : (
            <div className="placeholder">No reports generated yet.</div>
          )}
        </div>
      </div>
      <div className="panel-block">
        <div className="section-title">Report Preview</div>
        {selectedReport ? (
          <div className="report-preview" style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{selectedReport.type}</h3>
              <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Period: {selectedReport.period}</p>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Generated: {selectedReport.date}</p>
            </div>
            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '6px', minHeight: '200px', marginBottom: '20px', border: '1px solid #e0e0e0' }}>
              <p style={{ color: '#999', textAlign: 'center', marginTop: '80px' }}>📄 Preview content for {selectedReport.type}</p>
            </div>
            <div className="preview-actions" style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="secondary-button" style={{ flex: 1 }}>Print</button>
              <button type="button" style={{ flex: 1 }}>Download {selectedReport.format}</button>
            </div>
          </div>
        ) : (
          <div className="report-preview">
            <div className="placeholder" style={{ padding: '60px 20px' }}>Select a report from the list to preview before downloading.</div>
          </div>
        )}
      </div>
    </div>
  );
}
