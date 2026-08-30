import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { PlaygroundEvents } from "./playground-events.js";
import { PlaygroundInspector } from "./playground-inspector.js";
import { PlaygroundStage } from "./playground-stage.js";
import { PlaygroundToolbar } from "./playground-toolbar.js";
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
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
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
      <PlaygroundToolbar
        view={view}
        viewport={state.environment.viewport}
        copied={copied}
        tabBaseId={tabBaseId}
        previewId={previewId}
        codeId={codeId}
        tabRefs={tabRefs}
        onSelectView={selectView}
        onTabKeyDown={onTabKeyDown}
        onViewportChange={(viewport) => change("environment", "viewport", viewport)}
        onCopyCode={() => void copy("code")}
        onCopyLink={() => void copy("link")}
        onReset={reset}
      />

      <div className="playground-workspace">
        <PlaygroundInspector
          definition={definition}
          state={state}
          activeScenario={activeScenario}
          mobileOpen={mobileControlsOpen}
          onMobileToggle={() => setMobileControlsOpen((current) => !current)}
          onApplyScenario={applyScenario}
          onChange={change}
        />
        <PlaygroundStage
          view={view}
          environment={state.environment}
          definitionId={definition.id}
          previewId={previewId}
          codeId={codeId}
          tabBaseId={tabBaseId}
          code={code}
        >
          {definition.render(state, { emit: setEvent, setProp: (key, value) => change("props", key, value) })}
        </PlaygroundStage>
      </div>
      <PlaygroundEvents event={event} />
      <p className="playground-status sr-only" aria-live="polite">{copied ? `${humanize(copied)} copied` : ""}</p>
    </section>
  );
}

function humanize(value: string) {
  return value.replaceAll("-", " ").replace(/^./, (character) => character.toUpperCase());
}
