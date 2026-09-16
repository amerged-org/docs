# Connect the local product MCP

Read https://docs.ohmyho.st/agents/mcp for current installation and full customer instructions. Install the reviewed CLI/MCP archives only when needed. Authenticate one of two ways: set `OHMYHOST_TOKEN` in the server's `env` block, or sign in once with `ohmyhost login --json` and let MCP reuse that local session. The token wins wherever it is set, and needs no browser. New user API tokens are optional, remain valid until revoked and are shown only once. Login and token lifetimes are separate.

Inspect existing configuration before adding the one server. Preserve unrelated servers, models, environment values and approval settings. Check installed help when an executable or flag differs.

| Harness     | Register the local server                                                                                                               | Confirm in the running harness                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Codex       | `codex mcp add ohmyho --env OHMYHOST_ENVIRONMENT=production -- ohmyhost-mcp`                                                            | Reload if requested; call `identity_get` and read the Skill resources.                                      |
| Claude Code | `claude mcp add --transport stdio --scope user --env OHMYHOST_ENVIRONMENT=production ohmyho -- ohmyhost-mcp`                            | Open `/mcp`, confirm connection and call `identity_get`.                                                    |
| Cursor      | Merge the token-free https://ohmyho.st/mcp.json server into the existing global or project MCP config.                                  | Confirm in settings; current CLI supports `agent mcp list-tools ohmyho`. Resolve installed executable/help. |
| Hermes      | `hermes mcp add ohmyho --command ohmyhost-mcp --env OHMYHOST_ENVIRONMENT=production`                                                    | `hermes mcp test ohmyho`, then reload the agent session.                                                    |
| OpenClaw    | `openclaw mcp add ohmyho --command ohmyhost-mcp --env OHMYHOST_ENVIRONMENT=production` where the installed native registry supports it. | `openclaw mcp probe ohmyho --json`, then verify runtime-visible tools.                                      |

Cursor uses `.cursor/mcp.json` per project or `~/.cursor/mcp.json` globally, with `mcpServers.ohmyho.command = "ohmyhost-mcp"` and only `OHMYHOST_ENVIRONMENT=production` in the public configuration. A host on another computer needs its own installation and authorized local login.

Do not configure a fabricated product HTTP URL or run OpenClaw's `mcp serve` as a client setup. Mintlify search reads documentation; it does not authorize product resources. Do not alter an approval policy merely to connect a server.

After setup, discover `tools/list` and `resources/list`, call `identity_get`, select the authorized organization, and read `project_context_get` before resuming a project. A saved configuration or successful process start alone is not a successful authenticated connection. If the host requires a reload, return that concrete step and resume after it; never pretend tools are loaded.

Official references: https://prod.cursor.com/docs/cli/mcp, https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp, https://docs.openclaw.ai/cli/mcp/registry. Codex and Claude command syntax was also checked against installed help; always retain version-appropriate behavior.
