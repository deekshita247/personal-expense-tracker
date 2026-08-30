import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import DashboardHeader from '../components/DashboardHeader';
import GroceryDrawer from '../components/GroceryDrawer';
import MonthlySummary from '../components/MonthlySummary';
import SortableExpenseCard from '../components/SortableExpenseCard';
import { categories as defaultCategories } from '../data/categories';
import { mockExpenses } from '../data/mockExpenses';
import { readStorage, writeStorage, STORAGE_KEYS } from '../lib/persistence';

const DEFAULT_SALARY = 12000;

const defaultNormalGroceryEntries = [
  { id: 'grocery-lulu', name: 'Lulu', amount: 100 },
  { id: 'grocery-farmer-market', name: 'Farmer Market', amount: 80 },
];

const defaultGroceryWeeks = [
  {
    id: 'week-1',
    label: 'Week 1',
    collapsed: false,
    items: [
      { id: 'week-1-milk', name: 'Milk', amount: 30 },
      { id: 'week-1-bread', name: 'Bread', amount: 40 },
      { id: 'week-1-vegetables', name: 'Vegetables', amount: 30 },
    ],
  },
  {
    id: 'week-2',
    label: 'Week 2',
    collapsed: false,
    items: [
      { id: 'week-2-lulu', name: 'Lulu', amount: 80 },
      { id: 'week-2-fruit', name: 'Fruit', amount: 60 },
    ],
  },
  {
    id: 'week-3',
    label: 'Week 3',
    collapsed: false,
    items: [
      { id: 'week-3-market', name: 'Farmer Market', amount: 90 },
    ],
  },
  {
    id: 'week-4',
    label: 'Week 4',
    collapsed: false,
    items: [
      { id: 'week-4-carrefour', name: 'Carrefour', amount: 110 },
    ],
  },
];

