import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { compareVersions, inspectCompatibility, loadPins, markdownReport } from "./check-upstream-compatibility.mjs";

test("compares stable and prerelease semantic versions", () => {
  assert.equal(compareVersions("7.0.85", "7.0.86"), -1);
  assert.equal(compareVersions("1.4.13", "1.4.13"), 0);
  assert.equal(compareVersions("1.4.13", "1.4.13-beta.1"), 1);
});

test("loads the checked-in fixture pins", async () => {
  const pins = await loadPins();
  assert.deepEqual(pins.map(({ package: packageName, pinned }) => [packageName, pinned]), [
    ["ai", "7.0.85"],
    ["@ag-ui/core", "0.0.59"],
    ["@langchain/langgraph", "1.4.13"]
  ]);
});

test("rejects fixture paths whose version disagrees with metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "aifrontkit-compat-"));
  await mkdir(join(root, "fixtures/adapters/example-1.0.0"), { recursive: true });
  await writeFile(join(root, "fixtures/adapters/example-1.0.0/events.json"), JSON.stringify({
    fixtureSchemaVersion: 1,
    upstream: { package: "example", version: "2.0.0", source: "https://example.test/docs", capturedAt: "2026-08-30" }
  }));
  await writeFile(join(root, "config.json"), JSON.stringify({ schemaVersion: 1, adapters: [{ id: "example", fixture: "fixtures/adapters/example-1.0.0/events.json" }] }));
  await assert.rejects(loadPins(join(root, "config.json")), /pins 2\.0\.0 but its directory pins 1\.0\.0/);
});

test("confines configured fixtures to the adapter fixture directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "aifrontkit-compat-"));
  await writeFile(join(root, "config.json"), JSON.stringify({ schemaVersion: 1, adapters: [{ id: "escape", fixture: "fixtures/adapters/../../package.json" }] }));
  await assert.rejects(loadPins(join(root, "config.json")), /must be a JSON file under fixtures\/adapters/);
});

test("classifies drift without mutating fixture metadata", async () => {
  const pins = [
    { id: "old", package: "old", pinned: "1.0.0" },
    { id: "same", package: "same", pinned: "2.0.0" },
    { id: "ahead", package: "ahead", pinned: "4.0.0" }
  ];
  const versions = { old: "1.1.0", same: "2.0.0", ahead: "3.0.0" };
  const fetcher = async (url) => ({ ok: true, json: async () => ({ "dist-tags": { latest: versions[decodeURIComponent(url.split("/").at(-1))] } }) });
  const results = await inspectCompatibility(pins, fetcher);
  assert.deepEqual(results.map(({ status }) => status), ["behind", "current", "ahead"]);
  assert.equal(pins[0].latest, undefined);
});

test("reports registry failures and drift in markdown", async () => {
  const results = await inspectCompatibility([{ id: "broken", package: "broken", pinned: "1.0.0" }], async () => ({ ok: false, status: 503 }));
  const report = markdownReport(results);
  assert.match(report, /\| broken .* ERROR \|/);
  assert.match(report, /HTTP 503/);
});
