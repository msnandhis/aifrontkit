import { readFile, readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const contractsRoot = join(root, "contracts/ui/components");
const failures = [];
const semver = /^\d+\.\d+\.\d+$/;

for (const entry of await readdir(contractsRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
  const path = join(contractsRoot, entry.name);
  const contract = JSON.parse(await readFile(path, "utf8"));
  const name = entry.name.slice(0, -5);
  if (contract.name !== name) failures.push(`${entry.name}: name must match the file name`);
  if (!semver.test(contract.version ?? "")) failures.push(`${entry.name}: version must be SemVer`);
  for (const key of ["anatomy", "states", "accessibility", "implementations"]) {
    if (!Array.isArray(contract[key]) || contract[key].length === 0) failures.push(`${entry.name}: ${key} must be non-empty`);
  }
  for (const implementation of contract.implementations ?? []) {
    const implementationPath = resolve(root, implementation.path ?? "");
    try { if (!(await stat(implementationPath)).isDirectory()) throw new Error(); }
    catch { failures.push(`${entry.name}: implementation path does not exist: ${implementation.path}`); continue; }
    const manifestPath = join(implementationPath, "component.json");
    try {
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      if (manifest.name !== contract.name) failures.push(`${entry.name}: implementation name does not match`);
      if (manifest.version !== contract.version) failures.push(`${entry.name}: implementation version ${manifest.version} does not match contract ${contract.version}`);
    } catch { failures.push(`${entry.name}: implementation component.json is missing or invalid`); }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Framework-neutral UI contracts are valid and match their implementations.");
