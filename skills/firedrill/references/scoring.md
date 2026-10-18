# Optional scores and comparison

Read this when the user requests quality evaluation, benchmark interpretation or
an assessment-backed CI gate. Routine execution and observation need no rubric.

Exact checks and sequence predicates use JSON Pointers: the empty string selects
the complete value, `/output/answer` selects an object member, and `~0`/`~1`
escape literal `~`/`/` in a key. Array entries use zero-based decimal indices,
not properties such as `length`. `exists` takes an optional boolean expected
value (default `true`); use `false` only to assert known absence. `lte` and `gte`
require an explicit finite numeric expected value. Preview rejects malformed
definitions before target execution; unavailable evidence is not known absence.

Observation-only work needs no rubric. Add one when the user wants a quality
assessment and authorizes its separate platform evaluator budget. This example
reuses the archive's ordinary-CI uppercase renderer: a real deterministic command,
not an AI agent or a promised passing score. It renders supplied notice text; it
does not reason about the task. Replace that adapter with your actual application
before drawing conclusions about its quality.

From the repository where the CLI archive is installed, save this complete recipe
as `firedrill/scored.json`. The teaching renderer rejects inherited common
provider/GitHub secrets; use a reviewed environment, not copied account credentials.
All task facts are in `input` and the dimension description, not just a scenario
label. The exact check protects the output shape; the rubric permits valid wording
variation. The five anchors are levels0 through4, not probabilities.

```json
{
  "schemaVersion": "2026-10-14",
  "name": "Delivery notice quality",
  "target": {"kind": "command", "argv": ["node", "node_modules/@firedrill-run/cli/examples/ordinary-ci/target.mjs"]},
  "scenarios": [{
    "id": "delay", "name": "Explain a delivery delay",
    "input": {
      "task": "Give a brief delivery update using only these facts.",
      "facts": {"status": "delayed", "deliveryDay": "Friday", "customerAction": "none"},
      "label": "Your shipment is delayed until Friday. No action is needed."
    },
    "checks": [{"id": "label-present", "description": "Return the label field",
      "path": "/output/label", "comparator": "exists", "required": true}],
    "rubric": {
      "id": "delivery-facts", "version": "1",
      "policyVersion": "2026-10-15-assessment.1",
      "dimensions": [{
        "id": "facts",
        "applicability": {"state": "applicable"},
        "missingEvidence": "not_assessable",
        "description": "Judge output.label against input.facts. Accept equivalent wording; do not require the input label's exact phrasing.",
        "anchors": [
          "Contradicts the delivery facts or invents a harmful instruction.",
          "Mostly omits the facts or adds unsupported promises.",
          "Preserves some facts but misses an important fact or is materially ambiguous.",
          "Preserves all three facts without unsupported claims, with minor clarity issues.",
          "Clearly and concisely preserves the delay, Friday delivery and no action needed, without unsupported claims."
        ]
      }]
    }
  }],
  "repetitions": 3,
  "concurrency": 1,
  "limits": {"timeoutMs": 10000, "maxRuns": 3, "maxOutputBytes": 4096},
  "gate": {"requireCompleted": true, "requireExactChecks": true, "minimumLevels": {"facts": 3}}
}
```

```sh
firedrill simulate firedrill/scored.json --view operator --json --non-interactive
firedrill summary BATCH_ID --json
firedrill runs BATCH_ID --json
firedrill report RUN_ID --json
```

Use the actual returned IDs. Inspect execution, each exact check, each dimension's
level/state/explanation/evidence, and the gate separately. A dimension may be
`not_assessable` with `level: null`: that quality evidence is unknown, not level0
or proof that the application failed. The gate is inconclusive unless another
known requirement already blocks it; required exact checks and completion still
apply independently. Pending assessment remains pending. Keep all three trials, including
failed/interrupted/unassessed counts; do not select only the best score.

