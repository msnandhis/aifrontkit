import { readFile, readdir, stat } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const toolingDirectory = dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = resolve(toolingDirectory, "../..");
const defaultRegistryRoot = join(defaultRepositoryRoot, "registry/react/css/components");

const maturityLevels = new Set(["experimental", "preview", "stable", "deprecated"]);
const requiredThemes = ["light", "dark", "high-contrast"];
const requiredQualityGates = ["visualRegression", "a11y", "interaction", "documentation"];
const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const checkDefinitions = [
  ["manifest-core", "contract", 10],
  ["manifest-anatomy", "contract", 8],
  ["manifest-experience", "contract", 8],
  ["manifest-accessibility", "accessibility", 8],
  ["manifest-compatibility", "contract", 8],
  ["manifest-version-parity", "contract", 8],
  ["fixtures-file", "fixtures", 5],
  ["fixtures-default", "fixtures", 5],
  ["fixtures-state-coverage", "fixtures", 5],
  ["fixtures-source-ids", "fixtures", 5],
  ["css-raw-colors", "visual", 6],
  ["css-z-index", "visual", 6],
  ["css-transition-all", "motion", 6],
  ["css-reduced-motion", "motion", 6],
  ["quality-gates", "release", 6],
];

function itemName(value) {
  return typeof value === "string" ? value : value?.name;
}

function names(values) {
  if (!Array.isArray(values)) return [];
  return values.map(itemName).filter((value) => typeof value === "string");
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function quoted(source, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`[\\\"'\\\`]${escaped}[\\\"'\\\`]`).test(source);
}

