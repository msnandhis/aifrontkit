import { copyFile, mkdir, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

const packageDirectory = process.cwd();
if (basename(dirname(packageDirectory)) !== "packages") throw new Error("Package dist cleanup must run from a direct packages/* directory.");
const dist = join(packageDirectory, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(dist);
await copyFile(join(packageDirectory, "../../LICENSE"), join(dist, "LICENSE"));
