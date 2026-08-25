import { ComposerPrimitive } from "@aifrontkit/react/composer";

export function PromptInput({ onSubmit }: { onSubmit(value: string): void | Promise<void> }) {
  return (
    <ComposerPrimitive.Root onSubmit={onSubmit} className="aifk-prompt-input">
      <ComposerPrimitive.Input placeholder="Ask anything…" rows={2} />
      <ComposerPrimitive.Submit />
    </ComposerPrimitive.Root>
  );
}
