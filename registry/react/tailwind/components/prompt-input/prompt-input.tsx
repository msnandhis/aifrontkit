"use client";

import React, { type ReactNode } from "react";
import { ComposerPrimitive } from "@aifrontkit/react/composer";

function cx(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

const rootClass = "aifk-prompt-input grid min-h-[var(--aifk-prompt-input-min-height,7rem)] min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-[var(--aifk-prompt-input-gap,0.5rem)] rounded-[var(--aifk-radius-panel,0.875rem)] border border-[var(--aifk-input-border,ButtonBorder)] bg-[var(--aifk-input,Canvas)] p-[var(--aifk-prompt-input-padding,0.5rem)] font-[inherit] text-[var(--aifk-text,CanvasText)] shadow-[var(--aifk-shadow-sm,0_1px_2px_rgb(0_0_0_/_0.06))] transition-[border-color,box-shadow] duration-[var(--aifk-motion-duration-fast,120ms)] focus-within:border-[var(--aifk-focus,Highlight)] focus-within:shadow-[var(--aifk-shadow-focus,0_0_0_3px_color-mix(in_srgb,Highlight_20%,transparent))] data-[error=true]:border-[color-mix(in_srgb,var(--aifk-destructive,CanvasText)_58%,var(--aifk-input-border,ButtonBorder))] data-[submitting=true]:cursor-progress [&_textarea]:block [&_textarea]:max-h-48 [&_textarea]:min-h-11 [&_textarea]:w-full [&_textarea]:resize-none [&_textarea]:border-0 [&_textarea]:bg-transparent [&_textarea]:px-2.5 [&_textarea]:py-2 [&_textarea]:font-[inherit] [&_textarea]:text-[length:var(--aifk-type-font-size-md,1rem)]! [&_textarea]:leading-6! [&_textarea]:text-[var(--aifk-text,CanvasText)] [&_textarea]:outline-0 [&_textarea::placeholder]:text-[var(--aifk-text-subtle,GrayText)] [&_textarea::placeholder]:opacity-100 [&_textarea:disabled]:cursor-not-allowed [&_textarea:disabled]:text-[var(--aifk-text-muted,GrayText)] motion-reduce:duration-0 forced-colors:border-[CanvasText] forced-colors:focus-within:outline-2 forced-colors:focus-within:outline-offset-2 forced-colors:focus-within:outline-[Highlight]";
const leadingClass = "aifk-prompt-input__leading col-span-full flex flex-wrap gap-1.5 [&>*]:max-w-full";
const fieldClass = "aifk-prompt-input__field col-span-full min-w-0";
const labelClass = "aifk-prompt-input__label block px-2.5 pt-1.5 text-[length:var(--aifk-type-font-size-sm,0.875rem)] font-[var(--aifk-type-font-weight-medium,500)] leading-[1.35] text-[var(--aifk-text-muted,GrayText)]";
const screenReaderOnlyClass = "aifk-prompt-input__sr-only absolute size-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0_0_0_0)] [margin:-1px]";
const toolbarClass = "aifk-prompt-input__toolbar col-span-full flex items-center justify-between gap-3 ps-0.5 max-[30rem]:justify-end";
const toolbarStartClass = "aifk-prompt-input__toolbar-start flex min-w-0 items-center gap-2 max-[30rem]:flex-1 max-[30rem]:flex-wrap [&>*]:max-w-full [&_:where(button,a)]:inline-flex [&_:where(button,a)]:min-h-9 [&_:where(button,a)]:min-w-9 [&_:where(button,a)]:cursor-pointer [&_:where(button,a)]:items-center [&_:where(button,a)]:justify-center [&_:where(button,a)]:gap-1.5 [&_:where(button,a)]:rounded-[var(--aifk-radius-control,0.5rem)] [&_:where(button,a)]:border-0 [&_:where(button,a)]:bg-transparent [&_:where(button,a)]:px-2 [&_:where(button,a)]:font-[inherit] [&_:where(button,a)]:text-xs [&_:where(button,a)]:font-[var(--aifk-type-font-weight-medium,500)] [&_:where(button,a)]:leading-none [&_:where(button,a)]:text-[var(--aifk-text-muted,GrayText)] [&_:where(button,a)]:no-underline [&_:where(button,a)]:transition-[color,background-color] [&_:where(button,a)]:duration-[var(--aifk-motion-duration-fast,120ms)] [&_:where(button,a)]:ease-out [&_:where(button,a):hover]:bg-[var(--aifk-surface,ButtonFace)] [&_:where(button,a):hover]:text-[var(--aifk-text,CanvasText)] [&_:where(button,a):active]:bg-[var(--aifk-surface-subtle,ButtonFace)] [&_:where(button,a):active]:text-[var(--aifk-text,CanvasText)] [&_:where(button,a):focus-visible]:outline-2 [&_:where(button,a):focus-visible]:outline-offset-2 [&_:where(button,a):focus-visible]:outline-[var(--aifk-focus,Highlight)] [&_:where(button,a):disabled]:cursor-not-allowed [&_:where(button,a):disabled]:text-[var(--aifk-text-subtle,GrayText)] [&_:where(button,a):disabled]:opacity-[0.58] pointer-coarse:[&_:where(button,a)]:min-h-11 pointer-coarse:[&_:where(button,a)]:min-w-11 motion-reduce:[&_:where(button,a)]:duration-0";
const hintClass = "aifk-prompt-input__hint text-xs text-[var(--aifk-text-subtle,GrayText)] max-[30rem]:hidden";
const submitClass = "aifk-prompt-input__submit inline-flex min-h-9! min-w-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border-0! bg-[var(--aifk-action,CanvasText)] px-2.5! py-0! font-[inherit] text-[0.8125rem]! font-semibold text-[var(--aifk-action-foreground,Canvas)] transition-[background-color,transform] duration-[var(--aifk-motion-duration-fast,120ms)] hover:not-disabled:bg-[var(--aifk-action-hover,CanvasText)] active:not-disabled:bg-[var(--aifk-action,CanvasText)] active:not-disabled:opacity-[0.88] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aifk-focus,Highlight)] disabled:cursor-not-allowed disabled:bg-[var(--aifk-surface,ButtonFace)] disabled:text-[var(--aifk-text-subtle,GrayText)] disabled:opacity-[0.72] [&_svg]:size-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:1.5] pointer-coarse:min-h-11! pointer-coarse:min-w-11 motion-reduce:duration-0";
const spinnerClass = "aifk-prompt-input__spinner size-3.5 animate-spin rounded-full border-[1.5px] border-current border-e-transparent [animation-duration:700ms] motion-reduce:animate-none motion-reduce:border-e-current";
const errorClass = "aifk-prompt-input__error col-span-full m-0 px-2.5 text-[0.8125rem] font-[var(--aifk-type-font-weight-medium,500)] text-[var(--aifk-destructive,CanvasText)]";

export interface PromptInputProps {
  onSubmit(value: string): void | Promise<void>;
  /** Override trimmed-text validation, for example when ready attachments permit an empty message. */
  canSubmit?(value: string): boolean;
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

export function PromptInput({ onSubmit, canSubmit, value, defaultValue, onValueChange, label = "Message", labelDisplay = "sr-only", placeholder = "Ask a question", hint = "Enter to send", leading, toolbarStart, submitLabel = "Send message", showSubmitLabel = false, submitErrorMessage = "Message could not be sent. Try again.", className }: PromptInputProps) {
  return (
    <ComposerPrimitive.Root
      onSubmit={onSubmit}
      {...(canSubmit === undefined ? {} : { canSubmit })}
      {...(value === undefined ? {} : { value })}
      {...(defaultValue === undefined ? {} : { defaultValue })}
      {...(onValueChange === undefined ? {} : { onValueChange })}
      submitErrorMessage={submitErrorMessage}
      className={cx(rootClass, className)}
      data-slot="prompt-input"
    >
      {leading ? <div className={leadingClass} data-slot="prompt-input-leading">{leading}</div> : null}
      <label className={fieldClass} data-slot="prompt-input-field">
        <span className={labelDisplay === "visible" ? labelClass : screenReaderOnlyClass}>{label}</span>
        <ComposerPrimitive.Input placeholder={placeholder} rows={1} autoGrow submitOnEnter />
      </label>
      <div className={toolbarClass} data-slot="prompt-input-toolbar">
        <div className={toolbarStartClass}>{toolbarStart}<span className={hintClass}>{hint}</span></div>
        <ComposerPrimitive.Submit
          className={submitClass}
          data-slot="prompt-input-submit"
          aria-label={submitLabel}
          title={submitLabel}
          submittingLabel="Sending message"
          submittingChildren={<span className={spinnerClass} aria-hidden="true" />}
        >
          {showSubmitLabel ? <span>{submitLabel}</span> : null}
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3m0 0L4.5 6.5M8 3l3.5 3.5" /></svg>
        </ComposerPrimitive.Submit>
      </div>
      <ComposerPrimitive.Error className={errorClass} />
    </ComposerPrimitive.Root>
  );
}
