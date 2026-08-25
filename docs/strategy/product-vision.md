# Product vision

## Positioning

**AIFrontKit is the frontend system for production AI applications.**

It helps product teams build ChatGPT-style conversation, Claude-style artifact workspaces, research interfaces, coding agents, app builders, voice experiences, and other multimodal AI products without rebuilding the same interaction layer each time.

The product owns what users see, understand, configure, and interact with. The customer's backend owns model access and execution. AIFrontKit is intentionally broader than chat components while remaining strictly frontend infrastructure.

```text
Customer backend or agent
        │ any transport or adapter
        ▼
AIFrontKit event model and browser runtime
        ▼
Components, patterns, artifacts, and workspaces
        ▼
User
```

## Value proposition

Teams repeatedly implement streaming, interruption, retries, reasoning display, tools, approvals, sources, attachments, artifact panes, task progress, responsive layouts, accessibility, and theming. AIFrontKit turns those recurring problems into interoperable runtime capabilities, composable UI, installable source, and complete experience recipes.

Its value is not the number of JSX files. It is the combination of polished neutral defaults, explicit behavior contracts, production edge-case decisions, designed variants, complete interaction patterns, and source ownership.

## Product layers

1. **Schemas and client runtime** normalize backend events and manage browser-side interaction state.
2. **Primitives and components** expose accessible behavior and production-ready visuals.
3. **Patterns and blocks** encode reusable AI interaction flows.
4. **Experiences and workspaces** compose complete application shells without copying another product's visual identity.
5. **Registry and CLI** distribute packages, source-owned UI, themes, and recipes.
6. **Studio** visually edits the same schemas and exports portable configuration or code.

## Intended users

- Frontend developers adding AI capabilities to an existing application.
- Product teams building a new AI-native interface.
- Design-system teams standardizing AI interaction patterns.
- Agencies and consultants delivering branded AI applications.
- SaaS, low-code, and builder products operating under an appropriate OEM license.

## Product boundaries

AIFrontKit includes browser state, UI events, transport interfaces, renderers, client-side adapters, persistence callbacks, upload lifecycle UI, and authentication context inputs.

AIFrontKit does **not** provide model routing, inference, prompt management, agents, tool execution, RAG, vector databases, server authentication for customer apps, data persistence, rate limiting, or general observability. Examples may demonstrate how a customer endpoint connects, but examples do not become an AI backend product.

## Success principles

- Useful at the component level and coherent at the complete-workspace level.
- Polished neutral defaults with progressive control over themes, density, variants, composition, and motion.
- Accessibility and essential production behavior belong to Community, never only to Pro.
- Backend-independent and ultimately frontend-framework-independent.
- Multimodal and artifact-native, not chat-bubble-centric.
- One schema foundation shared by code, registry content, previews, and Studio.
- Understandable by developers and coding agents through structured manifests, fixtures, and agent-readable documentation.
