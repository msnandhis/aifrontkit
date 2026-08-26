import { ConversationFixture, conversationQualityScenarios, type ConversationFixtureId } from "../../../registry/components/conversation/conversation.fixture.js";
import { MessageFixture, messageQualityScenarios, type MessageFixtureId } from "../../../registry/components/message/message.fixture.js";
import { PromptInputFixture, promptInputQualityScenarios, type PromptInputFixtureId } from "../../../registry/components/prompt-input/prompt-input.fixture.js";
import { ToolCallFixture, toolCallQualityScenarios, type ToolCallFixtureId } from "../../../registry/components/tool-call/tool-call.fixture.js";

export type LabComponentId = "conversation" | "message" | "prompt-input" | "tool-call";
export type LabComponentMaturity = "preview" | "experimental";

export interface LabScenario {
  id: string;
  title: string;
  expectation: string;
}

export interface LabComponentContract {
  id: LabComponentId;
  title: string;
  maturity: LabComponentMaturity;
  description: string;
  scenarios: readonly LabScenario[];
}

const scenarioTitle = (id: string) => {
  if (id === "rtl") return "RTL";
  const label = id.replaceAll("-", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const componentFixtureContracts: readonly LabComponentContract[] = [
  {
    id: "conversation",
    title: "Conversation",
    maturity: "preview",
    description: "Transcript layout, message states, scroll following, and prompt composition.",
    scenarios: conversationQualityScenarios.map((scenario) => ({ id: scenario.id, title: scenarioTitle(scenario.id), expectation: scenario.expectation })),
  },
  {
    id: "message",
    title: "Message",
    maturity: "preview",
    description: "Role hierarchy, rich content boundaries, actions, and recovery states.",
    scenarios: messageQualityScenarios.map((scenario) => ({ id: scenario.id, title: scenarioTitle(scenario.id), expectation: scenario.expectation })),
  },
  {
    id: "prompt-input",
    title: "Prompt input",
    maturity: "preview",
    description: "Labeled multiline input, toolbar composition, and async submission semantics.",
    scenarios: promptInputQualityScenarios.map((scenario) => ({ id: scenario.id, title: scenarioTitle(scenario.id), expectation: scenario.expectation })),
  },
  {
    id: "tool-call",
    title: "Tool call",
    maturity: "experimental",
    description: "Tool lifecycle status, output boundaries, and failure meaning.",
    scenarios: toolCallQualityScenarios.map((scenario) => ({ id: scenario.id, title: scenarioTitle(scenario.id), expectation: scenario.expectation })),
  },
];

export const componentFixtureMap = Object.fromEntries(componentFixtureContracts.map((contract) => [contract.id, contract])) as Record<LabComponentId, LabComponentContract>;

export const componentFixtureIds = componentFixtureContracts.map((contract) => contract.id);

export function renderRegistryFixture(component: LabComponentId, scenario: string) {
  switch (component) {
    case "message":
      return <MessageFixture scenario={scenario as MessageFixtureId} />;
    case "prompt-input":
      return <PromptInputFixture scenario={scenario as PromptInputFixtureId} />;
    case "tool-call":
      return <ToolCallFixture scenario={scenario as ToolCallFixtureId} />;
    case "conversation":
    default:
      return <ConversationFixture scenario={scenario as ConversationFixtureId} />;
  }
}
