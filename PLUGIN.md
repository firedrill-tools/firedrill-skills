# Firedrill coding-agent plugin

This plugin packages the `firedrill` skill and its references. It contains no
simulation engine, credentials, automatic login, hooks or MCP server.
Installing it runs no agent, uploads no source and reserves no resources.

Use this plugin **or** the portable skill install
(`npx skills add firedrill-tools/firedrill-skills --skill firedrill`), not both.

## Claude Code

```sh
claude plugin marketplace add firedrill-tools/firedrill-skills
claude plugin install firedrill@firedrill --scope project
```

## Codex

```sh
codex plugin marketplace add firedrill-tools/firedrill-skills
codex plugin add firedrill@firedrill
```

If your Codex version has no `plugin add`, install from the added marketplace
with `/plugins`. Start a new session afterwards.

## Cursor and Kimi

`.cursor-plugin/marketplace.json` and `kimi-marketplace.json` describe the same
plugin for those clients' local marketplace installs.

## What else you need

- **Firedrill CLI** to run drills on your machine: `npm install -g firedrill-run`,
  then `firedrill init` to sign in.
- **Remote MCP** (optional) at `https://mcp.firedrill.run`, added with your
  client's own MCP command and browser OAuth. `firedrill mcp --agent claude|codex|other`
  prints the exact commands.

The plugin does not register MCP and never asks for tokens in chat.

## Updating and removing

Update or remove the plugin with your client's plugin commands. Removing it
removes the plugin's skill copy only, not your Firedrill account or any cloud
resource.

## Packaging

`node tooling/package.mjs <new-output-dir>` builds local review archives
(marketplace, single-plugin and portable-skill ZIPs with a packaging receipt).
It never installs or publishes anything.
