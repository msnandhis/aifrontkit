import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { DocumentationPage, type OutlineItem } from "./components/doc-page.js";
import { DocsNavigation } from "./components/docs-navigation.js";
import { Icon } from "./components/icons.js";
import { docsByPath } from "./lib/docs.js";

const SearchDialog = lazy(async () => {
  const module = await import("./components/search-dialog.js");
  return { default: module.SearchDialog };
});

type Theme = "light" | "dark";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/docs" replace />} />
        <Route path="*" element={<DocumentationShell />} />
      </Routes>
    </BrowserRouter>
  );
}

function DocumentationShell() {
  const location = useLocation();
  const normalizedPath = location.pathname.length > 1 ? location.pathname.replace(/\/$/, "") : location.pathname;
  const doc = docsByPath.get(normalizedPath);
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const navigationRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const updateOutline = useCallback((items: OutlineItem[]) => setOutline(items), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    localStorage.setItem("aifrontkit-docs-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    setNavigationOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    if (!navigationOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => navigationRef.current?.querySelector<HTMLElement>("a, button, summary")?.focus());

    function onNavigationKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setNavigationOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(navigationRef.current?.querySelectorAll<HTMLElement>("a[href], button, summary") ?? []).filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onNavigationKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onNavigationKeyDown);
    };
  }, [navigationOpen]);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    }
    document.addEventListener("keydown", onShortcut);
    return () => document.removeEventListener("keydown", onShortcut);
  }, [openSearch]);

  return (
    <div className="docs-root" data-aifk-root data-aifk-theme={theme}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <Link className="brand" to="/docs" aria-label="AIFrontKit documentation home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>AIFrontKit</span><small>Docs</small>
        </Link>
        <nav className="primary-navigation" aria-label="Primary navigation">
          <NavLink to="/docs">Documentation</NavLink>
          <NavLink to="/docs/components/conversation">Components</NavLink>
          <NavLink to="/docs/start/installation">Get started</NavLink>
        </nav>
        <div className="header-actions">
          <button className="search-trigger" type="button" aria-label="Search documentation" onClick={openSearch}><Icon name="search" /><span>Search docs</span><kbd>⌘K</kbd></button>
          <button className="header-icon-button" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}><Icon name={theme === "light" ? "moon" : "sun"} /></button>
          <a className="header-icon-button" href="https://github.com/msnandhis/openfrontkit" aria-label="Open AIFrontKit on GitHub"><Icon name="github" /></a>
          <button ref={menuButtonRef} className="mobile-menu-button" type="button" aria-expanded={navigationOpen} aria-controls="docs-navigation" onClick={() => setNavigationOpen((value) => !value)}><Icon name={navigationOpen ? "close" : "menu"} /><span className="sr-only">Toggle documentation navigation</span></button>
        </div>
      </header>

      <div className={`docs-frame${doc?.component ? " docs-frame-component" : ""}${doc?.file === "index.md" ? " docs-frame-home" : ""}`}>
        <aside ref={navigationRef} id="docs-navigation" className={`docs-sidebar ${navigationOpen ? "is-open" : ""}`} aria-label="Documentation navigation">
          <DocsNavigation />
          <div className="sidebar-footer"><span>Community registry</span><strong>v0.1 · Schema v1</strong></div>
        </aside>
        {navigationOpen ? <button className="navigation-scrim" type="button" aria-label="Close navigation" onClick={() => setNavigationOpen(false)} /> : null}

        <main className="docs-main" id="main-content">
          {doc ? <DocumentationPage key={doc.path} doc={doc} onOutline={updateOutline} /> : <NotFound />}
        </main>

        <aside className="page-outline" aria-label="On this page">
          <p>On this page</p>
          {outline.length ? <nav aria-label="Page sections">{outline.map((item) => <a key={item.id} href={`#${item.id}`} data-level={item.level}>{item.label}</a>)}</nav> : <span className="outline-empty">Page overview</span>}
          <a className="outline-github" href="https://github.com/msnandhis/openfrontkit"><Icon name="external" />Edit on GitHub</a>
        </aside>
      </div>
      {searchOpen ? (
        <Suspense fallback={null}>
          <SearchDialog open onClose={closeSearch} />
        </Suspense>
      ) : null}
    </div>
  );
}

function NotFound() {
  return (
    <section className="not-found">
      <span>404</span>
      <h1 id="page-title" tabIndex={-1}>This page is not in the documentation.</h1>
      <p>The URL may have changed, or the capability may still be planned.</p>
      <Link to="/docs">Return to documentation <Icon name="arrow" /></Link>
    </section>
  );
}

function readInitialTheme(): Theme {
  const saved = localStorage.getItem("aifrontkit-docs-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
