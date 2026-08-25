# Workspaces and experiences

## Hierarchy

```text
Primitives → Components → Patterns → Blocks → Experiences/Workspaces
```

An experience is a use-case recipe. A workspace is its structural shell. They share a schema but remain separable so a research workflow can use different workspace arrangements.

## Initial experience categories

- General assistant conversation.
- Artifact-centered assistant.
- Research and source synthesis.
- Coding-agent workspace.
- App-builder workspace.
- Document assistant.
- Customer support assistant.
- Data-analysis workspace.
- Voice/multimodal assistant.

Names describe interaction architecture rather than copying ChatGPT, Claude, Perplexity, Bolt, Lovable, Cursor, or any other product's branding or trade dress.

## Workspace slots

Common slots include navigation/sidebar, header, conversation, composer, suggestions, sources, artifacts, tasks, files, editor, preview, terminal-output, status, and mobile navigation. Recipes declare required and optional slots, allowed placements, size constraints, and breakpoint transformations.

## Structural customization

Studio and code may move a panel among valid zones, resize within constraints, toggle optional slots, or select a variant. V1 does not expose arbitrary nested DOM dragging. Constraints preserve accessibility, responsive behavior, and production quality.

## Recipe contents

Each registry experience includes schema version, runtime capabilities, package/source dependencies, theme defaults, component/variant selection, layout tree, responsive rules, fixture scenarios, extension slots, and export metadata.

## Portability

Experience documents are serializable and validate without Studio. A developer can install, render, edit, and export them locally. Proprietary recipes may require a license to obtain, but their resulting customer application must not require Studio at runtime unless clearly sold as a hosted feature.

