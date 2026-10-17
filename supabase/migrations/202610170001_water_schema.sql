-- 2026‑10‑17‑000001 Water Logging Schema
-- Created with design brief

-- Users are already managed in supabase auth

-- Farms
create table if not exists farms (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  region text,
  created_at timestamptz default now()
);
-- farm_membership
create table if not exists farm_members (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid references farms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('Farmer','Manager','Admin')),
  created_at timestamptz default now()
);
-- ponds
create table if not exists ponds (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid references farms(id) on delete cascade,
  name text not null,
  area_acres numeric,
  created_at timestamptz default now()
);
-- culture_cycles
create table if not exists culture_cycles (
  id uuid primary key default uuid_generate_v4(),
  pond_id uuid references ponds(id) on delete cascade,
  seed_stocked int not null,
  stocking_date date not null,
  pl text,
  target_harvest_days int,
  created_at timestamptz default now()
);
-- water_logs
create table if not exists water_logs (
  id uuid primary key default uuid_generate_v4(),
  cycle_id uuid references culture_cycles(id) on delete cascade,
  logged_at timestamptz not null,
  temperature_c numeric,
  pH numeric,
  do_mg_l numeric,
  salinity_pps numeric,
  ammonia_mg_l numeric,
  nitrite_mg_l numeric,
  alkalinity_ppms numeric,
  transparency_lux numeric,
  comment text,
  created_at timestamptz default now()
);
-- advisor_rules
create table if not exists advisor_rules (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  parameter text not null,
  min_threshold numeric,
  max_threshold numeric,
  severity text check (severity in ('GREEN','YELLOW','RED')),
  culture_day_from int,
  culture_day_to int,
  message_en text,
  message_te text,
  action_en text,
  action_te text,
  enabled boolean default true,
  created_at timestamptz default now()
);
-- alert_log
create table if not exists alert_log (
  id uuid primary key default uuid_generate_v4(),
  rule_id uuid references advisor_rules(id) on delete cascade,
  water_log_id uuid references water_logs(id) on delete cascade,
  severity text check (severity in ('GREEN','YELLOW','RED')),
  acknowledged_at timestamptz,
  created_at timestamptz default now()
);
-- RLS policies
alter table water_logs enable row level security;
create policy "farm members can manage logs" on water_logs
  for all using (
    exists (
      select 1 from culture_cycles cc
      join ponds p on p.id = cc.pond_id
      join farms f on f.id = p.farm_id
      join farm_members fm on fm.farm_id = f.id
      where cc.id = water_logs.cycle_id and fm.user_id = auth.uid()
    )
  );
-- ponds policy
alter table ponds enable row level security;
create policy "farm members can view ponds" on ponds
  for select using (
    exists (
      select 1 from farms f
      join farm_members fm on fm.farm_id = f.id
      where f.id = ponds.farm_id and fm.user_id = auth.uid()
    )
  );
-- culture_cycles policy
alter table culture_cycles enable row level security;
create policy "farm members can view cycles" on culture_cycles
  for select using (
    exists (
      select 1 from ponds p
      join farms f on f.id = p.farm_id
      join farm_members fm on fm.farm_id = f.id
      where p.id = culture_cycles.pond_id and fm.user_id = auth.uid()
    )
  );
-- alert_log policy
alter table alert_log enable row level security;
create policy "farm members can view alerts" on alert_log
  for select using (
    exists (
      select 1 from water_logs w
      join culture_cycles cc on cc.id = w.cycle_id
      join ponds p on p.id = cc.pond_id
      join farms f on f.id = p.farm_id
      join farm_members fm on fm.farm_id = f.id
      where w.id = alert_log.water_log_id and fm.user_id = auth.uid()
    )
  );
-- seed standard rules
insert into advisor_rules (name, parameter, min_threshold, max_threshold, severity, message_en, message_te, action_en, action_te, enabled)
values
  (
    'Dissolved Oxygen', 'do_mg_l', 4.0, NULL, 'RED',
    'Dissolved oxygen below 4.0 mg/L', 'మందగించిన ఆక్సిజన్ 4.0 mg/L కంటే తక్కువ',
    'Increase aeration', 'ఆక్సిజన్ పెంచండి', true
  ),
  (
    'pH', 'pH', 7.5, 8.5, 'YELLOW',
    'pH outside 7.5-8.5 range', 'pH 7.5-8.5 బయట ఉంది',
    'Adjust pH', 'pH సవరించండి', true
  ),
  (
    'Ammonia', 'ammonia_mg_l', NULL, 0.1, 'RED',
    'Ammonia above 0.1 mg/L', 'అమోనియా 0.1 mg/L కంటే ఎక్కువ',
    'Improve filtration', 'ఫిల్టరేషన్ మెరుగుపరచండి', true
  );
-- indexes
create index on water_logs(cycle_id, logged_at desc);
create index on alert_log(rule_id, water_log_id);
