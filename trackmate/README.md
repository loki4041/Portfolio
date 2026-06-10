# TrackMate 🎯

A personal academic & wellness tracker built with **Expo (React Native)** and
**Supabase**. Tracks daily to-dos, water intake, steps, study sessions, and a
DSA + Python learning journey — with cloud sync and Google sign-in.

Full scoped requirements live in [`../REQUIREMENTS.md`](../REQUIREMENTS.md).

## Features (MVP)

- 📊 **Dashboard** — today's steps, water, tasks, study time, and learning streak
- ✅ **Tasks** — daily to-dos with priorities; unfinished tasks carry over
- 📚 **Study** — log study sessions, record DSA/Python problems solved
  (topic + difficulty), and tick off seeded DSA & Python topic roadmaps
- 💧 **Water** — log custom ml amounts toward a 3 L daily goal
- 👟 **Steps** — automatic phone pedometer (with manual fallback), 8,000 goal
- 🌗 **Theme** — system / light / dark toggle
- 🔐 **Google sign-in** via Supabase, data private per user (row-level security)

## Setup (one-time, ~15 minutes)

### 1. Create the Supabase backend

1. Go to [supabase.com](https://supabase.com) → create a free account & project.
2. In the dashboard open **SQL Editor** → **New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it.

### 2. Enable Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com) create a project,
   then **APIs & Services → Credentials → Create credentials → OAuth client ID**
   (type: *Web application*).
2. Add this authorized redirect URI (replace with your project ref):
   `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`
3. In Supabase: **Authentication → Sign In / Providers → Google** → enable it and
   paste the Google client ID + secret.
4. In Supabase: **Authentication → URL Configuration → Redirect URLs**, add:
   - `trackmate://` (for production builds)
   - the `exp://...` URL Expo prints when you start the dev server
     (e.g. `exp://192.168.1.5:8081`) — needed for Expo Go.

### 3. Configure and run the app

```bash
cp .env.example .env     # then paste your Supabase URL + anon key into .env
npm install
npx expo start
```

Install **Expo Go** from the Play Store / App Store on your phone, scan the QR
code from the terminal, and you're in.

## Tech stack

| Layer | Choice |
|---|---|
| App | Expo SDK 56, React Native, TypeScript, expo-router |
| Backend | Supabase (Postgres, Auth, row-level security) |
| Sensors | expo-sensors Pedometer |
| Auth | Supabase OAuth (Google) via expo-auth-session |

## Project structure

```
src/
  app/            # screens (expo-router file-based routing)
    login.tsx
    (tabs)/       # Home, Tasks, Study, Health, Settings
  components/ui.tsx   # shared Card, Button, Input, Chip, ProgressBar...
  context/        # auth (Supabase session) and theme providers
  hooks/          # use-profile, use-steps (pedometer logic)
  lib/            # supabase client, types, date/streak helpers, roadmap seed
supabase/schema.sql   # database schema + RLS policies
```

## Roadmap (Phase 2)

Workout builder (sets/reps/weights) · Pomodoro timer · class timetable ·
grades/GPA · habit streaks · push reminders (water, assignments, spaced
revision) · weekly trend charts.
