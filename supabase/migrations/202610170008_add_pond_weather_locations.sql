alter table public.ponds
  add column if not exists locality text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

drop function if exists public.create_pond_with_cycle(
  uuid, text, numeric, integer, date, text, integer
);

create or replace function public.create_pond_with_cycle(
  farm_id_input uuid,
  pond_name_input text,
  area_acres_input numeric,
  seed_stocked_input integer,
  stocking_date_input date,
  pl_input text,
  target_harvest_days_input integer,
  locality_input text,
  latitude_input double precision,
  longitude_input double precision
)
returns table (pond_id uuid, cycle_id uuid)
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_pond_id uuid;
  new_cycle_id uuid;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to add a pond.';
  end if;
  if nullif(trim(pond_name_input), '') is null
    or seed_stocked_input is null
    or seed_stocked_input < 1
    or stocking_date_input is null
    or (area_acres_input is not null and area_acres_input <= 0)
    or (target_harvest_days_input is not null and target_harvest_days_input < 1)
    or ((latitude_input is null) <> (longitude_input is null))
    or (latitude_input is not null and (latitude_input < -90 or latitude_input > 90))
    or (longitude_input is not null and (longitude_input < -180 or longitude_input > 180))
  then
    raise exception 'Enter a pond name and valid culture cycle and location details.';
  end if;
  if not exists (
    select 1
    from public.farm_members fm
    where fm.farm_id = farm_id_input
      and fm.user_id = current_user_id
  ) then
    raise exception 'You do not have access to this farm.';
  end if;

  insert into public.ponds (
    farm_id, name, area_acres, locality, latitude, longitude
  )
  values (
    farm_id_input,
    trim(pond_name_input),
    area_acres_input,
    nullif(trim(locality_input), ''),
    latitude_input,
    longitude_input
  )
  returning id into new_pond_id;

  insert into public.culture_cycles (
    pond_id, seed_stocked, stocking_date, pl, target_harvest_days
  )
  values (
    new_pond_id, seed_stocked_input, stocking_date_input,
    nullif(trim(pl_input), ''), target_harvest_days_input
  )
  returning id into new_cycle_id;

  return query select new_pond_id, new_cycle_id;
end;
$$;

revoke all on function public.create_pond_with_cycle(
  uuid, text, numeric, integer, date, text, integer, text, double precision, double precision
) from public, anon;
grant execute on function public.create_pond_with_cycle(
  uuid, text, numeric, integer, date, text, integer, text, double precision, double precision
) to authenticated;

drop function if exists public.create_initial_farm(
  text, text, text, numeric, integer, date, text, integer
);

create or replace function public.create_initial_farm(
  farm_name_input text,
  region_input text,
  pond_name_input text,
  area_acres_input numeric,
  seed_stocked_input integer,
  stocking_date_input date,
  pl_input text,
  target_harvest_days_input integer,
  locality_input text,
  latitude_input double precision,
  longitude_input double precision
)
returns table (farm_id uuid, pond_id uuid, cycle_id uuid)
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_farm_id uuid;
  new_pond_id uuid;
  new_cycle_id uuid;
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
    or ((latitude_input is null) <> (longitude_input is null))
    or (latitude_input is not null and (latitude_input < -90 or latitude_input > 90))
    or (longitude_input is not null and (longitude_input < -180 or longitude_input > 180))
  then
    raise exception 'Farm, pond, valid culture cycle, and location details are required.';
  end if;

  insert into public.farms (owner_id, name, region)
  values (current_user_id, trim(farm_name_input), nullif(trim(region_input), ''))
  returning id into new_farm_id;

  insert into public.farm_members (farm_id, user_id, role)
  values (new_farm_id, current_user_id, 'Farmer');

  insert into public.ponds (
    farm_id, name, area_acres, locality, latitude, longitude
  )
  values (
    new_farm_id, trim(pond_name_input), area_acres_input,
    nullif(trim(locality_input), ''), latitude_input, longitude_input
  )
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
  text, text, text, numeric, integer, date, text, integer,
  text, double precision, double precision
) from public, anon;
grant execute on function public.create_initial_farm(
  text, text, text, numeric, integer, date, text, integer,
  text, double precision, double precision
) to authenticated;

drop policy if exists "farm members can manage expenses" on public.expenses;
create policy "farm members can manage expenses"
  on public.expenses
  for all
  to authenticated
  using (public.is_farm_member(farm_id))
  with check (
    public.is_farm_member(farm_id)
    and (
      cycle_id is null
      or exists (
        select 1
        from public.culture_cycles cc
        join public.ponds p on p.id = cc.pond_id
        where cc.id = expenses.cycle_id
          and p.farm_id = expenses.farm_id
          and public.is_cycle_member(cc.id)
      )
    )
  );

grant select, update on public.ponds to authenticated;

notify pgrst, 'reload schema';
