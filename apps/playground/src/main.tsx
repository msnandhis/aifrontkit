import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@aifrontkit/react/theme.css";
import { App } from "./app.js";
import "./playground.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
