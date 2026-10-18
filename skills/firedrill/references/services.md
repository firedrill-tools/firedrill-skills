# Controlled surroundings

Replace only the external seams the actual application uses. Inspect the selected build's operations, schemas, dataset and fidelity before binding it. Canonical semantic HTTP/MCP is not automatically the external service's native API. Make any application adapter explicit; never fall back to a real endpoint for an unsupported operation. Tool-free simulations remain valid.

## Acquire an existing qualified Tool when it fits

Read `firedrill tools catalog --json` or operator MCP `firedrill_service_read`
with `request.action="catalog"` and the selected project/environment. Inspect the
exact release's operations/fidelity; do not infer native provider REST or a vendor
UI from its name. Catalog metadata is not another tenant's private source/data.

Save the selected catalog ID, returned `releaseDigest`, explicit `empty|starter`
data choice and intended stable key before acquisition:

```sh
firedrill tools acquire "$CATALOG_ID" --release-digest "$RELEASE_DIGEST" \
  --data starter --idempotency-key acquire-surroundings-1 --json --non-interactive
firedrill tools acquisition --idempotency-key acquire-surroundings-1 --json
```

An interactive terminal may use `tools acquire --idempotency-key KEY` and radio
choices instead. SDK equivalents are TypeScript `services.catalogRelease(id)` /
`services.acquire({catalogId,releaseDigest,initialData}, key)` and native Python
`services.catalog_release(id)` /
`services.acquire(id, release_digest=..., initial_data=..., idempotency_key=...)`.
Python async uses the same methods with `await`.

Operator MCP `firedrill_service_acquire` takes the same exact selection plus scope
and `operationKey`, requiring `services:publish`. It publishes project-owned
build/dataset IDs only; no instance, credential or target is started. Inspect
`catalog_acquisition` or `catalog_acquisition_by_key` after uncertain delivery;
never silently fall forward to a newer release or issue a replacement operation.
Only a `ready` receipt's IDs should enter the binding below. The run runner still
owns per-case allocation, connection grants and cleanup.

If no suitable catalog/private build exists, use [authoring a private stateful service](authoring.md). That reference contains complete source/manifest/seed files and exact publish, seed, invoke, history and destroy commands. Source/data stay private; publication to a public catalog is a separate decision. Do not upload an inferred repository or credentials. No Tool is required for tool-free simulations.

## Pin surroundings in the recipe

A `services` binding selects immutable `buildId`, optional `datasetId`, unsigned decimal-string `seed`, explicit operation IDs and a stable alias. These are not an instance ID or secret. `scenario.serviceDatasets` can override a dataset for a declared alias. No dataset means empty state, not fabricated sample records.

Read the selected dataset's validation receipt and optional caller-declared
provenance/mappings when those facts matter. The receipt separates namespace
schema, explicitly declared data constraints and exact cross-dataset version
checks; none establishes real-world fidelity. Omitted historical receipts or
provenance mean not recorded, not clean/synthetic/authorized by inference.

Python native example, using the printer build/dataset returned by the authoring workflow:

```python
from firedrill import Firedrill

client = Firedrill.from_config()
recipe = {
    "name": "Application with controlled printing",
    "services": [{
        "alias": "printer", "buildId": build_id, "datasetId": dataset_id,
        "seed": "42", "operations": ["status", "print"],
    }],
    "scenarios": [{
        "id": "handout", "name": "Three-page handout",
        "input": {"jobId": "handout", "pages": 3},
    }],
}

def application(input, context):
    printer = context.tools["printer"]
    response = printer.invoke("print", input, idempotency_key=f"{context.run_id}:print")
    return response["result"]["outcome"]

result = client.simulate(recipe, application)
print(result.report_url)
```

This callback is a small actual application seam for the example, not an AI model. For the user's application, call its existing entry point and route its dependency through the prepared binding. Preserve its real decision logic; do not replace it with the expected answer. Python async targets use `await context.tools[alias].invoke(...)` inside `AsyncFiredrill`.

TypeScript callbacks have the same `(input, context)` shape. Use `context.tools.printer.invoke("print", input, { idempotencyKey: context.runId + ":print" })` and inspect `response.result.outcome`; invocation success is not an assessment verdict.

Each scenario/configuration/repetition receives fresh state. Two aliases using one build still get independent instances. SDK/runner preparation supplies only this run/attempt's short-lived allowed operations. The runner closes those instances after completion/cancellation; do not manually reset/destroy run-owned instances from a separate workflow. Retained run-managed closure is `instance.run_retired`, distinct from a manual `instance.destroy` action.

## Command and HTTP targets

An existing command needs no Firedrill SDK. Choose literal argv, for example `{"kind":"command","argv":["python3","target.py"]}`; resolve its explicit working directory as needed. The runner writes a JSON envelope to stdin and consumes stdout as the result (valid JSON remains JSON). Do not print the envelope or connection secrets. HTTP targets receive the same envelope as their request body, with no operator Authorization header.

Envelope shape (IDs/URLs/tokens below describe fields, not reusable values):

```json
{
  "schemaVersion": "2026-10-17-target-invocation.1",
  "input": {"jobId": "handout", "pages": 3},
  "scenario": {"id": "handout"},
  "configuration": {"id": "default", "parameters": {}},
  "runId": "<this run>",
  "attemptId": "<this attempt>",
  "tools": {
    "printer": {
      "instanceId": "<run-owned instance>", "epoch": 0,
      "buildId": "<pinned build>", "datasetId": "<pinned dataset>",
      "seed": "42", "operations": ["status", "print"],
      "connections": {
        "http": {"id": "<grant>", "audience": "http", "url": "<exact scoped operation URL>", "token": "<ephemeral secret>", "expiresAt": "<timestamp>"},
        "mcp": {"id": "<grant>", "audience": "mcp", "url": "<exact scoped MCP URL>", "token": "<ephemeral secret>", "expiresAt": "<timestamp>"}
      }
    }
  }
}
```

