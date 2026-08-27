import {
  createContext,
  forwardRef,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FormEvent,
  type KeyboardEvent,
  type PropsWithChildren,
  type ReactNode,
  type Ref
} from "react";

interface ComposerContextValue {
  value: string;
  setValue(value: string): void;
  submitting: boolean;
  error: string | null;
}
const ComposerContext = createContext<ComposerContextValue | null>(null);

export interface ComposerRootProps extends Omit<ComponentPropsWithoutRef<"form">, "onSubmit"> {
  onSubmit(value: string): void | Promise<void>;
  /** Controlled value. Pair with `onValueChange`; the default remains ergonomic. */
  value?: string;
  defaultValue?: string;
  onValueChange?(value: string): void;
  /** Safe, user-facing feedback retained beside the composer when submission rejects. */
  submitErrorMessage?: string;
}

function Root({ onSubmit, value: controlledValue, defaultValue = "", onValueChange, submitErrorMessage = "Message could not be sent. Try again.", children, ...props }: ComposerRootProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = controlledValue ?? uncontrolledValue;
  const setValue = (nextValue: string) => {
    if (controlledValue === undefined) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  };
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setValue("");
    } catch {
      setError(submitErrorMessage);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <ComposerContext.Provider value={{ value, setValue: (nextValue) => { setValue(nextValue); setError(null); }, submitting, error }}>
      <form data-submitting={submitting ? "true" : "false"} data-error={error ? "true" : "false"} onSubmit={handleSubmit} {...props}>{children}</form>
    </ComposerContext.Provider>
  );
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export interface ComposerInputProps extends ComponentPropsWithoutRef<"textarea"> {
  /** Submit with unmodified Enter while preserving Shift+Enter for a newline. */
  submitOnEnter?: boolean;
  /** Grow with content until the consumer's CSS max-block-size is reached. */
  autoGrow?: boolean;
}

const Input = forwardRef<HTMLTextAreaElement, ComposerInputProps>(function ComposerInput(
  { submitOnEnter = false, autoGrow = false, onChange, onKeyDown, "aria-invalid": ariaInvalid, ...props },
  forwardedRef
) {
  const context = useContext(ComposerContext);
  if (!context) throw new Error("ComposerPrimitive.Input must be inside ComposerPrimitive.Root.");
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const input = localRef.current;
    if (!input || !autoGrow) return;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
    input.style.overflowY = input.scrollHeight > input.clientHeight ? "auto" : "hidden";
  }, [autoGrow, context.value]);

  return (
    <textarea
      aria-label="Message"
      {...props}
      ref={(element) => { localRef.current = element; assignRef(forwardedRef, element); }}
      aria-invalid={context.error ? "true" : ariaInvalid}
      value={context.value}
      onChange={(event) => { context.setValue(event.currentTarget.value); onChange?.(event); }}
      onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !submitOnEnter || event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
        event.preventDefault();
        event.currentTarget.form?.requestSubmit();
      }}
    />
  );
});

export interface ComposerSubmitProps extends PropsWithChildren<ComponentPropsWithoutRef<"button">> {
  submittingLabel?: string;
  submittingChildren?: ReactNode;
}

function Submit({ children, submittingLabel = "Sending message", submittingChildren, disabled, "aria-label": ariaLabel, ...props }: ComposerSubmitProps) {
  const context = useContext(ComposerContext);
  if (!context) throw new Error("ComposerPrimitive.Submit must be inside ComposerPrimitive.Root.");
  return (
    <button
      {...props}
      type="submit"
      disabled={Boolean(disabled) || context.submitting || !context.value.trim()}
      aria-label={context.submitting ? submittingLabel : ariaLabel}
      aria-busy={context.submitting ? "true" : undefined}
    >
      {context.submitting ? (submittingChildren ?? "Sending") : (children ?? "Send")}
    </button>
  );
}

function ComposerError({ children, ...props }: PropsWithChildren<ComponentPropsWithoutRef<"p">>) {
  const context = useContext(ComposerContext);
  if (!context) throw new Error("ComposerPrimitive.Error must be inside ComposerPrimitive.Root.");
  if (!context.error) return null;
  return <p {...props} role="alert" data-aifk-composer-error="">{children ?? context.error}</p>;
}

export const ComposerPrimitive = { Root, Input, Submit, Error: ComposerError };
