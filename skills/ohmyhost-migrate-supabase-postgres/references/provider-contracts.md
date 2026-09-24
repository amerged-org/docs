# Supabase conversion contracts

Use this reference when a detected Supabase capability needs a replacement. Keep each capability independently testable; a PostgreSQL import does not convert Auth, Functions, Storage, Realtime, or mail.

## Portable target

- The repository pins exactly one `npm`, `pnpm`, `yarn`, or `bun` version and commits exactly one matching frozen lockfile.
- Vite, TanStack Start, and Next.js remain framework-native. The service-owned build overlay pins OpenNext `1.20.6` and Wrangler `4.125.0`; customer source never commits those dependencies, generated configuration, `OHMYHOST_BASE_PATH`, or provider bindings.
- Preserve the compatibility result from init: `verified` is exact-fixture-proven, `experimental` is admitted with the same artifact validation, and `unsupported` stops.

## Database and Auth

- Replace Supabase database/PostgREST calls and browser SQL with authenticated same-origin use cases backed by `OHMYHOST_DATABASE`. Remove `@supabase/supabase-js` only when no deliberately retained customer-owned Supabase Auth or other approved capability still needs it. Retained external auth must be independently verified; SDK package evidence alone neither selects a managed database nor blocks hosting.
- The regional database service and Neon management are platform-private. Customer code receives only the scoped `OHMYHOST_DATABASE` binding, never a database URL or migration credentials.
- Convert RPCs to explicit transactions or reviewed PostgreSQL functions with fixed `search_path`, explicit authorization, idempotency, and concurrency tests.
- Canonical migrations are expand-only `YYYYMMDDHHMMSS_name.sql` files. A reviewed PostgreSQL schema-only dump may include `public` and app-owned `private`, never Supabase `auth` or `storage`.
- If the customer chooses the verified Better Auth conversion, it owns the new `auth` schema, UUID identities, verification/reset mail, host-only cookies, session revocation, and database sessions. Never recreate browser-controlled JWT GUCs or Supabase roles.

First-party references: [Supabase migration scope](https://supabase.com/docs/guides/platform/migrating-to-supabase/postgres), [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html), [Neon connection choices](https://neon.com/docs/connect/choose-connection), and [Better Auth PostgreSQL](https://better-auth.com/docs/adapters/postgresql).

## Functions, files, Realtime, and mail

- Move bounded request-local Edge Functions into authenticated same-origin Vite companion handlers, TanStack Start server routes, or Next.js route handlers. Declare scheduled work in `ohmyhost.yaml`; ohmyho.st owns Queue/Workflow delivery.
- Replace Supabase Storage calls with `@ohmyhost/customer-runtime/storage`. The Storage Gateway owns raw R2, signed access, quotas, receipts, and provider cleanup.
- Realtime is a typed unsupported blocker until a product contract exists. Do not simulate success or replace it with polling without an explicit product decision.
- Replace application mail selected for ohmyho.st with its runtime mail client and stdin-installed secret names. Preserve verification/reset mail handled by the customer's explicitly retained external auth provider.

## Baseline helper

Only after the customer chooses Better Auth and its server authorization/boundaries are implemented and reviewed, run:

```text
scripts/create-portable-baseline.mjs --input <dump> --output-directory <migrations> --migration-prefix <YYYYMMDDHHMMSS_slug> --auth-mode better-auth-uuid --authorization-mode server
```

The helper converts only `auth.users` and `auth.uid()`, replaces the service-request helper, reports omitted RLS policies, retains admitted app-private functions, and splits output under platform limits. Nonzero conversion/omission counts require review; they are never automatic approval.

## Completion

Delete only the superseded Supabase database clients/configuration, roles, grants, RLS/JWT helpers, Functions and Storage calls after replacement tests pass. Preserve any explicitly retained external authentication integration; do not treat a database move as an auth migration. Then rerun init and prove the generic service-owned build, managed database, public behavior, rollback, repeated deletion, and provider absence. A root HTTP `200` is not completion.
