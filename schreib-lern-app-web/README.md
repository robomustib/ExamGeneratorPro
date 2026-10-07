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

## Schrift: Deutsche Druckschrift (Grundschule)

Die Buchstaben folgen der Druckschrift, wie sie in deutschen Grundschulen
geübt wird:

- **Vierliniensystem** mit Ober-, Mittel-, Grund- und Unterlinie. Kleinbuchstaben
  stehen im Mittelband („Erdgeschoss"), Unterlängen (g j p q y) reichen in den
  „Keller", Oberlängen (b d f h k l t) bis unter das „Dach".
- **Runde Formen** sind echte Kreise und Bögen (B, D, P, R, S, a, b, …).
- **Schreibrichtung:** von oben nach unten, von links nach rechts; runde
  Buchstaben (c, a, d, g, o, q) oben beginnen und gegen den Uhrzeigersinn.
- **b und d** verwechselt man nicht mehr: b = erst Strich, dann Bauch;
  d = erst Bauch, dann Strich.
- **Ziffern:** 1 ohne Fuß, 4 oben offen, 5 mit dem Hut zuletzt, 3 mit zwei
  runden Bäuchen, 9 = Kreis und Strich.

Die Strichdaten stehen gesammelt in `src/App.jsx` (Abschnitt „STRICHDATEN")
und lassen sich dort anpassen, falls eure Schule einzelne Buchstaben anders
lehrt.

## Was die Forschung sagt – und wie die App es umsetzt

| Befund | Umsetzung in der App |
|---|---|
| Am wirksamsten: Buchstaben mit **nummerierten Pfeilen** ansehen und dann **aus dem Gedächtnis** schreiben, mit wachsender Merkzeit ([Berninger u. a. 1997](https://www.washington.edu/news/1998/01/30/in-spite-of-computers-handwriting-instruction-is-important-because-of-carry-over-to-composition/)) | **Lernweg pro Buchstabe:** 🖐️ Geführt → 👀 Abschreiben → 🧠 Aus dem Kopf. Ab 4 Sternen geht es eine Stufe weiter (⭐ zeigt den nächsten Schritt). Beim Aus-dem-Kopf-Schreiben: Vorlage mit Pfeilen zeigen, verstecken, Countdown von 1 s, später 3 s und 5 s. |
| Nur **selbst geschriebene** Buchstaben (nicht nachgefahrene oder getippte) aktivieren bei Kindern das Lese-Netzwerk im Gehirn ([James & Engelhardt 2012](https://pmc.ncbi.nlm.nih.gov/articles/PMC4274624)); Abschreiben baut genauere Buchstabenbilder auf als Tippen (Longcamp u. a. 2005, *Acta Psychologica*) | Nachfahren ist nur die erste Stufe; danach Abschreiben (Vorlage daneben, leeres Feld) und freies Schreiben. |
| Beim Nachfahren kann man **irgendwo anfangen** und falsche Bewegungen einüben ([OT Toolbox](https://www.theottoolbox.com/to-trace-or-not-to-trace/)) | **Startpunkt und Richtung** jedes Strichs werden geprüft. Ein falscher Strich wird zurückgenommen: „Andersherum! Fang beim gelben Punkt an.“ |
| **Ständiges Sofort-Feedback** verbessert das Lernen nicht ([Patchan & Puranik 2016](https://researchconnections.org/childcare/resources/32955)); zu viel Hilfe macht abhängig ([Guidance-Hypothese](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2016.00251/full)) | Grün/Rot nur beim Nachfahren. Beim Abschreiben und Aus-dem-Kopf-Schreiben gibt es erst danach einen **Vergleich mit der Vorlage**. |
| Mit dem **Finger** lernen Vorschulkinder auf dem Tablet besser als mit dem Stift (Patchan & Puranik 2016) | Größeres Schreibfeld, das sich an Handy und Tablet anpasst. |
| Kinder schreiben vor allem **nach links zeigende Zeichen spiegelverkehrt**: 1, 2, 3, 7, 9, J, Z ([Fischer & Tazouti 2012](https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2018.00375/full)) | **Spiegel-Erkennung** beim freien Schreiben: „🪞 Gespiegelt! Schau, in welche Richtung er zeigt.“ |
| **Verwechselbare Buchstaben** (b/d, p/q) nicht direkt nacheinander einführen ([Shanahan](https://www.readingrockets.org/blogs/shanahan-on-literacy/why-instructional-sequence-doesnt-always-matter)) | „Automatisch weiter“ folgt einem **Lernweg**: gleiche Bewegungen zusammen (Striche, Kreise, Bögen, Schrägen), b und d weit auseinander. |
| **Verteiltes, abrufendes Wiederholen** wirkt auch bei kleinen Kindern (z. B. [Haebig u. a. 2021](https://learninglab.psych.purdue.edu/downloads/2021/2021_Haebig_et_al_JSLHR.pdf)) | Im Menü erscheint **„🔁 Heute wiederholen“** mit Buchstaben, die vor über einem Tag geübt wurden. |
| Buchstabe, **Laut und Bild** zusammen lernen hilft beim Lesenlernen ([Bara, Gentaz u. a.](https://hal.archives-ouvertes.fr/hal-00733557)) | **Anlaut-Bilder** wie auf der Anlauttabelle („🐭 **M**aus“, vorgelesen als „Em, wie Maus“). Vorher passten einige Bilder nicht (U = 🦄 Einhorn, S = 🐍 Schlange). |

## Forschungsmodus (für Studien)

Die App enthält einen eingebauten, standardmäßig **ausgeschalteten** Forschungsmodus.
Er misst nach Einwilligung der Eltern und Zustimmung des Kindes Reaktionszeiten,
Schreibdauer, Genauigkeit, Form- und Spiegelfehler und lädt sie pseudonym in eine
MySQL-Datenbank. Dazu gehören ein Schreibtest (Vortest, Nachtest, Follow-up) und eine
randomisierte Wartekontrollgruppe.

- App-Seite: `src/research.js`, Einwilligung im Elternbereich unter „🔬 Forschung“
- Server-Seite: `public/forschung/` (wird nach `dist/forschung/` kopiert):
  `api.php`, `lib.php`, `setup.php`, `export.php`, `schema.sql`, `config.sample.php`,
  `config.json`, `elterninfo.html` — Anleitung zum Hochladen in `forschung/README.md`
- Alle Tabellen tragen das Präfix `sl_` (einstellbar in `config.php`), damit sie neben
  anderen Tabellen in derselben Datenbank liegen können. `setup.php` prüft die
  Einrichtung im Browser und legt die Tabellen per Knopf an.
- Einschalten: `forschung/config.json` → `"enabled": true` (erst nach Ethikvotum und
  Datenschutzprüfung). Ohne Server oder bei `false` sendet die App nichts.

Forschungsdesign, Datenschutzkonzept und Einrichtung stehen im Dokument
„Forschungsdesign und Datenschutzkonzept: Schreib & Lern“.

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
│   └── forschung/      Server-Teil des Forschungsmodus (PHP, SQL, Elterninformation)
├── src/
│   ├── main.jsx        Einstieg, Zurück-Taste, Service Worker
│   ├── App.jsx         die gesamte App
│   └── research.js     Forschungsmodus: Messung, Warteschlange, Upload
└── dist/               ← fertige Webseite zum Hochladen
```
