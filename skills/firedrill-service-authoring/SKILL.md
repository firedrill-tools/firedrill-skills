---
name: firedrill-service-authoring
description: "Author and qualify a private stateful synthetic dependency for Firedrill when a simulation needs controlled operations, seed data, or modeled time and no suitable saved build exists. Not needed for tool-free application simulations."
---

# Author a private Firedrill service

Model the application's dependency seam, not its decision logic. Inspect the
actual operations it uses, the state transition needed for the scenario and the
limits of the proposed model. Reuse a suitable saved build before authoring one.
Do not imply native vendor protocol fidelity from semantic HTTP/MCP support.

Use the installed `firedrill tools` help and the packaged
[source, manifest, dataset and qualification workflow](references/authoring.md).
That reference includes one complete replaceable example; adapt its semantics
to the user's dependency, not just its names. Read the
[bindings guide](references/services.md) only when attaching the
qualified build to an application or sequence.

Keep source customer-owned and private. Choose explicit upload files and
sanitized seed records; never upload a whole repository, model credentials or
live customer data by implication. An empty dataset means empty state.
Firedrill account authorization belongs to the operator; application/provider
login and narrow synthetic connection grants are separate. Missing permission
requires a human handoff, not another account or an anonymous fallback.

Declare only required capabilities and deterministic operations. Retain actual
state in the supplied state API, and use supplied clock/randomness rather than
ambient process state. A compiled build is not proof of behavior: exercise a
meaningful seeded operation and a negative/unsupported case, inspect retained
history and report the modeled limitations. Do not silently fall back to a live
dependency when the model cannot express the needed behavior.
Keep the synthetic service's reset scope separate from the application's reset
coverage. When binding a service, record known application coverage in optional
`target.metadata`; do not mark databases, caches or conversation memory reset
merely because a synthetic service instance was reset.

Save mutation keys and returned immutable build/dataset IDs before continuing.
Reconcile uncertain actions with their exact original keys and arguments. Stop
only manual instances created for this task; run-owned instances belong to the
runner. Destroy preserves history. No catalog publication, deployment or
application execution is implied by authoring permission.
