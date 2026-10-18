# Author a private stateful service

Use this when the application's needed dependency has no suitable saved build. Model only the operations and behavior the scenario needs. Use the installed client against the service origin in the release handoff; this reference does not establish registry or service availability.

## Source contract

For a new private source directory, `firedrill tools init NEW_DIR --id my-service
--json --non-interactive` writes an explicit generic records scaffold and
intentionally empty seed. It reads no credentials and performs no upload, build,
runtime allocation or conformance execution. Review and adapt the generated
source/manifest/fixtures to the application's real dependency before the separate
authenticated publication. Existing destinations and unsupported scope/mutation
flags are rejected; partial local files are preserved after an interrupted write.
The scaffold is an opt-in teaching starting point, not a default Tool or fidelity
certification. Read its generated next-command receipt instead of guessing paths.

Save these files in a dedicated `printer/` directory. This is a replaceable teaching fixture, never a product default. It models one sheet per page and durable job uniqueness—not physical printing, printer protocols, jams or throughput. Its `stateful` label is authored, not a fidelity certification.

Source uses one default `defineToolBehavior` export whose operation IDs match the manifest. Only `@firedrill/service` and selected relative source imports are admitted. The publication builder resolves `@firedrill/service`; do not install or import private runtime/kernel/store/host code. Include every relative import in the explicit upload list. No npm dependencies, install hooks, ambient tsconfig, Node built-ins, filesystem, network, environment or provider keys are supplied.

Handlers are synchronous and return JSON, not Promises. State belongs in `context.state`, not mutable module globals:

- `get(namespace,rowId)` returns an object or `null`; `scan(namespace,{afterRowId,limit})` returns `{rowId,value}` records.
- `put(namespace,rowId,value)` stores the complete object; `delete(namespace,rowId)` removes one row. Declare `state.read`/`state.write` as needed.
- Expected failures use `context.fail({code,message,retryable?})`, with the code in that operation's `declaredErrors`. Input/output/state must match their JSON schemas.
- Optional `context.clock.nowUs()`, `context.random`, `context.events.emit` and `scheduleAt` require `clock.read`, `random.draw`, `event.emit` and `clock.schedule` respectively. Declare event payloads and same-service subscriptions before using them. `Date.now()` and `Math.random()` cannot supply ambient time/randomness.

### manifest.json

```json
{
  "schemaVersion": 1,
  "id": "metered-printer",
  "version": "1.0.0",
  "engine": "^0.1.0",
  "capabilities": ["state.read", "state.write"],
  "state": [
    {
      "namespace": "stock",
      "schema": {
        "type": "object",
        "properties": {
          "remaining": {"type": "integer", "minimum": 0},
          "completed": {"type": "integer", "minimum": 0}
        },
        "required": ["remaining", "completed"],
        "additionalProperties": false
      }
    },
    {
      "namespace": "jobs",
      "schema": {
        "type": "object",
        "properties": {"pages": {"type": "integer", "minimum": 1}},
        "required": ["pages"],
        "additionalProperties": false
      }
    }
  ],
  "operations": [
    {
      "id": "status",
      "inputSchema": {"type": "object", "properties": {}, "additionalProperties": false},
      "outputSchema": {
        "type": "object",
        "properties": {
          "remaining": {"type": "integer", "minimum": 0},
          "completed": {"type": "integer", "minimum": 0}
        },
        "required": ["remaining", "completed"],
        "additionalProperties": false
      },
      "declaredErrors": ["UNSEEDED"],
      "idempotency": "none",
      "fidelity": "stateful"
    },
    {
      "id": "print",
      "inputSchema": {
        "type": "object",
        "properties": {
          "jobId": {"type": "string", "minLength": 1, "maxLength": 120},
          "pages": {"type": "integer", "minimum": 1, "maximum": 1000}
        },
        "required": ["jobId", "pages"],
        "additionalProperties": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "jobId": {"type": "string"},
          "remaining": {"type": "integer", "minimum": 0}
        },
        "required": ["jobId", "remaining"],
        "additionalProperties": false
      },
      "declaredErrors": ["UNSEEDED", "JOB_EXISTS", "OUT_OF_PAPER"],
      "idempotency": "required",
      "fidelity": "stateful"
    }
  ]
}
```

### service.ts

```ts
import { defineToolBehavior, type ToolContext } from "@firedrill/service";

function stock(context: ToolContext) {
  const value = context.state.get("stock", "main");
  if (value === null) context.fail({ code: "UNSEEDED", message: "Select an explicit stock dataset." });
  return { remaining: Number(value.remaining), completed: Number(value.completed) };
}

export default defineToolBehavior({
  operations: {
    status(_input, context) {
      return stock(context);
    },
    print(input, context) {
      const current = stock(context);
      const jobId = String(input.jobId), pages = Number(input.pages);
      if (context.state.get("jobs", jobId) !== null)
        context.fail({ code: "JOB_EXISTS", message: "This job ID is already recorded." });
      if (pages > current.remaining)
        context.fail({ code: "OUT_OF_PAPER", message: "The selected stock cannot satisfy this job." });
      const remaining = current.remaining - pages;
      context.state.put("jobs", jobId, { pages });
      context.state.put("stock", "main", { remaining, completed: current.completed + 1 });
      return { jobId, remaining };
    },
  },
});
```

### seed.json

```json
[
  {"namespace": "stock", "rowId": "main", "value": {"remaining": 12, "completed": 0}}
]
```

### status.json

```json
{}
```

### print.json

```json
{"jobId": "handout", "pages": 3}
```

### too-large.json

```json
{"jobId": "oversized", "pages": 20}
```

An omitted dataset or `[]` is genuinely empty. This fixture returns `UNSEEDED` without explicit stock; it never fabricates starter records or a passing result.

