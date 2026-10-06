<?php
// ═══════════════════════════════════════════════════════════════════════════
// Vorlage für die Server-Konfiguration des Forschungsmodus.
// Kopieren nach config.php und ausfüllen. config.php nie öffentlich teilen.
// Besser: config.php außerhalb des Webverzeichnisses ablegen und den Pfad
// in api.php / export.php anpassen.
// ═══════════════════════════════════════════════════════════════════════════
return [
    // Datenbank (beim Hoster angelegt)
    'db_dsn'  => 'mysql:host=localhost;dbname=schreiblern_studie;charset=utf8mb4',
    'db_user' => 'studie_app',          // nur SELECT, INSERT, DELETE auf die Studientabellen
    'db_pass' => 'HIER-PASSWORT',

    // Muss zu "studyId" in config.json passen
    'study_id' => 'slk-2026',

    // Gruppen der Studie. Ein Eintrag = keine Randomisierung (Beobachtungsstudie).
    'groups' => ['lernweg', 'nachfahren'],

    // Geheimer Schlüssel für die Blockrandomisierung (mind. 32 zufällige Zeichen).
    // Verhindert, dass jemand die nächste Zuteilung vorhersagen kann.
    'allocation_secret' => 'HIER-LANGEN-ZUFALLSTEXT-EINTRAGEN',

    // Adressen, von denen die App laufen darf (ohne Schrägstrich am Ende)
    'allowed_origins' => ['https://www.deine-domain.de'],

    // Zugang für den Datenexport (export.php). Langes, eigenes Passwort verwenden.
    // Alternativ 'export_password_hash' => password_hash('…', PASSWORD_DEFAULT)
    'export_user'     => 'forschung',
    'export_password' => 'HIER-EXPORT-PASSWORT',

    // Grenzen gegen Missbrauch
    'max_request_bytes'   => 2000000,   // 2 MB pro Upload
    'max_trials_per_day'  => 3000,      // pro Teilnahmecode
];
