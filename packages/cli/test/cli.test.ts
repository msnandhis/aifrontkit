import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { addItem, aliasToDirectory, diffItem, initProject } from "../src/index.js";

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
    expect(await readFile(join(root, "components/aifrontkit/file.tsx"), "utf8")).toContain("export const File");
    expect(JSON.parse(await readFile(join(root, ".aifrontkit/installed.json"), "utf8")).items.file.version).toBe("0.1.0");
    expect((await diffItem(root, "file"))).toEqual(expect.arrayContaining([expect.objectContaining({ status: "current" })]));
    await writeFile(join(root, "components/aifrontkit/file.tsx"), "local change\n");
    expect((await diffItem(root, "file"))).toEqual(expect.arrayContaining([expect.objectContaining({ status: "modified" })]));
  });
});
