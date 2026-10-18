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
