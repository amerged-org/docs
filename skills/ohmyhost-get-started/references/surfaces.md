# Every command and tool

The complete customer surface, generated from the shipped clients. A guide in this Skill set
explains when to use the common ones; this file exists so nothing is invisible. Discover the
installed contract with `ohmyhost --help --json` and MCP `tools/list` before using a name here,
and follow the returned schema rather than guessing arguments.

## CLI commands

- `ohmyhost init` — ohmyhost init [--directory PATH] [--root PATH] [--project SLUG] [--region us|eu] [--dry-run] --json (pass the project's hosting region so storage.jurisdiction matches it; us when omitted)
- `ohmyhost login` — ohmyhost login [--organization ULID] --json
- `ohmyhost logout` — ohmyhost logout [--revoke] --json
- `ohmyhost whoami` — ohmyhost whoami --json
- `ohmyhost github connect` — ohmyhost github connect --organization ULID --idempotency-key KEY --json (connect once, then link covered repositories without another browser consent)
- `ohmyhost github status` — ohmyhost github status --organization ULID --json
- `ohmyhost export create` — ohmyhost export create --project ULID --idempotency-key KEY --stdin --json (password on stdin only; one accepted SQL ZIP per project per 24 hours)
- `ohmyhost export get` — ohmyhost export get EXPORT_ULID --project ULID --json (poll the original job; signed ZIP download lasts 24 hours)
- `ohmyhost credits account` — ohmyhost credits account --organization ULID --json
- `ohmyhost credits balance` — ohmyhost credits balance --organization ULID --json
- `ohmyhost billing recharge get` — ohmyhost billing recharge get --organization ULID --json
- `ohmyhost billing recharge set` — ohmyhost billing recharge set --organization ULID --enabled true|false --monthly-limit-minor CENTS --revision N --idempotency-key KEY [--consent off_session_v1] --json (explicit Owner consent required before enabling)
- `ohmyhost billing checkout` — ohmyhost billing checkout --organization ULID --offer topup|paid [--packs 1] --idempotency-key KEY --json (returns a human payment URL; never auto-pays)
- `ohmyhost billing status` — ohmyhost billing status --organization ULID --checkout ULID --json
- `ohmyhost billing portal` — ohmyhost billing portal --organization ULID --json (short-lived human URL; request fresh after expiry)
- `ohmyhost credits usage` — ohmyhost credits usage --organization ULID --month YYYY-MM [--cursor ULID] --json
- `ohmyhost budget get` — ohmyhost budget get --project ULID --json
- `ohmyhost budget set` — ohmyhost budget set --project ULID --credits NUMBER|none [--mode continue|stop] --idempotency-key KEY --json
- `ohmyhost organization create` — ohmyhost organization create --name NAME --idempotency-key KEY [--source SOURCE] --json (SOURCE is optional attribution from a link's r value; the new workspace is selected immediately)
- `ohmyhost organization list` — ohmyhost organization list --json (the workspaces you belong to and the selected one)
- `ohmyhost organization use` — ohmyhost organization use --organization ULID --json
- `ohmyhost operation get` — ohmyhost operation get OPERATION_ULID --json
- `ohmyhost operation reconcile` — ohmyhost operation reconcile OPERATION_ULID --idempotency-key KEY --yes --json
- `ohmyhost token create` — ohmyhost token create --organization ULID --name NAME --idempotency-key KEY --out .env.local --json
- `ohmyhost token list` — ohmyhost token list --organization ULID [--after KEY_ID] --json
- `ohmyhost token revoke` — ohmyhost token revoke --organization ULID --key KEY_ID --yes --json
- `ohmyhost feedback submit` — ohmyhost feedback submit --organization ULID --kind bug|issue|feature_request --title TITLE --description REDACTED_REPORT [--project ULID] [--environment ULID] [--operation ULID] [--error-code CODE] [--client-version VERSION] --idempotency-key KEY --json
- `ohmyhost project create` — ohmyhost project create --organization ULID --name NAME [--data-mode shared|isolated] [--region us|eu] --idempotency-key KEY --json (the region is chosen once: us is the default, eu places the database, files and builds in the EU; it cannot be changed later)
- `ohmyhost project list` — ohmyhost project list [--cursor ULID] [--limit LIMIT] --json
- `ohmyhost project context` — ohmyhost project context --project ULID --json
- `ohmyhost project notes set` — ohmyhost project notes set --project ULID --version NUMBER --markdown TEXT --idempotency-key KEY --json (no credentials or signed URLs)
- `ohmyhost project status` — ohmyhost project status --project ULID --json
- `ohmyhost project dev-access create` — ohmyhost project dev-access create --project ULID --json
- `ohmyhost project handle check` — ohmyhost project handle check --handle HANDLE --json (is this address free? answers with a reason and free alternatives; the address becomes HANDLE.check.omh.st)
- `ohmyhost database compute set` — ohmyhost database compute set --project ULID --environment dev|prod --profile standard|performance --idempotency-key KEY --yes [--wait] --json

- `ohmyhost database compute get` — ohmyhost database compute get --project ULID [--environment dev|prod] --json
- `ohmyhost database write` — ohmyhost database write --project ULID --environment dev|prod --statement-file PATH --idempotency-key KEY [--parameters-json JSON] --yes --json
- `ohmyhost database query` — ohmyhost database query --project ULID --environment dev|prod --statement SQL [--parameters-json JSON] --json
- `ohmyhost database access create` — ohmyhost database access create --project ULID --environment dev|prod [--mode read|write] [--ttl 5m|1h|24h|SECONDS] [--label TEXT] --yes --json

- `ohmyhost database access list` — ohmyhost database access list --project ULID [--environment dev|prod] --json
- `ohmyhost database access revoke` — ohmyhost database access revoke --project ULID --access ULID --yes --json
- `ohmyhost database psql` — ohmyhost database psql --project ULID --environment dev|prod [--mode read|write] [--ttl 5m|1h|24h|SECONDS] [--json] (starts local psql with a temporary credential and revokes it on exit)
- `ohmyhost link` — ohmyhost link --project ULID --repository-owner OWNER --repository-name REPOSITORY --idempotency-key KEY --json (uses the workspace GitHub connection and waits for the source-link operation)
- `ohmyhost source auto-deploy set` — ohmyhost source auto-deploy set --project ULID --branch BRANCH --enabled true|false --idempotency-key KEY --json
- `ohmyhost source auto-deploy status` — ohmyhost source auto-deploy status --project ULID --json
- `ohmyhost domain cloudflare authorize` — ohmyhost domain cloudflare authorize --project ULID --zone ZONE --idempotency-key KEY --json
- `ohmyhost domain cloudflare status` — ohmyhost domain cloudflare status --project ULID --json
- `ohmyhost domain cloudflare apply` — ohmyhost domain cloudflare apply --project ULID --idempotency-key KEY --yes --wait --json
- `ohmyhost domain paid plan` — ohmyhost domain paid plan --project ULID --hostname HOST --json
- `ohmyhost domain paid apply` — ohmyhost domain paid apply --project ULID --hostname HOST --idempotency-key KEY --yes --json
- `ohmyhost domain paid status` — ohmyhost domain paid status --project ULID --json
- `ohmyhost domain paid delete` — ohmyhost domain paid delete --project ULID --hostname HOST --idempotency-key KEY --yes --json
- `ohmyhost plan` — ohmyhost plan --project ULID --commit SHA --json
- `ohmyhost deploy` — ohmyhost deploy --project ULID --plan-id ULID --idempotency-key KEY --yes [--wait] --json
- `ohmyhost logs` — ohmyhost logs OPERATION_ULID --follow --json
- `ohmyhost deployment logs` — ohmyhost deployment logs --project ULID --deployment ULID --follow --json
- `ohmyhost rollback plan` — ohmyhost rollback plan --project ULID --deployment DEPLOYMENT_ULID --json
- `ohmyhost rollback` — ohmyhost rollback --project ULID --deployment DEPLOYMENT_ULID --if-match ETAG --confirmation-token TOKEN --idempotency-key KEY --yes --json
- `ohmyhost deployment promote plan` — ohmyhost deployment promote plan --project ULID --deployment DEV_DEPLOYMENT_ULID --json
- `ohmyhost deployment promote` — ohmyhost deployment promote --project ULID --deployment DEV_DEPLOYMENT_ULID --if-match ETAG --confirmation-token TOKEN --idempotency-key KEY --yes [--wait] --json
- `ohmyhost delete plan` — ohmyhost delete plan --project ULID --json
- `ohmyhost delete` — ohmyhost delete --project ULID --if-match ETAG --confirmation-token TOKEN --idempotency-key KEY --yes --json
- `ohmyhost secret list` — ohmyhost secret list --project ULID --environment ENVIRONMENT_ULID --json
- `ohmyhost function runs` — ohmyhost function runs --project ULID --environment ENVIRONMENT_ULID [--limit 1-100] --json
- `ohmyhost secret set` — printf '%s' "$SECRET_VALUE" | ohmyhost secret set NAME --project ULID --environment ENVIRONMENT_ULID --idempotency-key KEY --stdin [--wait] --json
- `ohmyhost secret delete` — ohmyhost secret delete NAME --project ULID --environment ENVIRONMENT_ULID --idempotency-key KEY [--wait] --json
- `ohmyhost mail domain set` — ohmyhost mail domain set --project ULID --domain DOMAIN --idempotency-key KEY --json
- `ohmyhost mail domain status` — ohmyhost mail domain status --project ULID --json

## MCP tools

- `database_compute_get` — Read current managed database size, memory, region and compute state without running SQL or waking the database.
- `database_compute_set` — Select standard or performance compute for an existing database: Free 0.25 CU/1 GB/60-second idle suspension, Paid 0.5 CU/2 GB/60-second idle suspension.
- `project_context_get` — Read fresh project status, DNS/mail next actions, authorized usage and bounded shared notes.
- `project_notes_set` — Save shared project to-dos, at most 250 lines / 16384 UTF-8 bytes.
- `domain_cloudflare_authorize` — Check domain_cloudflare_status first and reuse a valid matching grant.
- `domain_cloudflare_status` — Read the project's customer DNS authorization state, zone, scopes and expiry without credentials.
- `domain_paid_plan` — Plan a customer-owned production hostname and return the manual CNAME/validation instructions.
- `domain_paid_apply` — Activate the explicitly requested customer hostname.
- `domain_paid_status` — Read DNS/TLS and effective Paid-domain access.
- `domain_paid_delete` — Delete only the explicitly named project's stored customer hostname/route and owned DNS records.
- `billing_checkout_create` — Owner-only: create or resume a hosted Checkout.
- `billing_checkout_get` — Owner-only: observe the original checkout and reconcile confirmed credits/refunds, without another purchase.
- `billing_recharge_get` — Owner-only: read auto-recharge consent, spending limit and payment handoff.
- `billing_recharge_configure` — Owner-only: enable or disable automatic off-session payments.
- `billing_portal_create` — Owner-only: return a short-lived Stripe portal URL to the human for invoices, payment methods or cancellation at period end.
- `project_export_create` — Owner-only: request an asynchronous password-encrypted SQL ZIP, including at zero credits.
- `project_export_get` — Owner-only: read the original SQL ZIP export's progress/error and verified download URL.
- `organization_usage_get` — Read posted UTC-month usage by project, environment and published meter/rate.
- `organization_account_get` — Owner-only: read the effective Free/Paid plan, its Stripe/Beta/manual source, available monthly and non-expiring one-time credits, reservations and next expiry.
- `organization_credits_get` — Read the owner's shared organization credit pool, seven-day grace_started_at/grace_expires_at and published rate_cards.
- `project_budget_get` — Read the owner's project UTC-month budget, measured usage and open reservations.
- `project_budget_set` — Set an owner's optional monthly project budget in microcredits (1000000 = one credit).
- `organization_create` — Create an organization owned by the signed-in user and select it for this machine.
- `organization_list` — List the workspaces the signed-in user belongs to and which one this machine currently uses.
- `organization_use` — Select one workspace for this machine's stored login, so later calls act inside it.
- `database_query` — Read one owner-authorized Dev or Prod database query (at most 100 rows, five-second timeout).
- `database_write` — Execute one explicitly authorized INSERT, UPDATE or DELETE/upsert in the chosen Dev or Prod database.
- `database_access_create` — Issue a time-bound PostgreSQL credential for this project's own Dev or Prod database.
- `database_access_list` — List this project's issued database credentials with their state (active, expired or revoked).
- `database_access_revoke` — Revoke one issued database credential immediately: open sessions end and its PostgreSQL role is removed.
- `promotion_plan` — Plan promotion of the current Dev artifact to Prod without a rebuild.
- `promotion_execute` — Execute an explicitly confirmed Dev-to-Prod promotion using the unchanged plan guards.
- `token_create` — Create your own non-expiring API token after interactive login and save it to the selected private env file.
- `tokens_list` — List your token metadata after interactive login.
- `token_revoke` — Revoke one of your own API tokens after explicit confirmation and interactive login.
- `identity_get` — Get the current ohmyho.st customer/agent identity.
- `project_handle_check` — Check whether a project address is free before offering it to the customer.
- `projects_list` — List projects visible to the current identity
- `feedback_submit` — Report a bug, suspected issue or feature request to ohmyho.st.
- `project_create` — Create an ohmyho.st project.
- `project_get` — Get one project
- `project_status` — Get source, both Dev/Prod environment IDs, deployment URLs, latest operation and cleanup status.
- `project_dev_access_create` — Create an owner-only ten-minute single-use access link for the protected Dev app.
- `github_connect` — Owner or Admin: connect GitHub once for this workspace.
- `github_status` — Read this workspace's GitHub connection.
- `source_link` — Link a repository covered by the workspace GitHub connection.
- `source_get` — Get linked source status
- `deployment_plan` — Plan an immutable deployment.
- `deployment_create` — Start a reviewed deployment plan
- `deployments_list` — List project deployments
- `deployment_get` — Get one deployment
- `deployment_logs` — List the newest normalized diagnostics of one deployment (build, control, runtime and function failures with catalog codes).
- `operation_get` — Get durable operation status and current deployment progress/reconciliation guidance.
- `operation_logs` — Read available operation events for at most ten seconds, stopping earlier at max_events or a terminal event.
- `function_runs_list` — List the newest scheduled function runs (functions.crons) of an environment: one run per due UTC minute with state, attempt, the status the scheduled handler returned and timing.
- `operation_reconcile` — Start an explicitly confirmed provider reconciliation attempt
- `mail_domain_set` — Configure the canonical transactional-mail sender domain.
- `mail_domain_status` — Read sender DNS/DKIM verification.
- `secrets_list` — List secret metadata without values
- `secret_delete` — Delete an environment secret
- `secret_set_command` — Return the stdin-only CLI command for setting a secret; the value never enters MCP.
- `rollback_plan` — Plan a rollback
- `rollback_execute` — Execute a reviewed rollback
- `delete_plan` — Plan complete project deletion
- `delete_execute` — Execute a reviewed project deletion

The REST contract behind both is published at <https://ohmyho.st/api> and mirrored per release;
every command and tool above is one of its operations.
