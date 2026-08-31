import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";

import { formatPatternQualityReport, validatePatternRegistry } from "./pattern-quality.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

function contract(overrides = {}) {
  return {
    name: "example-pattern",
    scenarios: ["default", "failed"],
    evidence: {
      accessibility: { file: "apps/lab/tests/patterns.spec.ts", contains: ["axe-example"] },
      interaction: { file: "apps/lab/tests/patterns.spec.ts", contains: ["interacts-example"] },
      documentation: { file: "content/docs/patterns/example-pattern.md", contains: ["example-pattern"] },
      visualRegression: {
        file: "apps/lab/tests/patterns.spec.ts",
        contains: ["example-pattern-default.webp"],
        artifacts: ["apps/lab/tests/__screenshots__/chromium-test/example-pattern-default.webp"],
      },
    },
    ...overrides,
  };
}

async function makeRepository(patternContract = contract()) {
  const repositoryRoot = await mkdtemp(join(tmpdir(), "aifrontkit-pattern-quality-"));
  temporaryDirectories.push(repositoryRoot);
  const patternDirectory = join(repositoryRoot, "registry/react/css/patterns/example-pattern");
  const testDirectory = join(repositoryRoot, "apps/lab/tests");
  const snapshotDirectory = join(testDirectory, "__screenshots__/chromium-test");
  const documentationDirectory = join(repositoryRoot, "content/docs/patterns");
  const toolingDirectory = join(repositoryRoot, "tooling/quality");
  await Promise.all([
    mkdir(patternDirectory, { recursive: true }),
    mkdir(snapshotDirectory, { recursive: true }),
    mkdir(documentationDirectory, { recursive: true }),
    mkdir(toolingDirectory, { recursive: true }),
  ]);
  await writeFile(join(patternDirectory, "registry.json"), `${JSON.stringify({
    name: "example-pattern",
    type: "registry:block",
    files: [
      { path: "registry/react/css/patterns/example-pattern/example-pattern.tsx", type: "registry:component" },
      { path: "registry/react/css/patterns/example-pattern/example-pattern.module.css", type: "registry:style" },
    ],
  }, null, 2)}\n`);
  await writeFile(join(patternDirectory, "example-pattern.tsx"), "export function ExamplePattern() { return <section />; }\n");
  await writeFile(join(patternDirectory, "example-pattern.module.css"), ".root { color: var(--aifk-text); }\n");
  await writeFile(join(patternDirectory, "example-pattern.fixture.tsx"), `
    export const examplePatternQualityScenarios = [
      { id: "default", expectation: "renders" },
      { id: "failed", expectation: "recovers" }
    ];
  `);
  await writeFile(join(testDirectory, "patterns.spec.ts"), "const evidence = ['axe-example', 'interacts-example', 'example-pattern-default.webp'];\n");
  await writeFile(join(snapshotDirectory, "example-pattern-default.webp"), "reviewed-snapshot");
  await writeFile(join(documentationDirectory, "example-pattern.md"), "# example-pattern\n");
  await writeFile(join(toolingDirectory, "pattern-quality.json"), `${JSON.stringify({ schemaVersion: 1, patterns: [patternContract] }, null, 2)}\n`);
  return { repositoryRoot, patternDirectory, manifestPath: join(toolingDirectory, "pattern-quality.json") };
}

test("a pattern with connected source and review evidence passes deterministically", async () => {
  const { repositoryRoot, manifestPath } = await makeRepository();
  const report = await validatePatternRegistry({ repositoryRoot, manifestPath });
  const repeated = await validatePatternRegistry({ repositoryRoot, manifestPath });

  assert.deepEqual(report, repeated);
  assert.deepEqual(report.summary, { patterns: 1, passed: 1, failed: 0 });
  assert.equal(report.patterns[0]?.passed, true);
  assert.equal(formatPatternQualityReport(report), "Pattern quality: 1/1 passed\nPASS example-pattern");
});

test("missing evidence files and committed artifacts fail closed", async () => {
  const brokenContract = contract({
    evidence: {
      accessibility: { file: "apps/lab/tests/missing.spec.ts", contains: ["axe-example"] },
      interaction: { file: "apps/lab/tests/patterns.spec.ts", contains: ["missing-interaction-marker"] },
      documentation: { file: "content/docs/patterns/example-pattern.md", contains: ["example-pattern"] },
      visualRegression: {
        file: "apps/lab/tests/patterns.spec.ts",
        contains: ["example-pattern-default.webp"],
        artifacts: ["apps/lab/tests/__screenshots__/chromium-test/missing.webp"],
      },
    },
  });
  const { repositoryRoot, manifestPath } = await makeRepository(brokenContract);
  const report = await validatePatternRegistry({ repositoryRoot, manifestPath });
  const problems = report.patterns[0]?.problems.join("\n") ?? "";

  assert.equal(report.summary.failed, 1);
  assert.match(problems, /evidence\.accessibility\.file .* must resolve to a file inside the repository/);
  assert.match(problems, /evidence\.interaction\.file is missing marker 'missing-interaction-marker'/);
  assert.match(problems, /evidence\.visualRegression\.artifact .* is missing/);
});

test("missing required pattern files and fixture scenario drift fail closed", async () => {
  const { repositoryRoot, patternDirectory, manifestPath } = await makeRepository(contract({
    scenarios: ["default", "stale"],
  }));
  await rm(join(patternDirectory, "example-pattern.module.css"));
  const report = await validatePatternRegistry({ repositoryRoot, manifestPath });
  const problems = report.patterns[0]?.problems.join("\n") ?? "";

  assert.equal(report.summary.failed, 1);
  assert.match(problems, /example-pattern\.module\.css is required/);
  assert.match(problems, /registry file .*example-pattern\.module\.css.* must resolve inside the repository/);
  assert.match(problems, /scenarios is missing fixture scenario: failed/);
  assert.match(problems, /scenarios contains stale fixture scenario: stale/);
});

test("an untracked official pattern and a missing manifest are release failures", async () => {
  const { repositoryRoot, manifestPath } = await makeRepository();
  await mkdir(join(repositoryRoot, "registry/react/css/patterns/untracked"), { recursive: true });
  const untracked = await validatePatternRegistry({ repositoryRoot, manifestPath });
  const missing = await validatePatternRegistry({ repositoryRoot, manifestPath: join(repositoryRoot, "tooling/quality/missing.json") });

  assert.equal(untracked.summary.failed, 1);
  assert.match(untracked.patterns[0]?.problems.join("\n") ?? "", /official pattern 'untracked' has no quality contract/);
  assert.equal(missing.summary.failed, 1);
  assert.match(missing.patterns[0]?.problems[0] ?? "", /file is missing/);
});
