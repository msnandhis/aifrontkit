import type { AnyPlaygroundDefinition, ComponentName } from "../types.js";
import { conversationPlayground } from "./conversation.playground.js";
import { filePlayground } from "./file.playground.js";
import { messagePlayground } from "./message.playground.js";
import { promptInputPlayground } from "./prompt-input.playground.js";
import { toolCallPlayground } from "./tool-call.playground.js";
import { agentProgressPlayground } from "./agent-progress.playground.js";
import { toolApprovalPlayground } from "./tool-approval.playground.js";
import { researchAgentPlayground } from "./research-agent.playground.js";

export const playgroundDefinitions: Record<ComponentName, AnyPlaygroundDefinition> = {
  conversation: conversationPlayground as unknown as AnyPlaygroundDefinition,
  message: messagePlayground as unknown as AnyPlaygroundDefinition,
  "prompt-input": promptInputPlayground as unknown as AnyPlaygroundDefinition,
  file: filePlayground as unknown as AnyPlaygroundDefinition,
  "tool-call": toolCallPlayground as unknown as AnyPlaygroundDefinition,
  "agent-progress": agentProgressPlayground as unknown as AnyPlaygroundDefinition,
  "tool-approval": toolApprovalPlayground as unknown as AnyPlaygroundDefinition,
  "research-agent": researchAgentPlayground as unknown as AnyPlaygroundDefinition,
};

export function getPlaygroundDefinition(component: ComponentName) {
  return playgroundDefinitions[component];
}
