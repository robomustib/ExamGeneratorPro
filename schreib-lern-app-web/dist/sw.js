// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE WORKER — macht die App offline nutzbar und installierbar.
// Strategie „erst Netz, dann Cache": Mit Internet gibt es immer die neueste
// Version vom Webserver, ohne Internet die zuletzt geladene.
// ═══════════════════════════════════════════════════════════════════════════════
const CACHE = "schreiben-lernen-v3";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    // Jede Datei einzeln: fehlt eine (z. B. weil der Server .webmanifest nicht ausliefert),
    // wird der Service Worker trotzdem installiert
    caches
      .open(CACHE)
      .then((cache) => Promise.all(FILES.map((f) => cache.add(new Request(f, { cache: "reload" })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    // „no-cache": beim Server nachfragen, ob es eine neue Version gibt (ohne alles neu zu laden)
    fetch(req, { cache: "no-cache" })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(req, { ignoreSearch: true })
          .then((hit) => hit || (req.mode === "navigate" ? caches.match("./index.html") : undefined))
          .then((hit) => hit || Response.error())
      )
  );
});
