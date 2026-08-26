import { MDXProvider } from "@mdx-js/react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { adjacentDocs, type DocPage } from "../lib/docs.js";
import { ComponentPreview } from "./component-preview.js";
import { Icon } from "./icons.js";
import { mdxComponents } from "./mdx-components.js";

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

  useEffect(() => {
    document.title = `${doc.title} – AIFrontKit`;
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
    requestAnimationFrame(() => document.getElementById("page-title")?.focus({ preventScroll: true }));
  }, [doc, location.pathname, onOutline]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="doc-page" ref={articleRef}>
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
      {doc.component ? <ComponentPreview component={doc.component} /> : null}
      <div className="mdx-content">
        <MDXProvider components={mdxComponents}><doc.Content /></MDXProvider>
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
