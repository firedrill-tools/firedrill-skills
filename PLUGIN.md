# Firedrill coding-agent plugin

This package contains the two focused Firedrill skills and their references. It
does not contain a simulation engine, credentials, automatic login, hooks or a
second implementation of the CLI/MCP. Plugin installation alone runs no agent,
uploads no source and reserves no resources. Firedrill sign-in authorizes the
operator on the human's behalf; target-model credentials remain separate.

Use this plugin **or** direct skill installation, not both. The plugin supplies
instructions; connect the host separately to `https://mcp.firedrill.run/mcp` using
Streamable HTTP and browser OAuth. Remote preparation and inspection need no
local MCP package or Firedrill CLI. Existing managed project skills are an
alternative installation path, not another required step.

## Install the plugin

For Codex, use its native marketplace and installation commands:

```sh
codex mcp add firedrill --url https://mcp.firedrill.run/mcp
codex mcp login firedrill
codex plugin marketplace add firedrill-tools/firedrill-skills
codex plugin add firedrill@firedrill
```

This is user-wide. Start a new session and choose the Firedrill plugin skill.
If your version does not support `plugin add`, use `/plugins` to install from the
added marketplace, or use the portable skills installer. The skills-only plugin
does not register MCP. The native URL command above registers the remote server;
`mcp login` opens WorkOS browser authorization without exposing a token to chat.

For Claude Code, add the Firedrill skills marketplace and install its plugin:

```sh
claude mcp add --scope project --transport http firedrill https://mcp.firedrill.run/mcp
claude mcp login firedrill
claude plugin marketplace add firedrill-tools/firedrill-skills
claude plugin install firedrill@firedrill --scope project
```

Use the host's normal consent flow. The following archive instructions are an
alternative for an offline or reviewed local installation.

Unzip the exact approved archive into a directory you control. Its root contains
`plugins/firedrill`, `.agents/plugins/marketplace.json` for Codex,
`.claude-plugin/marketplace.json` for Claude Code,
`.cursor-plugin/marketplace.json` for Cursor, and `kimi-marketplace.json` for Kimi.
These are distributable catalogs, not
claims of public store approval. Review the files before trusting/installing.

The packager also produces a single-plugin ZIP
`firedrill-skills-plugin-VERSION.zip` with one `firedrill/` root, and a portable
`firedrill-agent-skills-VERSION.zip` with both skill folders and the client
permission notice. Each exported skill includes its own reference closure and
license; either can also be installed individually. Never extract over edited skills.
Artifact names, hashes and sizes belong in the packaging receipt; no archive
is qualified merely because its packaging source exists.

The single-plugin root contains the portable `plugin.json`, Codex compatibility
`.codex-plugin/plugin.json`, Claude `.claude-plugin/plugin.json`, Cursor
`.cursor-plugin/plugin.json`, and Kimi `kimi.plugin.json`. Each native manifest
declares only supported identity/skills metadata. None enables MCP, hooks,
session-start instructions, global prompts, credentials or workspace trust.

The OpenAI manifest does not require a local executor for every task: remote
preparation, Tool management and retained inspection use the authorized MCP.
Actual target execution still needs a separately authorized customer-owned
CLI/SDK runner with the application's real entry point. The skill checks that
boundary for the task; the manifest is neither execution authority nor a sandbox.
Directory submission and approval remain separate from installation.

In Claude Code, add the unzipped directory and install its skills-only plugin:

```sh
claude plugin marketplace add /absolute/path/to/unzipped-marketplace
claude plugin install firedrill@firedrill-local
```

Start a new session in the application repository and use `/firedrill:firedrill`
or `/firedrill:firedrill-service-authoring`. Host consent remains the user's
decision. No Firedrill account credential is placed in the plugin catalog.

For Codex, register that same local catalog without changing the application's
marketplace file:

```sh
codex plugin marketplace add /absolute/path/to/unzipped-marketplace
```

