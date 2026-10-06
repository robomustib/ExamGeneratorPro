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

$CONFIG = require __DIR__ . '/config.php';

$user = $_SERVER['PHP_AUTH_USER'] ?? '';
$pass = $_SERVER['PHP_AUTH_PW'] ?? '';
// Manche Hoster (PHP als CGI/FPM) reichen die Anmeldung nur als Kopfzeile durch
$hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if ($user === '' && stripos($hdr, 'basic ') === 0) {
    [$user, $pass] = array_pad(explode(':', (string)base64_decode(substr($hdr, 6)), 2), 2, '');
}
$okUser = hash_equals((string)($CONFIG['export_user'] ?? ''), $user);
$okPass = isset($CONFIG['export_password_hash'])
    ? password_verify($pass, $CONFIG['export_password_hash'])
    : (($CONFIG['export_password'] ?? '') !== '' && hash_equals((string)$CONFIG['export_password'], $pass));
if (!$okUser || !$okPass || str_starts_with((string)($CONFIG['export_password'] ?? ''), 'HIER-')) {
    header('WWW-Authenticate: Basic realm="Studiendaten", charset="UTF-8"');
    http_response_code(401);
    echo 'Anmeldung erforderlich.';
    exit;
}

$tables = [
    'probe'         => 'SELECT * FROM v_probe ORDER BY pid, wave, seq',
    'trials'        => 'SELECT * FROM trials ORDER BY pid, day_index, seq',
    'strokes'       => 'SELECT * FROM strokes ORDER BY tid, idx',
    'sessions'      => 'SELECT * FROM sessions ORDER BY pid, started_on',
    'participants'  => 'SELECT pid, study_id, grp, stratum, enrolled_on, consent_version, consent_traces, age_months,
                        grade, handedness, home_lang, gender FROM participants ORDER BY enrolled_on, pid',
    'practice_days' => 'SELECT * FROM v_practice_per_day ORDER BY pid, day_index',
    'traces'        => 'SELECT * FROM traces ORDER BY tid, idx',
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

$db = new PDO($CONFIG['db_dsn'], $CONFIG['db_user'], $CONFIG['db_pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
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
