---
title: Tool Call
description: Present normalized tool lifecycle, structured output, failure, and host-owned actions.
status: experimental
---

# Tool Call

Tool Call is editable visual source built on `ToolPrimitive`. It reads one
normalized tool call from the nearest runtime and presents its name, lifecycle,
output, and failure. It never executes or approves a tool.

## Preview

The playground renders the real source component and normalized runtime state.
Change the tool name, lifecycle, input, output, error, content, and action slots.
Generated code contains the exact values visible in the preview.

## Installation

```bash
pnpm add @aifrontkit/core @aifrontkit/react
npx aifrontkit add tool-call
```

```tsx
import { ToolCall } from "@/components/aifrontkit/tool-call";
```

## Usage

Tool Call requires `AIFrontKitProvider` because it resolves `toolCallId` from the
runtime:

```tsx
<AIFrontKitProvider runtime={runtime}>
  <ToolCall
    toolCallId="search-1"
    actions={<button type="button">Tool options</button>}
  />
</AIFrontKitProvider>
```

Replace default JSON output while retaining the normalized header and status:

```tsx
<ToolCall toolCallId="search-1">
  <SearchResults results={results} />
</ToolCall>
```

## Anatomy

| Part | Responsibility |
| --- | --- |
| Root | Named section bound to runtime tool state. |
| Header | Identity, lifecycle, and actions. |
| Icon | Decorative tool identity. |
| Name / Status | Normalized name and live status. |
| Content | Default output/error or custom children. |
| Actions | Host-owned, labelled controls. |

## Variants and states

Tool Call currently has one visual variant. Runtime status is `pending`,
`running`, `complete`, `failed`, or `cancelled`. Running exposes `aria-busy`.
Complete output is formatted as bounded JSON by default; failed state renders a
visible alert. Cancelled is a terminal neutral state, not an error.

## API reference

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `toolCallId` | `string` | Required | Runtime tool identity. |
| `className` | `string` | — | Root style extension. |
| `icon` | `ReactNode` | Built-in tool icon | Decorative icon override. |
| `actions` | `ReactNode` | — | Host-owned tool controls. |
| `children` | `ReactNode` | Output and error primitives | Replaces content rendering. |

If the runtime has no matching ID, the primitive renders nothing. Stable source
selectors include `data-slot="tool-call"`, `tool-call-header`,
`tool-call-actions`, and `tool-call-content`. The primitive exposes
`data-aifk-tool` and `data-status`.

## Styling and motion

Keep lifecycle secondary to the tool name and result. Bound `pre` output so long
values scroll inside the component rather than the page. Running feedback should
be restrained and must respect reduced motion.

## Accessibility

Root is a section labelled from the tool name. Status uses a status role; failure
uses an alert. Do not expose raw internal exceptions or rely on color alone.
Actions remain in source order with visible focus and descriptive names.

## Responsive behavior

Allow the header to wrap without separating status from identity. Keep output
inspectable at 375px and prevent unbroken JSON values from creating page-level
overflow. Workspace layouts may expand output, but should preserve a readable
header hierarchy.

## Errors and recovery

Tool Call presents normalized failure but does not retry, cancel, or approve.
Place explicit host actions in `actions`. Consequential approval belongs in a
separate confirmation pattern, never an implicit running state.

## Testing

Cover all five statuses, a missing ID, structured and empty output, long values,
custom children, labelled actions, keyboard order, narrow widths, dark mode,
failure announcements, and reduced motion.

## Compatibility

Registry version `0.3.0`; React `>=18.3 <20`; UI contract schema major `1`;
`@aifrontkit/react >=0.1.0 <1`. No platform runtime is required.
