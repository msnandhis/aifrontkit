import { createContext, useContext, useSyncExternalStore, type PropsWithChildren } from "react";
import type { Message, Runtime, RuntimeState } from "@aifrontkit/core";
import { ThemeProvider, type ThemeInput } from "../theme/index.js";

const RuntimeContext = createContext<Runtime | null>(null);
const ControlledMessagesContext = createContext<readonly Message[] | null>(null);
const emptySubscribe = () => () => undefined;

export interface AIFrontKitProviderProps extends PropsWithChildren {
  runtime: Runtime;
  /** Optional visual configuration. Omit it when the host owns the theme root. */
  theme?: ThemeInput;
}

export function AIFrontKitProvider({ runtime, theme, children }: AIFrontKitProviderProps) {
  const content = theme === undefined ? children : <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  return <RuntimeContext.Provider value={runtime}>{content}</RuntimeContext.Provider>;
}

export function useAIFrontKitRuntime(): Runtime {
  const runtime = useContext(RuntimeContext);
  if (!runtime) throw new Error("AIFrontKit hooks require an <AIFrontKitProvider>.");
  return runtime;
}

export function useOptionalAIFrontKitRuntime(): Runtime | null {
  return useContext(RuntimeContext);
}

/**
 * Internal transport for controlled primitives. It deliberately carries values,
 * not a synthesized Runtime, so controlled trees have no event-store semantics.
 */
export function ControlledMessagesProvider({ messages, children }: PropsWithChildren<{ messages: readonly Message[] }>) {
  return <ControlledMessagesContext.Provider value={messages}>{children}</ControlledMessagesContext.Provider>;
}

export function useControlledMessages(): readonly Message[] | null {
  return useContext(ControlledMessagesContext);
}

/** Resolve a controlled message first, then an optional runtime. Safe in either mode. */
export function useMessageById(messageId: string): Message | undefined {
  const controlled = useControlledMessages();
  const runtime = useOptionalAIFrontKitRuntime();
  return useSyncExternalStore(
    runtime ? runtime.subscribe : emptySubscribe,
    () => controlled?.find((message) => message.id === messageId) ?? runtime?.getState().messages[messageId],
    () => controlled?.find((message) => message.id === messageId) ?? runtime?.getState().messages[messageId]
  );
}

export function useRuntimeState<T>(selector: (state: RuntimeState) => T): T {
  const runtime = useAIFrontKitRuntime();
  const getSnapshot = () => selector(runtime.getState());
  return useSyncExternalStore(runtime.subscribe, getSnapshot, getSnapshot);
}
