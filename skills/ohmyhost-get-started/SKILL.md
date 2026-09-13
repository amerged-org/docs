---
name: ohmyhost-get-started
description: Connect a customer agent to ohmyho.st, complete invitation signup and select an organization before the first GitHub deployment. Use for first-time installation or login; use the deployment Skill once access is ready.
---

# Start with ohmyho.st

Connect this agent to the customer's account, then continue with the selected GitHub app.

## Install and connect

1. Read https://ohmyho.st/llms.txt and the current CLI/MCP installation guide. Check installed Node.js, CLI and MCP versions. Install the published packages only when missing or when required tools are absent, using the current archive URLs in the guide.
2. Register the local `ohmyhost-mcp` command using this harness's installed help and documented settings. Preserve other MCP servers, model choices and permission settings. Use `OHMYHOST_ENVIRONMENT=production` for both CLI and MCP unless the customer explicitly selected the development platform.
3. Reload the connection if required. Verify `tools/list` and `resources/list`; read the relevant Skill and its supporting files. A saved configuration alone is not a working connection.

## Sign in and select an organization

```sh
ohmyhost login --json
ohmyhost whoami --json
```

Show the returned sign-in link and wait for the customer's completion. MCP uses this local CLI login.

If identity contains an organization, use the customer's selection without creating another. If it contains none, take the signup source from the invitation URL's single `r` parameter. Ask for the organization name, then use `organization_create` with `name`, `signup_source` and one saved `idempotency_key`.

```sh
ohmyhost organization create --name "$ORGANIZATION_NAME" --source "$SIGNUP_SOURCE" --idempotency-key "$ORGANIZATION_REQUEST_KEY" --json
ohmyhost login --json
ohmyhost whoami --json
```

The second login selects the new organization. Confirm it with `identity_get` before creating a project. Reuse the original creation arguments and key after an interrupted response. Organization creation requires interactive login; an API key cannot perform it.

If the invitation is missing or rejected, return the next action and https://ohmyho.st/ for beta access. Do not invent an invitation or create a project without an authorized organization.

## Keep access for later

The current CLI login is sufficient to continue. When the customer wants a deployment token, use `token_create` or `ohmyhost token create` and save the newly issued 90-day value once to the chosen private env file. Configure the local process to load that file. Preserve existing credentials; the value never belongs in chat, source or command arguments.

`OHMYHOST_TOKEN` takes precedence over the CLI login. Use a process without that variable for interactive login, organization creation or token management; do not delete the saved token file.

## Continue with the app

Confirm the selected directory and GitHub repository. Use `projects_list` to reuse a project and `project_context_get` when resuming one. Continue with the **ohmyhost-deploy-github** Skill when deployment is requested.

Configure only the application's needed capabilities. Recommend isolated Dev/Prod data and explain the extra database consumption; respect an explicit shared-data choice. A public app does not need a database, auth provider, custom domain or email solely to be hosted.

Setup is complete when the local MCP tools work and identity contains the intended organization. A deployment request is complete only after the application has been verified.
