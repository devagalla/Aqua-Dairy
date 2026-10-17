# Aqua Diary — Build Brief (Personal Use)

**Project Status:** Active - Phase 1 Starting
**Lead Engineer:** Claude Code (with Rakesh Kumar Devagalla)
**Date:** October 17, 2026
**Version:** 1.0

---

## 1. Product

A mobile-first digital pond diary for **one shrimp farmer (me)** growing vannamei shrimp near Bhimavaram, Andhra Pradesh, India. It is a personal tool, **not a multi-user or commercial product**.

**Core Value Proposition:** Enable a single farmer to efficiently track pond conditions, feed usage, shrimp growth, and expenses while standing beside the pond with a phone in hand.

### Core Features
1. **Pond and culture-cycle management** - Track multiple ponds and their culture cycles
2. **Daily water-parameter logging** with rule-based green/yellow/red status
3. **Feed logging** (per meal) with optional feed-tray check
4. **Growth sampling (ABW)** and growth chart visualization
5. **Mortality / survival tracking** with clear measured vs estimated distinction
6. **Biomass estimate and FCR** calculation
7. **Expenses and simple credit tracking**
8. **Harvest and cycle report** with comparison against past cycles
9. **Offline-first logging** with automatic sync
10. **English + Telugu UI** with proper i18n
11. **Optional photos** on logs
12. **Data export (CSV)** and backup

---

## 2. Scope Constraints (IMPORTANT)

### ✅ In Scope
- Single user application (one login)
- One farm, multiple ponds
- Multiple concurrent culture cycles
- Offline-first data entry with sync
- Mobile-first responsive design
- English and Telugu localization
- CSV export functionality
- Free tier hosting (Vercel Hobby + Supabase Free)

### ❌ Out of Scope
- **Multi-user functionality** - No roles, no admin dashboard, no farm_members, no multi-farm permissions
- **Future feature scaffolding** - No WhatsApp integration, marketplace, IoT, subscriptions, voice
- **Complex supplier management** - Simple supplier name field only, no separate supplier-transactions system
- **Disease diagnosis** - Record keeping and decision support only, no medical diagnosis
- **Treatment recommendations** - Do not invent or suggest treatments
- **Guaranteed thresholds** - All advisor rules are unvalidated demo values

### Future Considerations (Not Built Now)
- `farm_id` / `owner_id` columns included in schema for potential future worker access
- Advisor rules editable via settings page (not separate admin app)

---

## 3. UX Principles

### Design Philosophy
- **Mobile-first:** Optimized for phone use beside the pond
- **Large touch targets:** Minimum 44x44px for all interactive elements
- **Clear visual hierarchy:** Important information immediately visible
- **Minimal typing:** Use pickers, large numeric inputs, remember last values
- **Trustworthy:** Polished, modern, professional appearance

### Visual Design
- **Color scheme:** Green/Yellow/Red for status indicators
- **Typography:** Noto Sans Telugu for Telugu support, system fonts for English
- **Icons:** Large, clear, universally understandable
- **Charts:** Simple, mobile-friendly visualizations using Recharts
- **Layout:** Single column on mobile, responsive for tablet/desktop

