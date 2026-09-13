---
name: ohmyhost-usage-and-budgets
description: Explain ohmyho.st measured usage, remaining credits and project spending limits. Use for cost reports, low-credit questions, budget changes or customer-requested billing actions.
---

# Explain usage and spending

Use `identity_get` to select the organization, then `organization_credits_get` and `organization_usage_get` for the requested month. Follow returned pagination. Read `project_budget_get` for a project-specific limit and `project_context_get` for current project actions.

Report the available balance, reserved credits, usage period and largest project/environment/meter costs. Distinguish posted consumption from reservations; delayed measurements are not zero usage. Explain quantities and credits together, for example database active time versus stored data. Reporting remains available at zero credits.

A wallet is shared across the organization. Paid feature access may come from a Stripe subscription or a Beta/manual grant; the latter does not create a paid subscription or another monthly allowance. Monthly credits expire, while remaining one-time signup/referral/top-up credits do not. Use `organization_account_get` or `ohmyhost credits account --organization "$ORGANIZATION_ID" --json` for the effective plan/source and credit-lot breakdown. A project budget is an optional limit, not another balance. For a requested limit change, use `project_budget_set` with its current schema and the customer’s authorization; read it back afterward. Do not change a budget merely to explain a report.

For database savings, use the database Skill: idle suspension stops compute charges but not storage charges. Read the wallet's grace expiry when credits are exhausted; do not promise that unfunded services run indefinitely. New work still needs the credits quoted by its plan.

## Purchases and invoices

Only start `billing_checkout_create` when the owner requested or approved that purchase. `paid` starts a subscription; `topup` purchases credits and does not extend a subscription. Complete the returned checkout, then verify `billing_checkout_get` and the wallet. A browser return is not payment confirmation.

Use `billing_portal_create` for invoice history, payment methods and subscription management. Every successful purchase, including a one-time top-up, has an invoice. If checkout is unavailable for the selected platform, report that response; never call a test payment a real purchase. Automatic recharge is not currently available.

Return a concise cost explanation and the requested next action. For a suspected incorrect charge, use `feedback_submit` with the period and safe receipt/error identifiers, without payment details or raw records.

The portal Usage page edits the same `project_budget_set` contract: no limit, or credits per UTC calendar month with continue/stop. Preserve the selected mode and read back changes. Existing work and delayed measurements may settle after reaching a limit. IDs in a copied project prompt identify context only; authenticate and check current scope before retrieving details.
