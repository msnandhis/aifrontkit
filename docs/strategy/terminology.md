# Terminology

Use these terms consistently in code, docs, product copy, and Studio.

| Term | Meaning |
| --- | --- |
| **Core** | Framework-neutral schemas, state machine, commands, and runtime contracts. |
| **Runtime** | Browser-side state and actions for messages, streams, tools, artifacts, approvals, tasks, errors, and attachments. It does not execute AI. |
| **Transport** | Interface that sends commands and receives raw events from a customer endpoint. |
| **Adapter** | Translator between an external protocol/API and AIFrontKit's normalized events or transport contract. |
| **Content part** | Typed unit within a message or artifact: text, image, audio, video, file, code, citation, tool, or structured UI data. |
| **Primitive** | Headless accessible behavior with minimal presentation. |
| **Component** | Production-ready visual UI, commonly installed as source and backed by primitives/runtime. |
| **Variant** | Curated structural or behavioral mode for a component; not an arbitrary style string. |
| **Pattern** | Reusable multi-component interaction flow such as approval, retry, or progressive research. |
| **Block** | Larger composable section such as a conversation column, source panel, or artifact workspace. |
| **Experience** | End-to-end product recipe for a use case such as research or customer support. |
| **Workspace** | Responsive application shell arranging conversation, navigation, artifacts, sources, files, preview, or task panels. |
| **Artifact** | Persistent, inspectable output separate from the conversational transcript. |
| **Theme** | Semantic design-token set applicable globally, to a subtree, or to one component. |
| **Registry** | Manifest-driven catalog and delivery mechanism for source, packages, themes, patterns, blocks, and experiences. |
| **Playground** | Isolated interactive environment for capability states, variants, themes, and examples. |
| **Studio** | Commercial visual editor for schema-backed themes, components, patterns, and workspaces, with portable export. |
| **Entitlement** | Server-evaluated permission derived from plan, purchase, organization, license, and policy. |
| **License** | Legal/commercial grant and its verifiable record; not interchangeable with an entitlement. |
| **Pro content** | Proprietary registry assets or Studio capabilities distributed under commercial terms. |

Avoid **harness** in public naming because it implies backend execution. Use **client runtime** or **interaction runtime**.

