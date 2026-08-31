import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import test from "node:test";

const exec = promisify(execFile);
const repository = fileURLToPath(new URL("../", import.meta.url));
const validator = fileURLToPath(new URL("./validate-registry.mjs", import.meta.url));

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "aifrontkit-registry-"));
  await cp(join(repository, "registry"), join(root, "registry"), { recursive: true });
  return root;
}

async function validate(root) {
  try {
    await exec(process.execPath, [validator], { env: { ...process.env, AIFRONTKIT_REGISTRY_REPOSITORY: root } });
    return "";
  } catch (error) {
    return `${error.stderr ?? ""}${error.stdout ?? ""}`;
  }
}

async function editCatalog(root, mutate) {
  const path = join(root, "registry/registry.json");
  const catalog = JSON.parse(await readFile(path, "utf8"));
  mutate(catalog);
  await writeFile(path, `${JSON.stringify(catalog, null, 2)}\n`);
}

test("accepts the checked-in target catalog", async () => {
  assert.equal(await validate(await fixture()), "");
});

test("rejects duplicate target identities", async () => {
  const root = await fixture();
  await editCatalog(root, (catalog) => catalog.items.find((item) => item.name === "file").targets.push({ ...catalog.items.find((item) => item.name === "file").targets[0] }));
  assert.match(await validate(root), /duplicate target react\/css-modules\/file/);
});

test("rejects catalog paths that disagree with their targeted manifest", async () => {
  const root = await fixture();
  await editCatalog(root, (catalog) => { catalog.items.find((item) => item.name === "file").targets[0].manifest = "registry/react/css/components/message/registry.json"; });
  assert.match(await validate(root), /react\/css-modules\/file must point to/);
});

test("rejects unadvertised public target manifests", async () => {
  const root = await fixture();
  await editCatalog(root, (catalog) => {
    const file = catalog.items.find((item) => item.name === "file");
    file.targets = file.targets.filter((target) => target.flavor !== "tailwind");
  });
  assert.match(await validate(root), /missing public item react\/tailwind\/file/);
});
