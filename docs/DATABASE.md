# Aqua Diary — Database Schema

**Project:** Aqua Diary - Personal Shrimp Farm Management
**Version:** 1.0
**Date:** October 17, 2026
**Author:** Claude Code (with Rakesh Kumar Devagalla)

---

## Table of Contents
1. [Overview](#1-overview)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Core Tables](#3-core-tables)
4. [Detailed Schema](#4-detailed-schema)
5. [Indexing & Performance](#5-indexing--performance)
6. [Migrations](#6-migrations)
7. [Seed Data](#7-seed-data)

---

## 1. Overview

Aqua Diary uses a **relational database** (PostgreSQL) with **Row Level Security (RLS)** policies to ensure each user can only access their own data. All data is organized into normalized tables that model the domain concepts of aquaculture management.

### 1.1 Key Design Principles

| Principle | Explanation |
|-----------|-------------|
| **User Isolation** | Every table includes `owner_id` foreign key to `auth.users(id)` |
| **Immutable History** | Most tables don't delete records, just mark as deleted or archive |
| **Temporal Awareness** | Many tables include `created_at` and `updated_at` timestamps |
| **Normalization** | Third Normal Form (3NF) with proper foreign keys |
| **Security First** | Row Level Security enforced at database level |

### 1.2 Database Naming Convention
- **Tables:** lowercase, snake_case
- **Columns:** snake_case
- **Primary Keys:** `id` (UUID)
- **Foreign Keys:** `parent_id`, `child_id`, `referenced_id`
- **Timestamps:** `created_at`, `updated_at`, `deleted_at` (when applicable)
- **Soft Delete:** `is_deleted` flag or `deleted_at` timestamp

---

## 2. Entity Relationship Diagram (Text)

```
FARM (1) 
  │
  ├── POND (N)
  │     │
  │     ├── CULTURE_CYCLE (N)
  │     │     │
  │     │     ├── STOCKING_EVENT (1)
  │     │     │
  │     │     ├── WATER_LOG (N)
  │     │     │     │
  │     │     │     └── ALERT (N)
  │     │     │
  │     │     ├── FEED_LOG (N)
  │     │     │     │
  │     │     │     └── FEED_TRAY_CHECK (0..1)
  │     │     │
  │     │     ├── SAMPLING_EVENT (N)
  │     │     │
  │     │     ├── MORTALITY_LOG (N)
  │     │     │
  │     │     ├── EXPENSE (N)
  │     │     │
  │     │     └── HARVEST (0..1)
  │     │
  │     └── PHOTO (N)
  │
  └── ADVISOR_RULE (N)
  
USER (1)
  │
  └── FARM (1) [owner_id]

SYSTEM
  │
  ├── USER_PROFILES (optional extension)
  └── META_TABLES (for migrations)
```

---

## 3. Core Tables

These are the primary tables that form the backbone of the application:

### 3.1 `users`
- Stores authentication credentials and user metadata
- References from all user-specific tables via `owner_id`

### 3.2 `farms`
- Represents a farm (single user can have exactly one active farm)
- Contains farm metadata (name, location, contact details)

### 3.3 `ponds`
- Represents a pond within a farm
- Includes geographic and physical characteristics

### 3.4 `culture_cycles`
- Represents a complete shrimp culture cycle in a pond
- Tracks start/end dates, target harvest, etc.

### 3.5 `stocking_events`
- Records when shrimp are stocked in a pond
- Includes seed details (count, PL size, supplier)

### 3.6 `advisor_rules`
- Stores parameter thresholds and rules for alerts
- Includes bilingual messages (English/Telugu)

---

## 4. Detailed Schema

### 4.1 `aqua_advisor_rules`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `parameter` | text | No | Water parameter name (e.g., "do_mg_per_l", "pH") |
| `min_value` | numeric | Yes | Minimum threshold (nullable) |
| `max_value` | numeric | Yes | Maximum threshold (nullable) |
| `severity` | enum('GREEN','YELLOW','RED') | Yes | Severity level |
| `culture_day_min` | int | Yes | Minimum culture day for rule to apply |
| `culture_day_max` | int | Yes | Maximum culture day for rule to apply |
| `message_en` | text | Yes | English alert message |
| `message_te` | text | Yes | Telugu alert message |
| `action_en` | text | Yes | English recommended action |
| `action_te` | text | Yes | Telugu recommended action |
| `enabled` | boolean | Yes | Whether the rule is active |
| `owner_id` | uuid | No | Reference to users |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | No | Last update timestamp |

### 4.2 `aqua_ponds`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `name` | text | No | Pond name (e.g., "Pond 1") |
| `size_acres` | numeric | Yes | Size in acres |
| `surface_area_sqft` | numeric | Yes | Alternative size measure |
| `depth_m` | numeric | Yes | Average depth in meters |
| `notes` | text | Yes | General pond notes |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | No | Last update timestamp |
| `owner_id` | uuid | No | Reference to users |

### 4.3 `aqua_farms`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `name` | text | Yes | Farm name (e.g., "Sri Lakshmi Aqua Farm") |
| `location` | text | Yes | City or village location |
| `notes` | text | Yes | General farm notes |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | No | Last update timestamp |
| `owner_id` | uuid | No | Reference to users |

### 4.4 `culture_cycles`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `pond_id` | uuid | No | Reference to ponds |
| `name` | text | Yes | Cycle identifier (e.g., "Cycle 3") |
| `stocking_date` | date | Yes | Date shrimp were stocked |
| `harvest_target_date` | date | Yes | Target harvest date |
| `initial_stock_count` | integer | Yes | Initial number of shrimp |
| `initial_pl_size` | text | Yes | PL designation (e.g., "PL10") |
| `initial_abw` | numeric | Yes | Initial average body weight (grams) |
| `planned_harvest_date` | date | Yes | Final date for harvest |
| `notes` | text | Yes | Cycle notes |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | No | Last update timestamp |
| `owner_id` | uuid | No | Reference to users |

### 4.5 `water_logs`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `culture_cycle_id` | uuid | Yes | Reference to culture_cycles |
| `pond_id` | uuid | Yes | Reference to ponds |
| `date` | date | Yes | Water measurement date |
| `time` | time | Yes | Time of measurement |
| `do_mg_per_l` | numeric | Yes | Dissolved oxygen (mg/L) |
| `ph` | numeric | Yes | pH level |
| `temperature_c` | numeric | Yes | Temperature in Celsius |
| `salinity_ppt` | numeric | Yes | Salinity in parts per thousand |
| `ammonia_mg_per_l` | numeric | Yes | Ammonia level (mg/L) |
| `nitrite_mg_per_l` | numeric | Yes | Nitrite level (mg/L) |
| `alkalinity_mg_per_l` | numeric | Yes | Alkalinity (mg/L CaCO3) |
| `transparency_cm` | numeric | Yes | Transparency measurement (cm) |
| `notes` | text | Yes | Optional notes |
| `culture_day` | integer | Yes | Day of culture cycle |
| `owner_id` | uuid | No | Reference to users |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | No | Last update timestamp |

### 4.6 `advisor_rule_alerts`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `rule_id` | uuid | No | Reference to advisor_rules |
| `data_type` | text | No | Type of parameter that violated rule ("do_mg_per_l", "pH", etc.) |
| `data_value` | numeric | Yes | Value that triggered the alert |
| `culture_day` | integer | Yes | Culture day when violation occurred |
| `from_type` | text | No | Type of data (water_log, reading, etc.) |
| `water_log_id` | uuid | Yes | Reference to water_logs (if applicable) |
| `pony_id` | uuid | Yes | Reference to ponds |
| `culture_cycle_id` | uuid | Yes | Reference to culture_cycles |
| `message_en` | text | Yes | English alert message |
| `message_te` | text | Yes | Telugu alert message |
| `action_en` | text | Yes | English recommended action |
| `action_te` | text | Yes | Telugu recommended action |
| `severity` | text | Yes | GREEN/YELLOW/RED severity |
| `created_at` | timestamp | No | Creation timestamp |
| `acknowledged` | boolean | Yes | Whether user acknowledged the alert |
| `owner_id` | uuid | No | Reference to users |

### 4.7 `feed_logs`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `culture_cycle_id` | uuid | No | Reference to culture_cycles |
| `pond_id` | uuid | Yes | Reference to ponds |
| `date` | date | Yes | Feed event date |
| `time` | time | Yes | Feed event time |
| `amount_kg` | numeric | Yes | Amount of feed in kilograms |
| `feed_type` | text | Yes | Type of feed used |
| `total_daily_amount_kg` | numeric | Yes | Total feed for the day |
| `notes` | text | Yes | Optional notes |
| `feed_tray_check` | enum('EMPTY','SOME_FED','FULL_EXCESS') | Yes | Feed tray check result |
| `species_sampled` | text | Yes | Species if sampled during feed |
| `owner_id` | uuid | No | Reference to users |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | No | Last update timestamp |

### 4.8 `feed_tray_checks`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `feed_log_id` | uuid | Yes | Reference to feed_logs |
| `result` | enum('EMPTY','SOME_FED','FULL_EXCESS') | Yes | Check result |
| `photo_ids` | uuid[] | Yes | Array of photo IDs if taken |
| `notes` | text | Yes | Optional notes |

### 4.9 `sampling_events`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `culture_cycle_id` | uuid | Yes | Reference to culture_cycles |
| `pond_id` | uuid | Yes | Reference to ponds |
| `date` | date | Yes | Sampling date |
| `time` | time | Yes | Sampling time |
| `sampled_count` | integer | Yes | Number of shrimp sampled |
| `sampled_weight_g` | numeric | Yes | Total weight sampled (grams) |
| `abw_manual` | numeric | Yes | Manual ABW override (grams) |
| `abw_calculated` | numeric | Yes | Calculated ABW (grams) |
| `notes` | text | Yes | Optional notes |
| `photos` | uuid[] | Yes | Array of photo IDs |
| `owner_id` | uuid | No | Reference to users |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | Yes | Last update timestamp |

### 4.10 `mortality_logs`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `culture_cycle_id` | uuid | Yes | Reference to culture_cycles |
| `pond_id` | uuid | Yes | Reference to ponds |
| `date` | date | Yes | Mortality recorded date |
| `time` | time | Yes | Time recorded |
| `count` | integer | Yes | Number of shrimp died |
| `cause` | text | Yes | Optional cause of death |
| `notes` | text | Yes | Optional notes |
| `photos` | uuid[] | Yes | Array of photo IDs |
| `owner_id` | uuid | No | Reference to users |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | Yes | Last update timestamp |

### 4.11 `expenses`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `culture_cycle_id` | uuid | Yes | Reference to culture_cycles |
| `pond_id` | uuid | Yes | Reference to ponds |
| `date` | date | Yes | Expense date |
| `category` | text | Yes | Expense category (e.g., "Feed", "Seed", "Medicine") |
| `supplier` | text | Yes | Supplier name |
| `description` | text | Yes | Optional description |
| `quantity` | numeric | Yes | Quantity purchased |
| `unit` | text | Yes | Unit of quantity (e.g., "kg", "bag") |
| `amount` | numeric | Yes | Total amount |
| `paid` | numeric | Yes | Amount paid |
| `credit` | numeric | Yes | Amount on credit |
| `notes` | text | Yes | Optional notes |
| `photos` | uuid[] | Yes | Array of photo IDs (receipts) |
| `owner_id` | uuid | No | Reference to users |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | Yes | Last update timestamp |

### 4.12 `harvests`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `culture_cycle_id` | uuid | Yes | Reference to culture_cycles |
| `pond_id` | uuid | Yes | Reference to ponds |
| `harvest_date` | date | Yes | Date of harvest |
| `total_biomass_kg` | numeric | Yes | Total harvested biomass (kg) |
| `average_weight_g` | numeric | Yes | Average weight per shrimp (g) |
| `harvest_count` | integer | Yes | Number of shrimp harvested |
| `price_per_kg` | numeric | Yes | Selling price per kg |
| `buyer` | text | Yes | Name of buyer |
| `revenue` | numeric | Yes | Calculated revenue (total_biomass_kg * price_per_kg) |
| `profit` | numeric | Yes | Profit calculation (revenue - total_expenses) |
| `cost_per_kg` | numeric | Yes | Cost per kg (total_expenses / total_biomass_kg) |
| `notes` | text | Yes | Optional notes |
| `photos` | uuid[] | Yes | Array of photo IDs |
| `created_at` | timestamp | No | Creation timestamp |

### 4.13 `expense_categories`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `name` | text | No | Category name (e.g., "Feed", "Seed") |
| `created_at` | timestamp | No | Creation timestamp |
| `owner_id` | uuid | Yes | Reference to users |

### 4.14 `photos`

| Column | Type | Nullable | Description |
|--------|--------|----------|-------------|
| `id` | uuid | No | Primary key |
| `owner_id` | uuid | No | Reference to users |
| `path` | text | Yes | Storage path in Supabase |
| `file_name` | text | Yes | Original file name |
| `file_type` | text | Yes | File type (e.g., "jpeg", "png") |
| `file_size_kb` | integer | Yes | Size in kilobytes |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | Yes | Last update timestamp |

### 4.15 `sync_metadata`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `user_id` | uuid | Yes | Reference to users |
| `last_sync_time` | timestamp | Yes | Last successful sync time |
| `pending_records_count` | integer | Yes | Number of pending records |
| `status` | text | Yes | "idle", "syncing", "failed" |
| `last_error` | text | Yes | Last error message |

### 4.16 `sync_pending_records`

| Column | Type | Nullable | Description |
|--------|------|------------|-------------|
| `id` | uuid | No | Primary key |
| `record_type` | text | Yes | Type of record (e.g., "water_log", "feed_log") |
| `record_id` | uuid | Yes | ID of the record |
| `data` | jsonb | Yes | Serialized record data |
| `timestamp` | timestamp | Yes | When record was queued |
| `retry_count` | integer | Yes | Number of retry attempts |
| `status` | text | Yes | "pending", "syncing", "failed" |

---

## 5. Indexing & Performance

### 5.1 Recommended Indexes

```sql
-- Users table
CREATE INDEX idx_users_owner_id ON users (owner_id);

-- Core tables (patterned for common queries)
CREATE INDEX idx_ponds_owner_id ON ponds (owner_id);
CREATE INDEX idx_ponds_name ON ponds (name);
CREATE INDEX idx_culture_cycles_pond_id ON culture_cycles (pond_id);
CREATE INDEX idx_water_logs_culture_cycle_id ON water_logs (culture_cycle_id);
CREATE INDEX idx_feed_logs_cycle_id ON feed_logs (culture_cycle_id);
CREATE INDEX idx_sampling_events_cycle_id ON sampling_events (culture_cycle_id);
CREATE INDEX idx_expenses_cycle_id ON expenses (culture_cycle_id);
CREATE INDEX idx_harvests_cycle_id ON harvests (culture_cycle_id);
CREATE INDEX idx_advisor_rules_parameter ON advisor_rules (parameter);
CREATE INDEX idx_advisor_rules_severity ON advisor_rules (severity);
CREATE INDEX idx_alerts_acknowledged ON alerts (acknowledged);
```

### 5.2 Query Patterns & Indexing Strategy

| Query Pattern | Recommended Index |
|---------------|-------------------|
| "Get all ponds for a user" | `CREATE INDEX idx_ponds_owner_id ON ponds (owner_id)` |
| "Get all water logs for a culture cycle" | `CREATE INDEX idx_water_logs_culture_cycle_id ON water_logs (culture_cycle_id)` |
| "Get all alerts for a user" | `CREATE INDEX idx_alerts_owner_id ON alerts (owner_id)` |
| "Get all expenses for a cycle" | `CREATE INDEX idx_expenses_cycle_id ON expenses (culture_cycle_id)` |
| "Get parameters for a specific pond" | `CREATE INDEX idx_advisor_rules_parameter ON advisor_rules (parameter)` |

---

## 6. Migrations

### 6.1 Migration Tooling
- Using **Next.js Supabase Client** with TypeScript migrations
- Manual migration files in `./supabase/migrations/`
- Standard PostgreSQL syntax with UUID handling

### 6.3 Example Migration File

```sql
-- supabase/migrations/2024101701_create_farms_table.sql
-- Migrate to create farms table

CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own farms"
ON farms FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Users can create own farms"
ON farms FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own farms"
ON farms FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own farms"
ON farms FOR DELETE
USING (owner_id = auth.uid());
```

---

## 7. Seed Data

### 7.1 Seed Scripts
- Located in `./supabase/seed/`
- Execute via `supabase db seed`

### 7.2 Example Seed Data

```sql
-- supabase/seed/01_initialize.sql
DO $$
BEGIN
  -- Create demo user (will be replaced by real auth)
  INSERT INTO auth.users (id, email, created_at)
  VALUES ('a1b2c3d4-5678-90ab-cdef-1234567890ab', 'demo@aquafarm.com', NOW());
  
  -- Create demo farm
  INSERT INTO farms (name, location, owner_id)
  VALUES ('Sri Lakshmi Aqua Farm', 'Bhimavaram, AND', 
          'a1b2c3d4-5678-90ab-cdef-1234567890ab');
          
END $$;
```

### 7.3 Production Data
- No hardcoded demo data in production
- Production data comes from actual user usage
- Demo data flags are clearly marked in documentation

---

*This document provides the complete database schema for Aqua Diary. All implementation decisions should reference this schema when developing database interactions.*