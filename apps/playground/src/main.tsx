import { StrictMode, useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import { createRuntime, type AIFrontEvent } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import type { Density, MotionLevel, Radius, ThemeMode, ThemeTemperature } from "@aifrontkit/tokens";
import "@aifrontkit/tokens/css";
import { Message, type MessageVariant } from "../../../registry/components/message/message.js";
import "./playground.css";

const events: AIFrontEvent[] = [
  { schemaVersion: 1, id: "1", threadId: "preview", timestamp: 1, type: "message.started", messageId: "user", role: "user" },
  { schemaVersion: 1, id: "2", threadId: "preview", timestamp: 2, type: "message.delta", messageId: "user", delta: "Can you compare the two implementation options?" },
  { schemaVersion: 1, id: "3", threadId: "preview", timestamp: 3, type: "message.completed", messageId: "user" },
  { schemaVersion: 1, id: "4", threadId: "preview", timestamp: 4, type: "message.started", messageId: "assistant", role: "assistant" },
  { schemaVersion: 1, id: "5", threadId: "preview", timestamp: 5, type: "message.delta", messageId: "assistant", delta: "Use the package API for behavior and install registry source for presentation. That keeps state reliable while letting your team own every visual detail." },
  { schemaVersion: 1, id: "6", threadId: "preview", timestamp: 6, type: "message.completed", messageId: "assistant" },
  { schemaVersion: 1, id: "7", threadId: "preview", timestamp: 7, type: "message.started", messageId: "streaming", role: "assistant" },
  { schemaVersion: 1, id: "8", threadId: "preview", timestamp: 8, type: "message.delta", messageId: "streaming", delta: "Preparing a configurable response…" },
  { schemaVersion: 1, id: "9", threadId: "preview", timestamp: 9, type: "message.started", messageId: "failed", role: "assistant" },
  { schemaVersion: 1, id: "10", threadId: "preview", timestamp: 10, type: "message.delta", messageId: "failed", delta: "The connection was interrupted." },
  { schemaVersion: 1, id: "11", threadId: "preview", timestamp: 11, type: "message.failed", messageId: "failed", error: "Unable to continue. Try again." }
];

const runtime = createRuntime("preview", events);

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (value: T) => void }) {
  return (
    <label className="control">
      <span>{label}</span>
      <select value={value} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value as T)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Playground() {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [temperature, setTemperature] = useState<ThemeTemperature>("neutral");
  const [density, setDensity] = useState<Density>("comfortable");
  const [radius, setRadius] = useState<Radius>("medium");
  const [motion, setMotion] = useState<MotionLevel>("subtle");
  const [variant, setVariant] = useState<MessageVariant>("conversation");

  return (
    <AIFrontKitProvider runtime={runtime} theme={{ mode, temperature, density, radius, motion: { level: motion } }}>
      <main className="playground-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">OpenFrontKit · Visual foundation</p>
            <h1>Message component playground</h1>
            <p className="lede">One behavior contract, four presentation variants, and host-controlled design tokens.</p>
          </div>
          <span className="release-badge">v0.1 preview</span>
        </header>

        <section className="controls-panel" aria-label="Preview controls">
          <Select label="Theme" value={mode} options={["light", "dark", "high-contrast"]} onChange={setMode} />
          <Select label="Temperature" value={temperature} options={["neutral", "warm", "cool"]} onChange={setTemperature} />
          <Select label="Density" value={density} options={["compact", "comfortable", "spacious"]} onChange={setDensity} />
          <Select label="Radius" value={radius} options={["none", "small", "medium", "large", "full"]} onChange={setRadius} />
          <Select label="Motion" value={motion} options={["none", "subtle", "expressive"]} onChange={setMotion} />
          <Select label="Variant" value={variant} options={["minimal", "conversation", "dense", "workspace"]} onChange={setVariant} />
        </section>

        <section className="preview-grid">
          <article className="preview-card preview-card--conversation">
            <div className="preview-card__header"><h2>Conversation</h2><span>Complete + streaming</span></div>
            <div className="conversation-stack">
              <Message messageId="user" variant={variant} motion={motion} />
              <Message messageId="assistant" variant={variant} motion={motion} />
              <Message messageId="streaming" variant={variant} motion={motion} />
            </div>
          </article>

          <article className="preview-card">
            <div className="preview-card__header"><h2>Error state</h2><span>Accessible alert</span></div>
            <Message messageId="failed" variant={variant} motion="none" />
          </article>
        </section>
      </main>
    </AIFrontKitProvider>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><Playground /></StrictMode>);
