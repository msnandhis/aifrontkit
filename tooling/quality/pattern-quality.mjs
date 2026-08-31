import { readFile, readdir, stat } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const toolingDirectory = dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = resolve(toolingDirectory, "../..");
const requiredEvidence = ["accessibility", "interaction", "documentation"];
const allowedEvidence = new Set([...requiredEvidence, "visualRegression"]);
const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function formatPath(repositoryRoot, path) {
  return relative(repositoryRoot, path).split(sep).join("/");
}

function inside(parent, candidate) {
  const root = resolve(parent);
  const path = resolve(candidate);
  return path === root || path.startsWith(`${root}${sep}`);
}

async function fileExists(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function readJson(path) {
  try {
    return { value: JSON.parse(await readFile(path, "utf8")), error: null };
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return { value: null, error: "file is missing" };
    return { value: null, error: error instanceof SyntaxError ? error.message : "file could not be read" };
  }
}

function qualityScenarioIds(source, path) {
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const candidates = [];

  function visit(node) {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text.endsWith("QualityScenarios")
      && node.initializer
      && ts.isArrayLiteralExpression(node.initializer)
    ) {
      const ids = node.initializer.elements.flatMap((element) => {
        if (!ts.isObjectLiteralExpression(element)) return [];
        const identifier = element.properties.find((property) => (
          ts.isPropertyAssignment(property)
          && ((ts.isIdentifier(property.name) && property.name.text === "id") || (ts.isStringLiteral(property.name) && property.name.text === "id"))
          && ts.isStringLiteralLike(property.initializer)
        ));
        return identifier && ts.isPropertyAssignment(identifier) && ts.isStringLiteralLike(identifier.initializer)
          ? [identifier.initializer.text]
          : [];
      });
      candidates.push(ids);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return candidates.length === 1 ? candidates[0] : null;
}

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function reducedMotionBlocks(source) {
  const blocks = [];
  const pattern = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/gi;
  for (const match of source.matchAll(pattern)) {
    const openingBrace = (match.index ?? 0) + match[0].length - 1;
    let depth = 1;
    for (let index = openingBrace + 1; index < source.length; index += 1) {
      if (source[index] === "{") depth += 1;
      if (source[index] === "}") depth -= 1;
      if (depth === 0) {
        blocks.push(source.slice(openingBrace + 1, index));
        break;
      }
    }
  }
  return blocks;
}

async function validateEvidence(repositoryRoot, patternName, evidence) {
  const problems = [];
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    return [`evidence for '${patternName}' must be an object.`];
  }
  for (const gate of requiredEvidence) {
    if (!evidence[gate]) problems.push(`evidence.${gate} is required.`);
  }
  for (const gate of Object.keys(evidence).sort()) {
    if (!allowedEvidence.has(gate)) {
      problems.push(`evidence.${gate} is not a supported evidence type.`);
      continue;
    }
    const contract = evidence[gate];
    if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
      problems.push(`evidence.${gate} must be an object.`);
      continue;
    }
    for (const key of Object.keys(contract).filter((key) => !["file", "contains", "artifacts"].includes(key)).sort()) {
      problems.push(`evidence.${gate}.${key} is not supported.`);
    }
    if (typeof contract.file !== "string" || contract.file.trim().length === 0) {
      problems.push(`evidence.${gate}.file is required.`);
      continue;
    }
    const evidencePath = resolve(repositoryRoot, contract.file);
    if (!inside(repositoryRoot, evidencePath) || !await fileExists(evidencePath)) {
      problems.push(`evidence.${gate}.file '${contract.file}' must resolve to a file inside the repository.`);
      continue;
    }
    if (!Array.isArray(contract.contains) || contract.contains.length === 0 || contract.contains.some((marker) => typeof marker !== "string" || marker.length === 0)) {
      problems.push(`evidence.${gate}.contains must declare at least one source marker.`);
    } else {
      const source = await readFile(evidencePath, "utf8");
      for (const marker of contract.contains) {
        if (!source.includes(marker)) problems.push(`evidence.${gate}.file is missing marker '${marker}'.`);
      }
    }
    if (gate === "visualRegression" && (!Array.isArray(contract.artifacts) || contract.artifacts.length === 0)) {
      problems.push("evidence.visualRegression.artifacts must declare committed snapshots.");
    }
    if (contract.artifacts !== undefined) {
      if (!Array.isArray(contract.artifacts) || contract.artifacts.length === 0) {
        problems.push(`evidence.${gate}.artifacts must be a non-empty array when provided.`);
      } else {
        for (const artifact of contract.artifacts) {
          if (typeof artifact !== "string" || artifact.length === 0) {
            problems.push(`evidence.${gate}.artifacts entries must be repository-relative file paths.`);
            continue;
          }
          const artifactPath = resolve(repositoryRoot, artifact);
          if (!inside(repositoryRoot, artifactPath) || !await fileExists(artifactPath)) {
            problems.push(`evidence.${gate}.artifact '${artifact}' is missing.`);
          }
        }
      }
    }
  }
  return problems;
}

