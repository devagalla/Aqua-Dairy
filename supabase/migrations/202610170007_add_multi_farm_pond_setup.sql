create or replace function public.create_farm(
  farm_name_input text,
  region_input text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_farm_id uuid;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to create a farm.';
  end if;
  if nullif(trim(farm_name_input), '') is null then
    raise exception 'Enter a name for the farm.';
  end if;

  insert into public.farms (owner_id, name, region)
  values (current_user_id, trim(farm_name_input), nullif(trim(region_input), ''))
  returning id into new_farm_id;

  insert into public.farm_members (farm_id, user_id, role)
  values (new_farm_id, current_user_id, 'Farmer');

  return new_farm_id;
end;
$$;

revoke all on function public.create_farm(text, text) from public, anon;
grant execute on function public.create_farm(text, text) to authenticated;

create or replace function public.create_pond_with_cycle(
  farm_id_input uuid,
  pond_name_input text,
  area_acres_input numeric,
  seed_stocked_input integer,
  stocking_date_input date,
  pl_input text,
  target_harvest_days_input integer
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
  then
    raise exception 'Enter a pond name and valid culture cycle details.';
  end if;
  if not exists (
    select 1
    from public.farm_members fm
    where fm.farm_id = farm_id_input
      and fm.user_id = current_user_id
  ) then
    raise exception 'You do not have access to this farm.';
  end if;

  insert into public.ponds (farm_id, name, area_acres)
  values (farm_id_input, trim(pond_name_input), area_acres_input)
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
  uuid, text, numeric, integer, date, text, integer
) from public, anon;
grant execute on function public.create_pond_with_cycle(
  uuid, text, numeric, integer, date, text, integer
) to authenticated;

notify pgrst, 'reload schema';