function sumAmounts(items) {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function getDefaultCategoryOrder() {
  return readStorage(STORAGE_KEYS.categoryOrder, defaultCategories);
}

function getDefaultExpenseEntries() {
  return readStorage(STORAGE_KEYS.expenseEntries, mockExpenses);
}

function getDefaultNormalGroceryEntries() {
  return readStorage(STORAGE_KEYS.normalGroceryEntries, defaultNormalGroceryEntries);
}

function getDefaultGroceryWeeks() {
  return readStorage(STORAGE_KEYS.groceryWeeks, defaultGroceryWeeks);
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getLegacySnapshot() {
  return {
    expenseEntries: getDefaultExpenseEntries(),
    normalGroceryEntries: getDefaultNormalGroceryEntries(),
    groceryWeeks: getDefaultGroceryWeeks(),
    salary: readStorage(STORAGE_KEYS.monthlySalary, DEFAULT_SALARY),
  };
}

function getSnapshot(monthKey) {
  return readStorage(STORAGE_KEYS.monthlyData, {})[monthKey] ?? getLegacySnapshot();
}

function getNewMonthSnapshot() {
  return {
    expenseEntries: structuredClone(mockExpenses),
    normalGroceryEntries: structuredClone(defaultNormalGroceryEntries),
    groceryWeeks: structuredClone(defaultGroceryWeeks),
    salary: DEFAULT_SALARY,
  };
}

export default function Dashboard({ onLogout, isLoggingOut }) {
  const [selectedMonth, setSelectedMonth] = useState(() => readStorage(STORAGE_KEYS.selectedMonth, getCurrentMonthKey()));
  const [initialSnapshot] = useState(() => getSnapshot(selectedMonth));
  const [categoryOrder, setCategoryOrder] = useState(getDefaultCategoryOrder);
  const [expenseEntries, setExpenseEntries] = useState(initialSnapshot.expenseEntries);
  const [normalGroceryEntries, setNormalGroceryEntries] = useState(initialSnapshot.normalGroceryEntries);
  const [groceryWeeks, setGroceryWeeks] = useState(initialSnapshot.groceryWeeks);
  const [selectedGroceryWeekId, setSelectedGroceryWeekId] = useState(defaultGroceryWeeks[0].id);
  const [salary, setSalary] = useState(initialSnapshot.salary);
  const [currency, setCurrency] = useState(() => readStorage(STORAGE_KEYS.currency, 'AED'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    writeStorage(STORAGE_KEYS.categoryOrder, categoryOrder);
  }, [categoryOrder]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.expenseEntries, expenseEntries);
  }, [expenseEntries]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.normalGroceryEntries, normalGroceryEntries);
  }, [normalGroceryEntries]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.groceryWeeks, groceryWeeks);
  }, [groceryWeeks]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.monthlySalary, salary);
  }, [salary]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.currency, currency);
  }, [currency]);

  useEffect(() => {
    const monthlyData = readStorage(STORAGE_KEYS.monthlyData, {});
    writeStorage(STORAGE_KEYS.monthlyData, {
      ...monthlyData,
      [selectedMonth]: { expenseEntries, normalGroceryEntries, groceryWeeks, salary },
    });
  }, [selectedMonth, expenseEntries, normalGroceryEntries, groceryWeeks, salary]);

  useEffect(() => {
    if (selectedGroceryWeekId && !groceryWeeks.some((week) => week.id === selectedGroceryWeekId)) {
      setSelectedGroceryWeekId(groceryWeeks[0]?.id ?? null);
    }
  }, [groceryWeeks, selectedGroceryWeekId]);

  const groceryItems = useMemo(() => groceryWeeks.flatMap((week) => week.items), [groceryWeeks]);
  const groceryTotal = useMemo(
    () => sumAmounts(normalGroceryEntries) + sumAmounts(groceryItems),
    [groceryItems, normalGroceryEntries],
  );

  const spent = useMemo(() => {
    const nonGroceries = Object.entries(expenseEntries).flatMap(([categoryKey, items]) => {
      if (categoryKey === 'groceries') {
        return [];
      }

      return items;
    });

    return nonGroceries.reduce((sum, item) => sum + Number(item.amount || 0), 0) + groceryTotal;
  }, [expenseEntries, groceryTotal]);

  const remaining = salary - spent;
  const progress = salary > 0 ? Math.round((spent / salary) * 100) : 0;

  const largestExpense = useMemo(() => {
    const nonGroceries = Object.entries(expenseEntries).flatMap(([categoryKey, items]) => {
      if (categoryKey === 'groceries') {
        return [];
      }

      return items;
    });

    return [...nonGroceries, ...normalGroceryEntries, ...groceryItems].reduce(
      (largest, item) => (Number(item.amount) > Number(largest.amount) ? item : largest),
      { name: 'Rent', amount: 0 },
    );
  }, [expenseEntries, groceryItems, normalGroceryEntries]);

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) {
      return;
    }

    setCategoryOrder((currentOrder) => {
      const oldIndex = currentOrder.findIndex((category) => category.id === active.id);
      const newIndex = currentOrder.findIndex((category) => category.id === over.id);
      return arrayMove(currentOrder, oldIndex, newIndex);
    });
  };

  const handleDeleteExpense = (categoryId, expenseId) => {
    setExpenseEntries((currentEntries) => ({
      ...currentEntries,
      [categoryId]: (currentEntries[categoryId] || []).filter((item) => item.id !== expenseId),
    }));
  };

  const handleDeleteNormalGroceryEntry = (expenseId) => {
    setNormalGroceryEntries((currentEntries) => currentEntries.filter((item) => item.id !== expenseId));
  };

  const handleDeleteWeekItem = (weekId, itemId) => {
    setGroceryWeeks((currentWeeks) =>
      currentWeeks.map((week) =>
        week.id === weekId ? { ...week, items: week.items.filter((item) => item.id !== itemId) } : week,
      ),
    );
  };

  const handleAddNormalGroceryEntry = (entry) => {
    setNormalGroceryEntries((currentEntries) => [...currentEntries, entry]);
  };

  const handleAddGroceryWeek = () => {
    setGroceryWeeks((currentWeeks) => {
      const nextIndex = currentWeeks.length + 1;
      return [
        ...currentWeeks,
        {
          id: `week-${nextIndex}-${Date.now()}`,
          label: `Week ${nextIndex}`,
          collapsed: false,
          items: [],
        },
      ];
    });
  };

  const changeMonth = (offset) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month - 1 + offset, 1);
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    const monthlyData = readStorage(STORAGE_KEYS.monthlyData, {});
    monthlyData[selectedMonth] = { expenseEntries, normalGroceryEntries, groceryWeeks, salary };
    const nextSnapshot = monthlyData[nextMonth] ?? getNewMonthSnapshot();

    writeStorage(STORAGE_KEYS.monthlyData, monthlyData);
    writeStorage(STORAGE_KEYS.selectedMonth, nextMonth);
    setExpenseEntries(nextSnapshot.expenseEntries);
    setNormalGroceryEntries(nextSnapshot.normalGroceryEntries);
    setGroceryWeeks(nextSnapshot.groceryWeeks);
    setSalary(nextSnapshot.salary);
    setSelectedGroceryWeekId(nextSnapshot.groceryWeeks[0]?.id ?? null);
    setDrawerOpen(false);
    setSelectedMonth(nextMonth);
  };

  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
    .format(new Date(`${selectedMonth}-01T00:00:00`));

  return (
    <main className="app-shell dashboard-page">
      <DashboardHeader
        monthLabel={monthLabel}
        currency={currency}
        onCurrencyChange={setCurrency}
        onPreviousMonth={() => changeMonth(-1)}
        onNextMonth={() => changeMonth(1)}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />

      <MonthlySummary
        salary={salary}
        currency={currency}
        spent={spent}
        remaining={remaining}
        largestExpense={largestExpense}
        progress={progress}
        onSalaryChange={setSalary}
      />

      <section className="category-section" aria-label="Expense categories">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categoryOrder.map((category) => category.id)} strategy={rectSortingStrategy}>
            <div className="category-grid">
              {categoryOrder.map((category) => {
                const expenseItems = category.id === 'groceries' ? normalGroceryEntries : (expenseEntries[category.id] || []);

                return (
                  <SortableExpenseCard
                    key={category.id}
                    category={category}
                    expenses={expenseItems}
                    groceryEntries={category.id === 'groceries' ? normalGroceryEntries : []}
                    onOpenGroceries={(weekId) => {
                      if (weekId) {
                        setSelectedGroceryWeekId(weekId);
                      } else if (!selectedGroceryWeekId && groceryWeeks.length) {
                        setSelectedGroceryWeekId(groceryWeeks[0].id);
                      }
                      setDrawerOpen(true);
                    }}
                    groceryTotal={category.id === 'groceries' ? groceryTotal : undefined}
                    currency={currency}
                    groceryWeeks={category.id === 'groceries' ? groceryWeeks : []}
                    onGroceryWeeksChange={category.id === 'groceries' ? setGroceryWeeks : () => {}}
                    onAddGroceryEntry={category.id === 'groceries' ? handleAddNormalGroceryEntry : () => {}}
                    onAddGroceryWeek={category.id === 'groceries' ? handleAddGroceryWeek : () => {}}
                    onDeleteExpense={category.id === 'groceries' ? handleDeleteNormalGroceryEntry : (expenseId) => handleDeleteExpense(category.id, expenseId)}
                    onDeleteWeekItem={handleDeleteWeekItem}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <GroceryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        weeks={groceryWeeks}
        currency={currency}
        onWeeksChange={setGroceryWeeks}
        selectedWeekId={selectedGroceryWeekId}
        onSelectWeek={setSelectedGroceryWeekId}
        onDeleteWeekItem={handleDeleteWeekItem}
      />
    </main>
  );
}
