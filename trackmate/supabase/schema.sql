-- TrackMate database schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).

-- ---------------------------------------------------------------------------
-- Profiles: one row per user, holds goals and preferences.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  step_goal integer not null default 8000,
  water_goal_ml integer not null default 3000,
  created_at timestamptz not null default now()
);

-- Auto-create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- To-dos
-- ---------------------------------------------------------------------------
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date not null default current_date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Water intake (one row per drink logged)
-- ---------------------------------------------------------------------------
create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_ml integer not null check (amount_ml > 0),
  day date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Steps (one row per day, upserted from the pedometer or manual entry)
-- ---------------------------------------------------------------------------
create table if not exists public.step_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  steps integer not null default 0 check (steps >= 0),
  unique (user_id, day)
);

-- ---------------------------------------------------------------------------
-- Study sessions
-- ---------------------------------------------------------------------------
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  minutes integer not null check (minutes > 0),
  notes text,
  day date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- DSA / Python problems solved
-- ---------------------------------------------------------------------------
create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  topic text not null,
  difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard')),
  source text,
  day date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Learning roadmap topics (seeded per user from the app on first launch)
-- ---------------------------------------------------------------------------
create table if not exists public.roadmap_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  track text not null check (track in ('dsa', 'python')),
  name text not null,
  position integer not null default 0,
  completed boolean not null default false,
  unique (user_id, track, name)
);

-- ---------------------------------------------------------------------------
-- Row-level security: every user sees only their own rows.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.todos enable row level security;
alter table public.water_logs enable row level security;
alter table public.step_logs enable row level security;
alter table public.study_sessions enable row level security;
alter table public.problems enable row level security;
alter table public.roadmap_topics enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own todos" on public.todos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own water" on public.water_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own steps" on public.step_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own study" on public.study_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own problems" on public.problems
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own roadmap" on public.roadmap_topics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
