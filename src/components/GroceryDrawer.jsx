import { useEffect, useMemo, useState } from 'react';
import GroceryWeek from './GroceryWeek';
import { formatMoney } from '../lib/currency';

export default function GroceryDrawer({ isOpen, onClose, weeks, currency, selectedWeekId, onAddWeek, onDeleteWeek, onAddItem, onEditItem, onDeleteWeekItem, onToggleCollapse }) {
  const [editingItem, setEditingItem] = useState(null);

  const selectedWeek = weeks.find((week) => week.id === selectedWeekId) ?? weeks[0] ?? null;

  useEffect(() => {
    if (!isOpen) {
      setEditingItem(null);
    }
  }, [isOpen]);

  const total = useMemo(() => {
    if (!selectedWeek) {
      return weeks.reduce((sum, week) => sum + week.items.reduce((weekTotal, item) => weekTotal + Number(item.amount || 0), 0), 0);
    }

    return selectedWeek.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [selectedWeek, weeks]);

  const handleAddWeek = () => {
    onAddWeek?.();
  };

  const handleDeleteWeek = (weekId) => {
    onDeleteWeek?.(weekId);
  };

  const handleAddItem = (weekId, item) => {
    onAddItem?.(weekId, item);
  };

  const handleDeleteItem = (weekId, itemId) => {
    onDeleteWeekItem?.(weekId, itemId);
  };

  const handleToggleCollapse = (weekId) => {
    onToggleCollapse?.(weekId);
  };

  const handleEditItem = (weekId, item) => {
    setEditingItem({ weekId, item });
  };

  const saveEditedItem = (weekId, itemId, values) => {
    onEditItem?.(weekId, itemId, values);
    setEditingItem(null);
  };

  const renderEditor = () => {
    if (!editingItem) {
      return null;
    }

    const { weekId, item } = editingItem;

    return (
      <div className="grocery-edit-sheet">
        <h4>Edit item</h4>
        <input
          type="text"
          value={item.name}
          onChange={(event) => setEditingItem({
            weekId,
            item: { ...item, name: event.target.value },
          })}
        />
        <input
          type="number"
          min="0"
          value={item.amount}
          onChange={(event) => setEditingItem({
            weekId,
            item: { ...item, amount: Number(event.target.value) },
          })}
        />
        <div className="grocery-edit-actions">
          <button type="button" className="secondary-action" onClick={() => setEditingItem(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-action"
            onClick={() => saveEditedItem(weekId, item.id, { name: item.name, amount: Number(item.amount || 0) })}
          >
            Save
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`drawer-backdrop ${isOpen ? 'visible' : ''}`} onClick={onClose} />

      <aside className={`grocery-drawer ${isOpen ? 'open' : ''}`} aria-label="Groceries weekly breakdown">
        <div className="drawer-header">
          <div>
            <p className="drawer-kicker">Groceries</p>
            <h2>{selectedWeek ? selectedWeek.label : 'Groceries'}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close weekly breakdown">
            ×
          </button>
        </div>

        {selectedWeek ? (
          <>
            <div className="drawer-summary">
              <span>Total</span>
              <strong>{formatMoney(total, currency)}</strong>
            </div>

            <div className="drawer-weeks">
              <GroceryWeek
                week={selectedWeek}
                currency={currency}
                onAddItem={handleAddItem}
                onEditItem={(item) => handleEditItem(selectedWeek.id, item)}
                onDeleteItem={(itemId) => handleDeleteItem(selectedWeek.id, itemId)}
                onDeleteWeek={handleDeleteWeek}
                onToggleCollapse={handleToggleCollapse}
              />
            </div>
          </>
        ) : (
          <div className="empty-row">No week selected.</div>
        )}

        <button type="button" className="add-week-button" onClick={handleAddWeek}>
          + ADD WEEK
        </button>

        {renderEditor()}
      </aside>
    </>
  );
}
