import type { PlaygroundControl, PlaygroundState } from "./types.js";

const prefix = "pg.";

export function readPlaygroundState<State extends PlaygroundState>(defaults: State): State {
  if (typeof window === "undefined") return defaults;
  const params = new URLSearchParams(window.location.search);
  const next = { ...defaults };
  for (const [key, defaultValue] of Object.entries(defaults)) {
    const encoded = params.get(prefix + key);
    if (encoded === null) continue;
    if (typeof defaultValue === "boolean") next[key as keyof State] = (encoded === "true") as State[keyof State];
    else if (typeof defaultValue === "number") {
      const parsed = Number(encoded);
      if (Number.isFinite(parsed)) next[key as keyof State] = parsed as State[keyof State];
    } else next[key as keyof State] = encoded as State[keyof State];
  }
  return next;
}

export function writePlaygroundState(state: PlaygroundState, defaults: PlaygroundState) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const key of Array.from(url.searchParams.keys())) {
    if (key.startsWith(prefix)) url.searchParams.delete(key);
  }
  for (const [key, value] of Object.entries(state)) {
    if (value !== defaults[key]) url.searchParams.set(prefix + key, String(value));
  }
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}

export function stateMatches(state: PlaygroundState, values: Partial<PlaygroundState>) {
  return Object.entries(values).every(([key, value]) => state[key] === value);
}

export function normalizePlaygroundState<State extends PlaygroundState>(
  state: State,
  defaults: State,
  controls: readonly PlaygroundControl<State>[],
): State {
  const next = { ...state };
  for (const control of controls) {
    const value = next[control.key];
    if ((control.type === "select" || control.type === "segmented") && !control.options.some((option) => option.value === value)) {
      next[control.key] = defaults[control.key];
    }
    if (control.type === "range" && typeof value === "number") {
      next[control.key] = Math.min(control.max, Math.max(control.min, value)) as State[typeof control.key];
    }
  }
  return next;
}
