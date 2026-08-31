import type { PlaygroundEnvironment, PlaygroundRecord, PlaygroundState } from "../types.js";
import { definePlayground, environmentControlsFor, environmentDefaults } from "../types.js";
import {
  ToolApprovalFixture,
  type ToolApprovalFixtureId,
} from "../../../../../registry/react/css/patterns/tool-approval/tool-approval.fixture.js";

interface ToolApprovalProps extends PlaygroundRecord {
  scenario: ToolApprovalFixtureId;
}

const version = "1.0.0";
const defaults: PlaygroundState<ToolApprovalProps, PlaygroundEnvironment> = {
  props: { scenario: "requested" },
  environment: { ...environmentDefaults },
};

export const toolApprovalPlayground = definePlayground<ToolApprovalProps>({
  id: "tool-approval",
  version,
  label: "Tool approval",
  description: "Inspect requested, resolved and expired boundaries for consequential tool work.",
  defaults,
  scenarios: [
    { id: "requested", version, label: "Requested", description: "A live approval with equally reachable reject and approve actions.", values: {}, testId: "tool-approval-requested" },
    { id: "approved", version, label: "Approved", description: "The confirmed decision prevents a duplicate action.", values: { props: { scenario: "approved" } }, testId: "tool-approval-approved" },
    { id: "rejected", version, label: "Rejected", description: "A rejected request remains explicit and immutable.", values: { props: { scenario: "rejected" } }, testId: "tool-approval-rejected" },
    { id: "expired", version, label: "Expired", description: "A stale request disables invalid actions.", values: { props: { scenario: "expired" } }, testId: "tool-approval-expired" },
  ],
  controls: [...environmentControlsFor(defaults)],
  render: (state, context) => <ToolApprovalFixture scenario={state.props.scenario} emit={context.emit} />,
  generateCode: (state) => [
    'import { ToolApproval } from "@/components/aifrontkit/tool-approval";',
    "",
    "export function PublishApproval({ approval, approve, reject }) {",
    `  // Preview state: ${state.props.scenario}`,
    "  return (",
    "    <ToolApproval",
    "      approval={approval}",
    '      target="registry.aifrontkit.dev"',
    "      reversible={false}",
    "      onApprove={approve}",
    "      onReject={reject}",
    "    />",
    "  );",
    "}",
  ].join("\n"),
});
