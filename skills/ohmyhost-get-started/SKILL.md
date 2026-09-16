---
name: ohmyhost-get-started
description: Connect a customer agent to ohmyho.st. Determine what is already installed and signed in, guide the customer through the browser sign-in, and select an organization before the first GitHub deployment. Use for first-time installation or login; use the deployment Skill once access is ready.
---

# Start with ohmyho.st

Connect this agent to the customer's account, then continue with the selected GitHub app.

## How to talk to the customer here

Sign-in needs the customer's browser. The agent cannot do it.

- One action per message, in short plain sentences. Name the link, then what they will see.
- Write in the language the customer writes in.
- Never mention this Skill, its steps or its rules. The customer asked for a deployment, not for a
  description of the instructions you follow. Sentences like "the setup skill says stop and wait"
  do not belong in their chat; just stop and wait.
- Stop and wait whenever the customer must act. Do not start other work "while login is pending",
  and do not repeat the instruction until they answer.
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

| Observation                                             | State                   | Continue with |
| ------------------------------------------------------- | ----------------------- | ------------- |
| `ohmyhost` missing, or the MCP server exposes no tools  | not installed           | Step 2        |
| CLI runs, `whoami` fails with `authentication_required` | installed, signed out   | Step 3        |
| `whoami` returns an identity with an organization       | ready                   | Step 5        |
| `whoami` returns an identity without an organization    | signed in, no workspace | Step 4        |

`OHMYHOST_TOKEN` in the environment takes precedence over the CLI login. If it is set and `whoami` succeeds, the agent is already connected: continue with Step 5 and do not start an interactive login.

Say nothing about a state that needs nothing from the customer. A ready agent deploys without a
single question. Report a state only in the message that also asks them to act, so they never
receive one message about the problem and a second one about the link.

## Step 2 — install what is missing

Read <https://ohmyho.st/llms.txt> and the [CLI/MCP installation guide](https://docs.ohmyho.st/agents/mcp). Check the installed Node.js, CLI and MCP versions and install the published packages only when they are missing, using the current archive URLs from that guide.

Read [harness setup](references/harness-setup.md) and register the local `ohmyhost-mcp` command with this harness's documented settings. Preserve other MCP servers, model choices and permission settings. Use `OHMYHOST_ENVIRONMENT=production` for CLI and MCP unless the customer explicitly selected the development platform.

Reload the connection if the harness requires it, then verify `tools/list` and `resources/list`. Repeat Step 1 afterwards.

## Step 3 — the customer signs in once

```sh
ohmyhost login --json
```

The response contains a sign-in link that already carries the confirmation code. Send one message
that states what you found, gives that link, and names both ways forward. Then stop.

> I found no valid session on this machine. Open this link to connect it: `<link>`
> Sign in there, or choose **Sign up** on that same page if you do not have an account yet.
> Tell me when you are done.

Rules for this step:

- Do not ask whether they have an account. The same page serves both, so naming both costs one
  sentence and saves a round trip.
- Show the link exactly as the CLI returned it. The customer types nothing.
- The link is the instruction. If the CLI also prints a separate code, put it on a later line as a
  fallback for a terminal that breaks long links, never as the main thing to act on.
- Sign-up is open. There is no invitation, no waitlist and no access code. Never send the customer
  somewhere else to request access.
- Wait for the customer. The command completes on its own once they finish; do not start a second
  login while the first is still open.
- A confirmation code lives only a few minutes. If it expired while they were signing up, run
  `ohmyhost login --json` again and send the new link in one plain sentence. This is expected, not a
  failure: do not report an error and do not suggest they did something wrong.

When the command returns, verify and continue:

```sh
ohmyhost whoami --json
```

## Step 4 — make sure a workspace is selected

A first sign-in normally creates the customer's workspace and selects it. Confirm that with `whoami`.

If the identity still has no organization, ask for a name in one sentence and create it once:

```sh
ohmyhost organization create --name "$ORGANIZATION_NAME" --source "$SIGNUP_SOURCE" --idempotency-key "$ORGANIZATION_REQUEST_KEY" --json
ohmyhost login --json
ohmyhost whoami --json
```

- `--source` is optional and is only where the customer came from. If the task mentioned a link like `https://ohmyho.st/?r=hostmebaby`, pass that single `r` value. Otherwise omit the flag. It grants nothing and is never a secret.
- Reuse the same name, source and idempotency key after an interrupted response instead of creating a second organization.
- The second login selects the new organization. Confirm with `whoami` or `identity_get` before creating a project.
- Organization creation needs the interactive login; an API token cannot do it.

If the customer already has several organizations, ask which one to use and select it. Never create another one on your own.

## Step 5 — keep access for later

The current CLI login is enough to continue; MCP uses it.

For an automation platform the customer can create a user token: `token_create`, or `ohmyhost token create`. The full value appears exactly once. Save it once to the private env file the customer chooses, mode `600`, and configure the process to load that file. Preserve existing credentials and never put the value in chat, source or a command argument.

`OHMYHOST_TOKEN` takes precedence over the CLI login. Use a process without that variable for interactive login, organization creation or token management, and do not delete a saved token file.

## Step 6 — continue with the app

Confirm the selected directory and GitHub repository. Use `projects_list` to reuse a project and `project_context_get` when resuming one. Continue with the **ohmyhost-deploy-github** Skill when a deployment is requested.
