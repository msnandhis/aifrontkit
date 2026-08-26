import type { ComponentPropsWithoutRef } from "react";
import { Link, useLocation } from "react-router-dom";

function MdxLink({ href = "", children, ...props }: ComponentPropsWithoutRef<"a">) {
  const location = useLocation();
  if (href.startsWith("/")) return <Link to={href}>{children}</Link>;
  if (/^https?:/.test(href)) return <a {...props} href={href} target="_blank" rel="noreferrer">{children}</a>;
  if (href.endsWith(".md")) {
    const basePath = location.pathname === "/docs" ? "/docs/" : location.pathname.replace(/\/[^/]+$/, "/");
    const resolved = new URL(href, `https://docs.aifrontkit.local${basePath}`).pathname
      .replace(/\.md$/, "")
      .replace("/docs/primitives/", "/docs/components/");
    return <Link to={resolved}>{children}</Link>;
  }
  return <a {...props} href={href}>{children}</a>;
}

export const mdxComponents = {
  h1: () => null,
  a: MdxLink,
  pre: (props: ComponentPropsWithoutRef<"pre">) => <div className="code-block"><pre {...props} /></div>,
  table: (props: ComponentPropsWithoutRef<"table">) => <div className="table-scroll"><table {...props} /></div>,
};
