# Rota

A four-day gym rotation. Push, pull, legs, full body, done in order whenever you train. For each day the app shows the warm-up, then the exercises with pictures, sets and rest. Tick sets as you go. A rest timer starts when you tick a set, and finishing a day moves you on to the next one.

It's a Next.js app on Vercel, styled with the Strata design system (copied from the Cortex repo). Your log is saved on the phone first (localStorage), so it works with no signal. It syncs to your MongoDB through one API route, `/api/progress`, whenever you're online.

## The program

| Day | Focus | Exercises |
| --- | --- | --- |
| 1 · Push | Chest, shoulders, triceps | Smith bench press, incline DB press, shoulder press machine, dips, chest fly machine, DB lateral raise, rope pushdown, overhead rope extension |
| 2 · Pull | Back, rear shoulders, biceps | Pull-ups, chest-supported DB row, close-grip pulldown, pullover machine, face pull, reverse fly machine, EZ preacher curl, hammer curl |
| 3 · Legs | Quads, hamstrings, glutes, calves, abs | Smith squat, leg press, DB Romanian deadlift, walking lunge, leg extension, leg curl, calf press, knee raise |
| 4 · Full body | Hamstrings, chest, back, legs, arms | Smith Romanian deadlift, chest press machine, wide pulldown, Bulgarian split squat, one-arm DB row, cable lateral raise, incline curl, overhead rope extension, cable crunch |

Heaviest first. Each set goes as hard as you can, up to 10 reps. A three-day push/pull/legs split works each muscle once. The fourth day repeats the main movements with different exercises, so every muscle gets about two sessions per cycle. Each day is estimated at 75–80 minutes including the warm-up. The data is in `src/program/`.

## Logging and progression

- **The day page is the plan.** It shows the warm-up checklist, then every exercise with this session's target. Tap any exercise in any order: if a machine is taken, do another and come back.
- **The exercise screen is where you log.** Each set has kg, reps and a tick. The faint numbers are the suggestion: tick without typing to log them as is, or type what you actually did. Ticking a set starts the rest timer, which carries across screens. **Next** goes to the next exercise you haven't finished; **Do later** skips one for now.
- **Double progression.** Keep the weight and add reps until every set reaches 10, then go up the smallest step: +2 kg per dumbbell, +2.5 kg on cables and the EZ bar, +5 kg on machines and the Smith. Bodyweight moves add reps, then a light dumbbell. The rules are in `src/progression/`.
- **How did the last set feel?** After the last set, one optional tap: **Easy** (3 or more reps left), **Hard** (1–2 left) or **All out** (nothing left). This is the reps-in-reserve scale (Zourdos et al. 2016, Helms et al. 2016). Easy at 10 on every set earns a double jump. Easy and close to 10 moves up early. All out below 6 reps steps back a little.
- **Something to beat.** Each exercise shows its volume (kg × reps, added up over the sets) against last time, a "New best set" note when a set beats your previous best (compared by estimated one-rep max), and its recent history. The home page sums up the last session.
- **Saved on the phone, synced to MongoDB.** Each set is written to the phone the moment you tick it, then synced in the background (after a 2-second pause, when the app comes back to the front, and when you're back online). The server merges rather than overwrites, so a phone and a laptop can't wipe each other's sets. **Save backup** and **Restore backup** on the home page are a fallback.

## Develop

```bash
npm install
npm run dev
```

`npm test` runs the unit tests and `npm run typecheck` checks types.

## Deploy (Vercel)

1. vercel.com → Add New → Project → import `adebay8/gym-rota`. The Next.js defaults are right.
2. Add environment variables (Settings → Environment Variables), then deploy:
   - `MONGO_URI`: your Atlas connection string (the same cluster as your other projects is fine).
   - `ROTA_SYNC_KEY`: a long random key that protects the API. Make one with `openssl rand -base64 32`.
   - `MONGO_DB` (optional): the database name, `rota` by default. Everything is one document in its `progress` collection.
3. Atlas → Network Access must allow Vercel. Vercel has no fixed IP addresses, so this means `0.0.0.0/0`, the same setting a Vercel-hosted project needs anyway.
4. Open the site on your phone, scroll to **Your log**, paste the sync key, and tap **Connect**.

Every push to `main` redeploys. On your phone, open the site in Safari → Share → Add to Home Screen.

To run the API locally, put `MONGO_URI` and `ROTA_SYNC_KEY` in `.env.local` (gitignored) and run `npm run dev`.

## Credits

Exercise pictures come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense, public domain). Icons are from [Lucide](https://lucide.dev). Fonts are Bricolage Grotesque and Hanken Grotesk, self-hosted via Fontsource.
