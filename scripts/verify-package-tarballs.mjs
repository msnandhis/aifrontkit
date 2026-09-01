import { spawnSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packagesRoot = join(repositoryRoot, "packages");
const expectedRepository = "git+https://github.com/msnandhis/aifrontkit.git";

function collectTargets(value) {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(collectTargets);
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const packageDirectories = (await readdir(packagesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(packagesRoot, entry.name))
  .sort();

for (const packageDirectory of packageDirectories) {
  const manifest = JSON.parse(await readFile(join(packageDirectory, "package.json"), "utf8"));
  if (manifest.private) continue;

  const label = `${manifest.name}@${manifest.version}`;
  requireCondition(typeof manifest.description === "string" && manifest.description.length >= 40, `${label} must declare a useful package description.`);
  requireCondition(Array.isArray(manifest.keywords) && manifest.keywords.length >= 5, `${label} must declare focused npm discovery keywords.`);
  requireCondition(new Set(manifest.keywords).size === manifest.keywords.length, `${label} npm discovery keywords must be unique.`);
  requireCondition(manifest.license === "Apache-2.0", `${label} must declare Apache-2.0.`);
  requireCondition(manifest.repository?.url === expectedRepository, `${label} must declare the canonical GitHub repository.`);
  requireCondition(manifest.repository?.directory === relative(repositoryRoot, packageDirectory), `${label} must declare its monorepo directory.`);
  requireCondition(manifest.homepage === "https://github.com/msnandhis/aifrontkit#readme", `${label} must declare the canonical homepage.`);
  requireCondition(manifest.bugs?.url === "https://github.com/msnandhis/aifrontkit/issues", `${label} must declare the canonical issue tracker.`);
  requireCondition(manifest.engines?.node === ">=22", `${label} must declare the supported Node.js range.`);
  requireCondition(manifest.publishConfig?.access === "public", `${label} must publish with public access.`);
  requireCondition(manifest.publishConfig?.provenance === true, `${label} must request npm provenance.`);

  const dryRun = spawnSync("npm", ["publish", "--dry-run", "--tag", "next", "--access", "public", "--json"], { cwd: packageDirectory, encoding: "utf8" });
  requireCondition(dryRun.status === 0, `${label} npm publish dry run failed:\n${dryRun.stderr || dryRun.stdout}`);
  requireCondition(!/auto-corrected|invalid and removed/i.test(dryRun.stderr), `${label} requires npm to rewrite its publish manifest:\n${dryRun.stderr}`);
  const jsonStart = dryRun.stdout.lastIndexOf("\n{");
  const parsedReport = JSON.parse(jsonStart >= 0 ? dryRun.stdout.slice(jsonStart + 1) : dryRun.stdout);
  const report = Array.isArray(parsedReport)
    ? parsedReport.find((entry) => entry?.name === manifest.name && entry?.version === manifest.version)
    : Array.isArray(parsedReport?.files)
      ? parsedReport
      : parsedReport?.[manifest.name];
  requireCondition(report && Array.isArray(report.files), `${label} npm publish dry run returned an unexpected JSON report.`);
  requireCondition(report.name === manifest.name && report.version === manifest.version, `${label} npm publish dry run reported a different package.`);
  const files = new Map(report.files.map((file) => [file.path, file]));

  requireCondition(files.has("package.json"), `${label} tarball is missing package.json.`);
  requireCondition(files.has("README.md"), `${label} tarball is missing package documentation.`);
  requireCondition([...files.keys()].some((path) => /(?:^|\/)LICENSE$/.test(path)), `${label} tarball is missing the license text.`);
  for (const target of collectTargets(manifest.exports)) {
    if (!target.startsWith("./")) continue;
    requireCondition(files.has(target.slice(2)), `${label} export ${target} is missing from its tarball.`);
  }
  for (const target of collectTargets(manifest.bin)) {
    const path = target.replace(/^\.\//, "");
    const file = files.get(path);
    requireCondition(file, `${label} executable ${target} is missing from its tarball.`);
    requireCondition((file.mode & 0o111) !== 0, `${label} executable ${target} is not executable in its tarball.`);
  }
  requireCondition([...files.keys()].some((path) => path.endsWith(".d.ts")), `${label} tarball is missing declarations.`);
  requireCondition([...files.keys()].some((path) => path.endsWith(".js")), `${label} tarball is missing JavaScript output.`);
  requireCondition(![...files.keys()].some((path) => /(?:^|\/)index\.test\./.test(path)), `${label} tarball contains compiled tests.`);
  console.log(`Verified ${label} (${report.entryCount} files, ${report.size} bytes)`);
}