The optional sequence `step` field is `{id,ordinal}`. `scenario` is correlation
only, never the retained scenario definition. Checks, rubric, metric selectors,
dataset references and future sequence steps stay with the controller/evaluator.
Put only knowledge intended for the application into explicit `input`.
Use the advertised `target-invocation` schema when writing an adapter.

The epoch is the actual current epoch, not always zero. `FIREDRILL_INPUT_JSON`
contains JSON of `input` only; it is not the full envelope. Run/attempt IDs have
separate environment variables. Operator `FIREDRILL_TOKEN`/`FIREDRILL_CREDENTIAL`
are removed from command environments. Customer model configuration remains
customer-owned. Native callbacks share a process and commands have the customer's
filesystem; this reduced handoff is not a hostile-code sandbox.

Use the returned connection URL unchanged, including its scope query, and the corresponding derived grant—not an operator token or lease. Semantic HTTP invocation is `POST` with `Authorization: Bearer <derived token>`, an explicit stable `Idempotency-Key`, and `{"operationId":"print","arguments":{...}}`. Unlike manual control, the grant carries the epoch; do not add a caller-selected epoch to this body. The response is a service action whose `result.outcome` is the semantic result. HTTP200 alone does not establish outcome success.

When a build also declares authored HTTP routes, use its exact returned scoped
route base and declared method/path/body. That adapter invokes the same canonical
service operations/state; it does not promise undeclared native provider APIs.
Keep its transport credentials outside authored codec inputs and evidence.

### target.py

Save this small adapter as the literal command target. It uses only the prepared HTTP grant, rejects redirects and bounds its response. Adapt the dependency seam, not the application's decision logic.

```python
"""Example application adapter: consumes only its explicit scoped HTTP binding."""
import json
import os
import sys
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *_args, **_kwargs):
        return None


envelope = json.load(sys.stdin)
assert "FIREDRILL_TOKEN" not in os.environ and "FIREDRILL_CREDENTIAL" not in os.environ
connection = envelope["tools"]["printer"]["connections"]["http"]
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())


def invoke(operation, arguments, key):
    request = urllib.request.Request(
        connection["url"], method="POST",
        data=json.dumps({"operationId": operation, "arguments": arguments}).encode(),
        headers={"Authorization": "Bearer " + connection["token"],
                 "Content-Type": "application/json", "Idempotency-Key": key},
    )
    # Do not retry an uncertain mutation or follow a redirect with its grant.
    with opener.open(request, timeout=10) as response:
        raw = response.read(1024 * 1024 + 1)
        if len(raw) > 1024 * 1024:
            raise RuntimeError("Tool response exceeded adapter bound")
        return json.loads(raw)["result"]["outcome"]


printed = invoke("print", envelope["input"], envelope["runId"] + ":print")
status = invoke("status", {}, envelope["runId"] + ":status")
print(json.dumps({"print": printed, "status": status}))
```

This command performs real declared operations and prints their actual outcomes. It does not invoke a model or make a precomputed verdict. Native explicit exports are Python `tool.export_connection("http" | "mcp")` and TypeScript `tool.connection(...)`; ordinary object/JSON representations omit secrets. Explicit exports and command/HTTP envelopes are intentional secret-bearing delivery surfaces: never log or journal them yourself.

## Manual exploration and recovery

For deliberate manual exploration, use the authoring workflow's `tools create` with exact build/dataset/seed/allowed operations and a bound TTL. Inspect `tools get` and paged `tools history`. Manual invoke uses the creating credential and exact current epoch. An optional UI requires an actually declared view and fresh explicit UI grant; stopped instances have retained history, not a working live URL. Keep exported connection secrets in protected output, not model context or ordinary CLI/MCP output.

Save keys before mutation and reconcile the exact original input after an unconfirmed response; never silently choose a new key, epoch, instance or batch. A confirmed Tool error is distinct from an unconfirmed transport result. Preserve the simulation `operationId`/`operation_id` for resume; uncertain target invocation must not be repeated just to repair evidence.

## Evolving state and boundaries

Use `scenario.sequence` (`schemaVersion:"2026-10-14-sequence.1"`) when state must evolve across target calls. Supported steps invoke the target or declared service, wait with bounded attempts, snapshot, advance modeled time, or restore the same service's earlier snapshot. Conditions refer to an earlier retained result, not arbitrary server-side workflow code.

`advance_time.toUs` is modeled microseconds with bounded event processing. It does not make real provider jobs, OS timers or customer processes skip days. A snapshot restore rewinds that synthetic service's retained state, modeled clock, pending work and PRNG state, advances its epoch and invalidates old grants while preserving history. A sequence restore uses `boundary:"service_only"`; later target steps receive refreshed bindings. For manual instances, `tools rewind` is the convenience alias for the existing snapshot-reset action, with the same epoch and saved idempotency key requirements. None of these actions rewinds target memory, the customer's database or model randomness. Use an explicit application reset seam if a broader reset is required.

Source publication, manual action keys and run lifecycle identities are separate. Purpose labels and runner observations establish attribution, not proof that an AI model authored a call. Use retained state/events/captures to explain what actually happened, and keep execution, outcome, assessment and optional gate distinct.
