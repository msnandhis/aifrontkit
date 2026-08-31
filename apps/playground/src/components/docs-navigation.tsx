import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "./icons.js";
import { docSections } from "../lib/docs.js";

const sectionOrder = ["start", "patterns", "primitives", "integrations", "concepts", "foundations", "reference"];

export function DocsNavigation() {
  const location = useLocation();
  const sections = [...docSections].sort((left, right) => sectionOrder.indexOf(left.id) - sectionOrder.indexOf(right.id));

  return (
    <nav className="sidebar-navigation" aria-label="Documentation pages">
      {sections.map((section) => {
        const active = section.pages.some((page) => page.path === location.pathname);
        return (
          <details key={`${section.id}-${active}`} open={active || section.id === "start"}>
            <summary>
              <span>{section.title}</span>
              <Icon name="arrow" />
            </summary>
            <div>
              {section.pages.map((page) => (
                <NavLink key={page.path} to={page.path} end={page.path === "/docs"}>{page.title}</NavLink>
              ))}
            </div>
          </details>
        );
      })}
    </nav>
  );
}
