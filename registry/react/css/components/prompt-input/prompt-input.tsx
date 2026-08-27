"use client";

import React, { type ReactNode } from "react";
import { ComposerPrimitive } from "@aifrontkit/react/composer";
import styles from "./prompt-input.module.css";

function slot(name: string, ...values: Array<string | undefined>) {
  return [styles[name], name, ...values].filter(Boolean).join(" ");
}

export interface PromptInputProps {
  onSubmit(value: string): void | Promise<void>;
  /** Controlled draft value. Pair with `onValueChange` when the host owns the field state. */
  value?: string;
  /** Initial draft for an uncontrolled composer. */
  defaultValue?: string;
  /** Receives every draft change when the host owns or observes the field state. */
  onValueChange?(value: string): void;
  label?: ReactNode;
  labelDisplay?: "visible" | "sr-only";
  placeholder?: string;
  hint?: ReactNode;
  leading?: ReactNode;
  toolbarStart?: ReactNode;
  submitLabel?: string;
  showSubmitLabel?: boolean;
  submitErrorMessage?: string;
  className?: string;
}

export function PromptInput({ onSubmit, value, defaultValue, onValueChange, label = "Message", labelDisplay = "sr-only", placeholder = "Ask a question", hint = "Enter to send", leading, toolbarStart, submitLabel = "Send message", showSubmitLabel = false, submitErrorMessage = "Message could not be sent. Try again.", className }: PromptInputProps) {
  return (
    <ComposerPrimitive.Root
      onSubmit={onSubmit}
      {...(value === undefined ? {} : { value })}
      {...(defaultValue === undefined ? {} : { defaultValue })}
      {...(onValueChange === undefined ? {} : { onValueChange })}
      submitErrorMessage={submitErrorMessage}
      className={slot("aifk-prompt-input", className)}
      data-slot="prompt-input"
    >
      {leading ? <div className={slot("aifk-prompt-input__leading")} data-slot="prompt-input-leading">{leading}</div> : null}
      <label className={slot("aifk-prompt-input__field")} data-slot="prompt-input-field">
        <span className={slot(labelDisplay === "visible" ? "aifk-prompt-input__label" : "aifk-prompt-input__sr-only")}>{label}</span>
        <ComposerPrimitive.Input placeholder={placeholder} rows={1} autoGrow submitOnEnter />
      </label>
      <div className={slot("aifk-prompt-input__toolbar")} data-slot="prompt-input-toolbar">
        <div className={slot("aifk-prompt-input__toolbar-start")}>{toolbarStart}<span className={slot("aifk-prompt-input__hint")}>{hint}</span></div>
        <ComposerPrimitive.Submit
          className={slot("aifk-prompt-input__submit")}
          data-slot="prompt-input-submit"
          aria-label={submitLabel}
          title={submitLabel}
          submittingLabel="Sending message"
          submittingChildren={<span className={slot("aifk-prompt-input__spinner")} aria-hidden="true" />}
        >
          {showSubmitLabel ? <span>{submitLabel}</span> : null}
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3m0 0L4.5 6.5M8 3l3.5 3.5" /></svg>
        </ComposerPrimitive.Submit>
      </div>
      <ComposerPrimitive.Error className={slot("aifk-prompt-input__error")} />
    </ComposerPrimitive.Root>
  );
}
