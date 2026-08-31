import { generateKeyPairSync } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  addItem,
  aliasToDirectory,
  createProvenanceTrustPolicy,
  createRegistryProvenance,
  diffItem,
  getRegistryOrigin,
  initProject,
  getRegistryItemInfo,
  listRegistryItems,
  migrateConfig,
  migrateProject,
  migrateProvenance,
  outputToDirectory,
  planAdd,
  resolveRegistryCatalogItem,
  verifyRegistryProvenance,
  writeRegistryProvenance,
} from "../src/index.js";
import { createMcpRequestHandler, MCP_PROTOCOL_VERSION } from "../src/mcp.js";

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

  it("serves read-only registry discovery over MCP JSON-RPC", async () => {
    const handle = createMcpRequestHandler({ registry: repositoryRoot });
    const initialized = await handle({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: MCP_PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "test", version: "1" } } });
    expect(initialized).toMatchObject({ result: { protocolVersion: MCP_PROTOCOL_VERSION, capabilities: { tools: {} } } });
    await handle({ jsonrpc: "2.0", method: "notifications/initialized" });
    const listed = await handle({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "registry_list", arguments: { query: "approval" } }
    });
    expect((listed as { result: { structuredContent: { value: unknown[] } } }).result.structuredContent.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: "tool-approval" })]));
    const info = await handle({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "registry_info", arguments: { name: "agent-progress" } }
    });
    expect(info).toMatchObject({ result: { structuredContent: { name: "agent-progress", type: "registry:block" } } });
  });

  it("enforces MCP envelopes, lifecycle and exact tool inputs", async () => {
    const handle = createMcpRequestHandler({ registry: repositoryRoot });
    await expect(handle({ jsonrpc: "1.0", id: 1, method: "tools/list" })).resolves.toMatchObject({ error: { code: -32600 } });
    await expect(handle({ jsonrpc: "2.0", method: "tools/list" })).resolves.toMatchObject({ error: { code: -32600 } });
    await expect(handle({ jsonrpc: "2.0", id: 1, method: "notifications/initialized" })).resolves.toMatchObject({ error: { code: -32600 } });
    await expect(handle({ jsonrpc: "2.0", id: 2, method: "tools/list" })).resolves.toMatchObject({ error: { code: -32002 } });
    await expect(handle({ jsonrpc: "2.0", id: 3, method: "initialize", params: {} })).resolves.toMatchObject({ error: { code: -32602 } });
    await handle({ jsonrpc: "2.0", id: 4, method: "initialize", params: { protocolVersion: MCP_PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "test", version: "1" } } });
    await expect(handle({ jsonrpc: "2.0", id: 5, method: "tools/list" })).resolves.toMatchObject({ error: { code: -32002 } });
    await handle({ jsonrpc: "2.0", method: "notifications/initialized" });
    await expect(handle({ jsonrpc: "2.0", id: 6, method: "tools/list", params: { _meta: { requestId: "test" } } })).resolves.toMatchObject({ result: { tools: expect.any(Array) } });
    await expect(handle({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "registry_verify_provenance" } })).resolves.toMatchObject({ result: expect.any(Object) });
    await expect(handle({ jsonrpc: "2.0", id: 8, method: "tools/call", params: { name: "registry_info", arguments: { name: "file", extra: true } } })).resolves.toMatchObject({ error: { code: -32602 } });
    await expect(handle({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "unknown", arguments: {} } })).resolves.toMatchObject({ error: { code: -32601 } });
    await expect(handle({ jsonrpc: "2.0", id: 10, method: "unknown" })).resolves.toMatchObject({ error: { code: -32601 } });
    await expect(handle({ jsonrpc: "2.0", id: 11, method: "tools/call", params: { name: "registry_info", arguments: { name: "missing" } } })).resolves.toMatchObject({ result: { isError: true } });
  });

  it("signs and verifies current registry artifacts with an explicit trust key", async () => {
    const root = await mkdtemp(join(tmpdir(), "aifrontkit-provenance-"));
    await cp(join(repositoryRoot, "registry"), join(root, "registry"), { recursive: true });
    const { privateKey, publicKey } = generateKeyPairSync("ed25519", {
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" }
    });
    const document = await createRegistryProvenance(root, {
      keyId: "test-release",
      privateKey,
      generatedAt: "2026-08-30T00:00:00.000Z"
    });
    expect(document.artifacts.length).toBeGreaterThan(1);
    expect(document.artifacts.every((artifact) => artifact.signature.length > 40)).toBe(true);
    await expect(verifyRegistryProvenance(root, {
      document,
      trustedPublicKeys: { "test-release": publicKey },
      requireTrustedKey: true
    })).resolves.toMatchObject({ valid: true, trusted: true, errors: [] });

    const retimestamped = { ...document, generatedAt: "2026-08-31T00:00:00.000Z" };
    await expect(verifyRegistryProvenance(root, { document: retimestamped })).resolves.toMatchObject({ valid: false });

    const sourcePath = join(root, "registry/react/css/patterns/tool-approval/tool-approval.tsx");
    await writeFile(sourcePath, `${await readFile(sourcePath, "utf8")}\n// tampered\n`);
    const result = await verifyRegistryProvenance(root, { document });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/changed after signing/)]));
  });

  it("distinguishes a valid self-declared signature from a trusted signer", async () => {
    const { privateKey } = generateKeyPairSync("ed25519", { privateKeyEncoding: { type: "pkcs8", format: "pem" } });
    const document = await createRegistryProvenance(repositoryRoot, { keyId: "community", privateKey });
    const result = await verifyRegistryProvenance(repositoryRoot, { document });
    expect(result).toMatchObject({ valid: true, trusted: false, keyId: "community" });
    const cliDefault = await verifyRegistryProvenance(repositoryRoot, { document, ...createProvenanceTrustPolicy() });
    expect(cliDefault).toMatchObject({ valid: false, trusted: false });
    expect(cliDefault.errors).toContain("Signing key 'community' is not trusted.");
    await expect(verifyRegistryProvenance(repositoryRoot, { document, ...createProvenanceTrustPolicy(undefined, true) })).resolves.toMatchObject({ valid: true, trusted: false });
  });

  it("rejects registry reads and provenance writes through escaping symlinks", async () => {
    const registryRoot = await mkdtemp(join(tmpdir(), "aifrontkit-registry-symlink-"));
    await cp(join(repositoryRoot, "registry"), join(registryRoot, "registry"), { recursive: true });
    const outside = await mkdtemp(join(tmpdir(), "aifrontkit-registry-outside-"));
    const outsideSource = join(outside, "file.tsx");
    await writeFile(outsideSource, "export const escaped = true;\n");
    const sourcePath = join(registryRoot, "registry/react/css/components/file/file.tsx");
    await unlink(sourcePath);
    await symlink(outsideSource, sourcePath);
    const { privateKey } = generateKeyPairSync("ed25519", { privateKeyEncoding: { type: "pkcs8", format: "pem" } });
    await expect(createRegistryProvenance(registryRoot, { keyId: "test", privateKey })).rejects.toThrow(/symlink outside the registry root/);
    const projectRoot = await mkdtemp(join(tmpdir(), "aifrontkit-registry-project-"));
    await initProject(projectRoot, { registry: registryRoot });
    await expect(planAdd(projectRoot, "file")).rejects.toThrow(/symlink outside the registry root/);

    await unlink(sourcePath);
    await writeFile(sourcePath, "export const File = true;\n");
    const document = await createRegistryProvenance(registryRoot, { keyId: "test", privateKey });
    const outsideOutput = join(outside, "provenance.json");
    await writeFile(outsideOutput, "unchanged\n");
    await symlink(outsideOutput, join(registryRoot, "registry/provenance.json"));
    await expect(writeRegistryProvenance(registryRoot, document)).rejects.toThrow(/symlink outside the registry root/);
    expect(await readFile(outsideOutput, "utf8")).toBe("unchanged\n");
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

  it("installs the attachment composer with flattened source dependencies", async () => {
    const root = await mkdtemp(join(tmpdir(), "aifrontkit-cli-attachments-"));
    await initProject(root, { registry: repositoryRoot });
    const plan = await addItem(root, "attachment-composer");
    expect([...plan.manifestPaths.keys()]).toEqual(expect.arrayContaining(["attachment-composer", "file", "prompt-input"]));
    const source = await readFile(join(root, "src/components/aifrontkit/attachment-composer.tsx"), "utf8");
    expect(source).toContain('from "./file.js"');
    expect(source).toContain('from "./prompt-input.js"');
    const provenance = JSON.parse(await readFile(join(root, ".aifrontkit/installed.json"), "utf8"));
    expect(Object.keys(provenance.items)).toEqual(expect.arrayContaining(["attachment-composer", "file", "prompt-input"]));
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

  it("uses stable provenance for the bundled registry and installs the flagship workflow", async () => {
    expect(await getRegistryOrigin()).toMatch(/^bundled:aifrontkit@\d+\.\d+\.\d+/);
    const root = await mkdtemp(join(tmpdir(), "aifrontkit-cli-research-agent-"));
    await initProject(root, { registry: repositoryRoot });
    const plan = await addItem(root, "research-agent");
    expect(plan.items.size).toBe(4);
    const source = await readFile(join(root, "src/components/aifrontkit/research-agent.tsx"), "utf8");
    expect(source).toContain('from "./file.js"');
    expect(source).toContain('from "./agent-progress.js"');
    expect(source).toContain('from "./tool-approval.js"');
  });
});
