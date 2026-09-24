---
name: ohmyhost-build-portable-app
description: Build or adapt a TypeScript Vite, TanStack Start, or Next.js application for the ohmyho.st runtime, including video playback and microphone access. Use for application feature work and source preparation; use the migration Skill for a customer-requested Supabase conversion.
---

# Build an app for ohmyho.st

Prepare the application's real capabilities, then verify them after deployment.

1. Inspect the selected repository and run `ohmyhost init --dry-run --json`. Preserve a valid existing `ohmyhost.yaml`, application root, egress rules, auth choice and migrations. Resolve the returned blockers and requirements rather than replacing the configuration with a reduced file.
2. Keep one exactly pinned package manager and its matching lockfile. Use the returned framework classification: verified, experimental or unsupported. Experimental means the normal build can proceed but the exact combination still needs application verification.
3. Read [the runtime contracts](references/stack-contracts.md) for the capabilities the app needs. Keep ordinary Next.js routes, native TanStack Start server functions, the returned Vite API companion contract, or a plain Worker module (`runtime.mode: functions`, `src/ohmyhost/worker.ts`). The service supplies its build adapter; do not add customer Wrangler/OpenNext configuration merely to host the app. Video, audio or microphone need the `_headers` opt-in from the contracts.
4. For managed Postgres, use the supported application database binding and versioned migrations. Reach it through `createPrivateDatabaseClient`; use bounded `withConnection` for interactive transactions. Keep network transfers, email and AI calls outside that connection scope. Prefer additive schema changes and preserve production records; use the database Skill for sizing or promotion questions.
5. Keep the application's own authentication provider. Better Auth and customer-owned WorkOS are the verified integrations; any other OAuth or OIDC provider is an ordinary application dependency with its own setup and runtime requirements and no completed support claim. Configure actual callback/logout URLs and server secrets, then test login, a protected route, reload and logout. A public app needs no auth provider. Detect actual Supabase capability usage before proposing a migration; an SDK declaration alone does not justify replacing it.
6. For sending or receiving email, follow [the mail workflow](references/mail.md): choose the customer domain explicitly, prepare and verify a signed application webhook before receiving, and store incoming mail in the customer database. Enable only the mail, files, functions and egress that the app uses. Use the current client/runtime libraries and let `init` report missing routes or capabilities. Do not remove a required feature just to obtain a successful build.
7. Run the application's relevant tests, typecheck and framework build. Prefer focused regressions for the changed behavior and real hosted capability checks; respect the customer's requested verification scope without adding a broad test program. Use the public deployment Skill to connect the workspace's GitHub installation once, link the selected commit, deliver environment secrets and verify the hosted app's required reads, writes and integrations.

Resolve hosted bindings and trusted configuration from the framework's actual request context. A localhost-only test runtime or a successful health endpoint does not establish production login, tenant setup or background processing. Follow the runtime reference for first-user bootstrap, private uploads and bounded scheduled work when the application needs them.

For first account setup, use **ohmyhost-get-started**. For publishing, use **ohmyhost-deploy-github**; [the CLI reference](references/cli-deploy.md) supplies detailed commands when needed. For a failed operation, use **ohmyhost-troubleshoot-deployment** and retain its original ID.

Report a suspected hosting bug with `feedback_submit` and a minimal redacted reproduction. Return a working application URL only after its required flows pass. Promotion, rollback and deletion follow the customer's requested scope; an ordinary deploy does not require deleting their app for a cleanup test.
