import React, { type ReactNode } from "react";
import { ComposerPrimitive } from "@aifrontkit/react/composer";
import "./prompt-input.css";

export interface PromptInputProps {
  onSubmit(value: string): void | Promise<void>;
  placeholder?: string;
  hint?: ReactNode;
  leading?: ReactNode;
  className?: string;
}

export function PromptInput({ onSubmit, placeholder = "Ask a question", hint = "Enter to send", leading, className }: PromptInputProps) {
  return (
    <ComposerPrimitive.Root onSubmit={onSubmit} className={["aifk-prompt-input", className].filter(Boolean).join(" ")}>
      {leading ? <div className="aifk-prompt-input__leading">{leading}</div> : null}
      <label className="aifk-prompt-input__field">
        <span className="aifk-prompt-input__sr-only">Message</span>
        <ComposerPrimitive.Input placeholder={placeholder} rows={2} />
      </label>
      <div className="aifk-prompt-input__toolbar">
        <span className="aifk-prompt-input__hint">{hint}</span>
        <ComposerPrimitive.Submit className="aifk-prompt-input__submit">
          <span>Send</span>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
        </ComposerPrimitive.Submit>
      </div>
    </ComposerPrimitive.Root>
  );
}
