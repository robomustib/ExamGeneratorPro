<?php
// Blitz-Mengen-Knacker – Konfiguration der Studie
// Diese Datei als config.php speichern und alle Werte anpassen.
// config.php gehört nicht ins öffentliche Repository und ist per .htaccess gesperrt.

return [
    'db' => [
        'dsn'  => 'mysql:host=localhost;dbname=mengenstudie;charset=utf8mb4',
        'user' => 'mengen_app',          // eigener Benutzer nur mit SELECT, INSERT, UPDATE, DELETE auf diese Datenbank
        'pass' => 'BITTE-AENDERN',
    ],

    // Langer Zufallswert (z. B. 64 Zeichen) für das Audit-Log. Einmal festlegen, nie ändern.
    'pepper' => 'BITTE-LANGEN-ZUFALLSWERT-EINTRAGEN',

    'study' => [
        'enrol_open'       => false,    // erst nach Ethikvotum und DSFA auf true setzen
        'title'            => 'Mengen sehen statt zählen',
        'summary'          => 'Wie lernen Kinder, Mengen bis 10 auf einen Blick zu erkennen, und welche Variante der Lern-Steuerung hilft dabei am meisten?',
        'institution'      => 'Name der Hochschule, Anschrift',
        'lead'             => 'Name der Studienleitung',
        'contact_email'    => 'studie@example.org',
        'dpo'              => 'Datenschutzbeauftragte der Hochschule, Anschrift, E-Mail',
        'authority'        => 'Zuständige Datenschutz-Aufsichtsbehörde, Anschrift',
        'ethics'           => 'Ethikkommission …, Votum Nr. … vom …',
        'privacy_url'      => '',       // optional: Link zur vollständigen Datenschutzerklärung
        'retention'        => 'Die pseudonymen Daten werden 10 Jahre nach Veröffentlichung der Ergebnisse gelöscht.',
        'consent_version'  => '1.0',    // bei jeder Änderung der Texte erhöhen
        'factorial'        => true,     // false: nur Faktor A, alle Kinder „basal zuerst“
        'check_exposure_ms'=> 2000,     // Zeigezeit im Mengen-Check
        'stage_switch_day' => 28,       // Wechsel auf Lernstufe 2 in der Gruppe „basal zuerst“
        'schedule'         => [         // Mengen-Checks: Tag nach Anmeldung und Zeitfenster in Tagen
            ['id' => 'T0', 'day' => 0,  'window' => 3650],
            ['id' => 'T1', 'day' => 14, 'window' => 6],
            ['id' => 'T2', 'day' => 28, 'window' => 6],
            ['id' => 'T3', 'day' => 56, 'window' => 6],
            ['id' => 'T4', 'day' => 84, 'window' => 6],
        ],
    ],

    // Nur nötig, wenn App und Schnittstelle auf verschiedenen Domains liegen, z. B. ['https://app.example.org'].
    'allowed_origins' => [],

    'max_body_bytes' => 524288,
];
