# Programming Study Tracker

A personal app for focused programming goals, weekly activity, and projects. Product scope and build order live in [plan.md](plan.md); coding and security rules live in [AGENTS.md](AGENTS.md).

Phase 1 preparation is in progress. The starter still runs unchanged. Auth form components, a profiles migration and RLS tests, environment validation, and a local test-user helper are prepared; live authentication is not connected yet.

## Local development

Use Node.js 22.15.0 (`nvm use`) and npm. The selected test tools require Node.js 22.13 or later on the 22.x line; `package.json` lists the supported Node versions.

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The starter page does not need environment variables. In Phase 1, copy `.env.example` to `.env.local` and replace its placeholders with local Supabase values. Keep real environment files out of Git.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` runs once; `npm run test:watch` watches for changes. Component tests live beside the code they cover. The production build uses Next.js's supported Webpack option because Turbopack's worker port is blocked in the current agent sandbox. Tailwind uses the standard PostCSS integration. The starter uses system fonts so builds do not need to download fonts.

shadcn/ui is configured manually with `components.json`, CSS theme variables, `cn`, and a shared Button. Follow the [official shadcn/ui guide](https://ui.shadcn.com/docs/installation/manual) when adding components.

## Remaining Phase 0 setup

The current agent session cannot reach the npm registry, open a local server port, access Docker's socket, or control the browser. Supabase packages and Playwright are absent from the local package cache. From a terminal with network access, install the planned packages:

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install --save-dev supabase @playwright/test
npx playwright install chromium
```

Then configure Playwright and add its first browser smoke test under `tests/e2e/`. The guarded test-user helper is prepared there, but it has not been run against Auth yet. The `test:e2e` script currently fails because Playwright is not installed. Desktop/mobile browser checks and successful Docker access remain pending.

## Local authentication setup

After the packages are installed, initialize Supabase if `supabase/config.toml` does not already exist:

```bash
npm run supabase -- init
```

The `supabase` npm script loads `.env.local` before invoking the installed CLI, so OAuth secrets can stay in that ignored file. In the existing `[auth]` section of `supabase/config.toml`, set `site_url` to `http://localhost:3000` and `additional_redirect_urls` to `["http://localhost:3000/auth/callback"]`.

Create the local GitHub OAuth app with homepage `http://localhost:3000` and callback `http://127.0.0.1:54321/auth/v1/callback`. Add its credentials to `.env.local` using the commented variable names in `.env.example`. Add or update this provider block without duplicating an existing block:

```toml
[auth.external.github]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET)"
redirect_uri = "http://127.0.0.1:54321/auth/v1/callback"
```

This follows the [Supabase local configuration guide](https://supabase.com/docs/guides/local-development/managing-config). Keep email signup enabled with confirmations disabled in the local `[auth.email]` configuration for the test-user fixture. The fixture uses unique random credentials, calls real local Auth, and rejects production execution, Vercel, and non-loopback URLs. It is outside application code and supplies no login bypass route.

Start the local stack, apply the new migration to the local database, run its tests, and generate types:

```bash
npm run supabase -- start
npm run supabase -- db reset
npm run supabase -- test db
npm run db:types
```

Copy the local Supabase URL and **publishable key** into `.env.local`; use no legacy `anon` or `service_role` key. Database types must come from the running database; no placeholder type file has been created. After this setup, the remaining work is to connect the SDK clients, session proxy, OAuth routes, protected layout, and browser tests.

The GitHub remote is [gabriel-wargha/programming-study-tracker](https://github.com/gabriel-wargha/programming-study-tracker). The owner initialized and pushed the first scaffold commit; the remaining changes still need a Conventional Commit and push. The agent's commit attempt was blocked from writing `.git/index.lock`. No deployment has been performed.
