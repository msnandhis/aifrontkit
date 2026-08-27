import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "../components/icons.js";
import { CodeView } from "./code-view.js";
import { ControlPanel } from "./control-panel.js";
import type { PlaygroundDefinition, PlaygroundEnvironment, PlaygroundRecord, PlaygroundState, PlaygroundView } from "./types.js";
import { normalizePlaygroundState, readPlaygroundState, stateMatches, writePlaygroundState } from "./url-state.js";

export function ComponentPlayground<Props extends PlaygroundRecord, Environment extends PlaygroundEnvironment>({
  definition,
}: {
  definition: PlaygroundDefinition<Props, Environment>;
}) {
  const [state, setState] = useState<PlaygroundState<Props, Environment>>(() => normalizePlaygroundState(
    readPlaygroundState(definition.defaults, definition.controls),
    definition.defaults,
    definition.controls,
  ));
  const [view, setView] = useState<PlaygroundView>("preview");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [event, setEvent] = useState("No events yet. Interact with the preview to inspect callbacks.");
  const tabBaseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const code = useMemo(() => definition.generateCode(state), [definition, state]);
  const activeScenario = definition.scenarios.find((scenario) => {
    const expected = {
      props: { ...definition.defaults.props, ...(scenario.values.props ?? {}) },
      environment: { ...definition.defaults.environment, ...(scenario.values.environment ?? {}) },
    };
    return stateMatches(state, { props: expected.props, environment: expected.environment });
  })?.id ?? "custom";

  useEffect(() => writePlaygroundState(state, definition.defaults), [definition.defaults, state]);

  function change(scope: "props" | "environment", key: string, value: PlaygroundRecord[string]) {
    setState((current) => ({ ...current, [scope]: { ...current[scope], [key]: value } }));
  }

  function applyScenario(id: string) {
    const scenario = definition.scenarios.find((item) => item.id === id);
    if (!scenario) return;
    setState({
      props: { ...definition.defaults.props, ...(scenario.values.props ?? {}) },
      environment: { ...definition.defaults.environment, ...(scenario.values.environment ?? {}) },
    });
    setEvent(`Loaded ${scenario.label} scenario.`);
  }

  function reset() {
    setState({ props: { ...definition.defaults.props }, environment: { ...definition.defaults.environment } });
    setEvent("Playground reset to its recommended defaults.");
  }

  function selectView(next: PlaygroundView, focus = false) {
    setView(next);
    if (focus) requestAnimationFrame(() => tabRefs.current[next === "preview" ? 0 : 1]?.focus());
  }

  function onTabKeyDown(keyboardEvent: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(keyboardEvent.key)) return;
    keyboardEvent.preventDefault();
    const nextIndex = keyboardEvent.key === "Home" ? 0 : keyboardEvent.key === "End" ? 1 : keyboardEvent.key === "ArrowRight" ? (index + 1) % 2 : (index - 1 + 2) % 2;
    selectView(nextIndex === 0 ? "preview" : "code", true);
  }

  async function copy(kind: "code" | "link") {
    await navigator.clipboard.writeText(kind === "code" ? code : window.location.href);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  }

  const previewId = `${tabBaseId}-preview-panel`;
  const codeId = `${tabBaseId}-code-panel`;

  return (
    <section className="component-playground" aria-label={`${definition.label} interactive playground`} data-playground-id={definition.id} data-playground-version={definition.version}>
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
              onClick={() => selectView(item)}
              onKeyDown={(keyboardEvent) => onTabKeyDown(keyboardEvent, index)}
            >
              {item === "preview" ? "Preview" : "Code"}
            </button>
          ))}
        </div>
        <div className="playground-toolbar-actions">
          {view === "preview" ? (
            <div className="playground-widths" role="group" aria-label="Preview width">
              {(["responsive", "tablet", "mobile"] as const).map((item) => (
                <button key={item} type="button" aria-pressed={state.environment.viewport === item} onClick={() => change("environment", "viewport", item)}>{humanize(item)}</button>
              ))}
            </div>
          ) : (
            <button className="playground-action" type="button" onClick={() => copy("code")}><Icon name={copied === "code" ? "check" : "copy"} />{copied === "code" ? "Copied" : "Copy code"}</button>
          )}
          <button className="playground-action playground-share" type="button" onClick={() => copy("link")}><Icon name={copied === "link" ? "check" : "external"} />{copied === "link" ? "Copied" : "Share"}</button>
          <button className="playground-action" type="button" onClick={reset}>Reset</button>
        </div>
      </header>

      <div className="playground-workspace">
        <div className="playground-canvas" data-view={view}>
          {view === "preview" ? (
            <div
              id={previewId}
              role="tabpanel"
              aria-labelledby={`${tabBaseId}-preview-tab`}
              className="playground-frame"
              data-playground-preview=""
              data-width={state.environment.viewport}
              data-aifk-theme={state.environment.theme}
              data-aifk-motion={state.environment.motion}
              dir={state.environment.direction}
            >
              <div className={`playground-render playground-render-${definition.id}`}>
                {definition.render(state, { emit: setEvent, setProp: (key, value) => change("props", key, value) })}
              </div>
            </div>
          ) : (
            <div id={codeId} role="tabpanel" aria-labelledby={`${tabBaseId}-code-tab`} data-playground-code=""><CodeView code={code} /></div>
          )}
          <div className="playground-event" role="status" aria-live="polite"><span>Event</span><code>{event}</code></div>
        </div>

        <aside className="playground-controls" aria-label="Component controls">
          <div className="playground-controls-heading">
            <div><strong>Controls</strong><span>{definition.controls.length} configurable options</span></div>
            <label htmlFor={`${definition.id}-scenario`}>Scenario</label>
            <select id={`${definition.id}-scenario`} value={activeScenario} onChange={(changeEvent) => applyScenario(changeEvent.currentTarget.value)}>
              {activeScenario === "custom" ? <option value="custom">Custom</option> : null}
              {definition.scenarios.map((scenario) => <option key={scenario.id} value={scenario.id} data-playground-scenario={scenario.id}>{scenario.label}</option>)}
            </select>
            <p>{definition.scenarios.find((scenario) => scenario.id === activeScenario)?.description ?? "A configuration edited from one of the documented scenarios."}</p>
          </div>
          <ControlPanel state={state} controls={definition.controls} onChange={change} />
        </aside>
      </div>
      <p className="playground-status sr-only" aria-live="polite">{copied ? `${humanize(copied)} copied` : ""}</p>
    </section>
  );
}

function humanize(value: string) {
  return value.replaceAll("-", " ").replace(/^./, (character) => character.toUpperCase());
}
