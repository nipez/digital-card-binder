# Binder Archive

Binder Archive is a nostalgic, premium-feeling digital trading card binder MVP built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

The first set is `1989 Upper Deck Baseball`, shown as a nine-pocket binder with demo checklist data and original placeholder art. No copyrighted card scans are bundled.

## MVP Features

- Home page, set page, team binder pages, card detail pages, submit scan page, and admin moderation queue
- Nine-pocket binder sleeve grid with transparent rounded slots
- Filters for team, player, rookies, Hall of Famers, and missing scans
- Card detail view with front/back flip animation
- Visible `Front scan needed` and `Back scan needed` placeholders
- Collection actions: `I had this`, `I have this`, `I want this`, and `Favorite`
- Supabase schema for sets, cards, images, user collections, scan submissions, moderation events, and profiles
- Seed SQL for 30 demo 1989 Upper Deck Baseball cards

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used by the app. `SUPABASE_DB_URL` is used by the seed script.

## Supabase Setup

1. Create a Supabase project.
2. Apply `supabase/migrations/20260531000100_initial_binder_archive.sql` in the SQL editor or with the Supabase CLI.
3. Confirm the `card-scans` storage bucket exists.
4. Run the demo seed:

```bash
npm run seed
```

The migration enables RLS on all public tables and includes explicit grants for readable set/card data because new Supabase projects may not auto-expose public tables to the Data API.

## Railway Deployment

1. Create a Railway project from the GitHub repository.
2. Set the environment variables from `.env.example`.
3. Use the default build command:

```bash
npm run build
```

4. Use the default start command:

```bash
npm start
```

The included `start` script runs `next start` for Railway's runtime phase.

## GitHub Workflow

Recommended branch flow:

```bash
git checkout -b codex/binder-archive-mvp
git add .
git commit -m "Build Binder Archive MVP"
git push origin codex/binder-archive-mvp
```

Open a draft PR for review, then connect the repo to Railway for deployment.

## Scripts

- `npm run dev` starts the Next.js dev server.
- `npm run build` builds the app.
- `npm run lint` runs Next.js linting.
- `npm run seed` loads the 30-card demo seed through `SUPABASE_DB_URL`.
- `npm run start` starts the built app.