async function validatePattern(repositoryRoot, patternsRoot, contract) {
  const name = typeof contract?.name === "string" ? contract.name : "invalid-pattern";
  const problems = [];
  for (const key of Object.keys(contract ?? {}).filter((key) => !["name", "scenarios", "evidence"].includes(key)).sort()) {
    problems.push(`${key} is not a supported pattern contract field.`);
  }
  if (!kebabCase.test(name)) problems.push("name must be kebab-case.");
  const patternDirectory = join(patternsRoot, name);
  const registryPath = join(patternDirectory, "registry.json");
  const implementationPath = join(patternDirectory, `${name}.tsx`);
  const stylePath = join(patternDirectory, `${name}.module.css`);
  const fixturePath = join(patternDirectory, `${name}.fixture.tsx`);
  const requiredFiles = [registryPath, implementationPath, stylePath, fixturePath];
  for (const path of requiredFiles) {
    if (!await fileExists(path)) problems.push(`${formatPath(repositoryRoot, path)} is required.`);
  }

  const registryResult = await readJson(registryPath);
  if (!registryResult.value || typeof registryResult.value !== "object") {
    problems.push(`${formatPath(repositoryRoot, registryPath)} must be valid JSON.`);
  } else {
    const registry = registryResult.value;
    if (registry.name !== name) problems.push(`registry.json name must be '${name}'.`);
    if (registry.type !== "registry:block") problems.push("registry.json type must be 'registry:block'.");
    const registryFiles = Array.isArray(registry.files)
      ? registry.files.map((file) => file?.path).filter((path) => typeof path === "string")
      : [];
    for (const path of [implementationPath, stylePath]) {
      const expected = formatPath(repositoryRoot, path);
      if (!registryFiles.includes(expected)) problems.push(`registry.json files must include '${expected}'.`);
    }
    for (const path of registryFiles) {
      const resolvedPath = resolve(repositoryRoot, path);
      if (!inside(repositoryRoot, resolvedPath) || !await fileExists(resolvedPath)) {
        problems.push(`registry file '${path}' must resolve inside the repository.`);
      }
    }
  }

  if (!Array.isArray(contract?.scenarios) || contract.scenarios.length === 0 || contract.scenarios.some((scenario) => typeof scenario !== "string" || scenario.length === 0)) {
    problems.push("scenarios must declare at least one fixture scenario.");
  } else if (new Set(contract.scenarios).size !== contract.scenarios.length) {
    problems.push("scenarios must not contain duplicates.");
  } else if (await fileExists(fixturePath)) {
    const fixtureSource = await readFile(fixturePath, "utf8");
    const fixtureIds = qualityScenarioIds(fixtureSource, fixturePath);
    if (!fixtureIds) {
      problems.push(`fixture must export one literal '*QualityScenarios' array.`);
    } else {
      const declared = [...contract.scenarios].sort();
      const actual = [...new Set(fixtureIds)].sort();
      if (JSON.stringify(declared) !== JSON.stringify(actual)) {
        const missing = actual.filter((scenario) => !declared.includes(scenario));
        const stale = declared.filter((scenario) => !actual.includes(scenario));
        if (missing.length) problems.push(`scenarios is missing fixture scenario${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`);
        if (stale.length) problems.push(`scenarios contains stale fixture scenario${stale.length === 1 ? "" : "s"}: ${stale.join(", ")}.`);
      }
    }
  }

  if (await fileExists(stylePath)) {
    const css = stripCssComments(await readFile(stylePath, "utf8"));
    if (/(^|[^\w-])#[\da-f]{3,8}\b/i.test(css)) problems.push("pattern CSS contains a raw hexadecimal color.");
    for (const match of css.matchAll(/z-index\s*:\s*([^;}{]+)/gi)) {
      const value = match[1]?.trim() ?? "";
      if (/^[+-]?\d+$/.test(value)) problems.push(`pattern CSS contains arbitrary numeric z-index '${value}'.`);
    }
    if (/transition(?:-property)?\s*:\s*(?:[^;]*,\s*)*all(?:\s|,|;|$)/i.test(css)) problems.push("pattern CSS contains prohibited 'transition: all'.");
    const usesMotion = /(?:animation(?:-name)?|transition)\s*:\s*(?!none(?:\s|;|$))/i.test(css);
    if (usesMotion) {
      const hasEffectiveOverride = reducedMotionBlocks(css).some((block) =>
        /(?:animation|transition)(?:-duration)?\s*:\s*(?:none|0(?:\.0+)?(?:ms|s)?|0\.0*1ms)/i.test(block),
      );
      if (!hasEffectiveOverride) problems.push("pattern CSS motion requires an effective prefers-reduced-motion override.");
    }
  }

  problems.push(...await validateEvidence(repositoryRoot, name, contract?.evidence));
  return { name, passed: problems.length === 0, problems: [...new Set(problems)].sort() };
}

export async function validatePatternRegistry(options = {}) {
  const repositoryRoot = resolve(options.repositoryRoot ?? defaultRepositoryRoot);
  const patternsRoot = resolve(options.patternsRoot ?? join(repositoryRoot, "registry/react/css/patterns"));
  const manifestPath = resolve(options.manifestPath ?? join(repositoryRoot, "tooling/quality/pattern-quality.json"));
  const manifestResult = await readJson(manifestPath);
  if (!manifestResult.value || typeof manifestResult.value !== "object" || Array.isArray(manifestResult.value)) {
    const patterns = [{
      name: "pattern-quality-manifest",
      passed: false,
      problems: [`${formatPath(repositoryRoot, manifestPath)}: ${manifestResult.error ?? "manifest must be an object"}.`],
    }];
    return {
      schemaVersion: 1,
      registry: formatPath(repositoryRoot, patternsRoot),
      manifest: formatPath(repositoryRoot, manifestPath),
      summary: { patterns: 1, passed: 0, failed: 1 },
      patterns,
    };
  }

  const manifest = manifestResult.value;
  const manifestProblems = [];
  for (const key of Object.keys(manifest).filter((key) => !["$schema", "schemaVersion", "patterns"].includes(key)).sort()) {
    manifestProblems.push(`${key} is not a supported manifest field.`);
  }
  if (manifest.schemaVersion !== 1) manifestProblems.push("schemaVersion must be 1.");
  if (!Array.isArray(manifest.patterns)) manifestProblems.push("patterns must be an array.");
  const contracts = Array.isArray(manifest.patterns) ? manifest.patterns : [];
  const contractNames = contracts.map((contract) => contract?.name).filter((name) => typeof name === "string");
  if (new Set(contractNames).size !== contractNames.length) manifestProblems.push("pattern names must be unique.");

  let directoryNames = [];
  try {
    directoryNames = (await readdir(patternsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    manifestProblems.push(`${formatPath(repositoryRoot, patternsRoot)} must be a readable directory.`);
  }
  for (const directory of directoryNames) {
    if (!contractNames.includes(directory)) manifestProblems.push(`official pattern '${directory}' has no quality contract.`);
  }

  const patterns = [];
  if (manifestProblems.length) patterns.push({ name: "pattern-quality-manifest", passed: false, problems: manifestProblems.sort() });
  for (const contract of [...contracts].sort((left, right) => String(left?.name).localeCompare(String(right?.name)))) {
    patterns.push(await validatePattern(repositoryRoot, patternsRoot, contract));
  }
  return {
    schemaVersion: 1,
    registry: formatPath(repositoryRoot, patternsRoot),
    manifest: formatPath(repositoryRoot, manifestPath),
    summary: {
      patterns: patterns.length,
      passed: patterns.filter((pattern) => pattern.passed).length,
      failed: patterns.filter((pattern) => !pattern.passed).length,
    },
    patterns,
  };
}

export function formatPatternQualityReport(report) {
  const lines = [`Pattern quality: ${report.summary.passed}/${report.summary.patterns} passed`];
  for (const pattern of report.patterns) {
    lines.push(`${pattern.passed ? "PASS" : "FAIL"} ${pattern.name}`);
    for (const problem of pattern.problems) lines.push(`  - ${problem}`);
  }
  return lines.join("\n");
}
