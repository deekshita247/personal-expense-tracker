export const STORAGE_KEYS = {
  categoryOrder: 'expense-tracker-category-order',
  expenseEntries: 'expense-tracker-expense-entries',
  normalGroceryEntries: 'expense-tracker-normal-grocery-entries',
  groceryWeeks: 'expense-tracker-grocery-weeks',
  monthlySalary: 'expense-tracker-monthly-salary',
  selectedMonth: 'expense-tracker-selected-month',
  monthlyData: 'expense-tracker-monthly-data',
  currency: 'expense-tracker-currency',
};

export function readStorage(key, fallbackValue) {
  if (typeof window === 'undefined') {
    return fallbackValue;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

export function writeStorage(key, value) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage write failures gracefully for the mock frontend version.
  }
}
