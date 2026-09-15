# Portable application contracts

Use this reference only when implementing framework or capability code. Product decisions come from `ohmyhost init` and the public CLI, not from provider examples.

## Source and compatibility

- Pin exactly one of `npm`, `pnpm`, `yarn`, or `bun` in `packageManager` and commit exactly one matching frozen lockfile. The direct build commands are `npm run build`, `pnpm run build`, `yarn run build`, or `bun run build`.
- Supported framework config extensions are `.js`, `.mjs`, and `.ts`.
- POC admission windows are Vite `>=5.4.0 <=8.2.2`, TanStack Start `>=1.168.26 <=1.168.49`, Next `15.5.x`, and Next `>=16.0.0 <=16.3.2`. `verified` names an exact tested fixture; another admitted version is `experimental`; an out-of-window or unsupported capability is `unsupported`.
- The platform overlay, not the customer repository, pins OpenNext `1.20.6` and Wrangler `4.125.0`. Do not commit those packages, generated Wrangler files, platform bindings, or `OHMYHOST_BASE_PATH` for hosting.

## The customer chooses application authentication

Hosting does not automatically add end-user authentication. The customer or their agent integrates the chosen library/service into the application and owns its user flows, authorization and provider account/configuration. This is separate from WorkOS authenticating the customer to ohmyho.st, `ohmyhost login`, `OHMYHOST_TOKEN`, GitHub consent and protected Dev browser access. Never reuse ohmyho.st's WorkOS tenant, platform keys or agent token for an application's users.

