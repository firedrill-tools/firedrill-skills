# Cloud resources: reuse, author, plan, apply

Worlds, tools, personas, scenarios, evaluations, reports and evidence live in the
Firedrill cloud. The client keeps no simulation library and needs no project file.
Everything you author is a versioned cloud resource the user can also edit in the
web portal.

## What each resource is

- **Tool**: a hosted synthetic dependency with real HTTP or MCP interfaces and
  private per-drill state. The target calls it as it would call the real service.
- **Persona**: reusable synthetic-user characteristics, goals, knowledge and style.
  Its hidden goals stay with the persona.
- **Scenario**: starting conditions, trigger, actors, events, limits and what is
  evaluated.
- **World**: the stateful context and dependency behavior the target operates in.
- **World event**: a change or notification at a time or causal condition (not
  necessarily a chat message).

## Reuse before authoring

1. Search the library for tools compatible with each dependency the descriptor
   lists. Match on protocol, operations, schemas and auth shape, not on a name or
   logo.
2. Search for personas, scenarios and worlds that fit the target's real interface
   and domain.
3. Prefer exact pinned versions of existing private or catalog resources.
4. Author new drafts only for real gaps. If no compatible tool exists, see
   `custom-tools.md`.

Use the CLI or the MCP tools your client lists. Read the exact schema the server
returns before writing a draft; do not guess field names.

- `firedrill library --kind persona|scenario|evaluation [--search <prefix>] --json`
  lists current resources, including exact versions another workspace in the
  organization shared with this one. `library show <version-id>` returns one
  exact version with its definition. `library history <resource-id>` lists
  the versions of a resource this workspace owns.
- Obey each version's `owner_workspace_id`, `can_edit` and `can_use`. Change a
  version only when `can_edit` is true. Reference, fork or bind it only when
  `can_use` is true. A shared version is never editable here; a read-only share
  cannot be used.
- A version with `parameter_schema` declares typed strings or integers at named
  content fields. A world cannot use it directly: the plan reports
  `library_parameters_require_binding`. Choose values from the user's requested
  scenario and clarify ambiguous or sensitive choices, then run
  `firedrill library bind <version-id> --file <values.json|-> --json` with a JSON
  object of parameter names to values. Reference the resulting private version.
  Its `parameter_binding` records the exact values. Parameters are data only:
  no templates, interpolation or code.
- `firedrill library dependents <version-id> [--kind world|scenario] --json`
  lists this workspace's world and scenario versions referencing it, never
  other workspaces' uses.
- A world is declared with `firedrill world save --agent <id> --file <path|-> --json`.
  It binds exact library versions and dependencies to the agent's registered
  descriptor revision (the newest unless `--descriptor-revision <id>` is given).
  Nothing is provisioned or started by saving. The revision it used is printed
  with the request key (`descriptor_revision_id` in `request_prepared`).

## Authoring drafts

- Cover ordinary cases and grounded blind spots, not only the happy path. Ground
  each scenario in something real in the project: a code path, a policy, a
  dependency failure mode, a state edge.
- Do not create a scenario whose only purpose is to pass. Do not copy a hidden
  expected answer into anything the target receives.
- Keep build configuration and runtime configuration separate.
- Default every dependency to synthetic. Mark a dependency as needing real access
  only when the human explicitly grants it for that dependency.
- Validation returns exact field errors. Fix those fields; do not loosen limits.
- Evaluations are `firedrill.native-evaluation.v1`: a rubric with `criteria`, the
  `evidence` it reads and a 0-100 `threshold`. `firedrill.native-evaluation.v2`
  keeps those fields and adds:
  - `dimension`;
  - `memory` probes, which need conversation evidence;
  - a `style` plan;
  - references to exact company policy versions;
  - `exact_checks` over retained evidence;
  - up to 16 `state_records` selections (`dependency`, `collection_key`,
    `before_position`, `after_position`). Each names one baseline record and one
    closing record of an isolated tool's collection, and needs `state_changes`
    evidence.

  Use v2 only for what v1 cannot express. Report a v2 check only once the drill
  report shows its result.
