import { createInterface } from "node:readline";
import { DEFAULT_REGISTRY_URL, getRegistryItemInfo, listRegistryItems } from "./index.js";
import { verifyRegistryProvenance } from "./provenance.js";

export const MCP_PROTOCOL_VERSION = "2025-06-18";

interface McpRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function response(id: McpRequest["id"], result: unknown) {
  return { jsonrpc: "2.0" as const, id: id ?? null, result };
}

function errorResponse(id: McpRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0" as const, id: id ?? null, error: { code, message } };
}

function textResult(value: unknown) {
  const structuredContent = isRecord(value) ? value : { value };
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent };
}

function toolErrorResult(error: unknown) {
  return { content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }], isError: true };
}

function exactInput(value: unknown, required: Record<string, "string">) {
  if (!isRecord(value)) return false;
  if (Object.keys(value).some((key) => !(key in required))) return false;
  return Object.entries(required).every(([key, type]) => key in value && typeof value[key] === type);
}

const tools = [
  {
    name: "registry_list",
    description: "List AIFrontKit registry items with optional text filtering.",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, additionalProperties: false }
  },
  {
    name: "registry_info",
    description: "Get target and compatibility metadata for one AIFrontKit registry item.",
    inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"], additionalProperties: false }
  },
  {
    name: "registry_verify_provenance",
    description: "Verify detached Ed25519 signatures and current registry artifact digests.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  }
] as const;

export function createMcpRequestHandler(options: { registry?: string; trustedPublicKeys?: Record<string, string>; requireTrustedKey?: boolean } = {}) {
  let initialized = false;
  let ready = false;

  return async (input: unknown) => {
    if (!isRecord(input) || input.jsonrpc !== "2.0" || typeof input.method !== "string" || ("id" in input && input.id !== null && typeof input.id !== "string" && typeof input.id !== "number")) {
      return errorResponse(null, -32600, "Invalid JSON-RPC request.");
    }
    const request = input as unknown as McpRequest;
    const notification = request.method.startsWith("notifications/");
    if ((!notification && request.id === undefined) || (notification && request.id !== undefined)) return errorResponse(null, -32600, "Invalid JSON-RPC request ID for method type.");
    if (request.method === "initialize") {
      if (initialized) return errorResponse(request.id, -32600, "MCP server is already initialized.");
      if (!isRecord(request.params) || typeof request.params.protocolVersion !== "string" || !isRecord(request.params.capabilities) || !isRecord(request.params.clientInfo) || typeof request.params.clientInfo.name !== "string" || typeof request.params.clientInfo.version !== "string") {
        return errorResponse(request.id, -32602, "initialize requires protocolVersion, capabilities and clientInfo.");
      }
      initialized = true;
      return response(request.id, { protocolVersion: MCP_PROTOCOL_VERSION, capabilities: { tools: { listChanged: false } }, serverInfo: { name: "aifrontkit-registry", version: "0.1.0" } });
    }
    if (request.method === "ping") return response(request.id, {});
    if (request.method === "notifications/initialized") {
      if (initialized) ready = true;
      return null;
    }
    if (!ready) return errorResponse(request.id, -32002, "MCP server is not initialized.");
    if (request.method === "tools/list") {
      if (request.params !== undefined && (!isRecord(request.params) || Object.keys(request.params).some((key) => !["cursor", "_meta"].includes(key)) || ("cursor" in request.params && typeof request.params.cursor !== "string") || ("_meta" in request.params && !isRecord(request.params._meta)))) {
        return errorResponse(request.id, -32602, "tools/list accepts only cursor and _meta parameters.");
      }
      return response(request.id, { tools });
    }
    if (request.method === "tools/call") {
      if (!isRecord(request.params) || typeof request.params.name !== "string" || ("arguments" in request.params && !isRecord(request.params.arguments)) || Object.keys(request.params).some((key) => !["name", "arguments", "_meta"].includes(key)) || ("_meta" in request.params && !isRecord(request.params._meta))) {
        return errorResponse(request.id, -32602, "tools/call requires a name and accepts optional object arguments and _meta parameters.");
      }
      const name = request.params.name;
      const args: Record<string, unknown> = isRecord(request.params.arguments) ? request.params.arguments : {};
      try {
        if (name === "registry_list") {
          if (!(exactInput(args, {}) || exactInput(args, { query: "string" }))) return errorResponse(request.id, -32602, "registry_list accepts only an optional string query.");
          return response(request.id, textResult(await listRegistryItems(options.registry, typeof args.query === "string" ? args.query : undefined)));
        }
        if (name === "registry_info") {
          if (!exactInput(args, { name: "string" }) || !(args.name as string).trim()) return errorResponse(request.id, -32602, "registry_info requires exactly one non-empty string name.");
          return response(request.id, textResult(await getRegistryItemInfo(args.name as string, options.registry)));
        }
        if (name === "registry_verify_provenance") {
          if (!exactInput(args, {})) return errorResponse(request.id, -32602, "registry_verify_provenance does not accept arguments.");
          return response(request.id, textResult(await verifyRegistryProvenance(options.registry ?? DEFAULT_REGISTRY_URL, {
            ...(options.trustedPublicKeys ? { trustedPublicKeys: options.trustedPublicKeys } : {}),
            ...(options.requireTrustedKey ? { requireTrustedKey: true } : {})
          })));
        }
      } catch (error) {
        return response(request.id, toolErrorResult(error));
      }
      return errorResponse(request.id, -32601, `MCP tool '${name}' was not found.`);
    }
    if (request.method.startsWith("notifications/")) return null;
    return errorResponse(request.id, -32601, `Method '${request.method}' was not found.`);
  };
}

/** Run the read-only registry MCP server over newline-delimited stdio JSON-RPC. */
export async function runMcpServer(options: { registry?: string; trustedPublicKeys?: Record<string, string>; requireTrustedKey?: boolean } = {}) {
  const handle = createMcpRequestHandler(options);
  const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of input) {
    if (!line.trim()) continue;
    let request: unknown;
    try {
      request = JSON.parse(line);
    } catch {
      process.stdout.write(`${JSON.stringify(errorResponse(null, -32700, "Invalid JSON."))}\n`);
      continue;
    }
    try {
      const result = await handle(request);
      if (result) process.stdout.write(`${JSON.stringify(result)}\n`);
    } catch (error) {
      const id = isRecord(request) && (typeof request.id === "string" || typeof request.id === "number" || request.id === null) ? request.id : null;
      process.stdout.write(`${JSON.stringify(errorResponse(id, -32603, error instanceof Error ? error.message : String(error)))}\n`);
    }
  }
}
