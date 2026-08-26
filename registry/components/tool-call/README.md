# Tool call

`ToolCall` presents normalized tool lifecycle and output state from `@aifrontkit/react/tool`. It does not execute tools and does not contact the AIFrontKit platform.

The source component provides quiet status hierarchy, bounded output, failure emphasis, an optional icon, and an actions slot. Applications can replace the content while retaining the primitive's name, status, and busy semantics.

Tool output must remain inspectable, keyboard reachable, and safe for long or unbroken values. Consequential actions belong in an explicit approval pattern rather than inside an implicit running state.
