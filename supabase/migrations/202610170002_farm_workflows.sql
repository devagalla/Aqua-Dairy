create table if not exists feed_logs (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references culture_cycles(id) on delete cascade,
  logged_at timestamptz not null default now(),
  feed_type text not null,
  amount_kg numeric not null check (amount_kg > 0),
  feeding_frequency text,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists growth_samples (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references culture_cycles(id) on delete cascade,
  sampled_at timestamptz not null default now(),
  sample_size integer not null check (sample_size > 0),
  average_weight_g numeric not null check (average_weight_g > 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  cycle_id uuid references culture_cycles(id) on delete set null,
  spent_at date not null default current_date,
  category text not null,
  description text not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now()
);

alter table alert_log add column if not exists message text;
alter table alert_log add column if not exists action text;

alter table farms enable row level security;
alter table farm_members enable row level security;
alter table ponds enable row level security;
alter table culture_cycles enable row level security;
alter table feed_logs enable row level security;
alter table growth_samples enable row level security;
alter table expenses enable row level security;
alter table advisor_rules enable row level security;

create or replace function is_farm_member(target_farm_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from farm_members fm
    where fm.farm_id = target_farm_id and fm.user_id = auth.uid()
  );
$$;

create or replace function is_farm_owner(target_farm_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from farms f
    where f.id = target_farm_id and f.owner_id = auth.uid()
  );
$$;

create or replace function is_cycle_member(target_cycle_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from culture_cycles cc
    join ponds p on p.id = cc.pond_id
    join farm_members fm on fm.farm_id = p.farm_id
    where cc.id = target_cycle_id and fm.user_id = auth.uid()
  );
$$;

insert into farm_members (farm_id, user_id, role)
select f.id, f.owner_id, 'Farmer'
from farms f
where f.owner_id is not null
  and not exists (
    select 1
    from farm_members fm
    where fm.farm_id = f.id and fm.user_id = f.owner_id
  );

create or replace function create_initial_farm(
  farm_name_input text,
  region_input text,
  pond_name_input text,
  area_acres_input numeric,
  seed_stocked_input integer,
  stocking_date_input date,
  pl_input text,
  target_harvest_days_input integer
)
returns table (farm_id uuid, pond_id uuid, cycle_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_farm_id uuid;
  new_pond_id uuid;
  new_cycle_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'You must be signed in to create a farm.';
  end if;
  if nullif(trim(farm_name_input), '') is null
    or nullif(trim(pond_name_input), '') is null
    or seed_stocked_input is null
    or seed_stocked_input < 1
    or stocking_date_input is null
    or (area_acres_input is not null and area_acres_input <= 0)
    or (target_harvest_days_input is not null and target_harvest_days_input < 1)
  then
    raise exception 'Farm, pond, and valid culture cycle details are required.';
  end if;

  insert into farms (owner_id, name, region)
  values (current_user_id, trim(farm_name_input), nullif(trim(region_input), ''))
  returning id into new_farm_id;

  insert into farm_members (farm_id, user_id, role)
  values (new_farm_id, current_user_id, 'Farmer');

  insert into ponds (farm_id, name, area_acres)
  values (new_farm_id, trim(pond_name_input), area_acres_input)
  returning id into new_pond_id;

  insert into culture_cycles (
    pond_id, seed_stocked, stocking_date, pl, target_harvest_days
  )
  values (
    new_pond_id, seed_stocked_input, stocking_date_input,
    nullif(trim(pl_input), ''), target_harvest_days_input
  )
  returning id into new_cycle_id;

  return query select new_farm_id, new_pond_id, new_cycle_id;
end;
$$;

grant execute on function create_initial_farm(
  text, text, text, numeric, integer, date, text, integer
) to authenticated;
revoke all on function create_initial_farm(
  text, text, text, numeric, integer, date, text, integer
) from public, anon;

drop policy if exists "farm owners and members can view farms" on farms;
create policy "farm owners and members can view farms" on farms
  for select using (
    owner_id = auth.uid() or is_farm_member(id)
  );

drop policy if exists "users can create their own farms" on farms;
create policy "users can create their own farms" on farms
  for insert with check (owner_id = auth.uid());

drop policy if exists "farm owners can update farms" on farms;
create policy "farm owners can update farms" on farms
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "farm owners can delete farms" on farms;
create policy "farm owners can delete farms" on farms
  for delete using (owner_id = auth.uid());

drop policy if exists "members can view farm memberships" on farm_members;
create policy "members can view farm memberships" on farm_members
  for select using (
    user_id = auth.uid()
    or is_farm_owner(farm_id)
  );

drop policy if exists "farm owners can add members" on farm_members;
create policy "farm owners can add members" on farm_members
  for insert with check (
    user_id = auth.uid() and is_farm_owner(farm_id)
  );

drop policy if exists "farm owners can remove members" on farm_members;
create policy "farm owners can remove members" on farm_members
  for delete using (
    is_farm_owner(farm_id)
  );

drop policy if exists "farm members can manage ponds" on ponds;
drop policy if exists "farm members can view ponds" on ponds;
create policy "farm members can manage ponds" on ponds
  for all using (is_farm_member(farm_id))
  with check (is_farm_member(farm_id));

drop policy if exists "farm members can manage culture cycles" on culture_cycles;
drop policy if exists "farm members can view cycles" on culture_cycles;
create policy "farm members can manage culture cycles" on culture_cycles
  for all using (
    exists (select 1 from ponds p where p.id = culture_cycles.pond_id and is_farm_member(p.farm_id))
  ) with check (
    exists (select 1 from ponds p where p.id = culture_cycles.pond_id and is_farm_member(p.farm_id))
  );

drop policy if exists "farm members can manage feed logs" on feed_logs;
create policy "farm members can manage feed logs" on feed_logs
  for all using (is_cycle_member(cycle_id))
  with check (is_cycle_member(cycle_id));

drop policy if exists "farm members can manage growth samples" on growth_samples;
create policy "farm members can manage growth samples" on growth_samples
  for all using (is_cycle_member(cycle_id))
  with check (is_cycle_member(cycle_id));

drop policy if exists "farm members can manage expenses" on expenses;
create policy "farm members can manage expenses" on expenses
  for all using (is_farm_member(farm_id))
  with check (is_farm_member(farm_id));

drop policy if exists "farm members can manage logs" on water_logs;
create policy "farm members can manage logs" on water_logs
  for all using (is_cycle_member(cycle_id))
  with check (is_cycle_member(cycle_id));

drop policy if exists "authenticated users can read advisor rules" on advisor_rules;
create policy "authenticated users can read advisor rules" on advisor_rules
  for select to authenticated using (true);

drop policy if exists "farm members can create alerts" on alert_log;
drop policy if exists "farm members can view alerts" on alert_log;
create policy "farm members can view alerts" on alert_log
  for select using (
    exists (
      select 1 from water_logs w
      where w.id = alert_log.water_log_id and is_cycle_member(w.cycle_id)
    )
  );

create policy "farm members can create alerts" on alert_log
  for insert with check (
    exists (
      select 1 from water_logs w
      where w.id = alert_log.water_log_id and is_cycle_member(w.cycle_id)
    )
  );

create index if not exists feed_logs_cycle_logged_idx on feed_logs(cycle_id, logged_at desc);
create index if not exists growth_samples_cycle_sampled_idx on growth_samples(cycle_id, sampled_at desc);
create index if not exists expenses_farm_spent_idx on expenses(farm_id, spent_at desc);
