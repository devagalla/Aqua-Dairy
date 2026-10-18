create table if not exists public.feed_logs (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.culture_cycles(id) on delete cascade,
  logged_at timestamptz not null default now(),
  feed_type text not null,
  amount_kg numeric not null check (amount_kg > 0),
  feeding_frequency text,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.growth_samples (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.culture_cycles(id) on delete cascade,
  sampled_at timestamptz not null default now(),
  sample_size integer not null check (sample_size > 0),
  average_weight_g numeric not null check (average_weight_g > 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  cycle_id uuid references public.culture_cycles(id) on delete set null,
  spent_at date not null default current_date,
  category text not null,
  description text not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now()
);

create or replace function public.is_cycle_member(target_cycle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.culture_cycles cc
    join public.ponds p on p.id = cc.pond_id
    join public.farm_members fm on fm.farm_id = p.farm_id
    where cc.id = target_cycle_id
      and fm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_farm_member(target_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.farm_members fm
    where fm.farm_id = target_farm_id
      and fm.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_cycle_member(uuid) from public, anon;
revoke all on function public.is_farm_member(uuid) from public, anon;
grant execute on function public.is_cycle_member(uuid) to authenticated;
grant execute on function public.is_farm_member(uuid) to authenticated;

alter table public.feed_logs enable row level security;
alter table public.growth_samples enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "farm members can manage feed logs" on public.feed_logs;
create policy "farm members can manage feed logs"
  on public.feed_logs
  for all
  to authenticated
  using (public.is_cycle_member(cycle_id))
  with check (public.is_cycle_member(cycle_id));

drop policy if exists "farm members can manage growth samples" on public.growth_samples;
create policy "farm members can manage growth samples"
  on public.growth_samples
  for all
  to authenticated
  using (public.is_cycle_member(cycle_id))
  with check (public.is_cycle_member(cycle_id));

drop policy if exists "farm members can manage expenses" on public.expenses;
create policy "farm members can manage expenses"
  on public.expenses
  for all
  to authenticated
  using (public.is_farm_member(farm_id))
  with check (public.is_farm_member(farm_id));

grant select, insert, update, delete
  on public.feed_logs, public.growth_samples, public.expenses
  to authenticated;

create index if not exists feed_logs_cycle_logged_idx
  on public.feed_logs(cycle_id, logged_at desc);
create index if not exists growth_samples_cycle_sampled_idx
  on public.growth_samples(cycle_id, sampled_at desc);
create index if not exists expenses_farm_spent_idx
  on public.expenses(farm_id, spent_at desc);

notify pgrst, 'reload schema';
