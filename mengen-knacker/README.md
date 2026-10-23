# Blitz-Mengen-Knacker 2.3

Ein Lernspiel für Kinder von 5 bis 7 Jahren, die Mengen bis 10 auf einen Blick erfassen lernen sollen, statt jedes Ding einzeln abzuzählen. Wer das sicher kann, rechnet danach in der Rechen-Stufe Plus und Minus bis 20, ebenfalls ohne Abzählen.
Alle Daten bleiben im Browser des Geräts (localStorage). Es wird nichts verschickt.

## Was drin ist (7 Dateien)

- `index.html`: die komplette App in einer einzigen Datei. Sie braucht keine Bibliothek (reines JavaScript) und kein Internet, auch die Schriften sind eingebettet. Zum Ausprobieren kannst du sie per Doppelklick öffnen.
- `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`: Damit lässt sich die Seite auf Handy oder Tablet wie eine App installieren. In Chrome geht das über ⋮ → „App installieren“, auf dem iPhone/iPad in Safari über Teilen → „Zum Home-Bildschirm“. Sie startet dann im Vollbild mit eigenem Icon und läuft nach dem ersten Aufruf auch ohne Internet.

Installieren und Offline-Modus gehen nur, wenn der Webserver HTTPS hat. Alle 7 Dateien kommen in denselben Ordner. Nach Änderungen an den Dateien in `sw.js` die Versionsnummer (`CACHE`) erhöhen, damit installierte Geräte die neue Version laden.

## Spiele

| Spiel | Was geübt wird | Ab wann |
|---|---|---|
| Blitzblick | Menge kurz sehen, Zahl tippen (Zehnerfeld, Würfelbilder, Fingerbilder, Marienkäfer, Äpfel, Punktewolke) | sofort |
| Zahl findet Menge | Zahl hören und sehen, passendes Mengenbild finden | sofort |
| Wer hat mehr? | Ziffern, Punktmengen und gemischt vergleichen | sofort |
| Zahlenstrahl | „Wo wohnt die 7?“ auf dem Strahl 0–10 antippen | ab 20 Sternen |
| Wie viele fehlen? | Zehner- bzw. Fünferpartner im Zehnerfeld | ab 45 Sternen, nur Lernstufe 2 |
| Rechnen | Plus und Minus bis 10, dann bis 20 mit Zehnerübergang | ab Rechen-Reife (siehe unten) |

Das Kind kann eine gemischte Runde („Los geht’s!“) oder ein einzelnes Spiel wählen. Aufgaben werden vorgelesen (Web Speech API, deutsche Stimme), damit Kinder ohne Lesekenntnisse allein spielen können.

## Zwei Lernstufen

- **Stufe 1 – Mengen erfassen (Standard):** nur eine Farbe und eine Sorte (nur rote Plättchen, nur Äpfel), echte Würfelbilder bis 6, ungeordnete Punkte nur bis 5. Bei Fehlern leuchten die Dinge nacheinander auf („… sechs, sieben. Das sind sieben.“).
- **Stufe 2 – Strukturen und Zerlegen:** Kraft der 5 in Rot/Blau, Würfelpaare mit wechselnden Zerlegungen (6+1, 5+2, 4+3 …), Punktgruppen, „Wie viele fehlen?“ und Erklärungen wie „5 und 2 sind 7“. Das ist schon der Übergang zum Rechnen.

## Lern-Steuerung über die Reaktionszeit

1. Jede Antwort wird nach Richtigkeit und Zeit (ab Erscheinen des Bildes) eingeordnet: blitzschnell richtig, richtig, richtig aber langsam (wahrscheinlich gezählt), zu schnell geraten, falsch, „Weiß nicht“.
2. Die Zeitgrenzen sind persönlich: Als Grundtempo gilt der Median der richtigen Antworten auf 1–3 Dinge. Für größere Mengen kommt ein kleiner Zuschlag pro Ding dazu.
3. Die Auswahl der Aufgaben folgt einem Elo-Verfahren wie im niederländischen Rekentuin: Fähigkeit pro Spiel und Schwierigkeit pro Aufgabe werden nach jeder Antwort angepasst. Ausgewählt werden Aufgaben, die mit etwa 80 % Wahrscheinlichkeit gelingen. Langsame, gezählte Treffer zählen nur zu 60 %. So bleibt das Spiel bei einer Menge, bis sie ohne Zählen erkannt wird.
4. Die Zeigezeit wird pro Menge als Treppe geführt: Start bei 4 s (Vorschule 5 s). Nach drei blitzschnellen Treffern in Folge wird sie eine Stufe kürzer (bis minimal 1,1 s), nach einem Fehler wieder länger.
5. Fehler werden erklärt und die Menge kommt zwei Aufgaben später noch einmal. Nach zwei Fehlern in Folge kommen leichtere Aufgaben. Bei häufigem Raten sind die Tasten kurz gesperrt. Jede Runde endet mit einer lösbaren Aufgabe.
6. Dem Kind wird kein Countdown gezeigt und es gibt kein „Zeit vorbei“.

