# Firedrill coding-agent plugin

This package contains the two focused Firedrill skills and their references. It
does not contain a simulation engine, credentials, automatic login, hooks or a
second implementation of the CLI/MCP. Plugin installation alone runs no agent,
uploads no source and reserves no resources. Firedrill sign-in authorizes the
operator on the human's behalf; target-model credentials remain separate.

Use this optional plugin **or** the CLI's repo-local skill setup, not both. If you
already used `firedrill setup codex`, `claude`, `cursor` or `kimi`, those skills and
the authenticated local MCP are sufficient. Do not install duplicate skill
copies simply to start a simulation.

## Install the prepared package

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

The OpenAI manifest declares local execution because the workflow needs a
customer-local CLI/MCP/SDK. It does not imply web-only execution or eligibility
for local-MCP public submission. Directory submission remains a separate review.

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

Then use the desktop Plugins Directory to select and install Firedrill from that
local source. Reopen the application in a fresh trusted session. CLI-only users
can instead use `firedrill setup codex` in their application
repository. Local installation and trusted-project rules are controlled by the
host; there is no claimed one-click installation or approved public listing.

For Cursor, the plugin and marketplace use Cursor's documented formats. Team
distribution uses the host's reviewed repository-marketplace flow and requires
the appropriate account/admin authority. This package does not invent a local
ZIP-import command or claim a public listing. The offline, repository-only path
is `firedrill setup cursor`. See
[Cursor's plugin distribution](https://prod.cursor.com/docs/plugins) and
[manifest reference](https://prod.cursor.com/docs/reference/plugins).

In Kimi, install the reviewed plugin directory after unzipping the single-plugin
archive, or select `plugins/firedrill` inside the marketplace bundle:

```text
/plugins install /absolute/path/to/firedrill
/reload
/skill:firedrill:firedrill
```

Kimi plugin installation is user-wide, not project-only. Use
`firedrill setup kimi` for a project-scoped skills/MCP setup
instead. Its plugin command is an explicit user action, never performed by
Firedrill setup. Inspect the plugin in `/plugins info firedrill`. Kimi's native
format and lifecycle are documented in its
[plugin guide](https://moonshotai.github.io/kimi-code/en/customization/plugins.html).

## Use your actual application

Install the approved Firedrill CLI archive in the application repository if it is
not already present. The plugin does not download executable packages for you.
Production is selected automatically. From that repository in the human's
interactive terminal (after installing the CLI):

```sh
npx firedrill login --no-browser
npx firedrill init
```

Ask the skill to inspect the real entry point and prepare a bounded simulation.
Command/HTTP flows need no SDK import. Native Python and TypeScript SDKs support
callable adapters. Tools and assessment are optional; observing a successful
workflow is as valid as finding a defect. The CLI and native SDKs save the actual
recipe, results and evidence; the portal inspects those same records.

The plugin uses installed terminal commands by default. Optional local operator
MCP is configured through the CLI's host setup, not through a token embedded in
this archive. Remote MCP cannot launch code on the customer's laptop. Do not
configure both plugin and repo-local skill copies unless you deliberately want
the duplicate instructions.

## Remove or revoke

Remove/disable the plugin in the host's plugin manager. For Claude Code, use
`claude plugin uninstall firedrill@firedrill-local`. This removes instructions,
not account access, installed CLI packages, saved recipes or results. Revoke a
specific machine credential or use `firedrill logout` separately when that is
the intended action. No uninstall action erases remote evidence. For Codex,
`codex plugin marketplace remove firedrill-local` removes the local catalog;
inspect the plugin manager separately for its installed/enabled state.
Use Cursor's plugin manager for its installed plugin. In Kimi, use
`/plugins disable firedrill` or `/plugins remove firedrill`, then reload/new
session; Kimi retains its managed files after removal, so do not describe this
as erasing local copies or account access. Project setup removal remains the
separate receipt-backed `firedrill setup remove HOST` operation.

Host format references: [OpenAI plugin packages](https://developers.openai.com/plugins/build/plugins)
and [Claude Code marketplaces](https://code.claude.com/docs/en/plugin-marketplaces).
