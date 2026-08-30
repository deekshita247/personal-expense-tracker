import { useEffect, useState } from 'react';
import { formatMoney } from '../lib/currency';

export default function MonthlySummary({ salary, currency, spent, remaining, largestExpense, progress, onSalaryChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftSalary, setDraftSalary] = useState(String(salary));

  useEffect(() => {
    setDraftSalary(String(salary));
  }, [salary]);

  const handleSave = () => {
    const nextValue = Number(draftSalary);
    if (Number.isNaN(nextValue) || nextValue < 0) {
      return;
    }

    onSalaryChange(nextValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftSalary(String(salary));
    setIsEditing(false);
  };

  return (
    <section className="summary-panel">
      <div className="summary-row">
        <div className="summary-item summary-salary-item">
          <span className="summary-label">Monthly In-hand</span>

          {isEditing ? (
            <div className="salary-editor">
              <div className="salary-input-wrap">
                <span className="currency-pill">{currency}</span>
                <input
                  type="number"
                  min="0"
                  value={draftSalary}
                  onChange={(event) => setDraftSalary(event.target.value)}
                  aria-label="Monthly in-hand amount"
                />
              </div>
              <div className="salary-actions">
                <button type="button" className="tiny-button primary" onClick={handleSave}>
                  Save
                </button>
                <button type="button" className="tiny-button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="salary-readonly">
              <strong className="summary-value">{formatMoney(salary, currency)}</strong>
              <button type="button" className="salary-edit-button" onClick={() => setIsEditing(true)} aria-label="Edit monthly in-hand amount">
                ✎
              </button>
            </div>
          )}
        </div>
        <div className="summary-item">
          <span className="summary-label">Spent</span>
          <strong className="summary-value">{formatMoney(spent, currency)}</strong>
        </div>
        <div className="summary-item highlight-item">
          <span className="summary-label">Remaining</span>
          <strong className="summary-value">{formatMoney(remaining, currency)}</strong>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-meta">
          <span>Spending progress</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-bar" aria-label="Monthly spending progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="largest-expense">
        <span>Largest expense this month</span>
        <strong>{largestExpense.name}</strong>
        <small>{formatMoney(largestExpense.amount, currency)}</small>
      </div>
    </section>
  );
}
