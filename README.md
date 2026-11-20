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

Heaviest first. Each set goes as hard as you can, up to 10 reps. When every set reaches 10, go heavier next time. A three-day push/pull/legs split works each muscle once. The fourth day repeats the main movements with different exercises, so every muscle gets about two sessions per cycle. Each day is estimated at 75–80 minutes including the warm-up. The data is in `src/program/`.

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
