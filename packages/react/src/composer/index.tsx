import { createContext, useContext, useState, type ComponentPropsWithoutRef, type FormEvent, type PropsWithChildren } from "react";

interface ComposerContextValue {
  value: string;
  setValue(value: string): void;
  submitting: boolean;
}
const ComposerContext = createContext<ComposerContextValue | null>(null);

export interface ComposerRootProps extends Omit<ComponentPropsWithoutRef<"form">, "onSubmit"> {
  onSubmit(value: string): void | Promise<void>;
}

function Root({ onSubmit, children, ...props }: ComposerRootProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setValue("");
    } finally {
      setSubmitting(false);
    }
  }
  return <ComposerContext.Provider value={{ value, setValue, submitting }}><form onSubmit={handleSubmit} {...props}>{children}</form></ComposerContext.Provider>;
}

function Input(props: ComponentPropsWithoutRef<"textarea">) {
  const context = useContext(ComposerContext);
  if (!context) throw new Error("ComposerPrimitive.Input must be inside ComposerPrimitive.Root.");
  return <textarea aria-label="Message" {...props} value={context.value} onChange={(event) => context.setValue(event.currentTarget.value)} />;
}

function Submit({ children, ...props }: PropsWithChildren<ComponentPropsWithoutRef<"button">>) {
  const context = useContext(ComposerContext);
  if (!context) throw new Error("ComposerPrimitive.Submit must be inside ComposerPrimitive.Root.");
  return <button type="submit" disabled={context.submitting || !context.value.trim()} {...props}>{children ?? (context.submitting ? "Sending" : "Send")}</button>;
}

export const ComposerPrimitive = { Root, Input, Submit };
