# Drivers, bindings, synthetic users and state

## Choose the driver from the real interface

Drive the interface the agent really has. Do not invent a chat interface for an
agent that has none, and never replace a failing target with a prompt imitation.

| Profile | Use when the target is | Plan fields |
| --- | --- | --- |
| `http.v1` | An HTTP request/response or streaming (SSE/NDJSON) endpoint | `service_alias`, `path`, `method`, `stream`, `session_header`, `request_template` (`message-text` or `task-json`), `response_pointer` |
| `jsonl-process.v1` | A long-lived process that can speak JSON lines on stdin/stdout | `service_alias` |
| `function-wrapper.v1` | A library or function with no server or CLI | `root_alias`, `wrapper`, `runtime` argv |
| `playwright.v1` | A web UI, chat or non-chat, driven in a real browser | `root_alias`, `flow`, `service_alias`, `start_path` |
| `signed-http-event.v1` | A webhook or event receiver | `service_alias`, `path_prefix`, `signing_secret_env` |

Notes:

- `http.v1` `response_pointer` (a JSON pointer such as `/reply`, or null for the
  whole body) picks the reply out of the JSON body, or out of each stream event,
  joining string pieces. Set it from the target's real response shape. A 2xx
  response where the pointer finds nothing, in the body or in any stream event,
  is unusable: the target may already have acted, so a non-idempotent step is
  `unknown` and an idempotent one fails. It is never a completed step with an
  empty reply.
- `jsonl-process.v1` protocol: request `{"id","session","kind","input"}` plus
  `"headers": {"<declared header>": "<token>"}` when a synthetic session is granted;
  response `{"id","output"}` or `{"id","error"}`, one JSON object per line.
- The `session` value (and the `http.v1` `session_header` and `message-text` body
  field) is an opaque `participant-<hex>` id. It is the same for every turn of one
  drill attempt and new for every other attempt, so a target that keys conversation
  state by session starts each drill fresh. Do not parse it or depend on its value.
- `function-wrapper.v1`: you write a small wrapper that imports the user's function
  and speaks the JSON-lines protocol above. Right after the import succeeds, and
  before reading any request, it prints one line `firedrill-wrapper-ready` to stdout
  (within 60 seconds); a wrapper that never prints it is not started. The human
  approves it; it is pinned by sha256 and re-checked before every launch. No SDK is
  required in the target.
