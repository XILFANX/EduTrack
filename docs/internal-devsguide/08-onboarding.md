# Developer Onboarding

Get EduTrack running locally in under 10 minutes.

## Prerequisites
- Node.js 20+
- npm or pnpm
- Supabase CLI installed (`npm install -g supabase`)

## 1. Local Database Setup
We use the Supabase CLI to run a local Postgres instance with our exact production schema.

```bash
cd backend
supabase start
```
This will start the local database, apply `production_migration.sql`, and output your local API keys.

## 2. Environment Variables
Copy the example environment file in the web app:

```bash
cd apps/web
cp .env.example .env.local
```
Fill in the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` using the values outputted by `supabase start`.

## 3. Run the Next.js App
Start the development server:

```bash
npm run dev
```
Navigate to `http://localhost:3000`. 

## 4. Make Your First Change
To verify your setup, try adding a test log in `apps/web/middleware.ts` inside the `isAllowedForRole` function, save, and navigate between portal routes to see it fire in your terminal.
