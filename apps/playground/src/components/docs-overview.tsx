import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "./icons.js";

const installCommand = "pnpm dlx aifrontkit@next add conversation";

const capabilities = [
  { value: "01", label: "Provider-neutral runtime" },
  { value: "02", label: "Source-owned interface blocks" },
  { value: "03", label: "Accessible production states" },
] as const;

const pathways = [
  {
    index: "01",
    title: "Build a conversation",
    description: "Compose streaming messages, files, sources and tool output with editable source UI.",
    href: "/docs/start/first-conversation",
    action: "Start with chat",
  },
  {
    index: "02",
    title: "Bind your runtime",
    description: "Connect AI SDK, AG-UI or a custom transport without leaking provider state into components.",
    href: "/docs/start/choose-an-integration",
    action: "Choose an adapter",
  },
  {
    index: "03",
    title: "Ship agent workflows",
    description: "Handle progress, approval, disconnection and recovery as first-class interface states.",
    href: "/docs/patterns/research-agent",
    action: "Explore the workflow",
  },
] as const;

export function DocsOverview() {
  const [copied, setCopied] = useState(false);

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText(installCommand);
    } catch {
      const field = document.createElement("textarea");
      field.value = installCommand;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="docs-overview">
      <section className="overview-hero" aria-labelledby="page-title">
        <div className="overview-hero-copy">
          <span className="overview-eyebrow">Frontend infrastructure for AI products</span>
          <h1 id="page-title" tabIndex={-1}>The interface layer for production AI.</h1>
          <p>
            Build with a stable interaction model, accessible React primitives and editable production
            patterns for chat, tools and long-running agents without adopting a backend opinion.
          </p>
          <div className="overview-actions">
            <Link className="overview-primary-action" to="/docs/start/installation">Install AIFrontKit <Icon name="arrow" /></Link>
            <Link className="overview-secondary-action" to="/docs/patterns/research-agent">Open flagship pattern</Link>
          </div>
        </div>

        <div className="overview-install" aria-label="Quick install command">
          <div className="overview-install-heading">
            <span>Quick start</span>
            <small>Source-owned component</small>
          </div>
          <code><span aria-hidden="true">$</span> {installCommand}</code>
          <button type="button" onClick={copyInstall} aria-label={copied ? "Install command copied" : "Copy install command"}>
            <Icon name={copied ? "check" : "copy"} />
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </section>

      <section className="overview-capabilities" aria-label="Product principles">
        {capabilities.map((capability) => (
          <div key={capability.value}>
            <span>{capability.value}</span>
            <strong>{capability.label}</strong>
          </div>
        ))}
      </section>

      <section className="overview-pathways" aria-labelledby="pathways-title">
        <header className="overview-section-heading">
          <span>Choose your entry point</span>
          <h2 id="pathways-title">Move from interface primitive to complete product flow.</h2>
        </header>
        <div className="overview-pathway-list">
          {pathways.map((pathway) => (
            <Link key={pathway.index} to={pathway.href} className="overview-pathway">
              <span className="overview-pathway-index">{pathway.index}</span>
              <div>
                <h3>{pathway.title}</h3>
                <p>{pathway.description}</p>
              </div>
              <strong>{pathway.action} <Icon name="arrow" /></strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="overview-workflow" aria-labelledby="workflow-title">
        <div className="overview-workflow-copy">
          <span className="overview-eyebrow">One canonical interaction layer</span>
          <h2 id="workflow-title">UI state survives provider changes.</h2>
          <p>
            Adapters translate provider streams at the boundary. Components render the same messages, tasks,
            approvals and connection states regardless of which backend produced them.
          </p>
          <Link to="/docs/concepts/architecture">Read the architecture <Icon name="arrow" /></Link>
        </div>
        <ol className="overview-flow" aria-label="AIFrontKit architecture flow">
          <li><span>Provider</span><strong>AI SDK · AG-UI · Custom</strong></li>
          <li><span>Adapter</span><strong>Events and commands</strong></li>
          <li><span>Runtime</span><strong>Canonical interaction state</strong></li>
          <li><span>Interface</span><strong>Primitives and patterns</strong></li>
        </ol>
      </section>

      <section className="overview-production" aria-labelledby="production-title">
        <header className="overview-section-heading">
          <span>Beyond the happy path</span>
          <h2 id="production-title">Production states are part of the component contract.</h2>
        </header>
        <div className="overview-state-row" role="list">
          {[
            ["Streaming", "Live output remains interruptible"],
            ["Approval", "Consequential work waits for intent"],
            ["Offline", "Progress stays visible and recoverable"],
            ["Failed", "Successful work remains intact"],
          ].map(([state, description]) => (
            <div key={state} role="listitem"><span>{state}</span><p>{description}</p></div>
          ))}
        </div>
        <Link className="overview-pattern-link" to="/docs/patterns/agent-progress">
          Inspect production patterns <Icon name="arrow" />
        </Link>
      </section>
    </div>
  );
}
