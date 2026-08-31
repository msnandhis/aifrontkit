import { useMemo } from "react";
import { createRuntime, type AIFrontEvent } from "@aifrontkit/core";
import { AIFrontKitProvider, ConnectionPrimitive, TaskPrimitive } from "@aifrontkit/react";

const initialEvents: AIFrontEvent[] = [
  {
    schemaVersion: 4,
    id: "astro-task-started",
    threadId: "astro-fixture",
    timestamp: 1,
    type: "task.started",
    taskId: "island-proof",
    title: "Hydrated island proof"
  }
];

export function AgentIsland() {
  const runtime = useMemo(() => createRuntime("astro-fixture", initialEvents), []);
  return (
    <AIFrontKitProvider runtime={runtime}>
      <section data-fixture="astro-react-island">
        <ConnectionPrimitive.Root>
          <ConnectionPrimitive.Status />
        </ConnectionPrimitive.Root>
        <TaskPrimitive.Root taskId="island-proof">
          <TaskPrimitive.Title />
          <TaskPrimitive.Status />
        </TaskPrimitive.Root>
      </section>
    </AIFrontKitProvider>
  );
}
