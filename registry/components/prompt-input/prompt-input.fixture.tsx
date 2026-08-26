import { useEffect, useRef, useState } from "react";
import { PromptInput } from "./prompt-input.js";
import { promptInputQualityScenarios } from "./prompt-input.quality.fixture.js";

/** The prompt-input fixture renders the installable prompt-input component for each contract scenario. */
export { promptInputQualityScenarios };
export type PromptInputFixtureId = (typeof promptInputQualityScenarios)[number]["id"];

const initialValues: Partial<Record<PromptInputFixtureId, string>> = {
  "ready": "Review the release checklist",
  "multiline": "Review the release checklist\n\nInclude keyboard, responsive, and reduced-motion checks.",
};

export function PromptInputFixture({ scenario = "default" }: { scenario?: PromptInputFixtureId }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(0);
  const initialValue = initialValues[scenario];

  // PromptInput intentionally owns its field state. Seed only the deterministic review scenarios
  // through the same bubbling input event a user would produce, without adding a second input API.
  useEffect(() => {
    if (!initialValue) return;
    const input = rootRef.current?.querySelector("textarea");
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(input, initialValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, [initialValue]);

  async function submit() {
    if (scenario === "submitting") return new Promise<void>(() => undefined);
    if (scenario === "submit-rejected") throw new Error("Fixture rejection");
    setSubmitted((current) => current + 1);
  }

  const rtl = scenario === "rtl";
  const withContext = scenario === "with-leading-context";
  const withToolbar = scenario === "with-toolbar-controls";
  return (
    <div ref={rootRef} data-fixture-component="prompt-input" data-fixture-scenario={scenario} dir={rtl ? "rtl" : "ltr"}>
      <PromptInput
        onSubmit={submit}
        placeholder={withContext ? "Ask about these selected files…" : "Ask a question…"}
        hint={scenario === "multiline" ? "Shift+Enter for a new line" : "Enter to send"}
        submitErrorMessage="We could not send that message. Your draft is still here."
        showSubmitLabel={scenario === "with-toolbar-controls"}
        leading={withContext ? <span data-fixture-context>3 files selected · architecture review</span> : undefined}
        toolbarStart={withToolbar ? <><button type="button" aria-label="Add attachment">Attach</button><button type="button" aria-label="Choose model">Model</button></> : undefined}
      />
      <output data-fixture-submit-count aria-live="polite">{submitted ? `Submitted ${submitted}` : ""}</output>
    </div>
  );
}
