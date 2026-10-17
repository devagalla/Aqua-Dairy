# Aqua Diary — Product Specification

**Project:** Aqua Diary - Personal Shrimp Farm Management
**Version:** 1.0
**Date:** October 17, 2026
**Author:** Claude Code (with Rakesh Kumar Devagalla)

---

## Table of Contents
1. [Overview](#1-overview)
2. [User Persona](#2-user-persona)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [User Flows](#5-user-flows)
6. [Data Model](#6-data-model)
7. [API Endpoints](#7-api-endpoints)
8. [UI/UX Specification](#8-uiux-specification)
9. [Security Requirements](#9-security-requirements)
10. [Performance Requirements](#10-performance-requirements)

---

## 1. Overview

### 1.1 Product Description
Aqua Diary is a mobile-first, offline-capable digital pond diary designed for a single shrimp farmer to manage vannamei shrimp culture cycles. The application enables efficient tracking of water parameters, feed usage, shrimp growth, mortality, expenses, and harvest data.

### 1.2 Problem Statement
Shrimp farmers currently rely on paper-based or fragmented digital solutions for tracking pond conditions and culture cycles. This leads to:
- Inconsistent data recording
- Difficulty in tracking trends over time
- Manual calculations for FCR, biomass, and survival rates
- No offline capability for field use
- No centralized view of farm operations

### 1.3 Solution
A unified, mobile-optimized application that:
- Works offline in the field
- Provides immediate feedback on water quality
- Automates calculations (FCR, biomass, survival)
- Tracks all aspects of shrimp farming in one place
- Syncs data when connectivity is available

---

## 2. User Persona

### Primary User
| Attribute | Details |
|-----------|---------|
| **Name** | Rakesh Kumar Devagalla |
| **Role** | Shrimp Farmer |
| **Location** | Bhimavaram, Andhra Pradesh, India |
| **Language** | English, Telugu (preferred) |
| **Technical Skills** | Basic smartphone usage, comfortable with apps |
| **Device** | Smartphone (Android/iOS), occasional tablet/desktop |
| **Connectivity** | Intermittent internet, often offline at pond site |

### User Goals
1. Quickly log water parameters while standing at the pond
2. Track feed usage and shrimp growth over time
3. Monitor pond health with immediate alerts
4. Calculate FCR and biomass automatically
5. Track expenses and profitability
6. Generate reports for cycle analysis
7. Work offline and sync later

### User Pain Points
- Small phone screen makes data entry difficult
- Need to work with wet hands (large touch targets needed)
- Limited time for data entry (must be fast)
- Need clear, immediate feedback on water quality
- Must track multiple ponds simultaneously

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | User can sign up with email/password | High |
| FR-002 | User can log in with email/password | High |
| FR-003 | User can log out | High |
| FR-004 | User session persists across app restarts | Medium |
| FR-005 | Only authenticated user can access data | High |
| FR-006 | User can reset password | Medium |

### 3.2 Farm & Pond Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-010 | User can create a farm | High |
| FR-011 | User can edit farm details | Medium |
| FR-012 | User can view farm information | High |
| FR-013 | User can create a pond | High |
| FR-014 | User can edit pond details (name, size, etc.) | Medium |
| FR-015 | User can view pond list | High |
| FR-016 | User can view pond details | High |
| FR-017 | User can archive/deactivate a pond | Low |

### 3.3 Culture Cycle Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-020 | User can start a new culture cycle for a pond | High |
| FR-021 | User can view active culture cycles | High |
| FR-022 | User can view past culture cycles | Medium |
| FR-023 | User can edit cycle details (target harvest date, etc.) | Medium |
| FR-024 | User can end/close a culture cycle | High |

### 3.4 Stocking
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-030 | User can record stocking event | High |
| FR-031 | User can enter seed details (PL count, PL size, supplier) | High |
| FR-032 | User can enter initial ABW | High |
| FR-033 | User can view stocking history for a pond | Medium |

### 3.5 Water Parameter Logging
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-040 | User can log water parameters | High |
| FR-041 | User can log multiple readings per day (morning/evening) | High |
| FR-042 | System validates water parameter ranges | High |
| FR-043 | System evaluates parameters against advisor rules | High |
| FR-044 | System displays GREEN/YELLOW/RED status | High |
| FR-045 | System displays alert message and recommended action | High |
| FR-046 | User can view water log history | High |
| FR-047 | User can edit water logs | Medium |
| FR-048 | User can delete water logs | Medium |
| FR-049 | User can add photos to water logs | Medium |
| FR-050 | User can view water parameter charts | Medium |

### 3.6 Feed Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-060 | User can log feed meals | High |
| FR-061 | User can specify feed amount in kg | High |
| FR-062 | User can specify feed time | High |
| FR-063 | User can perform feed tray check (EMPTY/SOME/FULL) | High |
| FR-064 | System calculates daily feed total | High |
| FR-065 | System calculates cumulative feed | High |
| FR-066 | System calculates FCR | High |
| FR-067 | User can view feed log history | High |
| FR-068 | User can edit feed logs | Medium |
| FR-069 | User can delete feed logs | Medium |
| FR-070 | User can view feed charts | Medium |

### 3.7 Sampling & Growth
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-080 | User can record sampling event | High |
| FR-081 | User can enter number sampled and total weight | High |
| FR-082 | System calculates ABW automatically | High |
| FR-083 | User can override ABW manually | Medium |
| FR-084 | System calculates estimated biomass | High |
| FR-085 | User can view sampling history | High |
| FR-086 | User can view growth chart (ABW over time) | High |
| FR-087 | User can edit sampling events | Medium |
| FR-088 | User can delete sampling events | Medium |
| FR-089 | User can add photos to sampling events | Medium |

### 3.8 Mortality Tracking
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-090 | User can record mortality | High |
| FR-091 | User can enter mortality count | High |
| FR-092 | User can select cause from dropdown | Medium |
| FR-093 | System calculates estimated population | High |
| FR-094 | System calculates survival rate | High |
| FR-095 | User can view mortality history | High |
| FR-096 | User can edit mortality logs | Medium |
| FR-097 | User can delete mortality logs | Medium |
| FR-098 | User can add photos to mortality logs | Medium |

### 3.9 Expense Tracking
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-100 | User can record expenses | High |
| FR-101 | User can select expense category | High |
| FR-102 | User can enter supplier name | High |
| FR-103 | User can enter amount | High |
| FR-104 | User can split amount into paid/credit | High |
| FR-105 | System calculates total cycle expenses | High |
| FR-106 | System calculates total paid and outstanding credit | High |
| FR-107 | User can view expense list | High |
| FR-108 | User can view expense summary by category | Medium |
| FR-109 | User can view expense summary by supplier | Medium |
| FR-110 | User can edit expenses | Medium |
| FR-111 | User can delete expenses | Medium |
| FR-112 | User can add photos (receipts) to expenses | Medium |

### 3.10 Harvest & Reports
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-120 | User can record harvest | High |
| FR-121 | User can enter harvest biomass | High |
| FR-122 | User can enter average weight | High |
| FR-123 | User can enter price per kg | High |
| FR-124 | User can enter buyer name | High |
| FR-125 | System calculates revenue | High |
| FR-126 | System calculates profit/loss | High |
| FR-127 | System calculates cost per kg | High |
| FR-128 | User can view cycle report | High |
| FR-129 | User can compare cycle with previous cycles | Medium |
| FR-130 | User can export cycle report | Medium |

### 3.11 Advisor Rules
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-140 | System stores advisor rules in database | High |
| FR-141 | Rules include parameter, min/max, severity, day range | High |
| FR-142 | Rules include messages in English and Telugu | High |
| FR-143 | Rules can be enabled/disabled | Medium |
| FR-144 | User can view advisor rules | Medium |
| FR-145 | User can edit advisor rules via settings page | Medium |

### 3.12 Alerts
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-150 | System generates alerts when rules are triggered | High |
| FR-151 | Alerts are stored in database | High |
| FR-152 | Alerts can be acknowledged | Medium |
| FR-153 | User can view alert history | Medium |
| FR-154 | User can view active alerts | High |
| FR-155 | Alerts are displayed on dashboard | High |

### 3.13 Offline & Sync
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-160 | All logging works offline | High |
| FR-161 | Data is stored locally (IndexedDB) when offline | High |
| FR-162 | Records get client-generated UUID and timestamp | High |
| FR-163 | Sync is automatic when connectivity returns | High |
| FR-164 | Sync is idempotent (no duplicates on retry) | High |
| FR-165 | Sync has retry with exponential backoff | Medium |
| FR-166 | User can see sync status per record | High |
| FR-167 | User can manually retry failed syncs | Medium |
| FR-168 | Failed items remain visible | High |

### 3.14 Photos
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-170 | User can add photos to logs | Medium |
| FR-171 | Photos are compressed on device (200-300 KB target) | Medium |
| FR-172 | Photos are uploaded to Supabase Storage | Medium |
| FR-173 | User can view photos | Medium |
| FR-174 | User can delete photos | Medium |

### 3.15 Internationalization
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-180 | App supports English | High |
| FR-181 | App supports Telugu | High |
| FR-182 | User can switch languages | High |
| FR-183 | Language preference persists | Medium |
| FR-184 | All UI strings are in translation files | High |
| FR-185 | No hard-coded UI strings | High |

### 3.16 Data Export
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-190 | User can export pond data to CSV | Medium |
| FR-191 | User can export cycle data to CSV | Medium |
| FR-192 | User can export all data to CSV | Medium |
| FR-193 | Export includes all relevant fields | Medium |
| FR-194 | Export uses UTF-8 encoding | Medium |

### 3.17 Settings
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-200 | User can view app version | Low |
| FR-201 | User can view disclaimer | Medium |
| FR-202 | User can edit advisor rules | Medium |
| FR-203 | User can clear local cache | Low |

---

## 4. Non-Functional Requirements

### 4.1 Performance
| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-001 | App loads within 3 seconds on 4G | High |
| NFR-002 | Water log entry completes within 1 second | High |
| NFR-003 | Charts render within 2 seconds | Medium |
| NFR-004 | Offline data entry is instant | High |
| NFR-005 | Sync completes within 5 seconds for typical data | Medium |

### 4.2 Reliability
| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-010 | No data loss on app crash | High |
| NFR-011 | No data loss on network failure | High |
| NFR-012 | Failed syncs can be retried | High |
| NFR-013 | App handles offline/online transitions gracefully | High |

### 4.3 Security
| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-020 | All data encrypted in transit (HTTPS) | High |
| NFR-021 | User data protected by Row Level Security | High |
| NFR-022 | Only owner can read/write their data | High |
| NFR-023 | Secrets stored in environment variables | High |
| NFR-024 | No secrets in browser/client code | High |
| NFR-025 | Input validation on client and server | High |
| NFR-026 | Protection against SQL injection | High |
| NFR-027 | Protection against XSS | High |

### 4.4 Usability
| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-030 | Mobile-first responsive design | High |
| NFR-031 | Large touch targets (min 44x44px) | High |
| NFR-032 | Clear visual hierarchy | High |
| NFR-033 | Intuitive navigation | High |
| NFR-034 | Accessible to users with color blindness | Medium |
| NFR-035 | Works on iOS and Android | High |
| NFR-036 | Works on Chrome, Safari, Firefox | Medium |

### 4.5 Compatibility
| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-040 | Supports iOS 14+ | Medium |
| NFR-041 | Supports Android 8+ | Medium |
| NFR-042 | Works on tablets | Medium |
| NFR-043 | Works on desktop browsers | Medium |

### 4.6 Scalability
| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-050 | Supports 1 user with unlimited ponds | High |
| NFR-051 | Supports 100+ culture cycles per pond | Medium |
| NFR-052 | Supports 10,000+ water logs | Medium |
| NFR-053 | Supports 5,000+ feed logs | Medium |

### 4.7 Maintainability
| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-060 | Clean, modular code structure | High |
| NFR-061 | Comprehensive documentation | Medium |
| NFR-062 | Consistent coding style | Medium |
| NFR-063 | Type-safe code (TypeScript) | High |

---

## 5. User Flows

### 5.1 First Time Setup
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Landing    │────▶│   Sign Up   │────▶│   Verify    │
│   Page       │     │   Form      │     │   Email     │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────┐
│              Create Farm Form                  │
│  Farm Name: [Sri Lakshmi Aqua Farm]          │
│  Location: [Bhimavaram, AP]                   │
│  [CREATE FARM]                                  │
└─────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────┐
│              Create Pond Form                  │
│  Pond Name: [Pond 1]                           │
│  Size (acres): [2]                             │
│  [CREATE POND]                                  │
└─────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────┐
│           Start Culture Cycle Form             │
│  Pond: [Pond 1]                                 │
│  Stocking Date: [Today]                        │
│  Seed Count: [300,000]                         │
│  PL Size: [PL10]                               │
│  Initial ABW: [0.002 g]                        │
│  Target Harvest: [120 days]                    │
│  [START CYCLE]                                 │
└─────────────────────────────────────────────┘
```

### 5.2 Daily Logging Flow
```
┌─────────────────────────────────────────────┐
│                 Home Dashboard                 │
│  ┌─────────────┐  ┌─────────────┐            │
│  │ POND 1      │  │ POND 2      │            │
│  │ Day 45      │  │ Day 30      │            │
│  │ 🟢 Water    │  │ 🟡 Water    │            │
│  └─────────────┘  └─────────────┘            │
│  [LOG WATER] [ADD FEED] [SAMPLING]              │
└─────────────────────────────────────────────┘
          │              │              │
          ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Water Log   │ │ Feed Log    │ │ Sampling    │
│             │ │             │ │             │
│ DO: [6.5]   │ │ Amount: [45]│ │ Sampled: [50]│
│ pH: [7.8]   │ │ Time: [10:00]│ │ Weight: [410]│
│ Temp: [28]  │ │ [SAVE]      │ │ [SAVE]      │
│ [SAVE]      │ └─────────────┘ └─────────────┘
└─────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│              Water Log Result                  │
│  ┌─────────────────────────────────────────┐ │
│  │ 🟢 ALL PARAMETERS NORMAL                  │ │
│  │ DO: 6.5 mg/L - Normal                     │ │
│  │ pH: 7.8 - Normal                          │ │
│  │ Temperature: 28°C - Normal                 │ │
│  └─────────────────────────────────────────┘ │
│  [DONE] [ADD PHOTO] [VIEW HISTORY]             │
└─────────────────────────────────────────────┘
```

### 5.3 Feed with Tray Check Flow
```
┌─────────────────────────────────────────────┐
│               Add Feed Form                    │
│  Pond: [Pond 1]                                 │
│  Date: [2026-10-17]                             │
│  Time: [10:00]                                  │
│  Amount (kg): [45]                              │
│  Feed Type: [Regular]                           │
│  Notes: [Morning feeding]                       │
│                                                │
│  Feed Tray Check:                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │   EMPTY │ │ SOME    │ │  FULL   │          │
│  │   🟢    │ │ FEED    │ │ EXCESS  │          │
│  │         │ │ 🟡      │ │ 🔴      │          │
│  └─────────┘ └─────────┘ └─────────┘          │
│                                                │
│  [SAVE FEED LOG]                               │
└─────────────────────────────────────────────┘
```

### 5.4 Offline Sync Flow
```
┌─────────────────────────────────────────────┐
│  User is offline (no internet)                 │
│  ┌─────────────────────────────────────────┐ │
│  │ ⚠️ OFFLINE - Data will sync when online   │ │
│  └─────────────────────────────────────────┘ │
│  [LOG WATER] [ADD FEED]                        │
└─────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  User logs water parameters                    │
│  ┌─────────────────────────────────────────┐ │
│  │ ✅ Saved locally - Pending sync           │ │
│  │ Status: PENDING                           │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  Internet connectivity returns                │
│  ┌─────────────────────────────────────────┐ │
│  │ 🔄 Syncing... (1 of 3)                     │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  Sync complete                                  │
│  ┌─────────────────────────────────────────┐ │
│  │ ✅ All data synced successfully           │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 5.5 Harvest & Report Flow
```
┌─────────────────────────────────────────────┐
│               Harvest Form                     │
│  Pond: [Pond 1]                                 │
│  Cycle: [Cycle 3]                               │
│  Harvest Date: [2026-10-17]                    │
│  Total Biomass: [3,075 kg]                     │
│  Average Weight: [12.5 g]                      │
│  Count: [246,000]                              │
│  Price/kg: [₹500]                               │
│  Buyer: [Aqua Exports Ltd]                     │
│  Notes: [Good quality, all size uniform]       │
│  [RECORD HARVEST]                              │
└─────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│              Cycle Report                      │
│  ┌─────────────────────────────────────────┐ │
│  │ CYCLE 3 REPORT                             │ │
│  │ Duration: 99 days                          │ │
│  │ Initial: 300,000 PL10                      │ │
│  │ Harvest: 246,000 shrimp                    │ │
│  │ Survival: 82%                             │ │
│  │ Final ABW: 12.5g                          │ │
│  │ Total Feed: 3,750 kg                      │ │
│  │ FCR: 1.22                                 │ │
│  │ Total Expenses: ₹6,75,000                 │ │
│  │ Revenue: ₹15,37,500                       │ │
│  │ Profit: ₹8,62,500                         │ │
│  │ Cost/kg: ₹219                             │ │
│  └─────────────────────────────────────────┘ │
│  [EXPORT CSV] [COMPARE WITH PAST] [DONE]      │
└─────────────────────────────────────────────┘
```

---

## 6. Data Model

See `docs/DATABASE.md` for detailed schema definitions.

### Entity Relationship Diagram (Text)
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
  ├── WATER_PARAMETER_DEFINITION (N)
  └── SYNC_METADATA (N)
```

---

## 7. API Endpoints

### 7.1 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | User sign up |
| POST | /api/auth/login | User login |
| POST | /api/auth/logout | User logout |
| POST | /api/auth/reset-password | Password reset |
| GET | /api/auth/me | Get current user |

### 7.2 Farms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/farms | List farms (single user, so always 1) |
| POST | /api/farms | Create farm |
| GET | /api/farms/{id} | Get farm details |
| PUT | /api/farms/{id} | Update farm |

### 7.3 Ponds
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ponds | List ponds |
| POST | /api/ponds | Create pond |
| GET | /api/ponds/{id} | Get pond details |
| PUT | /api/ponds/{id} | Update pond |
| DELETE | /api/ponds/{id} | Delete pond |

### 7.4 Culture Cycles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/culture-cycles | List culture cycles |
| POST | /api/culture-cycles | Create culture cycle |
| GET | /api/culture-cycles/{id} | Get cycle details |
| PUT | /api/culture-cycles/{id} | Update cycle |
| POST | /api/culture-cycles/{id}/close | Close cycle |

### 7.5 Stocking Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stocking-events | List stocking events |
| POST | /api/stocking-events | Create stocking event |
| GET | /api/stocking-events/{id} | Get stocking details |
| PUT | /api/stocking-events/{id} | Update stocking |

### 7.6 Water Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/water-logs | List water logs |
| POST | /api/water-logs | Create water log |
| GET | /api/water-logs/{id} | Get water log details |
| PUT | /api/water-logs/{id} | Update water log |
| DELETE | /api/water-logs/{id} | Delete water log |
| POST | /api/water-logs/bulk | Bulk create (for offline sync) |

### 7.7 Feed Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/feed-logs | List feed logs |
| POST | /api/feed-logs | Create feed log |
| GET | /api/feed-logs/{id} | Get feed log details |
| PUT | /api/feed-logs/{id} | Update feed log |
| DELETE | /api/feed-logs/{id} | Delete feed log |
| POST | /api/feed-logs/bulk | Bulk create (for offline sync) |

### 7.8 Feed Tray Checks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/feed-tray-checks | Create tray check |
| GET | /api/feed-tray-checks/{id} | Get tray check |

### 7.9 Sampling Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/sampling-events | List sampling events |
| POST | /api/sampling-events | Create sampling event |
| GET | /api/sampling-events/{id} | Get sampling details |
| PUT | /api/sampling-events/{id} | Update sampling |
| DELETE | /api/sampling-events/{id} | Delete sampling |

### 7.10 Mortality Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/mortality-logs | List mortality logs |
| POST | /api/mortality-logs | Create mortality log |
| GET | /api/mortality-logs/{id} | Get mortality details |
| PUT | /api/mortality-logs/{id} | Update mortality |
| DELETE | /api/mortality-logs/{id} | Delete mortality |

### 7.11 Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/expenses | List expenses |
| POST | /api/expenses | Create expense |
| GET | /api/expenses/{id} | Get expense details |
| PUT | /api/expenses/{id} | Update expense |
| DELETE | /api/expenses/{id} | Delete expense |
| GET | /api/expenses/summary | Get expense summary |

### 7.12 Harvests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/harvests | List harvests |
| POST | /api/harvests | Create harvest |
| GET | /api/harvests/{id} | Get harvest details |
| PUT | /api/harvests/{id} | Update harvest |

### 7.13 Advisor Rules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/advisor-rules | List advisor rules |
| POST | /api/advisor-rules | Create rule |
| GET | /api/advisor-rules/{id} | Get rule details |
| PUT | /api/advisor-rules/{id} | Update rule |
| DELETE | /api/advisor-rules/{id} | Delete rule |

### 7.14 Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/alerts | List alerts |
| GET | /api/alerts/active | List active alerts |
| PUT | /api/alerts/{id}/acknowledge | Acknowledge alert |

### 7.15 Photos
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/photos/upload | Upload photo |
| GET | /api/photos/{id} | Get photo metadata |
| DELETE | /api/photos/{id} | Delete photo |

### 7.16 Sync
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/sync | Sync pending changes |
| GET | /api/sync/status | Get sync status |
| POST | /api/sync/retry | Retry failed syncs |

### 7.17 Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/export/pond/{id} | Export pond data as CSV |
| GET | /api/export/cycle/{id} | Export cycle data as CSV |
| GET | /api/export/all | Export all user data as CSV |

---

## 8. UI/UX Specification

### 8.1 Design System

#### Colors
```
Primary: #2563eb (Blue-600)
Secondary: #64748b (Slate-500)
Success: #10b981 (Green-500)
Warning: #f59e0b (Amber-500)
Error: #ef4444 (Red-500)
Background: #f8fafc (Slate-50)
Surface: #ffffff (White)
Text Primary: #1e293b (Slate-800)
Text Secondary: #64748b (Slate-500)
Border: #e2e8f0 (Slate-200)
```

#### Typography
```
Font Family: Inter, system-ui, -apple-system, sans-serif
Telugu Font: Noto Sans Telugu, Inter, sans-serif

Heading 1: 2.25rem (36px), bold, Slate-800
Heading 2: 1.875rem (30px), bold, Slate-800
Heading 3: 1.5rem (24px), bold, Slate-800
Body: 1rem (16px), regular, Slate-700
Small: 0.875rem (14px), regular, Slate-500
Caption: 0.75rem (12px), regular, Slate-400
```

#### Spacing
```
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
```

#### Touch Targets
```
Minimum: 44px x 44px (2.75rem x 2.75rem)
Recommended: 48px x 48px (3rem x 3rem)
```

### 8.2 Component Library

#### Buttons
- **Primary:** Blue background, white text, rounded-lg
- **Secondary:** Slate border, blue text, rounded-lg
- **Ghost:** Transparent, blue text, hover:bg-slate-100
- **Icon:** Square, 44px minimum
- **Sizes:** sm (36px), md (44px), lg (48px)

#### Inputs
- **Text:** Large, clear, with floating label
- **Number:** Large numeric keypad on mobile
- **Select:** Large dropdown with search
- **Date:** Native date picker
- **Time:** Native time picker
- **Textarea:** Minimum 100px height

#### Cards
- **Default:** White background, slate-200 border, rounded-lg, shadow-sm
- **Elevated:** White background, shadow-md
- **Padding:** md (16px) internal padding

#### Status Indicators
- **Green (Good):** #10b981 background, white text
- **Yellow (Warning):** #f59e0b background, white text
- **Red (Bad):** #ef4444 background, white text
- **Size:** 24px height, with icon + text

### 8.3 Page Layouts

#### Mobile Layout
```
┌─────────────────────────────────┐
│  Header (56px)                    │
│  [≡ Menu] [Title] [👤 User]        │
├─────────────────────────────────┤
│  Main Content                     │
│  (Scrollable)                     │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ Content Card                 │ │
│  │                             │ │
│  └─────────────────────────────┘ │
├─────────────────────────────────┤
│  Bottom Navigation (Optional)     │
│  [Home] [Ponds] [Logs] [Settings] │
└─────────────────────────────────┘
```

#### Tablet Layout
```
┌─────────────────────────────────────────────┐
│  Header (64px)                              │
│  [≡ Menu] [Title] [👤 User] [🌐 Lang]        │
├─────────────────────────────────────────────┤
│  Sidebar (240px)          │  Main Content    │
│  [Home]                   │  (Scrollable)    │
│  [Ponds]                  │                 │
│  [Active Cycles]          │  ┌─────────────┐ │
│  [Reports]                │  │ Content     │ │
│  [Settings]               │  │             │ │
│                          │  └─────────────┘ │
└─────────────────────────────────────────────┘
```

#### Desktop Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header (64px)                                              │
│  [Logo] [Title] [👤 User] [🌐 Lang] [⚙️ Settings]              │
├─────────────────────────────────────────────────────────────┤
│  Sidebar (240px)                  │  Main Content (Flexible)  │
│  [Dashboard]                      │                            │
│  [Farm Management]               │  ┌─────────────────────┐ │
│    [Ponds]                       │  │                     │ │
│    [Culture Cycles]              │  │   Content Area       │ │
│  [Logging]                       │  │                     │ │
│    [Water]                      │  └─────────────────────┘ │
│    [Feed]                        │                            │
│    [Sampling]                    │                            │
│    [Mortality]                   │                            │
│  [Expenses]                      │                            │
│  [Reports]                       │                            │
│  [Settings]                      │                            │
└─────────────────────────────────────────────────────────────┘
```

### 8.4 Navigation

#### Bottom Tab Navigation (Mobile)
- Home (Dashboard)
- Ponds
- Log (Quick entry)
- Alerts
- Settings

#### Sidebar Navigation (Tablet/Desktop)
- Dashboard
- Farm Management
  - Ponds
  - Culture Cycles
- Logging
  - Water
  - Feed
  - Sampling
  - Mortality
  - Expenses
- Reports
  - Cycle Reports
  - Comparison
  - Export
- Settings
  - Profile
  - Advisor Rules
  - Language
  - About

### 8.5 Form Design

#### Quick Entry Forms
- Single column
- Large inputs (minimum 48px height)
- Clear labels with units
- Remember last values
- Auto-focus first field
- Submit button fixed at bottom

#### Detailed Forms
- Stepped forms for complex operations
- Progress indicator
- Back/Next/Submit buttons
- Validation on blur
- Error messages below fields

---

## 9. Security Requirements

### 9.1 Authentication
- Supabase Auth with email/password
- Secure password storage (bcrypt)
- Session management with JWT
- Session timeout: 24 hours
- Remember me option: 30 days

### 9.2 Authorization
- Row Level Security (RLS) on all tables
- Policy: `owner_id = auth.uid()`
- No user can access another user's data
- API routes validate ownership

### 9.3 Data Protection
- All API calls over HTTPS
- Secrets in environment variables only
- No secrets in client-side code
- Input validation on client and server
- SQL injection protection (parameterized queries)
- XSS protection (output encoding)

### 9.4 Audit Trail
- created_at and updated_at on all tables
- created_by on all tables (user_id)
- Soft delete where appropriate (is_deleted flag)

---

## 10. Performance Requirements

### 10.1 Load Times
| Page | Target Load Time | Priority |
|------|-----------------|----------|
| Home Dashboard | < 3s | High |
| Pond List | < 2s | High |
| Pond Detail | < 2s | High |
| Water Log Form | < 1s | High |
| Feed Log Form | < 1s | High |
| Cycle Report | < 3s | Medium |

### 10.2 Data Transfer
- Water log entry: < 50 KB
- Feed log entry: < 50 KB
- Photo upload: 200-300 KB (compressed)
- Sync batch: < 1 MB per request

### 10.3 Caching
- Static assets: Cache for 1 year
- API responses: Cache for 5 minutes (where appropriate)
- User data: No cache (always fresh)

### 10.4 Offline Storage
- IndexedDB quota: < 50 MB
- Maximum pending records: 1000
- Photo storage: Compress before storing locally

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| ABW | Average Body Weight - average weight of sampled shrimp |
| Biomass | Total weight of shrimp in the pond |
| Culture Cycle | Complete cycle from stocking to harvest |
| DO | Dissolved Oxygen - oxygen level in water (mg/L) |
| FCR | Feed Conversion Ratio - feed used / biomass gained |
| PL | Post-Larvae - young shrimp stage |
| PL10 | Post-Larvae 10 days old |
| pH | Measure of water acidity/alkalinity (0-14) |
| Survival Rate | Percentage of stocked shrimp that survive to harvest |

---

## Appendix B: Assumptions

1. User has a smartphone with modern browser
2. User has intermittent internet connectivity
3. User is comfortable with basic smartphone operations
4. User will review and validate advisor rules with a professional
5. All calculations use standard aquaculture formulas
6. Demo data is for testing only

---

## Appendix C: Open Questions

1. Should we support biometric authentication (Face ID/Touch ID)?
2. Should we implement data backup to user's cloud storage (Google Drive, iCloud)?
3. Should we support multiple farms for the same user?
4. Should we implement data sharing (export/import) between users?

---

*This document defines the complete product specification for Aqua Diary. All implementation decisions should reference this specification.*
