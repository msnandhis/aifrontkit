import { StrictMode, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@aifrontkit/react";
import type { Density, MotionLevel, Radius, ThemeMode } from "@aifrontkit/tokens";
import "@aifrontkit/tokens/css";
import { File as CssFile } from "../../../registry/react/css/components/file/file.js";
import { File as TailwindFile } from "../../../registry/react/tailwind/components/file/file.js";
import { componentFixtureContracts, componentFixtureMap, renderRegistryFixture, type LabComponentId } from "./component-fixtures.js";
import "./styles.css";

type ViewportWidth = 375 | 768 | 1024 | 1440;
type PreviewMode = "preview" | "source";

const sourceExample = `import { Conversation } from "@/components/ai/conversation";
import { Message } from "@/components/ai/message";
import { PromptInput } from "@/components/ai/prompt-input";

<Conversation
  presentation="full-height"
  footer={<PromptInput onSubmit={sendMessage} />}
  renderMessage={(messageId) => (
    <Message
      messageId={messageId}
      variant="conversation"
      actions={<MessageActions />}
    />
  )}
/>`;

const paths = {
  spark: "M8 2.25 9.35 6.65 13.75 8l-4.4 1.35L8 13.75l-1.35-4.4L2.25 8l4.4-1.35L8 2.25Z",
  chevron: "m5.5 6.5 2.5 2.5 2.5-2.5",
  monitor: "M2.5 3.5h11v7h-11zM5.5 13h5M8 10.5V13",
  moon: "M12.5 10.5A5.5 5.5 0 0 1 5.5 3.5a5.5 5.5 0 1 0 7 7Z",
  copy: "M5.5 5.5h7v7h-7zM3.5 10.5h-1v-7h7v1",
  retry: "M12.5 6A5 5 0 1 0 13 9M12.5 3v3h-3",
  plus: "M8 2.5v11M2.5 8h11",
  code: "m5.5 4-4 4 4 4m5-8 4 4-4 4M9.5 2.5l-3 11",
  eye: "M1.75 8s2.25-3.5 6.25-3.5S14.25 8 14.25 8 12 11.5 8 11.5 1.75 8 1.75 8ZM8 6.25A1.75 1.75 0 1 0 8 9.75 1.75 1.75 0 0 0 8 6.25Z",
  panel: "M2.5 3h11v10h-11zM6 3v10",
  check: "m3.5 8 3 3 6-6",
  reset: "M12.5 6A5 5 0 1 0 13 9M12.5 3v3h-3",
  arrow: "M3 8h10m-3.5-3.5L13 8l-3.5 3.5"
} as const;

function Icon({ name, size = 16 }: { name: keyof typeof paths; size?: number }) {
  return <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true"><path d={paths[name]} /></svg>;
}

function Segmented<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div className="setting">
      <span className="setting__label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((option) => <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
      </div>
    </div>
  );
}

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (value: T) => void }) {
  return (
    <label className="select-setting">
      <span>{label}</span>
      <span className="select-wrap"><select value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map((option) => <option key={option}>{option}</option>)}</select><Icon name="chevron" /></span>
    </label>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle-row">
      <span><strong>{label}</strong>{description ? <small>{description}</small> : null}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="switch" aria-hidden="true"><i /></span>
    </label>
  );
}

