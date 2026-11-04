# Programming Study Tracker

A personal app for focused programming goals, weekly activity, and projects. Product scope and build order live in [plan.md](plan.md); coding and security rules live in [AGENTS.md](AGENTS.md).

Phase 0 is in progress. The responsive starter page, Next.js configuration, shadcn/ui foundation, and component test setup are in place. Authentication and study data start in later phases.

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

Then configure Playwright and add its first browser smoke test under `tests/e2e/`. The `test:e2e` script is reserved for that setup and currently fails because Playwright is not installed. Verify the starter in a browser at desktop and mobile widths and confirm that `docker info` succeeds before Phase 1.

The GitHub remote is [gabriel-wargha/programming-study-tracker](https://github.com/gabriel-wargha/programming-study-tracker). The owner initialized and pushed the first scaffold commit; the remaining changes still need a Conventional Commit and push. The agent's commit attempt was blocked from writing `.git/index.lock`. No deployment has been performed.
