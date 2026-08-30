import { conversationExample, type ConversationExampleState } from "../../../registry/react/css/components/conversation/conversation.example.js";
import { messageExample, type MessageExampleState } from "../../../registry/react/css/components/message/message.example.js";
import { promptInputExample, type PromptInputExampleState } from "../../../registry/react/css/components/prompt-input/prompt-input.example.js";
import { ToolCallFixture, toolCallQualityScenarios, type ToolCallFixtureId } from "../../../registry/react/css/components/tool-call/tool-call.fixture.js";
import { fileExample, type FileExampleState } from "../../../registry/react/css/components/file/file.example.js";
import { AgentProgressFixture, agentProgressQualityScenarios, type AgentProgressFixtureId } from "../../../registry/react/css/patterns/agent-progress/agent-progress.fixture.js";
import { ToolApprovalFixture, toolApprovalQualityScenarios, type ToolApprovalFixtureId } from "../../../registry/react/css/patterns/tool-approval/tool-approval.fixture.js";
import { ResearchAgentFixture, researchAgentQualityScenarios, type ResearchAgentFixtureId } from "../../../registry/react/css/patterns/research-agent/research-agent.fixture.js";

export type LabComponentId = "conversation" | "message" | "prompt-input" | "tool-call" | "file" | "agent-progress" | "tool-approval" | "research-agent";
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
  source?(scenarioId: string): string;
}

const scenarioTitle = (id: string) => {
  if (id === "rtl") return "RTL";
  const label = id.replaceAll("-", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
};

function fileStateFor(scenarioId: string): FileExampleState {
  const scenario = fileExample.scenarios.find((candidate) => candidate.id === scenarioId);
  if (!scenario) throw new Error(`Unknown File scenario '${scenarioId}'.`);

  return {
    props: { ...fileExample.defaults.props, ...scenario.values.props },
    environment: { ...fileExample.defaults.environment, ...scenario.values.environment },
  };
}

function conversationStateFor(scenarioId: string): ConversationExampleState {
  const scenario = conversationExample.scenarios.find((candidate) => candidate.id === scenarioId);
  if (!scenario) throw new Error(`Unknown Conversation scenario '${scenarioId}'.`);

  return {
    props: { ...conversationExample.defaults.props, ...scenario.values.props },
    environment: { ...conversationExample.defaults.environment, ...scenario.values.environment },
  };
}

function messageStateFor(scenarioId: string): MessageExampleState {
  const scenario = messageExample.scenarios.find((candidate) => candidate.id === scenarioId);
  if (!scenario) throw new Error(`Unknown Message scenario '${scenarioId}'.`);

  return {
    props: { ...messageExample.defaults.props, ...scenario.values.props },
    environment: { ...messageExample.defaults.environment, ...scenario.values.environment },
  };
}

function promptInputStateFor(scenarioId: string): PromptInputExampleState {
  const scenario = promptInputExample.scenarios.find((candidate) => candidate.id === scenarioId);
  if (!scenario) throw new Error(`Unknown Prompt Input scenario '${scenarioId}'.`);

  return {
    props: { ...promptInputExample.defaults.props, ...scenario.values.props },
    environment: { ...promptInputExample.defaults.environment, ...scenario.values.environment },
  };
}

export const componentFixtureContracts: readonly LabComponentContract[] = [
  {
    id: "conversation",
    title: "Conversation",
    maturity: "preview",
    description: "Transcript layout, message states, scroll following, and prompt composition.",
    scenarios: conversationExample.scenarios.map((scenario) => ({
      id: scenario.id,
      title: scenario.label,
      expectation: scenario.description,
    })),
    source: (scenarioId) => conversationExample.generateCode(conversationStateFor(scenarioId)),
  },
  {
    id: "file",
    title: "File",
    maturity: "preview",
    description: "Safe downloads, MIME identity, size and source-owned compound composition.",
    scenarios: fileExample.scenarios.map((scenario) => ({
      id: scenario.id,
      title: scenario.label,
      expectation: scenario.description,
    })),
    source: (scenarioId) => fileExample.generateCode(fileStateFor(scenarioId)),
  },
  {
    id: "message",
    title: "Message",
    maturity: "preview",
    description: "Role hierarchy, rich content boundaries, actions, and recovery states.",
    scenarios: messageExample.scenarios.map((scenario) => ({ id: scenario.id, title: scenario.label, expectation: scenario.description })),
    source: (scenarioId) => messageExample.generateCode(messageStateFor(scenarioId)),
  },
  {
    id: "prompt-input",
    title: "Prompt input",
    maturity: "preview",
    description: "Labeled multiline input, toolbar composition, and async submission semantics.",
    scenarios: promptInputExample.scenarios.map((scenario) => ({ id: scenario.id, title: scenario.label, expectation: scenario.description })),
    source: (scenarioId) => promptInputExample.generateCode(promptInputStateFor(scenarioId)),
  },
  {
    id: "tool-call",
    title: "Tool call",
    maturity: "experimental",
    description: "Tool lifecycle status, output boundaries, and failure meaning.",
    scenarios: toolCallQualityScenarios.map((scenario) => ({ id: scenario.id, title: scenarioTitle(scenario.id), expectation: scenario.expectation })),
  },
  {
    id: "agent-progress",
    title: "Agent progress",
    maturity: "experimental",
    description: "Long-running task progress, step history, cancellation and recovery states.",
    scenarios: agentProgressQualityScenarios.map((scenario) => ({ id: scenario.id, title: scenarioTitle(scenario.id), expectation: scenario.expectation })),
  },
  {
    id: "tool-approval",
    title: "Tool approval",
    maturity: "experimental",
    description: "Explicit review boundaries for consequential agent actions.",
    scenarios: toolApprovalQualityScenarios.map((scenario) => ({ id: scenario.id, title: scenarioTitle(scenario.id), expectation: scenario.expectation })),
  },
  {
    id: "research-agent",
    title: "Research agent",
    maturity: "experimental",
    description: "Flagship provider-neutral workflow covering the production states beyond a chat transcript.",
    scenarios: researchAgentQualityScenarios.map((scenario) => ({ id: scenario.id, title: scenarioTitle(scenario.id), expectation: scenario.expectation })),
  },
];

export const componentFixtureMap = Object.fromEntries(componentFixtureContracts.map((contract) => [contract.id, contract])) as Record<LabComponentId, LabComponentContract>;

export const componentFixtureIds = componentFixtureContracts.map((contract) => contract.id);

export function renderRegistryFixture(
  component: LabComponentId,
  scenario: string,
  context: { emit?(message: string): void } = {},
) {
  const emit = context.emit ?? (() => undefined);
  switch (component) {
    case "file":
      return fileExample.render(fileStateFor(scenario), { emit });
    case "message":
      return messageExample.render(messageStateFor(scenario), { emit });
    case "prompt-input":
      return promptInputExample.render(promptInputStateFor(scenario), { emit, setProp: () => undefined });
    case "tool-call":
      return <ToolCallFixture scenario={scenario as ToolCallFixtureId} />;
    case "agent-progress":
      return <AgentProgressFixture scenario={scenario as AgentProgressFixtureId} emit={emit} />;
    case "tool-approval":
      return <ToolApprovalFixture scenario={scenario as ToolApprovalFixtureId} emit={emit} />;
    case "research-agent":
      return <ResearchAgentFixture scenario={scenario as ResearchAgentFixtureId} emit={emit} />;
    case "conversation":
    default:
      return conversationExample.render(conversationStateFor(scenario), { emit });
  }
}
