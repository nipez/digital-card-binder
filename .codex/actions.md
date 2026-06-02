# Codex Local Actions

Use these repo-local actions for common Codex work on this Mac Mini.

## Install

```sh
npm install
```

Use after cloning or when `package.json` / `package-lock.json` changes.

## Lint

```sh
npm run lint
```

Runs ESLint across the repo.

## Build

```sh
npm run build
```

Runs the Next.js production build and TypeScript checks.

## Dev Server

```sh
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

## Start Production Server

```sh
npm run start
```

Run only after `npm run build`.

## Seed Demo Data

```sh
npm run seed
```

Requires `SUPABASE_DB_URL`.

Warning: this mutates the database. Run only after confirming the intended local/dev Supabase target, never against production.

## Ingest Approved Scans

```sh
npm run ingest-approved-scans -- scripts/my-approved-scans.json
```

Use only for owned, licensed, or explicitly permissioned image URLs with rights confirmed.

## Process Scan

```sh
npm run process-scan -- <input> <output> <left> <top> <width> <height>
```

Crops a raw scan/photo into a 750x1050 WebP card image.
