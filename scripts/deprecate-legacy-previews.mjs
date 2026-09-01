import { spawnSync } from "node:child_process";

const migrations = [
  {
    specifier: "@aifrontkit/tokens@0.2.0-next.0",
    message:
      "This preview package was consolidated into @aifrontkit/react. Use @aifrontkit/react/theme and @aifrontkit/react/theme.css.",
  },
  {
    specifier: "@aifrontkit/testing@0.2.0-next.0",
    message:
      "This preview package was consolidated into @aifrontkit/core. Use @aifrontkit/core/testing.",
  },
  {
    specifier: "@aifrontkit/ai-sdk@0.2.0-next.0",
    message:
      "This preview package was consolidated into @aifrontkit/adapters. Use @aifrontkit/adapters/ai-sdk.",
  },
  {
    specifier: "@aifrontkit/ag-ui@0.2.0-next.0",
    message:
      "This preview package was consolidated into @aifrontkit/adapters. Use @aifrontkit/adapters/ag-ui.",
  },
];

const apply = process.argv.includes("--apply");

function npm(args) {
  const result = spawnSync("npm", args, { encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0) {
    throw new Error(`npm ${args.join(" ")} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

for (const migration of migrations) {
  if (apply) npm(["deprecate", migration.specifier, migration.message]);
  console.log(`${apply ? "Deprecated" : "Would deprecate"} ${migration.specifier}: ${migration.message}`);
}

if (!apply) console.log("Dry run only. Pass --apply to update npm.");
