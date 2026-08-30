import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const validator = new URL("./validate-adoption-contracts.mjs", import.meta.url);
const example = new URL("../contracts/adoption/examples/preview-cohort.json", import.meta.url);

const run = (path) => spawnSync(process.execPath, [validator.pathname, path], { encoding: "utf8" });

test("accepts the aggregate example", () => {
  const result = run(example.pathname);
  assert.equal(result.status, 0, result.stderr);
});

test("rejects fields that could carry customer content", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "aifrontkit-adoption-"));
  try {
    const summary = JSON.parse(await readFile(example, "utf8"));
    summary.prompt = "content that must never be collected";
    const path = join(temporaryRoot, "invalid.json");
    await writeFile(path, JSON.stringify(summary));
    const result = run(path);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /summary\.prompt is not allowed/);
    assert.match(result.stderr, /summary\.prompt is a prohibited data field/);
  } finally {
    await rm(temporaryRoot, { recursive: true });
  }
});

test("rejects inconsistent aggregate totals", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "aifrontkit-adoption-"));
  try {
    const summary = JSON.parse(await readFile(example, "utf8"));
    summary.cohort.framework.vite = 2;
    const path = join(temporaryRoot, "invalid.json");
    await writeFile(path, JSON.stringify(summary));
    const result = run(path);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /cohort\.framework counts must equal cohort\.size/);
  } finally {
    await rm(temporaryRoot, { recursive: true });
  }
});
