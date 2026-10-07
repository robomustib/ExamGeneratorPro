<?php
// ═══════════════════════════════════════════════════════════════════════════
// Datenexport für die Auswertung (nur für das Studienteam)
// Aufruf im Browser:  https://…/forschung/export.php
//   ?table=probe          Schreibtest (eine Zeile pro Aufgabe, mit Gruppe und Alter)
//   ?table=trials         alle Schreibversuche
//   ?table=strokes        alle Striche
//   ?table=sessions       Sitzungen
//   ?table=participants   Teilnehmende (ohne Schlüssel-Hash)
//   ?table=practice_days  Übungsmenge pro Kind und Tag
//   ?table=traces         Schreibspuren (JSON pro Zeile)
// Geschützt mit Benutzername und Passwort aus config.php.
// Exporte enthalten pseudonyme Daten: verschlüsselt speichern, nicht weitergeben.
// ═══════════════════════════════════════════════════════════════════════════
declare(strict_types=1);

require __DIR__ . '/lib.php';
require_team_login();

$tables = [
    'probe'         => 'SELECT * FROM {p}v_probe ORDER BY pid, wave, seq',
    'trials'        => 'SELECT * FROM {p}trials ORDER BY pid, day_index, seq',
    'strokes'       => 'SELECT * FROM {p}strokes ORDER BY tid, idx',
    'sessions'      => 'SELECT * FROM {p}sessions ORDER BY pid, started_on',
    'participants'  => 'SELECT pid, study_id, grp, stratum, enrolled_on, consent_version, consent_traces, age_months,
                        grade, handedness, home_lang, gender FROM {p}participants ORDER BY enrolled_on, pid',
    'practice_days' => 'SELECT * FROM {p}v_practice_per_day ORDER BY pid, day_index',
    'traces'        => 'SELECT * FROM {p}traces ORDER BY tid, idx',
];
$table = $_GET['table'] ?? '';

if (!isset($tables[$table])) {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><title>Studiendaten</title><body style="font-family:sans-serif;max-width:640px;margin:40px auto">';
    echo '<h1>Studiendaten exportieren</h1><p>CSV-Dateien (UTF-8, Komma-getrennt). Exporte enthalten pseudonyme Daten — verschlüsselt speichern.</p><ul>';
    foreach (array_keys($tables) as $t) echo '<li><a href="?table=' . $t . '">' . $t . '</a></li>';
    echo '</ul></body>';
    exit;
}

$db = study_db();
$st = $db->query($tables[$table]);

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $table . '-' . date('Y-m-d') . '.csv"');
header('Cache-Control: no-store');
$out = fopen('php://output', 'w');
$first = true;
while ($row = $st->fetch()) {
    if ($first) { fputcsv($out, array_keys($row), ',', '"', '\\'); $first = false; }
    fputcsv($out, array_values($row), ',', '"', '\\');
}
fclose($out);
