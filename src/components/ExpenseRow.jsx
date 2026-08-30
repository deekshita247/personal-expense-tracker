import { formatMoney } from '../lib/currency';

export default function ExpenseRow({ item, currency, onDelete }) {
  return (
    <div className="expense-row" key={item.id}>
      <span className="expense-name">{item.name}</span>

      <div className="expense-row-meta">
        <span className="expense-amount">{formatMoney(item.amount, currency)}</span>
        {onDelete ? (
          <button
            type="button"
            className="delete-row-button"
            aria-label={`Delete ${item.name}`}
            title="Delete item"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(item.id);
            }}
          >
            🗑
          </button>
        ) : null}
      </div>
    </div>
  );
}
