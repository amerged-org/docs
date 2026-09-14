---
name: ohmyhost-manage-database
description: Read or update authorized ohmyho.st project data, inspect or change compute, and prepare Dev-to-Prod migrations. Use for explicit Dev/Prod SQL operations, database sizing, idle costs, shared data or schema promotion.
---

# Manage project data, compute and migrations

Read `project_context_get` and `database_compute_get` for the selected Dev or Prod environment. The compute tool reads metadata without waking the database; use its observation rather than inferring size from the plan.

| Profile          | Compute | RAM  | Sleep after idle |
| ---------------- | ------- | ---- | ---------------- |
| Free standard    | 0.25 CU | 1 GB | 1 minute         |
| Paid standard    | 0.5 CU  | 2 GB | 1 minute         |
| Paid performance | 1 CU    | 4 GB | 5 minutes        |

Performance costs 2.5 times Paid-standard database compute credits for the same active duration. Its longer idle window can add active time. Storage and retained history are billed separately. Avoid periodic SQL health checks that keep idle compute awake; explain the first-query cold start when discussing savings.

For a customer-requested resize, use `database_compute_set` with the explicit environment, `standard` or `performance`, confirmation and one idempotency key. Preserve existing authorization; explain any new cost or shared-environment effect before applying it. Poll its operation, then read actual compute again. A successful submission is not proof that resizing finished. Do not reset the database to resize it.

## Read and update data

Use the customer's existing CLI login or API token; new user tokens remain valid until revoked. Confirm the intended organization/project and explicitly select `dev` or `prod`. `OHMYHOST_ENVIRONMENT` selects the independent platform, while the tool's `environment` selects this project's data.

Read with `database_query` using `project_id`, `environment`, one SELECT/WITH statement and scalar parameters. Discover an unfamiliar schema first and prefer aggregates or the necessary selected rows over personal records. The limit is 100 rows and five seconds. Application RLS can filter results; an empty query is not proof that the database is empty. Use the authorized export workflow when the customer requests a full archive.

For a requested data change, review one parameterized INSERT, UPDATE or DELETE/upsert and the affected rows. Use `database_write` with the explicit environment, JSON `parameters`, one saved `idempotency_key` and `confirmed: true`. Existing authorization for that exact change is sufficient; resolve an ambiguous environment or scope before writing. The CLI reads the statement from a UTF-8 SQL file:

```sh
ohmyhost database write --project "$PROJECT_ID" --environment "$PROJECT_ENVIRONMENT" --statement-file "$SQL_FILE" --parameters-json "$PARAMETERS_JSON" --idempotency-key "$WRITE_REQUEST_KEY" --yes --json
```

`PROJECT_ENVIRONMENT` must be `dev` or `prod`. SQL parameters are data, never hosting tokens or passwords. Writes use the restricted database role and preserve application RLS; do not disable policies or alter roles to force a result. A shared placement affects both logical environments. Compute wakes and is metered normally; current credit grace and project Stop budgets apply.

Check receipt `state` and `error`, not only HTTP status: a failed receipt can use HTTP 200. `succeeded` returns the command and `affected_rows`, not records; fetch records separately. `running` means use `operation_get` with the returned ID. A single write permits at most 1,000 directly affected rows and five seconds; triggers/cascades may affect additional rows.

After a network uncertainty, retain the exact request and key. An existing same-key receipt observes the original attempt. On `database_write_outcome_unknown`, inspect the target data and retain the operation ID before deciding on another write; never automatically pick a new key or claim the transaction failed to commit. Do not save SQL parameters or rows in project context/feedback. Schema and role changes remain reviewed GitHub migrations.

[Database API examples](https://docs.ohmyho.st/database) explain CLI, MCP and REST usage.

## Dev and Prod data

Recommend isolated data for testing; the customer may select shared data to use one database. In shared mode, a size or schema change affects both environments. Do not treat a shared database as a disposable Dev copy.

Keep versioned migrations in the application's configured migration directory, named `YYYYMMDDHHMMSS_name.sql`. Prefer additive changes: add a nullable column, deploy compatible code, backfill existing rows, and only remove old data or tighten constraints in a separately reviewed migration. Test against representative existing records. Never promote a Dev dump over production data.

Use `promotion_plan` to review the artifact and migration effects, then `promotion_execute` within the requested scope. Verify the new application behavior and preservation of existing Prod records. Use `database_query` for explicitly selected Dev or Prod verification and `database_write` only for an authorized data change; both retain application RLS. Record the selected profile and data decision in project notes with the current version; use live compute for current status.
