import { mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  addItem,
  aliasToDirectory,
  diffItem,
  initProject,
  getRegistryItemInfo,
  listRegistryItems,
  migrateConfig,
  migrateProject,
  migrateProvenance,
  outputToDirectory,
  planAdd,
  resolveRegistryCatalogItem,
} from "../src/index.js";

const repositoryRoot = resolve(import.meta.dirname, "../../..");

describe("AIFrontKit CLI", () => {
  it("resolves source aliases without coupling to a framework CLI", () => {
    expect(aliasToDirectory("/project", "@/components/aifrontkit")).toBe("/project/components/aifrontkit");
    expect(() => aliasToDirectory("/project", "../../outside")).toThrow(/inside the project root/);
  });

  it("installs registry source and records provenance", async () => {
    const root = await mkdtemp(join(tmpdir(), "aifrontkit-cli-"));
    await initProject(root, { registry: repositoryRoot });
    await addItem(root, "file");
    expect(await readFile(join(root, "src/components/aifrontkit/file.tsx"), "utf8")).toContain("export const File");
    const provenance = JSON.parse(await readFile(join(root, ".aifrontkit/installed.json"), "utf8"));
    expect(provenance.schemaVersion).toBe(2);
    expect(provenance.items.file.version).toBe("0.1.0");
    expect(provenance.items.file.registry.origin).toBe(repositoryRoot);
    expect(provenance.items.file.registry.manifestDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(provenance.items.file.registry.sourceDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(provenance.items.file.target).toEqual({
      framework: "react",
      flavor: "css-modules",
      output: "src/components/aifrontkit",
      import: "@/components/aifrontkit",
    });
    expect(provenance.items.file.compatibility.packages).toEqual(["@aifrontkit/core@^0.1.0"]);
    expect(provenance.items.file.migrationHistory[0].action).toBe("install");
    expect((await diffItem(root, "file"))).toEqual(expect.arrayContaining([expect.objectContaining({ status: "current" })]));
    await writeFile(join(root, "src/components/aifrontkit/file.tsx"), "local change\n");
    expect((await diffItem(root, "file"))).toEqual(expect.arrayContaining([expect.objectContaining({ status: "modified" })]));
  });

  it("keeps filesystem output and import aliases independent", async () => {
    const root = await mkdtemp(join(tmpdir(), "aifrontkit-cli-output-"));
    await initProject(root, { registry: repositoryRoot });
    const configPath = join(root, "aifrontkit.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.output.components = "src/ui/aifrontkit";
    config.imports.components = "@/ui/aifrontkit";
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
    expect(outputToDirectory(root, config.output.components)).toBe(join(root, "src/ui/aifrontkit"));
    await addItem(root, "file");
    expect(await readFile(join(root, "src/ui/aifrontkit/file.tsx"), "utf8")).toContain("export const File");
    const provenance = JSON.parse(await readFile(join(root, ".aifrontkit/installed.json"), "utf8"));
    expect(provenance.items.file.target.output).toBe("src/ui/aifrontkit");
    expect(provenance.items.file.target.import).toBe("@/ui/aifrontkit");
  });

  it("resolves registry items by framework, flavor, and name", async () => {
    const catalog = {
      schemaVersion: 1 as const,
      name: "test",
      items: [{
        name: "file", type: "registry:component", title: "File", description: "File",
        targets: [
          { framework: "react" as const, flavor: "css-modules" as const, manifest: "registry/react/css/components/file/registry.json" },
          { framework: "react" as const, flavor: "tailwind" as const, manifest: "registry/react/tailwind/components/file/registry.json" },
        ],
      }],
    };
    expect(resolveRegistryCatalogItem(catalog, "file", { framework: "react", flavor: "css-modules" }).manifest)
      .toBe("registry/react/css/components/file/registry.json");
    expect(resolveRegistryCatalogItem(catalog, "file", { framework: "react", flavor: "tailwind" }).manifest)
      .toBe("registry/react/tailwind/components/file/registry.json");
    expect(() => resolveRegistryCatalogItem(catalog, "../file", { framework: "react", flavor: "tailwind" }))
      .toThrow(/Invalid registry item name/);

    const root = await mkdtemp(join(tmpdir(), "aifrontkit-cli-tailwind-"));
    await initProject(root, { registry: repositoryRoot });
    const configPath = join(root, "aifrontkit.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.target.flavor = "tailwind";
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

    await expect(addItem(root, "file")).rejects.toThrow(/not available for react\/tailwind/);
  });

  it("exposes deterministic registry discovery for agents and MCP bridges", async () => {
    const items = await listRegistryItems(repositoryRoot, "agent progress");
    expect(items.map((item) => item.name)).toEqual(["agent-progress"]);
    expect(await getRegistryItemInfo("tool-approval", repositoryRoot)).toMatchObject({ type: "registry:block" });
  });

  it("fails closed for unavailable targets and cross-flavor updates", async () => {
    const root = await mkdtemp(join(tmpdir(), "aifrontkit-cli-target-guard-"));
    await initProject(root, { registry: repositoryRoot });
    await addItem(root, "file");
    const installedPath = join(root, "src/components/aifrontkit/file.tsx");
    const cssSource = await readFile(installedPath, "utf8");
    const configPath = join(root, "aifrontkit.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.target.flavor = "tailwind";
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

    await expect(planAdd(root, "conversation")).rejects.toThrow(/not available for react\/tailwind.*react\/css-modules/);
    await expect(addItem(root, "file", { force: true })).rejects.toThrow(/not available for react\/tailwind/);
    expect(await readFile(installedPath, "utf8")).toBe(cssSource);
  });

  it("fails closed for targetless legacy provenance", async () => {
    const root = await mkdtemp(join(tmpdir(), "aifrontkit-cli-legacy-target-"));
    await initProject(root, { registry: repositoryRoot });
    await mkdir(join(root, ".aifrontkit"));
    await writeFile(join(root, ".aifrontkit/installed.json"), `${JSON.stringify({
      schemaVersion: 1,
      items: { file: { name: "file", version: "0.1.0", installedAt: "2026-01-01T00:00:00.000Z", files: [] } },
    }, null, 2)}\n`);
    await expect(addItem(root, "file", { force: true })).rejects.toThrow(/legacy provenance without a known/);
  });

  it("rejects output paths whose existing ancestor is a symlink outside the project", async () => {
    const root = await mkdtemp(join(tmpdir(), "aifrontkit-cli-symlink-root-"));
    const outside = await mkdtemp(join(tmpdir(), "aifrontkit-cli-symlink-outside-"));
    await initProject(root, { registry: repositoryRoot });
    await mkdir(join(root, "src"));
    await symlink(outside, join(root, "src/components"));
    await expect(planAdd(root, "file")).rejects.toThrow(/symlink outside/);
  });

  it("uses catalog manifest paths for blocks as well as components", async () => {
    const root = await mkdtemp(join(tmpdir(), "aifrontkit-cli-block-"));
    await initProject(root, { registry: repositoryRoot });
    const plan = await addItem(root, "tool-approval");
    expect(plan.manifestPaths.get("tool-approval")).toBe("registry/react/css/patterns/tool-approval/registry.json");
    expect(await readFile(join(root, "src/components/aifrontkit/tool-approval.tsx"), "utf8")).toContain("ToolApproval");
  });

  it("reads and explicitly migrates the legacy v1 config and provenance", async () => {
    const root = await mkdtemp(join(tmpdir(), "aifrontkit-cli-migrate-"));
    await writeFile(join(root, "aifrontkit.json"), `${JSON.stringify({
      $schema: "https://aifrontkit.dev/schemas/config.json",
      framework: "react",
      style: "css",
      aliases: { aifrontkit: "@/components/aifrontkit" },
      registry: repositoryRoot,
    }, null, 2)}\n`);
    const normalized = migrateConfig(JSON.parse(await readFile(join(root, "aifrontkit.json"), "utf8")));
    expect(normalized.schemaVersion).toBe(2);
    expect(normalized.target).toEqual({ framework: "react", flavor: "css-modules" });
    expect(normalized.output.components).toBe("components/aifrontkit");
    expect(normalized.imports.components).toBe("@/components/aifrontkit");
    await mkdir(join(root, ".aifrontkit"));
    await writeFile(join(root, ".aifrontkit/installed.json"), `${JSON.stringify({
      schemaVersion: 1,
      items: { old: { name: "old", version: "0.0.1", installedAt: "2026-01-01T00:00:00.000Z", files: [] } },
    }, null, 2)}\n`);
    await addItem(root, "file");
    expect(await readFile(join(root, "components/aifrontkit/file.tsx"), "utf8")).toContain("export const File");
    const provenance = JSON.parse(await readFile(join(root, ".aifrontkit/installed.json"), "utf8"));
    expect(provenance.schemaVersion).toBe(2);
    expect(provenance.items.old.migrationHistory[0].action).toBe("migrate");
    const migration = await migrateProject(root);
    expect(migration.changed).toBe(true);
    expect(JSON.parse(await readFile(join(root, "aifrontkit.json"), "utf8")).schemaVersion).toBe(2);
  });

  it("rejects output paths that escape the project root", () => {
    expect(() => outputToDirectory("/project", "../../outside")).toThrow(/inside the project root/);
  });

  it("does not append migration history when reading current provenance", () => {
    const current = {
      schemaVersion: 2,
      items: {
        file: {
          name: "file",
          version: "0.1.0",
          installedAt: "2026-01-01T00:00:00.000Z",
          files: [{ path: "src/file.tsx", source: "registry/file.tsx", hash: "abc" }],
          registry: {
            origin: "/registry",
            manifestPath: "registry/file/registry.json",
            manifestDigest: "manifest",
            sourceDigest: "source",
          },
          target: { framework: "react", flavor: "css-modules", output: "src/components", import: "@/components" },
          compatibility: { aifrontkit: ">=0.1.0 <1", schemaMajor: 1, packages: ["@aifrontkit/core@^0.1.0"] },
          migrationHistory: [{ action: "install", appliedAt: "2026-01-01T00:00:00.000Z", toVersion: "0.1.0", toSourceDigest: "source" }],
        },
      },
    } as const;
    expect(migrateProvenance(current)).toEqual(current);
  });

  it("reports package dependencies from the complete registry dependency tree", async () => {
    const root = await mkdtemp(join(tmpdir(), "aifrontkit-cli-dependencies-"));
    await initProject(root, { registry: repositoryRoot });
    const plan = await planAdd(root, "conversation");
    expect(plan.dependencies).toEqual(expect.arrayContaining(["@aifrontkit/core@^0.1.0", "@aifrontkit/react@^0.1.0"]));
  });
});