- Scenarios are `firedrill.native-scenario.v1`, `.v2` (adds `target_input`) or
  `.v3`. Older versions stay valid; use v3 only when an event must happen after
  real active time rather than after a completed turn. v3 keeps every v2 field
  and adds:
  - on each event, exactly one trigger: `after_turn` (0 to `max_turns`) or
    `after_active_ms` (0 to 86400000), plus `repeat_every_ms` and `occurrences`.
    A turn event has `occurrences: 1` and no interval. A timed event may repeat:
    2 to 64 occurrences need an interval of 1000 to 86400000 ms, and the last
    occurrence must still fall within 86400000 ms. The whole scenario expands to
    at most 64 occurrences.
  - `evolution`: `{mode: "pause_with_agent", continuation_seconds: 0}` (the
    default to choose: the schedule clock stops when the agent disconnects) or
    `{mode: "world_only", continuation_seconds: 1..86400}`, which lets the world
    keep evolving without the agent within a finite window starting at drill
    readiness, not a fresh allowance on each disconnect. World-only needs the human's
    explicit approval of the reviewed plan, never extends any deadline, funding
    or capacity, and never launches or resumes the agent.
  Active time is measured, never accelerated: do not promise a drill will
  "skip ahead" hours. A timed event far beyond the drill's deadline is reported
  as not applied, not as a pass.
- If the human edited a resource in the portal, you will see a new revision or a
  conflict. Rebase onto it; never overwrite their work.
- Every change is a new immutable version guarded by the revision you read:
  `firedrill library save --kind <kind> --file <path|-> --json` creates a resource;
  `library save <resource-id> --kind <kind> --file <path|-> --expected-revision <n>`
  changes one; `library fork <version-id> --kind <kind> --file <path|->` makes a
  private copy; `library archive|restore <resource-id> --kind <kind> --expected-revision <n>`.
  For a world: `world save ... --world <world-id> --expected-revision <n>`.
- Each change prints a `request_key`. If a call times out or its result is
  unclear, rerun the same command with `--request <key>`: it returns the original
  result instead of creating a duplicate. A `world save` replay must also pass
  the `--descriptor-revision <id>` printed with the key, so it never binds a
  newer descriptor; without it the replay is refused and nothing is sent.

- To declare parameters, save or fork with `--parameters <path|->`: a
  `firedrill.native-library-parameters.v1` document listing 1–16 parameters,
  each with exactly `name`, `path`, `type`, `minimum`, `maximum`, `required`
  and `default`. Without the flag, an existing declaration is kept.
  `--remove-parameters` removes it.

## Sharing library versions

Sharing is between workspaces of the same organization, one exact version at a
time. Only an organization administrator can share or revoke. Obtain the human's
approval for that disclosure or revocation.

- `firedrill library recipients [--search <prefix>] --json` lists recipients.
- `firedrill library share <version-id> <workspace-id> read|use --approve-change --json`
  shares the exact version. `read` permits reading; `use` also permits references,
  private forks and binding. Neither grants source editing or other versions.
- The command prints a `request_key` before sending. If the answer is lost,
  rerun with `--request <key>` or read
  `firedrill library share-request <version-id> <key>`. Do not create a new key
  for an uncertain original.
- `firedrill library grants <version-id> --json` includes revoked grants.
- `firedrill library revoke <version-id> <grant-id> --approve-change --json`
  stops new reads and uses. Previously created private forks and bound copies
  remain recipient-owned. Accepted work is reconciled, not rolled back.

## Reusing world definitions

A world version can be shared with another workspace of the same organization
and forked into a private world there. Sharing passes the closed declaration
only (references and configuration names). It never passes the owner's
descriptor, sources, configuration values, credentials, spending or execution,
and never grants the tools or library versions the declaration references.
Obtain the human's approval before every share, revoke, fork and withdrawal.

- `firedrill world versions [--search <prefix>] --json` lists world versions this
  workspace can read, its own and shared ones, each with `owner_workspace_id`
  and `can_use`. `world version <version-id> --json` returns one with its
  declaration.
- `firedrill world fork <version-id> --agent <agent-id> [--descriptor-revision <id>]
  [--file <declaration.json|->] --approve-change --json` creates a new private
  world bound to this workspace's agent and descriptor revision (the newest
  unless given), pinned to the source's exact digest. Fork only when `can_use`
  is true. Without `--file` the declaration is copied as read; every library
  version, tool version and world item it references must already be usable
  here, or the fork is refused. To use other versions, export `definition` from
  `world version --json`, remap it and pass it with `--file`. Configuration
  values are never copied. The fork is this workspace's own: changes to the
  source world version and revoking its share never reach it. Shared library
  versions the declaration references directly keep their own grants: if one
  is revoked or archived, using the fork is refused
  (`native_library_reference_unavailable`) until it is replaced.
- With `--request <key>`, an original fork already made under that key is
  shown as recorded. It keeps the agent, descriptor revision and declaration it
  was created with. The flags given now are not applied
  (`submitted_change_confirmed: false`), so inspect it before continuing.
- Sharing is for an organization administrator of the owner workspace:
  `world recipients`, `world share <version-id> <workspace-id> read|use
  --approve-change` (`use` also allows forking), `world grants <version-id>`
  and `world revoke <version-id> <grant-id> --approve-change`.
