alter table public.expenses
  add column if not exists transaction_type text not null default 'expense';

alter table public.expenses
  drop constraint if exists expenses_transaction_type_check;

alter table public.expenses
  add constraint expenses_transaction_type_check
  check (transaction_type in ('expense', 'income'));

create index if not exists expenses_farm_type_spent_idx
  on public.expenses(farm_id, transaction_type, spent_at desc);

create or replace function public.get_expense_dashboard()
returns table (
  total_income numeric,
  total_expenses numeric,
  net_profit numeric,
  funding_received numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(sum(amount) filter (
      where transaction_type = 'income'
        and category in ('Harvest sale', 'Other farm income')
    ), 0) as total_income,
    coalesce(sum(amount) filter (
      where transaction_type = 'expense'
    ), 0) as total_expenses,
    coalesce(sum(amount) filter (
      where transaction_type = 'income'
        and category in ('Harvest sale', 'Other farm income')
    ), 0)
      - coalesce(sum(amount) filter (
        where transaction_type = 'expense'
      ), 0) as net_profit,
    coalesce(sum(amount) filter (
      where transaction_type = 'income'
        and category in ('Loan received', 'Owner contribution')
    ), 0) as funding_received
  from public.expenses;
$$;

revoke all on function public.get_expense_dashboard() from public, anon;
grant execute on function public.get_expense_dashboard() to authenticated;

notify pgrst, 'reload schema';
