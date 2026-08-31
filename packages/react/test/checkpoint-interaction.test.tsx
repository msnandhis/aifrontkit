import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentCheckpoint } from "@aifrontkit/core";

const hookState = vi.hoisted(() => ({ setters: [] as Array<(value: unknown) => void> }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    createContext(initialValue: unknown) {
      const context: { value: unknown; Provider?: { context: unknown } } = { value: initialValue };
      context.Provider = { context };
      return context;
    },
    useContext(context: { value: unknown }) {
      return context.value;
    },
    useRef<T>(initialValue: T) {
      return { current: initialValue };
    },
    useState<T>(initialValue: T) {
      let value = initialValue;
      const setter = (next: T | ((previous: T) => T)) => {
        value = typeof next === "function" ? (next as (previous: T) => T)(value) : next;
      };
      hookState.setters.push(setter as (value: unknown) => void);
      return [value, setter] as const;
    }
  };
});

import { CheckpointPrimitive } from "../src/checkpoint/index.js";

const checkpoint: AgentCheckpoint = {
  id: "checkpoint-1",
  version: 3,
  sequence: 8,
  kind: "interruption",
  title: "Research paused",
  status: "available",
  restorable: true,
  createdAt: 1,
  updatedAt: 2,
  sourceTaskId: "task-1",
  sourceTaskVersion: 4
};

function renderPrimitive(onRestore: (intent: unknown) => void | Promise<void>) {
  const rootElement = CheckpointPrimitive.Root({
    checkpoint,
    currentTaskVersion: 4,
    taskStatus: "paused",
    connection: { status: "connected", attempt: 0, updatedAt: 1 },
    onRestore,
    children: null
  }) as { type: (props: unknown) => unknown; props: unknown };
  const providerElement = rootElement.type(rootElement.props) as {
    type: { context: { value: unknown } };
    props: { value: unknown };
  };
  providerElement.type.context.value = providerElement.props.value;
  const buttonElement = CheckpointPrimitive.Restore({}) as {
    props: { onClick: (event: { defaultPrevented: boolean }) => void };
  };
  return { buttonElement, context: providerElement.props.value as { runRestore(): Promise<void> } };
}

describe("CheckpointPrimitive restore interaction", () => {
  beforeEach(() => {
    hookState.setters.length = 0;
  });

  it("blocks duplicate actions while the callback Promise is unresolved", async () => {
    let resolveRestore: (() => void) | undefined;
    const callback = vi.fn(() => new Promise<void>((resolve) => {
      resolveRestore = resolve;
    }));
    const { buttonElement } = renderPrimitive(callback);

    buttonElement.props.onClick({ defaultPrevented: false });
    buttonElement.props.onClick({ defaultPrevented: false });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({
      checkpointId: "checkpoint-1",
      checkpointVersion: 3,
      sourceTaskId: "task-1",
      sourceTaskVersion: 4,
      currentTaskVersion: 4
    });

    resolveRestore?.();
    await Promise.resolve();
    await Promise.resolve();

    buttonElement.props.onClick({ defaultPrevented: false });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("contains rejected callbacks without inventing a success or throwing", async () => {
    const callback = vi.fn(async () => {
      throw new Error("Provider rejected restore");
    });
    const { context } = renderPrimitive(callback);
    await expect(context.runRestore()).resolves.toBeUndefined();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(hookState.setters).toHaveLength(1);
  });
});