Im **Eltern-Bereich** (Startbildschirm → „Für Eltern“, kleine Rechenaufgabe als Sperre) gibt es Übungstage, den Verlauf pro Runde, ein Mengen-Profil mit Reaktionszeit pro Menge, die „Zähl-Steigung“ ab 4 Dingen, häufige Verwechslungen, Empfehlungen für zu Hause sowie alle Einstellungen. Der Reiter „Rechnen“ zeigt den Weg zur Rechen-Reife, die Phase und den Stand jeder Aufgabenart, die Zähl-Steigung beim Rechnen und passende Ideen für zu Hause.

## Forschungsgrundlage (Auswahl)

- Ennemoser, Sinner, Nguyen & Krajewski (2024). Training der Mengen-Zahlen-Kompetenzen bei Erstklässlern mit Risiko: Transfer auf die Schulleistung nach 6 und 15 Monaten. *Frontiers in Psychology.* https://doi.org/10.3389/fpsyg.2024.1380036
- Lüken (2012). Young children’s structure sense. Struktursinn zu Schulbeginn sagt Rechenleistung Ende Klasse 2 vorher.
- Obersteiner, Reiss & Ufer (2013). Computertraining mit strukturierten Punktmustern bzw. Mengenschätzen bei 147 Erstklässlern. *Learning and Instruction, 23*, 125–135.
- Siegler & Ramani (2008, 2009). Lineare Zahlen-Brettspiele verbessern Zahlenstrahl, Vergleich, Zählen und Ziffernkenntnis.
- Schneider et al. (2017). Metaanalyse: symbolischer Größenvergleich hängt stärker mit Mathematikleistung zusammen (r = .30) als nichtsymbolischer (r = .24). *Developmental Science.*
- Gracia-Bafalluy & Noël (2008). Fingertraining verbessert Zählen und Simultanerfassung. *Cortex.*
- Klinkenberg, Straatemeier & van der Maas (2011). Rekentuin/Math Garden: Elo mit Antwortzeit und Richtigkeit. *Computers & Education.* https://doi.org/10.1016/j.compedu.2011.02.003
- Käser et al. (2013). Calcularis: adaptives Training für Kinder mit Rechenschwierigkeiten. *Frontiers in Psychology.* https://doi.org/10.3389/fpsyg.2013.00489
- Wilson, Shenhav, Straccia & Cohen (2019). The Eighty Five Percent Rule for optimal learning. *Nature Communications.* https://doi.org/10.1038/s41467-019-12552-4
- Benavides-Varela et al. (2020). Metaanalyse digitaler Förderung bei Rechenschwierigkeiten (ES = 0,55). *Computers & Education.*
- Ramirez, Gunderson, Levine & Beilock (2013). Mathe-Angst schon in Klasse 1–2. *Journal of Cognition and Development.*

## Rechen-Stufe (Klasse 1)

Rechnen ohne Abzählen baut auf zwei Fähigkeiten auf: Mengen bis 10 auf einen Blick erkennen und Mengen zerlegen. Die Rechen-Stufe schaltet sich deshalb am Ende einer Runde von selbst frei, sobald mindestens 8 der Mengen 1–10 im Blitzblick blitzschnell erkannt werden (keine unsicher) und „Wie viele fehlen bis 10?“ in den letzten 15 Aufgaben zu mindestens 80 % gelingt. Eltern können sie im Reiter „Rechnen“ auch vorher freischalten.

