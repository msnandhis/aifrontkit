import { access, readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepository = fileURLToPath(new URL("../", import.meta.url));
const repository = process.env.AIFRONTKIT_REGISTRY_REPOSITORY ? resolve(process.env.AIFRONTKIT_REGISTRY_REPOSITORY) : defaultRepository;
const registry = join(repository, "registry");
const failures = [];
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]))).flat();
}
const manifestPaths = (await walk(registry)).filter((path) => path.endsWith("registry.json") && path !== join(registry, "registry.json"));
const manifests = new Map();

function pathTarget(path) {
  const [framework, directoryFlavor] = relative(registry, path).split(sep);
  if (framework !== "react") return null;
  const flavor = directoryFlavor === "css" ? "css-modules" : directoryFlavor;
  return { framework, flavor };
}

function targetKey(target) {
  return target ? `${target.framework}/${target.flavor}` : "universal";
}

function manifestKey(name, target) {
  return `${targetKey(target)}/${name}`;
}

for (const path of manifestPaths) {
  const item = JSON.parse(await readFile(path, "utf8"));
  if (!item.name || !item.type || !item.description) failures.push(path + ": missing required identity fields");
  if (!/^\d+\.\d+\.\d+$/.test(item.meta?.version ?? "")) failures.push(path + ": meta.version must be SemVer");
  if (!Number.isInteger(item.meta?.schemaMajor)) failures.push(path + ": meta.schemaMajor is required");
  if (!item.meta?.aifrontkit) failures.push(path + ": package compatibility range is required");
  const inferredTarget = pathTarget(path);
  const declaredTarget = item.meta?.target ?? null;
  if (inferredTarget && (!declaredTarget || declaredTarget.framework !== inferredTarget.framework || declaredTarget.flavor !== inferredTarget.flavor)) {
    failures.push(path + `: meta.target must match ${targetKey(inferredTarget)}`);
  }
  const target = declaredTarget ?? inferredTarget;
  const key = manifestKey(item.name, target);
  if (manifests.has(key)) failures.push(path + `: duplicate targeted item ${key}`);
  manifests.set(key, { path, item, target });

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

for (const { path, item, target } of manifests.values()) {
  for (const dependency of item.registryDependencies ?? []) {
    if (!manifests.has(manifestKey(dependency, target))) failures.push(path + `: unknown ${targetKey(target)} registry dependency ${dependency}`);
    if (dependency === item.name) failures.push(path + ": item may not depend on itself");
  }
}

function visit(key, visiting = new Set(), visited = new Set()) {
  if (visited.has(key)) return;
  if (visiting.has(key)) { failures.push(`registry dependency cycle includes ${key}`); return; }
  visiting.add(key);
  const manifest = manifests.get(key);
  for (const dependency of manifest?.item.registryDependencies ?? []) visit(manifestKey(dependency, manifest.target), visiting, visited);
  visiting.delete(key);
  visited.add(key);
}
for (const key of manifests.keys()) visit(key);

const index = JSON.parse(await readFile(join(registry, "registry.json"), "utf8"));
if (index.schemaVersion !== 1) failures.push("registry/registry.json: schemaVersion must be 1");
const indexedNames = new Set();
const catalogNames = new Set();
for (const item of index.items ?? []) {
  if (catalogNames.has(item.name)) failures.push(`registry/registry.json: duplicate catalog name ${item.name}`);
  catalogNames.add(item.name);
  if (!Array.isArray(item.targets) || item.targets.length === 0) failures.push(`registry/registry.json: ${item.name} requires at least one target`);
  for (const target of item.targets ?? []) {
    const key = manifestKey(item.name, target);
    if (indexedNames.has(key)) failures.push(`registry/registry.json: duplicate target ${key}`);
    indexedNames.add(key);
    const manifest = manifests.get(key);
    if (!manifest) {
      failures.push(`registry/registry.json: unknown item ${key}`);
      continue;
    }
    const declaredManifest = resolve(repository, target.manifest ?? "");
    const relativeManifest = relative(repository, declaredManifest);
    if (!target.manifest || relativeManifest.startsWith(`..${sep}`) || relativeManifest === "..") {
      failures.push(`registry/registry.json: manifest escapes repository for ${key}`);
    } else if (declaredManifest !== manifest.path) {
      failures.push(`registry/registry.json: ${key} must point to ${relative(repository, manifest.path)}`);
    }
    if (manifest.item.type !== item.type) failures.push(`registry/registry.json: type mismatch for ${key}`);
  }
}
for (const [key, { item }] of manifests) {
  if (["registry:component", "registry:block"].includes(item.type) && item.meta?.releaseStatus !== "candidate" && !indexedNames.has(key)) failures.push(`registry/registry.json: missing public item ${key}`);
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Community registry manifests are valid.");
