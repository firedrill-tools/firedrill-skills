/** Build a portable skills-only plugin and local host catalogs; never installs or publishes. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { constants, closeSync, existsSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, utimesSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), ".."));
const fail = message => { throw new Error(`Agent integration packaging stopped: ${message}`); };
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const normalized = value => value.split(sep).join("/");
const inside = (base, path) => { const rel = relative(base, path); return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel); };
// The exported skills repository uses this same packager with root-level input.
const inputRoot = existsSync(join(root, "clients/agent-integration/plugin.json")) ? join(root, "clients/agent-integration") : root;
const licensePath = inputRoot === root ? join(root, "LICENSE.md") : join(root, "clients/LICENSE.md");
const destination = process.argv[2] && resolve(process.argv[2]);
if (process.argv.length !== 3 || !destination || existsSync(destination) || realpathSync(dirname(destination)) !== dirname(destination))
  fail("supply one new output directory under a real existing parent");
if (inside(inputRoot, destination)) fail("output cannot be inside the selected source tree");
mkdirSync(destination, { mode: 0o700 });
const stage = join(destination, "marketplace");
mkdirSync(stage, { mode: 0o700 });
const sources = new Map(), files = new Map();
let totalBytes = 0;
function read(path) {
  if (!inside(root, path) || realpathSync(path) !== path) fail("source escaped its real source root");
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = fstatSync(fd);
    if (!before.isFile() || before.size > 1024 * 1024) fail("source must be a regular file of at most 1 MiB");
    const bytes = readFileSync(fd), after = fstatSync(fd);
    if (bytes.length !== before.size || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      fail("source changed during read");
    sources.set(normalized(relative(root, path)), { sha256: digest(bytes), bytes: bytes.length });
    return bytes;
  } finally { closeSync(fd); }
}
function put(path, bytes) {
  if (path.startsWith("/") || path.split("/").some(part => !part || part === "." || part === "..") || files.has(path)) fail("invalid output path");
  if (typeof bytes === "string") bytes = Buffer.from(bytes);
  totalBytes += bytes.length;
  if (totalBytes > 8 * 1024 * 1024) fail("instructions exceed the 8 MiB package bound");
  mkdirSync(dirname(join(stage, path)), { recursive: true, mode: 0o700 });
  writeFileSync(join(stage, path), bytes, { flag: "wx", mode: 0o600 });
  files.set(path, { path, sha256: digest(bytes), bytes: bytes.length });
}
const json = value => JSON.stringify(value, null, 2) + "\n";
const manifest = JSON.parse(read(join(inputRoot, "plugin.json")));
if (manifest.name !== "firedrill" || !/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/.test(manifest.version) || !manifest.description || manifest.mcpServers || manifest.hooks)
  fail("the canonical manifest must describe the skills-only Firedrill plugin");
put("plugins/firedrill/plugin.json", json(manifest));
put("plugins/firedrill/.codex-plugin/plugin.json", json({ name: manifest.name, version: manifest.version, description: manifest.description,
  author: { name: "Firedrill" }, skills: "./skills/", interface: manifest.extensions["com.openai"].interface,
  requires_local_executor: manifest.extensions["com.openai"].requires_local_executor === true }));
put("plugins/firedrill/.claude-plugin/plugin.json", json({ name: manifest.name, version: manifest.version, description: manifest.description,
  author: { name: "Firedrill" }, homepage: "https://firedrill.run", repository: "https://github.com/firedrill-tools/firedrill-skills" }));
put("plugins/firedrill/.cursor-plugin/plugin.json", json({ name: manifest.name, version: manifest.version, description: manifest.description,
  author: { name: "Firedrill" }, homepage: "https://firedrill.run", repository: "https://github.com/firedrill-tools/firedrill-skills", skills: "./skills/" }));
put("plugins/firedrill/kimi.plugin.json", json({ name: manifest.name, version: manifest.version, description: manifest.description,
  author: { name: "Firedrill" }, homepage: "https://firedrill.run", skills: "./skills/",
  interface: { displayName: "Firedrill", shortDescription: "Simulate agents and inspect retained evidence", developerName: "Firedrill" } }));
const skills = ["firedrill", "firedrill-service-authoring"];
function copy(directory, target) {
  if (lstatSync(directory).isSymbolicLink() || realpathSync(directory) !== directory) fail("skill directory is not a real directory");
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const from = join(directory, entry.name), to = `${target}/${entry.name}`;
    if (entry.isDirectory()) copy(from, to);
    else if (entry.isFile() && /\.(?:md|yaml)$/.test(entry.name)) put(to, read(from));
    else fail("skills may include only regular instruction/metadata files");
  }
}
for (const skill of skills) copy(join(inputRoot, "skills", skill), `plugins/firedrill/skills/${skill}`);
put("plugins/firedrill/assets/firedrill-icon.svg", read(join(inputRoot, "assets/firedrill-icon.svg")));
// Individual skills.sh installs must retain the authoring reference closure.
// Canonical guidance is maintained once; exported authoring copies are exact.
for (const name of ["authoring.md", "services.md"]) {
  const target = `plugins/firedrill/skills/firedrill-service-authoring/references/${name}`;
  if (!files.has(target)) put(target, read(join(inputRoot, "skills/firedrill/references", name)));
}
const authoringPath = "plugins/firedrill/skills/firedrill-service-authoring/SKILL.md";
const authoringText = readFileSync(join(stage, authoringPath), "utf8").replaceAll("../firedrill/references/", "references/");
writeFileSync(join(stage, authoringPath), authoringText, { mode: 0o600 });
files.set(authoringPath, { path: authoringPath, sha256: digest(Buffer.from(authoringText)), bytes: Buffer.byteLength(authoringText) });
for (const skill of skills) {
  const target = `plugins/firedrill/skills/${skill}/LICENSE.md`;
  if (!files.has(target)) put(target, read(licensePath));
}
put("plugins/firedrill/README.md", read(join(inputRoot, inputRoot === root ? "README.md" : "distribution/SKILLS_README.md")));
put("plugins/firedrill/LICENSE.md", read(licensePath));
put("plugins/firedrill/skills/LICENSE.md", read(licensePath));
// Resolve the actual packaged relative references, including sibling skill refs.
// No private checkout files or dangling source-only guides enter the plugin.
for (const [path] of files) if (path.endsWith(".md")) {
  const text = readFileSync(join(stage, path), "utf8");
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const link = match[1].split("#")[0];
    if (!link || /^[a-z][a-z0-9+.-]*:/i.test(link)) continue;
    const resolved = resolve(stage, dirname(path), link);
    if (!inside(join(stage, "plugins/firedrill"), resolved) || !files.has(normalized(relative(stage, resolved)))) fail(`unpackaged instruction reference in ${path}`);
  }
}
put(".agents/plugins/marketplace.json", json({ name: "firedrill-local", interface: { displayName: "Firedrill" },
  plugins: [{ name: "firedrill", source: { source: "local", path: "./plugins/firedrill" },
    policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" }, category: "Productivity" }] }));
put(".claude-plugin/marketplace.json", json({ name: "firedrill-local", description: "Firedrill skills for running agent simulations and authoring synthetic dependencies.", owner: { name: "Firedrill" },
  plugins: [{ name: "firedrill", source: "./plugins/firedrill", description: manifest.description }] }));
put(".cursor-plugin/marketplace.json", json({ name: "firedrill-local", description: "Firedrill skills for running agent simulations and authoring synthetic dependencies.", owner: { name: "Firedrill" },
  plugins: [{ name: "firedrill", source: "./plugins/firedrill", description: manifest.description }] }));
put("kimi-marketplace.json", json({ version: "2", plugins: [{ id: "firedrill", displayName: "Firedrill", source: "./plugins/firedrill" }] }));
put("README.md", read(join(inputRoot, "PLUGIN.md")));
const provenance = { schemaVersion: "firedrill-agent-plugin.1", name: manifest.name, version: manifest.version,
  kind: "skills-only", skills,
  hostManifests: { portable: "plugins/firedrill/plugin.json", codex: "plugins/firedrill/.codex-plugin/plugin.json", claude: "plugins/firedrill/.claude-plugin/plugin.json", cursor: "plugins/firedrill/.cursor-plugin/plugin.json", kimi: "plugins/firedrill/kimi.plugin.json" },
  sources: [...sources].map(([path, value]) => ({ path, ...value })).sort((a, b) => a.path.localeCompare(b.path)),
  files: [...files.values()].sort((a, b) => a.path.localeCompare(b.path)),
  excluded: ["credentials", "local machine paths", "private service/runtime", "automatic installation", "MCP execution binaries", "hooks"],
  published: false, installed: false };
put("PACKAGING.json", json(provenance));
for (const [path, value] of sources) if (digest(readFileSync(join(root, path))) !== value.sha256) fail("source changed during packaging");
const archive = join(destination, `firedrill-agent-plugin-${manifest.version}.zip`);
const stableTime = new Date("1980-01-01T00:00:00Z");
for (const path of files.keys()) utimesSync(join(stage, path), stableTime, stableTime);
execFileSync("zip", ["-q", "-X", archive, ...[...files.keys()].sort()], { cwd: stage, env: { ...process.env, TZ: "UTC" }, timeout: 30000, maxBuffer: 1024 * 1024 });
// Native plugin consumers receive one plugin root, not a marketplace directory
// mislabeled as a plugin. Portable skills retain independent reference closures.
const additionalArtifacts = [];
for (const artifact of [
  { kind: "native-skills-plugin", filename: `firedrill-skills-plugin-${manifest.version}.zip`, cwd: join(stage, "plugins"), entries: ["firedrill"] },
  { kind: "portable-agent-skills", filename: `firedrill-agent-skills-${manifest.version}.zip`, cwd: join(stage, "plugins/firedrill/skills"), entries: [...skills, "LICENSE.md"] },
]) {
  const path = join(destination, artifact.filename);
  const entries = [...files.keys()].map(path => normalized(relative(artifact.cwd, join(stage, path))))
    .filter(path => artifact.entries.some(entry => path === entry || path.startsWith(`${entry}/`))).sort();
  execFileSync("zip", ["-q", "-X", path, ...entries], { cwd: artifact.cwd, env: { ...process.env, TZ: "UTC" }, timeout: 30000, maxBuffer: 1024 * 1024 });
  const bytes = readFileSync(path);
  additionalArtifacts.push({ kind: artifact.kind, artifact: path, sha256: digest(bytes), bytes: bytes.length });
}
const archiveBytes = readFileSync(archive);
const receipt = { schemaVersion: provenance.schemaVersion, name: manifest.name, version: manifest.version,
  artifact: archive, sha256: digest(archiveBytes), bytes: archiveBytes.length, stage, files: files.size,
  manifestSha256: files.get("PACKAGING.json").sha256, kind: "skills-only", additionalArtifacts, hostManifests: provenance.hostManifests, installed: false, published: false };
writeFileSync(join(destination, "artifact.json"), json(receipt), { flag: "wx", mode: 0o600 });
console.log(JSON.stringify(receipt));
