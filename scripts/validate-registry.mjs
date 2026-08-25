import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const registry = fileURLToPath(new URL("../registry/", import.meta.url));
const failures = [];
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]))).flat();
}
for (const path of (await walk(registry)).filter((path) => path.endsWith("registry.json") && !path.endsWith("/registry/registry.json"))) {
  const item = JSON.parse(await readFile(path, "utf8"));
  if (!item.name || !item.type || !item.description) failures.push(path + ": missing required identity fields");
  if (!/^\d+\.\d+\.\d+$/.test(item.meta?.version ?? "")) failures.push(path + ": meta.version must be SemVer");
  if (!Number.isInteger(item.meta?.schemaMajor)) failures.push(path + ": meta.schemaMajor is required");
  if (!item.meta?.aifrontkit) failures.push(path + ": package compatibility range is required");
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Community registry manifests are valid.");
