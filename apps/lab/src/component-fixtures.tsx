import { ConversationFixture, conversationQualityScenarios, type ConversationFixtureId } from "../../../registry/react/css/components/conversation/conversation.fixture.js";
import { MessageFixture, messageQualityScenarios, type MessageFixtureId } from "../../../registry/react/css/components/message/message.fixture.js";
import { PromptInputFixture, promptInputQualityScenarios, type PromptInputFixtureId } from "../../../registry/react/css/components/prompt-input/prompt-input.fixture.js";
import { ToolCallFixture, toolCallQualityScenarios, type ToolCallFixtureId } from "../../../registry/react/css/components/tool-call/tool-call.fixture.js";
import { FileFixture, type FileFixtureId } from "../../../registry/react/css/components/file/file.fixture.js";

export type LabComponentId = "conversation" | "message" | "prompt-input" | "tool-call" | "file";
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
    id: "file",
    title: "File",
    maturity: "preview",
    description: "Safe downloads, MIME identity, size and source-owned compound composition.",
    scenarios: ["default", "loading", "ready", "failed", "download-unavailable"].map((id) => ({ id, title: scenarioTitle(id), expectation: "The file remains readable, bounded, and explicit about action availability." })),
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
    case "file":
      return <FileFixture id={scenario as FileFixtureId} />;
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
