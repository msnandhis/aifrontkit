import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const toolingDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(toolingDirectory, "../..");
const docsRoot = resolve(process.argv[2] ?? join(repositoryRoot, "content/docs"));
const allowedStatuses = new Set(["stable", "experimental", "planned"]);
const errors = [];

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    errors.push(`${relative(repositoryRoot, path)}: invalid JSON (${error.message})`);
    return null;
  }
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function parseFrontmatter(source, page) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    errors.push(`${page}: missing YAML frontmatter`);
    return {};
  }

  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return values;
}

function normalizePagePath(path) {
  return normalize(path).split(sep).join("/");
}

const navigation = await readJson(join(docsRoot, "navigation.json"));
const versions = await readJson(join(docsRoot, "versions.json"));

if (navigation) {
  if (navigation.schemaVersion !== 1) errors.push("navigation.json: schemaVersion must be 1");
  if (!Array.isArray(navigation.sections) || navigation.sections.length === 0) {
    errors.push("navigation.json: sections must be a non-empty array");
  }
}

if (versions) {
  if (versions.schemaVersion !== 1) errors.push("versions.json: schemaVersion must be 1");
  if (!Array.isArray(versions.versions) || versions.versions.length === 0) {
    errors.push("versions.json: versions must be a non-empty array");
  } else if (!versions.versions.some((version) => version.id === versions.current)) {
    errors.push("versions.json: current must identify an entry in versions");
  }
  if (versions.routePolicy?.sourceDirectoriesAreVersioned !== false) {
    errors.push("versions.json: sourceDirectoriesAreVersioned must be false");
  }
}

const allFiles = await walk(docsRoot);
const publishablePages = allFiles
  .filter((path) => [".md", ".mdx"].includes(extname(path)))
  .map((path) => normalizePagePath(relative(docsRoot, path)))
  .filter((path) => path !== "README.md" && !path.startsWith("_templates/"));

for (const path of allFiles) {
  const relativePath = normalizePagePath(relative(docsRoot, path));
  if (relativePath.split("/").some((part) => /^v\d+(?:\.\d+)*$/i.test(part))) {
    errors.push(`${relativePath}: versioned source directories are prohibited`);
  }
}

const listedPages = [];
const sectionIds = new Set();
for (const section of navigation?.sections ?? []) {
  if (!section.id || sectionIds.has(section.id)) errors.push(`navigation.json: duplicate or missing section id '${section.id ?? ""}'`);
  sectionIds.add(section.id);
  if (!Array.isArray(section.pages) || section.pages.length === 0) {
    errors.push(`navigation.json: '${section.id}' must list at least one page`);
    continue;
  }
  for (const page of section.pages) listedPages.push(normalizePagePath(page));
}

for (const page of new Set(listedPages)) {
  const occurrences = listedPages.filter((candidate) => candidate === page).length;
  if (occurrences > 1) errors.push(`navigation.json: '${page}' is listed ${occurrences} times`);
  try {
    const info = await stat(join(docsRoot, page));
    if (!info.isFile()) errors.push(`navigation.json: '${page}' is not a file`);
  } catch {
    errors.push(`navigation.json: '${page}' does not exist`);
  }
}

for (const page of publishablePages) {
  if (!listedPages.includes(page)) errors.push(`${page}: publishable page is missing from navigation.json`);
  const absolutePath = join(docsRoot, page);
  const source = await readFile(absolutePath, "utf8");
  const frontmatter = parseFrontmatter(source, page);
  for (const key of ["title", "description", "status"]) {
    if (!frontmatter[key]) errors.push(`${page}: frontmatter '${key}' is required`);
  }
  if (frontmatter.status && !allowedStatuses.has(frontmatter.status)) {
    errors.push(`${page}: unsupported status '${frontmatter.status}'`);
  }

  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^(?:https?:|mailto:|#)/.test(target)) continue;
    const resolved = resolve(dirname(absolutePath), target);
    if (!resolved.startsWith(`${docsRoot}${sep}`) && resolved !== docsRoot) {
      errors.push(`${page}: relative link escapes the public docs boundary ('${target}')`);
      continue;
    }
    try {
      await stat(resolved);
    } catch {
      errors.push(`${page}: broken relative link '${target}'`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Documentation validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation validation passed: ${publishablePages.length} pages across ${sectionIds.size} sections.`);
}
