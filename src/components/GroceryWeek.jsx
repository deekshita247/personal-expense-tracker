import { useState } from 'react';
import GroceryItemRow from './GroceryItemRow';
import { formatMoney } from '../lib/currency';

export default function GroceryWeek({ week, currency, onAddItem, onEditItem, onDeleteItem, onDeleteWeek, onToggleCollapse }) {
  const [draftName, setDraftName] = useState('');
  const [draftAmount, setDraftAmount] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!draftName.trim() || !draftAmount) {
      return;
    }

    onAddItem(week.id, {
      id: crypto.randomUUID(),
      name: draftName.trim(),
      amount: Number(draftAmount),
    });

    setDraftName('');
    setDraftAmount('');
  };

  const total = week.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <section className="grocery-week">
      <div className="grocery-week-header">
        <button type="button" className="week-toggle" onClick={() => onToggleCollapse?.(week.id)}>
          {week.collapsed ? '▸' : '▾'}
        </button>

        <div className="week-title-wrap">
          <h3>{week.label}</h3>
          <span>Total: {formatMoney(total, currency)}</span>
        </div>

        <button
          type="button"
          className="delete-week-button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDeleteWeek?.(week.id);
          }}
        >
          Delete week
        </button>
      </div>

      {!week.collapsed ? (
        <>
          <div className="grocery-items">
            {week.items.length ? (
              week.items.map((item) => (
                <GroceryItemRow
                  key={item.id}
                  item={item}
                  currency={currency}
                  onEdit={onEditItem}
                  onDelete={(itemId) => onDeleteItem(itemId)}
                />
              ))
            ) : (
              <p className="empty-week-label">No grocery items yet.</p>
            )}
          </div>

          <form className="grocery-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Item name"
              aria-label={`Item name for ${week.label}`}
            />
            <input
              type="number"
              min="0"
              value={draftAmount}
              onChange={(event) => setDraftAmount(event.target.value)}
              placeholder={`${currency} amount`}
              aria-label={`Amount for ${week.label}`}
            />
            <button type="submit" className="add-item-button">
              + Add Item
            </button>
          </form>
        </>
      ) : null}
    </section>
  );
}
