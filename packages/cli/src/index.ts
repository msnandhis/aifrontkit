import { createHash } from "node:crypto";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";

/** The current on-disk configuration schema. */
export const CONFIG_SCHEMA_VERSION = 2 as const;
/** The current on-disk installer provenance schema. */
export const PROVENANCE_SCHEMA_VERSION = 2 as const;

export type AIFrontKitFramework = "react";
export type AIFrontKitFlavor = "css-modules" | "tailwind";

export interface AIFrontKitTarget {
  framework: AIFrontKitFramework;
  flavor: AIFrontKitFlavor;
}

/**
 * Configuration written by `aifrontkit init`.
 *
 * `output` is a filesystem path relative to the project root. `imports` is an
 * import specifier used in generated examples. Keeping those values separate
 * avoids treating a TypeScript alias (`@/...`) as a real directory.
 */
export interface AIFrontKitConfig {
  $schema: string;
  schemaVersion: typeof CONFIG_SCHEMA_VERSION;
  target: AIFrontKitTarget;
  output: {
    components: string;
    styles?: string;
  };
  imports: {
    components: string;
  };
  registry?: string;
}

/** The v1 shape is intentionally kept readable for migration and upgrades. */
export interface LegacyAIFrontKitConfig {
  $schema?: string;
  schemaVersion?: 1;
  framework?: string;
  style?: string;
  aliases?: { aifrontkit?: string };
  registry?: string;
  target?: { framework?: string; flavor?: string; style?: string };
  output?: { components?: string; styles?: string };
  imports?: { components?: string };
}

export interface InstalledFile {
  path: string;
  source: string;
  hash: string;
}

export interface ProvenanceCompatibility {
  /** Compatibility range declared by the registry item for AIFrontKit itself. */
  aifrontkit?: string;
  /** Registry item schema major used to install this source. */
  schemaMajor?: number;
  /** Runtime/package dependencies declared by the registry item. */
  packages: string[];
  /** Optional richer compatibility data from newer registry manifests. */
  runtime?: Record<string, string> | string;
}

export interface ProvenanceRegistry {
  /** URL or resolved local path from which the item was installed. */
  origin: string;
  manifestPath: string;
  manifestDigest: string;
  sourceDigest: string;
}

export interface ProvenanceMigration {
  action: "install" | "update" | "migrate";
  appliedAt: string;
  fromVersion?: string;
  toVersion?: string;
  fromSchemaVersion?: number;
  toSchemaVersion?: number;
  fromSourceDigest?: string;
  toSourceDigest?: string;
}

export interface InstalledItem {
  name: string;
  version: string;
  installedAt: string;
  files: InstalledFile[];
  registry?: ProvenanceRegistry;
  target?: AIFrontKitTarget & {
    output: string;
    import: string;
  };
  compatibility?: ProvenanceCompatibility;
  migrationHistory?: ProvenanceMigration[];
}

export interface Provenance {
  schemaVersion: typeof PROVENANCE_SCHEMA_VERSION;
  items: Record<string, InstalledItem>;
}

export interface RegistryFile {
  path: string;
  type: string;
}

export interface RegistryItem {
  name: string;
  type?: string;
  files: RegistryFile[];
  dependencies?: string[];
  registryDependencies?: string[];
  meta?: {
    version?: string;
    schemaMajor?: number;
    aifrontkit?: string;
    runtime?: Record<string, string> | string;
    packages?: Record<string, string>;
    target?: { framework?: string; flavor?: string; style?: string };
    compatibility?: {
      aifrontkit?: string;
      schemaMajor?: number;
      runtime?: Record<string, string> | string;
      packages?: Record<string, string>;
    };
  };
}

export interface RegistryCatalogTarget extends AIFrontKitTarget {
  manifest: string;
}

export interface RegistryCatalogItem {
  name: string;
  type: string;
  title: string;
  description: string;
  targets: RegistryCatalogTarget[];
}

export interface RegistryCatalog {
  schemaVersion: 1;
  name: string;
  items: RegistryCatalogItem[];
}

export interface PlannedFile extends InstalledFile {
  itemName: string;
  content: string;
}

export interface PlannedItem {
  name: string;
  version: string;
  manifestDigest: string;
  sourceDigest: string;
  compatibility: ProvenanceCompatibility;
}

export interface AddPlan {
  config: AIFrontKitConfig;
  registry: string;
  registryOrigin: string;
  item: RegistryItem;
  items: Map<string, RegistryItem>;
  manifestPaths: Map<string, string>;
  plannedItems: Map<string, PlannedItem>;
  files: PlannedFile[];
  dependencies: string[];
}

