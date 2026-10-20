-- 202610190003_add_price_source_tracking.sql
-- Add source tracking to price_entries for external API integration
-- Run this AFTER 202610190002_market_settings.sql in Supabase SQL Editor

-- ============================================================
-- 1. ADD SOURCE TRACKING COLUMNS TO price_entries
-- ============================================================
alter table if exists public.price_entries
  add column if not exists source text default 'manual' check (source in ('manual', 'fao', 'mpeda', 'noaa', 'urner_barry', 'mintec', 'tridge')),
  add column if not exists external_id text,
  add column if not exists raw_metadata jsonb;

-- Create index for source-based queries
create index if not exists price_entries_source_date_idx
  on public.price_entries(source, date desc);

create index if not exists price_entries_external_id_idx
  on public.price_entries(external_id) where external_id is not null;

-- Update existing records to have 'manual' source
update public.price_entries
set source = 'manual'
where source is null;

-- ============================================================
-- 2. ADD SOURCE TRACKING TO news_indicators (optional)
-- ============================================================
alter table if exists public.news_indicators
  add column if not exists source text default 'manual';

update public.news_indicators
set source = 'manual'
where source is null;

-- ============================================================
-- 3. NOTIFY POSTGREST TO RELOAD SCHEMA
-- ============================================================
notify pgrst, 'reload schema';