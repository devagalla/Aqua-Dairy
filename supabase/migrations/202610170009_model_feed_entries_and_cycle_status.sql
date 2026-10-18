alter table public.feed_logs
  add column if not exists entry_mode text not null default 'single',
  add column if not exists feeding_count integer not null default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.feed_logs'::regclass
      and conname = 'feed_logs_entry_mode_check'
  ) then
    alter table public.feed_logs
      add constraint feed_logs_entry_mode_check
      check (entry_mode in ('single', 'daily_summary'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.feed_logs'::regclass
      and conname = 'feed_logs_feeding_count_check'
  ) then
    alter table public.feed_logs
      add constraint feed_logs_feeding_count_check
      check (feeding_count >= 1 and (entry_mode = 'daily_summary' or feeding_count = 1));
  end if;
end
$$;

alter table public.culture_cycles
  add column if not exists status text,
  add column if not exists completed_at date;

with ranked_cycles as (
  select
    id,
    row_number() over (
      partition by pond_id
      order by stocking_date desc, created_at desc, id desc
    ) as position
  from public.culture_cycles
)
update public.culture_cycles cc
set status = case when ranked_cycles.position = 1 then 'active' else 'completed' end
from ranked_cycles
where ranked_cycles.id = cc.id
  and cc.status is null;

alter table public.culture_cycles
  alter column status set default 'active',
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.culture_cycles'::regclass
      and conname = 'culture_cycles_status_check'
  ) then
    alter table public.culture_cycles
      add constraint culture_cycles_status_check
      check (status in ('active', 'completed'));
  end if;
end
$$;

create unique index if not exists culture_cycles_one_active_per_pond_idx
  on public.culture_cycles(pond_id)
  where status = 'active';

create or replace function public.complete_culture_cycle(target_cycle_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to complete a culture cycle.';
  end if;
  if not public.is_cycle_member(target_cycle_id) then
    raise exception 'You do not have access to this culture cycle.';
  end if;

  update public.culture_cycles
  set status = 'completed',
      completed_at = current_date
  where id = target_cycle_id
    and status = 'active';

  if not found then
    raise exception 'This culture cycle is already completed or no longer exists.';
  end if;
end;
$$;

revoke all on function public.complete_culture_cycle(uuid) from public, anon;
grant execute on function public.complete_culture_cycle(uuid) to authenticated;

notify pgrst, 'reload schema';
