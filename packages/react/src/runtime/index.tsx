import { createContext, useContext, useSyncExternalStore, type PropsWithChildren } from "react";
import type { Runtime, RuntimeState } from "@aifrontkit/core";
import { ThemeProvider, type ThemeInput } from "../theme/index.js";

const RuntimeContext = createContext<Runtime | null>(null);

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

export function useRuntimeState<T>(selector: (state: RuntimeState) => T): T {
  const runtime = useAIFrontKitRuntime();
  const getSnapshot = () => selector(runtime.getState());
  return useSyncExternalStore(runtime.subscribe, getSnapshot, getSnapshot);
}
