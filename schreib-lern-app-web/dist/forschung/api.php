<?php
// ═══════════════════════════════════════════════════════════════════════════
// Schnittstelle des Forschungsmodus
//   enroll   — Teilnahme anmelden, Gruppe auslosen
//   upload   — Sitzungen und Schreibversuche speichern
//   export   — eigene Daten abrufen (Auskunft, Art. 15/20 DSGVO)
//   withdraw — Teilnahme beenden, alle Daten löschen (Art. 7 Abs. 3, Art. 17)
// Gespeichert werden keine IP-Adressen und keine Cookies.
// ═══════════════════════════════════════════════════════════════════════════
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

require __DIR__ . '/lib.php';
$CONFIG = study_config();

function fail(int $status, string $code): never {
    http_response_code($status);
    echo json_encode(['error' => $code]);
    exit;
}

// Nur Anfragen von der eigenen App annehmen
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    if (!in_array($origin, $CONFIG['allowed_origins'], true)) fail(403, 'origin');
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST');
    header('Access-Control-Allow-Headers: Content-Type');
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') fail(405, 'method');

$max = (int)($CONFIG['max_request_bytes'] ?? 2000000);
$raw = file_get_contents('php://input', false, null, 0, $max + 1);
if ($raw === false || strlen($raw) > $max) fail(413, 'too_large');
$in = json_decode($raw, true);
if (!is_array($in)) fail(400, 'json');

try {
    $db = study_db();        // ersetzt {p} in allen Anweisungen durch das Tabellen-Präfix (sl_)
} catch (Throwable $e) {
    fail(503, 'db_unavailable');
}

// ── Prüfhelfer: nur bekannte Felder mit erlaubten Werten ─────────────────────
function str_in(array $a, string $k, array $allowed): ?string {
    $v = $a[$k] ?? null;
    return is_string($v) && in_array($v, $allowed, true) ? $v : null;
}
function int_in(array $a, string $k, int $min, int $max): ?int {
    $v = $a[$k] ?? null;
    if (is_bool($v) || !is_numeric($v)) return null;
    $v = (int)round((float)$v);
    return ($v < $min || $v > $max) ? null : $v;
}
function num_in(array $a, string $k, float $min, float $max): ?float {
    $v = $a[$k] ?? null;
    if (is_bool($v) || !is_numeric($v)) return null;
    $v = (float)$v;
    return ($v < $min || $v > $max || !is_finite($v)) ? null : $v;
}
function flag(array $a, string $k): int { return !empty($a[$k]) ? 1 : 0; }
function id_ok($v, int $len): bool { return is_string($v) && preg_match('/^[a-z0-9]{' . $len . '}$/', $v) === 1; }

const PID_RE = '/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/';

// Teilnahmecode und Schlüssel prüfen
function auth(PDO $db, array $in): array {
    $pid = $in['pid'] ?? '';
    $token = $in['token'] ?? '';
    if (!is_string($pid) || !preg_match(PID_RE, $pid) || !is_string($token) || !preg_match('/^[0-9a-f]{64}$/', $token)) fail(400, 'auth_format');
    $st = $db->prepare('SELECT pid, token_hash, consent_traces FROM {p}participants WHERE pid = ?');
    $st->execute([$pid]);
    $p = $st->fetch();
    if (!$p) fail(404, 'unknown_participant');
    if (!hash_equals($p['token_hash'], hash('sha256', $token))) fail(403, 'auth');
    return $p;
}

