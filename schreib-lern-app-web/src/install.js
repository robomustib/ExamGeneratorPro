// ═══════════════════════════════════════════════════════════════════════════════
// INSTALLIEREN — „Zum Startbildschirm" mit eigenem Knopf
// ═══════════════════════════════════════════════════════════════════════════════
// Chrome und Edge melden mit „beforeinstallprompt", dass die App installiert werden
// kann. Nach dem Löschen der App zeigt der Browser seinen eigenen Hinweis oft nicht
// mehr von selbst an — deshalb merkt sich die App das Ereignis und bietet einen
// eigenen Knopf an. Safari (iPhone/iPad) kennt das Ereignis nicht: dort gibt es eine
// kurze Anleitung.
import { useEffect, useState } from "react";

let deferred = null;
const subs = new Set();
const emit = () => subs.forEach((f) => f());

export function initInstall() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
  // Installierte App: Browser bitten, den Fortschritt nicht bei Speichermangel zu löschen
  if (isStandalone()) navigator.storage?.persist?.().catch(() => {});
}

export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

export const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export function useInstall() {
  const [, tick] = useState(0);
  useEffect(() => {
    const f = () => tick((n) => n + 1);
    subs.add(f);
    return () => subs.delete(f);
  }, []);
  return {
    canPrompt: !!deferred,
    standalone: isStandalone(),
    ios: isIOS(),
    secure: typeof window !== "undefined" && window.isSecureContext,
    prompt: async () => {
      if (!deferred) return false;
      const e = deferred;
      deferred = null;
      emit();
      e.prompt();
      const choice = await e.userChoice.catch(() => null);
      return choice?.outcome === "accepted";
    },
  };
}