### Interaction Patterns
- **Quick entry:** Remember last-used values (yesterday's meal sizes, last water-test time)
- **Immediate feedback:** Show validation errors and status colors instantly
- **Clear units:** Always display measurement units
- **No dense tables:** Use cards and simple lists on mobile
- **Short forms:** Break complex operations into multiple simple steps

---

## 4. User Journey

### Primary Flow
```
Login → Create Farm → Create Pond → Start Culture Cycle → 
Enter Stocking Info → Daily Logging (Water, Feed, Sampling, Mortality, Expenses) → 
Harvest → Cycle Report → Compare with Past Cycles
```

### Example Test Data
- **Farm:** Sri Lakshmi Aqua Farm
- **Pond:** Pond 1, 2 acres
- **Stocking:** July 10, 2026
- **Seed:** 300,000 PL10
- **Initial ABW:** 0.002 g
- **Target Harvest:** 120 days

---

## 5. Home Dashboard

### Layout (Mobile)
```
┌─────────────────────────────────┐
│  Aqua Diary          [🌐] [👤]   │
├─────────────────────────────────┤
│  Sri Lakshmi Aqua Farm            │
├─────────────────────────────────┤
│  POND 1 - Day 45                  │
│  ┌─────────────────────────────┐ │
│  │ ABW: 8.2g    Biomass: 2.46t  │ │
│  │ Feed Today: 45kg  FCR: 1.2    │ │
│  │ Survival: 87%  Water: 🟢 GREEN │ │
│  └─────────────────────────────┘ │
│  [LOG WATER] [ADD FEED] [SAMPLING]│
│  [EXPENSE] [VIEW POND]            │
├─────────────────────────────────┤
│  POND 2 - Day 30                  │
│  ┌─────────────────────────────┐ │
│  │ ABW: 4.1g    Biomass: 1.23t  │ │
│  │ Feed Today: 22kg  FCR: 1.1    │ │
│  │ Survival: 92%  Water: 🟡 YELL │ │
│  └─────────────────────────────┘ │
│  [LOG WATER] [ADD FEED] [SAMPLING]│
├─────────────────────────────────┤
│  ALERTS NEEDING ATTENTION         │
│  🔴 Pond 2: Low DO (4.5 mg/L)     │
│     at 10:30 AM - [ACKNOWLEDGE]  │
└─────────────────────────────────┘
```

### Action Buttons
- **LOG WATER** - Quick water parameter entry
- **ADD FEED** - Record feed meal
- **SAMPLING** - Record growth sampling
- **EXPENSE** - Record expense
- **VIEW POND** - Navigate to pond detail page

---

## 6. Water Log

### Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| date | date | ✅ | Default: today |
| time | time | ✅ | Default: current time |
| DO | decimal | ✅ | Dissolved Oxygen (mg/L) |
| pH | decimal | ✅ | 0-14 scale |
| temperature | decimal | ✅ | °C |
| salinity | decimal | ❌ | ppt |
| ammonia | decimal | ❌ | mg/L |
| nitrite | decimal | ❌ | mg/L |
| alkalinity | decimal | ❌ | mg/L CaCO3 |
| transparency | decimal | ❌ | cm (Secchi disk) |
| notes | text | ❌ | Optional observations |
| photos | file[] | ❌ | Optional, compressed |

### Rule Evaluation
- **Immediate:** Evaluate on save using advisor_rules table
- **Status:** GREEN / YELLOW / RED based on severity
- **Display:** Color indicator + short message + recommended action
- **Language:** Show message in selected language (English/Telugu)
- **Alert Logging:** All triggered alerts stored in alerts table
- **Acknowledgment:** Alerts can be acknowledged (but remain visible)

### Advisor Rules Schema
```
parameter: DO | pH | temperature | salinity | ammonia | nitrite | alkalinity | transparency
min: decimal (nullable)
max: decimal (nullable)
severity: GREEN | YELLOW | RED
culture_day_min: integer (nullable) - rule applies from this day
culture_day_max: integer (nullable) - rule applies until this day
message_en: string
message_te: string
action_en: string
action_te: string
enabled: boolean (default: true)
```

---

## 7. Feed

### Feed Log Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| date | date | ✅ | Default: today |
| time | time | ✅ | Default: current time |
| pond_id | uuid | ✅ | Foreign key |
| culture_cycle_id | uuid | ✅ | Foreign key |
| amount_kg | decimal | ✅ | Kilograms of feed |
| feed_type | string | ❌ | Type of feed used |
| notes | text | ❌ | Optional |

### Feed Tray Check (Optional per meal)
- **Options:** EMPTY / SOME FEED / FULL-EXCESS
- **UI:** Big visual buttons with icons
- **Purpose:** Track feed consumption patterns

### Calculations
- **Daily Feed:** Sum of all meals for the day
- **Cumulative Feed:** Sum of all feed for the cycle
- **Feed per Biomass:** cumulative_feed / estimated_biomass
- **FCR:** cumulative_feed / estimated_biomass_gain

### Assumptions (Display on screen)
- Biomass gain = estimated_biomass - initial_biomass
- initial_biomass = stocking_count * initial_abw
- All calculations clearly labeled with assumptions used

---

## 8. Sampling and Growth

### Sampling Event Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| date | date | ✅ | Default: today |
| time | time | ❌ | Optional |
| pond_id | uuid | ✅ | Foreign key |
| culture_cycle_id | uuid | ✅ | Foreign key |
| number_sampled | integer | ✅ | Count of shrimp sampled |
| total_weight_g | decimal | ❌ | Total weight in grams |
| abw_manual | decimal | ❌ | Manual ABW override |
| notes | text | ❌ | Optional |
| photos | file[] | ❌ | Optional |

### Calculations
- **ABW (Average Body Weight):** total_weight_g / number_sampled (or manual_abw if provided)
- **Estimated Biomass:** ABW * estimated_population
- **Estimated Population:** initial_stocking_count * (survival_rate / 100)

### Growth Chart
- **X-axis:** Culture day
- **Y-axis:** ABW (grams)
- **Visualization:** Line chart with markers
- **Additional Info:** Show change since previous sample
- **Comparison:** Option to compare with previous cycles

---

## 9. Mortality / Survival

### Mortality Log Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| date | date | ✅ | Default: today |
| time | time | ❌ | Optional |
| pond_id | uuid | ✅ | Foreign key |
| culture_cycle_id | uuid | ✅ | Foreign key |
| count | integer | ✅ | Number of dead shrimp |
| cause | string | ❌ | Optional cause (dropdown) |
| notes | text | ❌ | Optional |
| photos | file[] | ❌ | Optional |

### Survival Tracking
- **Initial Population:** From stocking event
- **Cumulative Mortality:** Sum of all mortality logs
- **Estimated Population:** initial_population - cumulative_mortality
- **Survival Rate:** (estimated_population / initial_population) * 100

### UI Requirements
- **Clear distinction:** Measured values (actual counts) vs Estimated values
- **Labels:** All estimates clearly labeled as "Estimated" or "~"
- **Visual:** Different colors/styles for measured vs estimated

---

## 10. Pond Page

### Tabs
1. **Overview** - Summary, current status, quick actions
2. **Water** - Water logs list, chart of parameters over time
3. **Feed** - Feed logs, daily totals, cumulative chart
4. **Growth** - Sampling events, growth chart, biomass estimates
5. **Expenses** - Expense list, category breakdown
6. **Alerts** - All alerts for this pond/cycle
7. **History** - Complete activity log

### Overview Tab Layout
```
┌─────────────────────────────────┐
│  Pond 1 - Cycle 3                 │
│  Day 45 of 120 | Stocked: Jul 10  │
├─────────────────────────────────┤
│  CURRENT STATUS                   │
│  ┌─────────┐ ┌─────────┐         │
│  │ 🟢 Water │ │ 🟡 Feed  │         │
│  │ Normal  │ │ On track │         │
│  └─────────┘ └─────────┘         │
├─────────────────────────────────┤
│  KEY METRICS                      │
│  ABW: 8.2g (+1.5g from last)      │
│  Biomass: 2.46 tonnes             │
│  Survival: 87% (Estimated)        │
│  FCR: 1.2                         │
│  Feed Today: 45kg                 │
│  Cumulative Feed: 1.2 tonnes      │
├─────────────────────────────────┤
│  [LOG WATER] [ADD FEED] [SAMPLING]│
│  [MORTALITY] [EXPENSE]            │
└─────────────────────────────────┘
```

---

## 11. Expenses and Credit

### Expense Categories
- Feed
- Seed
- Probiotics
- Minerals
- Medicine/treatment
- Electricity
- Labor
- Equipment
- Other

### Expense Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| date | date | ✅ | Default: today |
| category | enum | ✅ | From predefined list |
| supplier | string | ❌ | Supplier name |
| description | text | ❌ | Optional description |
| quantity | decimal | ❌ | Optional quantity |
| unit | string | ❌ | Unit of quantity |
| amount | decimal | ✅ | Total amount |
| paid | decimal | ✅ | Amount paid |
| credit | decimal | ✅ | Amount on credit |
| notes | text | ❌ | Optional |
| photos | file[] | ❌ | Optional (receipts, etc.) |

### Calculations
- **Total Cycle Expense:** Sum of all expenses for the cycle
- **Total Paid:** Sum of all paid amounts
- **Outstanding Credit:** Sum of all credit amounts - payments
- **Per-Supplier Summary:** Group by supplier, show outstanding per supplier

### Supplier Summary View
```
┌─────────────────────────────────┐
│  EXPENSES SUMMARY                 │
├─────────────────────────────────┤
│  Total: ₹1,25,000                 │
│  Paid: ₹95,000  Credit: ₹30,000   │
├─────────────────────────────────┤
│  BY SUPPLIER                      │
│  ┌─────────────────────────────┐ │
│  │ Aqua Feed Supplies: ₹15,000  │ │
│  │   Paid: ₹10,000  Credit: ₹5,0│ │
│  │ Medicine Co.: ₹8,000         │ │
│  │   Paid: ₹8,000  Credit: ₹0   │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 12. Harvest and Cycle Report

### Harvest Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| date | date | ✅ | Harvest date |
| pond_id | uuid | ✅ | Foreign key |
| culture_cycle_id | uuid | ✅ | Foreign key |
| total_biomass_kg | decimal | ✅ | Total harvested biomass |
| average_weight_g | decimal | ✅ | Average weight per shrimp |
| count | integer | ❌ | Number harvested (if known) |
| price_per_kg | decimal | ✅ | Selling price |
| buyer | string | ✅ | Buyer name |
| revenue | decimal | ✅ | Calculated: total_biomass_kg * price_per_kg |
| notes | text | ❌ | Optional |
| photos | file[] | ❌ | Optional |

### Cycle Report Calculations
- **Duration:** harvest_date - stocking_date
- **Total Feed:** Cumulative feed for the cycle
- **Final FCR:** total_feed / biomass_gain
- **Survival Rate:** (harvest_count / initial_stocking_count) * 100
- **Total Expenses:** Sum of all cycle expenses
- **Revenue:** From harvest record
- **Profit/Loss:** revenue - total_expenses
- **Cost per kg:** total_expenses / total_biomass_kg

### Report Layout
```
┌─────────────────────────────────┐
│  CYCLE REPORT - Pond 1 - Cycle 3  │
│  Jul 10, 2026 - Oct 17, 2026      │
├─────────────────────────────────┤
│  SUMMARY                          │
│  Duration: 99 days                │
│  Initial Stock: 300,000 PL10      │
│  Harvest: 246,000 shrimp          │
│  Survival: 82%                    │
│  ABW: 12.5g                       │
│  Biomass: 3,075 kg                │
├─────────────────────────────────┤
│  FEED PERFORMANCE                 │
│  Total Feed: 3,750 kg             │
│  FCR: 1.22                        │
│  Feed Cost: ₹4,50,000             │
├─────────────────────────────────┤
│  FINANCIALS                       │
│  Total Expenses: ₹6,75,000        │
│  Revenue: ₹15,37,500              │
│  Profit: ₹8,62,500                │
│  Cost/kg: ₹219                    │
├─────────────────────────────────┤
│  COMPARED TO PREVIOUS             │
│  ┌─────────────────────────────┐ │
│  │ Cycle 2: FCR 1.35, Profit ₹7L │ │
│  │ Cycle 1: FCR 1.42, Profit ₹6L │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 13. Offline-First (CRITICAL)

### Requirements
- **All logging works offline:** Water, feed, sampling, mortality, expenses
- **Local storage:** IndexedDB for pending records
- **Record identification:** Client-generated UUID + timestamp
- **Sync behavior:** Idempotent - retries never create duplicates
- **Auto-sync:** Automatic sync when connectivity returns
- **Retry logic:** Exponential backoff for failed syncs
- **Status tracking:** Per-record sync status

### Sync Status States
- **Synced** - Successfully synced to server
- **Pending** - Waiting for connectivity
- **Syncing** - Currently syncing
- **Failed** - Sync failed, manual retry available

### UI Requirements
- **Visibility:** Sync status clearly visible for each record
- **Manual retry:** Failed items have visible retry button
- **No silent discard:** Never silently discard data
- **Conflict resolution:** Server wins on conflict (timestamp-based)

### Implementation Strategy
1. **Offline-first wrapper:** All mutations go through offline queue
2. **Queue processor:** Background process for syncing
3. **Connectivity detection:** Online/offline status monitoring
4. **Retry mechanism:** Automatic with backoff, manual override

---

## 14. Photos

### Requirements
- **Optional:** Photos can be attached to logs (water, feed, sampling, mortality, expenses, observations)
- **Compression:** On-device compression before upload
- **Target size:** 200-300 KB per photo
- **Storage:** Supabase Storage
- **Free tier:** Stay within Supabase Free storage limits

### Implementation
- **Client-side compression:** Use browser Image API or library
- **Multiple photos:** Support multiple photos per log
- **Gallery view:** Thumbnails with full-size on click
- **Delete:** Allow photo deletion

---

## 15. Language

### Requirements
- **Languages:** English and Telugu
- **i18n library:** Proper i18n library (next-intl or similar)
- **No hard-coded strings:** All UI strings in translation files
- **Separate files:** Translations in separate JSON files
- **Easy editing:** Telugu translations can be edited without touching code

### Translation Files Structure
```
src/i18n/
├── en.json          # English translations
├── te.json          # Telugu translations
└── index.ts         # i18n configuration
```

### Language Switch
- **Location:** Easy to reach (header, settings, or dedicated button)
- **Persistence:** Remember language preference
- **Fallback:** English as fallback for missing translations

---

## 16. Data and Backup

### Export Requirements
- **CSV export:** Per pond and per cycle
- **Download all:** Option to download all user data
- **Format:** Standard CSV, compatible with Excel
- **Encoding:** UTF-8

### Backup Requirements
- **Supabase backup:** Document how to back up Supabase project
- **Local backup:** Option to export all data locally
- **Frequency:** Manual trigger, with date-stamped files

### Export Options
```
┌─────────────────────────────────┐
│  EXPORT DATA                      │
├─────────────────────────────────┤
│  [📊] Export Pond 1 Data         │
│  [📊] Export Cycle 3 Data        │
│  [📊] Export All My Data          │
│  [💾] Backup to File              │
├─────────────────────────────────┤
│  Last export: Oct 15, 2026        │
└─────────────────────────────────┘
```

---

## 17. Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3+
- **UI Components:** shadcn/ui
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **i18n:** next-intl
- **PWA:** Workbox / next-pwa

### Backend
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Realtime:** Supabase Realtime (optional, for alerts)

### DevOps
- **Hosting:** Vercel (Hobby tier)
- **Database:** Supabase (Free tier)
- **CI/CD:** GitHub Actions (optional)

### Development
- **Linting:** ESLint
- **Formatting:** Prettier
- **Type Checking:** TypeScript
- **Testing:** Jest + React Testing Library
- **Component Testing:** Storybook (optional)

### Version Pinning
- All dependencies pinned to exact, mutually compatible stable versions
- Versions documented in `docs/ARCHITECTURE.md`

---

## 18. Database

### Schema Overview
See `docs/DATABASE.md` for detailed schema.

### Key Tables
- farms
- ponds
- culture_cycles
- stocking_events
- water_logs
- feed_logs
- feed_tray_checks
- sampling_events
- mortality_logs
- expenses
- harvests
- water_parameter_definitions
- advisor_rules
- alerts
- photos
- sync_metadata

### Requirements
- **UUID primary keys** for all tables
- **Foreign keys** with proper constraints
- **Indexes** on frequently queried columns
- **Timestamps:** created_at, updated_at
- **Numeric types:** decimal for measurements and money
- **Row Level Security:** owner_id = auth.uid() policy

---

## 19. Domain Safety

### Important Constraints
1. **Record keeping only:** This is a logging and tracking tool
2. **No diagnosis:** Do not diagnose disease, especially from photos
3. **No treatment recommendations:** Do not invent or suggest treatments
4. **No guarantees:** Thresholds do not guarantee survival
5. **Clear labeling:** All seed thresholds and recommendations are **unvalidated demo values**

### Required Disclaimers
- All advisor rules must be reviewed by a qualified aquaculture professional
- Estimated values are clearly labeled as estimates
- Measured vs estimated values are visually distinguished
- Demo data is clearly marked as DEMO

### Safety Implementation
- **Static disclaimer:** Visible in settings/about page
- **Inline labels:** "Estimated", "~", "Demo" where appropriate
- **Rule validation:** Advisor rules can be disabled/enabled
- **User responsibility:** Clear that user is responsible for validation

---

## 20. Working Process

### Phase Gates
1. **Inspect repository** - ✅ Complete
2. **Write documentation** - In Progress
   - ✅ `docs/BRIEF.md`
   - ⏳ `docs/PRODUCT_SPEC.md`
   - ⏳ `docs/ARCHITECTURE.md`
   - ⏳ `docs/DATABASE.md`
   - ⏳ `docs/IMPLEMENTATION_PLAN.md`
3. **Implement Phase 1** - Pending
4. **Review and approve** - Pending
5. **Continue to next phase** - Pending

### Phases

#### Phase 1: Foundation
- Project setup (Next.js, TypeScript, Tailwind, shadcn/ui)
- Design system and components
- Database schema and migrations
- Authentication (Supabase Auth)
- Farm/Pond/Cycle setup CRUD
- Basic navigation

#### Phase 2: Water & Alerts
- Water parameter logging
- Rule engine implementation
- Alert generation and display
- Water parameter charts

#### Phase 3: Feed & Growth
- Feed logging (per meal)
- Feed tray checks
- Sampling and growth tracking
- Biomass and FCR calculations
- Mortality tracking

#### Phase 4: Expenses & Reports
- Expense logging
- Credit tracking
- Harvest recording
- Cycle reports
- CSV export

#### Phase 5: Offline & i18n
- Offline-first implementation
- IndexedDB storage
- Sync logic
- Photos support
- Telugu i18n

#### Phase 6: Polish
- Rules settings page
- Accessibility audit
- Performance optimization
- Security review
- Final polish

### Decision Making
- **Ordinary decisions:** Choose sensibly, document, continue
- **Ask user if:** Changes product direction, needs credentials, irreversible, can't be made safely

---

## 21. Quality Bar

### Feature Completeness
Every feature must have:
- ✅ UI implementation
- ✅ Data layer (service/repository)
- ✅ Validation (client + server)
- ✅ Loading state
- ✅ Empty state
- ✅ Error state
- ✅ Mobile layout
- ✅ Tests (where applicable)

### No Acceptable Shortcuts
- ❌ Dead buttons
- ❌ Fake functionality
- ❌ Mock APIs in finished app
- ❌ TODOs for core features
- ❌ Hard-coded UI strings
- ❌ Unvalidated inputs

---

## 22. Definition of Done

### Minimum Viable Product
I can:
- [ ] Install dependencies
- [ ] Set environment variables
- [ ] Run the app
- [ ] Log in
- [ ] Create a farm and ponds
- [ ] Start a cycle
- [ ] Log water and see statuses
- [ ] Log feed and tray checks
- [ ] Enter sampling and see the ABW chart
- [ ] See biomass and FCR
- [ ] Record expenses and credit
- [ ] Close a cycle with harvest
- [ ] View the cycle report
- [ ] Switch English/Telugu
- [ ] Log offline and sync later
- [ ] Use it on phone and desktop
- [ ] Export my data

### Final Delivery
- [ ] Run lint - no errors
- [ ] Run type check - no errors
- [ ] Run tests - all pass
- [ ] Production build - successful
- [ ] Architecture summary
- [ ] Schema summary
- [ ] Required environment variables
- [ ] Exact setup and run commands
- [ ] Testing instructions
- [ ] Free-tier deployment steps
- [ ] Remaining limitations

---

## Next Steps

1. ✅ Inspect repository
2. 🔄 Create documentation files:
   - ✅ `docs/BRIEF.md` (this file)
   - ⏳ `docs/PRODUCT_SPEC.md`
   - ⏳ `docs/ARCHITECTURE.md`
   - ⏳ `docs/DATABASE.md`
   - ⏳ `docs/IMPLEMENTATION_PLAN.md`
3. ⏳ Implement Phase 1
4. ⏳ Stop for review

---

*This document is the source of truth for the Aqua Diary project. All decisions should reference this brief.*
