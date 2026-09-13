---
name: ohmyhost-manage-database
description: Inspect or change ohmyho.st database compute and prepare safe Dev-to-Prod schema migrations. Use for database sizing, idle costs, shared versus isolated data, or promotion migrations.
---

# Manage database compute and migrations

Read `project_context_get` and `database_compute_get` for the selected Dev or Prod environment. The compute tool reads metadata without waking the database; use its observation rather than inferring size from the plan.

| Profile          | Compute | RAM  | Sleep after idle |
| ---------------- | ------- | ---- | ---------------- |
| Free standard    | 0.25 CU | 1 GB | 1 minute         |
| Paid standard    | 0.5 CU  | 2 GB | 2 minutes        |
| Paid performance | 1 CU    | 4 GB | 5 minutes        |

Performance costs 2.5 times Paid-standard database compute credits for the same active duration. Its longer idle window can add active time. Storage and retained history are billed separately. Avoid periodic SQL health checks that keep idle compute awake; explain the first-query cold start when discussing savings.

For a customer-requested resize, use `database_compute_set` with the explicit environment, `standard` or `performance`, confirmation and one idempotency key. Preserve existing authorization; explain any new cost or shared-environment effect before applying it. Poll its operation, then read actual compute again. A successful submission is not proof that resizing finished. Do not reset the database to resize it.

## Dev and Prod data

Recommend isolated data for testing; the customer may select shared data to use one database. In shared mode, a size or schema change affects both environments. Do not treat a shared database as a disposable Dev copy.

Keep versioned migrations in the application's configured migration directory, named `YYYYMMDDHHMMSS_name.sql`. Prefer additive changes: add a nullable column, deploy compatible code, backfill existing rows, and only remove old data or tighten constraints in a separately reviewed migration. Test against representative existing records. Never promote a Dev dump over production data.

Use `promotion_plan` to review the artifact and migration effects, then `promotion_execute` within the requested scope. Verify the new application behavior and preservation of existing Prod records. Read-only Dev checks can use `database_query`; it does not provide a Prod SQL console. Record the selected profile and data decision in project notes with the current version; use live compute for current status.
