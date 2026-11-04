# AGENTS.md

## Project

Programming Study Tracker is a personal web app for organizing programming study. The owner creates small goals under topics, logs what they did each week, and links the projects they built.

`plan.md` defines the scope, product rules, data model, screens, and build order. Read it before starting work.

**Current status:** Planning is complete, and no app code exists yet. Start with Phase 0 in `plan.md`.

## Stack

- Next.js 16 with the App Router and TypeScript in strict mode
- Tailwind CSS and shadcn/ui
- Supabase for PostgreSQL and Auth, with GitHub login
- `@supabase/supabase-js` and `@supabase/ssr`
- Zod for input validation
- Vitest and Testing Library for unit and component tests
- Playwright for end-to-end tests
- npm as the package manager
- Vercel for hosting
- Node.js 20.9 or later

Do not change the stack or add a major dependency without asking the owner.

## Commands

These commands are available after Phase 0.

```bash
npm run dev                  # Start the app locally
npm run lint                 # Run ESLint
npm run typecheck            # Run tsc --noEmit
npm test                     # Run unit and component tests
npm run test:e2e             # Run Playwright tests
npm run build                # Create a production build

npx supabase start           # Start local Supabase (requires Docker)
npx supabase db reset        # Rebuild the local database from migrations
npx supabase test db         # Run database and RLS tests
npx supabase migration new <name>
npx supabase gen types typescript --local > src/types/database.ts
```

## Project structure

```text
src/
  app/                  Routes, layouts, and Route Handlers
  components/ui/        Shared shadcn/ui components
  features/<feature>/
    actions.ts          Server Actions
    queries.ts          Server-side reads
    schemas.ts          Zod schemas
    components/         Feature components
    *.test.ts(x)        Tests beside the code they cover
  lib/dates/            Week and date helpers
  lib/github/           GitHub API client
  lib/supabase/         Browser, server, and proxy clients
  types/database.ts     Generated database types
  proxy.ts              Session refresh and login redirects
supabase/
  migrations/           SQL migrations
  tests/                Database and RLS tests
tests/e2e/              Playwright tests
```

## Coding rules

- Before Next.js work, read the relevant guide in `node_modules/next/dist/docs/`. Do not rely on memory for framework APIs.
- Use `proxy.ts`, not `middleware.ts`.
- Use Server Components by default. Add `"use client"` only when a component needs browser interactivity.
- Read data in `queries.ts`. Change data in Server Actions.
- Use Route Handlers only when a URL endpoint is required, such as the OAuth callback.
- Validate every Server Action input with Zod.
- Return `{ ok: true, data }` or `{ ok: false, error }` from Server Actions for expected failures.
- Revalidate the affected routes after a successful change.
- Do not use `any`. Use the generated database types.
- Use kebab-case for file names and PascalCase for React components.
- Use the helpers in `src/lib/dates` for week calculations.
- Store activity dates as PostgreSQL `date` values, not timestamps.
- Give every form visible labels, validation messages, and a pending state.
- Give every list an empty state.
- Make all features usable with a keyboard. Do not use color as the only signal.

## Security rules

- `proxy.ts` is not enough to protect the app. Check the signed-in user in every protected page, query, and Server Action.
- Use `supabase.auth.getClaims()` for server-side user checks. Never trust `supabase.auth.getSession()` in server code.
- Take `user_id` from the verified session. Never accept it from the browser.
- Use the Supabase publishable key. Do not use the legacy `anon` or `service_role` keys.
- Do not use a Supabase secret key in app code unless `plan.md` is updated first and the owner approves it.
- Keep secrets in `.env.local` and Vercel environment variables. Never commit them.
- Keep `.env.example` in Git with placeholder values only.
- `GITHUB_TOKEN` must stay on the server. Never prefix it with `NEXT_PUBLIC_`.
- Allow only `https` URLs for repositories, live sites, and resources.
- Never show private study data on the public portfolio page. See section 8 of `plan.md`.

## Database rules

- Put every schema change in a new file in `supabase/migrations/`.
- Never edit a migration that has been committed or applied outside your local database.
- Enable Row Level Security (RLS) in the same migration that creates a table.
- Give every owned table a `user_id` column.
- Use owner-only RLS policies based on `auth.uid() = user_id`.
- Use composite foreign keys so a row can reference only rows owned by the same user.
- Create views with `security_invoker = true`.
- Set a fixed `search_path` on every `SECURITY DEFINER` function.
- Regenerate `src/types/database.ts` after every schema change.

## Scope limits

Do not build these features:

- Weekly reflection prompts, including "What did I learn?", "What confused me?", and "What's my next step?"
- AI quizzes or any other AI feature
- Team, social, or payment features
- Native mobile apps

Add new ideas to "Ideas for later" in `plan.md` instead of building them.

## Workflow

- Follow the phases in `plan.md` in order, one task at a time.
- Tick a task only after you have verified it.
- Record important decisions in the decision log in `plan.md`.
- Use small commits with Conventional Commit prefixes: `feat:`, `fix:`, `test:`, `docs:`, and `chore:`.
- Ask the owner when a requirement is unclear and the wrong choice would be hard to reverse.

Get the owner's approval before you:

- Deploy to production
- Change a production database
- Delete data
- Add a paid service
- Change the stack
- Force-push to a shared branch

## Before finishing a task

Run these checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Also complete the checks that apply to your change:

- **UI change:** Test it in a browser at desktop and mobile widths.
- **Schema change:** Run `npx supabase db reset` and `npx supabase test db`.
- **New table:** Add an RLS test proving that one user cannot read or change another user's rows.
- **Main user flow change:** Run `npm run test:e2e`.

Finish by reporting what changed, what you tested, and anything that remains unfinished.
