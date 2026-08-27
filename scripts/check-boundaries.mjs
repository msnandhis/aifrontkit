import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const allowed = {
  core: new Set(),
  react: new Set(["@aifrontkit/core", "@aifrontkit/tokens"]),
  "ai-sdk": new Set(["@aifrontkit/core"]),
  "ag-ui": new Set(["@aifrontkit/core"]),
  tokens: new Set(),
  testing: new Set(["@aifrontkit/core"]),
  cli: new Set()
};
const failures = [];
const appsRoot = join(root, "apps");
const registryRoot = join(root, "registry");

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }));
  return nested.flat();
}

function importSpecifiers(source) {
  return [...source.matchAll(/(?:from\s+|import\s*(?:\(\s*)?)["']([^"']+)["']/g)].map((match) => match[1]);
}

for (const name of Object.keys(allowed)) {
  const manifestPath = new URL(`../packages/${name}/package.json`, import.meta.url);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const dependencies = Object.keys(manifest.dependencies ?? {}).filter((item) => item.startsWith("@aifrontkit/"));
  for (const dependency of dependencies) {
    if (!allowed[name].has(dependency)) failures.push(`${name} may not depend on ${dependency}`);
  }

  const sourceFiles = (await files(fileURLToPath(new URL(`../packages/${name}/src/`, import.meta.url)))).filter((path) => /\.[cm]?[jt]sx?$/.test(path));
  for (const path of sourceFiles) {
    const source = await readFile(path, "utf8");
    if (/aifrontkit-(pro|platform)/.test(source)) failures.push(`${path} references a private repository`);
    for (const specifier of importSpecifiers(source)) {
      if (specifier.startsWith(".") && /(?:^|\/)\.\.\/(?:.*\/)?(?:apps|registry)(?:\/|$)/.test(specifier)) {
        failures.push(path + " reaches from a published package into " + specifier);
      }
    }
    for (const match of source.matchAll(/from\s+["'](@aifrontkit\/[^"']+)["']/g)) {
      const specifier = match[1];
      const publicPackage = specifier.split("/").slice(0, 2).join("/");
      if (!allowed[name].has(publicPackage)) failures.push(`${path} imports forbidden ${specifier}`);
      if (specifier.includes("/src/") || specifier.includes("/internal/")) failures.push(`${path} deep-imports ${specifier}`);
    }
    if (name === "core" && /from\s+["'](?:react|react-dom|node:|@?[^./])/.test(source)) {
      failures.push(`${path} gives core a framework or runtime dependency`);
    }
  }
}

for (const path of (await files(registryRoot)).filter((candidate) => /\.[cm]?[jt]sx?$/.test(candidate))) {
  const source = await readFile(path, "utf8");
  for (const specifier of importSpecifiers(source)) {
    if (!specifier.startsWith(".")) continue;
    const target = resolve(dirname(path), specifier);
    if (relative(appsRoot, target).split("/")[0] !== "..") {
      failures.push(path + " imports app-owned source " + specifier);
    }
  }
}

for (const appName of await readdir(appsRoot)) {
  const appSource = join(appsRoot, appName, "src");
  let appFiles = [];
  try {
    appFiles = (await files(appSource)).filter((candidate) => /\.[cm]?[jt]sx?$/.test(candidate));
  } catch (error) {
    if (!(error && typeof error === "object" && error.code === "ENOENT")) throw error;
  }
  for (const path of appFiles) {
    const source = await readFile(path, "utf8");
    for (const specifier of importSpecifiers(source)) {
      if (!specifier.startsWith(".")) continue;
      const target = resolve(dirname(path), specifier);
      const relativeTarget = relative(appsRoot, target).split("/");
      if (relativeTarget[0] !== ".." && relativeTarget[0] !== appName) {
        failures.push(path + " imports sibling app source " + specifier);
      }
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Package and repository boundaries are valid.");
