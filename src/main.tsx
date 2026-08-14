import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerSW } from "virtual:pwa-register";
import { applyTheme, loadTheme } from "./game/theme";
import "./styles.css";

applyTheme(loadTheme());
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