function PanelSection({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return <details className="inspector-section" open={open}><summary>{title}<Icon name="chevron" /></summary><div className="inspector-section__body">{children}</div></details>;
}

const checklist = [
  "Hierarchy is clear at a glance",
  "All states are represented",
  "Keyboard focus is visible",
  "Narrow layout has no page overflow",
  "Dark and high contrast remain legible",
  "Reduced motion keeps every action clear"
];

function FileFlavorParity() {
  const file = {
    type: "file" as const,
    name: "product-brief.pdf",
    mediaType: "application/pdf",
    size: 248000,
    status: "ready" as const,
    source: { kind: "url" as const, url: "https://example.com/product-brief.pdf" },
  };
  return (
    <ThemeProvider theme={{ mode: "light", density: "comfortable", radius: "medium", motion: { level: "none" } }}>
      <main className="flavor-parity" data-flavor-parity="file">
        <section data-flavor="css-modules"><h1>CSS Modules</h1><CssFile file={file} /></section>
        <section data-flavor="tailwind"><h1>Tailwind</h1><TailwindFile file={file} /></section>
      </main>
    </ThemeProvider>
  );
}

function Lab() {
  const [componentId, setComponentId] = useState<LabComponentId>("conversation");
  const [scenarioId, setScenarioId] = useState<string>("default");
  const [mode, setMode] = useState<ThemeMode>("light");
  const [density, setDensity] = useState<Density>("comfortable");
  const [motion, setMotion] = useState<MotionLevel>("subtle");
  const [radius, setRadius] = useState<Radius>("medium");
  const [viewport, setViewport] = useState<ViewportWidth>(768);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [zoomed, setZoomed] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("preview");
  const [copied, setCopied] = useState(false);
  const [fixtureEvent, setFixtureEvent] = useState("No component event yet.");
  const [completedChecks, setCompletedChecks] = useState<Set<number>>(() => new Set());
  const component = componentFixtureMap[componentId];
  const activeScenario = component.scenarios.find((scenario) => scenario.id === scenarioId) ?? component.scenarios[0];
  const activeSource = component.source?.(scenarioId) ?? sourceExample;
  const previewTitle = useMemo(() => `${component.title} · ${activeScenario?.title ?? "Default"} · ${viewport}px`, [activeScenario?.title, component.title, viewport]);

  function selectComponent(nextComponent: LabComponentId) {
    setComponentId(nextComponent);
    setScenarioId("default");
    setDirection("ltr");
    setFixtureEvent("No component event yet.");
  }

  function selectScenario(nextScenario: string) {
    setScenarioId(nextScenario);
    setDirection(nextScenario === "rtl" ? "rtl" : "ltr");
    setFixtureEvent("No component event yet.");
  }

  function reset() {
    setComponentId("conversation"); setScenarioId("default"); setMode("light"); setDensity("comfortable"); setMotion("subtle"); setRadius("medium"); setViewport(768); setDirection("ltr"); setZoomed(false); setPreviewMode("preview"); setCopied(false); setCompletedChecks(new Set());
  }

  async function copySource() {
    await navigator.clipboard.writeText(activeSource);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="lab-shell">
      <a className="skip-link" href="#component-preview">Skip to component preview</a>
      <header className="lab-header">
        <div className="lab-brand"><span className="lab-brand__mark"><Icon name="spark" size={14} /></span><span><strong>AIFrontKit</strong><small>Component Lab</small></span></div>
        <div className="header-context"><span className="status-dot" />Internal quality review <span className="header-divider" /> {component.title} <code>{component.maturity}</code></div>
        <nav className="component-switcher" aria-label="Component" role="group">
          {componentFixtureContracts.map((candidate) => <button key={candidate.id} type="button" data-component-option={candidate.id} aria-pressed={componentId === candidate.id} onClick={() => selectComponent(candidate.id)}>{candidate.title}{candidate.maturity === "experimental" ? <small>Experimental</small> : null}</button>)}
        </nav>
        <button className="reset-button" type="button" onClick={reset}><Icon name="reset" />Reset</button>
      </header>

      <aside className="fixture-panel" aria-label="Component fixtures">
        <div className="panel-heading"><span>{component.title} fixtures</span><span>{component.scenarios.length}</span></div>
        <nav className="fixture-list">
          {component.scenarios.map((item) => {
            const id = item.id;
            const title = item.title;
            const description = item.expectation;
            const active = scenarioId === id;
            const status = id === "streaming" || id === "submitting" || id === "running" ? "active" : id === "failed" || id === "submit-rejected" ? "error" : id === "interrupted" || id === "cancelled" ? "stopped" : id.includes("long") || id.includes("role") || id === "rtl" || id === "localization" || id.includes("toolbar") || id.includes("context") ? "stress" : "ready";
            return <button key={id} type="button" data-fixture-scenario-option={id} className={active ? "active" : ""} aria-current={active ? "true" : undefined} onClick={() => selectScenario(id)}>
              <span className={`fixture-status fixture-status--${status}`} />
              <span><strong>{title}</strong><small>{description}</small></span>
              <Icon name="arrow" />
            </button>;
          })}
        </nav>
        <div className="fixture-note"><Icon name="check" /><span><strong>Real registry source</strong><small>No documentation replicas</small></span></div>
      </aside>

      <main className="lab-main" id="component-preview">
        <section className="preview-heading" aria-labelledby="preview-title">
          <div><p>Registry / Components / {component.title}</p><h1 id="preview-title">{component.title}</h1><span>{component.description}</span></div>
          <div className="view-tabs" role="tablist" aria-label="Preview format">
            <button type="button" role="tab" aria-selected={previewMode === "preview"} onClick={() => setPreviewMode("preview")}><Icon name="eye" />Preview</button>
            <button type="button" role="tab" aria-selected={previewMode === "source"} onClick={() => setPreviewMode("source")}><Icon name="code" />Source</button>
          </div>
        </section>

        <section className="viewport-workbench" aria-label={previewTitle}>
          <div className="viewport-toolbar">
            <div className="viewport-meta"><span className="status-dot" />{activeScenario?.title ?? "Default"}<span>{viewport} × auto</span>{zoomed ? <em>200%</em> : null}</div>
            <div className="viewport-presets" role="group" aria-label="Preview viewport">
              {([375, 768, 1024, 1440] as const).map((width) => <button type="button" key={width} aria-pressed={viewport === width} onClick={() => setViewport(width)}>{width}</button>)}
            </div>
          </div>
          <div className="viewport-scroll">
            <div className={`viewport-frame ${zoomed ? "is-zoomed" : ""}`} style={{ width: viewport }} dir={direction} data-preview-mode={mode} data-fixture-component={componentId} data-fixture-scenario={scenarioId}>
              {previewMode === "source" ? (
                <div className="source-view" dir="ltr"><div className="source-view__header"><span>{componentId}.tsx</span><button type="button" onClick={copySource} aria-live="polite"><Icon name={copied ? "check" : "copy"} />{copied ? "Copied" : "Copy"}</button></div><pre><code>{activeSource}</code></pre></div>
              ) : (
                <ThemeProvider key={`${componentId}-${scenarioId}-${mode}-${density}-${radius}-${motion}`} theme={{ mode, density, radius, motion: { level: motion } }}>
                  <div className="preview-application registry-fixture-preview">{renderRegistryFixture(componentId, scenarioId, { emit: setFixtureEvent })}</div>
                </ThemeProvider>
              )}
            </div>
          </div>
          <footer className="viewport-caption"><Icon name="monitor" /><span>Viewport preset controls component width, not browser zoom.</span><code>{direction.toUpperCase()}</code></footer>
          <output className="sr-only" data-fixture-event aria-live="polite">{fixtureEvent}</output>
        </section>
      </main>

      <aside className="inspector" aria-label="Preview inspector">
        <div className="panel-heading"><span>Inspector</span><Icon name="panel" /></div>
        <PanelSection title="Appearance">
          <Segmented label="Theme" value={mode} onChange={setMode} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "high-contrast", label: "Contrast" }]} />
          <Select label="Density" value={density} options={["compact", "comfortable", "spacious"]} onChange={setDensity} />
          <Select label="Radius" value={radius} options={["none", "small", "medium", "large", "full"]} onChange={setRadius} />
          <Select label="Motion" value={motion} options={["none", "subtle", "expressive"]} onChange={setMotion} />
        </PanelSection>
        <PanelSection title="Stress testing">
          <Toggle label="Right-to-left" description="Mirror direction and alignment" checked={direction === "rtl"} onChange={(value) => setDirection(value ? "rtl" : "ltr")} />
          <Toggle label="200% zoom" description="Inspect reflow and clipping" checked={zoomed} onChange={setZoomed} />
          <Toggle label="Long content" description="Use overflow stress fixture" checked={scenarioId === "long-content"} onChange={(value) => selectScenario(value ? "long-content" : "default")} />
          <Toggle label="Reduced motion" description="Disable configured movement" checked={motion === "none"} onChange={(value) => setMotion(value ? "none" : "subtle")} />
        </PanelSection>
        <PanelSection title="Release checklist">
          <div className="checklist-progress"><span>{completedChecks.size} of {checklist.length}</span><span className="progress-track"><i style={{ width: `${completedChecks.size / checklist.length * 100}%` }} /></span></div>
          <div className="quality-checklist">
            {checklist.map((item, index) => <label key={item}><input type="checkbox" checked={completedChecks.has(index)} onChange={(event) => setCompletedChecks((current) => { const next = new Set(current); event.target.checked ? next.add(index) : next.delete(index); return next; })} /><span className="checkmark"><Icon name="check" /></span><span>{item}</span></label>)}
          </div>
        </PanelSection>
        <div className="review-state"><span className={completedChecks.size === checklist.length ? "complete" : ""}><Icon name="check" /></span><div><strong>{completedChecks.size === checklist.length ? "Ready for human review" : "Review in progress"}</strong><small>{completedChecks.size === checklist.length ? "All local checks completed" : "Complete every quality gate"}</small></div></div>
      </aside>
    </div>
  );
}

const parityTarget = new URLSearchParams(window.location.search).get("parity");
createRoot(document.getElementById("root")!).render(<StrictMode>{parityTarget === "file" ? <FileFlavorParity /> : <Lab />}</StrictMode>);
