import type { ReactNode } from "react";
import { CodeView } from "./code-view.js";
import type { PlaygroundEnvironment, PlaygroundView } from "./types.js";

export function PlaygroundStage({
  view,
  environment,
  definitionId,
  previewId,
  codeId,
  tabBaseId,
  code,
  children,
}: {
  view: PlaygroundView;
  environment: PlaygroundEnvironment;
  definitionId: string;
  previewId: string;
  codeId: string;
  tabBaseId: string;
  code: string;
  children: ReactNode;
}) {
  return (
    <section className="playground-stage" aria-label="Component preview stage">
      <div className="playground-stage-sticky">
        <div className="playground-canvas" data-view={view}>
          {view === "preview" ? (
            <div
              id={previewId}
              role="tabpanel"
              aria-labelledby={`${tabBaseId}-preview-tab`}
              className="playground-frame"
              data-playground-preview=""
              data-width={environment.viewport}
              data-aifk-theme={environment.theme}
              data-aifk-motion={environment.motion}
              dir={environment.direction}
            >
              <div className={`playground-render playground-render-${definitionId}`}>{children}</div>
            </div>
          ) : (
            <div id={codeId} role="tabpanel" aria-labelledby={`${tabBaseId}-code-tab`} data-playground-code="">
              <CodeView code={code} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
