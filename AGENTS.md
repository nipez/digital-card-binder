# Repository Guide

## Project

Binder Archive is a Next.js App Router app built with TypeScript, React, Tailwind CSS, and Supabase.

## Environment

- Use Node `>=22`.
- Use npm. This repo has `package-lock.json`.
- Do not use pnpm, yarn, or bun unless the project is intentionally migrated.
- Keep secrets out of the repo. Use `.env.local` for local values.

## Common Commands

```sh
npm install
npm run lint
npm run build
npm run dev
npm run start
```

## Supabase Commands

These require local environment variables from `.env.local` or the shell:

Warning: `npm run seed` mutates the database. Run it only after confirming the intended local/dev Supabase target, never against production.

```sh
npm run seed
npm run ingest-approved-scans -- scripts/my-approved-scans.json
npm run process-scan -- <input> <output> <left> <top> <width> <height>
```

Required Supabase variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
```

## Validation

Before handing off meaningful code changes, run:

```sh
npm run lint
npm run build
```

If dependencies changed, prefer `npm install` and keep `package-lock.json` in sync.
