import { MDXProvider } from "@mdx-js/react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { adjacentDocs, type DocPage } from "../lib/docs.js";
import { DocsOverview } from "./docs-overview.js";
import { Icon } from "./icons.js";
import { mdxComponents } from "./mdx-components.js";

const ComponentPreview = lazy(async () => {
  const module = await import("./component-preview.js");
  return { default: module.ComponentPreview };
});

export interface OutlineItem {
  id: string;
  label: string;
  level: 2 | 3;
}

export function DocumentationPage({ doc, onOutline }: { doc: DocPage; onOutline(items: OutlineItem[]): void }) {
  const articleRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { previous, next } = adjacentDocs(doc.path);
  const [copied, setCopied] = useState(false);
  const Content = useMemo(() => lazy(async () => {
    const module = await doc.load();
    return { default: module.default };
  }), [doc]);

  useEffect(() => {
    document.title = `${doc.title} – AIFrontKit`;
    const refreshOutline = () => {
      const headings = Array.from(articleRef.current?.querySelectorAll("h2, h3") ?? []);
      const seen = new Map<string, number>();
      const items = headings.map((heading) => {
        const base = slugify(heading.textContent ?? "section");
        const count = seen.get(base) ?? 0;
        seen.set(base, count + 1);
        heading.id ||= count ? `${base}-${count + 1}` : base;
        return { id: heading.id, label: heading.textContent ?? "Section", level: Number(heading.tagName.slice(1)) as 2 | 3 };
      });
      onOutline(items);
    };
    refreshOutline();
    const observer = new MutationObserver(refreshOutline);
    if (articleRef.current) observer.observe(articleRef.current, { childList: true, subtree: true });
    requestAnimationFrame(() => document.getElementById("page-title")?.focus({ preventScroll: true }));
    return () => observer.disconnect();
  }, [doc, location.pathname, onOutline]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (doc.file === "index.md") {
    return (
      <article className="doc-page docs-home-page" ref={articleRef}>
        <DocsOverview />
      </article>
    );
  }

  return (
    <article className={`doc-page${doc.component ? " doc-page-component" : ""}`} ref={articleRef}>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/docs">Docs</Link><span>/</span><span>{doc.sectionTitle}</span>
      </nav>
      <header className="doc-header">
        <div className="doc-heading-line">
          <h1 id="page-title" tabIndex={-1}>{doc.title}</h1>
          {doc.status ? <span className="status-label">{doc.status}</span> : null}
        </div>
        <p>{doc.description}</p>
        <button className="copy-link" type="button" onClick={copyLink}><Icon name={copied ? "check" : "copy"} />{copied ? "Copied" : "Copy link"}</button>
      </header>
      {doc.component ? (
        <Suspense fallback={<div className="component-preview-loading" role="status">Loading interactive preview…</div>}>
          <ComponentPreview component={doc.component} />
        </Suspense>
      ) : null}
      <div className="mdx-content">
        <Suspense fallback={<div className="documentation-loading" role="status">Loading documentation…</div>}>
          <MDXProvider components={mdxComponents}><Content /></MDXProvider>
        </Suspense>
      </div>
      <nav className="page-pagination" aria-label="Documentation pagination">
        {previous ? <Link to={previous.path}><span>Previous</span><strong>{previous.title}</strong></Link> : <span />}
        {next ? <Link to={next.path} className="next"><span>Next</span><strong>{next.title}</strong><Icon name="arrow" /></Link> : <span />}
      </nav>
    </article>
  );
}

function slugify(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}
