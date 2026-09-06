create extension if not exists pgcrypto;

create table if not exists public.months (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month smallint not null check (month between 1 and 12),
  year integer not null check (year between 1900 and 9999),
  salary numeric(12,2) not null default 0 check (salary >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, year, month),
  unique (id, user_id)
);

create table if not exists public.grocery_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_id uuid not null,
  label text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (month_id, user_id) references public.months(id, user_id) on delete cascade
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_id uuid not null,
  category text not null,
  name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  expense_date date,
  grocery_week_id uuid,
  created_at timestamptz not null default now(),
  foreign key (month_id, user_id) references public.months(id, user_id) on delete cascade,
  foreign key (grocery_week_id, user_id) references public.grocery_weeks(id, user_id) on delete cascade
);

create index if not exists expenses_user_month_idx on public.expenses (user_id, month_id);
create index if not exists grocery_weeks_user_month_idx on public.grocery_weeks (user_id, month_id);

alter table public.months enable row level security;
alter table public.grocery_weeks enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "Users select own months" on public.months;
drop policy if exists "Users insert own months" on public.months;
drop policy if exists "Users update own months" on public.months;
drop policy if exists "Users delete own months" on public.months;
create policy "Users select own months" on public.months for select using (auth.uid() = user_id);
create policy "Users insert own months" on public.months for insert with check (auth.uid() = user_id);
create policy "Users update own months" on public.months for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own months" on public.months for delete using (auth.uid() = user_id);

drop policy if exists "Users select own grocery weeks" on public.grocery_weeks;
drop policy if exists "Users insert own grocery weeks" on public.grocery_weeks;
drop policy if exists "Users update own grocery weeks" on public.grocery_weeks;
drop policy if exists "Users delete own grocery weeks" on public.grocery_weeks;
create policy "Users select own grocery weeks" on public.grocery_weeks for select using (auth.uid() = user_id);
create policy "Users insert own grocery weeks" on public.grocery_weeks for insert with check (auth.uid() = user_id);
create policy "Users update own grocery weeks" on public.grocery_weeks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own grocery weeks" on public.grocery_weeks for delete using (auth.uid() = user_id);

drop policy if exists "Users select own expenses" on public.expenses;
drop policy if exists "Users insert own expenses" on public.expenses;
drop policy if exists "Users update own expenses" on public.expenses;
drop policy if exists "Users delete own expenses" on public.expenses;
create policy "Users select own expenses" on public.expenses for select using (auth.uid() = user_id);
create policy "Users insert own expenses" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Users update own expenses" on public.expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own expenses" on public.expenses for delete using (auth.uid() = user_id);
