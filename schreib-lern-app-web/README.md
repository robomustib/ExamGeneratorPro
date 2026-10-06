# Schreiben lernen — Web-Version

Die Kinder-App zum Schreibenlernen als normale Webseite. Kein Android Studio,
kein App-Store: Dateien auf den Webserver laden, fertig.

## Hochladen (ohne irgendetwas zu installieren)

Den **Inhalt** des Ordners `dist/` per FTP/SFTP auf den Webserver kopieren,
z. B. nach `https://deine-domain.de/schreiben/`:

```
dist/
├── index.html               die komplette App (JavaScript + CSS sind eingebettet)
├── manifest.webmanifest     App-Name, Farben, Icons für „Zum Startbildschirm"
├── sw.js                    Offline-Modus
├── icon.svg
├── icon-192.png
├── icon-512.png
└── icon-maskable-512.png
```

Die App funktioniert in jedem Unterordner, es muss nichts am Server
eingestellt werden. Zum schnellen Ausprobieren lässt sich `dist/index.html`
auch einfach per Doppelklick im Browser öffnen.

## Auf dem Handy wie eine App nutzen

1. Seite in **Chrome** (Android) bzw. **Safari** (iPhone/iPad) öffnen.
2. Android: Menü **⋮ → „App installieren"** bzw. **„Zum Startbildschirm hinzufügen"**.
   iPhone: **Teilen → „Zum Home-Bildschirm"**.
3. Die App startet dann im Vollbild mit eigenem Icon und funktioniert nach dem
   ersten Aufruf auch **ohne Internet**.

> Installieren und Offline-Modus gehen nur über **HTTPS**. Ohne HTTPS läuft die
> App trotzdem, aber nur im Browser-Tab und nur mit Internet.

## Was sich gegenüber der Android-Version ändert

| Funktion | Web-Version |
|---|---|
| Sprachausgabe | Sprachausgabe des Browsers (`speechSynthesis`). Fehlt die deutsche Stimme, in den Android-Einstellungen unter *Sprachen → Text-in-Sprache* nachladen. |
| Vibration | `navigator.vibrate` — klappt in Chrome auf Android, **nicht** auf dem iPhone. |
| Fortschritt | Wird im Browser des jeweiligen Geräts gespeichert (`localStorage`). Browserdaten löschen = Fortschritt weg. |
| Zurück-Taste | Schließt erst Fenster, dann geht es zum Menü — wie in der Android-Version. |
| Hochformat | Wird nur in der installierten App erzwungen, nicht im Browser-Tab. |

## Vor dem Veröffentlichen

Im Impressum und in der Datenschutzerklärung (in der App unter
**📄 Impressum**) die gelb markierten Platzhalter ausfüllen: Name, Anschrift,
E-Mail sowie Name des Hosters und die Löschfrist der Server-Logs. Die
Platzhalter stehen in `src/App.jsx` (Suche nach `[`), danach neu bauen.

## Ändern und neu bauen (nur wenn du am Code etwas änderst)

Benötigt Node.js ≥ 18.

```bash
npm install
npm run dev      # Entwicklungsserver: http://localhost:5173
npm run build    # schreibt die fertigen Dateien nach dist/
```

Danach wieder den Inhalt von `dist/` hochladen. Geräte mit Internet bekommen
die neue Version beim nächsten Öffnen automatisch.

## Projektstruktur

```
schreib-lern-app-web/
├── index.html          Touch-Sperren, Safe-Area, Meta-Tags
├── vite.config.js      baut alles in eine einzige index.html
├── public/             Icons, Manifest, Service Worker (werden nach dist/ kopiert)
├── src/
│   ├── main.jsx        Einstieg, Zurück-Taste, Service Worker
│   └── App.jsx         die gesamte App
└── dist/               ← fertige Webseite zum Hochladen
```
