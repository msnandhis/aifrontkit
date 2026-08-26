import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const toolingDirectory = dirname(fileURLToPath(import.meta.url));
const validator = join(toolingDirectory, "validate-docs.mjs");
const docsSource = resolve(toolingDirectory, "../../content/docs");

function validate(root) {
  return spawnSync(process.execPath, [validator, root], { encoding: "utf8" });
}

test("accepts the checked-in public documentation", () => {
  const result = validate(docsSource);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Documentation validation passed/);
});

test("rejects a publishable page missing from navigation", async (context) => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "aifrontkit-docs-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  await cp(docsSource, temporaryRoot, { recursive: true });

  const navigationPath = join(temporaryRoot, "navigation.json");
  const navigation = JSON.parse(await readFile(navigationPath, "utf8"));
  navigation.sections[0].pages = navigation.sections[0].pages.filter((page) => page !== "index.md");
  await writeFile(navigationPath, `${JSON.stringify(navigation, null, 2)}\n`);

  const result = validate(temporaryRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /index\.md: publishable page is missing/);
});

test("rejects version directories in active source", async (context) => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "aifrontkit-docs-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  await cp(docsSource, temporaryRoot, { recursive: true });
  await mkdir(join(temporaryRoot, "v2"));
  await writeFile(join(temporaryRoot, "v2/index.md"), "# copied version\n");

  const result = validate(temporaryRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /versioned source directories are prohibited/);
});