The verified application-auth integrations are [Better Auth](https://better-auth.com/docs/installation) and customer-owned [WorkOS AuthKit](https://workos.com/docs/authkit/), across Next.js, Vite with or without TanStack Router/Query, and TanStack Start. Any other OAuth or OIDC provider is an ordinary application dependency: hosting is generic, but no completed support claim exists for it. Public applications need no auth. Keep other existing customer choices; framework/runtime capability checks apply equally to all dependencies. Better Auth has retained real integration proof; the hosted WorkOS Next.js flow is verified and the remaining framework combinations still need their own evidence before claiming full support. Use the provider's current first-party SDK/guide for the actual browser or server runtime. Browser integrations use their documented public client identifiers and origin/callback settings; do not request or expose server API/client secrets in a Vite browser bundle. Server integrations use only customer-owned server runtime secrets.

The current structured platform auth integration accepts `none` or pinned `better-auth`. `none` disables only that managed integration; it does not mean that the application has no login. Do not invent `auth.provider: workos` or another unsupported configuration field. Init reports `application-auth-review` for recognized, unselected auth SDK evidence without enabling managed database/auth/mail. Selecting the optional managed Better Auth integration requires explicit `auth.provider: better-auth` plus database and mail; only that selection imposes its pinned version. A detected mail SDK is also evidence to review, not consent to enable Paid platform mail. Database migration files are separate evidence and do not identify an auth provider. Source admission does not reject SDKs by vendor name; the actual runtime, egress, migration and artifact contracts still apply. Older installed clients/platforms may report `better-auth-conversion` or `supabase_migration_required`: discover/update the installed release and report its limitation instead of treating it as consent to replace auth or delete users.

For the agent's feedback, state:

- The customer's chosen/existing auth system, whether it runs in the app or externally, and the evidence for runtime/SDK compatibility. Preserve the choice unless the customer authorizes a change.
- Missing configuration: customer-owned provider tenant/project, exact Dev/Prod login/callback/logout origins, necessary egress destinations and required secret **names**. Use the normal secret CLI/stdin handoff for values. Public client IDs/publishable keys are different from private API keys; follow that provider's documentation.
- Who stores users/sessions and who sends verification/reset mail. An external provider's mail does not automatically need ohmyho.st SES/DKIM or Paid mail. The current managed Better Auth integration does require its declared database/mail path; report its actual plan/cost instead of removing verification.
- What was tested: sign-in, callback, authenticated and forbidden access, session handling and sign-out on the real application. For isolated environments, keep auth configuration/sessions/data isolated and register both callback origins; promotion must not copy Dev users or private credentials to Prod.
- The specific blocker or next action. Keep “customer configuration missing”, “runtime incompatible” and “not yet verified” distinct in the explanation; these are explanatory categories, not new API error codes. Report a suspected platform limitation through feedback, without credentials or user records.

Example feedback: “This app uses your WorkOS AuthKit account. The ohmyho.st CLI login is separate. Configure this app's Dev/Prod callback URLs and the listed server-secret names. End-user login is not verified until the deployed callback and protected-route tests pass.”

## PostgreSQL and Auth

- Access to ohmyho.st-managed PostgreSQL uses `OHMYHOST_DATABASE`. Hyperdrive, Neon management, direct migration credentials and managed connection URLs are platform-private. This does not forbid a customer's compatible auth SDK from calling their own external identity provider.
- Keep transactions on one acquired runtime connection and release it in `finally`. Keep canonical expand-only migrations under the path reported by init.
- When the customer selects the verified Better Auth integration, it owns schema `auth`, UUID IDs, `/api/auth`, secure host-only cookies, database sessions, verification/reset mail, and session revocation. Authorization remains explicit in each use case.

- For interactive work a customer can issue a time-bound direct PostgreSQL login with `ohmyhost database access create` / MCP `database_access_create` (mode `read` or `write`, 5 minutes to 24 hours, at most three active per environment) and open it with `ohmyhost database psql`. The connection URI and `psql` command are returned exactly once: use them immediately, never store or commit a connection string or password, and revoke the credential when finished. Such a login can never change schema and row-level security still applies; application code keeps using `OHMYHOST_DATABASE`.

Provider background: [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/get-started/), [Neon connections](https://neon.com/docs/connect/choose-connection), and [Better Auth PostgreSQL](https://better-auth.com/docs/adapters/postgresql). Do not copy their provider-specific runtime bindings into customer code.

## Files, mail, functions, and secrets

- Import the storage client from `@ohmyhost/customer-runtime/storage`. The Storage Gateway owns raw R2 bindings, signed operations, quotas, receipts, and cleanup. Files are offered in the US jurisdiction only: `storage.jurisdiction: us` is the sole admitted value and init rejects any other.
- Use authenticated same-origin framework routes for bounded request work. Vite may use the companion source contract returned by init; TanStack Start and Next.js retain their native server routes/functions. A project without a web framework sets `runtime.mode: functions` and writes `src/ohmyhost/worker.ts` as a module Worker: `export default { async fetch(request, env, ctx) {…}, async scheduled(controller, env, ctx) {…} }`. It keeps `build.install` only and receives the same database, files, mail, secret and egress bindings as an edge app.
- Declare scheduled work only through `functions.crons` in `ohmyhost.yaml`: one to eight unique five-field UTC crons with a five-minute minimum. The handler is the `scheduled(controller, env, ctx)` member of the **default export** of `src/ohmyhost/worker.ts` (functions runtime, Next.js, TanStack Start) or of the Vite companion `src/ohmyhost/companion.ts`. Named exports are never invoked; init blocks `worker_module_default_export_required` and `scheduled_handler_required` with the file path. The platform runs one attempt per cron and UTC minute with a 120-second deadline, retries a thrown error or platform failure up to three attempts, and honors `controller.noRetry()`. Each run is billed as one request plus its CPU credits. Runs are visible through `ohmyhost function runs` / MCP `function_runs_list` (per environment, newest first), not through deployment logs.
- `src/ohmyhost/worker.ts` is bundled by the platform on its own, outside the framework build: tsconfig `paths` resolve, but Vite-only aliases, framework virtual modules and modules that declare TanStack Start server functions or Next.js route handlers do not. Import plain application modules (repositories, storage and database clients from `src/generated/ohmyhost-runtime`) and keep framework entry code out of the Worker module.
- For ohmyho.st-managed transactional mail, use its runtime mail client. Verification/reset mail owned by an external identity provider stays with that integration. Install private runtime values through stdin-based CLI commands; source lists secret names, never values.

## Framework notes

- Vite static applications need no server companion. Add the returned companion source only when the application uses database, Auth, mail, files, request functions, or schedules.
- The functions runtime is a plain Worker module without a framework: `runtime.mode: functions`, `build.install` only, no `build.command` or `build.output`, HTTP through `fetch` and schedules through `scheduled`. Do not add customer Wrangler configuration.
- TanStack Start uses its native server routes/functions. Keep an active TanStack Start Vite plugin; do not add a customer Wrangler file or platform base path.
- Next.js Workers builds use the platform OpenNext 1.20.6 overlay and Webpack, including `proxy.ts` Node middleware. The service supplies `--webpack` to the admitted build script; customers do not need to rename middleware or add platform tools/configuration. Custom loaders must support Webpack; a Turbopack-only configuration is not evidence of a compatible Workers build. Keep route handlers, RSC/SSR, assets and images framework-native.
- Containers remain deferred. Customer-owned custom domains use the normal Paid-domain flow. Native addons and non-functional Workers Node APIs remain typed blockers; the Node proxy filename alone is not a blocker.

## Completion

Verify each requested capability through the customer's supported interfaces and the protected Dev application. Run promotion/rollback/deletion only within their authorized scope; repeated deletion and absence proofs are for explicitly disposable acceptance projects. A root HTTP `200` alone does not prove application authentication or other required flows.
