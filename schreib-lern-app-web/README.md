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

**Gelöscht und neu installieren:** Browser zeigen ihren Hinweis „App installieren“
nach dem Löschen oft nicht mehr von selbst. Die App hat deshalb einen eigenen Knopf
**„📲 Installieren“** (unten auf der Startseite und im Elternbereich unter
„Als App installieren“), sobald Chrome oder Edge die Installation erlauben. Falls er
fehlt: Seite einmal neu laden. Der Service Worker holt bei jedem Start die neueste
Version vom Server, auch wenn der Webserver Dateien lange zwischenspeichert.

**Fortschritt:** Auf Android bleibt er im Browser gespeichert, auch wenn die App
gelöscht wird. Für einen Neuanfang: Elternbereich → „Fortschritt zurücksetzen“.
Auf iPhone/iPad löscht das Entfernen der App auch den Fortschritt.

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
- **Schreibrichtung:** Startpunkt, Reihenfolge und Richtung jedes Strichs
  folgen den Schreibrichtungs-Plakaten von Frau Locke (siehe unten). Runde
  Buchstaben (c, a, d, g, o, q) beginnen oben und laufen gegen den
  Uhrzeigersinn; O und o starten etwas rechts von der Spitze.
- **Spitze Buchstaben von unten:** A und Ä beginnen unten links mit einem
  Strich nach oben, M und N ebenso. M: hoch, schräg bis zur Grundlinie
  hinunter, schräg hoch, gerade hinunter. N: hoch, schräg hinunter, hoch.
- **T** zuerst der Stamm, dann das Dach. **G**: Bogen, kurzer Strich nach
  rechts, dann hinunter. **ß** beginnt im Keller.
- **h, n, m, r:** erst der Strich hinunter, dann zurück nach oben und den
  Bogen. Das Zurückfahren darf das Kind auch weglassen und den Bogen oben
  neu ansetzen.
- **Teilstriche in einem Zug:** Die Plakate nummerieren Teilstriche (z. B. L,
  M, N, V, W, Z, k). Das Kind darf sie einzeln schreiben oder ohne Absetzen in
  einem Zug. Beides zählt als richtig; falschherum oder am falschen Punkt
  angefangen wird weiterhin erkannt.
- **b und d** verwechselt man nicht mehr: b = erst Strich, dann Bauch;
  d = erst Bauch, dann Strich.
- **Punkte** (i, j, ä, ö, ü, Ä, Ö, Ü) werden mit einmal Antippen gesetzt.
- **Ziffern:** 1 ohne Fuß, 4 oben offen, 5 mit dem Hut zuletzt, 3 mit zwei
  runden Bäuchen, 9 = Kreis und Strich. (Die Plakate zeigen keine Ziffern,
  deshalb sind sie unverändert.)

