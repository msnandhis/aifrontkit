import { createHash, createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { assertExistingPathContained, assertWritablePathContained } from "./path-safety.js";

export const REGISTRY_PROVENANCE_SCHEMA_VERSION = 1 as const;

export interface RegistryProvenanceArtifact {
  kind: "catalog" | "item";
  name: string;
  target?: string;
  path: string;
  digest: string;
  sourceDigest?: string;
  signature: string;
}

export interface RegistryProvenanceDocument {
  schemaVersion: typeof REGISTRY_PROVENANCE_SCHEMA_VERSION;
  algorithm: "Ed25519";
  keyId: string;
  publicKey: string;
  generatedAt: string;
  artifacts: RegistryProvenanceArtifact[];
}

export interface RegistryProvenanceVerification {
  valid: boolean;
  trusted: boolean;
  keyId: string;
  fingerprint: string;
  artifacts: Array<RegistryProvenanceArtifact & { valid: boolean }>;
  errors: string[];
}

export function createProvenanceTrustPolicy(trustedPublicKeys?: Record<string, string>, allowUntrusted = false) {
  return {
    ...(trustedPublicKeys ? { trustedPublicKeys } : {}),
    ...(!allowUntrusted ? { requireTrustedKey: true as const } : {})
  };
}

interface CatalogTarget {
  framework: string;
  flavor: string;
  manifest: string;
}

interface CatalogItem {
  name: string;
  targets: CatalogTarget[];
}

interface Catalog {
  items: CatalogItem[];
}

interface ManifestFile {
  path: string;
}

interface Manifest {
  name: string;
  files?: ManifestFile[];
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function sha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function artifactPayload(artifact: Omit<RegistryProvenanceArtifact, "signature">, keyId: string, generatedAt: string) {
  return stableStringify({ schemaVersion: REGISTRY_PROVENANCE_SCHEMA_VERSION, keyId, generatedAt, ...artifact });
}

function assertRegistryPath(path: string) {
  const normalized = path.replaceAll("\\", "/");
  if (normalized.startsWith("/") || normalized.split("/").includes("..")) {
    throw new Error(`Registry path escapes its root: ${path}`);
  }
  return normalized;
}

async function readRegistryArtifact(registry: string, path: string) {
  const safePath = assertRegistryPath(path);
  if (/^https?:\/\//.test(registry)) {
    const response = await fetch(`${registry.replace(/\/$/, "")}/${safePath}`);
    if (!response.ok) throw new Error(`Registry returned ${response.status} for ${safePath}.`);
    return response.text();
  }
  const root = resolve(registry);
  const target = resolve(root, safePath);
  const fromRoot = relative(root, target);
  if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) throw new Error(`Registry path escapes its root: ${path}`);
  return readFile(await assertExistingPathContained(root, target, `Registry path '${safePath}'`), "utf8");
}

async function describeUnsignedArtifacts(registry: string): Promise<Array<Omit<RegistryProvenanceArtifact, "signature">>> {
  const catalogPath = "registry/registry.json";
  const catalogSource = await readRegistryArtifact(registry, catalogPath);
  const catalog = JSON.parse(catalogSource) as Catalog;
  if (!Array.isArray(catalog.items)) throw new Error("Registry catalog has an unsupported schema.");
  const artifacts: Array<Omit<RegistryProvenanceArtifact, "signature">> = [{
    kind: "catalog",
    name: "registry",
    path: catalogPath,
    digest: sha256(catalogSource)
  }];
  const seen = new Set<string>();
  for (const catalogItem of catalog.items) {
    for (const target of catalogItem.targets ?? []) {
      const manifestPath = assertRegistryPath(target.manifest);
      const identity = `${target.framework}/${target.flavor}/${catalogItem.name}`;
      if (seen.has(identity)) throw new Error(`Registry catalog contains duplicate target '${identity}'.`);
      seen.add(identity);
      const manifestSource = await readRegistryArtifact(registry, manifestPath);
      const manifest = JSON.parse(manifestSource) as Manifest;
      if (manifest.name !== catalogItem.name) throw new Error(`Manifest '${manifestPath}' does not match '${catalogItem.name}'.`);
      const sources = await Promise.all((manifest.files ?? []).map(async (file) => {
        const path = assertRegistryPath(file.path);
        return { path, digest: sha256(await readRegistryArtifact(registry, path)) };
      }));
      sources.sort((left, right) => left.path.localeCompare(right.path));
      artifacts.push({
        kind: "item",
        name: catalogItem.name,
        target: `${target.framework}/${target.flavor}`,
        path: manifestPath,
        digest: sha256(manifestSource),
        sourceDigest: sha256(stableStringify(sources))
      });
    }
  }
  return artifacts.sort((left, right) => `${left.kind}/${left.target ?? ""}/${left.name}`.localeCompare(`${right.kind}/${right.target ?? ""}/${right.name}`));
}

/** Create a detached bundle. Private key material is never returned or written. */
export async function createRegistryProvenance(registry: string, options: { keyId: string; privateKey: string; generatedAt?: string }): Promise<RegistryProvenanceDocument> {
  if (!options.keyId.trim()) throw new Error("A provenance key ID is required.");
  const privateKey = createPrivateKey(options.privateKey);
  if (privateKey.asymmetricKeyType !== "ed25519") throw new Error("Registry provenance requires an Ed25519 private key.");
  const publicKey = createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString();
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const artifacts = (await describeUnsignedArtifacts(registry)).map((artifact) => ({
    ...artifact,
    signature: sign(null, Buffer.from(artifactPayload(artifact, options.keyId.trim(), generatedAt)), privateKey).toString("base64")
  }));
  return {
    schemaVersion: REGISTRY_PROVENANCE_SCHEMA_VERSION,
    algorithm: "Ed25519",
    keyId: options.keyId.trim(),
    publicKey,
    generatedAt,
    artifacts
  };
}

export async function writeRegistryProvenance(registry: string, document: RegistryProvenanceDocument, output = "registry/provenance.json") {
  if (/^https?:\/\//.test(registry)) throw new Error("Registry provenance can only be written to a local registry.");
  const path = resolve(registry, assertRegistryPath(output));
  const fromRoot = relative(resolve(registry), path);
  if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) throw new Error("Provenance output must remain inside the registry root.");
  await assertWritablePathContained(registry, path, "Provenance output");
  await writeFile(path, `${JSON.stringify(document, null, 2)}\n`);
  return path;
}

export async function verifyRegistryProvenance(registry: string, options: { document?: RegistryProvenanceDocument; trustedPublicKeys?: Record<string, string>; requireTrustedKey?: boolean } = {}): Promise<RegistryProvenanceVerification> {
  const document = options.document ?? JSON.parse(await readRegistryArtifact(registry, "registry/provenance.json")) as RegistryProvenanceDocument;
  if (document.schemaVersion !== REGISTRY_PROVENANCE_SCHEMA_VERSION || document.algorithm !== "Ed25519" || !document.keyId || !Array.isArray(document.artifacts)) {
    throw new Error("Registry provenance has an unsupported schema.");
  }
  const publicKey = createPublicKey(document.publicKey);
  if (publicKey.asymmetricKeyType !== "ed25519") throw new Error("Registry provenance public key must use Ed25519.");
  const fingerprint = sha256(publicKey.export({ type: "spki", format: "der" }));
  const trustedKey = options.trustedPublicKeys?.[document.keyId];
  const trusted = Boolean(trustedKey && createPublicKey(trustedKey).export({ type: "spki", format: "der" }).equals(publicKey.export({ type: "spki", format: "der" })));
  const errors: string[] = [];
  if (options.requireTrustedKey && !trusted) errors.push(`Signing key '${document.keyId}' is not trusted.`);
  const expected = await describeUnsignedArtifacts(registry);
  const expectedByIdentity = new Map(expected.map((artifact) => [`${artifact.kind}/${artifact.target ?? ""}/${artifact.name}`, artifact]));
  const signedByIdentity = new Map(document.artifacts.map((artifact) => [`${artifact.kind}/${artifact.target ?? ""}/${artifact.name}`, artifact]));
  if (signedByIdentity.size !== document.artifacts.length) errors.push("Registry provenance contains duplicate artifact identities.");
  const artifacts = document.artifacts.map((artifact) => {
    const identity = `${artifact.kind}/${artifact.target ?? ""}/${artifact.name}`;
    const current = expectedByIdentity.get(identity);
    const { signature, ...signedPayload } = artifact;
    const matchesCurrent = Boolean(current && stableStringify(current) === stableStringify(signedPayload));
    const signatureValid = verify(null, Buffer.from(artifactPayload(signedPayload, document.keyId, document.generatedAt)), publicKey, Buffer.from(signature, "base64"));
    const valid = matchesCurrent && signatureValid;
    if (!current) errors.push(`Signed artifact '${identity}' is not present in the registry.`);
    else if (!matchesCurrent) errors.push(`Registry artifact '${identity}' changed after signing.`);
    else if (!signatureValid) errors.push(`Registry artifact '${identity}' has an invalid signature.`);
    return { ...artifact, valid };
  });
  for (const identity of expectedByIdentity.keys()) {
    if (!signedByIdentity.has(identity)) errors.push(`Registry artifact '${identity}' is not signed.`);
  }
  return { valid: errors.length === 0 && artifacts.every((artifact) => artifact.valid), trusted, keyId: document.keyId, fingerprint, artifacts, errors };
}
