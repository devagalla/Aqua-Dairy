# Aqua Diary — Architecture Document

**Project:** Aqua Diary - Personal Shrimp Farm Management
**Version:** 1.0
**Date:** October 17, 2026
**Author:** Claude Code (with Rakesh Kumar Devagalla)

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Data Architecture](#6-data-architecture)
7. [Offline Architecture](#7-offline-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Version Information](#10-version-information)

---

## 1. System Overview

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        Next.js Application                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │  │
│  │  │   App Router │  │   Components │  │    Hooks    │  │   Services  │  │  │
│  │  │   (Pages)    │  │   (UI)       │  │   (Logic)   │  │  (API Calls)│  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐│  │
│  │  │                    Offline Layer (IndexedDB)                       ││  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  ││  │
│  │  │  │  Sync Queue  │  │  Local Cache │  │  Sync Processor       │  ││  │
│  │  │  │  (Pending)   │  │  (Read)      │  │  (Background)         │  ││  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘  ││  │
│  │  └─────────────────────────────────────────────────────────────────┘│  │
│  │  ┌─────────────────────────────────────────────────────────────────┐│  │
│  │  │                    i18n Layer (next-intl)                          ││  │
│  │  │  ┌─────────────┐  ┌─────────────┐                                    ││  │
│  │  │  │  en.json    │  │  te.json    │                                    ││  │
│  │  │  └─────────────┘  └─────────────┘                                    ││  │
│  │  └─────────────────────────────────────────────────────────────────┘│  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE (Backend)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   Auth      │  │  Database   │  │   Storage   │  │  Realtime   │  │  │
│  │  │ (Users)     │  │ (PostgreSQL)│  │  (Photos)   │  │ (Optional)  │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐│  │
│  │  │                    Row Level Security (RLS)                        ││  │
│  │  │  owner_id = auth.uid() on all user data tables                     ││  │
│  │  └─────────────────────────────────────────────────────────────────┘│  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 High-Level Architecture

Aqua Diary follows a **client-server architecture** with:
- **Frontend:** Next.js 14+ application with App Router
- **Backend:** Supabase (PostgreSQL database + Auth + Storage)
- **Offline:** IndexedDB for local storage with automatic sync
- **i18n:** next-intl for English and Telugu support

### 1.3 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js App Router | Modern React framework with built-in routing, SSR, and API routes |
| Supabase | Free tier supports all requirements, built-in auth, RLS, storage |
| TypeScript | Type safety, better developer experience, catch errors early |
| Tailwind CSS | Rapid UI development, consistent design system |
| shadcn/ui | Accessible, customizable components, not a black box |
| IndexedDB | Browser-native, no dependencies, reliable offline storage |
| next-intl | Type-safe i18n, JSON-based translations, easy to maintain |

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.3 | React framework with App Router |
| React | 18.3.1 | UI library |
| TypeScript | 5.5.2 | Type checking |
| Tailwind CSS | 3.4.3 | Utility-first CSS |
| shadcn/ui | latest | UI component library |
| React Hook Form | 7.51.1 | Form management |
| Zod | 3.23.8 | Schema validation |
| Recharts | 2.12.7 | Charting library |
| next-intl | 3.15.0 | Internationalization |
| @tanstack/react-query | 5.48.0 | Server state management |
| idb | 7.1.1 | IndexedDB wrapper |
| uuid | 9.0.1 | UUID generation |

### 2.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | latest | Backend-as-a-Service |
| PostgreSQL | 15.x | Database |
| Supabase Auth | latest | Authentication |
| Supabase Storage | latest | File storage |
| Supabase Realtime | latest | Real-time updates (optional) |

### 2.3 DevOps

| Technology | Version | Purpose |
|------------|---------|---------|
| Vercel | latest | Hosting (Hobby tier) |
| Git | 2.x | Version control |
| ESLint | 8.57.0 | Linting |
| Prettier | 3.2.5 | Code formatting |
| Jest | 29.7.0 | Testing |
| React Testing Library | 14.2.1 | Component testing |
| Playwright | 1.44.0 | E2E testing (optional) |

### 2.4 Development Tools

| Tool | Purpose |
|------|---------|
| GitHub | Code repository |
| GitHub Actions | CI/CD (optional) |
| VS Code | Code editor |
| Chrome DevTools | Debugging |

---

## 3. Project Structure

```
aqua-dairy/
├── .github/                    # GitHub workflows (optional)
│   └── workflows/
│       └── ci.yml
├── .husky/                     # Git hooks (optional)
├── .vercel/                    # Vercel configuration
├── docs/                       # Documentation
│   ├── BRIEF.md               # Build brief (source of truth)
│   ├── PRODUCT_SPEC.md        # Product specification
│   ├── ARCHITECTURE.md        # This file
│   ├── DATABASE.md            # Database schema
│   ├── IMPLEMENTATION_PLAN.md # Implementation plan
│   └── DEPLOYMENT.md          # Deployment guide (future)
├── public/                     # Static assets
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   └── apple-touch-icon.png
│   ├── locales/
│   │   └── manifest.json      # PWA manifest
│   └── robots.txt
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/        # Dashboard group
│   │   │   ├── home/
│   │   │   │   └── page.tsx
│   │   │   ├── ponds/
│   │   │   │   ├── [pondId]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (logging)/          # Logging group
│   │   │   ├── water/
│   │   │   │   ├── [pondId]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── feed/
│   │   │   │   ├── [pondId]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── sampling/
│   │   │   │   └── page.tsx
│   │   │   ├── mortality/
│   │   │   │   └── page.tsx
│   │   │   └── expenses/
│   │   │       └── page.tsx
│   │   ├── (reports)/          # Reports group
│   │   │   ├── cycles/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (settings)/         # Settings group
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── rules/
│   │   │   │   └── page.tsx
│   │   │   ├── language/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/                # API routes
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── logout/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── me/
│   │   │   │   │   └── route.ts
│   │   │   │   └── signup/
│   │   │   │       └── route.ts
│   │   │   ├── farms/
│   │   │   │   ├── route.ts      # GET all, POST
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts  # GET, PUT, DELETE
│   │   │   ├── ponds/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── culture-cycles/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── water-logs/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── feed-logs/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── sampling-events/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── mortality-logs/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── expenses/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── harvests/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── advisor-rules/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── alerts/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── acknowledge/
│   │   │   │       │   └── route.ts
│   │   │   │       └── route.ts
│   │   │   ├── sync/
│   │   │   │   ├── route.ts
│   │   │   │   └── retry/
│   │   │   │       └── route.ts
│   │   │   └── export/
│   │   │       ├── pond/
│   │   │       │   └── [id]/
│   │   │       │       └── route.ts
│   │   │       ├── cycle/
│   │   │       │   └── [id]/
│   │   │       │       └── route.ts
│   │   │       └── all/
│   │   │           └── route.ts
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx             # Landing page (redirect to dashboard)
│   │   ├── globals.css
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/              # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── common/              # Common UI components
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── ActionButton.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── ChartContainer.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── forms/                # Form components
│   │   │   ├── WaterLogForm.tsx
│   │   │   ├── FeedLogForm.tsx
│   │   │   ├── SamplingForm.tsx
│   │   │   ├── MortalityForm.tsx
│   │   │   ├── ExpenseForm.tsx
│   │   │   ├── FarmForm.tsx
│   │   │   ├── PondForm.tsx
│   │   │   └── CycleForm.tsx
│   │   ├── ponds/                # Pond-specific components
│   │   │   ├── PondCard.tsx
│   │   │   ├── PondOverview.tsx
│   │   │   ├── WaterChart.tsx
│   │   │   ├── FeedChart.tsx
│   │   │   └── GrowthChart.tsx
│   │   ├── dashboard/            # Dashboard components
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── PondSummary.tsx
│   │   │   ├── AlertSummary.tsx
│   │   │   └── QuickActions.tsx
│   │   └── shared/               # Shared components
│   │       ├── LanguageSwitcher.tsx
│   │       ├── SyncStatus.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── lib/                      # Library code
│   │   ├── db/                  # Database
│   │   │   ├── supabase.ts      # Supabase client
│   │   │   └── client.ts        # Supabase client singleton
│   │   ├── services/            # Business logic services
│   │   │   ├── farmService.ts
│   │   │   ├── pondService.ts
│   │   │   ├── cycleService.ts
│   │   │   ├── waterService.ts
│   │   │   ├── feedService.ts
│   │   │   ├── samplingService.ts
│   │   │   ├── mortalityService.ts
│   │   │   ├── expenseService.ts
│   │   │   ├── harvestService.ts
│   │   │   ├── alertService.ts
│   │   │   └── syncService.ts
│   │   ├── repositories/        # Data access layer
│   │   │   ├── farmRepository.ts
│   │   │   ├── pondRepository.ts
│   │   │   ├── cycleRepository.ts
│   │   │   ├── waterRepository.ts
│   │   │   ├── feedRepository.ts
│   │   │   ├── samplingRepository.ts
│   │   │   ├── mortalityRepository.ts
│   │   │   ├── expenseRepository.ts
│   │   │   ├── harvestRepository.ts
│   │   │   ├── alertRepository.ts
│   │   │   └── ruleRepository.ts
│   │   ├── utils/               # Utility functions
│   │   │   ├── dateUtils.ts
│   │   │   ├── numberUtils.ts
│   │   │   ├── validation.ts
│   │   │   ├── calculations.ts  # FCR, biomass, etc.
│   │   │   └── constants.ts
│   │   ├── hooks/               # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── usePonds.ts
│   │   │   ├── useWaterLogs.ts
│   │   │   ├── useFeedLogs.ts
│   │   │   ├── useOffline.ts
│   │   │   ├── useSync.ts
│   │   │   └── useAlerts.ts
│   │   ├── types/               # TypeScript types
│   │   │   ├── index.ts         # Main type exports
│   │   │   ├── farm.ts
│   │   │   ├── pond.ts
│   │   │   ├── cycle.ts
│   │   │   ├── water.ts
│   │   │   ├── feed.ts
│   │   │   ├── sampling.ts
│   │   │   ├── mortality.ts
│   │   │   ├── expense.ts
│   │   │   ├── harvest.ts
│   │   │   ├── alert.ts
│   │   │   ├── rule.ts
│   │   │   └── sync.ts
│   │   └── i18n/                # Internationalization
│   │       ├── en.json
│   │       ├── te.json
│   │       └── index.ts
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   ├── types/                   # Additional types (if needed)
│   │
│   └── middleware.ts            # Next.js middleware
│
├── .env.local.example          # Environment variables template
├── .env.local                  # Environment variables (gitignored)
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md
└── vercel.json
```

---

## 4. Frontend Architecture

### 4.1 App Router Structure

Next.js 14 App Router provides file-system based routing:
- `app/page.tsx` - Root page (redirects to dashboard)
- `app/(auth)/` - Auth group (login, signup)
- `app/(dashboard)/` - Dashboard group (main app)
- `app/(logging)/` - Logging group (data entry)
- `app/(reports)/` - Reports group
- `app/(settings)/` - Settings group
- `app/api/` - API routes

### 4.2 Component Hierarchy

```
App
├── RootLayout
│   ├── ThemeProvider
│   ├── AuthProvider
│   ├── QueryClientProvider
│   ├── I18nProvider
│   └── OfflineProvider
│
├── AuthLayout (for auth pages)
│   └── AuthForm
│
└── DashboardLayout (for main app)
    ├── Header
    │   ├── Logo
    │   ├── Navigation
    │   ├── LanguageSwitcher
    │   └── UserMenu
    │
    ├── Sidebar (tablet/desktop)
    │   └── NavLinks
    │
    ├── BottomNav (mobile)
    │   └── NavIcons
    │
    └── MainContent
        ├── DashboardPage
        │   ├── PondSummaryList
        │   │   └── PondSummaryCard
        │   ├── AlertSummary
        │   └── QuickActions
        │
        ├── PondPage
        │   ├── PondHeader
        │   ├── Tabs
        │   │   ├── OverviewTab
        │   │   ├── WaterTab
        │   │   ├── FeedTab
        │   │   ├── GrowthTab
        │   │   ├── ExpensesTab
        │   │   ├── AlertsTab
        │   │   └── HistoryTab
        │   └── FloatingActionButton
        │
        └── LogPages (Water, Feed, Sampling, Mortality, Expense)
            └── LogForm
```

### 4.3 State Management

#### Server State (React Query)
- All API data fetched with `@tanstack/react-query`
- Centralized query client with persistent cache
- Automatic refetch on window focus
- Optimistic updates for mutations

#### Client State (React Context + useState)
- Auth state (user, session)
- Offline status
- Sync status
- Language preference
- Form state

#### URL State
- Filter parameters in URL (e.g., `?pondId=...&date=...`)
- Pagination state in URL

### 4.4 Data Flow

```
User Interaction
     │
     ▼
┌─────────────────┐
│   UI Component   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Custom Hook    │  (usePonds, useWaterLogs, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Service Layer  │  (pondService, waterService, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Repository      │  (pondRepository, waterRepository, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Offline Layer   │  (Sync Service + IndexedDB)
└────────┬────────┘
         │
    ┌────▼────┐
    ▼         ▼
┌───────┐ ┌───────┐
│Local DB│ │ Supabase│
│IndexedDB│ │ API    │
└───────┘ └───────┘
```

### 4.5 Form Management

- **React Hook Form** for form state management
- **Zod** for schema validation
- **Server-side validation** for all mutations
- **Auto-save** for draft forms (optional)
- **Remember last values** for quick entry

### 4.6 Error Handling

#### API Errors
- Network errors → Show retry button
- Validation errors → Show field-specific errors
- Authentication errors → Redirect to login
- Not found errors → Show 404 page

#### UI Errors
- Form validation errors → Show below field
- Calculation errors → Show warning, continue with fallback
- Chart errors → Show empty state

### 4.7 Loading States

- **Page loading:** Skeleton screens
- **Data loading:** Spinners in data containers
- **Form submission:** Disable submit button, show spinner
- **Sync loading:** Status indicator in header

### 4.8 Empty States

- **No ponds:** "Create your first pond"
- **No active cycles:** "Start a new culture cycle"
- **No water logs:** "No water data yet"
- **No alerts:** "No alerts - all parameters normal"

---

## 5. Backend Architecture

### 5.1 Supabase Setup

#### Project Configuration
```javascript
// supabase/config.toml
[global]
project_id = "aqua-dairy"
db_password = "{secure_password}"

[auth]
site_url = "https://www.aquadairy.xyz"
jwt_secret = "{secure_jwt_secret}"
enable_anonymous_sign_ins = false

[db]
port = 5432
```

#### Database Schema
See `docs/DATABASE.md` for detailed schema.

### 5.2 Row Level Security (RLS)

All user data tables have RLS policies:

```sql
-- Enable RLS on all tables
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ponds ENABLE ROW LEVEL SECURITY;
ALTER TABLE culture_cycles ENABLE ROW LEVEL SECURITY;
-- ... all other user tables

-- Policy: Users can only access their own data
CREATE POLICY "Users can view own farms"
ON farms FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own farms"
ON farms FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own farms"
ON farms FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own farms"
ON farms FOR DELETE
USING (owner_id = auth.uid());
```

### 5.3 API Routes

#### Structure
```
src/app/api/
├── [resource]/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET, PUT, DELETE
```

#### Response Format
```typescript
// Success response
{
  success: true,
  data: { ... },        // Response data
  meta?: {              // Optional metadata
    count: number,
    page: number,
    total: number
  }
}

// Error response
{
  success: false,
  error: {
    code: string,        // Error code (e.g., "VALIDATION_ERROR")
    message: string,     // Human-readable message
    details?: any        // Additional error details
  }
}
```

#### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | Not authorized |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| INTERNAL_ERROR | 500 | Internal server error |

### 5.4 Service Layer

Services encapsulate business logic:

```typescript
// src/lib/services/waterService.ts
class WaterService {
  constructor(private repository: WaterRepository) {}

  async logWater(data: WaterLogInput): Promise<WaterLog> {
    // Validate input
    const validated = WaterLogSchema.parse(data);
    
    // Calculate culture day
    const cultureDay = await this.calculateCultureDay(
      validated.pondId,
      validated.date
    );
    
    // Evaluate rules
    const alerts = await this.evaluateRules(validated, cultureDay);
    
    // Create water log
    const waterLog = await this.repository.create({
      ...validated,
      cultureDay,
      ownerId: getCurrentUserId(),
    });
    
    // Create alerts if any
    if (alerts.length > 0) {
      await this.alertService.createMany(alerts);
    }
    
    return waterLog;
  }

  private async evaluateRules(
    data: WaterLogInput,
    cultureDay: number
  ): Promise<Alert[]> {
    const rules = await this.ruleRepository.getActiveRules(
      data.pondId,
      cultureDay
    );
    
    const alerts: Alert[] = [];
    
    for (const rule of rules) {
      const value = data[rule.parameter as keyof WaterLogInput];
      const isViolated = this.checkRuleViolation(value, rule);
      
      if (isViolated) {
        alerts.push({
          ruleId: rule.id,
          pondId: data.pondId,
          cultureCycleId: data.cultureCycleId,
          waterLogId: undefined, // Will be set after creation
          severity: rule.severity,
          message: getCurrentLanguage() === 'te' ? rule.message_te : rule.message_en,
          action: getCurrentLanguage() === 'te' ? rule.action_te : rule.action_en,
          triggeredAt: new Date(),
          acknowledged: false,
          ownerId: getCurrentUserId(),
        });
      }
    }
    
    return alerts;
  }
}
```

### 5.5 Repository Layer

Repositories handle data access:

```typescript
// src/lib/repositories/waterRepository.ts
class WaterRepository {
  constructor(private supabase: SupabaseClient) {}

  async getByPond(pondId: string, options?: { page?: number; limit?: number }): Promise<{
    data: WaterLog[];
    count: number;
  }> {
    const { page = 1, limit = 20 } = options || {};
    const offset = (page - 1) * limit;

    const { data, count, error } = await this.supabase
      .from('water_logs')
      .select('*', { count: 'exact' })
      .eq('pond_id', pondId)
      .eq('owner_id', getCurrentUserId())
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return { data: data || [], count: count || 0 };
  }

  async create(input: CreateWaterLogInput): Promise<WaterLog> {
    const { data, error } = await this.supabase
      .from('water_logs')
      .insert({
        ...input,
        id: generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, input: UpdateWaterLogInput): Promise<WaterLog> {
    const { data, error } = await this.supabase
      .from('water_logs')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('owner_id', getCurrentUserId())
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('water_logs')
      .delete()
      .eq('id', id)
      .eq('owner_id', getCurrentUserId());

    if (error) throw error;
  }
}
```

---

## 6. Data Architecture

### 6.1 Data Flow

```
User Device (Browser)
┌─────────────────────────────────┐
│  Next.js App                      │
│  ┌─────────────────────────────┐ │
│  │  React Query Cache           │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │  IndexedDB (Offline Storage) │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │  sync_queue              │ │ │
│  │  │  local_cache             │ │ │
│  │  │  pending_records         │ │ │
│  │  └─────────────────────────┘ │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
         │
         │ HTTP/HTTPS
         ▼
┌─────────────────────────────────┐
│  Supabase (Backend)               │
│  ┌─────────────────────────────┐ │
│  │  PostgreSQL Database         │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │  farms                  │ │ │
│  │  │  ponds                  │ │ │
│  │  │  culture_cycles         │ │ │
│  │  │  water_logs             │ │ │
│  │  │  feed_logs              │ │ │
│  │  │  sampling_events         │ │ │
│  │  │  mortality_logs          │ │ │
│  │  │  expenses               │ │ │
│  │  │  harvests               │ │ │
│  │  │  alerts                 │ │ │
│  │  │  advisor_rules          │ │ │
│  │  │  photos                 │ │ │
│  │  │  sync_metadata          │ │ │
│  │  └─────────────────────────┘ │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │  Supabase Storage            │ │
│  │  (Photos)                   │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 6.2 Type Definitions

All database types are defined in `src/lib/types/`:

```typescript
// src/lib/types/water.ts
export interface WaterLog {
  id: string;
  pond_id: string;
  culture_cycle_id: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  do_mg_per_l: number | null;
  ph: number | null;
  temperature_c: number | null;
  salinity_ppt: number | null;
  ammonia_mg_per_l: number | null;
  nitrite_mg_per_l: number | null;
  alkalinity_mg_per_l: number | null;
  transparency_cm: number | null;
  notes: string | null;
  status: 'GREEN' | 'YELLOW' | 'RED' | null;
  culture_day: number | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWaterLogInput {
  pond_id: string;
  culture_cycle_id?: string;
  date: string;
  time: string;
  do_mg_per_l?: number;
  ph?: number;
  temperature_c?: number;
  salinity_ppt?: number;
  ammonia_mg_per_l?: number;
  nitrite_mg_per_l?: number;
  alkalinity_mg_per_l?: number;
  transparency_cm?: number;
  notes?: string;
}
```

### 6.3 Validation Schemas

Zod schemas for validation:

```typescript
// src/lib/utils/validation.ts
import { z } from 'zod';

export const WaterLogSchema = z.object({
  pond_id: z.string().uuid(),
  culture_cycle_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  do_mg_per_l: z.number().min(0).max(20).optional(),
  ph: z.number().min(0).max(14).optional(),
  temperature_c: z.number().min(0).max(50).optional(),
  salinity_ppt: z.number().min(0).max(100).optional(),
  ammonia_mg_per_l: z.number().min(0).max(10).optional(),
  nitrite_mg_per_l: z.number().min(0).max(10).optional(),
  alkalinity_mg_per_l: z.number().min(0).max(1000).optional(),
  transparency_cm: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export type WaterLogInput = z.infer<typeof WaterLogSchema>;
```

---

## 7. Offline Architecture

### 7.1 Offline-First Strategy

Aqua Diary implements an **offline-first** approach:
1. All write operations are stored locally first
2. Data is synced to the server when connectivity is available
3. Reads first check local cache, then fetch from server
4. Conflicts are resolved with server wins (timestamp-based)

### 7.2 IndexedDB Schema

```
IndexedDB: aqua-dairy-db
├── stores:
│   ├── sync_queue
│   │   key: id (UUID)
│   │   value: { id, type, data, timestamp, retryCount, status }
│   │
│   ├── local_cache
│   │   key: `type:id` (e.g., "water_log:123")
│   │   value: { data, timestamp, dirty }
│   │
│   ├── pending_records
│   │   key: id (UUID)
│   │   value: { id, type, data, timestamp }
│   │
│   └── metadata
│       key: "sync_status", "last_sync", etc.
│       value: { value, timestamp }
```

### 7.3 Sync Process

```
┌─────────────────────────────────────────────────────────────┐
│                        Sync Flow                                  │
├─────────────────────────────────────────────────────────────┤
│  1. User performs action (e.g., log water)                      │
│     │                                                             │
│     ▼                                                             │
│  2. Generate UUID and timestamp                                  │
│     │                                                             │
│     ▼                                                             │
│  3. Store in IndexedDB (pending_records)                        │
│     │                                                             │
│     ▼                                                             │
│  4. Check connectivity                                          │
│     │                                                             │
│     ├── Online? ── NO ──▶ Store locally, show "Pending"          │
│     │                                                             │
│     └── Online? ── YES ──▶ Proceed to sync                      │
│           │                                                   │
│           ▼                                                   │
│  5. Add to sync queue with status "syncing"                    │
│     │                                                             │
│     ▼                                                             │
│  6. Send to Supabase API                                         │
│     │                                                             │
│     ├── Success? ── YES ──▶ Remove from queue, update local    │
│     │                     cache, show "Synced"                  │
│     │                                                             │
│     └── Success? ── NO ──▶ Increment retry count                │
│           │                                                   │
│           ├── Retry count < 3? ── YES ──▶ Retry with backoff    │
│           │                                                   │
│           └── Retry count >= 3? ── NO ──▶ Mark as "Failed"      │
│                                                               │
│  7. Auto-retry on connectivity change                           │
│     │                                                             │
│     ▼                                                             │
│  8. Manual retry available for failed items                     │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Sync Service Implementation

```typescript
// src/lib/services/syncService.ts
class SyncService {
  private queue: SyncItem[] = [];
  private isSyncing = false;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(
    private db: IDBDatabase,
    private api: ApiClient,
    private onStatusChange: (status: SyncStatus) => void
  ) {
    this.setupConnectivityListener();
  }

  async enqueue(item: SyncItem): Promise<void> {
    // Store in IndexedDB
    await this.storeInIndexedDB(item);
    
    // Add to memory queue
    this.queue.push(item);
    
    // Trigger sync if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    this.onStatusChange({ status: 'syncing', total: this.queue.length });
    
    while (this.queue.length > 0) {
      const item = this.queue[0];
      
      try {
        // Update status
        await this.updateStatus(item.id, 'syncing');
        
        // Send to API
        const response = await this.api.post(`/${item.type}`, item.data);
        
        // Success - remove from queue and local storage
        await this.removeFromIndexedDB(item.id);
        this.queue.shift();
        this.onStatusChange({ 
          status: 'synced', 
          synced: item.id,
          remaining: this.queue.length 
        });
        
      } catch (error) {
        // Increment retry count
        const retryCount = await this.incrementRetryCount(item.id);
        
        if (retryCount >= MAX_RETRIES) {
          // Mark as failed
          await this.updateStatus(item.id, 'failed');
          this.queue.shift();
          this.onStatusChange({ 
            status: 'failed', 
            failed: item.id,
            remaining: this.queue.length 
          });
        } else {
          // Calculate backoff (exponential: 1s, 2s, 4s, 8s)
          const delay = Math.pow(2, retryCount) * 1000;
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Don't remove from queue - will retry
          this.onStatusChange({ 
            status: 'retrying', 
            retrying: item.id,
            retryCount,
            remaining: this.queue.length 
          });
        }
      }
    }
    
    this.isSyncing = false;
    this.onStatusChange({ status: 'idle' });
  }

  private setupConnectivityListener(): void {
    window.addEventListener('online', () => {
      // Online - process queue
      this.processQueue();
    });
    
    window.addEventListener('offline', () => {
      // Offline - pause sync
      this.isSyncing = false;
      this.onStatusChange({ status: 'offline' });
    });
  }
}
```

### 7.5 Offline Hook

```typescript
// src/lib/hooks/useOffline.ts
import { useEffect, useState } from 'react';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: 'idle' });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, syncStatus };
}
```

---

## 8. Security Architecture

### 8.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Flow                            │
├─────────────────────────────────────────────────────────────┤
│  1. User enters email/password on login page                    │
│     │                                                             │
│     ▼                                                             │
│  2. Client sends credentials to /api/auth/login                │
│     │                                                             │
│     ▼                                                             │
│  3. Server validates credentials with Supabase Auth           │
│     │                                                             │
│     ▼                                                             │
│  4. Supabase returns JWT token and user data                    │
│     │                                                             │
│     ▼                                                             │
│  5. Server sets HTTP-only cookie with JWT                       │
│     │                                                             │
│     ▼                                                             │
│  6. Client receives success response                            │
│     │                                                             │
│     ▼                                                             │
│  7. Client redirects to dashboard                                │
│     │                                                             │
│     ▼                                                             │
│  8. Subsequent requests include cookie                          │
│     │                                                             │
│     ▼                                                             │
│  9. Server validates JWT on each request                         │
│     │                                                             │
│     ▼                                                             │
│  10. Server extracts user_id from JWT for RLS                   │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Security Measures

#### Authentication
- **JWT Tokens:** Signed with secure secret, short expiration (1 hour)
- **Refresh Tokens:** Long-lived (30 days), stored in HTTP-only cookie
- **Password Hashing:** bcrypt with salt
- **Session Management:** Server-side session tracking

#### Authorization
- **RLS Policies:** All user data tables have `owner_id = auth.uid()` policy
- **API Validation:** All API routes validate ownership
- **No Direct Access:** Users cannot access other users' data even with ID

#### Data Protection
- **HTTPS:** All communication over HTTPS
- **Secrets:** Stored in environment variables only
- **Client-Side:** No secrets in browser code
- **Input Validation:** Client and server validation
- **SQL Injection:** Parameterized queries (Supabase handles this)
- **XSS:** Output encoding in React

#### Storage
- **Photos:** Uploaded to Supabase Storage with proper permissions
- **File Names:** Random UUIDs, not user-provided
- **Content Type:** Validated on upload
- **Size Limits:** Enforced (200-300 KB target)

### 8.3 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://{project-ref}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY={anon-key}

# Server-side only (not exposed to client)
SUPABASE_SERVICE_ROLE_KEY={service-role-key}
JWT_SECRET={jwt-secret}
ENCRYPTION_KEY={encryption-key}
```

### 8.4 Rate Limiting

- **API Rate Limit:** 100 requests per minute per user
- **Auth Rate Limit:** 10 login attempts per minute
- **Sync Rate Limit:** 50 sync requests per minute

---

## 9. Deployment Architecture

### 9.1 Vercel Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel Deployment                         │
├─────────────────────────────────────────────────────────────┤
│  GitHub Repository                                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  aqua-dairy (main branch)                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Vercel (Hobby Tier)                                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │   Build     │  │   Deploy    │  │   Preview   │      │  │
│  │  │   Process   │──▶│   Process   │──▶│   Deployments│      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  │  ┌─────────────────────────────────────────────────────┐│  │
│  │  │  Production Deployment                               ││  │
│  │  │  https://www.aquadairy.xyz                            ││  │
│  │  └─────────────────────────────────────────────────────┘│  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Supabase (Free Tier)                                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │  Database   │  │    Auth     │  │   Storage   │      │  │
│  │  │ (PostgreSQL)│  │ (Users)     │  │ (Photos)    │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Deployment Steps

1. **Set up Supabase project**
   - Create project at supabase.com
   - Configure database schema (run migrations)
   - Set up RLS policies
   - Create service role key

2. **Set up Vercel project**
   - Import from GitHub
   - Configure environment variables
   - Set Node.js version (20.x)

3. **Configure environment variables**
   - Add Supabase URL and keys
   - Add JWT secret

4. **Deploy**
   - Push to main branch
   - Vercel automatically deploys

### 9.3 Free Tier Limits

#### Vercel Hobby
- 100 GB bandwidth/month
- 10 ms execution time per request
- 3 serverless functions
- Automatic HTTPS

#### Supabase Free
- 500 MB database storage
- 2 GB bandwidth/day
- 500 MB file storage
- 10,000 rows/day (soft limit)
- 2 databases

### 9.4 Monitoring

- **Vercel Analytics:** Request logs, performance
- **Supabase Dashboard:** Database metrics, query monitoring
- **Error Tracking:** Client-side errors logged to console
- **Alerts:** Manual monitoring for now

---

## 10. Version Information

### 10.1 Dependencies (Exact Versions)

```json
{
  "dependencies": {
    "@hookform/resolvers": "3.3.4",
    "@radix-ui/react-alert-dialog": "1.0.5",
    "@radix-ui/react-avatar": "1.0.4",
    "@radix-ui/react-checkbox": "1.0.4",
    "@radix-ui/react-collapsible": "1.0.3",
    "@radix-ui/react-dialog": "1.0.5",
    "@radix-ui/react-dropdown-menu": "2.0.6",
    "@radix-ui/react-label": "2.0.2",
    "@radix-ui/react-popover": "1.0.7",
    "@radix-ui/react-progress": "1.0.3",
    "@radix-ui/react-select": "2.0.0",
    "@radix-ui/react-separator": "1.0.3",
    "@radix-ui/react-slot": "1.0.2",
    "@radix-ui/react-tabs": "1.0.4",
    "@radix-ui/react-toast": "1.1.5",
    "@radix-ui/react-tooltip": "1.0.7",
    "@supabase/supabase-js": "2.42.0",
    "@tanstack/react-query": "5.48.0",
    "class-variance-authority": "0.7.0",
    "clsx": "2.1.0",
    "idb": "7.1.1",
    "lucide-react": "0.344.0",
    "next": "14.2.3",
    "next-intl": "3.15.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-hook-form": "7.51.1",
    "recharts": "2.12.7",
    "tailwind-merge": "2.2.1",
    "tailwindcss-animate": "1.0.7",
    "uuid": "9.0.1",
    "zod": "3.23.8"
  },
  "devDependencies": {
    "@types/node": "20.11.17",
    "@types/react": "18.2.61",
    "@types/react-dom": "18.2.19",
    "@types/uuid": "9.0.8",
    "autoprefixer": "10.4.18",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.3",
    "postcss": "8.4.35",
    "prettier": "3.2.5",
    "prettier-plugin-tailwindcss": "0.5.11",
    "tailwindcss": "3.4.3",
    "typescript": "5.5.2"
  }
}
```

### 10.2 Node.js Version
- **Required:** 20.x (LTS)
- **Recommended:** 20.12.0+

### 10.3 Browser Support
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome for Android)

---

## Appendix A: Design Decisions

### A.1 Why Next.js App Router?
- Modern React framework with built-in routing
- Server Components for better performance
- API routes built-in
- Easy deployment to Vercel
- Good TypeScript support

### A.2 Why Supabase?
- Free tier supports all requirements
- Built-in authentication
- Row Level Security
- PostgreSQL database
- Storage for photos
- Realtime capabilities (optional)
- Easy to set up and use

### A.3 Why IndexedDB for Offline?
- Browser-native, no dependencies
- Reliable and well-supported
- Can store structured data
- Persists across page reloads
- Works with service workers

### A.4 Why React Query?
- Excellent server state management
- Built-in caching
- Automatic refetching
- Optimistic updates
- Easy to use with TypeScript

### A.5 Why shadcn/ui?
- Not a black box - copy/paste components
- Accessible by default
- Customizable
- Based on Radix UI primitives
- Good TypeScript support

---

## Appendix B: Future Considerations

### B.1 Potential Enhancements (Not in Scope)
- PWA installation prompt
- Push notifications for alerts
- Data backup to user's cloud storage
- Multiple farms support
- Data sharing between users
- Advanced analytics
- IoT sensor integration
- WhatsApp notifications

### B.2 Migration Paths
- **Multi-user:** Add user management, update RLS policies
- **Multi-farm:** Add farm switching, update data model
- **Commercial:** Add subscription management, billing

---

*This document defines the complete architecture for Aqua Diary. All implementation decisions should reference this architecture.*
