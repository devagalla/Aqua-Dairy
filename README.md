# Aqua-Dairy

## Run locally

1. Copy `.env.local.example` to `.env.local` and enter your Supabase project URL and public anon key.
2. Apply the SQL migrations in `supabase/migrations` to your Supabase project (`supabase db push` from a linked project, or run the migration SQL in the Supabase SQL editor).
3. In Supabase Authentication → URL Configuration, set the Site URL to `https://www.aquadairy.xyz` and allow the callback URLs listed in `.env.local.example` (also allow `https://aqua-dairy.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`).
4. Run `npm install`, then `npm run dev`.

Use `npm test` to run the unit tests and `npm run build` to verify a production build.