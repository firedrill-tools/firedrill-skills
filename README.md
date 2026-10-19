# Firedrill skills

Instructions for coding agents operating Firedrill on a human's behalf.
Use `firedrill` to simulate an existing application and inspect retained evidence;
use `firedrill-service-authoring` only when a simulation needs a new private
synthetic dependency. Tool-free and observation-only simulations remain valid.

Skills do not contain the Firedrill service,
an execution client, credentials or an automatic installer.

## Native plugin installation

Use the coding agent's own plugin manager when available. For Codex:

```sh
codex plugin marketplace add firedrill-tools/firedrill-skills
codex plugin add firedrill@firedrill
```

For Claude Code, from the application repository:

```sh
claude plugin marketplace add firedrill-tools/firedrill-skills
claude plugin install firedrill@firedrill --scope project
```

Codex installs user-wide. Claude enables the plugin for this project and registers
the marketplace in user settings. Older Codex clients without `plugin add` can
install from the added marketplace through `/plugins`, or use the portable skills
installer below. Restart/reload the host after installation. The plugin is
skills-only, not an MCP executable or a Firedrill login.

## Portable skills alternative

Review the instructions, then from your application repository:

```sh
npx skills add firedrill-tools/firedrill-skills --skill firedrill --skill firedrill-service-authoring --agent codex
```

Choose your actual supported host in place of `codex`, such as `claude-code` or
`cursor`. Installation is project-local by default; do not add `--global` unless
you intend a user-wide change. Either skill can be selected individually:
its references and license are contained in its own folder. For an offline
reviewed checkout, use its local directory instead of the GitHub source.
Repository access is not Firedrill account authorization.

Inside Claude Code, `/plugin marketplace add firedrill-tools/firedrill-skills`
then `/plugin install firedrill@firedrill` is the interactive native alternative.
For local review use the absolute checkout path as the marketplace source.
Other host manifests are included; follow the host's current installation and
consent interface.

Use either the plugin, direct skills, or the Firedrill CLI's repository setup,
not all three. Do not overwrite locally edited skills or change workspace trust
as a side effect of installing instructions.

## Connect remote MCP

No local MCP package or CLI is needed. Register the remote server and complete
your host's WorkOS browser authorization:

```sh
codex mcp add firedrill --url https://mcp.firedrill.run/mcp
codex mcp login firedrill
# Or for Claude Code project scope:
claude mcp add --scope project --transport http firedrill https://mcp.firedrill.run/mcp
claude mcp login firedrill
```

Review the host's MCP approval prompt. Operator authentication is separate from
installing/enabling the plugin or MCP entry. The host stores the OAuth credential;
no token is embedded in these files or required in chat. Use the intended organization.

In Cursor, merge `"firedrill": { "url": "https://mcp.firedrill.run/mcp" }` under
`mcpServers` in `.cursor/mcp.json` and complete its browser authentication. In
Kimi Code, use `/mcp-config` to add a project HTTP server with that URL and then
`/mcp-config login firedrill`. Preserve other configured servers.

## Execute the actual application

Remote MCP can prepare simulations, manage authorized synthetic Tools and inspect
retained results. It cannot launch a process on the customer's machine. For
command/HTTP execution, install the CLI with Node.js 22+:

```sh
npm install --global @firedrill-run/cli
firedrill init
```

Run `init` in the application repository. It offers a separate browser sign-in
when needed and selects the project/environment. Use the same intended
organization as MCP; never copy host tokens into the CLI. Callable targets can
use native Python/TypeScript SDKs. CI uses its own scoped secret-store credential
and never prompts. If no actual runner is available, keep preparation/inspection
separate from execution and show the required handoff.

The operator login is not authentication to the coding-agent provider or target
application. Keep those credentials separate. Missing access is a human handoff,
not permission to borrow another identity or create anonymous access.

After host consent, ask the coding agent to inspect the application's actual
entry point, preview a small recipe and explain the intended execution. It must
obtain the applicable permission before running or uploading source. Saved
recipes can later run in ordinary CLI/SDK/CI without a live coding-agent chat.

## Source and packaging

The source entrypoints are `skills/*/SKILL.md`. `plugin.json` and the host-specific
manifests describe the same skills-only plugin; `assets/` contains its brand icon.
No MCP connection, hooks, automatic trust or secret is embedded in the skills-only
plugin. Its instructions provide the public remote URL above. The manifest does
not require a local executor for remote preparation/inspection; actual target
execution still requires the appropriate authorized customer-owned CLI/SDK runner.

To create ZIPs from this checkout, use Node 22+ and the system `zip` utility:

```sh
node tooling/package.mjs /absolute/path/to/a-new-output-directory
```

The output directory must not exist. The command creates a local marketplace
archive, a single-plugin archive and a portable skills archive with hashes; it
does not install or submit anything. Preserve the exact exported files and
`EXPORT.json` when comparing a later rebuild. Packaging is not runtime qualification.

## Discovery and license

The root `skills/` layout is discoverable by the skills CLI. The skills.sh
leaderboard uses installation telemetry. Users decide what to install,
authorize and invoke; discovery does not automatically enable a skill.

See [client use permission](LICENSE.md). These instructions are proprietary
client material; a readable repository is not a license to the private service.
