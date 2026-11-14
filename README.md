# Firedrill skill

[Firedrill](https://firedrill.run) is a simulation platform for AI agents. It
runs your real agent against synthetic users, hosted synthetic tools and
scenarios, then reports what happened, without touching production.

This repository holds the `firedrill` skill: instructions that let a coding
agent (Claude Code, Codex, Cursor and others) set up Firedrill, describe your
agent, build its synthetic world, run drills on your machine and explain the
reports. The skill is instructions only. It contains no credentials, binary,
MCP server or runtime, and installing it runs nothing.

## Install the skill

```sh
npx skills add firedrill-tools/firedrill-skills
```

- Installs into the project by default. Add `-g` for a global install.
- Target one client with `-a <agent>`, for example `-a claude-code` or `-a codex`.
- Update with `npx skills update firedrill`; remove with `npx skills remove firedrill`.
- The skills CLI needs Node.js 22.20 or later.

Clients without skills CLI support can copy `skills/firedrill/` (SKILL.md and
`references/`) into their skills or instructions folder.

## Install the CLI

Drills run through the Firedrill CLI (npm package `firedrill-run`, command
`firedrill`). It requires Node.js `>=22.23.4 <23 || >=24.11.1 <25 ||
>=26.13.1 <27`.

```sh
npm install -g firedrill-run
firedrill init
```

Or without a global install: `npx firedrill-run init`. `npx` does not install a
global `firedrill` command, so keep the `npx firedrill-run` prefix on later
commands. `init` signs you in through a browser device flow. A coding agent
runs it once with `--json --no-browser`, relays the link and code, and keeps
that process running until the person approves.

## Remote MCP (optional)

The Firedrill MCP server is at `https://mcp.firedrill.run` (Streamable HTTP,
browser OAuth, no path suffix). It can plan, apply, watch and inspect cloud
resources; it cannot read your files or start local processes, so the CLI is
still needed to run drills.

```sh
claude mcp add --transport http firedrill https://mcp.firedrill.run
codex mcp add firedrill --url https://mcp.firedrill.run
```

`firedrill mcp --agent claude|codex|other` prints the exact commands for your
client.

## Plugin

The repository root is also a skills-only plugin for clients with plugin
marketplaces. It packages the same skill and grants no extra permission. Use
the plugin or the skill install above, not both. See
[PLUGIN.md](https://github.com/firedrill-tools/firedrill-skills/blob/main/PLUGIN.md).

## Then ask your agent

> Use Firedrill to simulate the agent in this repository. Show me the plan
> before running anything.

Docs: [docs.firedrill.run](https://docs.firedrill.run). Setup guide for
agents: [firedrill.run/agent-setup.md](https://firedrill.run/agent-setup.md).

## License

See [LICENSE.md](LICENSE.md).
