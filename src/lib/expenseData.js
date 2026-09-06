import { supabase } from './supabaseClient';

export async function loadMonthData(userId, monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const { data: monthRow, error: monthError } = await supabase
    .from('months')
    .select('id, salary')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();

  if (monthError) throw monthError;
  if (!monthRow) return { monthId: null, salary: 0, expenses: [], weeks: [] };

  const [{ data: expenses, error: expensesError }, { data: weeks, error: weeksError }] = await Promise.all([
    supabase.from('expenses').select('id, category, name, amount, expense_date, grocery_week_id').eq('user_id', userId).eq('month_id', monthRow.id).order('created_at'),
    supabase.from('grocery_weeks').select('id, label').eq('user_id', userId).eq('month_id', monthRow.id).order('position'),
  ]);

  if (expensesError) throw expensesError;
  if (weeksError) throw weeksError;
  return { monthId: monthRow.id, salary: Number(monthRow.salary), expenses, weeks };
}

export async function ensureMonth(userId, monthKey, salary = 0) {
  const [year, month] = monthKey.split('-').map(Number);
  const { data: existing, error: selectError } = await supabase
    .from('months').select('id, salary').eq('user_id', userId).eq('year', year).eq('month', month).maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing;
  const { data, error } = await supabase
    .from('months')
    .insert({ user_id: userId, year, month, salary })
    .select('id, salary')
    .single();
  if (error?.code === '23505') {
    const { data: racedRow, error: racedError } = await supabase.from('months').select('id, salary').eq('user_id', userId).eq('year', year).eq('month', month).single();
    if (racedError) throw racedError;
    return racedRow;
  }
  if (error) throw error;
  return data;
}

export async function saveSalary(userId, monthKey, salary) {
  const [year, month] = monthKey.split('-').map(Number);
  const { data: monthRow, error } = await supabase.from('months').upsert({ user_id: userId, year, month, salary }, { onConflict: 'user_id,year,month' }).select('id').single();
  if (error) throw error;
  return monthRow.id;
}

export async function insertExpense({ userId, monthId, category, expense }) {
  const { data, error } = await supabase.from('expenses').insert({
    id: expense.id,
    user_id: userId,
    month_id: monthId,
    category,
    name: expense.name,
    amount: expense.amount,
    expense_date: expense.date || null,
    grocery_week_id: expense.groceryWeekId || null,
  }).select('id').single();
  if (error) throw error;
  return data;
}

export async function updateExpense(userId, expenseId, values) {
  const { error } = await supabase.from('expenses').update(values).eq('id', expenseId).eq('user_id', userId);
  if (error) throw error;
}

export async function deleteExpense(userId, expenseId) {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId).eq('user_id', userId);
  if (error) throw error;
}

export async function insertGroceryWeek({ id, userId, monthId, label, position }) {
  const { error } = await supabase.from('grocery_weeks').insert({ id, user_id: userId, month_id: monthId, label, position });
  if (error) throw error;
}

export async function deleteGroceryWeek(userId, weekId) {
  const { error } = await supabase.from('grocery_weeks').delete().eq('id', weekId).eq('user_id', userId);
  if (error) throw error;
}
