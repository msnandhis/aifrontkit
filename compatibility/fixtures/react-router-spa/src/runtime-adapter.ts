import { createRuntime, type AIFrontEvent, type Runtime } from "@aifrontkit/core";

/** The application transport knows only how to deliver canonical AIFrontKit events. */
export interface EventTransport {
  connect(emit: (event: AIFrontEvent) => void): () => void;
}

export function createRuntimeFromTransport(threadId: string, transport: EventTransport): {
  runtime: Runtime;
  connect(): () => void;
} {
  const runtime = createRuntime(threadId);
  return {
    runtime,
    connect: () => transport.connect((event) => runtime.dispatch(event))
  };
}

export function createFixtureTransport(threadId: string): EventTransport {
  return {
    connect(emit) {
      const events: AIFrontEvent[] = [
        {
          schemaVersion: 4,
          id: "fixture-task-started",
          threadId,
          timestamp: 1,
          type: "task.started",
          taskId: "framework-proof",
          title: "Framework integration proof"
        },
        {
          schemaVersion: 4,
          id: "fixture-connection-ready",
          threadId,
          timestamp: 2,
          type: "connection.changed",
          status: "connected"
        }
      ];
      events.forEach(emit);
      return () => undefined;
    }
  };
}
