# Onboarding & Local Setup

Get EduTrack running on your local machine in under 20 minutes.

---

## Prerequisites

- Node.js v20+
- npm v10+
- Supabase CLI (`npm install -g supabase`)
- Git

---

## 1. Installation

```bash
git clone https://github.com/XILFANX/EduTrack.git
cd EduTrack
npm install
```

---

## 2. Environment Variables

Create your local env file:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Ensure the following minimal variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from local supabase start>
SUPABASE_SERVICE_ROLE_KEY=<from local supabase start>
NEXT_PUBLIC_APP_URL=http://localhost:3000
PRODUCT_ADMINISTRATOR_EMAIL=admin@edutrack.co.ke
BOOTSTRAP_SECRET=local_secret_123
CRON_SECRET=local_cron_123
```

---

## 3. Start the Database

```bash
cd backend/supabase
supabase start
```

This starts a local PostgreSQL instance on port `54321` and runs all migrations. It also launches Supabase Studio at `http://127.0.0.1:54323`.

> **Note:** Copy the `anon` and `service_role` keys output by the CLI into your `.env.local` file.

---

## 4. Bootstrap the Platform Owner

To bypass the invite system and create your root admin account:

1. Go to `http://localhost:3000/signup` and register with the email matching `PRODUCT_ADMINISTRATOR_EMAIL`.
2. Run this command in a separate terminal:

```bash
curl -X POST http://localhost:3000/api/admin/bootstrap \
  -H "X-Bootstrap-Secret: local_secret_123"
```

3. Refresh your browser. You will be redirected to the `/admin/dashboard`.

---

## 5. Run the Application

```bash
npm run dev
```

The application is now running at `http://localhost:3000`. 

From the Admin Dashboard, you can create a test School, assign yourself as Principal, and begin exploring the tenant isolation features.
