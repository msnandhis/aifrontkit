import { useEffect, useMemo, useState } from "react";
import { Icon } from "../components/icons.js";
import { CodeView } from "./code-view.js";
import { ControlPanel } from "./control-panel.js";
import type { PlaygroundDefinition, PlaygroundState, PlaygroundView, PreviewWidth } from "./types.js";
import { normalizePlaygroundState, readPlaygroundState, stateMatches, writePlaygroundState } from "./url-state.js";

export function ComponentPlayground<State extends PlaygroundState>({ definition }: { definition: PlaygroundDefinition<State> }) {
  const [state, setState] = useState<State>(() => normalizePlaygroundState(readPlaygroundState(definition.defaults), definition.defaults, definition.controls));
  const [view, setView] = useState<PlaygroundView>("preview");
  const [width, setWidth] = useState<PreviewWidth>("responsive");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [event, setEvent] = useState("No events yet. Interact with the preview to inspect callbacks.");
  const code = useMemo(() => definition.generateCode(state), [definition, state]);
  const activePreset = definition.presets.find((preset) => stateMatches(state, { ...definition.defaults, ...preset.values }))?.id ?? "custom";

  useEffect(() => writePlaygroundState(state, definition.defaults), [definition.defaults, state]);

  function change<Key extends Extract<keyof State, string>>(key: Key, value: State[Key]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function applyPreset(id: string) {
    const preset = definition.presets.find((item) => item.id === id);
    if (preset) setState({ ...definition.defaults, ...preset.values });
  }

  function reset() {
    setState({ ...definition.defaults });
    setWidth("responsive");
    setEvent("Playground reset to its recommended defaults.");
  }

  async function copy(kind: "code" | "link") {
    await navigator.clipboard.writeText(kind === "code" ? code : window.location.href);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <section className="component-playground" aria-label={definition.label + " interactive playground"}>
      <header className="playground-toolbar">
        <div className="playground-tabs" role="tablist" aria-label="Playground view">
          {(["preview", "code"] as const).map((item) => (
            <button key={item} type="button" role="tab" aria-selected={view === item} onClick={() => setView(item)}>{item === "preview" ? "Preview" : "Code"}</button>
          ))}
        </div>
        <div className="playground-toolbar-actions">
          {view === "preview" ? (
            <div className="playground-widths" role="group" aria-label="Preview width">
              {(["responsive", "tablet", "mobile"] as const).map((item) => <button key={item} type="button" aria-pressed={width === item} onClick={() => setWidth(item)}>{humanize(item)}</button>)}
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
            <div className="playground-frame" data-width={width} dir={String(state.direction ?? "ltr")}>
              <div className={"playground-render playground-render-" + definition.id} key={JSON.stringify(state)}>
                {definition.render(state, { emit: setEvent })}
              </div>
            </div>
          ) : <CodeView code={code} />}
          <div className="playground-event" role="status" aria-live="polite"><span>Event</span><code>{event}</code></div>
        </div>

        <aside className="playground-controls" aria-label="Component controls">
          <div className="playground-controls-heading">
            <div><strong>Controls</strong><span>{definition.controls.length} configurable options</span></div>
            <label htmlFor={definition.id + "-preset"}>Preset</label>
            <select id={definition.id + "-preset"} value={activePreset} onChange={(event) => applyPreset(event.currentTarget.value)}>
              {activePreset === "custom" ? <option value="custom">Custom</option> : null}
              {definition.presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            </select>
            <p>{definition.presets.find((preset) => preset.id === activePreset)?.description ?? "A configuration edited from one of the documented presets."}</p>
          </div>
          <ControlPanel state={state} controls={definition.controls} onChange={change} />
        </aside>
      </div>
      <p className="playground-status sr-only" aria-live="polite">{copied ? humanize(copied) + " copied" : ""}</p>
    </section>
  );
}

function humanize(value: string) {
  return value.replaceAll("-", " ").replace(/^./, (character) => character.toUpperCase());
}
