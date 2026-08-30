import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const contractRoot = join(root, "contracts/adoption");
const schema = JSON.parse(await readFile(join(contractRoot, "adoption-summary.schema.json"), "utf8"));
const summaryPath = resolve(process.argv[2] ?? join(contractRoot, "examples/preview-cohort.json"));
const summary = JSON.parse(await readFile(summaryPath, "utf8"));
const failures = [];

const dereference = (node) => {
  if (!node?.$ref?.startsWith("#/$defs/")) return node;
  return schema.$defs[node.$ref.slice("#/$defs/".length)];
};

const validateSchema = (value, unresolvedNode, path = "summary") => {
  const node = dereference(unresolvedNode);
  if (!node) {
    failures.push(`${path} references a missing schema definition`);
    return;
  }
  if (Object.hasOwn(node, "const") && value !== node.const) failures.push(`${path} must equal ${JSON.stringify(node.const)}`);
  if (node.enum && !node.enum.includes(value)) failures.push(`${path} must be one of ${node.enum.join(", ")}`);
  if (node.type === "integer" && !Number.isInteger(value)) failures.push(`${path} must be an integer`);
  if (node.type === "string" && typeof value !== "string") failures.push(`${path} must be a string`);
  if (node.minimum !== undefined && value < node.minimum) failures.push(`${path} must be at least ${node.minimum}`);
  if (node.pattern && typeof value === "string" && !new RegExp(node.pattern).test(value)) failures.push(`${path} has an invalid format`);
  if (node.format === "date-time" && (typeof value !== "string" || Number.isNaN(Date.parse(value)))) failures.push(`${path} must be an ISO date-time`);
  if (node.type !== "object") return;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failures.push(`${path} must be an object`);
    return;
  }
  for (const key of node.required ?? []) {
    if (!Object.hasOwn(value, key)) failures.push(`${path}.${key} is required`);
  }
  if (node.minProperties !== undefined && Object.keys(value).length < node.minProperties) {
    failures.push(`${path} must contain at least ${node.minProperties} property`);
  }
  for (const [key, nested] of Object.entries(value)) {
    const propertyNode = node.properties?.[key];
    if (!propertyNode && node.additionalProperties === false) failures.push(`${path}.${key} is not allowed`);
    else if (propertyNode) validateSchema(nested, propertyNode, `${path}.${key}`);
  }
};

validateSchema(summary, schema);

const countValues = (record) => Object.values(record).reduce((total, value) => total + value, 0);
const assertAtMost = (label, value, maximum) => {
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    failures.push(`${label} must be an integer from 0 to ${maximum}`);
  }
};

if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") failures.push("schema must use JSON Schema 2020-12");
if (schema.properties?.schemaVersion?.const !== 1) failures.push("schemaVersion must be fixed at 1");
if (schema.additionalProperties !== false) failures.push("top-level schema must reject extra properties");
if (summary.schemaVersion !== 1) failures.push("example schemaVersion must be 1");
if (summary.consent?.explicit !== true || summary.consent?.collection !== "local-aggregate-export") {
  failures.push("example must record explicit consent for local aggregate export");
}

const cohortSize = summary.cohort?.size;
if (!Number.isInteger(cohortSize) || cohortSize < 1) failures.push("cohort.size must be a positive integer");

for (const [dimension, counts] of Object.entries({
  framework: summary.cohort?.framework,
  integration: summary.cohort?.integration,
  experience: summary.cohort?.experience
})) {
  if (!counts || countValues(counts) !== cohortSize) failures.push(`cohort.${dimension} counts must equal cohort.size`);
}

for (const [name, metric] of Object.entries({
  installation: summary.metrics?.installation,
  adapterChoice: summary.metrics?.adapterChoice,
  ...summary.metrics?.scenarios
})) {
  if (!metric) {
    failures.push(`metrics.${name} is required`);
    continue;
  }
  for (const key of ["attempted", "completedWithoutHelp", "completedWithHelp"]) {
    assertAtMost(`metrics.${name}.${key}`, metric[key], cohortSize);
  }
  if (metric.completedWithoutHelp + metric.completedWithHelp > metric.attempted) {
    failures.push(`metrics.${name} completions cannot exceed attempts`);
  }
}

const firstUi = summary.metrics?.firstWorkingUi;
assertAtMost("metrics.firstWorkingUi.eligible", firstUi?.eligible, cohortSize);
assertAtMost("metrics.firstWorkingUi.completed", firstUi?.completed, cohortSize);
if (firstUi && countValues(firstUi.durationMinutes) !== firstUi.completed) {
  failures.push("firstWorkingUi duration buckets must equal completed sessions");
}

for (const [name, value] of Object.entries(summary.metrics?.outcomes ?? {})) {
  assertAtMost(`metrics.outcomes.${name}`, value, cohortSize);
}
if (summary.metrics?.outcomes?.completed + summary.metrics?.outcomes?.abandoned !== cohortSize) {
  failures.push("completed and abandoned outcomes must equal cohort.size");
}

const forbiddenKeys = /(?:participant|account|email|device|projectId|prompt|message|file|sourceCode|url|ipAddress|freeform|notes)/i;
const visit = (value, path = "summary") => {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenKeys.test(key)) failures.push(`${path}.${key} is a prohibited data field`);
    visit(nested, `${path}.${key}`);
  }
};
visit(summary);

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Adoption contract and aggregate example are valid.");
