import { useEffect, useMemo } from "react";
import { AIFrontKitProvider, ConnectionPrimitive, TaskPrimitive } from "@aifrontkit/react";
import { createFixtureTransport, createRuntimeFromTransport } from "./runtime-adapter.js";

export function RunRoute() {
  const integration = useMemo(
    () => createRuntimeFromTransport("react-router-fixture", createFixtureTransport("react-router-fixture")),
    []
  );

  useEffect(() => integration.connect(), [integration]);

  return (
    <AIFrontKitProvider runtime={integration.runtime}>
      <main data-fixture="react-router-adapter-boundary">
        <h1>React Router consumer</h1>
        <ConnectionPrimitive.Root>
          <ConnectionPrimitive.Status />
        </ConnectionPrimitive.Root>
        <TaskPrimitive.Root taskId="framework-proof">
          <TaskPrimitive.Title />
          <TaskPrimitive.Status />
        </TaskPrimitive.Root>
      </main>
    </AIFrontKitProvider>
  );
}
