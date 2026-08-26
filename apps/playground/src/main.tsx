import { StrictMode, useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import { createRuntime, type AIFrontEvent } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import type { Density, MotionLevel, Radius, ThemeMode } from "@aifrontkit/tokens";
import "@aifrontkit/tokens/css";
import { Conversation, type ConversationPresentation } from "../../../registry/react/css/components/conversation/conversation.js";
import { Message, type MessageVariant } from "../../../registry/react/css/components/message/message.js";
import { PromptInput } from "../../../registry/react/css/components/prompt-input/prompt-input.js";
import "./playground.css";

const initialEvents: AIFrontEvent[] = [
  { schemaVersion: 1, id: "1", threadId: "preview", timestamp: 1, type: "message.started", messageId: "user-1", role: "user" },
  { schemaVersion: 1, id: "2", threadId: "preview", timestamp: 2, type: "message.delta", messageId: "user-1", delta: "How should the component library and documentation platform stay independent?" },
  { schemaVersion: 1, id: "3", threadId: "preview", timestamp: 3, type: "message.completed", messageId: "user-1" },
  { schemaVersion: 1, id: "4", threadId: "preview", timestamp: 4, type: "message.started", messageId: "assistant-1", role: "assistant" },
  { schemaVersion: 1, id: "5", threadId: "preview", timestamp: 5, type: "message.delta", messageId: "assistant-1", delta: "Keep behavior in versioned packages and presentation in editable registry source. The website may distribute and document both, but installed components never contact it at runtime." },
  { schemaVersion: 1, id: "6", threadId: "preview", timestamp: 6, type: "message.completed", messageId: "assistant-1" },
  { schemaVersion: 1, id: "7", threadId: "preview", timestamp: 7, type: "message.started", messageId: "user-2", role: "user" },
  { schemaVersion: 1, id: "8", threadId: "preview", timestamp: 8, type: "message.delta", messageId: "user-2", delta: "What does the Conversation primitive own?" },
  { schemaVersion: 1, id: "9", threadId: "preview", timestamp: 9, type: "message.completed", messageId: "user-2" },
  { schemaVersion: 1, id: "10", threadId: "preview", timestamp: 10, type: "message.started", messageId: "assistant-streaming", role: "assistant" },
  { schemaVersion: 1, id: "11", threadId: "preview", timestamp: 11, type: "message.delta", messageId: "assistant-streaming", delta: "It owns transcript order, empty state, and respectful scroll following. Your application keeps control of rendering and transport." }
];

const runtime = createRuntime("preview", initialEvents);
let eventSequence = 20;

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

function Icon({ path }: { path: string }) {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d={path} /></svg>;
}

function IconButton({ label, path }: { label: string; path: string }) {
  return <button className="icon-button" type="button" aria-label={label} title={label}><Icon path={path} /></button>;
}

async function submitPreview(value: string) {
  const messageId = `user-${eventSequence}`;
  const timestamp = eventSequence;
  runtime.dispatch({ schemaVersion: 1, id: `event-${eventSequence++}`, threadId: "preview", timestamp, type: "message.started", messageId, role: "user" });
  runtime.dispatch({ schemaVersion: 1, id: `event-${eventSequence++}`, threadId: "preview", timestamp: timestamp + 1, type: "message.delta", messageId, delta: value });
  runtime.dispatch({ schemaVersion: 1, id: `event-${eventSequence++}`, threadId: "preview", timestamp: timestamp + 2, type: "message.completed", messageId });
}

function Playground() {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [density, setDensity] = useState<Density>("comfortable");
  const [radius, setRadius] = useState<Radius>("medium");
  const [motion, setMotion] = useState<MotionLevel>("subtle");
  const [messageVariant, setMessageVariant] = useState<MessageVariant>("conversation");
  const [presentation, setPresentation] = useState<ConversationPresentation>("full-height");
  const [demoView, setDemoView] = useState<"preview" | "code">("preview");

  return (
    <AIFrontKitProvider runtime={runtime} theme={{ mode, density, radius, motion: { level: motion } }}>
      <a className="skip-link" href="#preview">Skip to preview</a>
      <div className="docs-app">
        <header className="topbar">
          <a className="brand" href="/" aria-label="AIFrontKit workbench home">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span>AIFrontKit</span>
          </a>
          <nav className="topbar-nav" aria-label="Primary navigation">
            <a aria-current="page" href="/">Components</a>
            <a href="#anatomy">Documentation</a>
            <a href="https://github.com/msnandhis/openfrontkit">GitHub</a>
          </nav>
          <a className="github-link" href="https://github.com/msnandhis/openfrontkit">Open repository <Icon path="M6 3h7v7M13 3 5 11" /></a>
        </header>

        <aside className="library-panel" aria-label="Documentation navigation">
          <label className="docs-search"><Icon path="M7 2.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm3.5 8 3 3" /><span className="sr-only">Search documentation</span><input type="search" placeholder="Search docs" /></label>
          <nav className="library-nav">
            <p>Start here</p>
            <a href="#overview"><Icon path="M3 3.5h10v9H3zM5.5 6h5M5.5 8.5h5" />Introduction</a>
            <p>Components</p>
            <a className="active" href="#preview"><Icon path="M2.5 3.5h11v8h-7l-3 2v-2h-1z" />Conversation</a>
            <a href="#message"><Icon path="M3 4h10v7H6l-3 2z" />Message</a>
            <a href="#composer"><Icon path="M2.5 8h11M8 2.5v11" />Prompt input</a>
            <a href="#tool"><Icon path="M3 4h10v8H3zM5 7h6" />Tool call</a>
            <p>Patterns</p>
            <a href="#approval"><Icon path="M8 2.5 13 5v3.5c0 2.5-2 4.2-5 5-3-.8-5-2.5-5-5V5z" />Tool approval</a>
          </nav>
          <div className="library-note"><span>Community registry</span><strong>Version 0.1</strong></div>
        </aside>

        <main className="stage" id="overview">
          <header className="stage-header">
            <p>Components</p>
            <h1>Conversation</h1>
            <p className="stage-lede">A complete chat surface with respectful scroll following, accessible live states, composable messages, and a production-ready prompt input.</p>
          </header>
          <section className="component-demo" id="preview" aria-label="Live Conversation preview">
            <div className="demo-toolbar"><div role="tablist" aria-label="Component view"><button role="tab" aria-selected={demoView === "preview"} onClick={() => setDemoView("preview")}>Preview</button><button role="tab" aria-selected={demoView === "code"} onClick={() => setDemoView("code")}>Code</button></div><span>{demoView === "preview" ? "Interactive" : "React"}</span></div>
            {demoView === "preview" ? <div className="preview-canvas">
              <Conversation
                presentation={presentation}
                messageVariant={messageVariant}
                messageMotion={motion}
                footer={<PromptInput onSubmit={submitPreview} placeholder="Send a message…" hint="" toolbarStart={<IconButton label="Add attachment" path="M8 2.5v11M2.5 8h11" />} />}
                renderMessage={(messageId) => (
                  <Message
                    messageId={messageId}
                    variant={messageVariant}
                    motion={motion}
                    announceStatus={false}
                    avatar={messageId.startsWith("assistant") ? <Icon path="M8 2.5 9.4 6.6 13.5 8l-4.1 1.4L8 13.5 6.6 9.4 2.5 8l4.1-1.4z" /> : undefined}
                    actions={messageId.startsWith("assistant") ? <><IconButton label="Copy response" path="M5.5 5.5h7v7h-7zM3.5 10.5h-1v-7h7v1" /><IconButton label="Try again" path="M12.5 6A5 5 0 1 0 13 9M12.5 3v3h-3" /></> : undefined}
                  />
                )}
              />
            </div> : <div className="code-canvas"><div className="code-file">conversation.tsx</div><pre><code>{`<Conversation
  presentation="full-height"
  footer={<PromptInput onSubmit={sendMessage} />}
  renderMessage={(messageId) => (
    <Message
      messageId={messageId}
      variant="conversation"
      actions={<MessageActions />}
    />
  )}
/>`}</code></pre></div>}
            <details className="demo-controls">
              <summary><span>Customize preview</span><Icon path="M4 6l4 4 4-4" /></summary>
              <div className="control-grid"><Select label="Theme" value={mode} options={["light", "dark", "high-contrast"]} onChange={setMode} /><Select label="Density" value={density} options={["compact", "comfortable", "spacious"]} onChange={setDensity} /><Select label="Radius" value={radius} options={["none", "small", "medium", "large", "full"]} onChange={setRadius} /><Select label="Presentation" value={presentation} options={["embedded", "full-height", "workspace"]} onChange={setPresentation} /><Select label="Message" value={messageVariant} options={["minimal", "conversation", "dense", "workspace"]} onChange={setMessageVariant} /><Select label="Motion" value={motion} options={["none", "subtle", "expressive"]} onChange={setMotion} /></div>
            </details>
          </section>
          <section className="docs-section" id="anatomy"><div><p>Anatomy</p><h2>Small pieces, composed well.</h2></div><p>The source component combines framework-neutral runtime state with editable presentation. Replace the message, composer, empty state, or footer without coupling your app to our website.</p></section>
        </main>

        <aside className="page-outline" aria-label="On this page">
          <p>On this page</p><nav><a href="#overview">Overview</a><a href="#preview">Preview</a><a href="#anatomy">Anatomy</a></nav>
          <div><span>Package</span><code>@aifrontkit/react</code><span>Schema</span><code>v1</code></div>
        </aside>
      </div>
    </AIFrontKitProvider>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><Playground /></StrictMode>);
