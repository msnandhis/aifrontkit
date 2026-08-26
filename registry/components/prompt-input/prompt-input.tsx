import React, { type ReactNode } from "react";
import { ComposerPrimitive } from "@aifrontkit/react/composer";
import "./prompt-input.css";

export interface PromptInputProps {
  onSubmit(value: string): void | Promise<void>;
  placeholder?: string;
  hint?: ReactNode;
  leading?: ReactNode;
  toolbarStart?: ReactNode;
  submitLabel?: string;
  showSubmitLabel?: boolean;
  submitErrorMessage?: string;
  className?: string;
}

export function PromptInput({ onSubmit, placeholder = "Ask a question", hint = "Enter to send", leading, toolbarStart, submitLabel = "Send message", showSubmitLabel = false, submitErrorMessage = "Message could not be sent. Try again.", className }: PromptInputProps) {
  return (
    <ComposerPrimitive.Root onSubmit={onSubmit} submitErrorMessage={submitErrorMessage} className={["aifk-prompt-input", className].filter(Boolean).join(" ")}>
      {leading ? <div className="aifk-prompt-input__leading">{leading}</div> : null}
      <label className="aifk-prompt-input__field">
        <span className="aifk-prompt-input__sr-only">Message</span>
        <ComposerPrimitive.Input placeholder={placeholder} rows={1} autoGrow submitOnEnter />
      </label>
      <div className="aifk-prompt-input__toolbar">
        <div className="aifk-prompt-input__toolbar-start">{toolbarStart}<span className="aifk-prompt-input__hint">{hint}</span></div>
        <ComposerPrimitive.Submit
          className="aifk-prompt-input__submit"
          aria-label={submitLabel}
          title={submitLabel}
          submittingLabel="Sending message"
          submittingChildren={<span className="aifk-prompt-input__spinner" aria-hidden="true" />}
        >
          {showSubmitLabel ? <span>{submitLabel}</span> : null}
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3m0 0L4.5 6.5M8 3l3.5 3.5" /></svg>
        </ComposerPrimitive.Submit>
      </div>
      <ComposerPrimitive.Error className="aifk-prompt-input__error" />
    </ComposerPrimitive.Root>
  );
}