function canonicalExampleScenarioIds(source, path) {
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let result = null;

  function visit(node) {
    if (
      result === null
      && ts.isPropertyAssignment(node)
      && ((ts.isIdentifier(node.name) && node.name.text === "scenarios") || (ts.isStringLiteral(node.name) && node.name.text === "scenarios"))
      && ts.isArrayLiteralExpression(node.initializer)
    ) {
      result = node.initializer.elements.flatMap((element) => {
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
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return result;
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

function formatPath(repositoryRoot, path) {
  return relative(repositoryRoot, path).split(sep).join("/");
}

async function exists(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function json(path) {
  try {
    return { value: JSON.parse(await readFile(path, "utf8")), error: null };
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return { value: null, error: "file is missing" };
    }
    return {
      value: null,
      error: error instanceof SyntaxError ? error.message : "file could not be read",
    };
  }
}

async function hasComponentSnapshot(repositoryRoot, componentName) {
  const snapshotRoot = join(repositoryRoot, "apps/lab/tests/__screenshots__");
  try {
    const platforms = await readdir(snapshotRoot, { withFileTypes: true });
    for (const platform of platforms) {
      if (!platform.isDirectory()) continue;
      const snapshots = await readdir(join(snapshotRoot, platform.name));
      if (snapshots.some((file) => file.startsWith(`${componentName}-`) && /\.(?:png|webp)$/.test(file))) return true;
    }
  } catch {
    return false;
  }
  return false;
}

function createRecorder() {
  const results = new Map();
  return {
    set(id, passed, details = []) {
      results.set(id, { passed, details: [...details].sort() });
    },
    finish() {
      return checkDefinitions.map(([id, category, points]) => {
        const result = results.get(id) ?? { passed: false, details: ["Check did not run."] };
        return { id, category, points, ...result };
      });
    },
  };
}

export async function validateComponent(componentDirectory, options = {}) {
  const repositoryRoot = resolve(options.repositoryRoot ?? defaultRepositoryRoot);
  const minimumScore = options.minimumScore ?? 90;
  const componentName = basename(componentDirectory);
  const manifestPath = join(componentDirectory, "component.json");
  const registryPath = join(componentDirectory, "registry.json");
  const recorder = createRecorder();
  const manifestResult = await json(manifestPath);
  const manifest = manifestResult.value;

  if (!manifest || typeof manifest !== "object") {
    const detail = manifestResult.error
      ? `${formatPath(repositoryRoot, manifestPath)}: ${manifestResult.error}`
      : `${formatPath(repositoryRoot, manifestPath)}: component contract must be an object.`;
    for (const [id] of checkDefinitions) recorder.set(id, false, [detail]);
    const checks = recorder.finish();
    return {
      name: componentName,
      maturity: "unknown",
      score: 0,
      maximumScore: 100,
      minimumScore,
      passed: false,
      checks,
    };
  }

  const coreProblems = [];
  if (manifest.schemaVersion !== 1) coreProblems.push("schemaVersion must be 1.");
  if (manifest.name !== componentName || !kebabCase.test(manifest.name ?? "")) {
    coreProblems.push(`name must be the kebab-case directory name '${componentName}'.`);
  }
  if (!hasText(manifest.title)) coreProblems.push("title is required.");
  if (!maturityLevels.has(manifest.maturity)) coreProblems.push("maturity must be experimental, preview, stable, or deprecated.");
  if (!hasText(manifest.purpose)) coreProblems.push("purpose is required.");
  if (!semver.test(manifest.version ?? "")) coreProblems.push("version must be a valid SemVer value.");
  recorder.set("manifest-core", coreProblems.length === 0, coreProblems);

  const anatomyProblems = [];
  if (!isNonEmptyArray(manifest.anatomy)) anatomyProblems.push("anatomy must describe at least one part.");
  if (!isNonEmptyArray(manifest.slots)) anatomyProblems.push("slots must describe at least one extension point.");
  if (names(manifest.anatomy).length !== (manifest.anatomy?.length ?? 0)) anatomyProblems.push("every anatomy item needs a name.");
  if (names(manifest.slots).length !== (manifest.slots?.length ?? 0)) anatomyProblems.push("every slot needs a name.");
  recorder.set("manifest-anatomy", anatomyProblems.length === 0, anatomyProblems);

  const experienceProblems = [];
  if (!isNonEmptyArray(manifest.states)) experienceProblems.push("states must be non-empty.");
  if (!isNonEmptyArray(manifest.variants)) experienceProblems.push("variants must be non-empty.");
  const themes = names(manifest.themes);
  for (const theme of requiredThemes) {
    if (!themes.includes(theme)) experienceProblems.push(`themes must include '${theme}'.`);
  }
  if (!isNonEmptyArray(manifest.responsive?.viewports)) experienceProblems.push("responsive.viewports must be non-empty.");
  if (typeof manifest.motion?.usesMotion !== "boolean") experienceProblems.push("motion.usesMotion must be boolean.");
  if (typeof manifest.motion?.reducedMotion !== "boolean") experienceProblems.push("motion.reducedMotion must be boolean.");
  if (manifest.motion?.usesMotion === true && manifest.motion?.reducedMotion !== true) {
    experienceProblems.push("motion.reducedMotion must be true when motion is used.");
  }
  recorder.set("manifest-experience", experienceProblems.length === 0, experienceProblems);

  const accessibilityProblems = [];
  if (!hasText(manifest.accessibility?.semantics)) accessibilityProblems.push("accessibility.semantics is required.");
  if (!isNonEmptyArray(manifest.accessibility?.keyboard)) accessibilityProblems.push("accessibility.keyboard must be non-empty.");
  if (!isNonEmptyArray(manifest.accessibility?.focus)) accessibilityProblems.push("accessibility.focus must be non-empty.");
  recorder.set("manifest-accessibility", accessibilityProblems.length === 0, accessibilityProblems);

  const compatibilityProblems = [];
  const compatibility = manifest.compatibility;
  if (!hasText(compatibility?.aifrontkit)) compatibilityProblems.push("compatibility.aifrontkit is required.");
  if (!hasText(compatibility?.react)) compatibilityProblems.push("compatibility.react is required.");
  if (!Number.isInteger(compatibility?.schemaMajor) || compatibility.schemaMajor < 1) compatibilityProblems.push("compatibility.schemaMajor must be a positive integer.");
  if (!Array.isArray(compatibility?.registryDependencies)) compatibilityProblems.push("compatibility.registryDependencies must be an array.");
  if (!Array.isArray(compatibility?.runtimeDependencies)) compatibilityProblems.push("compatibility.runtimeDependencies must be an array.");
  if (compatibility?.platformRuntimeRequired !== false) compatibilityProblems.push("compatibility.platformRuntimeRequired must be false.");
  for (const dependency of compatibility?.runtimeDependencies ?? []) {
    if (typeof dependency !== "string") {
      compatibilityProblems.push("compatibility.runtimeDependencies entries must be strings.");
      continue;
    }
    const normalizedDependency = dependency.toLowerCase();
    if (normalizedDependency.includes("aifrontkit-platform") || normalizedDependency.includes("@aifrontkit/platform")) {
      compatibilityProblems.push(`runtime dependency '${dependency}' violates platform independence.`);
    }
    if (normalizedDependency.includes("aifrontkit-pro") || normalizedDependency.includes("@aifrontkit/pro")) {
      compatibilityProblems.push(`runtime dependency '${dependency}' violates OSS-to-Pro independence.`);
    }
  }
  recorder.set("manifest-compatibility", compatibilityProblems.length === 0, compatibilityProblems);

  const registryResult = await json(registryPath);
  const parityProblems = [];
  if (!registryResult.value) {
    parityProblems.push(`${formatPath(repositoryRoot, registryPath)} must be valid JSON.`);
  } else {
    const registry = registryResult.value;
    if (registry.name !== manifest.name) parityProblems.push("registry.json and component.json names must match.");
    if (registry.meta?.version !== manifest.version) parityProblems.push("registry.json meta.version and component.json version must match.");
    if (registry.meta?.schemaMajor !== compatibility?.schemaMajor) parityProblems.push("registry.json meta.schemaMajor and compatibility.schemaMajor must match.");
    if (registry.meta?.aifrontkit !== compatibility?.aifrontkit) parityProblems.push("registry.json meta.aifrontkit and compatibility.aifrontkit must match.");
    const expectedDependencies = [...(compatibility?.registryDependencies ?? [])].sort();
    const registryDependencies = [...(registry.registryDependencies ?? [])].sort();
    if (JSON.stringify(expectedDependencies) !== JSON.stringify(registryDependencies)) {
      parityProblems.push("registry dependencies must match compatibility.registryDependencies.");
    }
  }
  recorder.set("manifest-version-parity", parityProblems.length === 0, parityProblems);

  const fixtureProblems = [];
  let fixturePath = null;
  let fixtureSource = "";
  if (!hasText(manifest.fixtures?.file)) {
    fixtureProblems.push("fixtures.file is required.");
  } else {
    fixturePath = resolve(componentDirectory, manifest.fixtures.file);
    if (!fixturePath.startsWith(`${resolve(componentDirectory)}${sep}`) || !await exists(fixturePath)) {
      fixtureProblems.push(`${manifest.fixtures.file} does not exist inside the component directory.`);
    } else {
      fixtureSource = await readFile(fixturePath, "utf8");
    }
  }
  if (!isNonEmptyArray(manifest.fixtures?.scenarios)) fixtureProblems.push("fixtures.scenarios must be non-empty.");
  if (manifest.maturity !== "deprecated" && hasText(manifest.fixtures?.file) && !manifest.fixtures.file.endsWith(".tsx")) {
    fixtureProblems.push("fixtures.file must be a renderable .tsx module.");
  }
  if (fixtureSource && !/(?:return\s*\(|=>\s*\(?\s*<|return\s*<)/m.test(fixtureSource)) {
    fixtureProblems.push("fixtures.file must render the real component, not only list scenario identifiers.");
  }
  recorder.set("fixtures-file", fixtureProblems.length === 0, fixtureProblems);

  const scenarioNames = names(manifest.fixtures?.scenarios);
  recorder.set("fixtures-default", scenarioNames.includes("default"), scenarioNames.includes("default") ? [] : ["fixtures.scenarios must include 'default'."]);

  const stateProblems = [];
  for (const state of names(manifest.states)) {
    if (!scenarioNames.includes(state)) stateProblems.push(`state '${state}' needs a fixture scenario with the same name.`);
  }
  recorder.set("fixtures-state-coverage", stateProblems.length === 0, stateProblems);

  const sourceProblems = [];
  if (fixtureSource) {
    if (manifest.fixtures.file.endsWith(".example.tsx")) {
      const canonicalIds = canonicalExampleScenarioIds(fixtureSource, fixturePath);
      if (!canonicalIds) {
        sourceProblems.push("canonical example must declare a literal scenarios array.");
      } else {
        const declared = [...new Set(scenarioNames)].sort();
        const canonical = [...new Set(canonicalIds)].sort();
        if (JSON.stringify(declared) !== JSON.stringify(canonical)) {
          const missing = canonical.filter((id) => !declared.includes(id));
          const stale = declared.filter((id) => !canonical.includes(id));
          if (missing.length) sourceProblems.push(`fixtures.scenarios is missing canonical scenario${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`);
          if (stale.length) sourceProblems.push(`fixtures.scenarios contains stale scenario${stale.length === 1 ? "" : "s"}: ${stale.join(", ")}.`);
        }
      }
    } else {
      for (const scenario of scenarioNames) {
        if (!quoted(fixtureSource, scenario)) sourceProblems.push(`fixture source does not contain scenario id '${scenario}'.`);
      }
    }
  } else {
    sourceProblems.push("fixture source could not be inspected.");
  }
  recorder.set("fixtures-source-ids", sourceProblems.length === 0, sourceProblems);

  const cssPaths = [];
  if (registryResult.value?.files) {
    for (const file of registryResult.value.files) {
      if (typeof file.path === "string" && file.path.endsWith(".css")) cssPaths.push(resolve(repositoryRoot, file.path));
    }
  }
  const cssSources = [];
  for (const cssPath of cssPaths) {
    if (await exists(cssPath)) cssSources.push({ path: cssPath, source: stripCssComments(await readFile(cssPath, "utf8")) });
  }

  const colorProblems = [];
  const zIndexProblems = [];
  const transitionProblems = [];
  const motionProblems = [];
  for (const css of cssSources) {
    const label = formatPath(repositoryRoot, css.path);
    if (/(^|[^\w-])#[\da-f]{3,8}\b/i.test(css.source)) colorProblems.push(`${label}: raw hex colors are prohibited; use design tokens.`);
    for (const match of css.source.matchAll(/z-index\s*:\s*([^;}{]+)/gi)) {
      const value = match[1]?.trim() ?? "";
      if (/^[+-]?\d+$/.test(value)) zIndexProblems.push(`${label}: numeric z-index '${value}' is arbitrary; use a layer token.`);
    }
    if (/transition(?:-property)?\s*:\s*(?:[^;]*,\s*)*all(?:\s|,|;|$)/i.test(css.source)) {
      transitionProblems.push(`${label}: 'transition: all' is prohibited; name the animated properties.`);
    }
    const usesMotion = /(?:animation(?:-name)?|transition)\s*:\s*(?!none(?:\s|;|$))/i.test(css.source);
    if (usesMotion) {
      const hasEffectiveOverride = reducedMotionBlocks(css.source).some((block) =>
        /(?:animation|transition)(?:-duration)?\s*:\s*(?:none|0(?:ms|s)?)/i.test(block),
      );
      if (!hasEffectiveOverride) {
        motionProblems.push(`${label}: motion requires an effective prefers-reduced-motion override.`);
      }
    }
  }
  recorder.set("css-raw-colors", colorProblems.length === 0, colorProblems);
  recorder.set("css-z-index", zIndexProblems.length === 0, zIndexProblems);
  recorder.set("css-transition-all", transitionProblems.length === 0, transitionProblems);
  recorder.set("css-reduced-motion", motionProblems.length === 0, motionProblems);

  const gateProblems = [];
  for (const gate of requiredQualityGates) {
    if (manifest.quality?.[gate] !== true) gateProblems.push(`quality.${gate} must be true before publication.`);
    const evidenceReference = manifest.quality?.evidence?.[gate];
    if (!hasText(evidenceReference)) {
      gateProblems.push(`quality.evidence.${gate} must reference review evidence.`);
      continue;
    }
    const evidencePath = resolve(componentDirectory, evidenceReference);
    if (!evidencePath.startsWith(`${repositoryRoot}${sep}`) || !await exists(evidencePath)) {
      gateProblems.push(`quality.evidence.${gate} must resolve to a file inside the repository.`);
      continue;
    }
    const evidenceSource = await readFile(evidencePath, "utf8");
    if (gate !== "documentation" && !quoted(evidenceSource, manifest.name)) {
      gateProblems.push(`quality.evidence.${gate} does not identify component '${manifest.name}'.`);
    }
    if (gate === "visualRegression" && !await hasComponentSnapshot(repositoryRoot, manifest.name)) {
      gateProblems.push(`quality.visualRegression requires a committed '${manifest.name}-*.png' or '${manifest.name}-*.webp' snapshot artifact.`);
    }
  }
  recorder.set("quality-gates", gateProblems.length === 0, gateProblems);

  const checks = recorder.finish();
  const score = checks.reduce((total, check) => total + (check.passed ? check.points : 0), 0);
  return {
    name: manifest.name ?? componentName,
    maturity: manifest.maturity ?? "unknown",
    score,
    maximumScore: 100,
    minimumScore,
    passed: score >= minimumScore && checks.every((check) => check.passed),
    checks,
  };
}

export async function validateRegistry(options = {}) {
  const repositoryRoot = resolve(options.repositoryRoot ?? defaultRepositoryRoot);
  const registryRoot = resolve(options.registryRoot ?? join(repositoryRoot, "registry/react/css/components"));
  const minimumScore = options.minimumScore ?? 90;
  const entries = await readdir(registryRoot, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(registryRoot, entry.name))
    .sort();
  const components = [];
  for (const directory of directories) {
    components.push(await validateComponent(directory, { repositoryRoot, minimumScore }));
  }
  const totalScore = components.reduce((total, component) => total + component.score, 0);
  return {
    schemaVersion: 1,
    registry: formatPath(repositoryRoot, registryRoot),
    minimumScore,
    summary: {
      components: components.length,
      passed: components.filter((component) => component.passed).length,
      failed: components.filter((component) => !component.passed).length,
      averageScore: components.length === 0 ? 0 : Math.round(totalScore / components.length),
    },
    components,
  };
}

export function formatQualityReport(report) {
  const lines = [
    `Component quality: ${report.summary.passed}/${report.summary.components} passed (average ${report.summary.averageScore}/100)`,
  ];
  for (const component of report.components) {
    lines.push(`${component.passed ? "PASS" : "FAIL"} ${component.name} ${component.score}/100 [${component.maturity}]`);
    for (const check of component.checks.filter((candidate) => !candidate.passed)) {
      for (const detail of check.details) lines.push(`  - ${check.id}: ${detail}`);
    }
  }
  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes("--json");
  const registryArgument = args.find((argument) => !argument.startsWith("--"));
  const scoreArgument = args.find((argument) => argument.startsWith("--minimum-score="));
  const minimumScore = scoreArgument ? Number(scoreArgument.split("=")[1]) : 90;
  if (!Number.isInteger(minimumScore) || minimumScore < 0 || minimumScore > 100) {
    throw new Error("--minimum-score must be an integer from 0 through 100.");
  }
  const registryRoot = registryArgument ? resolve(registryArgument) : defaultRegistryRoot;
  const report = await validateRegistry({
    repositoryRoot: defaultRepositoryRoot,
    registryRoot,
    minimumScore,
  });
  console.log(jsonOutput ? JSON.stringify(report, null, 2) : formatQualityReport(report));
  if (report.summary.failed > 0 || report.summary.components === 0) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
