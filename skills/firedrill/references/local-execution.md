# Local execution: descriptor, plan, approval, run

The target runs on the user's machine as normal trusted processes. Docker is not
required. Native mode is not a sandbox.

## 1. Inspect

With your own approved read and search tools, find:

- **Source roots**: each repository or directory involved.
- **Services**: the agent itself plus anything it needs locally (frontend, worker,
  database, queue). For each: how it starts, its working directory, its port, what
  it depends on, and its configuration names (build vs runtime, secret or not).
- **Entry service and interface**: what a real user or caller actually talks to.
  This picks the driver profile (see `drivers-and-state.md`).
- **Dependencies**: every external API, SDK client and MCP server it calls.
- **State**: conversation history, memory, files, databases, vector stores,
  caches, queues, schedulers, sessions.
- **User authentication**: anonymous, its own account system, or something else.

## 2. Register a sanitized descriptor

The descriptor (`firedrill.local-descriptor.v1`) holds only:

- Source roots as `{alias, identity_sha256}`. Never an absolute path.
- Services as alias, root alias, role (`agent`, `frontend`, `worker`, `database`,
  `queue`, `service`), dependencies on other services, and configuration
  `{name, phase, secret, required}`. Names only, never values.
- The entry service and the driver `{profile, adapter_sha256, authentication,
  state_domains}`.
- State domains (see `drivers-and-state.md`).
- Dependencies as `{alias, service_alias, protocol: http|mcp, mode:
  synthetic|real-grant-required, operations}`.

No source code, no file contents, no secret values, no home-directory paths. The
cloud's normalized result and digest are authoritative. Pass the descriptor to
`firedrill run --descriptor <path|->`; like the plan, it can come from a file
outside the repository or from stdin.

## 3. Write the local plan

The local plan is a JSON document you write for this session. It does not need to
live in the repository; keep it out of version control. It contains:

- `roots`: alias, local path and identity hash. Local paths stay on this machine;
  the cloud only learns the plan digest computed with paths replaced by aliases.
- `services`: for each, `mode` `launch` (Firedrill starts and owns it) or `attach`
  (already running; Firedrill only checks readiness and never stops it).
  - `command`: argv only, `{executable, args}`. No shell strings, pipes,
    redirection, `&&` or expansion.
  - `cwd`: relative to its root, staying inside it.
  - `env_passthrough`: names of user environment variables it may inherit.
    Everything else is stripped, including live credentials not supplied by a
    binding.
  - `env_static`: fixed non-secret values only.
  - `readiness`: `http` (loopback URL and accepted statuses), `tcp` (port),
    `stdout` (pattern) or `none`, with a timeout.
  - `per_drill` and `port_env` when each drill needs its own copy and port.
  - `dependency_env`: for each synthetic dependency the service calls,
    `{alias, name, url: invoke|mcp}`. At run time `name` receives a private
    loopback URL to the hosted synthetic tool (its HTTP invoke endpoint or its
    MCP endpoint). No token or credential ever reaches the target. Only a
    per-drill launched service can carry routes, and every synthetic dependency
    must be routed. `mcp_config_env` names the variable that receives a run-scoped
    MCP configuration file pointing at the same loopback URLs.
- `driver`: the driver plan for the chosen profile.
- `state_hooks`: approved reset hooks, each pinned by sha256 with argv runtime.
- `max_parallel_drills`: forced to 1 if any state domain is serial.

Prefer documented configuration overrides (base URL, MCP config, ports) over code
edits. If a connection change is unavoidable, make it in an approved working copy,
never in the user's main checkout without consent, and never as a behavior fix.

## 4. Approval

Show the human exactly what will run: every argv, root, working directory, env
name, hook file and its hash, and which services are attached vs launched. Wait
for a clear yes.

In JSON mode, `--approve` records that yes for that exact plan. Any change to argv
or to a hashed file (wrapper, flow, hook) changes the digest and voids approval
(`native_plan_changed`); show the change and ask again.

## 5. Run

