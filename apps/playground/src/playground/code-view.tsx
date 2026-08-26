import { Fragment, useMemo } from "react";

type TokenKind = "plain" | "comment" | "string" | "number" | "keyword" | "tag" | "property" | "punctuation";
interface Token { kind: TokenKind; value: string }

const keywords = new Set(["import", "from", "const", "let", "function", "return", "async", "await", "export", "true", "false", "undefined", "null"]);

export function CodeView({ code }: { code: string }) {
  const tokens = useMemo(() => tokenize(code), [code]);
  return (
    <pre className="playground-code" tabIndex={0} aria-label="Generated component code">
      <code>{tokens.map((token, index) => <Fragment key={String(index) + "-" + token.value}><span className={"syntax-" + token.kind}>{token.value}</span></Fragment>)}</code>
    </pre>
  );
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let inTag = false;
  let expectsTagName = false;
  const push = (kind: TokenKind, value: string) => tokens.push({ kind, value });

  while (index < source.length) {
    const rest = source.slice(index);
    const whitespace = rest.match(/^\s+/)?.[0];
    if (whitespace) { push("plain", whitespace); index += whitespace.length; continue; }
    const comment = rest.match(/^\/\/[^\n]*/)?.[0];
    if (comment) { push("comment", comment); index += comment.length; continue; }
    if (source[index] === '"' || source[index] === "'" || source[index] === "`") {
      const quote = source[index]!;
      let end = index + 1;
      while (end < source.length) {
        if (source[end] === "\\") { end += 2; continue; }
        if (source[end] === quote) { end += 1; break; }
        end += 1;
      }
      push("string", source.slice(index, end)); index = end; continue;
    }
    const number = rest.match(/^\d+(?:\.\d+)?/)?.[0];
    if (number) { push("number", number); index += number.length; continue; }
    if (source[index] === "<") {
      const opening = source[index + 1] === "/" ? "</" : "<";
      push("punctuation", opening); index += opening.length; inTag = true; expectsTagName = true; continue;
    }
    if (source[index] === ">") { push("punctuation", ">"); index += 1; inTag = false; continue; }
    const identifier = rest.match(/^[A-Za-z_$][\w$.-]*/)?.[0];
    if (identifier) {
      const nextNonSpace = source.slice(index + identifier.length).match(/^\s*(.)/)?.[1];
      const kind: TokenKind = expectsTagName ? "tag" : inTag && nextNonSpace === "=" ? "property" : keywords.has(identifier) ? "keyword" : "plain";
      push(kind, identifier); index += identifier.length; expectsTagName = false; continue;
    }
    const value = source[index]!;
    push(/[{}()[\],;:=/]/.test(value) ? "punctuation" : "plain", value);
    index += 1;
  }
  return tokens;
}
