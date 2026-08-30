import { CURRENCIES } from '../lib/currency';

export default function DashboardHeader({ monthLabel, currency, onCurrencyChange, onPreviousMonth, onNextMonth, onLogout, isLoggingOut }) {
  return (
    <header className="topbar">
      <div className="title-block">
        <p className="eyebrow">Expense tracker</p>
        <h1>EXPENSE TRACKER</h1>
      </div>

      <div className="month-navigation" aria-label="Month navigation">
        <button type="button" className="nav-button" aria-label="Previous month" onClick={onPreviousMonth}>
          {'<'}
        </button>
        <span className="month-label">{monthLabel}</span>
        <button type="button" className="nav-button" aria-label="Next month" onClick={onNextMonth}>
          {'>'}
        </button>
      </div>

      <div className="topbar-actions">
        <label className="currency-selector">
          <span>Currency</span>
          <select value={currency} onChange={(event) => onCurrencyChange(event.target.value)}>
            {CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
          </select>
        </label>
        <button type="button" className="logout-button" onClick={onLogout} disabled={isLoggingOut}>
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </header>
  );
}
