# Custom hosted tools

Author a private tool only when no catalog tool or data recipe is compatible with a
dependency. Compatibility means protocol, operations, schemas, auth shape and
state behavior, not name.

## Three kinds of hosted tool

- **Catalog tool**: a reviewed implementation on shared trusted workers.
- **Data recipe**: configuration and seed for a reviewed implementation. Use this
  when an existing tool has the right operations but needs different data or
  permitted behavior.
- **Custom executable tool**: new code you write, run only in an isolated cloud
  lane.

## Workflow

1. `firedrill tools init [directory] --json` starts a tool package (`tool.json`)
   in a directory the human chose.
   Put executable files under `bundle/app/`, declare `working_directory: "app"`,
   and seal their `app/...` paths in the manifest. Never copy the whole bundle
   (`working_directory: "."`) or use private assessment directories such as
   `scenarios`, `checks`, `handlers` or `generic-harness` as executable roots.
2. Implement only the operations the target actually uses, with their real
   request/response shapes, errors and pagination. Advertise exactly that coverage;
   do not claim operations you did not implement.
3. `firedrill tools validate [directory] --json` checks `tool.json` and
   `bundle/manifest.json` locally. That is a structural check only; the cloud's
   security review and isolated conformance are separate results.
4. `firedrill tools push <package.zip> --json` uploads it as a private, immutable
   version. In JSON mode it needs `--approve-tool-upload`, which you add only
   after the human approved uploading that package. Pushing does not publish to the
   public catalog and does not prove runtime readiness.

The package format is the existing tool package contract (`tool.json`,
`bundle/manifest.json`, sealed source/process/seed entries). Read the schema the
CLI returns; do not invent fields. The package contains only the tool's own code
and synthetic seed, never the user's application source.

Remote management MCP does not transfer package bytes or expose upload links.
Use the CLI workflow above for the human-approved upload, retain its original
request key, and wait for inspection to return an immutable implementation ID.
Then use MCP discovery to inspect that version and review, quote and start
its hosted instance. No public publication is needed. If the upload result is
unknown, recover that original request through the CLI or MCP status reads;
do not upload again under a new key.

## Rules

- Tool code is untrusted even if it uses only a standard library. Respect the
  returned size, dependency, egress and resource limits.
- Seed data is synthetic. No real customer rows, real credentials or real contact
  details.
- A tool must not probe cloud metadata, private addresses or other tenants.
- Authentication: a simple service-token binding is fine for ordinary behavior but
  cannot prove an OAuth consent or scope scenario; say which the tool supports.
- API-only tools need no UI preview.
- Pushing a tool and using it in a drill are separate approvals; include it in the
  plan you show the human.
- `firedrill plan` shows how each hosted tool will run. Reviewed catalog versions
  run on shared tool workers. Any other version, including your uploaded package,
  runs in an isolated runtime with its own per-drill run time, cleanup and cost
  ceiling, shown in the estimate before approval. Tell the human which tools are
  isolated. Never swap in a catalog tool silently: a different version is a new
  mapping the human approves in a new plan.

## Reusing tool definitions

An inspected tool version can be shared with another workspace of the same
organization, then copied there into a private version. Sharing passes the
definition only (services, operations, inspection). It never passes a running
instance, session, saved state, credentials or runtime rights, and the recipient
can never edit the source. Obtain the human's approval before every share,
revoke, copy and withdrawal.

- `firedrill tools definitions [--search <prefix>] --json` lists tool versions
  this workspace can read, its own and shared ones, each with
  `owner_workspace_id`, `state` and `can_fork`. `tools definitions show
  <version-id> --json` returns one with its services and inspection.
- A shared version is never used in place: `tools definitions copy <version-id>
  --approve-tool-change --json` copies its exact package (pinned to
  `archive_sha256` and `contract_digest`) into this workspace. Copy only when
  `can_fork` is true. Nothing starts.
- `copied` is not ready. The copy is inspected here like any upload; it is
  usable only when `tools definitions copy-status <copy-id>` shows
  `upload.state` `inspected` with an `upload.implementation_id`, which is the
  new private tool version. Once `copied`, source changes and revocation never
  reach it. While it is still `pending` or `copying`, a revoke or the source
  becoming unavailable stops it as `rejected`.
- Sharing is for an organization administrator of the owner workspace:
  `tools definitions recipients`, `... share <version-id> <workspace-id>
  read|use --approve-tool-change` (`use` also allows copying),
  `... grants <version-id>` and `... revoke <version-id> <grant-id>
  --approve-tool-change`.
- Share and copy print a `request_key` before sending. If the answer is lost,
  rerun with `--request-key <key>` or read it back (`... share-request
  <version-id> <key>`, `... copy-request <key>`). Before deciding differently,
  withdraw the original so it can never land (`... withdraw-share-request
  <version-id> <key>`, `... withdraw-copy-request <key>`, with
  `--approve-tool-change`); one that already landed is shown and kept. A copy
  still `pending` can be stopped with `... withdraw-copy <copy-id>`. Never use a
  new key for an uncertain original.