const configName = "aifrontkit.json";
const provenancePath = ".aifrontkit/installed.json";
const configSchema = "https://aifrontkit.dev/schemas/config.json";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/** Stable JSON is used for digests so whitespace/key-order changes are harmless. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

async function json<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${label} must be a non-empty string.`);
  return value.trim();
}

function normalizeFlavor(value: unknown): AIFrontKitFlavor {
  const flavor = typeof value === "string" ? value.trim().toLowerCase() : "css-modules";
  if (flavor === "css" || flavor === "css-modules" || flavor === "css_modules") return "css-modules";
  if (flavor === "tailwind") return "tailwind";
  throw new Error(`Unsupported AIFrontKit registry flavor '${String(value)}'.`);
}

function normalizeFramework(value: unknown): AIFrontKitFramework {
  const framework = typeof value === "string" ? value.trim().toLowerCase() : "react";
  if (framework === "react") return "react";
  throw new Error(`Unsupported AIFrontKit framework '${String(value)}'.`);
}

function normalizeImportAlias(value: unknown) {
  const alias = requiredString(value, "imports.components");
  if (alias.includes("\\") || alias.includes("\u0000")) throw new Error("imports.components must be a valid import specifier.");
  return alias;
}

function inferOutputFromImport(alias: string) {
  if (alias.startsWith("@/")) return alias.slice(2);
  if (alias.startsWith("./")) return alias.slice(2);
  return alias;
}

function rawObject(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${configName} must contain a JSON object.`);
  return value;
}

/**
 * Normalize both v1 and v2 config files to the current contract.
 *
 * This function is pure: commands that only inspect a project do not rewrite
 * its files. Use `migrateProject` to persist the normalized shape explicitly.
 */
export function migrateConfig(input: unknown): AIFrontKitConfig {
  const raw = rawObject(input);
  const version = raw.schemaVersion;
  if (version !== undefined && version !== 1 && version !== CONFIG_SCHEMA_VERSION) {
    throw new Error(`Unsupported ${configName} schema version '${String(version)}'.`);
  }
  const target = isRecord(raw.target) ? raw.target : {};
  const framework = normalizeFramework(target.framework ?? raw.framework);
  const flavor = normalizeFlavor(target.flavor ?? target.style ?? raw.style);
  const aliases = isRecord(raw.aliases) ? raw.aliases : {};
  const importsObject = isRecord(raw.imports) ? raw.imports : {};
  const outputObject = isRecord(raw.output) ? raw.output : {};
  const importAlias = normalizeImportAlias(importsObject.components ?? aliases.aifrontkit ?? "@/components/aifrontkit");
  const outputComponents = requiredString(outputObject.components ?? inferOutputFromImport(importAlias), "output.components");
  const outputStyles = outputObject.styles === undefined ? undefined : requiredString(outputObject.styles, "output.styles");
  const registry = raw.registry === undefined ? undefined : requiredString(raw.registry, "registry");
  return {
    $schema: typeof raw.$schema === "string" && raw.$schema.length > 0 ? raw.$schema : configSchema,
    schemaVersion: CONFIG_SCHEMA_VERSION,
    target: { framework, flavor },
    output: { components: outputComponents, ...(outputStyles ? { styles: outputStyles } : {}) },
    imports: { components: importAlias },
    ...(registry ? { registry } : {})
  };
}

export function isCurrentConfig(config: unknown): config is AIFrontKitConfig {
  try {
    return migrateConfig(config).schemaVersion === CONFIG_SCHEMA_VERSION && isRecord(config) && config.schemaVersion === CONFIG_SCHEMA_VERSION && isRecord(config.target) && isRecord(config.output) && isRecord(config.imports);
  } catch {
    return false;
  }
}

/** Resolve an explicit filesystem output path inside the project root. */
export function outputToDirectory(root: string, output: string) {
  const projectRoot = resolve(root);
  const value = requiredString(output, "output.components");
  const target = resolve(projectRoot, value);
  const pathFromRoot = relative(projectRoot, target);
  if (!pathFromRoot || pathFromRoot.startsWith("..") || isAbsolute(pathFromRoot)) {
    throw new Error("output.components must resolve to a directory inside the project root.");
  }
  return target;
}

