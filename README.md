# Taskboard

A private, single-user projects & tasks tracker. Next.js 16 (App Router) + Supabase (Postgres + Auth), deployed on Vercel at a subdomain of abreuh.com.

## What she gets

- **Today** – overdue, due today, next 7 days, high-priority-with-no-date, recently done
- **All tasks** – in progress / scheduled / someday / loose ends / done
- **Projects** – cards with progress bars, color, target date, status (active · on hold · done · archived)
- **Project page** – quick-add tasks, in-progress / to-do / done, edit or delete the project
- Click any task to edit title, notes, project, status, priority, due date, or delete it
- Light/dark follows the device; works on phone and desktop
- Single login (email + password). Row Level Security means only her account can ever read her rows.

## Setup (≈15 minutes)

### 1. Supabase

1. Create a project at supabase.com (free tier is fine). Pick a region near NJ (`us-east-1`).
2. **SQL Editor → New query**: paste `supabase/schema.sql` and run it.
3. **Authentication → Providers → Email**: leave Email enabled, turn **off** "Confirm email" (so the one account can sign in without a verification round-trip). Optionally also turn off sign-ups under **Authentication → Settings** ("Allow new users to sign up") — the app has no sign-up page, so this just closes the API path.
4. **Authentication → Users → Add user → Create new user**: her email + a password, with **Auto Confirm User** checked.
5. **Project Settings → API**: copy the **Project URL** and the **anon public** key.

### 2. Run locally

```bash
cp .env.example .env.local   # then paste the URL and anon key
npm install
npm run dev                  # http://localhost:3000
```

### 3. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. vercel.com → **Add New → Project** → import the repo. Framework is auto-detected.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy. You'll get a `*.vercel.app` URL — confirm login works there first.

### 4. Point the subdomain at it

1. Vercel → project → **Settings → Domains** → add `HERNAME.abreuh.com`.
2. At your DNS provider for abreuh.com, add the record Vercel shows — a **CNAME** for `HERNAME` → `cname.vercel-dns.com`.
3. Wait for it to verify (usually minutes). Vercel issues the TLS cert automatically.
4. Supabase → **Authentication → URL Configuration**: set **Site URL** to `https://HERNAME.abreuh.com`.

## Project layout

```
supabase/schema.sql          tables, indexes, updated_at triggers, RLS policies
src/proxy.ts                 refreshes the session cookie, redirects logged-out users to /login
src/lib/supabase/            browser + server Supabase clients (@supabase/ssr)
src/lib/queries.ts           shared reads
src/app/actions.ts           all writes (server actions): auth, projects, tasks
src/app/login/               sign-in page
src/app/(app)/               authenticated shell with sidebar nav
  page.tsx                   Today
  inbox/                     All tasks
  projects/                  list · new · [id] detail
src/components/              task item (inline edit), quick-add, project form/header, nav
```

## Ideas for v2

- Drag-and-drop ordering (there's already a `position` column)
- Recurring tasks
- Sub-tasks / checklists inside a task
- Email or push reminder the morning something is due
- Add you as a second account with a shared workspace (needs a `workspaces` table + updated RLS)
