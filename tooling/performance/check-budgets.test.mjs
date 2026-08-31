import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { evaluatePlaygroundBudgets } from "./check-budgets.mjs";

function fixture() {
  const distDirectory = mkdtempSync(join(tmpdir(), "aifrontkit-budget-"));
  mkdirSync(join(distDirectory, "assets"));
  for (const [file, contents] of [
    ["assets/entry.js", "entry"],
    ["assets/entry.css", "styles"],
    ["assets/route.js", "route"],
    ["assets/search.js", "search"],
  ]) writeFileSync(join(distDirectory, file), contents);
  const manifest = {
    "index.html": { file: "assets/entry.js", css: ["assets/entry.css"], isEntry: true, dynamicImports: ["../../content/docs/index.md", "src/search.ts"] },
    "../../content/docs/index.md": { file: "assets/route.js", isDynamicEntry: true, imports: ["index.html"] },
    "src/search.ts": { file: "assets/search.js", isDynamicEntry: true, imports: ["index.html"] },
  };
  const configuration = {
    routeSourcePrefix: "../../content/docs/",
    minimumRouteChunks: 1,
    budgets: {
      initialJavaScript: { gzipBytes: 1024 },
      initialStyles: { gzipBytes: 1024 },
      initialTotal: { gzipBytes: 2048 },
      routeChunk: { gzipBytes: 1024 },
      allRouteChunks: { gzipBytes: 1024 },
      onDemandChunk: { gzipBytes: 1024 },
    },
  };
  return { distDirectory, manifest, configuration };
}

test("reports initial, route and on-demand payloads", () => {
  const result = evaluatePlaygroundBudgets(fixture());
  assert.deepEqual(result.failures, []);
  assert.equal(result.report.routeChunks, 1);
  assert.equal(result.report.onDemandChunks, 1);
  assert.match(result.report.largestRoute.key, /content\/docs/);
});

test("fails when code splitting or a size ceiling regresses", () => {
  const input = fixture();
  input.manifest["../../content/docs/index.md"].isDynamicEntry = false;
  input.configuration.minimumRouteChunks = 2;
  input.configuration.budgets.onDemandChunk.gzipBytes = 1;
  const result = evaluatePlaygroundBudgets(input);
  assert.ok(result.failures.some((failure) => failure.includes("at least 2 lazy route chunks")));
  assert.ok(result.failures.some((failure) => failure.includes("is not a dynamic entry")));
  assert.ok(result.failures.some((failure) => failure.includes("On-demand chunk")));
});

test("includes static dependencies of a tiny dynamic entry", () => {
  const input = fixture();
  const largeSharedContents = Buffer.allocUnsafe(16 * 1024);
  for (let index = 0; index < largeSharedContents.length; index += 1) {
    largeSharedContents[index] = (index * 31 + Math.floor(index / 251)) % 256;
  }
  writeFileSync(join(input.distDirectory, "assets/shared.js"), largeSharedContents);
  input.manifest["src/search.ts"].imports = ["index.html", "_shared.js"];
  input.manifest["_shared.js"] = { file: "assets/shared.js" };
  input.configuration.budgets.onDemandChunk.gzipBytes = 512;

  const result = evaluatePlaygroundBudgets(input);

  assert.ok(result.failures.some((failure) => failure.includes("On-demand chunk src/search.ts")));
  assert.ok(result.report.largestOnDemand.gzipBytes > 512);
});

test("excludes initial assets and deduplicates shared route files", () => {
  const input = fixture();
  writeFileSync(join(input.distDirectory, "assets/shared.js"), "shared route dependency");
  writeFileSync(join(input.distDirectory, "assets/route-two.js"), "route two");
  input.manifest["../../content/docs/index.md"].imports = ["index.html", "_shared.js"];
  input.manifest["../../content/docs/second.md"] = {
    file: "assets/route-two.js",
    isDynamicEntry: true,
    imports: ["index.html", "_shared.js"],
  };
  input.manifest["_shared.js"] = { file: "assets/shared.js" };
  input.configuration.minimumRouteChunks = 2;

  const result = evaluatePlaygroundBudgets(input);
  const expectedFiles = ["assets/route.js", "assets/route-two.js", "assets/shared.js"];
  const expected = expectedFiles.reduce((total, file) => total + readFileSync(join(input.distDirectory, file)).byteLength, 0);

  assert.deepEqual(result.failures, []);
  assert.equal(result.report.allRouteChunks.rawBytes, expected);
  assert.equal(result.report.largestRoute.files.filter((file) => file === "assets/entry.js").length, 0);
});
