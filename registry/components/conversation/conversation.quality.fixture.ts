/** Deterministic scenario catalog consumed by quality tooling and the Component Lab. */
export const conversationQualityScenarios = [
  { id: "default", expectation: "Completed turns have one clear reading order and quiet actions." },
  { id: "empty", expectation: "First-use guidance identifies the next action without decorative chrome." },
  { id: "streaming", expectation: "Partial output stays readable and status is announced once per event." },
  { id: "interrupted", expectation: "Partial output remains available and the interruption is explicit." },
  { id: "failed", expectation: "Error and recovery remain attached to the affected response." },
  { id: "long-content", expectation: "Prose, code, URLs, and unbroken strings stay within the component." },
  { id: "mixed-roles", expectation: "System, user, and assistant content retain distinct emphasis." },
  { id: "rtl", expectation: "Reading direction changes without reversing semantic icon meaning." },
  { id: "localization", expectation: "Long labels wrap without hiding actions or status." }
] as const;
