# Aqua-Dairy

## Run locally

1. Copy `.env.local.example` to `.env.local` and enter your Supabase project URL and public anon key. Add a Google Maps browser API key restricted by HTTP referrer for the Maps JavaScript API and Places API if you want locality suggestions.
2. Apply every SQL migration in `supabase/migrations` to your Supabase project in filename order (`supabase db push` from a linked project, or run each file in the Supabase SQL editor). If earlier migrations are already applied, run any newer migration files that have not been applied yet. Migrations `202610170005_repair_growth_samples_schema.sql` and `202610170006_repair_farm_workflow_tables.sql` repair workflow database objects and refresh Supabase's API schema cache. Migration `202610170007_add_multi_farm_pond_setup.sql` enables adding multiple named farms and creating a pond together with its first culture cycle. Migration `202610170008_add_pond_weather_locations.sql` adds saved pond locations for local weather forecasts. Migration `202610170009_model_feed_entries_and_cycle_status.sql` adds one-feeding and daily-summary feed records, marks older cycles completed except each pond's most recent cycle, and enables explicit cycle completion.
3. In Supabase Authentication → URL Configuration, set the Site URL to `https://www.aquadairy.xyz` and allow the callback URLs listed in `.env.local.example` (also allow `https://aqua-dairy.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`).
4. Run `npm install`, then `npm run dev`.

Use `npm test` to run the unit tests and `npm run build` to verify a production build.