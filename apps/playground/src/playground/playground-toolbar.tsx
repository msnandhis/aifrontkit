import { Icon } from "../components/icons.js";
import type { KeyboardEvent, MutableRefObject } from "react";
import type { PlaygroundView, PreviewWidth } from "./types.js";

export function PlaygroundToolbar({
  view,
  viewport,
  copied,
  tabBaseId,
  previewId,
  codeId,
  tabRefs,
  onSelectView,
  onTabKeyDown,
  onViewportChange,
  onCopyCode,
  onCopyLink,
  onReset,
}: {
  view: PlaygroundView;
  viewport: PreviewWidth;
  copied: "code" | "link" | null;
  tabBaseId: string;
  previewId: string;
  codeId: string;
  tabRefs: MutableRefObject<Array<HTMLButtonElement | null>>;
  onSelectView(view: PlaygroundView): void;
  onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void;
  onViewportChange(viewport: PreviewWidth): void;
  onCopyCode(): void;
  onCopyLink(): void;
  onReset(): void;
}) {
  return (
    <header className="playground-toolbar">
      <div className="playground-tabs" role="tablist" aria-label="Playground view">
        {(["preview", "code"] as const).map((item, index) => (
          <button
            key={item}
            ref={(node) => { tabRefs.current[index] = node; }}
            id={`${tabBaseId}-${item}-tab`}
            type="button"
            role="tab"
            aria-controls={item === "preview" ? previewId : codeId}
            aria-selected={view === item}
            tabIndex={view === item ? 0 : -1}
            onClick={() => onSelectView(item)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            {item === "preview" ? "Preview" : "Code"}
          </button>
        ))}
      </div>

      <div className="playground-widths" role="group" aria-label="Preview width">
        {([
          { value: "responsive", label: "Desktop", icon: "desktop" },
          { value: "tablet", label: "Tablet", icon: "tablet" },
          { value: "mobile", label: "Mobile", icon: "mobile" },
        ] as const).map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={viewport === item.value}
            disabled={view !== "preview"}
            onClick={() => onViewportChange(item.value)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="playground-toolbar-actions">
        <button className="playground-action" type="button" onClick={onReset}>
          <Icon name="reset" /><span>Reset</span>
        </button>
        <button className="playground-action playground-share" type="button" aria-label={copied === "link" ? "Link copied" : "Share playground"} onClick={onCopyLink}>
          <Icon name={copied === "link" ? "check" : "share"} /><span>{copied === "link" ? "Copied" : "Share"}</span>
        </button>
        <button className="playground-action playground-copy-code" type="button" onClick={onCopyCode}>
          <Icon name={copied === "code" ? "check" : "copy"} /><span>{copied === "code" ? "Copied" : "Copy code"}</span>
        </button>
      </div>
    </header>
  );
}
