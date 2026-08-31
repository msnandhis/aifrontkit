import type { MessagePartComponents } from "@aifrontkit/react/message";
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { File } from "../../../../registry/react/css/components/file/file.js";
import { ComponentPlayground } from "../playground/playground.js";
import type { AnyPlaygroundDefinition, ComponentName } from "../playground/types.js";

/** The documented renderer shape is typechecked against the public primitive contract. */
export const messagePartComponentsExample: MessagePartComponents = {
  file: ({ part }) => <File file={part} />,
};

function lazyPlayground(loader: () => Promise<AnyPlaygroundDefinition>): LazyExoticComponent<ComponentType> {
  return lazy(async () => {
    const definition = await loader();
    return { default: () => <ComponentPlayground definition={definition} /> };
  });
}

const playgrounds: Record<ComponentName, LazyExoticComponent<ComponentType>> = {
  conversation: lazyPlayground(async () => (await import("../playground/definitions/conversation.playground.js")).conversationPlayground as unknown as AnyPlaygroundDefinition),
  message: lazyPlayground(async () => (await import("../playground/definitions/message.playground.js")).messagePlayground as unknown as AnyPlaygroundDefinition),
  "prompt-input": lazyPlayground(async () => (await import("../playground/definitions/prompt-input.playground.js")).promptInputPlayground as unknown as AnyPlaygroundDefinition),
  file: lazyPlayground(async () => (await import("../playground/definitions/file.playground.js")).filePlayground as unknown as AnyPlaygroundDefinition),
  "tool-call": lazyPlayground(async () => (await import("../playground/definitions/tool-call.playground.js")).toolCallPlayground as unknown as AnyPlaygroundDefinition),
  "agent-progress": lazyPlayground(async () => (await import("../playground/definitions/agent-progress.playground.js")).agentProgressPlayground as unknown as AnyPlaygroundDefinition),
  "tool-approval": lazyPlayground(async () => (await import("../playground/definitions/tool-approval.playground.js")).toolApprovalPlayground as unknown as AnyPlaygroundDefinition),
  "research-agent": lazyPlayground(async () => (await import("../playground/definitions/research-agent.playground.js")).researchAgentPlayground as unknown as AnyPlaygroundDefinition),
};

export function ComponentPreview({ component }: { component: ComponentName }) {
  const Playground = playgrounds[component];
  return (
    <Suspense fallback={<div className="component-preview-loading" role="status">Loading {component.replace("-", " ")} preview…</div>}>
      <Playground key={component} />
    </Suspense>
  );
}
