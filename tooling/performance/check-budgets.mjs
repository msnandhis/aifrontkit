import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const toolingDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(toolingDirectory, "../..");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function unique(values) {
  return [...new Set(values)];
}

function assetFiles(chunk) {
  return unique([chunk.file, ...(chunk.css ?? []), ...(chunk.assets ?? [])]);
}

function measureFiles(distDirectory, files) {
  return files.reduce((total, file) => {
    const contents = readFileSync(join(distDirectory, file));
    total.rawBytes += contents.byteLength;
    total.gzipBytes += gzipSync(contents, { level: 9 }).byteLength;
    return total;
  }, { rawBytes: 0, gzipBytes: 0 });
}

function collectStaticChunkKeys(manifest, entryKey) {
  const seen = new Set();
  const visit = (key) => {
    if (seen.has(key)) return;
    const chunk = manifest[key];
    if (!chunk) throw new Error(`Manifest import ${key} does not resolve to a chunk.`);
    seen.add(key);
    for (const dependency of chunk.imports ?? []) visit(dependency);
  };
  visit(entryKey);
  return seen;
}

function collectFiles(manifest, chunkKeys, excludedFiles = new Set()) {
  return unique(
    [...chunkKeys]
      .flatMap((key) => assetFiles(manifest[key]))
      .filter((file) => !excludedFiles.has(file)),
  );
}

function checkLimit(failures, label, measurement, limit) {
  for (const kind of ["rawBytes", "gzipBytes"]) {
    if (limit[kind] === undefined || measurement[kind] <= limit[kind]) continue;
    const encoding = kind === "gzipBytes" ? "gzip" : "raw";
    failures.push(`${label} is ${formatBytes(measurement[kind])} ${encoding}, above the ${formatBytes(limit[kind])} budget.`);
  }
}

export function evaluatePlaygroundBudgets({ manifest, distDirectory, configuration }) {
  const failures = [];
  const entries = Object.entries(manifest).filter(([, chunk]) => chunk.isEntry);
  if (entries.length !== 1) failures.push(`Expected one browser entry chunk, found ${entries.length}.`);
  const [entryKey] = entries[0] ?? [];
  if (!entryKey) return { failures, report: null };

  const initialChunkKeys = collectStaticChunkKeys(manifest, entryKey);
  const initialFiles = collectFiles(manifest, initialChunkKeys);
  const initialFileSet = new Set(initialFiles);
  const initialJavaScriptFiles = initialFiles.filter((file) => file.endsWith(".js"));
  const initialStyleFiles = initialFiles.filter((file) => file.endsWith(".css"));
  const initialJavaScript = measureFiles(distDirectory, initialJavaScriptFiles);
  const initialStyles = measureFiles(distDirectory, initialStyleFiles);
  const initialTotal = measureFiles(distDirectory, initialFiles);
  checkLimit(failures, "Initial JavaScript", initialJavaScript, configuration.budgets.initialJavaScript);
  checkLimit(failures, "Initial styles", initialStyles, configuration.budgets.initialStyles);
  checkLimit(failures, "Initial asset payload", initialTotal, configuration.budgets.initialTotal);

  const routes = Object.entries(manifest).filter(([key]) => key.startsWith(configuration.routeSourcePrefix));
  if (routes.length < configuration.minimumRouteChunks) {
    failures.push(`Expected at least ${configuration.minimumRouteChunks} lazy route chunks, found ${routes.length}.`);
  }
  const routeMeasurements = routes.map(([key, chunk]) => {
    if (!chunk.isDynamicEntry) failures.push(`Documentation route ${key} is not a dynamic entry.`);
    const files = collectFiles(manifest, collectStaticChunkKeys(manifest, key), initialFileSet);
    const measurement = measureFiles(distDirectory, files);
    checkLimit(failures, `Route ${key}`, measurement, configuration.budgets.routeChunk);
    return { key, files, ...measurement };
  });
  const allRouteFiles = unique(routeMeasurements.flatMap((route) => route.files));
  const allRouteChunks = measureFiles(distDirectory, allRouteFiles);
  checkLimit(failures, "All route chunks", allRouteChunks, configuration.budgets.allRouteChunks);

  const routeKeys = new Set(routes.map(([key]) => key));
  const onDemandMeasurements = Object.entries(manifest)
    .filter(([key, chunk]) => chunk.isDynamicEntry && !routeKeys.has(key))
    .map(([key]) => {
      const files = collectFiles(manifest, collectStaticChunkKeys(manifest, key), initialFileSet);
      const measurement = measureFiles(distDirectory, files);
      checkLimit(failures, `On-demand chunk ${key}`, measurement, configuration.budgets.onDemandChunk);
      return { key, files, ...measurement };
    });

  return {
    failures,
    report: {
      entryKey,
      initialJavaScript,
      initialStyles,
      initialTotal,
      routeChunks: routeMeasurements.length,
      largestRoute: routeMeasurements.sort((a, b) => b.gzipBytes - a.gzipBytes)[0] ?? null,
      allRouteChunks,
      onDemandChunks: onDemandMeasurements.length,
      largestOnDemand: onDemandMeasurements.sort((a, b) => b.gzipBytes - a.gzipBytes)[0] ?? null,
    },
  };
}

export function runBudgetCheck({ root = repositoryRoot, configPath = join(toolingDirectory, "budgets.json") } = {}) {
  const configuration = readJson(configPath).playground;
  const distDirectory = resolve(root, configuration.distDirectory);
  const manifestPath = join(distDirectory, configuration.manifest);
  const manifest = readJson(manifestPath);
  return evaluatePlaygroundBudgets({ manifest, distDirectory, configuration });
}

function printReport(report) {
  console.log(`Initial JavaScript: ${formatBytes(report.initialJavaScript.gzipBytes)} gzip`);
  console.log(`Initial styles: ${formatBytes(report.initialStyles.gzipBytes)} gzip`);
  console.log(`Initial total: ${formatBytes(report.initialTotal.gzipBytes)} gzip`);
  console.log(`Lazy routes: ${report.routeChunks}, ${formatBytes(report.allRouteChunks.gzipBytes)} gzip combined`);
  if (report.largestRoute) console.log(`Largest route: ${report.largestRoute.key} at ${formatBytes(report.largestRoute.gzipBytes)} gzip`);
  console.log(`Other on-demand chunks: ${report.onDemandChunks}`);
  if (report.largestOnDemand) console.log(`Largest on-demand chunk: ${report.largestOnDemand.key} at ${formatBytes(report.largestOnDemand.gzipBytes)} gzip`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  try {
    const result = runBudgetCheck();
    printReport(result.report);
    if (result.failures.length) {
      console.error("\nPerformance budget failures:");
      for (const failure of result.failures) console.error(`- ${failure}`);
      process.exitCode = 1;
    } else {
      console.log("Performance budgets passed.");
    }
  } catch (error) {
    console.error(`Performance budget check could not run: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
