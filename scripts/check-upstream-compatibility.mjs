import { readFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repository = fileURLToPath(new URL("../", import.meta.url));
const defaultConfig = resolve(repository, "compatibility/upstream-adapters.json");
const registryBase = "https://registry.npmjs.org";

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(value);
  if (!match) throw new Error(`Unsupported semantic version: ${value}`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), prerelease: match[4] };
}

export function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (const field of ["major", "minor", "patch"]) {
    if (a[field] !== b[field]) return a[field] < b[field] ? -1 : 1;
  }
  if (a.prerelease === b.prerelease) return 0;
  if (a.prerelease === undefined) return 1;
  if (b.prerelease === undefined) return -1;
  return a.prerelease.localeCompare(b.prerelease, "en", { numeric: true });
}

function fixtureVersionFromDirectory(path) {
  const directory = basename(dirname(path));
  const match = /-(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(directory);
  return match?.[1];
}

export async function loadPins(configPath = defaultConfig) {
  const config = JSON.parse(await readFile(configPath, "utf8"));
  if (config.schemaVersion !== 1 || !Array.isArray(config.adapters) || config.adapters.length === 0) {
    throw new Error("Compatibility configuration must contain at least one schema version 1 adapter");
  }

  const configRoot = dirname(configPath);
  const ids = new Set();
  const pins = [];
  for (const entry of config.adapters) {
    if (!entry || typeof entry.id !== "string" || typeof entry.fixture !== "string") {
      throw new Error("Every compatibility adapter requires string id and fixture fields");
    }
    if (!/^[a-z0-9-]+$/.test(entry.id)) throw new Error(`Invalid compatibility adapter id: ${entry.id}`);
    const fixtureSegments = entry.fixture.split("/");
    if (!entry.fixture.startsWith("fixtures/adapters/") || !entry.fixture.endsWith(".json") || fixtureSegments.includes("..") || entry.fixture.includes("\\")) {
      throw new Error(`${entry.id} fixture must be a JSON file under fixtures/adapters`);
    }
    if (ids.has(entry.id)) throw new Error(`Duplicate compatibility adapter id: ${entry.id}`);
    ids.add(entry.id);

    const fixturePath = resolve(configRoot, entry.fixture);
    const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
    const upstream = fixture.upstream;
    if (fixture.fixtureSchemaVersion !== 1) {
      throw new Error(`${entry.fixture} must use fixtureSchemaVersion 1`);
    }
    if (!upstream || typeof upstream.package !== "string" || typeof upstream.version !== "string" || typeof upstream.source !== "string" || typeof upstream.capturedAt !== "string") {
      throw new Error(`${entry.fixture} is missing upstream package, version, source or capture metadata`);
    }
    if (!upstream.source.startsWith("https://")) {
      throw new Error(`${entry.fixture} must cite an HTTPS upstream source`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(upstream.capturedAt)) {
      throw new Error(`${entry.fixture} must use a YYYY-MM-DD capture date`);
    }
    parseVersion(upstream.version);
    const directoryVersion = fixtureVersionFromDirectory(fixturePath);
    if (directoryVersion !== upstream.version) {
      throw new Error(`${entry.fixture} pins ${upstream.version} but its directory pins ${directoryVersion ?? "no version"}`);
    }
    pins.push({ id: entry.id, fixture: entry.fixture, package: upstream.package, pinned: upstream.version, source: upstream.source, capturedAt: upstream.capturedAt });
  }
  return pins;
}

export async function fetchLatestVersion(packageName, fetcher = fetch) {
  const response = await fetcher(`${registryBase}/${encodeURIComponent(packageName)}`, {
    headers: { accept: "application/vnd.npm.install-v1+json", "user-agent": "aifrontkit-compatibility-monitor/1" },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`npm registry returned HTTP ${response.status}`);
  const metadata = await response.json();
  const latest = metadata?.["dist-tags"]?.latest;
  if (typeof latest !== "string") throw new Error("npm registry response has no latest dist-tag");
  parseVersion(latest);
  return latest;
}

export async function inspectCompatibility(pins, fetcher = fetch) {
  return Promise.all(pins.map(async (pin) => {
    try {
      const latest = await fetchLatestVersion(pin.package, fetcher);
      const comparison = compareVersions(pin.pinned, latest);
      return { ...pin, latest, status: comparison === 0 ? "current" : comparison < 0 ? "behind" : "ahead" };
    } catch (error) {
      return { ...pin, latest: null, status: "unavailable", error: error instanceof Error ? error.message : String(error) };
    }
  }));
}

export function markdownReport(results) {
  const symbols = { current: "OK", behind: "DRIFT", ahead: "AHEAD", unavailable: "ERROR" };
  const lines = [
    "# Upstream adapter compatibility",
    "",
    "This report is read-only. Fixture updates require a deliberate compatibility review.",
    "",
    "| Adapter | Package | Pinned | npm latest | Status |",
    "| --- | --- | --- | --- | --- |",
    ...results.map((result) => `| ${result.id} | \`${result.package}\` | \`${result.pinned}\` | ${result.latest ? `\`${result.latest}\`` : "unavailable"} | ${symbols[result.status]} |`)
  ];
  const errors = results.filter((result) => result.error);
  if (errors.length) {
    lines.push("", "## Registry errors", "", ...errors.map((result) => `- ${result.id}: ${result.error}`));
  }
  return `${lines.join("\n")}\n`;
}

function parseArguments(argv) {
  const options = { configPath: defaultConfig, failOnDrift: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--fail-on-drift") options.failOnDrift = true;
    else if (value === "--config") {
      const path = argv[++index];
      if (!path) throw new Error("--config requires a path");
      options.configPath = resolve(path);
    }
    else throw new Error(`Unknown argument: ${value}`);
  }
  return options;
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const results = await inspectCompatibility(await loadPins(options.configPath));
  process.stdout.write(markdownReport(results));
  if (results.some((result) => result.status === "unavailable")) return 2;
  if (options.failOnDrift && results.some((result) => result.status === "behind")) return 1;
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  });
}
