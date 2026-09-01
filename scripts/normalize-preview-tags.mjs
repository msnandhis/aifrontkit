import { spawnSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const packagesRoot = new URL("../packages/", import.meta.url);
const packagesPath = fileURLToPath(packagesRoot);

function npm(args) {
  const result = spawnSync("npm", args, { encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0) {
    throw new Error(`npm ${args.join(" ")} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

for (const entry of await readdir(packagesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const manifestPath = join(packagesPath, entry.name, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.private || !manifest.version.includes("-next.")) continue;

  const specifier = `${manifest.name}@${manifest.version}`;
  npm(["dist-tag", "add", specifier, "next"]);
  console.log(`Normalized preview tags for ${specifier}.`);
}