- Share and fork print a `request_key` before sending. If the answer is lost,
  rerun with `--request <key>` or read it back (`world share-request
  <version-id> <key>`, `world fork-request <key>`). Before deciding differently,
  withdraw the original so it can never land (`world withdraw-share-request
  <version-id> <key>`, `world withdraw-fork <key>`, with `--approve-change`);
  one that already landed is shown and kept. Do not create a new key for an
  uncertain original.
- `world dependents <version-id> [--kind fork|campaign] --json` lists this
  workspace's forks of a version or its campaigns planned from it, never other
  workspaces'.
- A tool's archive or state fork is different (see `custom-tools.md`).

## Plan and apply

`firedrill plan --world <world-id> --json` reviews the world's newest declaration
(or `--world-revision <id>`) and returns a plan ID plus an effect-free review:
changes since the previous declaration, the number of requested drills, whether
drills must run serially, unresolved requirements (`gaps`), real-access grants
still needed and the gates apply will check (capacity, funding, local driver
approval, dependency binding, baseline, real-access grants). A review allocates
nothing, starts nothing, spends nothing and expires after a short window; create a
new one if it expired. Resolve every gap first: apply refuses a plan with gaps.
`firedrill plan show <plan-id>` rereads a saved review. To replay a plan request
with `--request <key>`, also pass `--world-revision` with the plan's
`world_revision_id`; without it the replay is refused rather than reviewing a
newer declaration.

Show the human, in plain language:

- Cloud resources created or changed.
- The exact resolved library values in `parameter_bindings`, since they determine
  what the drills say and check.
- Any real access requested, per dependency.
- Budget: the plan's `estimate` (present when the review has no gaps): the maximum
  cloud work in `denomination` (`maximum_units / credit_scale`), split per component
  as Firedrill lists them, for example:
  - participants, with their step and model limits;
  - evaluation;
  - tool state and tool preparation;
  - isolated custom tools (`isolated_limits`), with each tool's run time per drill,
    cleanup ceiling, CPU, memory and disk.

  It reserves nothing, expires, and never charges the target's own local compute.
  When it shows `reservation_policy: baseline_then_admitted_drills`, apply holds
  only `initial_reservation_units` (the baseline) at first. Each drill reserves its
  share when it is admitted, so the maximum is a ceiling, not an upfront hold. If `estimate_error` is set instead, say the estimate is
  unavailable; `apply` fetches a fresh one (`plan_estimate`) before it acts and
  stops if it cannot.
- What will not be covered (unsupported driver, state that cannot be reset).
- Scenario timing, when the review lists `evolution` (v3 scenarios): each
  scenario's timed events and whether its schedule pauses with the agent or
  continues `world_only` for `continuation_seconds`. A world-only continuation
  adds the `world_continuation_approval` gate and is approved by approving this
  plan, so say it plainly: the world keeps changing without the agent for at
  most that long, within the same deadline, funding and capacity.
- The local commands and roots from the local plan (see `local-execution.md`).

Only after an explicit yes: `firedrill apply <plan-id> --approve --follow --json`. Apply is
one resumable operation:

1. `plan_estimate`: the fresh estimate the approval covers.
2. `apply_request`: printed before anything is sent, with the `recovery_command`.
3. `apply_operation`: the preparation and its state (`accepted`, `queued`,
   `provisioning`, `reconciling`, then `ready`, `failed` or `cancelled`). None of
   these states lets a target start; only `ready` lets the campaign be created.
4. `campaign_created`: the campaign id and the drills allocated, none started. Next
   comes `firedrill run ... --campaign <campaign-id>` on this machine.

Without `--follow`, apply returns after the first state and prints `apply_pending`
with the command to check again. If it is interrupted or ends with
`native_apply_unconfirmed`, run the printed `recovery_command`: with `--request`
it reads the original preparation, with no second approval or charge.
If no preparation is recorded under the key yet (the original may not have
arrived), it shows the same estimate again (fresh quotes only if those expired)
and stops with `apply_approval_required`. Ask the human, then rerun it with
`--approve`. The request goes under the same key, so the service applies and
charges it at most once; if the original lands first, the rerun shows that
preparation. Do not start a second apply without `--request`.

If the human no longer wants a preparation that is ready and has no campaign
yet, `firedrill apply <plan-id> --request <key> --cancel` cancels it after they
approve (`--approve` in JSON mode). It releases the unused reserved run
credits; preparation usage is already settled, and the prepared data is kept
until normal retention removes it, so do not describe it as deleted. Rerunning
the same command recovers the original cancellation (an `apply_cancelled`
receipt or an `apply_operation` already marked cancelled) rather than creating another. A preparation that already has
a campaign is cancelled through `firedrill simulation cancel <campaign-id>`
instead; one still preparing must be ready first.

Never approve a budget, top-up or payment on the human's behalf.
