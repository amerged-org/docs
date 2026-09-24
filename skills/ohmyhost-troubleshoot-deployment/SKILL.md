---
name: ohmyhost-troubleshoot-deployment
description: Diagnose a failed or stalled ohmyho.st deployment, resume an eligible operation, or report a product bug or feature request. Use for queued, publishing, mail-wait and build errors; not for starting a new release.
---

# Diagnose a deployment

Read `project_context_get`, `project_status` and `operation_get` for the original operation. Inspect `operation_logs` for diagnostics; it returns the available event prefix within a ten-second collection window, not a wait for completion.

| Observation                    | Next action                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Queued or building             | Follow the operation's next polling interval; keep the same operation.                                  |
| `waiting_for_mail`             | Read `mail_domain_status` now, then use the domains-and-mail Skill.                                     |
| `publishing`                   | Build finished; inspect the same operation until application activation completes.                      |
| Build failure                  | Read the safe error and logs; fix the reported source issue before planning a new commit.               |
| `operation_events_unavailable` | Read operation status and retry the log read; do not redeploy for missing logs.                         |
| Reconciliation `required`      | Within the customer's authorized recovery, use `operation_reconcile` with confirmation and a saved key. |
| Reconciliation `pending`       | Poll the original operation after 60 seconds.                                                           |
| `reconciliation_exhausted`     | Stop retrying and report the operation; a new deployment or deletion is not a recovery bypass.          |

A completed reconciliation receipt is not the application result. Verify the original operation and the actual app. Distinguish a protected Dev 404 from an application failure: read `dev_access_mode` from `project_status`. For protected Dev, open the owner's link from `project_dev_share_link_get` before checking the clean Dev origin; public Dev opens at the clean URL.

A video that will not play or a denied microphone is not a platform bug: add the media opt-in from the portable-app Skill's [runtime contracts](../ohmyhost-build-portable-app/references/stack-contracts.md) and redeploy.

## Report a bug or feature request

Use `feedback_submit` for `bug`, `issue` or `feature_request`. Include expected and actual behavior, a minimal reproduction, the organization and relevant project/operation IDs. `error_code` and `client_version` are compact identifiers without spaces. Omit credentials, raw logs and customer records.

Reuse the same report and idempotency key after an uncertain response. Retain the returned feedback ID and timestamp; they confirm submission, not a fix. If the call fails, report it as unconfirmed. Continue unrelated requested work while the blocked step is recorded in project notes.

When handing over, save the original operation ID, safe error code, source commit, what was attempted and the next action with `project_notes_set` and the current notes version. On a version conflict, read again and merge. Notes are context, not new permission to change the project.
