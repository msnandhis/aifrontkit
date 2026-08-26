import { PromptInput } from "../../../../../registry/react/css/components/prompt-input/prompt-input.js";
import { definePlayground, type PlaygroundState } from "../types.js";
import { directionOptions, q } from "./shared.js";

interface PromptInputState extends PlaygroundState {
  placeholder: string;
  hint: string;
  submitLabel: string;
  submitErrorMessage: string;
  showSubmitLabel: boolean;
  showLeading: boolean;
  leadingText: string;
  showToolbar: boolean;
  direction: "ltr" | "rtl";
}

const defaults: PromptInputState = {
  placeholder: "Ask a question…",
  hint: "Enter to send",
  submitLabel: "Send message",
  submitErrorMessage: "Message could not be sent. Try again.",
  showSubmitLabel: false,
  showLeading: false,
  leadingText: "3 files selected · architecture review",
  showToolbar: true,
  direction: "ltr",
};

function preview(state: PromptInputState, emit: (message: string) => void) {
  return (
    <PromptInput
      onSubmit={(value) => emit("onSubmit(" + q(value) + ")")}
      placeholder={state.placeholder}
      hint={state.hint}
      submitLabel={state.submitLabel}
      submitErrorMessage={state.submitErrorMessage}
      showSubmitLabel={state.showSubmitLabel}
      leading={state.showLeading ? <span>{state.leadingText}</span> : undefined}
      toolbarStart={state.showToolbar ? <><button type="button" onClick={() => emit('onAttachmentOpen()')}>Attach</button><button type="button" onClick={() => emit('onModelOpen()')}>Model</button></> : undefined}
    />
  );
}

function codeFor(state: PromptInputState) {
  const props = [
    "    onSubmit={sendMessage}",
    "    placeholder=" + q(state.placeholder),
    "    hint=" + q(state.hint),
    "    submitLabel=" + q(state.submitLabel),
    "    submitErrorMessage=" + q(state.submitErrorMessage),
    state.showSubmitLabel ? "    showSubmitLabel" : "",
    state.showLeading ? "    leading={<span>{" + q(state.leadingText) + "}</span>}" : "",
    state.showToolbar ? '    toolbarStart={<><button type="button">Attach</button><button type="button">Model</button></>}' : "",
  ].filter(Boolean);
  return [
    '\"use client\";',
    "",
    'import { PromptInput } from "@/components/aifrontkit/prompt-input";',
    "",
    "export function PromptInputExample() {",
    "  async function sendMessage(value: string) {",
    '    console.log("submit", value);',
    "  }",
    "",
    "  return (",
    "  <div dir=" + q(state.direction) + ">",
    "  <PromptInput",
    ...props,
    "  />",
    "  </div>",
    "  );",
    "}",
  ].join("\n");
}

export const promptInputPlayground = definePlayground({
  id: "prompt-input",
  label: "Prompt Input",
  description: "Configure composer guidance, submit presentation, context, toolbar slots, and reading direction.",
  defaults,
  presets: [
    { id: "default", label: "Default", description: "A labeled composer with secondary toolbar actions.", values: {} },
    { id: "minimal", label: "Minimal", description: "Only the field, hint, and icon submit action.", values: { showToolbar: false } },
    { id: "with-context", label: "With context", description: "Selected context appears above the field.", values: { showLeading: true } },
    { id: "labeled-submit", label: "Labeled submit", description: "The primary action includes visible text.", values: { showSubmitLabel: true } },
    { id: "rtl", label: "RTL", description: "Bidirectional input preserves semantic action order.", values: { direction: "rtl", placeholder: "اكتب سؤالك…", hint: "اضغط Enter للإرسال" } },
  ],
  controls: [
    { key: "placeholder", label: "Placeholder", type: "text", group: "Content" },
    { key: "hint", label: "Keyboard hint", type: "text", group: "Content" },
    { key: "submitLabel", label: "Accessible submit label", type: "text", group: "Content" },
    { key: "submitErrorMessage", label: "Submission error", type: "textarea", group: "Content" },
    { key: "leadingText", label: "Context text", type: "text", group: "Content", visible: (state) => state.showLeading },
    { key: "showSubmitLabel", label: "Visible submit label", type: "boolean", group: "Appearance" },
    { key: "showLeading", label: "Leading context", type: "boolean", group: "Slots" },
    { key: "showToolbar", label: "Toolbar actions", type: "boolean", group: "Slots" },
    { key: "direction", label: "Reading direction", type: "select", group: "Advanced", options: directionOptions },
  ],
  render: (state, context) => preview(state, context.emit),
  generateCode: codeFor,
});