- `tools definitions dependents <version-id> [--kind world|copy] --json` lists
  this workspace's world revisions using a version, or your copies of it, never
  other workspaces'.
- This is not `tools state ... fork`, which starts a new session from a
  shared-pool instance's snapshot.

## Starting hosted tool instances directly (tool sessions)

A tool session runs up to 32 saved tool versions in the cloud for a set time,
outside any drill. Only versions saved in the workspace can start, and nothing
runs on this machine. Firedrill decides where each selected service runs:
- **Shared pool**: a reviewed catalog service on shared tool workers. Its
  starting data is a seed (`seed_id`).
- **Isolated**: the whole package in its own isolated runtime. This is how an
  uploaded custom package runs. Its starting data is a saved dataset
  (`dataset_id`). A package appears at most once per session.

1. `firedrill tools runnable [--search <text>]` lists saved versions and where
   each of their services would run. If the one the human wants is missing,
   browse `firedrill tools catalog` and save it with
   `firedrill tools save <release-id>`, or push a custom package (see Workflow
   above). Saving starts nothing. Never use `tools add` for this.
2. `firedrill tools start <version-id>... --seconds <n> [--service <key>] --json`
   reviews the selection and prints a `tool_start_quote` maximum. Nothing is
   reserved yet, so show the human that maximum. It lists the shared pool's
   preparation and running time, and each isolated tool's running time.
   - A version with several services needs `--service`.
   - `--file selection.json` takes the exact
     `{duration_seconds, selections: [{implementation_id, service_key, operations, seed_id, dataset_id}]}`
     shape. Set `seed_id` only for a shared-pool service and `dataset_id` only
     for an isolated one; leave both null for the packaged data.
3. Only after the human approves that estimate, run the command printed with
   `tool_change_consent_required`:
   `firedrill tools start --request-key <key> --usage-quote <quote-key> --approve-tool-change`.
   This admits exactly the estimate shown.
   - A session has one estimate. Rerunning with its request key shows that same
     estimate again, and a different quote key is never approved.
   - If the estimate expired (`tool_quote_expired`), nothing was reserved and it
     is never approved. With the human's agreement, close the unused review with
     `firedrill tools session <session-id> stop --approve-tool-change`. Then
     `firedrill tools session <session-id> replace --approve-tool-change` reviews
     the same tools, seeds and duration again under a new request key. Continue
     that review with `firedrill tools start --request-key <new-key>` for its
     estimate and approval. Or start a new selection without `--request-key`.
     `replace` refuses an approved session or one that was not stopped
     (`native_tool_setup_replacement_requires_unused_stop`). If its answer is
     lost, rerun the printed `replace --request-key` command: it returns the
     same review.
   - Never make up a quote key.

   The request key from `tool_start_intent` also continues an interrupted start;
   never start again with a new key. Add `--follow` to wait until every tool is
   running, has stopped, or needs attention.
4. `firedrill tools sessions [--state all|active|preparing|closed]` pages the
   sessions. `firedrill tools session <session-id>` shows each tool's lane and
   state.
5. `firedrill tools access <session-id>` serves the running tools to an agent on
   this machine:
   - one loopback MCP URL (Streamable HTTP) and one operations URL per tool;
   - read-only operations by default;
   - `--allow-writes` only when the human asked for writes.

   Each isolated tool needs its own scoped connection. The connection is kept in
   workspace history, is revoked when access ends, and brings the tool's
   synthetic data to this machine. In JSON mode it needs `--approve-tool-change`;
   add that only after the human agreed. A tool that cannot be connected is
   reported with `tool_access_not_served`, and the others are still served.
   A connection lasts at most as long as its tool and is never renewed: when it
   expires, that tool stops being served (`tool_connection_ended`).

   The operations URL differs by lane:
   - Shared pool: `POST {operation, arguments, idempotency_key?}`. If an
     operation declares an idempotency argument (`_meta`
     `firedrill/idempotency-argument` in `tools/list`), leave it out or set it
     to the call's key; the proxy fills it in. Two different keys are refused
     with `idempotency_key_conflict`, and nothing is sent.
   - Isolated: `POST <operations>/<service_key>/<operation_name>` with
     `{"arguments": {...}}` and an `Idempotency-Key` UUID. Read a call back
     with `GET <requests>/<key>`.

   An operation this access does not include (a write without
   `--allow-writes`, or a name not in `tools/list`) is refused with
   `operation_not_connected` on an operations URL, or error `-32602` on a
   shared-pool MCP URL. Nothing was sent.

   Keep the command running while the agent works. Keep the URLs out of chat,
   files and reports. Access ends with Ctrl-C or when the session ends.
6. `firedrill tools session <session-id> stop --approve-tool-change` stops every
   tool in the session, after the human approves. A stop request is not proof
   that storage is gone. Every member sees the workspace's tool sessions, but only
   the member who started one can stop or extend it; for anyone else the CLI
   refuses stop with `native_tool_setup_owner_only` before sending anything.
   Renewal ownership refusal is `tool_renewal_not_owner`; do not replace the
   request or switch accounts to bypass either boundary.

