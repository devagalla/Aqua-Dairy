# Aqua-Dairy

## Run locally

1. Copy `.env.local.example` to `.env.local` and enter your Supabase project URL and public anon key.
2. Apply migrations in `supabase/migrations` in filename order.
3. Run `npm install`, then `npm run dev`.

Use `npm test` to run unit tests and `npm run build` to verify production build.

## Implemented Features

### Phase 4: Pond Log & Growth Tracker
- **File:** `src/utils/growthMath.ts`
- ADG calculation, stunted growth alerts (<0.15 g/day), actual FCR, gross asset value
- **Component:** `src/components/GrowthTracker.tsx` with Recharts visualization

### Phase 5: Shrimp Health Checklist
- **File:** `src/logic/healthRules.ts`
- Symptoms mapped to severity levels with feed adjustment rules
- **Component:** `src/components/VisualWaterHealth.tsx`

### Phase 6: Market Prices Module
- **Hook:** `src/hooks/useGrossCropValue.ts`
- API integration with `https://api.aquasangham.in/api/v1/prices`
- Count tiers 30-100, trend indicators, stale-price warnings

### Phases 7 & 8: Bilingual & Accessibility
- Telugu localization in `src/locales/te.json`
- Touch targets ≥56px, text ≥18px, high contrast
- Offline persistence via IndexedDB/LocalStorage

## Architecture
Built from analysis of AquaSangham (React Native + Firebase) and Royye Raju (Flutter) APKs targeting Andhra/Telangana prawn farmers.