Author applicability before execution. Explicit dimension `applicability` or
`missingEvidence` requires rubric
`"policyVersion": "2026-10-15-assessment.1"`; omission means applicable.
For a genuinely irrelevant criterion, declare
`"applicability": {"state": "not_applicable", "reason": "This case is information-only; no action is authorized."}`.
The result is `not_applicable`/`null`, not missing evidence, a numeric grade or a
grader-chosen exemption. `"missingEvidence": "not_assessable"` is the only
supported missing-data policy. Missing/unsupported evidence stays
`not_assessable`/`null`; never exempt a criterion merely to hide poor or absent
evidence. An excluded criterion cannot satisfy a required `minimumLevels` entry:
the gate stays inconclusive unless another known requirement blocks it. Other
dimensions are not reweighted. Changes create a different pinned rubric, not a
rewrite of history.

The current evaluator receives text observations. Explicitly declare a
dimension's required content with `evidenceKinds`, for example `["image"]` for
pixels or `["audio", "video"]` when both are necessary. Omitted kinds mean text;
Firedrill does not infer requirements from prose. Unsupported required kinds
remain `not_assessable` with `level: null`, even when captures exist. Metadata
does not establish a capture's contents. Text-compatible dimensions can still
be scored; an entirely unsupported rubric sends no provider request. Retain
captured media for inspection and choose a gate that treats missing required
grades honestly.

After an intentional application change, run the same saved recipe again as a
new experiment, retain both batch IDs, and inspect
`firedrill compare BASELINE_BATCH_ID CANDIDATE_BATCH_ID --json`. Keep the same
scenario/rubric, configurations, repetitions and any declared service seeds; record
the application revision and its own randomness/reset policy. This tool-free
recipe declares no service seed. Comparison describes retained populations, not
a causal claim or automatic winner.
Summary `notApplicable` counts and paired `notApplicablePairs` are separate from
`notAssessable`, missing and `missingOrNotAssessablePairs`. Excluded/unknown pairs
are not numeric samples. Matched quality also needs the same known evaluator
`configurationDigest`; same provider/model/protocol alone is insufficient.
`evaluator_configuration` reports a mismatch;
`evaluator_configuration_unavailable` reports unknown historical configuration.
Both exclude quality pooling without hiding individual retained reports.
Inspect `evaluationAttempts[].configuration`, `configurationDigest` and `usage`
in the retained assessment history. Configuration pins nonsecret provider request
and transport bounds, not keys; it is separate from target configuration. Known
provider usage survives rejected structured scores, while unavailable usage is
unknown, not zero. This is separate evaluator accounting, not another target run.

Reassessment is different: `firedrill assessments reassess RUN_ID --idempotency-key
SAVED_REASSESSMENT_KEY --json` explicitly requests new evaluation of frozen
evidence using its retained rubric; it does not rerun the application. A changed
rubric can be supplied with `--rubric FILE`; then inspect both assessment versions.
Never reassess or rerun just to turn an unknown outcome into a pass. Target-model
credentials/costs remain separate from Firedrill operator authority and evaluation.

## Optional authored index

Dimensions remain primary. Only when the author explicitly wants a composite,
read the advertised `composite-policy` schema and add `rubric.composite` using
`schemaVersion:"2026-10-16-composite.1"`, `method:"weighted_mean_ordinal"` and
unique declared `dimensionId`/positive integer `weight` entries. No formula DSL
or default score is implied. Inspect `assessment.composite.state`, `reason`,
`components` and `requiredExactChecks`, not just `value`.

The result is a descriptive 0–4 numeric index of ordinal coding, not a probability
or a new anchored rubric level. Selected missing/N/A/invalid dimensions are not
silently reweighted. Required exact violations prevent a numeric index; unknown
required constraints remain unassessable. Adding this policy changes no CI gate.
Summary/paired populations preserve exact policy/evaluator compatibility,
coverage and exclusions; use their retained evidence rather than a single average.
