# AIFrontKit

Frontend infrastructure and source-owned React components for production AI interfaces.

[![npm prerelease](https://img.shields.io/npm/v/aifrontkit/next?label=npm%20next)](https://www.npmjs.com/package/aifrontkit)
[![CI](https://github.com/msnandhis/aifrontkit/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/msnandhis/aifrontkit/actions/workflows/ci.yml)
[![Apache-2.0 license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

AIFrontKit helps teams build React chat interfaces and long-running agent experiences without coupling the frontend to one model provider or hosted runtime. It combines a framework-neutral event model, an external-store-compatible browser runtime, accessible React behavior primitives, optional protocol adapters and editable UI source.

The project covers interaction states that simple chat component libraries often leave to the application: streaming content, tool calls, human approval, agent task progress, attachments, artifacts, interruption, retry, offline transitions and resumable checkpoints.

> AIFrontKit is public prerelease software. Pin exact versions and review the [compatibility policy](./content/docs/reference/compatibility.md) before production adoption.

## Why AIFrontKit

AI applications usually need three different layers:

1. A transport that receives backend events and sends user commands.
2. Deterministic frontend state for messages, tools, approvals, tasks, artifacts, attachments, connection status and checkpoints.
3. Accessible UI that a product team can style, inspect and own.

AIFrontKit keeps those layers separate:

```text
AI SDK, AG-UI, LangGraph or custom transport
                    ↓
          @aifrontkit/adapters
                    ↓
            @aifrontkit/core
                    ↓
           @aifrontkit/react
                    ↓
        source-installed UI registry
```

This boundary lets an application change its backend integration without rewriting the UI. It also lets a design team edit component source without forking runtime behavior.

## What ships

AIFrontKit has four maintained public packages:

| Package | Install | Responsibility |
| --- | --- | --- |
| [`aifrontkit`](https://www.npmjs.com/package/aifrontkit) | `npm install --save-dev aifrontkit` | CLI for registry discovery, source installation, diffs, migrations and provenance |
| [`@aifrontkit/core`](https://www.npmjs.com/package/@aifrontkit/core) | `npm install @aifrontkit/core` | Framework-neutral models, events, commands, schemas, runtime and deterministic test helpers |
| [`@aifrontkit/react`](https://www.npmjs.com/package/@aifrontkit/react) | `npm install @aifrontkit/react` | React provider, hooks, headless primitives, semantic themes and generated CSS variables |
| [`@aifrontkit/adapters`](https://www.npmjs.com/package/@aifrontkit/adapters) | `npm install @aifrontkit/adapters` | Optional AI SDK, AG-UI, LangGraph and external-store adapters |

Visual components are installed as editable source. They are not hidden inside a package and they do not make runtime requests to an AIFrontKit service.

## Install

For a React application using the canonical runtime:

```bash
npm install @aifrontkit/core @aifrontkit/react
npx aifrontkit init
npx aifrontkit add conversation
```

Add adapters only when the backend emits a supported upstream format:

```bash
npm install @aifrontkit/adapters
```

Use the `next` tag while AIFrontKit is prerelease:

```bash
npm install @aifrontkit/core@next @aifrontkit/react@next
```

Requirements:

- Node.js 22 or newer for the CLI and development tooling
- React 18.3 or React 19 for `@aifrontkit/react`
- An ESM-based application build

## Quick start

Create one runtime per thread. It accepts normalized AIFrontKit events and exposes an external-store interface with `getState`, `dispatch` and `subscribe`.

```ts
import { createRuntime } from "@aifrontkit/core/runtime";

export const runtime = createRuntime("thread-1");

runtime.dispatch({
  schemaVersion: 4,
  id: "event-1",
  threadId: "thread-1",
  timestamp: Date.now(),
  type: "message.started",
  messageId: "assistant-1",
  role: "assistant"
});
```

Provide the runtime to React behavior primitives and source-installed components:

```tsx
import { AIFrontKitProvider } from "@aifrontkit/react";
import { Conversation } from "@/components/aifrontkit/conversation";
import { runtime } from "./runtime";

export function Assistant() {
  return (
    <AIFrontKitProvider
      runtime={runtime}
      theme={{
        mode: "light",
        temperature: "neutral",
        density: "comfortable",
        radius: "medium",
        motion: { level: "subtle" }
      }}
    >
      <Conversation onSubmit={(input) => sendMessage(input)} />
    </AIFrontKitProvider>
  );
}
```

The application still owns `sendMessage`, authentication, authorization, persistence, provider credentials and tool execution.

## Choose an integration

Use the smallest adapter that matches the backend:

| Backend output | Import |
| --- | --- |
| Custom HTTP, WebSocket or event transport | Emit the canonical `AIFrontEvent` contract directly |
| Vercel AI SDK UI stream parts | `@aifrontkit/adapters/ai-sdk` |
| AG-UI protocol events | `@aifrontkit/adapters/ag-ui` |
| LangGraph stream tuples and checkpoint snapshots | `@aifrontkit/adapters/langgraph` |
| An existing provider-owned store | `@aifrontkit/adapters/external-store` |

Example AI SDK adapter boundary:

```ts
import { createAISDKAdapter } from "@aifrontkit/adapters/ai-sdk";

const adapter = createAISDKAdapter({
  threadId: "thread-1",
  messageId: "assistant-1"
});

for (const event of adapter.adapt(streamPart)) {
  runtime.dispatch(event);
}
```

Adapters normalize reviewed external shapes. They do not call model providers, execute tools or become the source of backend truth.

## Components and patterns

The public registry currently includes the following component families:

- Conversation
- Message
- Prompt Input
- File
- Tool Call

It also includes production interaction patterns:

- Agent Progress
- Tool Approval
- Research Agent
- Artifact Review
- Attachment Composer
- Checkpoint Recovery

CSS Modules is the complete default registry flavor. Tailwind implementations are published only where parity checks exist. The CLI resolves the exact framework, styling flavor and item name instead of silently falling back to another implementation.

```bash
npx aifrontkit list
npx aifrontkit info agent-progress
npx aifrontkit add agent-progress
npx aifrontkit diff agent-progress
```

Installed files are recorded in `.aifrontkit/installed.json` with source and manifest digests. Locally edited files are protected unless replacement is explicitly requested.

## Production AI UX states

The canonical event model and React primitives cover:

- submitted, streaming, complete, interrupted and failed messages
- text, reasoning, source, file, tool, data and custom content parts
- tool input streaming, execution, approval, success, failure and cancellation
- queued, running, paused, awaiting-approval, complete, failed and cancelled tasks
- connected, reconnecting, offline and failed connection states
- attachment upload progress, retry, pause, recovery and cancellation
- versioned artifacts with accept, reject and request-changes actions
- checkpoint history, compatibility decisions and explicit restore intent

These are frontend contracts. AIFrontKit does not claim backend durability, provider delivery guarantees or authorization on behalf of the host application.

## Architecture boundaries

The dependency direction is enforced in CI:

- `@aifrontkit/core` has no React or DOM dependency.
- `@aifrontkit/adapters` imports core contracts but not React.
- `@aifrontkit/react` supplies behavior and theme contracts without importing registry source.
- Registry components can use public package exports but packages cannot import registry files.
- The open-source repository does not import private platform or commercial packages.

Public JSON schemas are exported for versioned events and commands. Older supported event generations migrate at the runtime boundary so state reduction uses one current model.

See [architecture](./docs/architecture.md), [component quality](./docs/quality/README.md) and [versioning](./docs/versioning.md).

## Accessibility and visual quality

AIFrontKit treats accessibility and degraded states as component requirements. The checked-in browser suite covers keyboard interaction, focus restoration, touch target sizing, right-to-left layout, narrow viewports, reduced motion, light and dark themes and automated accessibility scans.

Component manifests define required scenarios and evidence. CSS Modules and available Tailwind implementations are checked for behavioral and visual parity before release.

## Registry discovery and MCP

The CLI provides stable JSON output for local automation and agent-readable discovery:

```bash
npx aifrontkit list --json
npx aifrontkit info tool-approval --json
```

The `aifrontkit/mcp` export exposes read-only registry discovery for MCP hosts. Discovery does not execute registry source. Registry manifests and installed files carry provenance data for reviewable updates.

## Framework compatibility

The repository contains pinned consumer fixtures for:

- React with Vite
- React Router
- Next.js App Router
- Next.js Pages Router
- Astro with a React island

Provider compatibility fixtures cover maintained AI SDK, AG-UI and LangGraph release lines. The compatibility workflow reports drift before upstream changes are adopted.

See the [framework guides](./content/docs/start/frameworks-and-imports.md) and [compatibility reference](./content/docs/reference/compatibility.md).

## Repository map

```text
packages/
  core/               canonical models, events, commands, runtime and schemas
  react/              providers, hooks, primitives, themes and CSS variables
  adapters/           AI SDK, AG-UI, LangGraph and external-store boundaries
  cli/                source installer, discovery, provenance and diffs
registry/
  react/css/          CSS Modules components and patterns
  react/tailwind/     parity-verified Tailwind source
  themes/             installable theme source
contracts/ui/         framework-neutral component contracts
compatibility/        provider and framework fixtures
apps/playground/      routed documentation and typed playgrounds
apps/lab/             internal component quality workbench
```

## Development

This repository uses pnpm workspaces and Turborepo.

```bash
git clone https://github.com/msnandhis/aifrontkit.git
cd aifrontkit
pnpm install
pnpm check
pnpm quality:browser
pnpm docs:browser
```

`pnpm check` validates package boundaries, UI contracts, registry manifests, upstream compatibility fixtures, documentation, performance budgets, package tarballs, TypeScript and unit tests. Browser suites separately cover component behavior and the documentation playground.

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before changing public contracts or registry source.

## What AIFrontKit is not

AIFrontKit is not:

- an AI model SDK
- an agent execution runtime
- a proxy for provider credentials
- a hosted chat backend
- a persistence or authorization service
- a requirement to use one AI provider

It is the frontend interaction layer between application-owned AI infrastructure and application-owned UI.

## License

AIFrontKit is licensed under [Apache-2.0](./LICENSE). Registry media or third-party examples may carry separate notices.