- `playwright.v1`: Playwright must already be resolvable from the user's project;
  Firedrill does not install or bundle it. You write a flow module exporting
  `login(page, identity)`, `send(page, step)` and optionally `reset(page)`. The
  human approves it; it is pinned by sha256. Each drill session gets a fresh browser
  context. A fresh browser context does not reset backend state.
  Screenshots are off unless the plan sets `"screenshots": {"mask_selectors": [...]}`
  on this driver. Then each step's visible page is captured as a PNG with every
  form field and editable region blacked out, plus the selectors listed (for
  example account numbers or chat history). Anything else on screen, including
  text inside embedded frames, is uploaded as shown: masking is not secret
  detection. Show the human the plan's screenshot line and masking policy digest
  before approval, and add selectors for anything sensitive the flow displays.
  Capture needs the project's Playwright 1.35 or later.

  To also see what happened during a step, add
  `"frames": {"interval_ms": 2000, "max_per_step": 10}` inside `screenshots`.
  While each step runs, the driver then captures a masked frame every
  `interval_ms` (1,000 to 10,000), at most `max_per_step` (1 to 30) per step,
  plus the screenshot after the step. Each frame is masked exactly like the
  screenshot, with animations left running so the flow's page is not changed.
  Call these captured frames, never a video: nothing between two frames is
  recorded. Frames count toward the session's capture maximum and the screenshot
  share of the evidence budget. The step's record lists its frames and how many
  the interval called for that have no image, with the reasons: the capture
  reasons below, or `step_limit` once the step's count was reached. Playwright
  video, Playwright trace files and HAR are not supported and there is no
  fallback to them: video ignores masks, and trace files and HAR keep typed
  values and network bodies.

  Set `"trace": "sanitized-actions"` on this driver to record a sanitized action
  trace. The flow gets its page through a recording view that behaves exactly
  like the page. Each call records only its kind of operation (navigate, click,
  fill, press, select, check, uncheck, wait or observe), how it ended and when.
  It never records selectors, addresses, typed values, page text or errors.
  Other calls (hover, evaluate, drag and the like) and assertions are not
  recorded. Each browser session is one capture, cut into segments at each step
  end. Its last segment says whether coverage is complete or partial, and why:
  `capture_failed`, `limit_reached`, `cancelled` or `driver_failed`. A missing
  segment or a session that never closed reads as incomplete.

  Each drill records once that capture was requested (`capture.requested`). The
  record holds the masking policy digest, the selector count (never the
  selectors) and whether this Playwright can capture. A step whose capture
  produced no image records one `capture.unavailable` with a reason and never the
  error or page content:
  - `capture_failed`: the capture or its masking threw or timed out, or the
    step was stopped first. It fails closed, with no image. A selector that
    matches nothing masks nothing and is not an error, so an absent field is
    normal. Masking hides only the elements the selectors match; it does not
    prove every sensitive value is hidden.
  - `image_too_large`: the raw capture was over the byte bound.
  - `image_unsupported`: the capture could not be re-encoded within the masked
    PNG profile.
  - `session_limit`: the session had already taken its maximum.
  - `page_closed`: the page had closed.
  - `evidence_capacity`: the image did not fit. A screenshot or frame is taken
    into evidence only while the step's own record and its reply or result still
    fit after it, and screenshots and frames together may use at most half of the
    drill's evidence budget, so the replies and results each step needs always
    keep room.

  The step's own result is kept either way. If a drill has no `capture.requested`
  record, coverage is unknown (incomplete evidence or an older client); it does
  not mean capture was off.
- `signed-http-event.v1`: deliveries keep their body bytes. The scenario supplies
  only the event (method, a path under `path_prefix`, a JSON body) and names the
  `x-firedrill-signature` header; it never supplies the key. `signing_secret_env`
  (required, because every event asks for a signature) names the environment
  variable that holds a synthetic test signing secret configured on the receiver.
  Never reuse a production webhook signing secret for synthetic deliveries.
  The human approves that name; the value is never shown, uploaded or written.
  The header is `sha256=<lowercase hex HMAC-SHA256 of the exact body>`, and
  `firedrill-delivery-id` carries the delivery id. Never disable the target's
  signature check. An event the client refuses or cannot deliver (for example the
  receiver is not listening) ends the drill incomplete with that error. It is
  never recorded as the target's own failure. A timeout after sending is reported as unknown, not
  retried.
- Scenario inputs: besides participant turns, a scenario can give the target a
  scripted message, a task (`task-json` input) or a signed event. A task's or
  event's result is kept as evidence of what the target returned, never as a
  score. An acknowledged event only proves the receiver answered; the work it
  started was not observed, so the service records the drill's coverage as partial.
  A task or event result that says the target failed or was cancelled ends the
  drill as failed (`native_target_failed`) or cancelled (`native_target_cancelled`).
- A non-idempotent step that times out after being sent is `unknown` and is never
  replayed.
- Unsupported in this release: desktop/computer-use, voice/audio, arbitrary queues
  or socket transports. Report them as unsupported coverage.

API evidence is not proof the UI works; browser evidence is not proof an unobserved
backend action succeeded. Pick the profile that matches what you want to claim.

## Bind dependencies to hosted tools

Point the target at hosted synthetic endpoints in this order of preference:

1. The SDK or client's documented base URL / endpoint setting.
2. An MCP configuration override (the companion writes a run-scoped MCP config file
   and passes its location through an env var named in the plan; it never edits the
   user's global agent configuration).
3. The framework's own tool-router or dependency injection.
4. An approved, simulation-only change in a working copy.
5. Otherwise: report the dependency as unsupported.

Never install a root CA, set proxy variables to intercept traffic, disable TLS
verification or change DNS. Check whether calls go direct, through a hosted router
or through MCP; injecting a token does not prove routing changed. A missing
synthetic operation is never silently routed to production.

Each routed dependency (`dependency_env` in the plan) receives a per-drill loopback
URL, `invoke` (HTTP) or `mcp`, under the env name the plan declares. The companion
forwards only the descriptor's declared operations to the hosted tool and holds the
short-lived access itself: no token or credential reaches the target, and the URL
stops working when the drill ends. Never copy these URLs into argv, logs, reports or
chat.

A tool may declare an idempotency argument (`_meta`
`firedrill/idempotency-argument` in `tools/list`). If the call leaves it out, the
companion fills only that field with the call's key. If the call sets it, that value
is the key. The key is `_meta` `firedrill/idempotency-key` over MCP and the call's
`idempotency_key` on the `invoke` URL; a different value there is refused as a
conflict (`400` `idempotency_key_conflict` on `invoke`), and nothing is sent.

A hosted custom tool can accept an operation before it has a result. The target then
gets an error, never a result:
- `409` with `dependency_outcome_pending` or `dependency_outcome_unknown`;
- `422` with `dependency_not_dispatched`;
- over MCP, error `-32001`.

Each carries a `request_id`, a loopback `recovery_path` and the idempotency key the
call used (`idempotency_key`; over MCP, `firedrill/idempotency-key` in the error
data). Read that path, or resend the call with that same key. Never treat it as the
tool's answer, and never resend it under a new key.

A call that got no answer at all (`409` `dependency_request_unavailable`, a `502`, or
MCP error `-32603` with a key) may still have taken effect. Resend it with the
returned key, never under a new one.

Two answers mean nothing ran:
- `503` `dependency_unavailable` with no key: the scenario made the dependency
  unavailable, on either lane. Treat it as that dependency's outage.
- `503` `dependency_not_ready` with `Retry-After`: the tool list could not be read,
  so the call was not sent. Try again.

## Synthetic target users

A persona refers to an identity role, not a password. Each drill gets its own:

- `anonymous`: nothing is injected.
- `synthetic-session`: a seeded synthetic account or session. HTTP and JSON-lines
  drivers receive a session token in the declared header; the Playwright flow
  performs the app's real login with the granted synthetic username/password.

Do not fabricate cookies or bypass login and then claim the login path was tested.
MFA, passkeys, CAPTCHA, SAML and hard-wired identity SDKs are unsupported unless an
explicitly approved test path exists; otherwise block the affected scenario. Never
weaken the app's authentication to make a drill run. Verification emails, SMS and
magic links must go to synthetic recipients, never real ones.

## State and reset, per domain

Declare every state domain the target owns:

| Field | Values |
| --- | --- |
| `kind` | `process`, `browser`, `files`, `database`, `vector`, `cache`, `queue`, `scheduler`, `session` |
| `location` | `local`, `cloud-disposable`, `observation-only` |
| `reset` | `fresh-process`, `fresh-session`, `approved-hook`, `unavailable` |
| `concurrency` | `independent` or `serial` |
| `hook_sha256` | Set only for `approved-hook` |

- `fresh-process`: a new service copy per drill (needs `per_drill` and a port env).
- `fresh-session`: a new driver session (with its own session id) or browser context.
  It resets only state the target keys by that session; anything shared across
  sessions needs another reset.
- `approved-hook`: a reset script the human approved, pinned by sha256, run with
  argv and a timeout. Exit 0 is reported as executed, not as proof of reset.
- `unavailable` or `observation-only`: drills are serialized and coverage is
  reported incomplete.

When you cannot establish that a domain is isolated, mark it `serial`. Parallel
drills need independent state everywhere, not only independent cloud tools. Do not
present one database engine as a substitute for another.

State persists across turns within one drill. A new drill starts from a known
state; it must not silently inherit a previous drill.
