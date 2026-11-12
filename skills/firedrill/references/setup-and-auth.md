# Setup and authentication

Five separate things. Doing one does not do any other.

1. **Installing this skill** gives you instructions. No binary, no credential, no
   MCP connection.
2. **Installing the Firedrill CLI** gives you the `firedrill` command.
3. **CLI login** (`firedrill init`) authorizes that CLI through a browser device
   flow.
4. **Remote MCP OAuth** authorizes your MCP client, separately, through its own
   browser consent.
5. **Agent registration** lets an agent start account creation where the
   deployment supports it. A human must still complete the claim and consent.

## 1. The skill

Installation (for the user to run, or for you to run only when the user asks):

```sh
npx skills add firedrill-tools/firedrill-skills --skill firedrill
```

- Scope: project by default (installed into the project's agent skills directory,
  for example `.claude/skills/` or `.agents/skills/`, and can be committed with
  the project). Add `-g` for a global install in the user's home directory.
- Target one client with `-a <agent>`, for example `-a claude-code` or `-a codex`.
- Update: `npx skills update firedrill` (add `-g` or `-p` to pick the scope).
  `npx skills check` reports whether an update exists.
- Remove: `npx skills remove firedrill` (add `-g` for a global install).
- The skills CLI requires Node.js 22.20 or later. That requirement belongs to the
  skills CLI, not to Firedrill.
- Installing the skill does not touch other client configuration and runs no
  Firedrill installer.

- Unsupported client: if the skills CLI does not support the user's client, copy
  the `skills/firedrill/` folder (SKILL.md and `references/`) into that client's
  skills or instructions location. Never overwrite another skill or setting.

Some clients can also install a thin Firedrill plugin that packages this same skill
and the remote MCP address. It grants no extra permission. Update or remove it
with the client's own plugin commands. Removing it removes the plugin's skill copy
and MCP entry, not the Firedrill account or any cloud resource.

## 2. The CLI

Check with `firedrill status --json`. If `firedrill` is not found, tell the user
and point them to the CLI installation instructions on the Firedrill website. Do
not install it, change PATH or pick a package on your own.

- Requirements: Node.js `>=22.23.4 <23` on macOS, Windows or Linux.
- Authentication and cloud commands support Windows. Local runner enrollment currently
  requires macOS or Linux on arm64 or x64 (`runner_host_unsupported` on other hosts).
  Do not treat successful Windows sign-in as local execution support.

## 3. CLI login: `firedrill init`

`firedrill init` signs in, or starts account creation, through device
authorization. It then selects the workspace and checks this machine's drivers and
credential store. It uploads nothing and makes no model call.

- Options:
  - `--session-only`, or `--persistent` for the OS store (the default when one is
    available);
  - `--workspace <id>`;
  - `--no-browser`, and `--open` to allow a browser in JSON mode;
  - `--json`.
- It prints a verification URL and code. The human opens it and approves. JSON
  mode does not open a browser unless the human explicitly chose `--open`.
  With `--no-browser`, relay the URL and code to the human.
- If the human denies, the code expires, or the CLI is told to slow down, report
  that exact state. Start a new login only when the human wants to.
- Workspace: reuse the current one. Ask only when the human belongs to several and
  the right one is unclear. Never create a new organization to get past an error.
- `firedrill login` and `firedrill signup` run the same device authorization
  without choosing a workspace or checking this machine. `signup` is the same flow
  under the name for a new account. `firedrill login --organization <id>`
  authorizes another organization the human belongs to; `firedrill workspace
  organizations` lists them. Each is a new browser approval by the human.
- `firedrill onboarding show` reads the optional profile setup (name, role,
  industry, country), and `onboarding open` opens it in the browser. Those fields
  can be skipped. Never fill them in or submit them for the human.

### Creating a workspace from the terminal

Only when the human has no workspace and asks for one, or agrees to create one.

1. Run `firedrill workspace create <name> --json`. Nothing is sent yet. It
   prints `workspace_approval_required` with the name, the terms of service and
   privacy policy (version and link), and the exact command to run.
2. Show the human the name and both links. Ask them to approve creating the
   workspace and accepting both documents. Signing in, or the task needing a
   workspace, is not approval. Never accept the terms for them.
3. Only after they approve, run the printed command. It carries
   `--request-key`, `--terms-version`, `--privacy-version` and
   `--approve-change`. Keep the `request_key`.
