import { access, readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const registry = fileURLToPath(new URL("../registry/", import.meta.url));
const repository = fileURLToPath(new URL("../", import.meta.url));
const failures = [];
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]))).flat();
}
const manifestPaths = (await walk(registry)).filter((path) => path.endsWith("registry.json") && path !== join(registry, "registry.json"));
const manifests = new Map();

for (const path of manifestPaths) {
  const item = JSON.parse(await readFile(path, "utf8"));
  if (!item.name || !item.type || !item.description) failures.push(path + ": missing required identity fields");
  if (!/^\d+\.\d+\.\d+$/.test(item.meta?.version ?? "")) failures.push(path + ": meta.version must be SemVer");
  if (!Number.isInteger(item.meta?.schemaMajor)) failures.push(path + ": meta.schemaMajor is required");
  if (!item.meta?.aifrontkit) failures.push(path + ": package compatibility range is required");
  if (manifests.has(item.name)) failures.push(path + `: duplicate item name ${item.name}`);
  manifests.set(item.name, { path, item });

  for (const file of item.files ?? []) {
    if (typeof file.path !== "string" || file.path.length === 0) {
      failures.push(path + ": every file requires a path");
      continue;
    }
    const target = resolve(repository, file.path);
    const relativeTarget = relative(repository, target);
    if (relativeTarget.startsWith(`..${sep}`) || relativeTarget === "..") {
      failures.push(path + `: file escapes the repository (${file.path})`);
      continue;
    }
    try { await access(target); } catch { failures.push(path + `: declared file does not exist (${file.path})`); }
  }
}

for (const { path, item } of manifests.values()) {
  for (const dependency of item.registryDependencies ?? []) {
    if (!manifests.has(dependency)) failures.push(path + `: unknown registry dependency ${dependency}`);
    if (dependency === item.name) failures.push(path + ": item may not depend on itself");
  }
}

function visit(name, visiting = new Set(), visited = new Set()) {
  if (visited.has(name)) return;
  if (visiting.has(name)) { failures.push(`registry dependency cycle includes ${name}`); return; }
  visiting.add(name);
  const manifest = manifests.get(name)?.item;
  for (const dependency of manifest?.registryDependencies ?? []) visit(dependency, visiting, visited);
  visiting.delete(name);
  visited.add(name);
}
for (const name of manifests.keys()) visit(name);

const index = JSON.parse(await readFile(join(registry, "registry.json"), "utf8"));
const indexedNames = new Set();
for (const item of index.items ?? []) {
  if (indexedNames.has(item.name)) failures.push(`registry/registry.json: duplicate item ${item.name}`);
  indexedNames.add(item.name);
  if (!manifests.has(item.name)) failures.push(`registry/registry.json: unknown item ${item.name}`);
}
for (const [name, { item }] of manifests) {
  if (["registry:component", "registry:block"].includes(item.type) && !indexedNames.has(name)) failures.push(`registry/registry.json: missing public item ${name}`);
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Community registry manifests are valid.");
