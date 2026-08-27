import type { PlaygroundControl, PlaygroundDefinition, PlaygroundEnvironment, PlaygroundRecord, PlaygroundState, PartialPlaygroundState } from "./types.js";

const prefix = "pg.";

function readPrimitive(encoded: string, sample: unknown): unknown {
  if (typeof sample === "boolean") return encoded === "true";
  if (typeof sample === "number") {
    const parsed = Number(encoded);
    return Number.isFinite(parsed) ? parsed : sample;
  }
  return encoded;
}

/**
 * Reads both the current scoped format (`pg.props.foo`) and the original flat
 * format (`pg.foo`) so links copied from earlier docs releases continue to work.
 */
export function readPlaygroundState<Props extends PlaygroundRecord, Environment extends PlaygroundEnvironment>(
  defaults: PlaygroundState<Props, Environment>,
  controls: readonly PlaygroundControl<Props, Environment>[] = [],
): PlaygroundState<Props, Environment> {
  if (typeof window === "undefined") return cloneState(defaults);
  const params = new URLSearchParams(window.location.search);
  const next = cloneState(defaults);
  const controlByKey = new Map(controls.map((control) => [`${control.scope}.${control.key}`, control]));

  const readBucket = <Scope extends "props" | "environment">(scope: Scope, bucket: Scope extends "props" ? Props : Environment) => {
    const result = { ...bucket } as Scope extends "props" ? Props : Environment;
    for (const key of Object.keys(bucket)) {
      const scoped = params.get(`${prefix}${scope}.${key}`);
      const legacy = params.get(`${prefix}${key}`);
      const encoded = scoped ?? legacy;
      if (encoded === null) continue;
      const sample = bucket[key as keyof typeof bucket];
      const control = controlByKey.get(`${scope}.${key}`);
      if (control && (control.type === "select" || control.type === "segmented") && !control.options.some((option) => option.value === encoded)) continue;
      result[key as keyof typeof result] = readPrimitive(encoded, sample) as (typeof result)[keyof typeof result];
    }
    return result;
  };

  next.props = readBucket("props", defaults.props);
  next.environment = readBucket("environment", defaults.environment);
  return next;
}

/** Writes only differences from defaults, keeping share URLs short and stable. */
export function writePlaygroundState<Props extends PlaygroundRecord, Environment extends PlaygroundEnvironment>(
  state: PlaygroundState<Props, Environment>,
  defaults: PlaygroundState<Props, Environment>,
) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const key of Array.from(url.searchParams.keys())) {
    if (key.startsWith(prefix)) url.searchParams.delete(key);
  }
  let hasOverride = false;
  for (const [key, value] of Object.entries(state.props)) {
    if (value !== defaults.props[key]) {
      url.searchParams.set(`${prefix}props.${key}`, String(value));
      hasOverride = true;
    }
  }
  for (const [key, value] of Object.entries(state.environment)) {
    if (value !== defaults.environment[key]) {
      url.searchParams.set(`${prefix}environment.${key}`, String(value));
      hasOverride = true;
    }
  }
  if (hasOverride) url.searchParams.set(`${prefix}v`, "1");
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}

export function stateMatches<Props extends PlaygroundRecord, Environment extends PlaygroundEnvironment>(
  state: PlaygroundState<Props, Environment>,
  values: PartialPlaygroundState<Props, Environment>,
) {
  return Object.entries(values.props ?? {}).every(([key, value]) => state.props[key] === value)
    && Object.entries(values.environment ?? {}).every(([key, value]) => state.environment[key] === value);
}

export function normalizePlaygroundState<Props extends PlaygroundRecord, Environment extends PlaygroundEnvironment>(
  state: PlaygroundState<Props, Environment>,
  defaults: PlaygroundState<Props, Environment>,
  controls: readonly PlaygroundControl<Props, Environment>[],
): PlaygroundState<Props, Environment> {
  const next = cloneState(state);
  for (const control of controls) {
    const bucket = next[control.scope] as PlaygroundRecord;
    const defaultBucket = defaults[control.scope] as PlaygroundRecord;
    const value = bucket[control.key];
    if ((control.type === "select" || control.type === "segmented") && !control.options.some((option) => option.value === value)) {
      bucket[control.key] = defaultBucket[control.key];
    }
    if (control.type === "range" && typeof value === "number") {
      bucket[control.key] = Math.min(control.max, Math.max(control.min, value));
    }
  }
  return next;
}

/** Stable JSON used by snapshots and copy/share integrations. */
export function serializePlaygroundState<Props extends PlaygroundRecord, Environment extends PlaygroundEnvironment>(state: PlaygroundState<Props, Environment>): string {
  return JSON.stringify({ props: sortRecord(state.props), environment: sortRecord(state.environment) });
}

/** Versioned envelope for a complete example/scenario replay. */
export function serializePlaygroundScenario<Props extends PlaygroundRecord, Environment extends PlaygroundEnvironment>(
  definition: Pick<PlaygroundDefinition<Props, Environment>, "id" | "version">,
  state: PlaygroundState<Props, Environment>,
) {
  return JSON.stringify({ schemaVersion: 1, definition: definition.id, version: definition.version, state: JSON.parse(serializePlaygroundState(state)) });
}

export function deserializePlaygroundScenario(value: string): { schemaVersion: 1; definition: string; version: string; state: PlaygroundState } | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || parsed.schemaVersion !== 1 || typeof parsed.definition !== "string" || typeof parsed.version !== "string" || !isRecord(parsed.state)) return null;
    if (!isRecord(parsed.state.props) || !isRecord(parsed.state.environment)) return null;
    return parsed as { schemaVersion: 1; definition: string; version: string; state: PlaygroundState };
  } catch {
    return null;
  }
}

function cloneState<Props extends PlaygroundRecord, Environment extends PlaygroundEnvironment>(state: PlaygroundState<Props, Environment>): PlaygroundState<Props, Environment> {
  return { props: { ...state.props }, environment: { ...state.environment } };
}

function sortRecord(record: PlaygroundRecord | PlaygroundEnvironment) {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
