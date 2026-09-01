import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const packageDirectories = ["core", "react", "adapters", "cli"];
const checkOnly = process.argv.includes("--check");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: "pipe",
    ...options,
  });
  return {
    status: result.status,
    output: (result.stdout || result.stderr || "").trim(),
  };
}

const preState = JSON.parse(await readFile(join(root, ".changeset/pre.json"), "utf8"));
if (preState.mode !== "pre" || preState.tag !== "next") {
  throw new Error("Preview publishing requires Changesets prerelease mode with the next tag.");
}

for (const directory of packageDirectories) {
  const manifestPath = join(root, "packages", directory, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.private) continue;
  if (!manifest.version.includes("-next.")) {
    throw new Error(`${manifest.name}@${manifest.version} is not a next prerelease.`);
  }

  const specifier = `${manifest.name}@${manifest.version}`;
  const existing = run("npm", ["view", specifier, "version", "--json"]);
  if (existing.status === 0) {
    console.log(`Already published ${specifier}.`);
    continue;
  }

  if (checkOnly) {
    console.log(`Would publish ${specifier} to next.`);
    continue;
  }

  const published = run(
    "pnpm",
    ["publish", "--tag", "next", "--access", manifest.publishConfig?.access || "public", "--no-git-checks"],
    { cwd: dirname(manifestPath) },
  );
  if (published.status !== 0) {
    throw new Error(`Publishing ${specifier} failed:\n${published.output}`);
  }
  console.log(`Published ${specifier} to next.`);
}