## Publish, seed and exercise

Use the installed CLI with protected Firedrill login or an authorized `FIREDRILL_TOKEN` and an explicitly selected API/project/environment (repo config or scope environment variables). Keep credentials out of these files and shell history. Commands assume `firedrill` names that installed client; no private source checkout is needed.

Save each key before its mutation. Publish only the intended source:

```sh
firedrill tools publish printer --manifest manifest.json --entry service.ts --file service.ts --idempotency-key printer-v1-publish --json --non-interactive
```

Retain returned `.id` as `FD_BUILD_ID` only if `status` is `ready`. This proves compilation and bounded registration, not handler behavior. Seed the build and retain dataset `.id` as `FD_DATASET_ID`:

If publication fails, keep its exact `buildId`, `operationId` and operation key.
`firedrill tools builds BUILD_ID --json` reads the original retained build. When
available, `failure.diagnostics` contains a bounded code, repair and selected
relative source file/line/column; raw compiler output and source text are not
returned. Missing locations are not invented. Reusing a failed key retrieves
the same failure, not a fresh build. Correct the selected source and publish it
with a new key only when intentionally starting a changed build. A build error
does not create a running Tool.

```sh
firedrill tools seed "$FD_BUILD_ID" printer/seed.json --idempotency-key printer-v1-seed --json --non-interactive
firedrill tools create "$FD_BUILD_ID" --dataset "$FD_DATASET_ID" --seed 42 --allow status --allow print --ttl-seconds 300 --idempotency-key printer-v1-create --json --non-interactive
```

Retain the instance `.id` as `FD_INSTANCE_ID` and `.epoch` as `FD_EPOCH`; never guess or automatically advance an epoch after a rejected request.

```sh
firedrill tools invoke "$FD_INSTANCE_ID" status printer/status.json --epoch "$FD_EPOCH" --idempotency-key printer-status-before --json --non-interactive
firedrill tools invoke "$FD_INSTANCE_ID" print printer/print.json --epoch "$FD_EPOCH" --operation-key handout-v1 --idempotency-key printer-print-handout --json --non-interactive
firedrill tools invoke "$FD_INSTANCE_ID" status printer/status.json --epoch "$FD_EPOCH" --idempotency-key printer-status-after --json --non-interactive
firedrill tools invoke "$FD_INSTANCE_ID" print printer/too-large.json --epoch "$FD_EPOCH" --operation-key oversized-v1 --idempotency-key printer-print-oversized --json --non-interactive
firedrill tools history "$FD_INSTANCE_ID" --limit 100 --json --non-interactive
```

Inspect `result.outcome`, not HTTP success alone: success carries `status:"ok"` and `value`; declared failures carry `status:"tool_error"` and an error envelope. An authored code such as `OUT_OF_PAPER` appears on the wire as `error.code:"tool.OUT_OF_PAPER"`. CLI returns exit 4 for a non-ok semantic invocation. With this explicit seed, the first print should consume three of twelve sheets, and the oversized job should fail without consuming more. Verify retained status/history; do not print an expected answer as evidence.

`--idempotency-key` identifies the control action. Manual `--operation-key` supplies semantic idempotency when the manifest requires it; these are distinct keys. Reuse both exact keys and unchanged arguments after a lost response. Choose new keys only for intentional new actions. Corrected publication uses a new key; unchanged publication can reconcile with its old key. Do not rerun the application to repair one uncertain Tool call.

Stop this exact manual fixture after inspection; destroy retains history:

```sh
firedrill tools get "$FD_INSTANCE_ID" --json --non-interactive
firedrill tools destroy "$FD_INSTANCE_ID" --epoch "$FD_EPOCH" --confirm "$FD_INSTANCE_ID" --idempotency-key printer-v1-destroy --json --non-interactive
firedrill tools history "$FD_INSTANCE_ID" --limit 100 --json --non-interactive
```

Follow non-null history `nextCursor` with `--cursor`. If epoch/status changed, inspect the intervening action before choosing the next request. A scope/permission failure does not authorize another identity.

## Bind and qualify

Use immutable build/dataset IDs and seed in a recipe, not a manual instance ID or connection secret. See [controlled surroundings](services.md) for native and command/HTTP bindings. Cases/configurations/repetitions receive independent state.

Current boundaries:

- Select one to 128 visible relative `.ts`, `.js` or `.mjs` files including entrypoint. Client bounds: 1 MiB per source, 4 MiB total. Traversal, hidden segments, symlinks and hard links are not upload shortcuts. Manifest JSON is separate; whole-application upload is never implicit.
- Seed at most 10,000 explicit `{namespace,rowId,value}` records, validated against the build. Optional `--dataset-policy POLICY.json` on publication declares `unique`/`reference`/`count` data rules; optional `--metadata METADATA.json` on seeding declares provenance and exact cross-dataset mappings. Discover `dataset-policy`/`dataset-metadata` through `firedrill schema`. Imported provenance requires the caller's explicit authorized-import assertion; schema/rule checks do not establish fidelity or independent consent. Remove customer secrets before any authorized upload.
- This host supports semantic operations, authored bearer-authenticated HTTP mappings/codecs and same-service events. HTTP routes must be explicitly declared in the selected manifest/source, not guessed from a vendor name. The host rejects outbound callbacks, cross-service subscriptions and non-bearer HTTP auth; no universal vendor endpoint or webhook delivery is implied.
- Optional `--view view.json` selects a data-only records/forms declaration over actual operations—not arbitrary HTML/JS or an iframe. Omit it when no visual view is needed.
- Readiness and seeded checks do not establish real-world fidelity. State simplifications; validate the real external contract separately when required. If the needed behavior cannot be expressed safely, stop rather than silently using the live service.
