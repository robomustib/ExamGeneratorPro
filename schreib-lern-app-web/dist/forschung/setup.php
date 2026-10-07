<?php
// ═══════════════════════════════════════════════════════════════════════════
// Einrichtung des Forschungsmodus im Browser: prüft die Konfiguration und legt
// die Tabellen (mit Präfix, Standard „sl_") per Knopfdruck an.
// Aufruf:  https://…/forschung/setup.php  — Anmeldung mit export_user / export_password
// Nach erfolgreicher Einrichtung kann diese Datei gelöscht werden.
// ═══════════════════════════════════════════════════════════════════════════
declare(strict_types=1);
require __DIR__ . '/lib.php';
require_team_login();

$c = study_config();
$prefix = table_prefix();
$tables = ['allocations', 'participants', 'sessions', 'trials', 'strokes', 'traces'];
$views = ['v_probe', 'v_practice_per_day'];
$checks = [];
$add = function (string $label, bool $ok, string $hint = '') use (&$checks) { $checks[] = [$label, $ok, $hint]; };

// ── Tabellen anlegen ─────────────────────────────────────────────────────────
$installLog = [];
$db = null;
try { $db = study_db(); } catch (Throwable $e) { $dbError = $e->getMessage(); }

if ($db && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && ($_POST['action'] ?? '') === 'install') {
    $sql = (string)file_get_contents(__DIR__ . '/schema.sql');
    if ($prefix !== 'sl_') $sql = preg_replace('/\bsl_/', $prefix, $sql);
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);                       // Kommentarzeilen entfernen
    foreach (preg_split('/;\s*(\r?\n|$)/', $sql) as $stmt) {
        $stmt = trim($stmt);
        if ($stmt === '') continue;
        $name = preg_match('/(TABLE IF NOT EXISTS|VIEW)\s+(\w+)/', $stmt, $m) ? $m[2] : substr($stmt, 0, 40);
        try { $db->exec($stmt); $installLog[] = [$name, true, '']; }
        catch (Throwable $e) { $installLog[] = [$name, false, $e->getMessage()]; }
    }
}

