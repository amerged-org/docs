---
name: ohmyhost-domains-and-mail
description: Connect a custom domain or transactional email to ohmyho.st, provide manual DNS records, and check DNS, HTTPS or DKIM readiness. Use when a hostname or sender is being configured or is pending.
---

# Connect domains and email

Start with `project_context_get`, `domain_paid_status` and, when email is relevant, `mail_domain_status`. Read the current tool schemas. A Free project already has a hosting address; a custom domain and managed transactional mail require Paid access.

## Website domain

Use `domain_paid_plan` for the requested hostname, review its effects, then `domain_paid_apply` with confirmation and a saved idempotency key. Keep that key for uncertain responses and the same hostname reconciliation.

The complete Cloudflare sequence is **Paid plan → Paid apply → Cloudflare authorize → Cloudflare status → repeat the same Paid apply → Paid status**. The initial apply establishes the project's hostname/zone and may return manual records. Authorization before a matching domain is declared returns `cloudflare_zone_not_bound`; this needs the missing domain step, not another OAuth attempt.

We prefer Cloudflare-hosted DNS. If the customer uses it, offer `domain_cloudflare_authorize` for the actual zone. The customer opens the returned authorization link; read `domain_cloudflare_status` afterward, then repeat the original apply to set the records. Do not move the customer's DNS provider merely to connect a domain.

For another DNS provider, present the exact returned record type, name, value and TTL as a table. Explain where to enter them. Preserve unrelated records and mailbox MX. Use `domain_paid_status` to check HTTPS and routing; authorization alone does not mean the hostname is ready.

Once the final hostname is ready, update the application's trusted public origin and provider callback/logout URLs through its normal configuration. Check login and one protected action at that hostname; working DNS does not establish working sessions. Host-only cookies may require a fresh login after the domain changes. Do not broaden cookie domains or trust arbitrary request hosts to hide an origin mismatch.

## Transactional email

Use `mail_domain_set` for the customer's chosen sender domain. Present the returned records exactly; sender delegation currently uses four NS records with TTL 300 on the sender subdomain. Do not replace the organization's mailbox records.

Read `mail_domain_status`: use `observed_at` and `verification_issue` to distinguish pending verification from an incorrect configuration. If it reports a missing tenant association, inspect the existing operation rather than editing DNS. Sender verification alone does not prove successful email delivery; verify a real application send and receipt when mail is required.

## Waiting and resuming

Follow `next_check_after_seconds`; while DNS/DKIM/TLS is pending, tell the customer to ask their agent to check again after 60 minutes. This instruction does not schedule an automatic wake-up. If the customer already authorized a supported scheduler, it may perform the check.

Record the hostname, pending action, last observation and next check in project notes using the current version. Keep reading the original deployment operation while mail verification waits; do not start another build. Report a suspected product failure using the troubleshooting Skill.
