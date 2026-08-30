import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import searchSources from "virtual:aifrontkit-docs-search";
import { docs } from "../lib/docs.js";
import { Icon } from "./icons.js";

export function SearchDialog({ open, onClose }: { open: boolean; onClose(): void }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    const words = deferredQuery.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return docs.slice(0, 7);
    return docs.map((doc) => {
      const title = doc.title.toLocaleLowerCase();
      const metadata = `${doc.description} ${doc.sectionTitle} ${doc.path}`.toLocaleLowerCase();
      const source = (searchSources[doc.file] ?? "").toLocaleLowerCase();
      const haystack = `${title} ${metadata} ${source}`;
      if (!words.every((word) => haystack.includes(word))) return null;
      const phrase = words.join(" ");
      const score = title === phrase ? 100 : title.startsWith(phrase) ? 80 : title.includes(phrase) ? 60 : 0;
      return { doc, score: score + words.reduce((total, word) => total + (metadata.includes(word) ? 12 : 0) + (source.includes(word) ? 2 : 0), 0) };
    }).filter((result): result is { doc: (typeof docs)[number]; score: number } => result !== null)
      .sort((left, right) => right.score - left.score)
      .slice(0, 12)
      .map(({ doc }) => doc);
  }, [deferredQuery]);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery("");
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? []);
        const first = focusable[0];
        const last = focusable.at(-1);
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      requestAnimationFrame(() => returnFocusRef.current?.focus());
    };
  }, [open, onClose]);

  if (!open) return null;

  function select(path: string) {
    navigate(path);
    onClose();
  }

  return (
    <div className="search-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="search-dialog" role="dialog" aria-modal="true" aria-label="Search documentation">
        <div className="search-field">
          <Icon name="search" />
          <label className="sr-only" htmlFor="docs-search-dialog">Search documentation</label>
          <input ref={inputRef} id="docs-search-dialog" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search components and guides…" autoComplete="off" />
          <kbd>Esc</kbd>
        </div>
        <div className="search-results" aria-live="polite">
          {results.length ? results.map((doc) => (
            <button key={doc.path} type="button" onClick={() => select(doc.path)}>
              <span><strong>{doc.title}</strong><small>{doc.description}</small></span>
              <span className="search-section">{doc.sectionTitle}</span>
            </button>
          )) : (
            <div className="search-empty"><strong>No matching documentation</strong><span>Try a component name, framework, or capability.</span></div>
          )}
        </div>
      </section>
    </div>
  );
}
