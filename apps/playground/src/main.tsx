import { StrictMode, useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import { createRuntime, type AIFrontEvent } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import type { Density, MotionLevel, Radius, ThemeMode } from "@aifrontkit/tokens";
import "@aifrontkit/tokens/css";
import { Conversation, type ConversationPresentation } from "../../../registry/components/conversation/conversation.js";
import { Message, type MessageVariant } from "../../../registry/components/message/message.js";
import { PromptInput } from "../../../registry/components/prompt-input/prompt-input.js";
import "./playground.css";

const initialEvents: AIFrontEvent[] = [
  { schemaVersion: 1, id: "1", threadId: "preview", timestamp: 1, type: "message.started", messageId: "user-1", role: "user" },
  { schemaVersion: 1, id: "2", threadId: "preview", timestamp: 2, type: "message.delta", messageId: "user-1", delta: "How should the component library and documentation platform stay independent?" },
  { schemaVersion: 1, id: "3", threadId: "preview", timestamp: 3, type: "message.completed", messageId: "user-1" },
  { schemaVersion: 1, id: "4", threadId: "preview", timestamp: 4, type: "message.started", messageId: "assistant-1", role: "assistant" },
  { schemaVersion: 1, id: "5", threadId: "preview", timestamp: 5, type: "message.delta", messageId: "assistant-1", delta: "Keep behavior in versioned packages and presentation in editable registry source. The website may distribute and document both, but installed components never contact it at runtime." },
  { schemaVersion: 1, id: "6", threadId: "preview", timestamp: 6, type: "message.completed", messageId: "assistant-1" },
  { schemaVersion: 1, id: "7", threadId: "preview", timestamp: 7, type: "message.started", messageId: "assistant-streaming", role: "assistant" },
  { schemaVersion: 1, id: "8", threadId: "preview", timestamp: 8, type: "message.delta", messageId: "assistant-streaming", delta: "The Conversation primitive now owns transcript order, empty state, and respectful scroll following." }
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

  return (
    <AIFrontKitProvider runtime={runtime} theme={{ mode, density, radius, motion: { level: motion } }}>
      <a className="skip-link" href="#preview">Skip to preview</a>
      <div className="workbench">
        <header className="topbar">
          <a className="brand" href="/" aria-label="AIFrontKit workbench home">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span>AIFrontKit</span>
          </a>
          <nav className="topbar-nav" aria-label="Workbench navigation">
            <a aria-current="page" href="/">Workbench</a>
            <a href="https://github.com/msnandhis/openfrontkit">Repository</a>
          </nav>
          <span className="build-status"><span aria-hidden="true" />v0.1 local</span>
        </header>

        <aside className="library-panel" aria-label="Component library">
          <div className="panel-heading"><span>Library</span><button aria-label="Search components"><Icon path="M7 2a5 5 0 1 0 0 10A5 5 0 0 0 7 2Zm4 9 3 3" /></button></div>
          <nav className="library-nav">
            <p>Components</p>
            <a className="active" href="#preview"><Icon path="M2.5 3.5h11v8h-7l-3 2v-2h-1z" />Conversation</a>
            <a href="#message"><Icon path="M3 4h10v7H6l-3 2z" />Message</a>
            <a href="#composer"><Icon path="M2.5 8h11M8 2.5v11" />Prompt input</a>
            <a href="#tool"><Icon path="M3 4h10v8H3zM5 7h6" />Tool call</a>
            <p>Patterns</p>
            <a href="#approval"><Icon path="M8 2.5 13 5v3.5c0 2.5-2 4.2-5 5-3-.8-5-2.5-5-5V5z" />Tool approval</a>
          </nav>
          <div className="library-note"><span>Community registry</span><strong>5 items</strong></div>
        </aside>

        <main className="stage" id="preview">
          <header className="stage-header">
            <div><p>Components / Conversation</p><h1>Conversation</h1></div>
            <div className="stage-actions"><button><Icon path="M8 2.5v8m0 0 3-3m-3 3-3-3M3 13.5h10" />Install</button><button aria-label="More actions"><Icon path="M3 8h.01M8 8h.01M13 8h.01" /></button></div>
          </header>
          <div className="stage-meta"><p>A composed transcript with respectful scroll following, neutral message presentation, and accessible state announcements.</p><span>registry:component</span></div>
          <section className="preview-frame" aria-label="Live Conversation preview">
            <div className="preview-toolbar"><div><span className="preview-dot" />Live preview</div><div className="viewport-label"><Icon path="M3 3.5h10v9H3z" />Responsive</div></div>
            <div className="preview-canvas">
              <Conversation
                presentation={presentation}
                messageVariant={messageVariant}
                messageMotion={motion}
                header={<div className="conversation-title"><div><strong>Architecture review</strong><span>3 messages</span></div><button aria-label="Conversation options"><Icon path="M3 8h.01M8 8h.01M13 8h.01" /></button></div>}
                footer={<PromptInput onSubmit={submitPreview} placeholder="Ask about the architecture" />}
                renderMessage={(messageId) => (
                  <Message
                    messageId={messageId}
                    variant={messageVariant}
                    motion={motion}
                    announceStatus={false}
                    actions={messageId.startsWith("assistant") ? <><button>Copy</button><button>Retry</button></> : undefined}
                  />
                )}
              />
            </div>
          </section>
        </main>

        <aside className="inspector" aria-label="Preview configuration">
          <header><div><span>Inspector</span><small>Live</small></div><button aria-label="Reset controls"><Icon path="M12.5 6A5 5 0 1 0 13 9M12.5 3v3h-3" /></button></header>
          <section><h2>Appearance</h2><Select label="Theme" value={mode} options={["light", "dark", "high-contrast"]} onChange={setMode} /><Select label="Density" value={density} options={["compact", "comfortable", "spacious"]} onChange={setDensity} /><Select label="Radius" value={radius} options={["none", "small", "medium", "large", "full"]} onChange={setRadius} /></section>
          <section><h2>Component</h2><Select label="Presentation" value={presentation} options={["embedded", "full-height", "workspace"]} onChange={setPresentation} /><Select label="Message" value={messageVariant} options={["minimal", "conversation", "dense", "workspace"]} onChange={setMessageVariant} /><Select label="Motion" value={motion} options={["none", "subtle", "expressive"]} onChange={setMotion} /></section>
          <section className="contract"><h2>Contract</h2><dl><div><dt>Package</dt><dd>@aifrontkit/react</dd></div><div><dt>Schema</dt><dd>v1</dd></div><div><dt>Status</dt><dd><span />Preview</dd></div></dl></section>
        </aside>
      </div>
    </AIFrontKitProvider>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><Playground /></StrictMode>);
