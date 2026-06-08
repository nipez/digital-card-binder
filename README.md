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

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used by the app. `SUPABASE_DB_URL` is used by the seed script. `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_UPLOAD_TOKEN` are server-only values used by the admin image uploader.

## Supabase Setup

1. Create a Supabase project.
2. Apply `supabase/migrations/20260531000100_initial_binder_archive.sql` in the SQL editor or with the Supabase CLI.
3. Confirm the `card-scans` storage bucket exists.
4. Run the demo seed:

```bash
npm run seed
```

The migration enables RLS on all public tables and includes explicit grants for readable set/card data because new Supabase projects may not auto-expose public tables to the Data API.

## Admin Image Uploads

Open `/admin/card-image-uploader` or use the `Admin upload scan` link on any card detail page, such as `/cards/4-gregg-jefferies`. Enter `ADMIN_UPLOAD_TOKEN`, pick front or back, choose a JPG, PNG, or WebP, and save. The uploader stores the file in the public `card-scans` bucket and updates `card_images` to `approved`.

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
- `npm run scrape-card-set-images -- --provider brave --max-cards 25` uses a search API to discover front/back candidate images across the web for a full card set.
- `npm run ingest-approved-scans -- scripts/my-approved-scans.json` downloads rights-confirmed image URLs, crops them, writes public scan assets, and emits SQL updates.
- `npm run seed` loads the 30-card demo seed through `SUPABASE_DB_URL`.
- `npm run process-scan -- <input> <output> <left> <top> <width> <height>` crops a raw scan/photo into a 750x1050 WebP card image.
- `npm run start` starts the built app.

## Scan Cleanup

Raw card photos often include table edges, sleeves, slabs, or tilted borders. The current cleanup path is a manual crop command using Sharp. Future upload moderation should automate this with a preview step: detect the card rectangle, deskew it, crop to the standard 2.5:3.5 ratio, let the submitter adjust, then save the cleaned image to Supabase Storage.

For broad web discovery, add one search API key to `.env.local`:

```bash
BRAVE_SEARCH_API_KEY=
SERPAPI_API_KEY=
BING_SEARCH_API_KEY=
```

Then run:

```bash
npm run scrape-card-set-images -- --provider brave --max-cards 25
```

Without a checklist, this searches card numbers `1` through `800`. For better matches, pass a CSV or JSON checklist with `number`, `playerName`, and optional `slug` fields:

```bash
npm run scrape-card-set-images -- --provider brave --cards scripts/checklists/1989-upper-deck-baseball.example.csv --max-cards 5
```

The broad scraper writes `scripts/web-scraped-scan-candidates.json`. It is review-first: candidate entries set `rightsConfirmed` to `false`, and you should review source permissions, image quality, and front/back matching before ingestion. Only after you have permission to use the images, either copy approved entries into `scripts/approved-scan-manifest.example.json` format and run `npm run ingest-approved-scans -- <manifest>`, or run the scraper with `--download --confirm-rights` to download normalized WebP images and emit `supabase/seed/scraped_scan_updates.sql`.

For external image ingestion, use `scripts/approved-scan-manifest.example.json` as the template. Each URL must be an owned scan, a licensed image, or an explicitly permissioned source, and must set `rightsConfirmed` to `true`.