// Blockrandomisierung: Blöcke zu 4 (2 × je Gruppe), je Altersgruppe getrennt.
// Die Reihenfolge im Block hängt von einem geheimen Schlüssel ab und ist nicht vorhersagbar.
function allocate(PDO $db, array $cfg, string $stratum): string {
    $groups = $cfg['groups'];
    if (count($groups) < 2) return $groups[0];
    $st = $db->prepare('SELECT COUNT(*) FROM {p}allocations WHERE study_id = ? AND stratum = ?');
    $st->execute([$cfg['study_id'], $stratum]);
    $n = (int)$st->fetchColumn();
    $size = 2 * count($groups);
    $block = intdiv($n, $size);
    $pos = $n % $size;
    $list = array_merge($groups, $groups);
    $seed = hash_hmac('sha256', $cfg['study_id'] . '|' . $stratum . '|' . $block, $cfg['allocation_secret'], true);
    for ($i = count($list) - 1; $i > 0; $i--) {           // Fisher-Yates mit Schlüssel-Bytes
        $j = ord($seed[$i]) % ($i + 1);
        [$list[$i], $list[$j]] = [$list[$j], $list[$i]];
    }
    return $list[$pos];
}

$action = $in['action'] ?? '';

// ── Anmelden ─────────────────────────────────────────────────────────────────
if ($action === 'enroll') {
    $pid = $in['pid'] ?? '';
    $token = $in['token'] ?? '';
    if (!is_string($pid) || !preg_match(PID_RE, $pid)) fail(400, 'pid_format');
    if (!is_string($token) || !preg_match('/^[0-9a-f]{64}$/', $token)) fail(400, 'token_format');
    if (($in['study'] ?? '') !== $CONFIG['study_id']) fail(400, 'study');
    $version = $in['consent_version'] ?? '';
    if (!is_string($version) || !preg_match('/^[0-9A-Za-z.\-]{1,16}$/', $version)) fail(400, 'consent_version');
    $age = int_in($in, 'age_months', 36, 132);
    $stratum = ($age !== null && $age < 72) ? 'u6' : '6plus';

    $db->query("SELECT GET_LOCK('slk_enroll', 10)");
    try {
        $st = $db->prepare('SELECT 1 FROM {p}participants WHERE pid = ?');
        $st->execute([$pid]);
        if ($st->fetch()) fail(409, 'pid_taken');
        $grp = allocate($db, $CONFIG, $stratum);
        $db->beginTransaction();
        $db->prepare('INSERT INTO {p}allocations (study_id, stratum, grp, created_on) VALUES (?, ?, ?, CURDATE())')
           ->execute([$CONFIG['study_id'], $stratum, $grp]);
        $db->prepare('INSERT INTO {p}participants (pid, token_hash, study_id, grp, stratum, enrolled_on, consent_version,
                      consent_traces, age_months, grade, handedness, home_lang, gender)
                      VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?)')
           ->execute([
               $pid, hash('sha256', $token), $CONFIG['study_id'], $grp, $stratum, $version,
               flag($in, 'consent_traces'), $age,
               str_in($in, 'grade', ['kita', 'k1', 'k2', 'andere']),
               str_in($in, 'handedness', ['rechts', 'links', 'beide', 'unklar']),
               str_in($in, 'home_lang', ['deutsch', 'teilweise', 'andere', 'keine_angabe']),
               str_in($in, 'gender', ['m', 'w', 'd', 'keine_angabe']),
           ]);
        $db->commit();
    } finally {
        $db->query("SELECT RELEASE_LOCK('slk_enroll')");
    }
    echo json_encode(['ok' => true, 'group' => $grp]);
    exit;
}