async function assertRealOutputContained(root: string, target: string) {
  const realRoot = await realpath(resolve(root));
  let existingAncestor = target;
  while (true) {
    try {
      existingAncestor = await realpath(existingAncestor);
      break;
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
      const parent = dirname(existingAncestor);
      if (parent === existingAncestor) throw error;
      existingAncestor = parent;
    }
  }
  const pathFromRoot = relative(realRoot, existingAncestor);
  if (pathFromRoot.startsWith("..") || isAbsolute(pathFromRoot)) {
    throw new Error("output.components must not traverse a symlink outside the project root.");
  }
}

/**
 * Resolve a legacy alias. Kept public for consumers of the v1 CLI API; new
 * projects should use `outputToDirectory` for filesystem paths.
 */
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
    try {
      await readFile(path);
      throw new Error(`${configName} already exists. Use --force to replace it.`);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        /* expected */
      } else throw error;
    }
  }
  const config: AIFrontKitConfig = {
    $schema: configSchema,
    schemaVersion: CONFIG_SCHEMA_VERSION,
    target: { framework: "react", flavor: "css-modules" },
    output: { components: "src/components/aifrontkit" },
    imports: { components: "@/components/aifrontkit" },
    ...(options.registry ? { registry: options.registry } : {})
  };
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
  return path;
}

async function readRawProjectConfig(root: string) {
  return json<unknown>(join(root, configName));
}

async function loadProject(root: string) {
  const config = migrateConfig(await readRawProjectConfig(root));
  // Validate the explicit output path before reading a registry. This keeps
  // malformed configs from producing a partial operation plan.
  outputToDirectory(root, config.output.components);
  return config;
}

