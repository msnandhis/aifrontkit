import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { File } from "../../../../registry/react/css/components/file/file.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <File file={{ type: "file", name: "vite-fixture.pdf", mediaType: "application/pdf", size: 2048, source: { kind: "url", url: "https://example.com/vite-fixture.pdf" } }} />
  </StrictMode>
);
