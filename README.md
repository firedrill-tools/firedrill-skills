# Firedrill skills

Instructions for coding agents operating Firedrill on a human's behalf.
Use `firedrill` to simulate an existing application and inspect retained evidence;
use `firedrill-service-authoring` only when a simulation needs a new private
synthetic dependency. Tool-free and observation-only simulations remain valid.

Skills do not contain the Firedrill service,
an execution client, credentials or an automatic installer.

## Install one integration, not duplicate copies

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

Alternatively, install the packaged native plugin through your host. For the
Claude marketplace, `/plugin marketplace add firedrill-tools/firedrill-skills`
then `/plugin install firedrill@firedrill` selects this repository's plugin.
For local review use the absolute checkout path as the marketplace source.
Other host manifests are included; follow the host's current installation and
consent interface.

Use either the plugin, direct skills, or the Firedrill CLI's repository setup,
not all three. Do not overwrite locally edited skills or change workspace trust
as a side effect of installing instructions.

## Connect the execution client

Install the Firedrill CLI:

```sh
npm install --global @firedrill-run/cli@2.1.0
firedrill login
firedrill init
```

Run `init` from your application repository. The CLI includes `firedrill-mcp`; do not install two owners
of that binary into one application. Production is automatic; authorize the
human's Firedrill account through the client without setting an API address. An explicit
scoped CI credential is separate and comes from the CI secret store.

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
No remote MCP URL, hooks, automatic trust, or secret is embedded. OpenAI's manifest
marks the workflow as requiring local execution because its client runs locally.

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
