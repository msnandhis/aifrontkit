import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";

export interface AIFrontKitConfig {
  $schema: string;
  framework: "react";
  style: "css";
  aliases: { aifrontkit: string };
  registry?: string;
}

export interface InstalledFile {
  path: string;
  source: string;
  hash: string;
}

export interface InstalledItem {
  name: string;
  version: string;
  installedAt: string;
  files: InstalledFile[];
}

export interface Provenance {
  schemaVersion: 1;
  items: Record<string, InstalledItem>;
}

interface RegistryItem {
  name: string;
  files: Array<{ path: string; type: string }>;
  dependencies?: string[];
  registryDependencies?: string[];
  meta?: { version?: string };
}

const configName = "aifrontkit.json";
const provenancePath = ".aifrontkit/installed.json";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function json<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export function aliasToDirectory(root: string, alias: string) {
  const projectRoot = resolve(root);
  const target = alias.startsWith("@/")
    ? resolve(projectRoot, alias.slice(2))
    : alias.startsWith("./") || alias.startsWith("../") || isAbsolute(alias)
      ? resolve(projectRoot, alias)
      : null;
  if (!target) throw new Error("aliases.aifrontkit must be an absolute path, '@/…', './…', or '../…'.");
  const pathFromRoot = relative(projectRoot, target);
  if (!pathFromRoot || pathFromRoot.startsWith("..") || isAbsolute(pathFromRoot)) {
    throw new Error("aliases.aifrontkit must resolve to a directory inside the project root.");
  }
  return target;
}

export async function initProject(root: string, options: { force?: boolean; registry?: string } = {}) {
  const path = join(root, configName);
  if (!options.force) {
    try { await readFile(path); throw new Error(`${configName} already exists. Use --force to replace it.`); } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") { /* expected */ }
      else throw error;
    }
  }
  const config: AIFrontKitConfig = {
    $schema: "https://aifrontkit.dev/schemas/config.json",
    framework: "react",
    style: "css",
    aliases: { aifrontkit: "@/components/aifrontkit" },
    ...(options.registry ? { registry: options.registry } : {})
  };
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
  return path;
}

async function loadProject(root: string) {
  const config = await json<AIFrontKitConfig>(join(root, configName));
  if (config.framework !== "react" || config.style !== "css") throw new Error("This CLI release supports the react/css registry flavor.");
  return config;
}

async function readRegistryFile(registry: string, sourcePath: string) {
  const normalizedSource = sourcePath.replaceAll("\\", "/");
  if (normalizedSource.split("/").includes("..") || normalizedSource.startsWith("/")) throw new Error(`Registry path escapes its root: ${sourcePath}`);
  if (/^https?:\/\//.test(registry)) {
    const response = await fetch(`${registry.replace(/\/$/, "")}/${sourcePath}`);
    if (!response.ok) throw new Error(`Registry returned ${response.status} for ${sourcePath}.`);
    return response.text();
  }
  const registryRoot = resolve(registry);
  const target = resolve(registryRoot, sourcePath);
  const pathFromRoot = relative(registryRoot, target);
  if (pathFromRoot.startsWith("..") || isAbsolute(pathFromRoot)) throw new Error(`Registry path escapes its root: ${sourcePath}`);
  return readFile(target, "utf8");
}

async function loadItem(registry: string, name: string) {
  const manifestPath = `registry/react/css/components/${name}/registry.json`;
  return JSON.parse(await readRegistryFile(registry, manifestPath)) as RegistryItem;
}

function rewriteInstalledImports(source: string) {
  return source.replace(/\.\.\/([a-z0-9-]+)\/\1\.js/g, "./$1.js");
}

async function loadItemTree(registry: string, name: string, items = new Map<string, RegistryItem>()): Promise<Map<string, RegistryItem>> {
  if (items.has(name)) return items;
  const item = await loadItem(registry, name);
  items.set(name, item);
  for (const dependency of item.registryDependencies ?? []) await loadItemTree(registry, dependency, items);
  return items;
}

async function loadProvenance(root: string): Promise<Provenance> {
  try { return await json<Provenance>(join(root, provenancePath)); }
  catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return { schemaVersion: 1, items: {} };
    throw error;
  }
}

async function saveProvenance(root: string, provenance: Provenance) {
  const path = join(root, provenancePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(provenance, null, 2)}\n`);
}

export async function planAdd(root: string, name: string, registryOverride?: string) {
  const config = await loadProject(root);
  const registry = registryOverride ?? config.registry ?? "https://registry.aifrontkit.dev";
  const item = await loadItem(registry, name);
  if (item.name !== name) throw new Error(`Registry item '${item.name}' does not match requested item '${name}'.`);
  const items = await loadItemTree(registry, name);
  const targetDirectory = aliasToDirectory(root, config.aliases.aifrontkit);
  const declaredFiles = [...items.values()].flatMap((owner) => owner.files.map((file) => ({ owner: owner.name, file })));
  const files = await Promise.all(declaredFiles.map(async ({ owner, file }) => {
    const content = rewriteInstalledImports(await readRegistryFile(registry, file.path));
    const path = join(targetDirectory, basename(file.path));
    return { itemName: owner, path, source: file.path, content, hash: hash(content) };
  }));
  return { config, registry, item, items, files };
}

export async function addItem(root: string, name: string, options: { registry?: string; force?: boolean; dryRun?: boolean } = {}) {
  const plan = await planAdd(root, name, options.registry);
  for (const file of plan.files) {
    try {
      const existing = await readFile(file.path, "utf8");
      if (!options.force && existing !== file.content) throw new Error(`${file.path} has local changes. Use diff before --force.`);
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
  if (options.dryRun) return plan;
  await mkdir(aliasToDirectory(root, plan.config.aliases.aifrontkit), { recursive: true });
  for (const file of plan.files) await writeFile(file.path, file.content);
  const provenance = await loadProvenance(root);
  for (const [itemName, item] of plan.items) {
    provenance.items[itemName] = {
      name: itemName,
      version: item.meta?.version ?? "0.0.0",
      installedAt: new Date().toISOString(),
      files: plan.files.filter((file) => file.itemName === itemName).map((file) => ({ path: relative(resolve(root), file.path), source: file.source, hash: file.hash }))
    };
  }
  await saveProvenance(root, provenance);
  return plan;
}

export async function diffItem(root: string, name: string, registryOverride?: string) {
  const plan = await planAdd(root, name, registryOverride);
  const results = [];
  for (const file of plan.files) {
    try {
      const local = await readFile(file.path, "utf8");
      results.push({ path: file.path, status: local === file.content ? "current" as const : "modified" as const });
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") results.push({ path: file.path, status: "missing" as const });
      else throw error;
    }
  }
  return results;
}

export async function doctor(root: string) {
  const config = await loadProject(root);
  const provenance = await loadProvenance(root);
  const targetDirectory = aliasToDirectory(root, config.aliases.aifrontkit);
  return { config, provenance, targetDirectory };
}
