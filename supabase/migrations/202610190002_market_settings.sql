-- 2026-10-19-000002 Add Market Prices & Settings Tables
-- Run this AFTER 202610190001 in Supabase SQL Editor

-- ============================================================
-- 4. CREATE price_entries TABLE (Market Prices Board)
-- Supports count sizes 30, 40, 50, 60, 70, 80, 90, 100
-- ============================================================
create table if not exists public.price_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  region text not null,
  date date not null default current_date,
  count_size int not null check (count_size in (30, 40, 50, 60, 70, 80, 90, 100)),
  price_per_kg numeric not null check (price_per_kg > 0),
  currency text not null default 'INR',
  trend text check (trend in ('up', 'stable', 'down')),
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(user_id, region, date, count_size)
);

alter table public.price_entries enable row level security;

create policy "users can manage their own prices"
  on public.price_entries
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists price_entries_user_region_date_idx
  on public.price_entries(user_id, region, date desc);

-- ============================================================
-- 5. CREATE news_indicators TABLE (Market News/Trend Notes)
-- ============================================================
create table if not exists public.news_indicators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null default current_date,
  trend text not null check (trend in ('up', 'stable', 'down')),
  note text not null check (char_length(note) <= 200),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(user_id, date)
);

alter table public.news_indicators enable row level security;

create policy "users can manage their own news"
  on public.news_indicators
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists news_indicators_user_date_idx
  on public.news_indicators(user_id, date desc);

-- ============================================================
-- 6. CREATE settings TABLE (User Preferences / Localization)
-- ============================================================
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  language text not null default 'en' check (language in ('en', 'te')),
  default_currency text not null default 'INR',
  meals_per_day int not null default 4 check (meals_per_day between 1 and 6),
  feed_rate_position text not null default 'mid' check (feed_rate_position in ('low', 'mid', 'high')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.settings enable row level security;

create policy "users can manage their own settings"
  on public.settings
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 7. TRIGGERS FOR updated_at COLUMNS
-- ============================================================
create or replace function public.update_updated_at_column()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_observations_updated_at on public.observations;
create trigger update_observations_updated_at
  before update on public.observations
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_price_entries_updated_at on public.price_entries;
create trigger update_price_entries_updated_at
  before update on public.price_entries
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_news_indicators_updated_at on public.news_indicators;
create trigger update_news_indicators_updated_at
  before update on public.news_indicators
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_settings_updated_at on public.settings;
create trigger update_settings_updated_at
  before update on public.settings
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- 8. NOTIFY POSTGREST TO RELOAD SCHEMA
-- ============================================================
notify pgrst, 'reload schema';