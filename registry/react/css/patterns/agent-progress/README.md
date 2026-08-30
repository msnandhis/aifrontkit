# Agent progress

`AgentProgress` renders observable long-running work from the framework-neutral task model. It supports controlled task data or a runtime `taskId`.

The pattern does not infer private chain-of-thought, execute tools or own persistence. Applications connect `onStop` and `onResume` to their own command transport.
