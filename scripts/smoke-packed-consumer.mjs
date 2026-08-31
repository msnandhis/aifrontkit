import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packagesRoot = join(repositoryRoot, "packages");
const consumerRoot = await mkdtemp(join(tmpdir(), "aifrontkit-consumer-"));
const tarballRoot = join(consumerRoot, "tarballs");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: "pipe", ...options });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed:\n${result.stderr || result.stdout}`);
  return result.stdout;
}

try {
  await mkdir(tarballRoot);
  await writeFile(join(consumerRoot, "package.json"), `${JSON.stringify({ name: "aifrontkit-packed-consumer", private: true, type: "module" }, null, 2)}\n`);
  const packageDirectories = (await readdir(packagesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packagesRoot, entry.name))
    .sort();
  const importSpecifiers = [];

  for (const packageDirectory of packageDirectories) {
    const manifest = JSON.parse(await readFile(join(packageDirectory, "package.json"), "utf8"));
    if (manifest.private) continue;
    run("pnpm", ["pack", "--pack-destination", tarballRoot], { cwd: packageDirectory });
    for (const [subpath, target] of Object.entries(manifest.exports ?? { ".": "./dist/index.js" })) {
      const exportTarget = typeof target === "string" ? target : target.import;
      const specifier = subpath === "." ? manifest.name : `${manifest.name}${subpath.slice(1)}`;
      importSpecifiers.push({ specifier, resolveOnly: exportTarget.endsWith(".json") || exportTarget.endsWith(".css") });
    }
  }

  const tarballs = (await readdir(tarballRoot)).filter((entry) => entry.endsWith(".tgz")).map((entry) => join(tarballRoot, entry));
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs, "react@19.2.8", "react-dom@19.2.8", "typescript@5.9.2", "@types/react@19.1.12", "@types/react-dom@19.1.9"], { cwd: consumerRoot });
  const smokeSource = `${importSpecifiers.map(({ specifier, resolveOnly }) => resolveOnly ? `import.meta.resolve(${JSON.stringify(specifier)});` : `await import(${JSON.stringify(specifier)});`).join("\n")}\nconsole.log("Packed exports load successfully.");\n`;
  await writeFile(join(consumerRoot, "smoke.mjs"), smokeSource);
  run(process.execPath, ["smoke.mjs"], { cwd: consumerRoot });

  const executable = process.platform === "win32" ? join(consumerRoot, "node_modules/.bin/aifrontkit.cmd") : join(consumerRoot, "node_modules/.bin/aifrontkit");
  const cliOutput = run(executable, ["list"], { cwd: consumerRoot });
  if (!cliOutput.includes("conversation") || !cliOutput.includes("research-agent") || !cliOutput.includes("attachment-composer") || !cliOutput.includes("checkpoint-recovery")) throw new Error("Packed CLI did not discover its bundled registry.");
  run(executable, ["init"], { cwd: consumerRoot });
  run(executable, ["add", "research-agent"], { cwd: consumerRoot });
  run(executable, ["add", "attachment-composer"], { cwd: consumerRoot });
  run(executable, ["add", "checkpoint-recovery"], { cwd: consumerRoot });
  const installedWorkflow = await readFile(join(consumerRoot, "src/components/aifrontkit/research-agent.tsx"), "utf8");
  if (!installedWorkflow.includes('from "./file.js"') || !installedWorkflow.includes('from "./agent-progress.js"') || !installedWorkflow.includes('from "./checkpoint-recovery.js"')) throw new Error("Packed CLI did not flatten flagship workflow imports.");
  const installedComposer = await readFile(join(consumerRoot, "src/components/aifrontkit/attachment-composer.tsx"), "utf8");
  if (!installedComposer.includes('from "./file.js"') || !installedComposer.includes('from "./prompt-input.js"')) throw new Error("Packed CLI did not flatten attachment composer imports.");
  const installedCheckpointRecovery = await readFile(join(consumerRoot, "src/components/aifrontkit/checkpoint-recovery.tsx"), "utf8");
  if (!installedCheckpointRecovery.includes('from "@aifrontkit/react/checkpoint"')) throw new Error("Packed CLI did not install the checkpoint recovery source block.");
  await writeFile(join(consumerRoot, "source-modules.d.ts"), 'declare module "*.module.css" { const styles: Record<string, string>; export default styles; }\n');
  await writeFile(join(consumerRoot, "tsconfig.json"), `${JSON.stringify({
    compilerOptions: {
      strict: true,
      noEmit: true,
      exactOptionalPropertyTypes: true,
      jsx: "react-jsx",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      target: "ES2022",
      skipLibCheck: true,
    },
    include: ["src/components/aifrontkit/**/*.tsx", "source-modules.d.ts"],
  }, null, 2)}\n`);
  run(join(consumerRoot, "node_modules/.bin/tsc"), ["-p", "tsconfig.json"], { cwd: consumerRoot });
  const provenance = JSON.parse(await readFile(join(consumerRoot, ".aifrontkit/installed.json"), "utf8"));
  if (!String(provenance.items["research-agent"].registry.origin).startsWith("bundled:aifrontkit@")) throw new Error("Packed CLI wrote an unstable bundled registry origin.");
  if (!provenance.items["attachment-composer"] || !provenance.items.file || !provenance.items["prompt-input"]) throw new Error("Packed CLI did not record attachment composer dependencies.");
  if (!provenance.items["checkpoint-recovery"] || provenance.items["checkpoint-recovery"].registry.manifestPath !== "registry/react/css/patterns/checkpoint-recovery/registry.json") throw new Error("Packed CLI did not record checkpoint recovery provenance.");
  console.log(`Clean consumer loaded ${importSpecifiers.length} exports and executed the packed CLI.`);
} finally {
  await rm(consumerRoot, { recursive: true, force: true });
}
