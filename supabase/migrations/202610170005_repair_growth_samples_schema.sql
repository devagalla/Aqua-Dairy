create table if not exists public.growth_samples (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.culture_cycles(id) on delete cascade,
  sampled_at timestamptz not null default now(),
  sample_size integer not null check (sample_size > 0),
  average_weight_g numeric not null check (average_weight_g > 0),
  notes text,
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

revoke all on function public.is_cycle_member(uuid) from public, anon;
grant execute on function public.is_cycle_member(uuid) to authenticated;

create or replace function public.create_initial_farm(
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
set search_path = ''
set row_security = off
as $$
declare
  new_farm_id uuid;
  new_pond_id uuid;
  new_cycle_id uuid;
  current_user_id uuid := (select auth.uid());
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

  insert into public.farms (owner_id, name, region)
  values (current_user_id, trim(farm_name_input), nullif(trim(region_input), ''))
  returning id into new_farm_id;

  insert into public.farm_members (farm_id, user_id, role)
  values (new_farm_id, current_user_id, 'Farmer');

  insert into public.ponds (farm_id, name, area_acres)
  values (new_farm_id, trim(pond_name_input), area_acres_input)
  returning id into new_pond_id;

  insert into public.culture_cycles (
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

revoke all on function public.create_initial_farm(
  text, text, text, numeric, integer, date, text, integer
) from public, anon;
grant execute on function public.create_initial_farm(
  text, text, text, numeric, integer, date, text, integer
) to authenticated;

alter table public.growth_samples enable row level security;

drop policy if exists "farm members can manage growth samples"
  on public.growth_samples;
create policy "farm members can manage growth samples"
  on public.growth_samples
  for all
  to authenticated
  using (public.is_cycle_member(cycle_id))
  with check (public.is_cycle_member(cycle_id));

grant select, insert, update, delete on public.growth_samples to authenticated;

create index if not exists growth_samples_cycle_sampled_idx
  on public.growth_samples(cycle_id, sampled_at desc);

notify pgrst, 'reload schema';
