-- 2026-10-19-000001 Add Missing Tables for Phase 4-8 Features
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. EXTEND growth_samples FOR FCR & GROSS VALUE CALCULATIONS
-- ============================================================
alter table public.growth_samples
  add column if not exists cumulative_feed_kg numeric check (cumulative_feed_kg >= 0),
  add column if not exists survival_percent numeric check (survival_percent > 0 and survival_percent <= 100);

create index if not exists growth_samples_cycle_sampled_idx
  on public.growth_samples(cycle_id, sampled_at desc);

-- ============================================================
-- 2. EXTEND culture_cycles FOR TARGET HARVEST COUNT
-- ============================================================
alter table public.culture_cycles
  add column if not exists target_harvest_count integer check (target_harvest_count > 0);

-- ============================================================
-- 3. CREATE observations TABLE (for Visual Health Checklist)
-- Uses existing Observation type schema (water/gut/behavior/foam)
-- ============================================================
create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.culture_cycles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  water_color text check (water_color in ('brown_golden', 'pea_green', 'dark_black', 'normal', 'other')),
  gut_condition text check (gut_condition in ('full_dark', 'broken_intermittent', 'white_empty', 'normal', 'other')),
  behavior text check (behavior in ('circling_dawn', 'normal', 'lethargic', 'jumping', 'other')),
  foam boolean,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.observations enable row level security;

create policy "farm members can manage observations"
  on public.observations
  for all using (
    exists (
      select 1 from public.culture_cycles cc
      join public.ponds p on p.id = cc.pond_id
      join public.farms f on f.id = p.farm_id
      join public.farm_members fm on fm.farm_id = f.id
      where cc.id = observations.cycle_id and fm.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.culture_cycles cc
      join public.ponds p on p.id = cc.pond_id
      join public.farms f on f.id = p.farm_id
      join public.farm_members fm on fm.farm_id = f.id
      where cc.id = observations.cycle_id and fm.user_id = auth.uid()
    )
  );

create index if not exists observations_cycle_logged_idx
  on public.observations(cycle_id, logged_at desc);