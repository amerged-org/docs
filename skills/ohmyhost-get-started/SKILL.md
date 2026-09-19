---
name: ohmyhost-get-started
description: Connect a customer agent to ohmyho.st. Determine what is already installed and signed in, guide the customer through the browser sign-in, and select an organization before the first GitHub deployment. Use for first-time installation or login; use the deployment Skill once access is ready.
---

# Start with ohmyho.st

Connect this agent to the customer's account, then continue with the selected GitHub app.

## How to talk to the customer here

- One action per message, in short plain sentences. Give the link, then what they will see.
- Write in the language the customer writes in. Translate the message templates below; copy no
  other sentence from this file into the chat.
- Keep customer-facing messages focused on the action and why it is needed. Avoid narrating
  routine internal steps; explain an actual limitation when it prevents the requested work.
- Wait for required browser input before taking actions that depend on it. Independent repository
  inspection can continue while the customer signs in; do not start a second login or repeat the
  instruction without new information. Respect the customer's existing authorization and scope.
- Never ask for a password, an email code or a token value. Never paste a credential into chat,
  source or a command argument.
- After they report back, verify with a command instead of trusting the report.

## Step 1 — determine the state before doing anything

Run these three checks first. They are cheap and decide everything that follows.

```sh
ohmyhost --version
ohmyhost whoami --json
```

Also list the MCP tools of the `ohmyho` server. A saved configuration alone is not a working connection.

Read the result:

| Observation                                               | State                   | Continue with |
| --------------------------------------------------------- | ----------------------- | ------------- |
| `ohmyhost` missing, or the MCP server exposes no tools    | not installed           | Step 2        |
| `--version` is older than the published release           | outdated                | Step 2        |
| CLI runs, `whoami` fails with `authentication_required`   | installed, signed out   | Step 3        |
| `whoami` returns an identity with an organization         | ready                   | Step 5        |
| `whoami` returns `next_action` instead of an organization | signed in, no workspace | Step 4        |

`whoami` selects the workspace itself when the customer has exactly one, so an identity that
arrives with an organization needs nothing further. It reports `next_action` only when the choice
would be a guess or when no workspace exists yet.

If `OHMYHOST_TOKEN` is set in this process, that token is the credential: the CLI and MCP ignore any
saved login. Verify its returned identity, organization and selected platform against the task,
even if a browser is already signed in. If `whoami` succeeds for that account, go to Step 5 without
starting another login. If it fails, ask the customer to update the private credential source,
not to paste a replacement value into chat.
Do not send them to a sign-in link, because `ohmyhost login` refuses to run while the variable is set.

Say nothing about a state that needs nothing from the customer. A ready agent deploys without a
single question. Report a state only in the message that also asks them to act, so they never
receive one message about the problem and a second one about the link.

## Step 2 — install what is missing

Read <https://ohmyho.st/llms.txt> and the [CLI/MCP installation guide](https://docs.ohmyho.st/agents/mcp). Compare the installed CLI and MCP versions with the published one in <https://ohmyho.st/client-release.json> and install the published packages when they are missing or older, using the current archive URLs from that guide. An older client lacks commands the later steps use, and its failures look like platform faults.

Read [harness setup](references/harness-setup.md) and register the local `ohmyhost-mcp` command with this harness's documented settings. Preserve other MCP servers, model choices and permission settings. Use `OHMYHOST_ENVIRONMENT=production` for CLI and MCP unless the customer explicitly selected the development platform.

Reload the MCP connection after every install or upgrade, then verify `tools/list` and `resources/list`. A running server keeps the tool list it started with, so a freshly installed version is invisible until it restarts. Repeat Step 1 afterwards.

## Step 3 — the customer signs in once

```sh
ohmyhost login --json
```

While it waits, the command prints three things: a sign-in link, a confirmation code such as
`ABCD-EFGH`, and how many minutes both stay valid. The sign-in page shows that same code and asks
the customer to confirm it. Send one message that states what you found and contains the full link,
the code and the validity. Then stop.

> I found no valid session on this machine. Open this link to connect it:
>
> [full link exactly as printed]
>
> The page shows the code **[code]**. Continue only if it shows exactly this code.
> Sign in there, or choose **Sign up** on that same page if you do not have an account yet.
> Link and code are valid for [minutes] minutes; if the page rejects the code, say so and I will send a new one.
> Tell me when you are done.

Rules for this step:

- Always show the code. Every message that carries a sign-in link also carries its code, the first
  time and after every repeated login. The customer checks it against the page; a code that
  appears on the page but never in the chat gives them nothing to check.