// ── Hochladen ────────────────────────────────────────────────────────────────
if ($action === 'upload') {
    $p = auth($db, $in);
    $sessions = is_array($in['sessions'] ?? null) ? $in['sessions'] : [];
    $trials = is_array($in['trials'] ?? null) ? $in['trials'] : [];
    if (count($sessions) > 50 || count($trials) > 50) fail(413, 'batch_too_large');

    $st = $db->prepare('SELECT COUNT(*) FROM {p}trials WHERE pid = ? AND received_on = CURDATE()');
    $st->execute([$p['pid']]);
    if ((int)$st->fetchColumn() + count($trials) > (int)($CONFIG['max_trials_per_day'] ?? 3000)) fail(429, 'daily_limit');

    $insSess = $db->prepare('INSERT IGNORE INTO {p}sessions (sid, pid, started_on, started_hour, day_index, app_version, device,
        input, screen_w, screen_h, dpr, field_scale) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $insTrial = $db->prepare('INSERT IGNORE INTO {p}trials (tid, pid, sid, received_on, seq, day_index, kind, wave, ch, mode, stage,
        difficulty, memory_delay_s, restricted, t_onset_ms, completed, skipped, latency_ms, movement_ms, pendown_ms, inair_ms,
        n_strokes, n_rejected, path_len, mean_speed, niv_per_stroke, accuracy, coverage, score_raw, stars, mirrored)
        VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $insStroke = $db->prepare('INSERT IGNORE INTO {p}strokes (tid, idx, expected_idx, accepted, verdict, start_ms, dur_ms, len, niv)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $insTrace = $db->prepare('INSERT IGNORE INTO {p}traces (tid, idx, pts) VALUES (?, ?, ?)');
    $ownSession = $db->prepare('SELECT 1 FROM {p}sessions WHERE sid = ? AND pid = ?');

    $accepted = [];
    $db->beginTransaction();
    try {
        foreach ($sessions as $s) {
            if (!is_array($s) || !id_ok($s['sid'] ?? null, 12)) continue;
            $date = $s['started_on'] ?? '';
            if (!is_string($date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) continue;
            $insSess->execute([
                $s['sid'], $p['pid'], $date, int_in($s, 'started_hour', 0, 23), int_in($s, 'day_index', -1, 3650),
                is_string($s['app_version'] ?? null) ? substr($s['app_version'], 0, 16) : null,
                str_in($s, 'device', ['phone', 'tablet', 'desktop']),
                str_in($s, 'input', ['touch', 'pen', 'mouse', 'unknown']),
                int_in($s, 'screen_w', 100, 10000), int_in($s, 'screen_h', 100, 10000),
                num_in($s, 'dpr', 0.5, 10), num_in($s, 'field_scale', 0.5, 5),
            ]);
        }
        foreach ($trials as $t) {
            if (!is_array($t) || !id_ok($t['tid'] ?? null, 16) || !id_ok($t['sid'] ?? null, 12)) continue;
            $ownSession->execute([$t['sid'], $p['pid']]);
            if (!$ownSession->fetch()) continue;                        // Sitzung fehlt oder gehört jemand anderem
            $kind = str_in($t, 'kind', ['practice', 'word', 'probe']);
            $mode = str_in($t, 'mode', ['guided', 'trace', 'copy', 'memory', 'probe']);
            $ch = $t['ch'] ?? null;
            if ($kind === null || $mode === null || !is_string($ch) || !preg_match('/^.{1,2}$/u', $ch)) continue;
            $insTrial->execute([
                $t['tid'], $p['pid'], $t['sid'], int_in($t, 'seq', 0, 1000000), int_in($t, 'day_index', -1, 3650),
                $kind, int_in($t, 'wave', 0, 9), $ch, $mode, int_in($t, 'stage', 1, 9),
                str_in($t, 'difficulty', ['easy', 'medium', 'hard']), int_in($t, 'memory_delay_s', 0, 60), flag($t, 'restricted'),
                int_in($t, 't_onset_ms', 0, 2000000000), flag($t, 'completed'), flag($t, 'skipped'),
                int_in($t, 'latency_ms', -1000, 3600000), int_in($t, 'movement_ms', 0, 3600000),
                int_in($t, 'pendown_ms', 0, 3600000), int_in($t, 'inair_ms', 0, 3600000),
                int_in($t, 'n_strokes', 0, 1000), int_in($t, 'n_rejected', 0, 1000),
                num_in($t, 'path_len', 0, 100000), num_in($t, 'mean_speed', 0, 100000), num_in($t, 'niv_per_stroke', 0, 10000),
                num_in($t, 'accuracy', 0, 1), num_in($t, 'coverage', 0, 1), num_in($t, 'score_raw', 0, 1),
                int_in($t, 'stars', 0, 5), isset($t['mirrored']) ? flag($t, 'mirrored') : null,
            ]);
            $fresh = $insTrial->rowCount() === 1;
            $accepted[] = $t['tid'];                                    // auch Dubletten gelten als angekommen
            if (!$fresh) continue;
            $strokes = is_array($t['strokes'] ?? null) ? array_slice($t['strokes'], 0, 200) : [];
            foreach ($strokes as $i => $s) {
                if (!is_array($s)) continue;
                $insStroke->execute([
                    $t['tid'], $i, int_in($s, 'expected_idx', 0, 100), flag($s, 'accepted'),
                    str_in($s, 'verdict', ['ok', 'start', 'direction']) ?? 'ok',
                    int_in($s, 'start_ms', -1000, 3600000), int_in($s, 'dur_ms', 0, 3600000),
                    num_in($s, 'len', 0, 100000), int_in($s, 'niv', 0, 10000),
                ]);
            }
            // Schreibspuren nur bei Einwilligung — sonst verworfen, auch wenn gesendet
            if ((int)$p['consent_traces'] === 1 && is_array($t['trace'] ?? null)) {
                foreach (array_slice($t['trace'], 0, 200) as $i => $pts) {
                    if (!is_array($pts)) continue;
                    $clean = [];
                    foreach (array_slice($pts, 0, 600) as $q) {
                        if (is_array($q) && count($q) === 3 && is_numeric($q[0]) && is_numeric($q[1]) && is_numeric($q[2])) {
                            $clean[] = [round((float)$q[0], 1), round((float)$q[1], 1), (int)$q[2]];
                        }
                    }
                    if ($clean) $insTrace->execute([$t['tid'], $i, json_encode($clean)]);
                }
            }
        }
        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        fail(500, 'store_failed');
    }
    echo json_encode(['ok' => true, 'accepted' => $accepted]);
    exit;
}

// ── Eigene Daten abrufen ─────────────────────────────────────────────────────
if ($action === 'export') {
    $p = auth($db, $in);
    $pid = $p['pid'];
    $one = function (string $sql) use ($db, $pid) { $st = $db->prepare($sql); $st->execute([$pid]); return $st->fetchAll(); };
    $participant = $one('SELECT pid, study_id, grp, enrolled_on, consent_version, consent_traces, age_months, grade,
                         handedness, home_lang, gender FROM {p}participants WHERE pid = ?');
    echo json_encode([
        'hinweis' => 'Alle Studiendaten zu diesem Teilnahmecode (Art. 15 und 20 DSGVO).',
        'teilnahme' => $participant[0] ?? null,
        'sitzungen' => $one('SELECT * FROM {p}sessions WHERE pid = ? ORDER BY started_on, sid'),
        'versuche' => $one('SELECT * FROM {p}trials WHERE pid = ? ORDER BY day_index, seq'),
        'striche' => $one('SELECT s.* FROM {p}strokes s JOIN {p}trials t ON t.tid = s.tid WHERE t.pid = ? ORDER BY s.tid, s.idx'),
        'schreibspuren' => $one('SELECT r.* FROM {p}traces r JOIN {p}trials t ON t.tid = r.tid WHERE t.pid = ? ORDER BY r.tid, r.idx'),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ── Teilnahme beenden und alles löschen ──────────────────────────────────────
if ($action === 'withdraw') {
    $p = auth($db, $in);
    // Fremdschlüssel mit ON DELETE CASCADE löschen Sitzungen, Versuche, Striche und Spuren mit
    $db->prepare('DELETE FROM {p}participants WHERE pid = ?')->execute([$p['pid']]);
    echo json_encode(['ok' => true, 'deleted' => true]);
    exit;
}

fail(400, 'action');
