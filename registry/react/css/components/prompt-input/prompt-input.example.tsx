import { useEffect, useState, type ReactNode } from "react";
import {
  definePlaygroundDefinition,
  type PlaygroundEnvironment,
  type PlaygroundRecord,
  type PlaygroundState,
} from "@aifrontkit/testing";
import { exampleEnvironmentControlsFor, exampleEnvironmentDefaults, quote } from "../../examples/shared.js";
import { PromptInput } from "./prompt-input.js";

/** Serializable controls shared by the docs playground and the Component Lab. */
export interface PromptInputExampleProps extends PlaygroundRecord {
  /** Controlled draft value shown in the preview and copied example. */
  value: string;
  label: string;
  labelDisplay: "visible" | "sr-only";
  placeholder: string;
  hint: string;
  submitLabel: string;
  submitErrorMessage: string;
  showSubmitLabel: boolean;
  showLeading: boolean;
  leadingText: string;
  showToolbar: boolean;
  /** Host callback behavior used to exercise resolve, pending, and rejection. */
  submission: "resolve" | "pending" | "reject";
}

export type PromptInputExampleState = PlaygroundState<PromptInputExampleProps, PlaygroundEnvironment>;

export interface PromptInputExampleRenderContext {
  emit(message: string): void;
  setProp(key: Extract<keyof PromptInputExampleProps, string>, value: PromptInputExampleProps[Extract<keyof PromptInputExampleProps, string>]): void;
}

const defaults: PromptInputExampleState = {
  props: {
    value: "",
    label: "Message",
    labelDisplay: "sr-only",
    placeholder: "Ask a question…",
    hint: "Enter to send",
    submitLabel: "Send message",
    submitErrorMessage: "Message could not be sent. Try again.",
    showSubmitLabel: false,
    showLeading: false,
    leadingText: "3 files selected · architecture review",
    showToolbar: true,
    submission: "resolve",
  },
  environment: { ...exampleEnvironmentDefaults },
};

function PromptInputExamplePreview({ state, emit, setProp }: PromptInputExampleRenderContext & { state: PromptInputExampleState }) {
  const props = state.props;
  const [value, setValue] = useState(props.value);

  // A control or scenario replaces the starting draft. Keystrokes remain local
  // to this preview so the playground can inspect the same controlled contract
  // a copied example uses without mutating the URL-backed playground state.
  useEffect(() => setValue(props.value), [props.value]);

  async function submit(nextValue: string) {
    emit(`onSubmit(${quote(nextValue)})`);
    if (props.submission === "pending") return new Promise<void>(() => undefined);
    if (props.submission === "reject") throw new Error("Fixture rejection");
  }

  function changeValue(nextValue: string) {
    setValue(nextValue);
    setProp("value", nextValue);
  }

  return (
    <PromptInput
      value={value}
      onValueChange={changeValue}
      onSubmit={submit}
      label={props.label}
      labelDisplay={props.labelDisplay}
      placeholder={props.placeholder}
      hint={props.hint}
      submitLabel={props.submitLabel}
      submitErrorMessage={props.submitErrorMessage}
      showSubmitLabel={props.showSubmitLabel}
      leading={props.showLeading ? <span data-example-leading>{props.leadingText}</span> : undefined}
      toolbarStart={props.showToolbar ? <>
        <button type="button" onClick={() => emit("onAttachmentOpen()")}>Attach</button>
        <button type="button" onClick={() => emit("onModelOpen()")}>Model</button>
      </> : undefined}
    />
  );
}

function generatePromptInputCode(state: PromptInputExampleState): string {
  const props = state.props;
  const environment = state.environment;
  const typed = environment.language === "tsx";
  const valueType = typed ? ": string" : "";
  const callbackType = typed ? ": () => void" : "";
  const componentProps = [
    "        value={value}",
    "        onValueChange={setValue}",
    "        onSubmit={sendMessage}",
    "        label=" + quote(props.label),
    "        labelDisplay=" + quote(props.labelDisplay),
    "        placeholder=" + quote(props.placeholder),
    "        hint=" + quote(props.hint),
    "        submitLabel=" + quote(props.submitLabel),
    "        submitErrorMessage=" + quote(props.submitErrorMessage),
    props.showSubmitLabel ? "        showSubmitLabel" : "        showSubmitLabel={false}",
    props.showLeading ? "        leading={<span>" + quote(props.leadingText) + "</span>}" : "",
    props.showToolbar ? "        toolbarStart={<><button type=\"button\" onClick={onAttachmentOpen}>Attach</button><button type=\"button\" onClick={onModelOpen}>Model</button></>}" : "",
  ].filter(Boolean);
  const submitBehavior = props.submission === "pending"
    ? [typed ? "    await new Promise<void>(() => undefined);" : "    await new Promise(() => undefined);"]
    : props.submission === "reject"
      ? ["    throw new Error(" + quote("Fixture rejection") + ");"]
      : ["    console.log(" + quote("submitted") + ", value);"];

  return [
    '"use client";',
    "",
    "// AIFrontKit example · " + environment.framework + " · " + environment.style + " · " + environment.language,
    typed ? 'import { useState } from "react";' : 'import { useState } from "react";',
    'import { PromptInput } from "@/components/aifrontkit/prompt-input";',
    "",
    "export function PromptInputExample() {",
    "  const [value, setValue] = " + (typed ? "useState<string>" : "useState") + "(" + quote(props.value) + ");",
    "",
    "  async function sendMessage(value" + valueType + ") {",
    ...submitBehavior,
    "  }",
    "",
    "  const onAttachmentOpen" + callbackType + " = () => console.log(" + quote("attachment") + ");",
    "  const onModelOpen" + callbackType + " = () => console.log(" + quote("model") + ");",
    "",
    "  return (",
    "    <div dir=" + quote(environment.direction) + " data-aifk-theme=" + quote(environment.theme) + " data-aifk-motion=" + quote(environment.motion) + ">",
    "      <PromptInput",
    ...componentProps,
    "      />",
    "    </div>",
    "  );",
    "}",
  ].filter((line, index, array) => line !== "" || array[index - 1] !== "").join("\n");
}

