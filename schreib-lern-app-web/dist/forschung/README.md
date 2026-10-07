# Forschungsmodus auf dem eigenen Webserver einrichten

Alle Tabellen beginnen mit **`sl_`** (z. B. `sl_participants`, `sl_trials`). Die
Studie kann deshalb in einer Datenbank liegen, in der schon andere Tabellen
stehen, etwa von WordPress.

## 1. Hochladen

Den **gesamten Inhalt** der ZIP-Datei per FTP/SFTP (z. B. FileZilla) oder mit dem
Dateimanager des Hosters in den Zielordner kopieren, z. B. `/schreiben/`:

```
index.html, manifest.webmanifest, sw.js, icon-*.png, icon.svg
forschung/   ← mit der versteckten Datei .htaccess
```

In FileZilla versteckte Dateien einblenden: Server → „Anzeige versteckter Dateien erzwingen“.

## 2. Datenbank

Beim Hoster eine MySQL-Datenbank anlegen oder eine vorhandene nutzen. Notieren:
Servername (oft `localhost`), Datenbankname, Benutzer, Passwort.

## 3. config.php

`forschung/config.sample.php` kopieren, die Kopie `config.php` nennen und ausfüllen:

| Eintrag | Beispiel |
|---|---|
| `db_dsn` | `mysql:host=localhost;dbname=DEINE_DB;charset=utf8mb4` |
| `db_user`, `db_pass` | Zugangsdaten vom Hoster |
| `table_prefix` | `sl_` (so lassen) |
| `allowed_origins` | `['https://www.deine-domain.de']` — genau so, wie die Adresse im Browser steht, ohne Pfad |
| `allocation_secret` | mindestens 32 zufällige Zeichen |
| `export_user`, `export_password` | eigener Benutzername und langes Passwort für Export und Einrichtung |

## 4. Einrichten im Browser

`https://www.deine-domain.de/schreiben/forschung/setup.php` öffnen und mit
`export_user` / `export_password` anmelden. Die Seite prüft PHP, HTTPS,
Konfiguration und Datenbank. Alles, was rot ist, beheben, dann auf
**„Tabellen mit Präfix sl_ anlegen“** klicken.

Alternativ: `forschung/schema.sql` in phpMyAdmin unter „Importieren“ einspielen.

Danach `setup.php` löschen (oder umbenennen).

## 5. Einschalten

In `forschung/config.json` die Kontakt-E-Mail eintragen. `"enabled": false`
bleibt so, bis Ethikvotum und Datenschutzprüfung vorliegen. Für einen eigenen
Probelauf kurz `true` setzen, ausprobieren und die Testdaten danach löschen:

```sql
DELETE FROM sl_participants;
DELETE FROM sl_allocations;
```

## 6. Daten abrufen

`forschung/export.php` öffnen, anmelden, Tabelle wählen → CSV-Datei.

## Voraussetzungen

PHP ab 8.1 mit `pdo_mysql`, MySQL ab 8.0 oder MariaDB ab 10.5, HTTPS.
Auf nginx-Servern wirkt `.htaccess` nicht: dann `config.php`, `lib.php` und
`schema.sql` beim Hoster sperren lassen.