Die Strichdaten stehen gesammelt in `src/App.jsx` (Abschnitt „STRICHDATEN")
und lassen sich dort anpassen, falls eure Schule einzelne Buchstaben anders
lehrt.

**Vorlage:** Als Orientierung dienten die Plakate „Schreibrichtung“ (bunt) von
Frau Locke. Sie liegen dem Projekt nicht bei: Ihre Lizenz erlaubt den Einsatz
im Unterricht, aber keine Weitergabe über Netzwerke oder Clouddienste. Wer sie
nutzen möchte, lädt sie direkt bei Frau Locke herunter.

## Bewertung: so entstehen die Sterne

- **Nachfahren:** gemessen direkt an der Vorlage im Feld: Wie nah liegt die Schrift an
  der Linie, wie viel der Vorlage ist abgefahren? Startpunkt und Richtung jedes Strichs
  prüft die App schon beim Schreiben.
- **Abschreiben, Aus dem Kopf, Wettbewerb (und Schreibtest der Studie):** Ohne Vorlage im
  Feld schreibt kaum ein Kind an genau derselben Stelle. Bewertet wird deshalb die
  **Form**: Die App legt die Vorlage zuerst an den Buchstaben des Kindes an (seitlich
  beliebig verschoben, Größe und Höhe in Grenzen, Breite leicht anders) und vergleicht
  erst dann. Eine Stelle gilt nur als getroffen, wenn die Linie dort in dieselbe
  Richtung läuft wie die Vorlage; Gekritzel bekommt so keine Sterne.
- **Zwei Stufen:**
  - *Lernen* (Abschreiben und Aus dem Kopf auf dem Lernweg): großzügig. Größe 62–170 %,
    mehr Toleranz, niedrigere Schwellen. Ein erkennbar richtiger Buchstabe bringt das
    Kind weiter, auch wenn er krakelig, schief oder zu groß ist.
  - *Genau* (Wettbewerb und Schreibtest der Studie): Größe 72–140 %, in der Höhe
    höchstens etwa eine Viertelzeile verschoben.
- **Weiter geht es ab zwei Sternen** (von drei). Früher waren es intern 4 von 5 Punkten;
  das sah für Kinder genauso aus wie 3 Punkte (beides zwei Sterne), sie kamen aber nicht
  weiter. In einem Test mit verzerrt geschriebenen Buchstaben (schief, zu groß, versetzt,
  wackelig, Striche treffen sich nicht) kamen beim Aus-dem-Kopf-Schreiben vorher 33 von 59
  Buchstaben weiter, jetzt alle 59.
- **Hinweise von Klecks** gibt es, wenn
  - der Buchstabe gespiegelt ist („Gespiegelt!“),
  - die Punkte fehlen (i, j, ä, ö, ü),
  - die Form stimmt, aber der Buchstabe viel zu klein oder zu groß ist (z. B. „o“ statt „O“)
    oder auf der falschen Zeile sitzt (z. B. „p“ statt „P“),
  - ein Teil fehlt (z. B. „F“ statt „E“) oder etwas zu viel ist (z. B. „E“ statt „F“,
    „h“ statt „n“).

  Beim Lernen sind das Tipps, das Kind kommt trotzdem weiter (höchstens zwei Sterne). Im
  Wettbewerb kosten sie Punkte. Nur ein gespiegelter Buchstabe zählt auch beim Lernen
  nicht (ein Stern), weil er ein anderer Buchstabe ist.
- **Anzeige:** Die grüne Vorlage liegt im Ergebnis dort, wo das Kind geschrieben hat. Die
  Sterne stehen unter dem Schreibfeld zwischen „Nochmal“ und „Weiter“; das Feld und seine
  Linien bleiben unverändert und nichts von der Schrift wird verdeckt.
- Code: `src/score.js`.

## Was die Forschung sagt – und wie die App es umsetzt

| Befund | Umsetzung in der App |
|---|---|
| Am wirksamsten: Buchstaben mit **nummerierten Pfeilen** ansehen und dann **aus dem Gedächtnis** schreiben, mit wachsender Merkzeit ([Berninger u. a. 1997](https://www.washington.edu/news/1998/01/30/in-spite-of-computers-handwriting-instruction-is-important-because-of-carry-over-to-composition/)) | **Lernweg pro Buchstabe:** 🖐️ Geführt → 👀 Abschreiben → 🧠 Aus dem Kopf. Ab zwei Sternen geht es eine Stufe weiter (⭐ zeigt den nächsten Schritt, die Lernkarte den Stand jedes Zeichens). Beim Aus-dem-Kopf-Schreiben: Vorlage mit Pfeilen zeigen, verstecken, Countdown von 1 s, später 3 s und 5 s. |
| Nur **selbst geschriebene** Buchstaben (nicht nachgefahrene oder getippte) aktivieren bei Kindern das Lese-Netzwerk im Gehirn ([James & Engelhardt 2012](https://pmc.ncbi.nlm.nih.gov/articles/PMC4274624)); Abschreiben baut genauere Buchstabenbilder auf als Tippen (Longcamp u. a. 2005, *Acta Psychologica*) | Nachfahren ist nur die erste Stufe; danach Abschreiben (Vorlage daneben, leeres Feld) und freies Schreiben. |
| Beim Nachfahren kann man **irgendwo anfangen** und falsche Bewegungen einüben ([OT Toolbox](https://www.theottoolbox.com/to-trace-or-not-to-trace/)) | **Startpunkt und Richtung** jedes Strichs werden geprüft. Ein falscher Strich wird zurückgenommen: „Andersherum! Fang beim gelben Punkt an.“ |
| **Ständiges Sofort-Feedback** verbessert das Lernen nicht ([Patchan & Puranik 2016](https://researchconnections.org/childcare/resources/32955)); zu viel Hilfe macht abhängig ([Guidance-Hypothese](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2016.00251/full)) | Grün/Rot nur beim Nachfahren. Beim Abschreiben und Aus-dem-Kopf-Schreiben gibt es erst danach einen **Vergleich mit der Vorlage**. |
| Mit dem **Finger** lernen Vorschulkinder auf dem Tablet besser als mit dem Stift (Patchan & Puranik 2016) | Größeres Schreibfeld, das sich an Handy und Tablet anpasst. |
| Kinder schreiben vor allem **nach links zeigende Zeichen spiegelverkehrt**: 1, 2, 3, 7, 9, J, Z ([Fischer & Tazouti 2012](https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2018.00375/full)) | **Spiegel-Erkennung** beim freien Schreiben: „🪞 Gespiegelt! Schau, in welche Richtung er zeigt.“ |
| **Verwechselbare Buchstaben** (b/d, p/q) nicht direkt nacheinander einführen ([Shanahan](https://www.readingrockets.org/blogs/shanahan-on-literacy/why-instructional-sequence-doesnt-always-matter)) | „Automatisch weiter“ folgt einem **Lernweg**: gleiche Bewegungen zusammen (Striche, Kreise, Bögen, Schrägen), b und d weit auseinander. |
| **Verteiltes, abrufendes Wiederholen** wirkt auch bei kleinen Kindern (z. B. [Haebig u. a. 2021](https://learninglab.psych.purdue.edu/downloads/2021/2021_Haebig_et_al_JSLHR.pdf)) | Im Menü erscheint **„🔁 Heute wiederholen“** mit Buchstaben, die vor über einem Tag geübt wurden. |
| Buchstabe, **Laut und Bild** zusammen lernen hilft beim Lesenlernen ([Bara, Gentaz u. a.](https://hal.archives-ouvertes.fr/hal-00733557)) | **Anlaut-Bilder** wie auf der Anlauttabelle („🐭 **M**aus“, vorgelesen als „Em, wie Maus“). Vorher passten einige Bilder nicht (U = 🦄 Einhorn, S = 🐍 Schlange). |

## Spieldesign: was Studien zu Gamification sagen

Gamification wirkt im Mittel positiv, aber nur in kleinem bis mittlerem Maß, und es
kommt darauf an, *welche* Spielelemente man nimmt ([Sailer & Homner 2020](https://doi.org/10.1007/s10648-019-09498-w):
g = 0,49 für Lernen, 0,36 für Motivation, 0,25 für Verhalten). Die App setzt deshalb
gezielt auf Elemente, die bei kleinen Kindern belegt sind, und lässt die
problematischen weg.

| Befund | Umsetzung in der App |
|---|---|
| **Personalisierung und Wahlfreiheit** bei Nebensächlichem (Name, Figur, Farben) steigern Motivation *und* Lernerfolg ([Cordova & Lepper 1996](https://doi.org/10.1037/0022-0663.88.4.715)) | Beim ersten Start sucht das Kind die Farbe von **Klecks** aus, dem Tintenklecks-Begleiter. Stift wählbar (🖍️, in allen Modi: Klassik, Blau, Lila, Türkis, später Glitzer und Regenbogen). Im „Klecks-Zimmer“ kann Klecks mehrere gefundene Sachen gleichzeitig tragen (Hut oder Krone, dazu Schleife, Blume, Brille). |
| **Lernbegleiter-Figuren** helfen wenig, aber messbar, bei Schulkindern mehr als bei Erwachsenen ([Schroeder, Adesope & Gilbert 2013](https://doi.org/10.2190/EC.49.1.a)) | Klecks gibt Hinweise und Lob in einer Sprechblase (auch vorgelesen) und zeigt mit seiner Mimik, ob es geklappt hat. |
| **Angekündigte Belohnungen** („Wenn du …, bekommst du …“) verdrängen die Freude an der Sache, **unerwartete** nicht; Lob als Information stärkt sie ([Deci, Koestner & Ryan 1999](https://doi.org/10.1037/0033-2909.125.6.627)) | Keine Zufalls-Kisten. Auf dem Spielbrett stehen **Schatztruhen**; eine Truhe geht auf, wenn alle Buchstaben davor mindestens zwei Sterne haben. *Was* drin ist (Glitzer-, Regenbogen-, Goldstift, Schleife, Hut, Krone, Blume, Brille, Umhang, Regenbogen-Klecks), bleibt bis zum Öffnen eine Überraschung. Die Truhe belohnt gutes Schreiben, nicht Zeit oder Zufall. |
| **Lob für den Weg, nicht für die Person** führt dazu, dass Kinder bei Fehlern dranbleiben ([Mueller & Dweck 1998](https://doi.org/10.1037/0022-3514.75.1.33); [Gunderson u. a. 2013](https://doi.org/10.1111/cdev.12064)) | Rückmeldungen wie „Jeden Strich am richtigen Punkt angefangen!“, „Du hast die Richtung verbessert!“, „Du hast nicht aufgegeben – so lernt man!“ statt „Du bist toll!“. Mit eingetragenem Namen spricht Klecks das Kind an: „Gut gemacht, Lale! Aus dem Kopf geschrieben!“ (das Lob gilt der Arbeit, der Name macht es persönlich; persönliche Ansprache war Teil der Personalisierung bei Cordova & Lepper). |
| Kinder sollen **viel schreiben** dürfen und dafür etwas bekommen; Überraschungen stärken die Freude, angekündigte Belohnungen fürs bloße Mitmachen können sie schwächen ([Deci, Koestner & Ryan 1999](https://doi.org/10.1037/0033-2909.125.6.627)) | **Fleißglas** (Startseite und Spielbrett): Jedes richtig geschriebene Zeichen (zwei Sterne beim Lernen, Wort-Buchstaben, Wettbewerb) wirft einen Stern ins Glas. Bei 8 Sternen geht eine **Überraschung** auf: neues Zubehör für Klecks (Zauberhut, Kopfhörer, Fliege, Zauberstab), Stifte (Feuer, Ozean, Neon), Klecks-Farben (Gold, Nachtblau) und 20 **Fleiß-Sticker** fürs Album. Belohnt wird das Schreiben, nicht Zeit oder Zufall; nichts geht verloren, es gibt keine Serien. Das Geschenk erscheint erst auf dem Spielbrett oder der Startseite, nie mitten im Schreiben. |
| **Vergleich mit sich selbst** (individuelle Bezugsnorm) statt mit anderen stärkt die Lernmotivation, besonders bei schwächeren Kindern (Rheinberg & Krug 2005, *Motivationsförderung im Schulalltag*, Hogrefe) | Der **Wettbewerb** ist eine freiwillige Herausforderung: Schwungübungen (Welle, Girlande, Arkade, Zickzack, Schleifen), der eigene Name und einfache Wörter. Dort zählt die genaue Bewertung: 0–100 Punkte, Medaille (Bronze ab 55, Silber ab 74, Gold ab 88) und der **eigene Rekord**. Keine Ranglisten. Beim Lernen der Buchstaben bleibt die Bewertung großzügig, damit niemand hängen bleibt. |
| Gute Lern-Apps sind **aktiv, bei der Sache, sinnvoll und sozial**. Effekte, die vom Lernen ablenken, schaden ([Hirsh-Pasek u. a. 2015](https://doi.org/10.1177/1529100615569721); [Meyer u. a. 2021](https://doi.org/10.1080/17482798.2021.1882516)) | Das Schreibfeld bleibt ruhig. Animationen gibt es nur außerhalb des Felds und nach dem Schreiben. Wer „Bewegung reduzieren“ eingestellt hat, bekommt keine. |
| Viele Kinder-Apps arbeiten mit **manipulativen Mustern**: Druck durch Figuren, Zeitdruck, Lockangebote, Autoplay ([Radesky u. a. 2022](https://doi.org/10.1001/jamanetworkopen.2022.17641)). Kinder sollen nicht zu längerer Nutzung gedrängt werden ([ICO Age Appropriate Design Code, Standard 13](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/)) | Keine Serien („Streaks“), die abreißen, kein „Komm zurück!“, keine Zeitlimits, keine Verluste. **Tagesziel**: 3 Zeichen, danach sagt Klecks ausdrücklich, dass jetzt Pause sein darf. Automatisches Weiterspringen ist aus; das Kind tippt selbst auf „Weiter ➜“. |
| Ein klares **Spielziel** mit sichtbarem Fortschritt und freier Wahl (Autonomie und Kompetenz) | **Drei Welten** (Buchstaben-Berg ABC, Buchstaben-Wald abc, Zahlen-Insel 123), jede ein **Spielbrett**: Jeder Buchstabe ist ein Level mit bis zu **drei Sternen**. Die Farbe des Steins zeigt die Lernstufe (hell: geübt, kräftig: aus dem Kopf, gold: sitzt). Nach jedem Level geht es zurück aufs Brett, Klecks **hüpft zum nächsten Stein**, die neuen Sterne fliegen in den Zähler. Nichts ist gesperrt. Eine kleine Geschichte gibt den Rahmen: Klecks' Buchstaben sind verstreut, das Kind sammelt sie durch Schreiben. |
| Viele verschiedene, bunte Bildchen lenken ab | Ein **ruhiger, einheitlicher Symbolsatz** statt Emojis in Knöpfen, Überschriften und Sprechblasen. Emojis bleiben nur dort, wo sie Lerninhalt sind (Anlaut-Bild „Maus“, Wortbilder) und als Sticker. |

**Ablauf:** Startseite → „Spielen“ startet das nächste Level → Ergebnis mit Sternen →
„Weiter“ führt aufs Spielbrett → „Los“ startet das nächste Level. Der **Wettbewerb**
(Pokal auf der Startseite) ist eine freiwillige Herausforderung mit Medaillen. Die **Sammlung**
enthält Klecks' Kleiderschrank und Stifte, das Sticker-Album und eine Übersicht aller
Buchstaben mit ihren Sternen (ersetzt den früheren Garten). Insgesamt gibt es 19 Schätze
(10 aus den Truhen, 9 aus dem Fleißglas) und 20 Fleiß-Sticker.

Weitere Änderungen: runde, gut lesbare Schrift **Nunito** (in die App eingebettet,
keine Verbindung zu Google), große „drückbare“ Knöpfe, kurze leise Töne (abschaltbar
mit 🎵), neues App-Symbol mit Klecks.

Im Elternbereich lassen sich Töne sowie Überraschungen und Effekte ausschalten. Das
Tagesziel-Ende und das Lob bleiben, weil sie zum Lernen gehören.

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
- Spielelemente (Klecks, Sterne, Tagesziel, Schatztruhen) sind in beiden Studiengruppen
  gleich; sie hängen an den Sternen, nicht an der Lernstufe.
  Der Schreibtest bleibt neutral: ohne Klecks, Töne, Effekte und Rückmeldung.
  Das Design vor Studienbeginn nicht mehr ändern, damit alle Kinder dieselbe App nutzen.
- Jede Sitzung speichert `app_version`. Ab **2.1** folgen die Strichvorlagen den
  Schreibrichtungs-Plakaten; die Teilstrich-Nummern (`expected_idx`) sind deshalb nicht
  mit Daten aus Version 2.0 vergleichbar. Ebenfalls ab 2.1 werden `accuracy`, `coverage`,
  `score_raw` und `stars` beim freien Schreiben (Abschreiben, Aus dem Kopf, Schreibtest)
  nach dem Anlegen der Vorlage berechnet (unabhängig von Lage und Größe, mit
  Richtungsvergleich, siehe „Bewertung“); auch diese Werte nicht mit 2.0 vergleichen.
  Ab **2.2** bewertet die App das Üben großzügiger (Stufe *Lernen*) und lässt Kinder ab
  zwei Sternen weiter; der Schreibtest behält die Stufe *Genau*. Übungswerte aus 2.1 und
  2.2 deshalb nicht direkt vergleichen.
- Der **Wettbewerb** wird nicht an die Studie gemeldet. Kinder der Wartekontrollgruppe
  fahren dort nach (wie überall bis zum Studienende), statt abzuschreiben.
- Der **Name des Kindes** bleibt auf dem Gerät und wird nie gesendet.

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
│   ├── App.jsx         die App: Schrift, Schreibfeld, Welten, Lernkarte, Elternbereich
│   ├── klecks.jsx      der Begleiter Klecks (Figur, Mimik, Sprechblase)
│   ├── sound.js        kurze Töne, im Browser erzeugt
│   ├── install.js      Knopf „App installieren“ und Hinweise je nach Gerät
│   ├── icons.jsx       einheitliche Symbole, Welt-Bilder, Schatztruhe
│   ├── score.js        Bewertung: Nachfahren und frei Geschriebenes (Form statt Stelle)
│   └── research.js     Forschungsmodus: Messung, Warteschlange, Upload
└── dist/               ← fertige Webseite zum Hochladen
```
