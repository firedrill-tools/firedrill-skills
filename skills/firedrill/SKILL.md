---
name: firedrill
description: "Use Firedrill to run bounded simulations of an application or AI agent, vary situations/configurations, and inspect retained behavior and evidence. Applies to observation, demonstrations, evaluation and CI—not only defect finding."
---

# Firedrill

Help the user learn how their actual application behaves. You operate the lab;
the target application is a separate process/callable, not you or a substitute
response you generate. A useful result may be a successful workflow, an unusual
behavior, a comparison or a defect. Checks and synthetic Tools are optional.

## Start with the actual application

Inspect its existing entry point, dependency configuration, completion signal and
state/reset boundary. Prefer an existing command or HTTP task; use the native
Python/TypeScript SDK for a callable. Do not migrate the framework, deploy their
agent to Firedrill or require portal setup. If no safe invocation seam exists,
explain the small adapter needed before claiming you can simulate it.

These instructions work as a host plugin or project skill. Use the installed
CLI/MCP; do not install duplicate skills, change workspace trust or enable tools
just because a skill was loaded. If the client is absent, identify the approved
client installation needed and stop before execution; plugin instructions alone
do not contain an execution client.

After installing the approved CLI in the application repository, use
`npx firedrill init`, `npx firedrill simulate RECIPE.json` and
`npx firedrill result BATCH_ID`. Production is automatic; never supply an API
override, copy development credentials, or retarget a saved development journal.
Do not run bare `npx firedrill` as an installer on a fresh machine: the unscoped
npm name is unrelated. Install the approved `@firedrill-run/cli` release first.

Check the installed CLI help or available operator MCP tools, then read
`firedrill discover --json` / `firedrill_discover` for supported capabilities,
authoring schemas and limits. Read authenticated context and selected
project/environment separately. Respect existing repo configuration.
Missing login is a human-authorization handoff, never permission to borrow another
account, create an anonymous identity or copy a development credential. CI cannot
prompt. Source-development setup is not a released installation path.

Firedrill sign-in authenticates **you as the operator acting for the user**. It
does not sign in to your coding-agent provider or the application under simulation.
Keep that application's model keys and business login separate. Prepared synthetic
Tool grants authorize only their selected run/instance operations; they are not
Firedrill account credentials. Local CLI/MCP/SDK may share the protected,
origin-bound Firedrill login; an explicit CI credential has its own scoped lifetime.

Choose the least machinery that answers the user's question. Before execution,
state the case/configuration/repetition count, real application entry point,
dependency isolation and limits. Start with a small meaningful slice when the
user has not already authorized a larger campaign. Thousands of repeated inputs
are not thousands of distinct situations. Preserve user intent, including a
request simply to observe rather than judge.

## Operate through one path

- For CLI/SDK invocation, repetitions, reports, comparisons and CI, read
  [execution](references/execution.md).
- When the user requests quality evaluation, scoring or assessment-backed CI,
  read [scoring and comparison](references/scoring.md). Do not load grading
  instructions for observation-only work.
- When dependencies need controlled data/state or modeled time, read
  [synthetic surroundings](references/services.md). Do not add Tools to a tool-free
  application. Publish only the explicitly selected synthetic source/data.
- Use operator MCP for scoped preparation and compact inspection when available.
  Admission queues a batch; it does not start code on the user's machine. Follow
  the returned runner instruction or attach the same batch through the CLI/SDK.
  Do not create a second batch to make the first one run.

For an existing batch, `follow` observes only; `run` and unfinished execution
`resume` can dispatch real target work. Select deliberately instead of using
execution recovery as a way to refresh a report. A timed-out observer is not a
failed target, and a settled snapshot is not a passing assessment.
For queue-only preparation, use `submit` and its separate saved submission key.
Reconcile creation with `submit --resume`, not execution recovery. Follow the
receipt's actual target binding; a remote admission cannot launch local code.

A command is an ordinary local process, not a sandbox. Parallel command, HTTP and
native targets need the retained shared-state acknowledgement described in the
execution reference; a new runner cannot add it to an admitted recipe. Use the qualified isolated
adapter only when it is explicitly prepared for the selected source/image. Never
silently fall back to live vendor endpoints or claim a service reset rewinds the
customer's database, model randomness or process memory.
Record known source/reset declarations with optional `target.metadata` rather
than implying unverified repeatability; see the execution reference for its shape.

## Finish with evidence the user can trust

Use retained identities and reports, not terminal success alone. Keep execution,
observed outcome, optional assessment and optional CI gate separate. A completed
run is not proof of a correct answer. An evaluator error is not an agent failure.
Semantic rubric levels allow valid wording variation; exact checks protect hard
constraints. Scores are not probabilities.

Report coverage, important observations, missing evidence and the exact next
action. For repeated trials, show distributions and failed/interrupted/unknown
counts rather than one cherry-picked score. Compare like-for-like populations;
changed Tools, data or evaluator versions matter. Only report screenshots,
traces, external side effects and model usage that were actually captured.
Keep caller-declared exploratory/failure-selected populations distinct from
benchmarks. A `held_out` label alone does not prove unseen or representative data.
Native progress can arrive before completion. It remains runner-attributed
evidence, not a final verdict. Page paired-case evidence when comparing; bounded
summary samples are not the complete population.
For large reports, use compact inspection first and read only cited retained
values through bounded chunks. Omitted is not null or missing evidence; follow
the execution reference instead of rerunning to retrieve existing output.

Preserve recovery handles. Resume the saved operation after an uncertain response;
never reinvoke an uncertain target to repair a report. New execution, reassessment
and reset are distinct actions. Keep secrets out of model context, recipes,
source, logs and target environments; retain journals as private data.
