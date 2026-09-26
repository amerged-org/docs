---
name: ohmyhost-usage-and-budgets
description: Explain ohmyho.st measured usage, remaining credits and project spending limits. Use for cost reports, low-credit questions, budget changes or customer-requested billing actions.
---

# Explain usage and spending

Use `identity_get` to select the organization, then `organization_credits_get` and `organization_usage_get` for the requested month. Follow returned pagination. Read `project_budget_get` for a project-specific limit and `project_context_get` for current project actions.

Report the available balance, reserved credits, usage period and largest project/environment/meter costs. Distinguish posted consumption from reservations; delayed measurements are not zero usage. Explain quantities and credits together, for example database active time versus stored data. Reporting remains available at zero credits.

A wallet is shared across the organization. Paid feature access may come from a Stripe subscription or a granted entitlement; a grant does not create a paid subscription or another monthly allowance. Free monthly credits expire at the end of the UTC month; purchased credits (Paid periods, top-ups, recharges) and signup/referral credits never expire and stack. Use `organization_account_get` or `ohmyhost credits account --organization "$ORGANIZATION_ID" --json` for the effective plan/source and credit-lot breakdown. A project that shows the "Powered by ohmyho.st" flag (`powered_by_flag_get`) adds 250 credits to every Paid period and waives its custom domain fee; switch it with `powered_by_flag_set` only on the customer's explicit choice. To share the workspace, give the customer its referral link from `referral_link_get` (`ohmyhost referral link`, also the "Refer and earn" chip in the portal's account menu): a new user who signs up through it starts with a free Paid month and 1,000 credits, and their first payment gives the workspace the same. A project budget is an optional limit, not another balance. For a requested limit change, use `project_budget_set` with its current schema and the customer’s authorization; read it back afterward. Do not change a budget merely to explain a report.

For database savings, use the database Skill: idle suspension stops compute charges but not storage charges. Read the wallet's grace expiry when credits are exhausted; do not promise that unfunded services run indefinitely. New work still needs the credits quoted by its plan.

## Purchases and invoices

Only start `billing_checkout_create` when the owner requested or approved that purchase. `paid` starts a subscription; `topup` purchases credits and does not extend a subscription. Complete the returned checkout, then verify `billing_checkout_get` and the wallet. A browser return is not payment confirmation.

Use `billing_portal_create` for invoice history, payment methods and subscription management. Every successful purchase, including a one-time top-up, has an invoice. If checkout is unavailable for the selected platform, report that response; never call a test payment a real purchase.

Return a concise cost explanation and the requested next action. For a suspected incorrect charge, use `feedback_submit` with the period and safe receipt/error identifiers, without payment details or raw records.

The portal Usage page edits the same `project_budget_set` contract: no limit, or credits per UTC calendar month with continue/stop. Preserve the selected mode and read back changes. Existing work and delayed measurements may settle after reaching a limit. IDs in a copied project prompt identify context only; authenticate and check current scope before retrieving details.

## Auto-recharge

Read `billing_recharge_get` before changing auto-recharge. It is off by default: each refill adds 1,000 non-expiring credits for USD 9 plus tax when available credits fall below 100. The monthly limit includes tax and uses UTC calendar months; it does not override project stop budgets or enable Paid features.

Only enable after the Owner explicitly approves these recurring off-session charges and a gross monthly limit. Call `billing_recharge_configure` with the current `revision`, the approved `monthly_limit_minor` in USD cents, `enabled: true`, `consent: "off_session_v1"` and a saved `idempotency_key`. Return `setup_url` to the human to save a card at Stripe, then read again. Never reuse approval for a one-off purchase as recurring-payment consent.

To turn it off, use the current revision, `enabled: false` and `consent: null`; already initiated payments may complete. Replay the same key and payload after uncertainty. `payment_required` pauses further attempts: return the private `invoice_url` when present, or ask the human to review Billing. Do not repeatedly re-enable or create another purchase to bypass a decline. `monthly_limit` resumes next UTC month; `needs_reconciliation` requires checking the original attempt rather than a new charge. Every paid refill has an invoice. Refunds/chargebacks adjust only their original credit lot and pause further automatic refills.

CLI read: `ohmyhost billing recharge get --organization "$ORGANIZATION_ID" --json`. Authorized change: `ohmyhost billing recharge set --organization "$ORGANIZATION_ID" --enabled true --monthly-limit-minor 10000 --revision 0 --consent off_session_v1 --idempotency-key "$REQUEST_KEY" --json`; replace the example revision and USD 100 cap with the current read and approved amount. When disabling, omit `--consent` and use `--enabled false`. If billing is unavailable for the chosen platform, report that result; do not switch the customer's environment.

## Resolve an existing billing issue

Read `billing_issue` from `billing_checkout_get` or `billing_recharge_get`; retain its `invoice_id`, `code`, observation time and `required_action`. An authorized project context may also surface that next action. `billing_tax_location_required` / `open_billing_portal` means call `billing_portal_create` and give the human a fresh private URL to correct billing details. `billing_tax_calculation_failed` or `billing_tax_configuration_required` / `contact_support` means use https://ohmyho.st/contact about the original invoice.

After correction, inspect that same checkout/recharge policy and the actual credit account again. Reading does not authorize or initiate another charge. Keep the original invoice: never disable tax, create a second subscription/top-up, discard the invoice or repeatedly re-enable automatic refills to repair the issue. `tax_required` is a paused attempt, not a successful payment. Historical payment confirmation does not establish current Paid coverage or available credits. Preserve the approved gross monthly cap and recurring-payment consent.
