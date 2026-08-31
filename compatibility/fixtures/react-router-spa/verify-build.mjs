import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

async function collectText(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const values = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectText(path) : readFile(path, "utf8");
  }));
  return values.flat().join("\n");
}

const output = await collectText(fileURLToPath(new URL("./dist", import.meta.url)));
assert.match(output, /react-router-adapter-boundary/, "the lazy route must include the adapter-backed UI");
assert.match(output, /Framework integration proof/, "the normalized event fixture must reach the bundle");
console.log("React Router fixture contains its lazy route and provider-neutral transport boundary.");
