/** Deterministic scenario catalog consumed by quality tooling and the Component Lab. */
export const promptInputQualityScenarios = [
  { id: "default", expectation: "The field remains labeled and empty submission is unavailable." },
  { id: "ready", expectation: "A meaningful prompt exposes one clear primary action." },
  { id: "multiline", expectation: "Long input grows within a bounded field without hiding controls." },
  { id: "submitting", expectation: "Pending feedback is clear and duplicate submission is prevented." },
  { id: "submit-rejected", expectation: "The control recovers and the user's input path remains operable." },
  { id: "with-leading-context", expectation: "Optional context wraps without displacing the field label." },
  { id: "with-toolbar-controls", expectation: "Secondary controls remain subordinate, labeled, and touch-safe." },
  { id: "rtl", expectation: "Bidirectional input preserves toolbar order and semantic icon meaning." }
] as const;