// ── Prüfungen ────────────────────────────────────────────────────────────────
$add('PHP-Version ' . PHP_VERSION, version_compare(PHP_VERSION, '8.1.0', '>='), 'mindestens 8.1 nötig');
$add('PDO-Treiber für MySQL', extension_loaded('pdo_mysql'), 'Erweiterung pdo_mysql beim Hoster aktivieren');
$https = (($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
$add('Seite läuft über HTTPS', $https, 'SSL-Zertifikat beim Hoster aktivieren');
$origin = ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? '');
$add('allowed_origins enthält ' . $origin, in_array($origin, $c['allowed_origins'] ?? [], true), "in config.php eintragen: 'allowed_origins' => ['" . $origin . "']");
foreach (['db_pass', 'allocation_secret', 'export_password'] as $k) {
    $v = (string)($c[$k] ?? '');
    $add("config.php: $k ausgefüllt", $v !== '' && !str_starts_with($v, 'HIER-'), 'Platzhalter ersetzen');
}
$add('allocation_secret mindestens 32 Zeichen', strlen((string)($c['allocation_secret'] ?? '')) >= 32, 'langen Zufallstext eintragen');
$add('Tabellen-Präfix: ' . ($prefix === '' ? '(keins)' : $prefix), true);
$add('Verbindung zur Datenbank', $db !== null, isset($dbError) ? $dbError : '');

$existing = [];
if ($db) {
    foreach (array_merge($tables, $views) as $t) {
        $st = $db->prepare('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?');
        $st->execute([$prefix . $t]);
        $existing[$t] = (int)$st->fetchColumn() > 0;
    }
    $missing = array_keys(array_filter($existing, fn($v) => !$v));
    $add('Alle Tabellen und Sichten vorhanden', !$missing, $missing ? 'fehlen: ' . implode(', ', array_map(fn($t) => $prefix . $t, $missing)) : '');
}

$json = is_file(__DIR__ . '/config.json') ? json_decode((string)file_get_contents(__DIR__ . '/config.json'), true) : null;
$add('config.json lesbar', is_array($json), 'Datei fehlt oder ist kein gültiges JSON');
if (is_array($json)) {
    $add('studyId in config.json passt zu study_id in config.php', ($json['studyId'] ?? '') === ($c['study_id'] ?? null),
        'beide gleich setzen, z. B. „' . ($c['study_id'] ?? 'slk-2026') . '"');
    $checks[] = ['Studie eingeschaltet („enabled" in config.json)', (bool)($json['enabled'] ?? false),
        'erst nach Ethikvotum und Datenschutzprüfung auf true setzen', 'info'];
}

$counts = [];
if ($db && !in_array(false, $existing, true)) {
    foreach ($tables as $t) $counts[$prefix . $t] = (int)$db->query("SELECT COUNT(*) FROM {p}$t")->fetchColumn();
}

$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
?><!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Forschungsmodus einrichten</title>
<style>
  :root { --ink:#1e293b; --muted:#64748b; --ok:#15803d; --bad:#b91c1c; --info:#b45309; --bg:#f8fafc; --card:#fff; --line:#e2e8f0; --accent:#0f766e; }
  @media (prefers-color-scheme: dark) { :root { --ink:#e2e8f0; --muted:#94a3b8; --ok:#4ade80; --bad:#f87171; --info:#fbbf24; --bg:#0f172a; --card:#1e293b; --line:#334155; --accent:#2dd4bf; } }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 system-ui, Arial, sans-serif; }
  main { max-width:760px; margin:0 auto; padding:24px 16px 48px; }
  h1 { font-size:1.4rem; color:var(--accent); margin:0 0 4px; }
  table { width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--line); border-radius:12px; overflow:hidden; }
  td { padding:8px 10px; border-top:1px solid var(--line); vertical-align:top; }
  .ok { color:var(--ok); font-weight:700; } .bad { color:var(--bad); font-weight:700; } .info { color:var(--info); font-weight:700; }
  .hint { color:var(--muted); font-size:13px; }
  button { background:var(--accent); color:#fff; border:0; border-radius:10px; padding:10px 18px; font-size:15px; font-weight:700; cursor:pointer; }
  code { background:var(--line); border-radius:4px; padding:0 4px; }
</style></head>
<body><main>
<h1>Forschungsmodus einrichten</h1>
<p class="hint">Prüft die Server-Einstellungen und legt die Tabellen an. Grün = in Ordnung, Rot = bitte beheben.</p>

<?php if ($installLog): ?>
<h2>Tabellen anlegen</h2>
<table><?php foreach ($installLog as [$name, $ok, $err]): ?>
<tr><td class="<?= $ok ? 'ok' : 'bad' ?>"><?= $ok ? '✓' : '✗' ?></td><td><?= $h($name) ?><?php if ($err): ?><div class="hint"><?= $h($err) ?></div><?php endif; ?></td></tr>
<?php endforeach; ?></table>
<?php endif; ?>

<h2>Prüfung</h2>
<table><?php foreach ($checks as $row): [$label, $ok, $hint] = $row; $cls = ($row[3] ?? '') === 'info' && !$ok ? 'info' : ($ok ? 'ok' : 'bad'); ?>
<tr><td class="<?= $cls ?>"><?= $ok ? '✓' : ($cls === 'info' ? '–' : '✗') ?></td><td><?= $h($label) ?><?php if (!$ok && $hint): ?><div class="hint"><?= $h($hint) ?></div><?php endif; ?></td></tr>
<?php endforeach; ?></table>

<?php if ($db && in_array(false, $existing, true)): ?>
<form method="post" style="margin-top:16px">
  <input type="hidden" name="action" value="install">
  <button type="submit">Tabellen mit Präfix „<?= $h($prefix) ?>“ anlegen</button>
  <p class="hint">Vorhandene Tabellen bleiben unverändert (CREATE TABLE IF NOT EXISTS). Der Datenbank-Benutzer braucht dafür die Rechte CREATE, CREATE VIEW und REFERENCES.</p>
</form>
<?php endif; ?>

<?php if ($counts): ?>
<h2>Datensätze</h2>
<table><?php foreach ($counts as $t => $n): ?><tr><td><code><?= $h($t) ?></code></td><td><?= $n ?></td></tr><?php endforeach; ?></table>
<p class="hint">Daten abrufen: <a href="export.php">export.php</a>. Nach der Einrichtung kann diese Seite gelöscht werden.</p>
<?php endif; ?>
</main></body></html>
