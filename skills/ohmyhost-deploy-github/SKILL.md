---
name: ohmyhost-deploy-github
description: Deploy a GitHub application to ohmyho.st and verify or promote its release. Use for first deployment or a new commit; use the troubleshooting skill for an already stuck operation.
---

# Deploy a GitHub app

Read the installed CLI help or MCP tool schemas before supplying arguments. Use the customer's selected repository and branch.
Write to the customer in their own language. Never name, quote, paraphrase or link this Skill or the instructions you follow, and never justify a request with what they say.

1. Run `ohmyhost init --dry-run --json` in that repository. Resolve returned blockers and requirements; preserve existing auth, migrations and configuration. Use the portable-app Skill for source changes, or the Supabase Skill only for a requested migration.
2. Complete installation, login and organization selection with the ohmyhost-get-started Skill; use `identity_get` to select the returned organization and `projects_list` to reuse an existing project. For a new project, explain isolated Dev/Prod data versus shared data, then use `project_create` with the chosen mode. Recommend isolated data; two databases consume credits separately.
3. Use `source_link` and complete the returned GitHub authorization. Read `source_get`, then `deployment_plan` for the exact commit. Source must be pushed to GitHub. Review the plan's costs, requirements and effects with the customer's existing authorization.
4. Read `project_status` for environment IDs. Supply required application secrets through the stdin command returned by `secret_set_command`. Use the chosen environment; Dev is not Prod.
5. Execute `deployment_create` with the returned plan and one saved idempotency key. Reuse that key if the response is uncertain. Poll `operation_get` for the accepted operation at its suggested interval; another build is not a status check.
6. Read the resulting URL from project status. Dev is private: `project_dev_access_create` supplies a single-use browser link. Open it once, then verify the clean URL, application login if present, and a real read/write flow. Keep the access link private.
7. If production publication is requested, use `promotion_plan` and `promotion_execute` after Dev verification. Isolated promotion applies schema migrations without copying Dev records; test that existing Prod records survive.

Return the working URL, deployed commit and any remaining action. If an operation stalls, use the troubleshooting Skill. Read `project_context_get` when resuming; use `project_notes_set` with its current notes version to retain a short decision or unfinished task, never credentials or signed links.