Then use `codex plugin add firedrill@firedrill-local` where supported, or the
Plugins Directory to select and install Firedrill from that local source. Reopen
the application in a fresh trusted session. The optional `firedrill setup codex`
helper is a separate repo-local alternative, not an additional step. Local
installation and trusted-project rules are controlled by the
host; there is no claimed one-click installation or approved public listing.

For Cursor, the plugin and marketplace use Cursor's documented formats. Team
distribution uses the host's reviewed repository-marketplace flow and requires
the appropriate account/admin authority. This package does not invent a local
ZIP-import command or claim a public listing. For the remote connection, merge
`"firedrill": { "url": "https://mcp.firedrill.run/mcp" }` under `mcpServers` in
`.cursor/mcp.json` without replacing other entries, then complete Cursor's
browser authentication. Direct project skills can use the portable skills
installer instead of a plugin. See
[Cursor's plugin distribution](https://prod.cursor.com/docs/plugins) and
[manifest reference](https://prod.cursor.com/docs/reference/plugins).

In Kimi, install the reviewed plugin directory after unzipping the single-plugin
archive, or select `plugins/firedrill` inside the marketplace bundle:

```text
/plugins install /absolute/path/to/firedrill
/reload
/skill:firedrill:firedrill
```

Kimi plugin installation is user-wide, not project-only. Use `/mcp-config` to add
a project-level HTTP server named `firedrill` at
`https://mcp.firedrill.run/mcp`, then `/mcp-config login firedrill` for browser
authorization. Plugin installation and host trust are explicit host actions.
Inspect the plugin in `/plugins info firedrill`. Kimi's native
format and lifecycle are documented in its
[plugin guide](https://moonshotai.github.io/kimi-code/en/customization/plugins.html).

## Use your actual application

For remote preparation or report inspection, use MCP without installing another
client. To execute a command/HTTP target in the customer's environment, install
the CLI with Node.js 22+ and initialize it in that application repository:

```sh
npm install --global @firedrill-run/cli
firedrill init
```

CLI initialization offers its own browser sign-in when needed. Use the same
intended organization as MCP; never copy the host's OAuth credential into the
CLI. CI uses a scoped machine credential from its secret store and never prompts.
The plugin does not download executable packages or approve credentials for you.

Ask the skill to inspect the real entry point and prepare a bounded simulation.
Command/HTTP flows need no SDK import. Native Python and TypeScript SDKs support
callable adapters. Tools and assessment are optional; observing a successful
workflow is as valid as finding a defect. The CLI and native SDKs save the actual
recipe, results and evidence; the portal inspects those same records.

Use remote MCP for preparation/inspection and the actual CLI/SDK runner for target
execution. Queueing work remotely cannot launch code on the customer's laptop.
If no suitable executor is available, retain the preparation and provide its
runner handoff rather than claiming execution. Do not
configure both plugin and repo-local skill copies unless you deliberately want
the duplicate instructions.

## Remove or revoke

Remove/disable the plugin in the host's plugin manager. For Claude Code, use
`claude plugin uninstall firedrill@firedrill` (or `firedrill@firedrill-local` for
the local archive marketplace). This removes instructions,
not account access, installed CLI packages, saved recipes or results. Use the
host's MCP logout action for its OAuth session, `firedrill logout` for CLI sign-in,
or revoke a specific machine credential when that is the intended action.
No uninstall action erases remote evidence. For Codex,
`codex plugin marketplace remove firedrill-local` removes the local catalog;
inspect the plugin manager separately for its installed/enabled state.
Use Cursor's plugin manager for its installed plugin. In Kimi, use
`/plugins disable firedrill` or `/plugins remove firedrill`, then reload/new
session; Kimi retains its managed files after removal, so do not describe this
as erasing local copies or account access. Project setup removal remains the
separate receipt-backed `firedrill setup remove HOST` operation.

Host format references: [OpenAI plugin packages](https://developers.openai.com/plugins/build/plugins)
and [Claude Code marketplaces](https://code.claude.com/docs/en/plugin-marketplaces).
