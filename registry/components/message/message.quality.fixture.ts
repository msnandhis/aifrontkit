/** Deterministic scenario catalog consumed by quality tooling and the Component Lab. */
export const messageQualityScenarios = [
  { id: "default", expectation: "Completed assistant content has clear hierarchy and useful quiet actions." },
  { id: "streaming", expectation: "Partial content remains readable without token-level announcements." },
  { id: "interrupted", expectation: "Partial content is retained and interruption meaning is explicit." },
  { id: "failed", expectation: "The error and recovery action remain associated with the response." },
  { id: "long-content", expectation: "Prose, code, links, and identifiers cannot overflow the page." },
  { id: "user-role", expectation: "User content is distinct without overpowering the transcript." },
  { id: "system-role", expectation: "System context is explicit and visually subordinate." },
  { id: "without-slots", expectation: "Missing optional slots leave no empty rows or alignment gaps." },
  { id: "rtl", expectation: "Reading direction changes while semantic action meaning is preserved." }
] as const;
