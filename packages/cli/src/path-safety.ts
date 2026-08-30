import { realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

function isContained(root: string, target: string) {
  const fromRoot = relative(root, target);
  return fromRoot === "" || (!fromRoot.startsWith("..") && !isAbsolute(fromRoot));
}

export async function assertExistingPathContained(root: string, target: string, label: string) {
  const realRoot = await realpath(resolve(root));
  const realTarget = await realpath(resolve(target));
  if (!isContained(realRoot, realTarget)) throw new Error(`${label} resolves through a symlink outside the registry root.`);
  return realTarget;
}

export async function assertWritablePathContained(root: string, target: string, label: string) {
  const realRoot = await realpath(resolve(root));
  let ancestor = resolve(target);
  while (true) {
    try {
      const realAncestor = await realpath(ancestor);
      if (!isContained(realRoot, realAncestor)) throw new Error(`${label} resolves through a symlink outside the registry root.`);
      return;
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
      const parent = dirname(ancestor);
      if (parent === ancestor) throw error;
      ancestor = parent;
    }
  }
}
