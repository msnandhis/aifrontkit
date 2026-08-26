import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";

import {
  formatQualityReport,
  validateComponent,
  validateRegistry,
} from "./component-quality.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

function manifest(overrides = {}) {
  return {
    $schema: "../../../../../tooling/quality/component.schema.json",
    schemaVersion: 1,
    name: "example",
    title: "Example",
    version: "1.2.3",
    maturity: "stable",
    purpose: "Prove the deterministic quality contract.",
    anatomy: [{ name: "root", description: "Component root." }],
    slots: [{ name: "content", description: "Primary content." }],
    states: [{ name: "default" }, { name: "loading" }],
    variants: [{ name: "default" }],
    themes: [{ name: "light" }, { name: "dark" }, { name: "high-contrast" }],
    responsive: { viewports: [{ name: "narrow", width: 375 }, { name: "wide", width: 1280 }] },
    accessibility: {
      semantics: "Uses native landmarks and labelled controls.",
      keyboard: ["Tab reaches every control."],
      focus: ["Focus remains visible."],
    },
    motion: { usesMotion: true, reducedMotion: true },
    fixtures: {
      file: "example.fixture.tsx",
      scenarios: [{ name: "default" }, { name: "loading" }],
    },
    quality: {
      visualRegression: true,
      a11y: true,
      interaction: true,
      documentation: true,
      evidence: {
        visualRegression: "../../../../../apps/lab/tests/component-quality.spec.ts",
        a11y: "../../../../../apps/lab/tests/component-quality.spec.ts",
        interaction: "../../../../../apps/lab/tests/component-quality.spec.ts",
        documentation: "README.md",
      },
    },
    compatibility: {
      aifrontkit: ">=0.1.0 <1",
      react: ">=18.2.0 <20",
      schemaMajor: 1,
      registryDependencies: [],
      runtimeDependencies: ["@aifrontkit/react"],
      platformRuntimeRequired: false,
    },
    ...overrides,
  };
}

async function makeComponent({ contract = manifest(), css, fixtures = "export const ids = ['default', 'loading']; export function ExampleFixture() { return <div />; }" } = {}) {
  const repositoryRoot = await mkdtemp(join(tmpdir(), "aifrontkit-quality-"));
  temporaryDirectories.push(repositoryRoot);
  const componentDirectory = join(repositoryRoot, "registry/react/css/components/example");
  const browserDirectory = join(repositoryRoot, "apps/lab/tests");
  await mkdir(componentDirectory, { recursive: true });
  await mkdir(browserDirectory, { recursive: true });
  await writeFile(join(componentDirectory, "component.json"), `${JSON.stringify(contract, null, 2)}\n`);
  await writeFile(join(componentDirectory, "registry.json"), `${JSON.stringify({
    name: "example",
    files: [{ path: "registry/react/css/components/example/example.css", type: "registry:style" }],
    meta: { version: "1.2.3", schemaMajor: 1, aifrontkit: ">=0.1.0 <1" },
  }, null, 2)}\n`);
  await writeFile(join(componentDirectory, "example.fixture.tsx"), fixtures);
  await writeFile(join(componentDirectory, "README.md"), "# Example\n");
  await writeFile(join(browserDirectory, "component-quality.spec.ts"), "const covered = ['example'];\n");
  await writeFile(join(componentDirectory, "example.css"), css ?? `
.example { color: var(--aifk-color-text); transition: opacity 120ms ease; z-index: var(--aifk-z-sticky); }
@media (prefers-reduced-motion: reduce) { .example { transition: none; } }
`);
  return { repositoryRoot, componentDirectory };
}

test("a complete component produces a deterministic 100-point report", async () => {
  const { repositoryRoot, componentDirectory } = await makeComponent();
  const component = await validateComponent(componentDirectory, { repositoryRoot });
  const report = await validateRegistry({ repositoryRoot });
  const repeated = await validateRegistry({ repositoryRoot });

  assert.equal(component.passed, true);
  assert.equal(component.score, 100);
  assert.deepEqual(report, repeated);
  assert.deepEqual(report.summary, { components: 1, passed: 1, failed: 0, averageScore: 100 });
  assert.equal(formatQualityReport(report), "Component quality: 1/1 passed (average 100/100)\nPASS example 100/100 [stable]");
});

test("contract, fixture, CSS, and release defects are actionable failures", async () => {
  const contract = manifest({
    version: "2.0.0",
    motion: { usesMotion: true, reducedMotion: false },
    fixtures: { file: "example.fixture.tsx", scenarios: [{ name: "default" }] },
    quality: { visualRegression: false, a11y: true, interaction: true, documentation: true },
    compatibility: {
      ...manifest().compatibility,
      platformRuntimeRequired: true,
    },
  });
  const { repositoryRoot, componentDirectory } = await makeComponent({
    contract,
    fixtures: "export const ids = ['unrelated'];",
    css: ".example { color: #fff; z-index: 9999; transition: all 120ms; animation: pulse 1s infinite; }",
  });
  const result = await validateComponent(componentDirectory, { repositoryRoot });
  const failed = new Set(result.checks.filter((check) => !check.passed).map((check) => check.id));

  assert.equal(result.passed, false);
  assert.deepEqual(failed, new Set([
    "manifest-experience",
    "manifest-compatibility",
    "manifest-version-parity",
    "fixtures-file",
    "fixtures-state-coverage",
    "fixtures-source-ids",
    "css-raw-colors",
    "css-z-index",
    "css-transition-all",
    "css-reduced-motion",
    "quality-gates",
  ]));
  assert.match(formatQualityReport({
    schemaVersion: 1,
    minimumScore: 90,
    registry: "registry/react/css/components",
    summary: { components: 1, passed: 0, failed: 1, averageScore: result.score },
    components: [result],
  }), /platformRuntimeRequired must be false/);
});

test("a missing component contract fails closed", async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), "aifrontkit-quality-"));
  temporaryDirectories.push(repositoryRoot);
  const componentDirectory = join(repositoryRoot, "registry/react/css/components/example");
  await mkdir(componentDirectory, { recursive: true });

  const result = await validateComponent(componentDirectory, { repositoryRoot });

  assert.equal(result.score, 0);
  assert.equal(result.passed, false);
  assert.equal(result.checks.length, 15);
  assert.ok(result.checks.every((check) => check.passed === false));
  assert.equal(JSON.stringify(result).includes(repositoryRoot), false);
});