/** Persist a v1 -> v2 config migration without changing any component files. */
export async function migrateProject(root: string) {
  const before = await readRawProjectConfig(root);
  const config = migrateConfig(before);
  const changed = !isCurrentConfig(before) || stableStringify(before) !== stableStringify(config);
  if (changed) await writeFile(join(root, configName), `${JSON.stringify(config, null, 2)}\n`);
  return { config, changed };
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

async function loadRegistryCatalog(registry: string): Promise<RegistryCatalog> {
  const catalog = JSON.parse(await readRegistryFile(registry, "registry/registry.json")) as RegistryCatalog;
  validateRegistryCatalog(catalog);
  return catalog;
}

export function validateRegistryCatalog(catalog: unknown): asserts catalog is RegistryCatalog {
  if (!isRecord(catalog) || catalog.schemaVersion !== 1 || typeof catalog.name !== "string" || !Array.isArray(catalog.items)) {
    throw new Error("Registry catalog has an unsupported schema.");
  }
  const names = new Set<string>();
  for (const value of catalog.items) {
    if (!isRecord(value) || typeof value.name !== "string" || typeof value.type !== "string" || typeof value.title !== "string" || typeof value.description !== "string" || !Array.isArray(value.targets) || value.targets.length === 0) {
      throw new Error("Registry catalog contains an invalid item.");
    }
    if (names.has(value.name)) throw new Error(`Registry catalog contains duplicate item '${value.name}'.`);
    names.add(value.name);
    const targets = new Set<string>();
    for (const candidate of value.targets) {
      if (!isRecord(candidate) || candidate.framework !== "react" || !["css-modules", "tailwind"].includes(String(candidate.flavor)) || typeof candidate.manifest !== "string") {
        throw new Error(`Registry catalog item '${value.name}' contains an invalid target.`);
      }
      const key = `${candidate.framework}/${candidate.flavor}`;
      if (targets.has(key)) throw new Error(`Registry catalog item '${value.name}' contains duplicate target '${key}'.`);
      targets.add(key);
    }
  }
}

export function resolveRegistryCatalogItem(catalog: RegistryCatalog, name: string, target: AIFrontKitTarget): RegistryCatalogTarget {
  validateRegistryCatalog(catalog);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new Error(`Invalid registry item name '${name}'.`);
  const entry = catalog.items.find((item) => item.name === name);
  if (!entry) throw new Error(`Registry item '${name}' was not found in the catalog.`);
  const match = entry.targets.find((candidate) => candidate.framework === target.framework && candidate.flavor === target.flavor);
  if (match) return match;
  const available = entry.targets.map((candidate) => `${candidate.framework}/${candidate.flavor}`).sort().join(", ");
  throw new Error(`Registry item '${name}' is not available for ${target.framework}/${target.flavor}. Available targets: ${available || "none"}.`);
}

async function loadItem(registry: string, catalog: RegistryCatalog, name: string, target: AIFrontKitTarget) {
  const manifestPath = resolveRegistryCatalogItem(catalog, name, target).manifest;
  const item = JSON.parse(await readRegistryFile(registry, manifestPath)) as RegistryItem;
  if (!item || typeof item.name !== "string" || !Array.isArray(item.files)) throw new Error(`Registry item '${name}' has an invalid manifest.`);
  if (item.name !== name) throw new Error(`Registry item '${item.name}' does not match requested item '${name}'.`);
  return { item, manifestPath };
}

function registryOrigin(registry: string) {
  return /^https?:\/\//.test(registry) ? registry.replace(/\/$/, "") : resolve(registry);
}

function rewriteInstalledImports(source: string) {
  return source.replace(/\.\.\/([a-z0-9-]+)\/\1\.js/g, "./$1.js");
}

async function loadItemTree(
  registry: string,
  catalog: RegistryCatalog,
  name: string,
  target: AIFrontKitTarget,
  items = new Map<string, RegistryItem>(),
  manifestPaths = new Map<string, string>(),
  visiting = new Set<string>(),
): Promise<{ items: Map<string, RegistryItem>; manifestPaths: Map<string, string> }> {
  if (visiting.has(name)) throw new Error(`Registry dependency cycle includes '${name}'.`);
  if (items.has(name)) return { items, manifestPaths };
  visiting.add(name);
  const { item, manifestPath } = await loadItem(registry, catalog, name, target);
  items.set(name, item);
  manifestPaths.set(name, manifestPath);
  for (const dependency of item.registryDependencies ?? []) await loadItemTree(registry, catalog, dependency, target, items, manifestPaths, visiting);
  visiting.delete(name);
  return { items, manifestPaths };
}

function migrateInstalledItem(item: unknown, target: AIFrontKitConfig["target"] | undefined, fromLegacySchema: boolean): InstalledItem {
  const raw = isRecord(item) ? item : {};
  const files = Array.isArray(raw.files) ? raw.files.filter(isRecord).map((file) => ({
    path: typeof file.path === "string" ? file.path : "",
    source: typeof file.source === "string" ? file.source : "",
    hash: typeof file.hash === "string" ? file.hash : ""
  })) : [];
  const name = typeof raw.name === "string" ? raw.name : "unknown";
  const version = typeof raw.version === "string" ? raw.version : "0.0.0";
  const installedAt = typeof raw.installedAt === "string" ? raw.installedAt : new Date(0).toISOString();
  const oldDigest = hash(stableStringify(files));
  const oldHistory: ProvenanceMigration[] = fromLegacySchema ? [{
      action: "migrate",
      appliedAt: new Date().toISOString(),
      fromSchemaVersion: 1,
      toSchemaVersion: PROVENANCE_SCHEMA_VERSION,
      fromSourceDigest: oldDigest,
      toSourceDigest: oldDigest
    }] : [];
  const existingHistory = Array.isArray(raw.migrationHistory) ? raw.migrationHistory.filter(isRecord) as unknown as ProvenanceMigration[] : [];
  const registry = isRecord(raw.registry) ? {
    origin: typeof raw.registry.origin === "string" ? raw.registry.origin : "unknown",
    manifestPath: typeof raw.registry.manifestPath === "string" ? raw.registry.manifestPath : "",
    manifestDigest: typeof raw.registry.manifestDigest === "string" ? raw.registry.manifestDigest : "unknown",
    sourceDigest: typeof raw.registry.sourceDigest === "string" ? raw.registry.sourceDigest : oldDigest
  } : undefined;
  const compatibility = isRecord(raw.compatibility) ? {
    ...(typeof raw.compatibility.aifrontkit === "string" ? { aifrontkit: raw.compatibility.aifrontkit } : {}),
    ...(typeof raw.compatibility.schemaMajor === "number" ? { schemaMajor: raw.compatibility.schemaMajor } : {}),
    packages: Array.isArray(raw.compatibility.packages) ? raw.compatibility.packages.filter((entry): entry is string => typeof entry === "string") : [],
    ...(typeof raw.compatibility.runtime === "string" || isRecord(raw.compatibility.runtime) ? { runtime: raw.compatibility.runtime as Record<string, string> | string } : {})
  } : undefined;
  const storedTarget = isRecord(raw.target) && typeof raw.target.framework === "string" && typeof raw.target.flavor === "string" ? {
    framework: raw.target.framework as AIFrontKitFramework,
    flavor: raw.target.flavor as AIFrontKitFlavor,
    output: typeof raw.target.output === "string" ? raw.target.output : "",
    import: typeof raw.target.import === "string" ? raw.target.import : ""
  } : undefined;
  // Targetless legacy provenance stays unknown. Assigning the project's current
  // target would make a later flavor change look safe and could overwrite source.
  const resolvedTarget = storedTarget;
  return {
    name,
    version,
    installedAt,
    files,
    ...(registry ? { registry } : {}),
    ...(resolvedTarget ? { target: resolvedTarget } : {}),
    ...(compatibility ? { compatibility } : {}),
    migrationHistory: [...oldHistory, ...existingHistory]
  };
}

export function migrateProvenance(input: unknown, target?: AIFrontKitConfig["target"]): Provenance {
  const raw = isRecord(input) ? input : {};
  const version = raw.schemaVersion;
  if (version !== undefined && version !== 1 && version !== PROVENANCE_SCHEMA_VERSION) {
    throw new Error(`Unsupported installed provenance schema version '${String(version)}'.`);
  }
  const rawItems = isRecord(raw.items) ? raw.items : {};
  const items = Object.fromEntries(Object.entries(rawItems).map(([name, item]) => {
    const migrated = migrateInstalledItem(item, target, version === 1);
    return [name, { ...migrated, name: migrated.name === "unknown" ? name : migrated.name }];
  }));
  return { schemaVersion: PROVENANCE_SCHEMA_VERSION, items };
}

async function loadProvenance(root: string, target?: AIFrontKitConfig["target"]): Promise<Provenance> {
  try {
    return migrateProvenance(await json<unknown>(join(root, provenancePath)), target);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return { schemaVersion: PROVENANCE_SCHEMA_VERSION, items: {} };
    throw error;
  }
}

async function saveProvenance(root: string, provenance: Provenance) {
  const path = join(root, provenancePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(provenance, null, 2)}\n`);
}

function itemCompatibility(item: RegistryItem, dependencies: string[]): ProvenanceCompatibility {
  const meta = item.meta;
  const richer = meta?.compatibility;
  const aifrontkit = richer?.aifrontkit ?? meta?.aifrontkit;
  const schemaMajor = richer?.schemaMajor ?? meta?.schemaMajor;
  const runtime = richer?.runtime ?? meta?.runtime;
  const packageMap = richer?.packages ?? meta?.packages;
  const packages = [...new Set([
    ...dependencies,
    ...(packageMap ? Object.entries(packageMap).map(([name, range]) => `${name}@${range}`) : [])
  ])].sort();
  return {
    packages,
    ...(aifrontkit !== undefined ? { aifrontkit } : {}),
    ...(schemaMajor !== undefined ? { schemaMajor } : {}),
    ...(runtime !== undefined ? { runtime } : {})
  };
}

function itemManifestDigest(item: RegistryItem) {
  return hash(stableStringify(item));
}

function itemSourceDigest(item: RegistryItem, files: PlannedFile[]) {
  return hash(stableStringify(files.filter((file) => file.itemName === item.name).map((file) => ({ source: file.source, hash: file.hash })).sort((a, b) => a.source.localeCompare(b.source))));
}

function validateItemTarget(item: RegistryItem, config: AIFrontKitConfig) {
  const target = item.meta?.target;
  if (!target) return;
  const manifestFramework = target.framework;
  const manifestFlavor = target.flavor ?? target.style;
  if (manifestFramework && manifestFramework !== config.target.framework) throw new Error(`Registry item '${item.name}' targets ${manifestFramework}, not ${config.target.framework}.`);
  if (manifestFlavor && normalizeFlavor(manifestFlavor) !== config.target.flavor) throw new Error(`Registry item '${item.name}' targets ${manifestFlavor}, not ${config.target.flavor}.`);
}

export async function planAdd(root: string, name: string, registryOverride?: string): Promise<AddPlan> {
  const config = await loadProject(root);
  const registry = registryOverride ?? config.registry ?? "https://registry.aifrontkit.dev";
  const catalog = await loadRegistryCatalog(registry);
  const { item } = await loadItem(registry, catalog, name, config.target);
  const { items, manifestPaths } = await loadItemTree(registry, catalog, name, config.target);
  for (const current of items.values()) validateItemTarget(current, config);
  const targetDirectory = outputToDirectory(root, config.output.components);
  await assertRealOutputContained(root, targetDirectory);
  const declaredFiles = [...items.values()].flatMap((owner) => owner.files.map((file) => ({ owner: owner.name, file })));
  const files = await Promise.all(declaredFiles.map(async ({ owner, file }) => {
    const content = rewriteInstalledImports(await readRegistryFile(registry, file.path));
    const path = join(targetDirectory, basename(file.path));
    return { itemName: owner, path, source: file.path, content, hash: hash(content) };
  }));
  const destinations = new Set<string>();
  for (const file of files) {
    if (destinations.has(file.path)) throw new Error(`Registry items resolve to the same output file: ${file.path}`);
    destinations.add(file.path);
  }
  const dependencies = [...new Set([...items.values()].flatMap((owner) => owner.dependencies ?? []))].sort();
  const plannedItems = new Map<string, PlannedItem>();
  for (const [itemName, current] of items) {
    plannedItems.set(itemName, {
      name: itemName,
      version: current.meta?.version ?? "0.0.0",
      manifestDigest: itemManifestDigest(current),
      sourceDigest: itemSourceDigest(current, files),
      compatibility: itemCompatibility(current, dependencies)
    });
  }
  return { config, registry, registryOrigin: registryOrigin(registry), item, items, manifestPaths, plannedItems, files, dependencies };
}

export async function addItem(root: string, name: string, options: { registry?: string; force?: boolean; dryRun?: boolean } = {}) {
  const plan = await planAdd(root, name, options.registry);
  const provenance = await loadProvenance(root, plan.config.target);
  for (const itemName of plan.items.keys()) {
    const previous = provenance.items[itemName];
    if (previous && !previous.target) {
      throw new Error(`Registry item '${itemName}' has legacy provenance without a known framework/style target. Run an explicit provenance migration before replacing its source.`);
    }
    if (previous?.target && (previous.target.framework !== plan.config.target.framework || previous.target.flavor !== plan.config.target.flavor)) {
      throw new Error(`Registry item '${itemName}' was installed for ${previous.target.framework}/${previous.target.flavor}. Use a separate output or an explicit style migration before installing ${plan.config.target.framework}/${plan.config.target.flavor}.`);
    }
  }
  for (const file of plan.files) {
    try {
      const existing = await readFile(file.path, "utf8");
      if (!options.force && existing !== file.content) throw new Error(`${file.path} has local changes. Use diff before --force.`);
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
  if (options.dryRun) return plan;
  await mkdir(outputToDirectory(root, plan.config.output.components), { recursive: true });
  for (const file of plan.files) await writeFile(file.path, file.content);
  for (const [itemName, item] of plan.items) {
    const planned = plan.plannedItems.get(itemName)!;
    const previous = provenance.items[itemName];
    const history = previous?.migrationHistory ? [...previous.migrationHistory] : [];
    const changed = !previous || previous.registry?.sourceDigest !== planned.sourceDigest || previous.version !== planned.version;
    if (changed) {
      history.push({
        action: previous ? "update" : "install",
        appliedAt: new Date().toISOString(),
        ...(previous ? { fromVersion: previous.version } : {}),
        ...(previous?.registry?.sourceDigest ? { fromSourceDigest: previous.registry.sourceDigest } : {}),
        toVersion: planned.version,
        toSourceDigest: planned.sourceDigest
      });
    }
    provenance.items[itemName] = {
      name: itemName,
      version: planned.version,
      installedAt: new Date().toISOString(),
      files: plan.files.filter((file) => file.itemName === itemName).map((file) => ({ path: relative(resolve(root), file.path), source: file.source, hash: file.hash })),
      registry: {
        origin: plan.registryOrigin,
        manifestPath: plan.manifestPaths.get(itemName)!,
        manifestDigest: planned.manifestDigest,
        sourceDigest: planned.sourceDigest
      },
      target: { ...plan.config.target, output: plan.config.output.components, import: plan.config.imports.components },
      compatibility: planned.compatibility,
      migrationHistory: history
    };
  }
  await saveProvenance(root, provenance);
  return plan;
}

export async function diffItem(root: string, name: string, registryOverride?: string) {
  const plan = await planAdd(root, name, registryOverride);
  const results: Array<{ path: string; status: "current" | "modified" | "missing" }> = [];
  for (const file of plan.files) {
    try {
      const local = await readFile(file.path, "utf8");
      results.push({ path: file.path, status: local === file.content ? "current" : "modified" });
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") results.push({ path: file.path, status: "missing" });
      else throw error;
    }
  }
  return results;
}

export async function doctor(root: string) {
  const config = await loadProject(root);
  const provenance = await loadProvenance(root, config.target);
  const targetDirectory = outputToDirectory(root, config.output.components);
  return { config, provenance, targetDirectory, importAlias: config.imports.components };
}
