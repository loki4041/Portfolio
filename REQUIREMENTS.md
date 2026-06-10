# TrackMate — Requirements Specification

A personal academic & wellness tracker, scoped through a stakeholder interview on 2026-06-10.

## 1. Vision

A single-user mobile app that helps Lokesh stay on top of academics (including a
DSA + Python learning journey), daily goals (to-dos, steps, water, workouts) and
overall productivity — with cloud sync so data is never lost.

## 2. Decisions from the stakeholder interview

| Topic | Decision |
|---|---|
| Platform | Mobile app (React Native + Expo, runs via Expo Go) |
| Storage | Cloud with login (Supabase: Postgres + Auth) |
| Users | Single user (personal) |
| Stack | Developer's choice → Expo SDK 56 + TypeScript + expo-router + Supabase |
| Sign-in | Google sign-in (via Supabase OAuth) |
| Steps | Phone pedometer (auto), 8,000 steps/day goal, manual fallback |
| Water | Custom amounts in ml, 3,000 ml/day goal |
| Workouts | Detailed sets & reps with history (Phase 2) |
| Academics | Assignments & deadlines, class timetable, grades/GPA, study sessions |
| DSA/Python | Problems-solved log, topic roadmap checklist, daily streak, revision reminders |
| Productivity | Daily to-do list, habit streaks, Pomodoro timer, stats dashboard |
| Reminders | Water nudges, assignment due alerts, daily planning nudge (Phase 2) |
| Theme | Light & dark with in-app toggle (follows system by default) |
| Approach | MVP first, architected so Phase 2 modules slot in |

## 3. MVP scope (Phase 1 — this build)

1. **Auth** — Google sign-in through Supabase; session persisted on device.
2. **Dashboard** — today at a glance: steps, water, tasks done, study minutes,
   DSA/Python streak, with progress toward goals.
3. **To-dos** — add/complete/delete daily tasks with priority; overdue tasks
   carry forward visibly.
4. **Health** — water logging in ml (quick presets + custom amount) against a
   3 L goal; step count from the phone pedometer against an 8,000 goal, with
   manual entry fallback where the sensor is unavailable.
5. **Study** — log study sessions (subject + minutes); DSA/Python problem log
   (title, topic, difficulty, source); seeded topic roadmap checklists for DSA
   and Python; consistency streak computed from activity.
6. **Settings** — edit step/water goals, switch theme (system/light/dark),
   sign out.

## 4. Phase 2 backlog (architected for, not yet built)

- Workout builder: exercises, sets, reps, weights, progress history.
- Pomodoro focus timer linked to study sessions and to-dos.
- Class timetable and "today's classes" on the dashboard.
- Grades/GPA tracking per subject.
- Habit streaks (custom daily habits).
- Push notifications: water reminders, assignment due alerts, daily planning
  nudge, spaced-repetition revision reminders for solved problems.
- Charts: weekly/monthly trends on the dashboard.

## 5. Non-functional requirements

- Data is private per user (Postgres row-level security on every table).
- Works on Android and iOS through Expo Go; no app-store account needed.
- Secrets (Supabase URL/key) live in `.env`, never committed.
- Theme preference and session persist across app restarts.
