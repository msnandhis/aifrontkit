import type { AIFrontEvent } from "@aifrontkit/core";

/** A minimal store contract compatible with React's external-store model. */
export interface ExternalStore<TSnapshot> {
  getSnapshot(): TSnapshot;
  subscribe(listener: () => void): () => void;
}

export interface ExternalStoreBridgeOptions<TSnapshot> {
  store: ExternalStore<TSnapshot>;
  project(next: TSnapshot, previous: TSnapshot | undefined): readonly AIFrontEvent[];
  emit(events: readonly AIFrontEvent[]): void;
}

/**
 * Projects provider-owned store snapshots into events without mirroring that
 * store inside AIFrontKit or coupling components to its implementation.
 */
export function createExternalStoreBridge<TSnapshot>(options: ExternalStoreBridgeOptions<TSnapshot>) {
  let previous: TSnapshot | undefined;
  let unsubscribe: (() => void) | undefined;

  const sync = () => {
    const next = options.store.getSnapshot();
    const events = options.project(next, previous);
    previous = next;
    if (events.length > 0) options.emit(events);
    return events;
  };

  return {
    get connected() {
      return unsubscribe !== undefined;
    },
    connect() {
      if (unsubscribe) return unsubscribe;
      const dispose = options.store.subscribe(sync);
      let active = true;
      unsubscribe = () => {
        if (!active) return;
        active = false;
        dispose();
        unsubscribe = undefined;
        previous = undefined;
      };
      sync();
      return unsubscribe;
    },
    disconnect() {
      unsubscribe?.();
    },
    sync
  };
}
