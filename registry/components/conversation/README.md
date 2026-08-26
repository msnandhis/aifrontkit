# Conversation

`Conversation` renders normalized runtime messages through the headless `ConversationPrimitive`. It follows output only while the reader remains near the bottom and exposes a scroll-to-latest action after the reader moves upward.

Use `embedded` for an existing page flow, `full-height` for a dedicated assistant surface, and `workspace` when the transcript sits beside artifacts or sources. Supply `renderMessage` to replace the default visual message without replacing transcript behavior.
