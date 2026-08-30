import { formatMoney } from '../lib/currency';

export default function GroceryItemRow({ item, currency, onEdit, onDelete }) {
  return (
    <div className="grocery-item-row">
      <div className="grocery-item-meta">
        <span className="grocery-item-name">{item.name}</span>
        <span className="grocery-item-amount">{formatMoney(item.amount, currency)}</span>
      </div>

      <div className="grocery-item-actions">
        <button type="button" className="text-button" onClick={() => onEdit?.(item)}>
          Edit
        </button>
        <button
          type="button"
          className="text-button danger"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete?.(item.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
