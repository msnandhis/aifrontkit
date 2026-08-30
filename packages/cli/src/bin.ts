#!/usr/bin/env node
import { addItem, diffItem, doctor, getRegistryItemInfo, initProject, listRegistryItems, migrateProject } from "./index.js";

const [command, ...args] = process.argv.slice(2);
const flags = args.filter((value) => value.startsWith("--"));
const name = args.find((value) => !value.startsWith("--"));
const rootFlag = flags.find((flag) => flag.startsWith("--cwd="));
const registryFlag = flags.find((flag) => flag.startsWith("--registry="));
const root = rootFlag ? rootFlag.slice("--cwd=".length) : process.cwd();
const registry = registryFlag?.slice("--registry=".length);
const force = flags.includes("--force");
const dryRun = flags.includes("--dry-run");
const json = flags.includes("--json");
const queryFlag = flags.find((flag) => flag.startsWith("--query="));
const query = queryFlag?.slice("--query=".length);

function usage() {
  return "Usage: aifrontkit <init|migrate|list|info|add|diff|doctor> [component] [--cwd=path] [--registry=path-or-url] [--query=text] [--json] [--dry-run] [--force]";
}

try {
  if (command === "init") {
    const path = await initProject(root, { force, ...(registry ? { registry } : {}) });
    console.log(`Created ${path}`);
  } else if (command === "migrate") {
    const result = await migrateProject(root);
    console.log(`${result.changed ? "Migrated" : "Already current"} ${root}/aifrontkit.json (schema ${result.config.schemaVersion})`);
  } else if (command === "list") {
    const items = await listRegistryItems(registry, query);
    if (json) console.log(JSON.stringify({ schemaVersion: 1, items }, null, 2));
    else for (const item of items) console.log(`${item.name.padEnd(20)} ${item.type.padEnd(20)} ${item.description}`);
  } else if (command === "info" && name) {
    const item = await getRegistryItemInfo(name, registry);
    console.log(json ? JSON.stringify(item, null, 2) : `${item.title}\n${item.description}\n${item.targets.map((target) => `${target.framework}/${target.flavor}`).join(", ")}`);
  } else if (command === "add" && name) {
    const plan = await addItem(root, name, { force, dryRun, ...(registry ? { registry } : {}) });
    console.log(`${dryRun ? "Would install" : "Installed"} ${name} (${plan.item.meta?.version ?? "unversioned"})`);
    for (const file of plan.files) console.log(`  ${file.path}`);
    if (plan.dependencies.length) console.log(`Packages: ${plan.dependencies.join(", ")}`);
  } else if (command === "diff" && name) {
    const result = await diffItem(root, name, registry);
    for (const file of result) console.log(`${file.status.padEnd(8)} ${file.path}`);
    if (result.some((file) => file.status !== "current")) process.exitCode = 1;
  } else if (command === "doctor") {
    const result = await doctor(root);
    console.log(`Framework: ${result.config.target.framework}`);
    console.log(`Flavor: ${result.config.target.flavor}`);
    console.log(`Target: ${result.targetDirectory}`);
    console.log(`Import: ${result.importAlias}`);
    console.log(`Installed: ${Object.keys(result.provenance.items).join(", ") || "none"}`);
  } else {
    console.error(usage());
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
