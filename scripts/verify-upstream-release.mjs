import { readFile, rm, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { loadPins } from "./check-upstream-compatibility.mjs";

const repository = fileURLToPath(new URL("../", import.meta.url));
const typescriptVersion = "5.9.2";
const nodeTypesVersion = "24.3.0";
const jsonSchemaTypesVersion = "7.0.15";
const probesByPackage = new Map([
  ["ai", "ai-sdk-ui-stream.ts"],
  ["@ag-ui/core", "ag-ui-events.ts"],
  ["@langchain/langgraph", "langgraph-stream-state.ts"]
]);

export function selectPins(pins, ids) {
  if (ids.length === 0) return pins;
  const requested = new Set(ids);
  const selected = pins.filter((pin) => requested.delete(pin.id));
  if (requested.size > 0) throw new Error(`Unknown compatibility release: ${Array.from(requested).join(", ")}`);
  return selected;
}

async function run(command, args, cwd) {
  await new Promise((resolvePromise, reject) => {
    const childEnvironment = { ...process.env, npm_config_update_notifier: "false" };
    delete childEnvironment.npm_config_store_dir;
    const child = spawn(command, args, { cwd, stdio: "inherit", env: childEnvironment });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited with ${signal ? `signal ${signal}` : `code ${code}`}`));
    });
  });
}

export function probeFileFor(packageName) {
  const probe = probesByPackage.get(packageName);
  if (!probe) throw new Error(`No provider contract probe is configured for ${packageName}`);
  return probe;
}

export async function verifyRelease(pin) {
  const directory = await mkdtemp(join(tmpdir(), `aifrontkit-${pin.id}-`));
  try {
    const probeFile = probeFileFor(pin.package);
    await writeFile(join(directory, "package.json"), `${JSON.stringify({
      private: true,
      type: "module",
      dependencies: { [pin.package]: pin.pinned },
      devDependencies: {
        "@types/json-schema": jsonSchemaTypesVersion,
        "@types/node": nodeTypesVersion,
        typescript: typescriptVersion
      }
    }, null, 2)}\n`);
    await writeFile(join(directory, "tsconfig.json"), `${JSON.stringify({
      compilerOptions: {
        target: "ES2023",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        lib: ["ES2023", "DOM", "DOM.Iterable", "DOM.AsyncIterable"],
        strict: true,
        skipLibCheck: false,
        noEmit: false,
        outDir: "dist"
      },
      include: ["probe.ts"]
    }, null, 2)}\n`);
    const probeSource = await readFile(resolve(repository, "compatibility", "probes", probeFile), "utf8");
    await writeFile(join(directory, "probe.ts"), probeSource);
    await run("npm", ["install", "--ignore-scripts", "--no-package-lock", "--no-audit", "--no-fund"], directory);

    const packagePath = resolve(directory, "node_modules", ...pin.package.split("/"), "package.json");
    const installed = JSON.parse(await readFile(packagePath, "utf8"));
    if (installed.version !== pin.pinned) {
      throw new Error(`${pin.id} resolved ${installed.version ?? "an unknown version"} instead of ${pin.pinned}`);
    }

    const requireFromFixture = createRequire(join(directory, "index.mjs"));
    const entry = await import(pathToFileURL(requireFromFixture.resolve(pin.package)).href);
    const missing = pin.runtimeExports.filter((name) => !(name in entry));
    if (missing.length > 0) throw new Error(`${pin.id} is missing runtime exports: ${missing.join(", ")}`);
    await run(resolve(directory, "node_modules", ".bin", "tsc"), ["--project", "tsconfig.json"], directory);
    await run(process.execPath, [join(directory, "dist", "probe.js")], directory);
    return { id: pin.id, package: pin.package, version: installed.version, runtimeExports: pin.runtimeExports, probe: probeFile };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function parseArguments(argv) {
  const ids = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== "--id" || !argv[index + 1]) throw new Error(`Unknown or incomplete argument: ${argv[index] ?? ""}`);
    ids.push(argv[++index]);
  }
  return ids;
}

export async function main(argv = process.argv.slice(2)) {
  const pins = selectPins(await loadPins(), parseArguments(argv));
  for (const pin of pins) {
    const result = await verifyRelease(pin);
    process.stdout.write(`verified ${result.id}: ${result.package}@${result.version} (${result.probe})\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