A running shared-pool tool's data (instance ids from `tools session`) can be
saved or changed with `firedrill tools state <instance-id>`:
- `... checkpoint` saves a snapshot of its data; `... snapshots` lists the
  baseline and each checkpoint.
- `... edit <operation> --file <arguments.json>` runs one of the instance's own
  declared operations against its data, after the human approves
  (`--approve-tool-change` in JSON mode). Nothing undoes it automatically.
- Both print a `request_key` before sending. If the answer is lost, read it
  with `... request <key>`. No record yet does not mean it never arrives:
  run the printed replay, which is the same command with `--request-key <key>`
  (for an edit the human already approved, it also keeps `--approve-tool-change`),
  to recover its original intent, or,
  only if the human decides it must never run, `... withdraw-request <key> --approve-tool-change`.
  Withdrawal blocks a late arrival and returns the original instead if it
  already landed; it never undoes anything. Never resend under a new key while
  the original is unknown: every rerun, including one printed with
  `tool_change_consent_required`, keeps the original `--request-key`.
- Resetting to the baseline or forking from a snapshot creates a new reviewed
  one-tool session. Use `... reset --seconds <n>` or
  `... fork <snapshot-id> --seconds <n>`. Read the returned estimate and obtain
  approval before continuing with its exact `--request-key`, `--usage-quote`
  and `--approve-tool-change`. The original instance is not overwritten.
  `... clone-request <key>` and `... withdraw-clone <key> --approve-tool-change` recover or withdraw
  the original request. Never replace an uncertain request with a new key.
- Isolated tools keep their own state; these commands do not apply to them.

A running session's shared-pool tools can be extended on the same live
session, with the same tools and data and nothing restarted:
`firedrill tools session <session-id> renew --seconds <n>`. It prints a
`request_key`, is reviewed and quoted at once (`tool_renewal_quote`: the new end
time and the maximum cost), and reserves or extends nothing until the human
approves that estimate. In JSON mode it stops with
`tool_change_consent_required` and the exact rerun command: the same
`--request-key` plus `--usage-quote <quote-id> --approve-tool-change`. Never
approve for them, never renew on a timer, and never rerun with a new request
key while the original is unknown. If interrupted, rerun with the printed
`--request-key` (it continues the original and never charges twice), read it
with `... renewal-request <key>`, or, only if the human decides, withdraw it
with `... withdraw-renewal <key> --approve-tool-change` (it undoes nothing). A review the human
declines, or whose estimate expired, is closed with `... cancel-renewal
<renewal-id> --approve-tool-change`; an applied extension is never undone. `... renewals` lists the
history. Only the person who started the session can renew it. Isolated tools
in the same session keep their own end time, and tools inside a drill never
extend the campaign's deadline.

Sessions started before mixed tool setups are still read, stopped and connected
by their id.

Over the remote MCP, review, quotation and admission are separate tools:

- `firedrill_review_tools` reviews the selection, the same review the CLI prints.
- `firedrill_quote_tools` returns the estimate. Show the human its maximum.
- `firedrill_start_tools` admits exactly the estimate the human approved.

None of them supplies consent or combines steps. Obtain the required approval
before admission, just as with the CLI. Continuing an interrupted start and
stopping a session have their own operations; read their schemas from the server.
MCP cannot start a local forwarding process, so `tools access` runs through the CLI.

Codes:
- `tool_change_consent_required`: ask the human, then rerun with
  `--approve-tool-change`.
- `tool_start_unconfirmed`: continue with the printed `--request-key` command.
- `tool_quote_expired`: nothing was reserved. For a `tools start` session, close
  the unused review with `tools session <session-id> stop`, then review it again
  with `tools session <session-id> replace`, or start a new selection without
  `--request-key`. For a reset, fork or renewal, follow the printed command:
  rerun for a fresh estimate, or close the review. Either way, get a new approval.
- `native_tool_access_unavailable`: no tool in the session is running yet, or
  tool access is not enabled for this workspace.
- `native_tool_access_ended` or `native_tool_access_changed`: that tool stopped
  or was reset; run `tools access` again.
- `tool_access_not_served`: one isolated tool could not be connected (the reason
  is given). Nothing was reissued; run `tools access` again later. When it names
  a connection request whose result is unknown, check
  `firedrill tools connections <instance-id>` before anything else.
- `tool_connection_ended`: that isolated tool's connection expired or was
  revoked. Run `tools access` again for a new one if the human still wants it.
- `tool_access_revoke_unconfirmed`: an isolated connection was not confirmed as
  revoked. It ends with the tool; the printed `tools disconnect` command revokes
  it now, after the human approves.
- A call that got no answer may still have taken effect. Never resend it under
  a new key:
  - a shared-pool call: the reply carries the `idempotency_key` the call used
    (over MCP, `firedrill/idempotency-key` in the error data). Resend with that
    same key.
  - an isolated MCP call: resend it with the same request id in the same MCP
    session.
  - an isolated operation: read it back at the requests URL with its
    `Idempotency-Key`, or resend it with that same key.
