# Rota

A four-day gym rotation. Push, pull, legs, full body, done in order whenever you train. For each day the app shows the warm-up, then the exercises with pictures, sets and rest. Tick sets as you go. A rest timer starts when you tick a set, and finishing a day moves you on to the next one.

It's a static Next.js site, styled with the Strata design system (copied from the Cortex repo). Progress is kept in the browser's localStorage. There are no accounts and no server.

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
- **Your log stays on the phone.** It lives in this browser's storage and is written the moment you tick a set. **Save backup** and **Restore backup** on the home page move it to a new phone.

## Develop

```bash
npm install
npm run dev
```

`npm test` runs the unit tests and `npm run typecheck` checks types.

## Deploy (Cloudflare Workers)

The site builds to static files in `out/` (`output: 'export'` in `next.config.ts`), and `wrangler.jsonc` tells Cloudflare to serve that folder.

In Cloudflare: Workers & Pages → Create → import `adebay8/gym-rota`, then:

- Project name: `gym-rota`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Preview command: leave Cloudflare's default

Every push to `main` redeploys. To try the Cloudflare setup locally: `npm run build && npx wrangler dev`.

On your phone, open the site in Safari → Share → Add to Home Screen.

## Credits

Exercise pictures come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense, public domain). Icons are from [Lucide](https://lucide.dev). Fonts are Bricolage Grotesque and Hanken Grotesk, self-hosted via Fontsource.
