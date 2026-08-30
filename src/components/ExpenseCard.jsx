import { useMemo, useState } from 'react';
import ExpenseRow from './ExpenseRow';
import { formatMoney } from '../lib/currency';

const categoryAccentMap = {
  groceries: { accent: '#FDCED0', soft: '#FFF6F7', strong: '#956667' },
  electricity: { accent: '#6CCCCB', soft: '#F5FCFC', strong: '#6EA9A8' },
  loans: { accent: '#FDCED0', soft: '#FFF6F7', strong: '#956667' },
  petrol: { accent: '#6EA9A8', soft: '#F0F8F8', strong: '#6EA9A8' },
  medical: { accent: '#6CCCCB', soft: '#F4FDFC', strong: '#6EA9A8' },
  'online-shopping': { accent: '#FDCED0', soft: '#FFF7F8', strong: '#956667' },
  restaurants: { accent: '#6EA9A8', soft: '#F1F9F9', strong: '#6EA9A8' },
  'going-out': { accent: '#6CCCCB', soft: '#F4FDFC', strong: '#6EA9A8' },
  education: { accent: '#FDCED0', soft: '#FFF7F8', strong: '#956667' },
  rent: { accent: '#6EA9A8', soft: '#F1F9F9', strong: '#6EA9A8' },
  miscellaneous: { accent: '#6CCCCB', soft: '#F4FDFC', strong: '#6EA9A8' },
};

export default function ExpenseCard({
  category,
  currency,
  expenses,
  groceryEntries = [],
  onOpenGroceries,
  onDeleteExpense,
  dragHandleProps = {},
  style = {},
  isDragging = false,
  groceryTotal,
  groceryWeeks = [],
  onAddGroceryEntry = () => {},
  onAddGroceryWeek = () => {},
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [groceryDraftName, setGroceryDraftName] = useState('');
  const [groceryDraftAmount, setGroceryDraftAmount] = useState('');

  const accent = categoryAccentMap[category.id] ?? categoryAccentMap.miscellaneous;
  const total = useMemo(() => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0), [expenses]);
  const visibleTotal = category.id === 'groceries' && groceryTotal !== undefined ? groceryTotal : total;

  const handleAddGroceryItem = () => {
    const name = groceryDraftName.trim();
    const value = Number(groceryDraftAmount);

    if (!name || !Number.isFinite(value) || value < 0) {
      return;
    }

    onAddGroceryEntry({ id: `${Date.now()}-${name}`, name, amount: value });

    setGroceryDraftName('');
    setGroceryDraftAmount('');
  };

  return (
    <article
      className={`expense-card ${isDragging ? 'dragging' : ''}`}
      style={{
        ...style,
        '--card-accent': accent.accent,
        '--card-accent-soft': accent.soft,
        '--card-accent-strong': accent.strong,
      }}
    >
      <div className="expense-card-accent" aria-hidden="true" />

      <div className="expense-card-toolbar">
        <button type="button" className="drag-handle" aria-label={`Drag ${category.name}`} title="Drag to reorder" {...dragHandleProps}>
          ⋮⋮
        </button>

        <button type="button" className="expense-card-header" onClick={() => setIsOpen((current) => !current)}>
          <div className="category-heading">
            <span className="category-icon" aria-hidden="true">{category.icon}</span>
            <div className="category-title-block">
              <h3>{category.name}</h3>
              <strong>{formatMoney(visibleTotal, currency)}</strong>
            </div>
          </div>
          <span className="collapse-indicator">{isOpen ? '−' : '+'}</span>
        </button>
      </div>

      {isOpen ? (
        <div className="expense-card-body">
          {category.id === 'groceries' ? (
            <>
              <div className="expense-list grocery-preview-list">
                {groceryEntries.length ? (
                  groceryEntries.map((item) => (
                    <ExpenseRow key={item.id} item={item} currency={currency} onDelete={onDeleteExpense} />
                  ))
                ) : null}

                {groceryWeeks.length ? (
                  groceryWeeks.map((week) => {
                    const weekTotal = week.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

                    return (
                      <button
                        type="button"
                        key={week.id}
                        className="grocery-week-preview"
                        onClick={() => onOpenGroceries?.(week.id)}
                      >
                        <div className="grocery-week-preview-header">
                          <span>{week.label}</span>
                          <strong>{formatMoney(weekTotal, currency)} <span aria-hidden="true">›</span></strong>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="empty-row">No groceries yet.</div>
                )}
              </div>

              <div className="grocery-card-controls">
                <div className="grocery-mini-form">
                  <input
                    type="text"
                    value={groceryDraftName}
                    onChange={(event) => setGroceryDraftName(event.target.value)}
                    placeholder="Milk"
                    aria-label="Grocery item name"
                  />
                  <input
                    type="number"
                    min="0"
                    value={groceryDraftAmount}
                    onChange={(event) => setGroceryDraftAmount(event.target.value)}
                    placeholder={currency}
                    aria-label="Grocery item amount"
                  />
                </div>

                <div className="mini-action-row">
                  <button type="button" className="mini-button primary" onClick={handleAddGroceryItem}>
                    + Add item
                  </button>
                  <button type="button" className="mini-button" onClick={onAddGroceryWeek}>
                    + Add week
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="expense-list">
                {expenses.map((item) => (
                  <ExpenseRow key={item.id} item={item} currency={currency} onDelete={(expenseId) => onDeleteExpense?.(expenseId)} />
                ))}
              </div>

              <div className="expense-input-row">
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Item name"
                  aria-label={`${category.name} item name`}
                />
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder={currency}
                  aria-label={`${category.name} amount`}
                />
                <button type="button" className="add-button">
                  + Add
                </button>
              </div>
            </>
          )}

          {category.id !== 'groceries' ? (
            <button type="button" className="weekly-breakdown-button" onClick={onOpenGroceries}>
              Weekly breakdown
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
