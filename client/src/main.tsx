import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => console.log('SW registered, scope:', reg.scope))
      .catch((err) => console.error('SW registration failed:', err));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
