import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import DashboardHeader from '../components/DashboardHeader';
import GroceryDrawer from '../components/GroceryDrawer';
import MonthlySummary from '../components/MonthlySummary';
import SortableExpenseCard from '../components/SortableExpenseCard';
import { categories as defaultCategories } from '../data/categories';
import { readStorage, writeStorage, STORAGE_KEYS } from '../lib/persistence';
import { deleteExpense, deleteGroceryWeek, ensureMonth, insertExpense, insertGroceryWeek, loadMonthData, saveSalary, updateExpense } from '../lib/expenseData';

const emptyEntries = () => Object.fromEntries(defaultCategories.map(({ id }) => [id, []]));
const newId = () => crypto.randomUUID();
const currentMonthKey = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; };
const sumAmounts = (items) => items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

export default function Dashboard({ user, onLogout, isLoggingOut }) {
  const [selectedMonth, setSelectedMonth] = useState(() => readStorage(STORAGE_KEYS.selectedMonth, currentMonthKey()));
  const [categoryOrder, setCategoryOrder] = useState(() => readStorage(STORAGE_KEYS.categoryOrder, defaultCategories));
  const [expenseEntries, setExpenseEntries] = useState(emptyEntries);
  const [normalGroceryEntries, setNormalGroceryEntries] = useState([]);
  const [groceryWeeks, setGroceryWeeks] = useState([]);
  const [selectedGroceryWeekId, setSelectedGroceryWeekId] = useState(null);
  const [salary, setSalary] = useState(0);
  const [currency, setCurrency] = useState(() => readStorage(STORAGE_KEYS.currency, 'AED'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [monthId, setMonthId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const loadSequence = useRef(0);

  const reportError = useCallback((error) => { console.error(error); setDataError(error?.message || 'Could not save your changes. Please try again.'); }, []);
  const fetchMonth = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setIsLoading(true); setDataError('');
    try {
      const data = await loadMonthData(user.id, selectedMonth);
      if (sequence !== loadSequence.current) return;
      const grouped = emptyEntries();
      const groceries = [];
      const weekMap = new Map(data.weeks.map((week) => [week.id, { ...week, collapsed: false, items: [] }]));
      data.expenses.forEach((row) => {
        const item = { id: row.id, name: row.name, amount: Number(row.amount), date: row.expense_date };
        if (row.category === 'groceries' && row.grocery_week_id && weekMap.has(row.grocery_week_id)) weekMap.get(row.grocery_week_id).items.push(item);
        else if (row.category === 'groceries') groceries.push(item);
        else (grouped[row.category] ||= []).push(item);
      });
      const weeks = [...weekMap.values()];
      setMonthId(data.monthId); setSalary(data.salary); setExpenseEntries(grouped); setNormalGroceryEntries(groceries); setGroceryWeeks(weeks); setSelectedGroceryWeekId(weeks[0]?.id ?? null);
    } catch (error) { if (sequence === loadSequence.current) reportError(error); } finally { if (sequence === loadSequence.current) setIsLoading(false); }
  }, [reportError, selectedMonth, user.id]);

  useEffect(() => { fetchMonth(); }, [fetchMonth]);
  useEffect(() => { writeStorage(STORAGE_KEYS.categoryOrder, categoryOrder); }, [categoryOrder]);
  useEffect(() => { writeStorage(STORAGE_KEYS.currency, currency); }, [currency]);
  useEffect(() => { writeStorage(STORAGE_KEYS.selectedMonth, selectedMonth); }, [selectedMonth]);

  const getMonthId = async () => { if (monthId) return monthId; const row = await ensureMonth(user.id, selectedMonth, salary); setMonthId(row.id); return row.id; };
  const addRow = async (category, expense, groceryWeekId = null) => {
    try { const id = await getMonthId(); await insertExpense({ userId: user.id, monthId: id, category, expense: { ...expense, groceryWeekId } }); setDataError(''); }
    catch (error) { reportError(error); await fetchMonth(); }
  };
  const removeRow = (expenseId) => void deleteExpense(user.id, expenseId).catch(async (error) => { reportError(error); await fetchMonth(); });

  const handleAddExpense = (category, expense) => { setExpenseEntries((current) => ({ ...current, [category]: [...(current[category] || []), expense] })); void addRow(category, expense); };
  const handleDeleteExpense = (category, id) => { setExpenseEntries((current) => ({ ...current, [category]: current[category].filter((item) => item.id !== id) })); removeRow(id); };
  const handleAddNormalGrocery = (expense) => { setNormalGroceryEntries((current) => [...current, expense]); void addRow('groceries', expense); };
  const handleDeleteNormalGrocery = (id) => { setNormalGroceryEntries((current) => current.filter((item) => item.id !== id)); removeRow(id); };
  const handleSalaryChange = (value) => { setSalary(value); void saveSalary(user.id, selectedMonth, value).then(setMonthId).catch(async (error) => { reportError(error); await fetchMonth(); }); };
  const handleAddWeek = async () => {
    const week = { id: newId(), label: `Week ${groceryWeeks.length + 1}`, collapsed: false, items: [] };
    setGroceryWeeks((current) => [...current, week]); setSelectedGroceryWeekId(week.id);
    try { const id = await getMonthId(); await insertGroceryWeek({ id: week.id, userId: user.id, monthId: id, label: week.label, position: groceryWeeks.length }); }
    catch (error) { reportError(error); await fetchMonth(); }
  };
  const handleDeleteWeek = (id) => { setGroceryWeeks((current) => current.filter((week) => week.id !== id)); setSelectedGroceryWeekId((current) => current === id ? null : current); void deleteGroceryWeek(user.id, id).catch(async (error) => { reportError(error); await fetchMonth(); }); };
  const handleAddWeekItem = (weekId, item) => { setGroceryWeeks((current) => current.map((week) => week.id === weekId ? { ...week, items: [...week.items, item] } : week)); void addRow('groceries', item, weekId); };
  const handleDeleteWeekItem = (weekId, id) => { setGroceryWeeks((current) => current.map((week) => week.id === weekId ? { ...week, items: week.items.filter((item) => item.id !== id) } : week)); removeRow(id); };
  const handleEditWeekItem = (weekId, id, values) => { setGroceryWeeks((current) => current.map((week) => week.id === weekId ? { ...week, items: week.items.map((item) => item.id === id ? { ...item, ...values } : item) } : week)); void updateExpense(user.id, id, { name: values.name, amount: values.amount }).catch(async (error) => { reportError(error); await fetchMonth(); }); };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const groceryItems = useMemo(() => groceryWeeks.flatMap((week) => week.items), [groceryWeeks]);
  const groceryTotal = useMemo(() => sumAmounts(normalGroceryEntries) + sumAmounts(groceryItems), [normalGroceryEntries, groceryItems]);
  const nonGroceries = useMemo(() => Object.entries(expenseEntries).flatMap(([key, items]) => key === 'groceries' ? [] : items), [expenseEntries]);
  const spent = useMemo(() => sumAmounts(nonGroceries) + groceryTotal, [nonGroceries, groceryTotal]);
  const largestExpense = useMemo(() => [...nonGroceries, ...normalGroceryEntries, ...groceryItems].reduce((largest, item) => Number(item.amount) > Number(largest.amount) ? item : largest, { name: 'No expenses yet', amount: 0 }), [nonGroceries, normalGroceryEntries, groceryItems]);
  const changeMonth = (offset) => { const [year, month] = selectedMonth.split('-').map(Number); const date = new Date(year, month - 1 + offset, 1); setDrawerOpen(false); setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`); };
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${selectedMonth}-01T00:00:00`));

  if (isLoading) return <main className="app-shell dashboard-page"><section className="auth-card loading-card"><div className="loading-spinner" /><p>Loading your expenses...</p></section></main>;
  return <main className="app-shell dashboard-page">
    <DashboardHeader monthLabel={monthLabel} currency={currency} onCurrencyChange={setCurrency} onPreviousMonth={() => changeMonth(-1)} onNextMonth={() => changeMonth(1)} onLogout={onLogout} isLoggingOut={isLoggingOut} />
    {dataError ? <p role="alert" className="data-error">{dataError}</p> : null}
    <MonthlySummary salary={salary} currency={currency} spent={spent} remaining={salary - spent} largestExpense={largestExpense} progress={salary > 0 ? Math.round((spent / salary) * 100) : 0} onSalaryChange={handleSalaryChange} />
    <section className="category-section" aria-label="Expense categories"><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => { if (over && active.id !== over.id) setCategoryOrder((order) => arrayMove(order, order.findIndex((x) => x.id === active.id), order.findIndex((x) => x.id === over.id))); }}><SortableContext items={categoryOrder.map(({ id }) => id)} strategy={rectSortingStrategy}><div className="category-grid">
      {categoryOrder.map((category) => <SortableExpenseCard key={category.id} category={category} expenses={category.id === 'groceries' ? normalGroceryEntries : expenseEntries[category.id] || []} groceryEntries={category.id === 'groceries' ? normalGroceryEntries : []} onOpenGroceries={(weekId) => { setSelectedGroceryWeekId(weekId || groceryWeeks[0]?.id || null); setDrawerOpen(true); }} groceryTotal={category.id === 'groceries' ? groceryTotal : undefined} currency={currency} groceryWeeks={category.id === 'groceries' ? groceryWeeks : []} onAddGroceryEntry={category.id === 'groceries' ? handleAddNormalGrocery : undefined} onAddGroceryWeek={category.id === 'groceries' ? handleAddWeek : undefined} onDeleteExpense={category.id === 'groceries' ? handleDeleteNormalGrocery : (id) => handleDeleteExpense(category.id, id)} onAddExpense={category.id === 'groceries' ? undefined : (expense) => handleAddExpense(category.id, expense)} />)}
    </div></SortableContext></DndContext></section>
    <GroceryDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} weeks={groceryWeeks} currency={currency} selectedWeekId={selectedGroceryWeekId} onAddWeek={handleAddWeek} onDeleteWeek={handleDeleteWeek} onAddItem={handleAddWeekItem} onEditItem={handleEditWeekItem} onDeleteWeekItem={handleDeleteWeekItem} onToggleCollapse={(weekId) => setGroceryWeeks((current) => current.map((week) => week.id === weekId ? { ...week, collapsed: !week.collapsed } : week))} />
  </main>;
}