Check drivers first with `firedrill status --plan <path|-> --json`. Drills run on
an enrolled runner device. A runner belongs to one terminal sign-in and workspace on
this machine: if there is none for the current sign-in, the human enrolls one with
`firedrill runner enroll` (a device identity, not permission to execute). A new
sign-in (for example after `firedrill logout`) needs a new enrollment, and a runner
expires when its sign-in ends or after at most 30 days.
Then `firedrill run --plan <path|-> --descriptor <path|-> --campaign <campaign-id> --json`
(add `--approve` only after the human's yes) starts the companion. Only one of the two
may come from stdin. With several usable runner devices, ask the human which one and
pass `--runner <device-key>`; the run emits `runner_selected` with the device it uses.
In session-only mode (headless machines without an OS credential store), the
run first looks for a usable enrolled identity. If none is available, a
session-only `run` enrolls one for that session after consent. Its private
key stays in the run's memory and is discarded when the run ends. It asks first, or,
in JSON mode, needs `--enroll-device`, which you add only after the human agrees.
`--campaign` is required: a run takes only that campaign's drills, both those already
offered to this device and the campaign's waiting ones. It keeps one outbound channel
with the service for that campaign, and the service's notices on it wake the run
instead of polling. A notice is never a command: every claim, step and close is still
the run's own signed request. If the service refuses the channel (access changed) or
another companion holds it, the run prints `native_channel_held` and takes no drill or
step until `native_channel_resumed`. It:

- connects outbound to the cloud, accepts only drills whose descriptor matches the
  approved local plan (`native_descriptor_mismatch` means a drill runs a different
  descriptor, so it was declined and nothing started),
- after accepting, waits (`native_drill_waiting`) until the service has prepared
  the drill, and starts nothing locally before `native_drill_started`,
- starts or attaches services in dependency order and checks readiness,
- points routed dependencies at the drill's loopback route to the hosted
  synthetic tools (only operations the descriptor declares are forwarded),
- applies per-domain resets, reports readiness (`native_drill_admitting` until the
  service admits the drill), drives the target, and streams observations,
- stops only the processes it started, on completion, cancel or interrupt,
- then closes the drill with the service: a signed record of how each declared
  service ended (a launched process reaped, with its exit code, or an attached
  process only detached). `native_drill_finished` with `completion: reported`
  means the evidence is frozen; scoring and settlement are still the service's.
  Its `ending_reason` says why the input ended: `participant_finished`,
  `participant_gave_up`, `turn_limit`, `inputs_exhausted`, `target_failed`,
  `target_cancelled`, `delivery_acknowledged` or `participant_unavailable`. It is
  not a result: none of them is a pass, and only the report judges.
  `participant_unavailable` means Firedrill could not generate the simulated
  participant's next message in time. The drill ends incomplete
  (`native_participant_unavailable`) and says nothing about the agent: tell the
  human it was an infrastructure stop and run a new drill. The service decides coverage: only a
  finished participant or delivered inputs, with every scheduled scenario event
  applied, can be complete. A participant who gave up, a turn limit, an event
  whose work was not observed (`delivery_acknowledged`) or an unreached scheduled
  event is partial, and the finished line says so. A scenario with timed events
  waits for them while nothing else is offered; the finished line names the
  next timed event and the active time that had run when a drill stopped
  first. When the agent disconnects, the schedule clock pauses unless the
  approved plan allows a world-only continuation; an expired runner never
  resumes on its own and needs a new approved drill. `target_failed` ends the drill
  as failed and `target_cancelled` as cancelled, as the target reported them.
  If the service fenced the drill (its lease expired or it was revoked), a
  cleanup-only report is sent instead (`native_cleanup_reported`); it completes
  nothing.

Shared services (launched once, not per drill) belong to the campaign's local
run on this device. They need `--campaign`, a campaign that runs one drill at a
time, and state domains that are serial and reset by a fresh session or an
approved hook; otherwise the run stops before anything starts. Such a service
starts once and is never restarted: if it ends, this device takes no more of the
campaign's drills. When the companion stops, it reports how each shared service
ended and closes the run (`native_local_run_closed`), waiting a few minutes for
the service to seal this device's drills. If this machine lost its record of the
run, the companion continues from the service's record for the same plan
(`native_local_run_recovered`); it never relaunches a process from that record.

It never kills unrelated processes or frees a port by force. Do not edit the
target while it runs.

Common stops and what to do:

| Code | Meaning | Next step |
| --- | --- | --- |
| `native_plan_unapproved` | No approval for this plan | Show plan, get a yes |
| `native_plan_changed` | A command or hashed file changed | Show the diff, re-approve |
| `native_root_outside` | A path escapes its root | Fix the plan; never widen the root silently |
| `native_readiness_timeout` / `native_process_exited` | Target did not start | Read bounded output, fix config with the human |
| `native_driver_unavailable` | Driver prerequisite missing | Tell the human what to install; do not install it unasked |
| `native_state_unsupported` | A state domain cannot be isolated | Serialize or mark coverage incomplete |
| `runner_required` | No usable runner for the current terminal sign-in on this machine (none enrolled, enrolled under an earlier sign-in, or expired); nothing started | Ask the human to run `firedrill runner enroll`, then rerun `run`. In session-only mode, rerun `run`: it enrolls a new session-only runner after consent |
| `runner_consent_required` | Enrolling a runner needs the human's consent: in JSON mode or without a terminal, `runner enroll` and a session-only `run` that found no runner ask for `--enroll-device`; nothing was enrolled or started | Ask the human; add `--enroll-device` and rerun only after they agree |
| `runner_scope_changed` | `--runner` named a runner enrolled under another terminal sign-in or OS/architecture, or one revoked; nothing started | Rerun without `--runner`; if that reports `runner_required`, ask the human to run `firedrill runner enroll` |
| `runner_ambiguous` | Several runner devices are usable | Ask the human which one; pass `--runner <device-key>` |
| `native_campaign_required` | `run` was started without `--campaign` | Pass the campaign id from `campaign_created`; nothing started |
| `native_channel_held` | The service refused this runner's campaign channel (access changed), or another companion holds it | Nothing new runs until `native_channel_resumed`. If it persists, check the human's access and that no other `firedrill run` uses this runner |
| `native_descriptor_mismatch` / `native_plan_changed` | A drill or campaign runs a different descriptor than the approved plan | Tell the human; nothing started. Approve a plan for that descriptor only if they want it run |
| `native_drill_not_prepared` | The service did not prepare an accepted drill in time | Nothing started locally; the client requests withdrawal (`native_drill_withdrawn`). Cloud cleanup or reservations may still be pending. Watch the original campaign and recovery state before starting more work |
| `native_close_shared_service` / `native_close_service_not_launched` / `native_close_process_running` | The drill ran but how a service ended could not be stated truthfully (a shared service outside a local run, a service a completed drill never reached, or a process still running) | Tell the human; evidence stays with the service, do not retry the drill |
| `native_execution_close_pending` / `native_step_report_failed` | A target action was still open when the drill stopped, so the service did not accept the close | Tell the human; the service reconciles it, do not retry the drill |
| `native_stop_unconfirmed` | The service did not confirm the drill's stop, so no close was sent | Tell the human; the service reconciles it, do not retry the drill |
| `native_readiness_service_missing` / `native_readiness_unattested` / `native_readiness_evidence_missing` | The drill could not report itself ready (a service not running, an entry probe with nothing to attest, or reset evidence refused) | Read bounded output, fix the plan or target with the human |
| `native_readiness_limit` / `native_state_unsupported` | Too many services or local state domains, or a local domain this client cannot reset | Fix the descriptor or plan; nothing started |
| `native_binding_invalid` | A synthetic dependency has no valid route, needs a real grant, or is routed on a shared or attached service | Fix `dependency_env` in the plan and re-approve |
| `native_dependency_unavailable` / `native_dependency_changed` | The hosted tool gateway is not available, or the drill's tool binding changed mid-drill | Tell the human; do not retry until the service is available |
| `native_local_run_serial_required` / `native_local_run_reset_required` | Shared services need a one-drill-at-a-time campaign and resettable serial state | Use serial execution with supported reset state, or make those services per-drill; nothing started |
| `native_local_run_registration_closed` | The campaign already started, so its shared services can no longer be registered on this device | Use a new campaign, or make the services per-drill |
| `native_local_run_persistent_runner_required` | The plan has shared services for the whole campaign, but this session-only run would enroll a runner whose key lives only in its memory, and only the registering runner can close them; nothing was enrolled or started | Ask the human to enroll a runner this machine keeps (`firedrill runner enroll`, which needs the OS credential store), or make the services per-drill (`per_drill: true`) |
| `native_local_run_service_ended` / `native_local_run_uncertain` / `native_local_run_closed` | A shared service ended (or its end is unknown), or the run on this device is closed: no more of the campaign's drills here | Tell the human; read bounded output; use another campaign |
| `native_local_run_unrecoverable` | The run on this device was registered for a different plan, or shared services were left running by an earlier companion | Tell the human; stop any leftover processes they started; use another campaign |
| `native_local_run_close_pending` / `native_local_run_close_refused` | The run was not closed yet (drills still being sealed, or the close was not confirmed). Its original device key and saved exit observations remain necessary | Read `firedrill runner run-cleanup <device-key> <campaign-id>`. After the human approves reporting saved closing evidence, add `--approve-change`. This works after a new sign-in with current workspace write access and the original non-revoked persistent device key. It never launches, stops or guesses processes. If service termination is unknown, the run stays unresolved; do not claim the cloud can infer cleanup |
| `native_cleanup_unreported` | The service fenced the drill and the cleanup-only report was not confirmed | Tell the human; the service reconciles it |
| `native_target_failed` / `native_target_cancelled` | The target's own task or event result said it failed or was cancelled; the service kept that result | Tell the human what the target returned; it is evidence, not a Firedrill error |
| `native_step_withdrawn` (event) | A claimed input never reached the target (`reason`: `client_refused` on this machine, or `not_delivered`), so the client withdrew its claim with a signed declaration and the drill ended; `error_code` says why | Tell the human the `error_code`; it is not the target's failure. A runner-side halt (`native_stream_disconnected`, `native_budget_exhausted`, `native_lease_expired`, a dependency stop, or the drill or companion stopping) needs no fix: run a new drill. Otherwise (`client_refused`, or the driver could not deliver the input) fix the plan or target with the human first |
| `native_step_withdraw_failed` (event) | That withdrawal was refused or unanswered | Inspect the original drill and cleanup status. Do not repeat the target action or claim that cleanup has settled |
| `native_target_action_invalid` / `native_target_completion_invalid` | This client refused malformed target-action identity or evidence; nothing was sent | Report the client error. Preserve original recovery; do not invoke the target again. |
| `runner_receipt_invalid` | The runner record has no routable device identity | Inspect the original runner registration before running again. |
| `native_contract_pending` | This part is not available in this version | Tell the human; do not improvise |