- Write the full link on its own line, exactly as the CLI printed it, so the customer sees the
  address before opening it. Never hide it behind words like "this link" or "sign-in link" and
  never shorten it; a bare address the chat makes clickable is fine. The customer types nothing.
- State how long link and code are valid, taking the number from the CLI's own message rather than
  inventing one.
- Do not ask whether they have an account. The same page serves both, so naming both costs one
  sentence and saves a round trip.
- Sign-up is open. There is no invitation, no waitlist and no access code. Never send the customer
  somewhere else to request access.
- Wait for the customer. The command completes on its own once they finish; do not start a second
  login while the first is still open.
- A confirmation code lives only a few minutes. If it expired while they were signing up, run
  `ohmyhost login --json` again and send the new link and the new code the same way. This is
  expected, not a failure: do not report an error and do not suggest they did something wrong.

When the command returns, verify and continue:

```sh
ohmyhost whoami --json
```

## Step 4 — make sure a workspace is selected

`login` and `whoami` select the workspace themselves when the customer has exactly one, and their
response names the selected organization. They report `next_action` with several choices, and then
the customer decides; with no workspace at all, create the first one.

Always look before creating. The customer may already have a workspace from an earlier session:

```sh
ohmyhost organization list --json
ohmyhost organization use --organization "$ORGANIZATION_ID" --json
```

Create a workspace only when that list is empty, with a name the customer gave you:

```sh
ohmyhost organization create --name "$ORGANIZATION_NAME" --source "$SIGNUP_SOURCE" --idempotency-key "$ORGANIZATION_REQUEST_KEY" --json
ohmyhost whoami --json
```

- `--source` is optional and is only where the customer came from. If the task mentioned a link like `https://ohmyho.st/?r=hostmebaby`, pass that single `r` value. Otherwise omit the flag. It grants nothing and is never a secret.
- Reuse the same name, source and idempotency key after an interrupted response instead of creating a second organization.
- Creating a workspace selects it immediately. There is no second login; `whoami` or `identity_get` confirms the selection before you create a project.
- Over MCP, `organization_create`, `organization_list` and `organization_use` do the same and report the same `selected` workspace.
- Creating, listing and selecting a workspace need the interactive login. An API token can do none of them, and says so.
- Never create another workspace on your own when the customer already has one.
- A session that selected none lists no projects: `projects_list` and `ohmyhost project list` answer `organization_required` instead of an empty page. Select a workspace, then read the list again.

## Step 5 — keep access for later

The current CLI login is enough to continue; MCP uses it.

For an automation platform the customer can create a user token: `token_create`, or `ohmyhost token create`. The full value appears exactly once. Save it once to the private env file the customer chooses, mode `600`, and configure the process to load that file. Preserve existing credentials and never put the value in chat, source or a command argument.

`OHMYHOST_TOKEN` overrides the saved login in any process where it is set. A token alone runs every
command in these Skills except these, which need the interactive login: `login`, `logout` (including
`logout --revoke`), `organization create|list|use`, and `token create|list|revoke`. Run those in a
process without the variable. Never delete a saved token file.

## Step 6 — continue with the app

Confirm the selected directory and GitHub repository. Read `github_status` for the selected workspace. If it is not connected, an Owner or Admin uses `github_connect` (CLI below), opens its single `authorization_url`, then repeats the same request/key after the browser completes until the returned status is `connected`.

```sh
ohmyhost github status --organization "$ORGANIZATION_ID" --json
ohmyhost github connect --organization "$ORGANIZATION_ID" --idempotency-key "$GITHUB_CONNECT_KEY" --json
```

The one link handles the required installation/user authorization. Do not construct a second installation link, replay OAuth callbacks, or ask for an installation ID or provider token. Use the intended GitHub browser profile. A connected installation covers only its selected repositories; if one is missing, open `connection.settings_url` from status, add the repository and repeat its original source-link request/key.

MCP/REST returns these objects directly. CLI JSON wraps the handoff in `authorization` and status in `github`: read `authorization.authorization_url` and `github.connection.settings_url`. For a failed or expired handoff, resolve `last_failure` and use a new connect key for the same workspace; do not poll a terminal failure forever.

Use `projects_list` to reuse a project and `project_context_get` when resuming one. Preserve an existing project's region. For a new project, an explicit customer region wins; otherwise use a browser-location hint supplied in the customer's onboarding prompt and send that region explicitly. Without either, ask once for US or EU. Never infer customer location from the agent/server IP. The API default remains US; the selected region cannot change later.

Continue with the **ohmyhost-deploy-github** Skill when a deployment is requested. Login, workspace creation, GitHub connection and project linking are distinct results; check each returned state rather than treating a completed browser page as deployment success.
