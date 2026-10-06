import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { initResearch } from "./research.js";

// ── Zurück-Taste / Zurück-Geste im Browser ────────────────────────────────────
// Ohne diese Weiche würde „Zurück" auf dem Handy die ganze Seite verlassen.
// Stattdessen bekommt die App dasselbe Ereignis wie früher von der Android-
// Zurück-Taste: zuerst Overlays schließen, dann zum Menü. Erst im Menü wird
// die Seite wirklich verlassen.
let trapped = false;
function armBackTrap() {
  if (trapped) return;
  history.pushState({ slk: true }, "");
  trapped = true;
}
window.addEventListener("popstate", () => {
  trapped = false;
  const notHandled = window.dispatchEvent(
    new CustomEvent("app:backbutton", { cancelable: true })
  );
  if (notHandled) history.back();
  else armBackTrap();
});
// Browser überspringen Verlaufseinträge, die ohne Nutzerinteraktion angelegt
// wurden — deshalb erst bei der ersten Berührung aktivieren.
window.addEventListener("pointerdown", armBackTrap, { capture: true });

// ── Offline-Modus / „Zum Startbildschirm hinzufügen" ──────────────────────────
// Service Worker funktionieren nur über HTTPS (oder localhost).
if ("serviceWorker" in navigator && window.isSecureContext && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((e) => {
      console.warn("Service Worker konnte nicht registriert werden", e);
    });
  });
}

// Forschungsmodus: nur aktiv, wenn forschung/config.json auf dem Server ihn einschaltet
initResearch();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
