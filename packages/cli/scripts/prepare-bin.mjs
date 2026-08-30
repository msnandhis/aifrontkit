import { chmod, copyFile, cp, mkdir } from "node:fs/promises";
import { join } from "node:path";

const packageRoot = process.cwd();
await chmod(join(packageRoot, "dist/bin.js"), 0o755);
await cp(join(packageRoot, "../../registry"), join(packageRoot, "dist/registry"), { recursive: true });
await mkdir(join(packageRoot, "dist/contracts"), { recursive: true });
await copyFile(join(packageRoot, "../../contracts/config.schema.json"), join(packageRoot, "dist/contracts/config.schema.json"));
