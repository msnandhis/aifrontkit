import { ControlPanel, QuickControlPanel } from "./control-panel.js";
import type { PlaygroundDefinition, PlaygroundEnvironment, PlaygroundRecord, PlaygroundState } from "./types.js";

export function PlaygroundInspector<Props extends PlaygroundRecord, Environment extends PlaygroundEnvironment>({
  definition,
  state,
  activeScenario,
  mobileOpen,
  onMobileToggle,
  onChange,
}: {
  definition: PlaygroundDefinition<Props, Environment>;
  state: PlaygroundState<Props, Environment>;
  activeScenario: string;
  mobileOpen: boolean;
  onMobileToggle(): void;
  onChange(scope: "props" | "environment", key: string, value: PlaygroundRecord[string]): void;
}) {
  const activeDescription = definition.scenarios.find((scenario) => scenario.id === activeScenario)?.description
    ?? "A configuration edited from one of the documented scenarios.";

  return (
    <aside className="playground-controls" aria-label="Component controls" data-mobile-open={mobileOpen || undefined}>
      <button
        className="playground-mobile-controls-toggle"
        type="button"
        aria-expanded={mobileOpen}
        aria-controls={`${definition.id}-playground-controls`}
        onClick={onMobileToggle}
      >
        <span><strong>Customize</strong><small>{definition.controls.length} options</small></span>
        <span aria-hidden="true">{mobileOpen ? "−" : "+"}</span>
      </button>

      <div className="playground-inspector-body" id={`${definition.id}-playground-controls`}>
        <div className="playground-controls-heading">
          <div className="playground-controls-title">
            <strong>Customize</strong>
            <span>{definition.controls.length} options</span>
          </div>
          <p>{activeDescription}</p>
        </div>

        <section className="playground-quick-controls" aria-labelledby={`${definition.id}-quick-controls`}>
          <p className="playground-quick-controls-title" id={`${definition.id}-quick-controls`}>Quick controls</p>
          <QuickControlPanel state={state} controls={definition.controls} onChange={onChange} />
        </section>

        <ControlPanel state={state} controls={definition.controls} onChange={onChange} />
      </div>
    </aside>
  );
}
