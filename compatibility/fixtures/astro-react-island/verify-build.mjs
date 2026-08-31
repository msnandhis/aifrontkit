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
assert.match(output, /astro-react-island/, "the React island marker must remain in the production output");
assert.match(output, /Hydrated island proof/, "canonical runtime events must remain in the hydrated bundle");
console.log("Astro fixture contains its static shell and hydrated AIFrontKit React island.");
