import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ExpenseCard from './ExpenseCard';

export default function SortableExpenseCard({
  category,
  expenses,
  groceryEntries = [],
  groceryWeeks = [],
  onOpenGroceries,
  onAddGroceryEntry,
  onAddGroceryWeek,
  onDeleteExpense,
  onDeleteWeekItem,
  groceryTotal,
  onGroceryWeeksChange,
  currency,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ExpenseCard
        category={category}
        currency={currency}
        expenses={expenses}
        groceryEntries={groceryEntries}
        groceryWeeks={groceryWeeks}
        onOpenGroceries={onOpenGroceries}
        onAddGroceryEntry={onAddGroceryEntry}
        onAddGroceryWeek={onAddGroceryWeek}
        onDeleteExpense={onDeleteExpense}
        onDeleteWeekItem={onDeleteWeekItem}
        dragHandleProps={{ ...attributes, ...listeners }}
        style={{}}
        isDragging={isDragging}
        groceryTotal={groceryTotal}
        onGroceryWeeksChange={onGroceryWeeksChange}
      />
    </div>
  );
}