- **Aufgabenarten nach Rechenweg:** Plus 1, Plus 2, Verdoppeln, Fast verdoppeln, Zehnerpartner, Kraft der 5; Minus 1, Minus 2, Halbieren, Von 10 weg, Mit der 5, Ergänzen; bis 20: Zehn und Einer, Analogieaufgaben, Verdoppeln bis 20, Plus 9, Zehnerübergang plus und minus. Jede Aufgabenart hat eine eigene Erklärung (z. B. „8 + 2 = 10, dann noch 3: 13“) und die passenden Rahmen im Bild.
- **Stufen:** Plus bis 10 → Plus und Minus bis 10 (wenn 4 von 6 Plus-Arten im Kopf gelingen, frühestens nach 60 Aufgaben) → bis 20 (wenn 9 von 12 Aufgabenarten im Kopf gelingen, frühestens nach 200 Aufgaben). Dazu müssen zuletzt mindestens 80 % stimmen. Ältere Aufgaben kommen zur Wiederholung immer wieder dran, und Rechenblöcke wechseln sich in „Los geht’s!“ mit Mengen-Spielen ab.
- **Vom Bild in den Kopf (Vierphasenmodell):** Für jede Aufgabenart gibt es drei Phasen. Zuerst bleiben Aufgabe und Plättchenbild stehen (rot = erste Zahl, blau = zweite, bei Minus durchgestrichen). Dann ist das Bild 3 Sekunden zu sehen und wird zugedeckt. Am Ende stehen nur noch die Zahlen da. Drei schnelle richtige Antworten bringen eine Phase weiter, ein Fehler oder zwei gezählte Antworten eine zurück. Bis 10 gibt es ein Zehnerfeld, Würfelpaare und Fingerbilder, bis 20 zwei Zehnerfelder untereinander und ein Tastenfeld 1–20 in derselben Anordnung.
- **Reaktionszeit:** Mit Bild gilt eine Antwort als blitzschnell, wenn das Ergebnis strukturiert gesehen wurde. Ohne Bild heißt blitzschnell: abgerufen oder abgeleitet. „Gezählt“ heißt richtig, aber so langsam wie beim Weiterzählen, also abhängig von der kleineren Zahl (MIN-Modell). Dann zeigt das Spiel den kürzeren Rechenweg. Im Eltern-Bereich zeigt die „Zähl-Steigung“ (Sekunden pro Schritt der kleineren Zahl), ob noch weitergezählt wird.
- **Studie:** Während der Studienteilnahme bleibt die Rechen-Stufe aus, damit die Studie nur das Erfassen von Mengen misst.

Grundlagen: Wartha & Schulz (2012), Vierphasenmodell; PIKAS/DZLM, Nicht-zählendes Rechnen; Gaidoschik (2012), *Journal für Mathematik-Didaktik 33*; Baroody, Eiland, Purpura & Reid (2013), *American Educational Research Journal*; Groen & Parkman (1972), *Psychological Review 79*; Siegler (1987), *Journal of Experimental Psychology: General 116*; Rohrer, Dedrick, Hartwig & Cheung (2020), *Journal of Educational Psychology*; Lehrerfortbildung Baden-Württemberg, Lernband 1.7. Die Schwellen und Zeitgrenzen sind fachlich begründet, aber nicht empirisch geeicht.

Das Spiel ersetzt keine Diagnose. Wenn nach 6–8 Wochen regelmäßigen Übens kaum Fortschritte sichtbar sind, lohnt ein Gespräch mit der Lehrkraft.

## Studienmodus (optional)

Für eine wissenschaftliche Studie kann die App Antworten und Reaktionszeiten pseudonym in eine MySQL-Datenbank hochladen. Ohne Server-Einrichtung und ohne Einwilligung bleibt alles wie bisher auf dem Gerät.

- `api/study.php`: Schnittstelle (info, enrol, upload, mydata, withdraw), PHP 8.0+ mit pdo_mysql
- `api/schema.sql`: Tabellen und Auswertungssichten (MySQL 8 / MariaDB 10.5+)
- `api/config.sample.php`: Vorlage für `api/config.php` (Zugangsdaten, Studientexte, Zeitplan, Faktor B an/aus)
- `api/.htaccess`: sperrt Konfiguration und Schema (Apache)

Nach dem Hochladen prüft `https://…/api/study.php?action=status`, ob Datenbank, Tabellen und Konfiguration stimmen. Die Seite meldet `"ok": true` oder nennt den Fehler.

Ablauf in der App: Eltern-Bereich → Reiter „Studie“ → Teilnahmeinformation, Einwilligung, Angaben zum Kind → Zustimmung des Kindes → Teilnahme-Code. Danach Mengen-Checks an Tag 0, 14, 28, 56 und 84, dazwischen normales Üben. Die Gruppe (adaptive oder statische Lern-Steuerung, Lernstufe basal zuerst oder Struktur von Anfang an) teilt der Server zufällig zu. Widerruf mit oder ohne Löschung und der Download der eigenen Daten sind im selben Reiter möglich. Nach dem letzten Check endet die Studie automatisch.

Erfasst werden keine Namen, E-Mail-Adressen, Geburtsdaten, IP-Adressen oder Geräte-Kennungen. Vor dem Start sind Ethikvotum, Datenschutz-Folgenabschätzung und Auftragsverarbeitungsvertrag nötig. Forschungsdesign und Datenschutzkonzept stehen im Begleitdokument.

## Für Entwickler

In der Browser-Konsole ist `window.BlitzMengen` verfügbar (Daten, Aufgabenbank, Klassifikation, Profil), z. B. `BlitzMengen.profileNumbers()` oder `BlitzMengen.calc.ready()`.
