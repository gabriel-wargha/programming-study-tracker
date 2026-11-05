# Programming Study Tracker

A personal app for focused programming goals, weekly activity, and projects. Product scope and build order live in [plan.md](plan.md); coding and security rules live in [AGENTS.md](AGENTS.md).

## Status

The project now uses Neon instead of Supabase. Phases 1 to 7 are built and run entirely on your machine:

- **Database:** PGlite, which is Postgres embedded in Node. It needs no Docker or account and stores data in `.data/`.
- **User:** a fixed local owner that works only under `npm run dev`.

Phase 8 connects the same schema to Neon, adds GitHub sign-in through Neon Auth, and deploys to Vercel. Phases 1 and 2 are done: as the local owner you can create, edit, and archive topics; create and edit goals; move goals through their statuses; and set the active goal limit. Weekly logs and projects (Phase 3) are next.

## Local development

Use Node.js 22.15.0 (`nvm use`) and npm.

```bash
npm ci
cp .env.example .env.local   # keeps LOCAL_OWNER_MODE=1
npm run dev
```

Open [localhost:3000](http://localhost:3000). The dev server creates the local database in `.data/pglite` and applies migrations on first use.

```bash
npm run db:generate   # create a migration after editing src/db/schema.ts
npm run db:migrate    # apply migrations (stop the dev server first)
npm run db:reset      # delete and rebuild the local database (stop the dev server first)
```

PGlite allows only one process at a time, so stop `npm run dev` before running the `db:` scripts.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e   # first time: npx playwright install chromium
```

`npm test` runs once and includes database tests on an in-memory Postgres; `npm run test:watch` watches for changes. Tests live beside the code they cover. The production build uses Next.js's Webpack option, and the app uses system fonts, so builds don't need to download anything.

shadcn/ui is configured manually with `components.json`, CSS theme variables, `cn`, and a shared Button. Follow the [official shadcn/ui guide](https://ui.shadcn.com/docs/installation/manual) when adding components.

## Neon setup (Phase 8 only)

You don't need any of this until the last phase. The full list is in section 10 of [plan.md](plan.md). In short:

1. Create a Neon project, then run `neon login` and `neon link`.
2. Turn on Neon Auth, and add a GitHub OAuth app with callback `{NEON_AUTH_BASE_URL}/callback/github`.
3. Fill in the Phase 8 variables from `.env.example`.
4. Import the repository into Vercel and add the same variables there.

The GitHub remote is [gabriel-wargha/programming-study-tracker](https://github.com/gabriel-wargha/programming-study-tracker). Nothing has been deployed.