4. The result:
   - `completed` with `reauthorization_required: false`: run
     `firedrill workspace use <workspace_id>`.
   - `completed` with `reauthorization_required: true`: the workspace is in a new
     organization this sign-in does not cover. Run the `next_commands` in order:
     `firedrill login --organization <id>` (the human approves a new browser
     sign-in), then `firedrill workspace use <workspace_id>`.
   - `pending`, `creating` or `uncertain`: it is still being created. Check it
     with `firedrill workspace request <request_key>`. If it stays there, run
     `firedrill workspace create --request-key <request_key> --json`. That
     continues the same request with the documents approved for it; it never
     creates a second workspace and needs no new approval.
5. If the answer was lost, run `firedrill workspace request <request_key>` before
   anything else. Never start a new request with a new key to get past an
   unknown answer.

Other cases:

- `native_workspace_terms_unavailable`: terminal creation is not set up on this
  platform. The human creates the workspace in the browser instead.
- `native_workspace_terms_changed`: the documents changed. Show the human the
  new ones and ask again.
- `firedrill workspace requests` lists the terminal's requests.
- `firedrill workspace withdraw <request_key>` withdraws one that has not been
  sent, after the human approves (`--approve-change` in JSON mode). A request
  that was already sent cannot be withdrawn.
- Profile fields and invitations stay in the browser.

Credential storage:

| Platform | Default |
| --- | --- |
| macOS | Keychain |
| Windows | Credential Manager |
| Desktop Linux | Secret Service |
| Headless or remote Linux | Usually no Secret Service: use `--session-only` |

- `--session-only` keeps the credential in memory in a local companion process for
  its lifetime only. Other `firedrill` commands reach it over a private local
  channel. Stopping the companion ends the session. `firedrill run` in this mode
  enrolls a runner for the session whose key also lives only in memory (with the
  human's consent), so drills run without an OS store.
- Keep `firedrill init --session-only` open while other commands use that sign-in.
  Login is not runner enrollment: cloud-only operations need no enrolled device;
  local `run` needs its separate runner identity and explicit enrollment consent.
- There is no plaintext file fallback. If secure storage is unavailable the CLI
  says so (`credential_store_unavailable`) and offers `--session-only`.
- Never echo, copy or paste a token. Never put one in a file, URL, argv or chat.
- Sign out with `firedrill logout`. It revokes terminal access and removes saved
  credentials. `--local-only` only removes the local copy. The command says when
  cloud revocation is not confirmed; the session can then be revoked in Account
  settings.

## 4. Remote MCP (optional)

Streamable HTTP, root URL, no path suffix: `https://mcp.firedrill.run`.

`firedrill mcp --agent codex|claude|other` prints the exact add, sign-in, scope and
removal commands for that client. It works before `firedrill init`, using the
address the platform publishes, and changes no client configuration. If it says
MCP is not configured for this platform, MCP is off there; the CLI still works.

Add the server with the client's own MCP configuration and authorize with that
client's native OAuth flow (browser consent). Add it at the scope the user chooses
(project or user). Do not replace or rewrite unrelated server entries. Do not put
tokens in the URL or in static headers. Remove it the same way, for example
`claude mcp remove firedrill` or `codex mcp remove firedrill`.

MCP can author, apply, watch and inspect cloud resources. It cannot read the
user's files or start local processes; use the CLI for those. `firedrill status`
and the MCP connection may be signed in as different sessions; that is expected.

## 5. Agent registration

Where the platform publishes agent registration in its `auth.md`, you may start
registration for the human.

- `firedrill signup guide --json` reads that guide without signing in. It creates
  nothing (`account_created: false`) and names the default terminal path,
  `firedrill signup`. It fails with `agent_registration_unavailable` when
  registration is not set up on this platform. Then use `firedrill init` (device
  login) instead. The MCP server's discovery metadata names the same guide only
  when registration is enabled.
- Use only the methods, endpoints and scopes that guide actually advertises.
  Follow its exact claim ceremony. Some hosted flows ask the human to read a code
  from the verification page back to you. Device flows show the human a code
  while the client polls. Do not substitute one for the other.
- Knowing an email address is not owning the account. An unclaimed registration
  cannot reach any workspace. The human completes the claim/consent step. Never
  report registration as complete before that.
- The MCP server accepts only short-lived access tokens for its exact address.
  It does not accept identity assertions or durable registration keys. Keep claim
  handles and tokens in the client's private credential store, never in chat,
  files, URLs or logs.
- Registration is not workspace access. A first workspace still needs the human's
  approval of its name, terms and privacy policy (see "Creating a workspace from
  the terminal" above).
- No card is needed to create an account. Billing and payment authorization are
  separate. Never accept terms, budgets or top-ups on the human's behalf.

## Model costs

Your own model usage is covered by your provider's subscription under its rules;
Firedrill does not receive or resell that. Adaptive personas and evaluation inside
a drill may use Firedrill credits, which appear in the quoted budget.