const version = "1.0.0";

export const promptInputExample = definePlaygroundDefinition<"prompt-input", PromptInputExampleProps, PlaygroundEnvironment, ReactNode, PromptInputExampleRenderContext>({
  id: "prompt-input",
  version,
  label: "Prompt Input",
  description: "Configure the controlled draft, submission lifecycle, field guidance, context, toolbar slots, and reading direction.",
  defaults,
  scenarios: [
    { id: "default", version, label: "Default", description: "An empty, labeled composer with a disabled submit action.", values: {}, testId: "prompt-input-default" },
    { id: "ready", version, label: "Ready", description: "A meaningful controlled draft exposes one clear primary action.", values: { props: { value: "Review the release checklist" } }, testId: "prompt-input-ready" },
    { id: "multiline", version, label: "Multiline", description: "Long input grows within a bounded field and preserves the draft.", values: { props: { value: "Review the release checklist\n\nInclude keyboard, responsive, and reduced-motion checks.", hint: "Shift+Enter for a new line" } }, testId: "prompt-input-multiline" },
    { id: "submitting", version, label: "Submitting", description: "Pending feedback is clear and duplicate submission is prevented.", values: { props: { value: "Keep this draft pending", submission: "pending" } }, testId: "prompt-input-submitting" },
    { id: "submit-rejected", version, label: "Submit rejected", description: "Rejected submission retains the controlled draft and recovery message.", values: { props: { value: "Keep this draft", submission: "reject" } }, testId: "prompt-input-submit-rejected" },
    { id: "with-leading-context", version, label: "With leading context", description: "Selected context wraps above the field without displacing its label.", values: { props: { value: "Summarize these files", showLeading: true } }, testId: "prompt-input-with-leading-context" },
    { id: "with-toolbar-controls", version, label: "With toolbar controls", description: "Secondary controls remain subordinate, labeled, and touch-safe.", values: { props: { value: "Use the selected model", showSubmitLabel: true, showToolbar: true } }, testId: "prompt-input-with-toolbar-controls" },
    { id: "rtl", version, label: "RTL", description: "Bidirectional input preserves toolbar order and semantic action meaning.", values: { props: { value: "راجع قائمة الإصدار", placeholder: "اكتب سؤالك…", hint: "اضغط Enter للإرسال" }, environment: { direction: "rtl" } }, testId: "prompt-input-rtl" },
  ],
  controls: [
    { scope: "props", key: "value", label: "Controlled draft", description: "Starting value for the controlled field.", type: "textarea", group: "Content" },
    { scope: "props", key: "label", label: "Accessible label", type: "text", group: "Content" },
    { scope: "props", key: "labelDisplay", label: "Label presentation", type: "segmented", group: "Appearance", options: [{ label: "Screen reader only", value: "sr-only" }, { label: "Visible", value: "visible" }] },
    { scope: "props", key: "placeholder", label: "Placeholder", description: "A hint, not the accessible label.", type: "text", group: "Content" },
    { scope: "props", key: "hint", label: "Keyboard hint", type: "text", group: "Content" },
    { scope: "props", key: "submitLabel", label: "Accessible submit label", type: "text", group: "Content" },
    { scope: "props", key: "submitErrorMessage", label: "Submission error", type: "textarea", group: "Content" },
    { scope: "props", key: "submission", label: "Submit behavior", type: "segmented", group: "Behavior", options: [{ label: "Resolve", value: "resolve" }, { label: "Pending", value: "pending" }, { label: "Reject", value: "reject" }] },
    { scope: "props", key: "showSubmitLabel", label: "Visible submit label", type: "boolean", group: "Appearance" },
    { scope: "props", key: "showLeading", label: "Leading context", type: "boolean", group: "Slots" },
    { scope: "props", key: "leadingText", label: "Context text", type: "text", group: "Content", visible: (state) => state.props.showLeading },
    { scope: "props", key: "showToolbar", label: "Toolbar actions", type: "boolean", group: "Slots" },
    ...exampleEnvironmentControlsFor(defaults),
  ],
  render: (state, context) => <PromptInputExamplePreview state={state} emit={context.emit} setProp={context.setProp} />,
  generateCode: generatePromptInputCode,
});
