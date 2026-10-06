<?php
// Blitz-Mengen-Knacker – Studien-Schnittstelle
// Aktionen: info (GET), enrol, upload, mydata, withdraw (POST, JSON).
// Speichert keine IP-Adressen, keine Namen und keine Geräte-Kennungen.

declare(strict_types=1);

const API_VERSION = '1.0';
const PID_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const TASKS = ['blitz', 'match', 'compare', 'line', 'partner'];
const REPS = ['tenframe', 'dice', 'fingers', 'ladybug', 'fruit', 'cloud'];
const CLASSES = ['fast', 'ok', 'slow', 'wrong', 'guess', 'help'];

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    respond(503, ['error' => 'Studie ist auf diesem Server nicht eingerichtet.']);
}
$config = require $configFile;

// CORS nur für ausdrücklich erlaubte Herkunft (Standard: gleiche Domain, kein Header nötig)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $config['allowed_origins'] ?? [], true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST');
    header('Access-Control-Allow-Headers: Content-Type');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    respond(204, []);
}

$action = (string)($_GET['action'] ?? '');
$study = $config['study'];

try {
    if ($action === 'info') {
        requireMethod('GET');
        respond(200, ['api' => API_VERSION, 'study' => publicStudyInfo($study)]);
    }

    requireMethod('POST');
    $body = readJsonBody((int)($config['max_body_bytes'] ?? 524288));
    $pdo = db($config['db']);

    switch ($action) {
        case 'enrol':
            enrol($pdo, $body, $study, (string)$config['pepper']);
            break;
        case 'upload':
            upload($pdo, $body, $study);
            break;
        case 'mydata':
            myData($pdo, $body);
            break;
        case 'withdraw':
            withdraw($pdo, $body, (string)$config['pepper']);
            break;
        default:
            respond(400, ['error' => 'Unbekannte Aktion.']);
    }
} catch (InvalidArgumentException $e) {
    respond(422, ['error' => $e->getMessage()]);
} catch (Throwable $e) {
    // Keine Details nach außen; im Server-Log ohne personenbezogene Daten
    error_log('mengen-study: ' . get_class($e) . ' ' . $e->getMessage());
    respond(500, ['error' => 'Interner Fehler. Bitte später erneut versuchen.']);
}

// ---------------------------------------------------------------------------

function respond(int $code, array $data): void
{
    http_response_code($code);
    if ($code !== 204) {
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    exit;
}

function requireMethod(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        respond(405, ['error' => 'Methode nicht erlaubt.']);
    }
}

function readJsonBody(int $max): array
{
    $raw = file_get_contents('php://input', false, null, 0, $max + 1);
    if ($raw === false || strlen($raw) > $max) {
        respond(413, ['error' => 'Anfrage zu groß.']);
    }
    $data = json_decode($raw, true, 8);
    if (!is_array($data)) {
        respond(400, ['error' => 'Ungültiges JSON.']);
    }
    return $data;
}

function db(array $c): PDO
{
    return new PDO($c['dsn'], $c['user'], $c['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function publicStudyInfo(array $s): array
{
    $keys = ['enrol_open', 'title', 'summary', 'institution', 'lead', 'contact_email', 'dpo', 'authority',
        'ethics', 'privacy_url', 'retention', 'consent_version', 'check_exposure_ms', 'schedule'];
    return array_intersect_key($s, array_flip($keys));
}

// --- Prüfen der Eingaben ----------------------------------------------------

function intIn($v, int $min, int $max, bool $nullable = false): ?int
{
    if ($v === null && $nullable) {
        return null;
    }
    if (is_bool($v) || !is_numeric($v) || (float)$v != (int)$v) {
        throw new InvalidArgumentException('Ungültige Zahl.');
    }
    $i = (int)$v;
    if ($i < $min || $i > $max) {
        throw new InvalidArgumentException('Zahl außerhalb des Bereichs.');
    }
    return $i;
}

function floatIn($v, float $min, float $max): ?float
{
    if ($v === null) {
        return null;
    }
    if (is_bool($v) || !is_numeric($v)) {
        throw new InvalidArgumentException('Ungültige Zahl.');
    }
    return max($min, min($max, (float)$v));
}

function oneOf($v, array $allowed, bool $nullable = false): ?string
{
    if ($v === null && $nullable) {
        return null;
    }
    if (!is_string($v) || !in_array($v, $allowed, true)) {
        throw new InvalidArgumentException('Ungültiger Wert.');
    }
    return $v;
}

function matches($v, string $re, bool $nullable = false): ?string
{
    if ($v === null && $nullable) {
        return null;
    }
    if (!is_string($v) || !preg_match($re, $v)) {
        throw new InvalidArgumentException('Ungültiges Format.');
    }
    return $v;
}

function flag($v): int
{
    return ($v === true || $v === 1 || $v === '1') ? 1 : 0;
}

function utcDate(string $iso): string
{
    $d = DateTimeImmutable::createFromFormat('Y-m-d\TH:i:s\Z', $iso, new DateTimeZone('UTC'));
    if (!$d) {
        throw new InvalidArgumentException('Ungültiger Zeitstempel.');
    }
    return $d->format('Y-m-d H:i:s');
}

// --- Anmelden ---------------------------------------------------------------

function enrol(PDO $pdo, array $b, array $study, string $pepper): void
{
    if (empty($study['enrol_open'])) {
        respond(403, ['error' => 'Die Anmeldung ist geschlossen.']);
    }
    $secret = matches($b['secret'] ?? null, '/^[a-f0-9]{48}$/');
    if (($b['consent_version'] ?? null) !== $study['consent_version']) {
        respond(409, ['error' => 'Die Teilnahmeinformation wurde geändert. Bitte die App neu laden.']);
    }
    $c = is_array($b['consents'] ?? null) ? $b['consents'] : [];
    if (flag($c['read'] ?? 0) !== 1 || flag($c['guardian'] ?? 0) !== 1 || flag($c['participate'] ?? 0) !== 1) {
        throw new InvalidArgumentException('Die Pflicht-Einwilligungen fehlen.');
    }
    if (flag($c['child_assent'] ?? 0) !== 1) {
        throw new InvalidArgumentException('Ohne Zustimmung des Kindes ist keine Teilnahme möglich.');
    }
    $health = flag($c['health'] ?? 0);
    $d = is_array($b['demo'] ?? null) ? $b['demo'] : [];
    $age = intIn($d['age_months'] ?? null, 60, 95);
    $grade = oneOf($d['grade'] ?? null, ['kita', '1', '2', 'other']);
    $gender = oneOf($d['gender'] ?? 'na', ['f', 'm', 'd', 'na']);
    $lang = oneOf($d['home_language'] ?? 'na', ['de', 'partly', 'other', 'na']);
    $math = $health ? oneOf($d['math_difficulty'] ?? 'unknown', ['diagnosed', 'suspected', 'no', 'unknown']) : null;
    $device = oneOf($b['device'] ?? null, ['phone', 'tablet', 'desktop'], true);
    $app = matches($b['app'] ?? null, '/^[0-9A-Za-z.\-]{1,16}$/');
    $stratum = $age < 78 ? 'young' : 'old';

    // Bei gleichzeitigen Anmeldungen kann ein neuer Block doppelt angelegt werden; dann neu versuchen.
    for ($attempt = 1; ; $attempt++) {
        $pdo->beginTransaction();
        try {
            [$pid, $engine, $stage] = enrolOnce($pdo, $secret, $study, $pepper, $stratum, $health, $c, $age, $grade, $gender, $lang, $math, $device, $app);
            $pdo->commit();
            break;
        } catch (PDOException $e) {
            $pdo->rollBack();
            if ($attempt >= 3 || !in_array((string)$e->getCode(), ['23000', '40001'], true)) {
                throw $e;
            }
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    respond(201, [
        'pid' => $pid,
        'engine' => $engine,
        'stage_arm' => $stage,
        'schedule' => $study['schedule'],
        'check_exposure_ms' => (int)$study['check_exposure_ms'],
        'stage_switch_day' => (int)$study['stage_switch_day'],
    ]);
}

function enrolOnce(PDO $pdo, string $secret, array $study, string $pepper, string $stratum, int $health, array $c,
    int $age, string $grade, string $gender, string $lang, ?string $math, ?string $device, string $app): array
{
    $slot = drawSlot($pdo, $stratum, !empty($study['factorial']));
    $engine = $slot[0] === 'A' ? 'adaptive' : 'static';
    $stage = $slot[1] === '1' ? 'basal' : 'structured';
    $pid = newPid($pdo);
    $pdo->prepare('INSERT INTO participants (pid, secret_hash, enrolled_at, consent_version, consent_participate,
            consent_health, consent_open_data, child_assent, age_months, grade, gender, home_language, math_difficulty,
            stratum, arm_engine, arm_stage, device_class, app_version)
        VALUES (?, ?, UTC_TIMESTAMP(), ?, 1, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([$pid, password_hash($secret, PASSWORD_DEFAULT), $study['consent_version'], $health,
            flag($c['open_data'] ?? 0), $age, $grade, $gender, $lang, $math, $stratum, $engine, $stage, $device, $app]);
    audit($pdo, 'enrol', $pid, $pepper, $study['consent_version']);
    return [$pid, $engine, $stage];
}

// Blöcke zu 4 Plätzen je Altersschicht; im 2×2-Design je ein Platz pro Gruppe.
function drawSlot(PDO $pdo, string $stratum, bool $factorial): string
{
    $q = $pdo->prepare('SELECT block_no, slots, used FROM rand_blocks WHERE stratum = ? AND used < 4 ORDER BY block_no LIMIT 1 FOR UPDATE');
    $q->execute([$stratum]);
    $row = $q->fetch();
    if (!$row) {
        $next = $pdo->prepare('SELECT COALESCE(MAX(block_no), 0) + 1 FROM rand_blocks WHERE stratum = ? FOR UPDATE');
        $next->execute([$stratum]);
        $blockNo = (int)$next->fetchColumn();
        $slots = $factorial ? ['A1', 'A2', 'S1', 'S2'] : ['A1', 'A1', 'S1', 'S1'];
        for ($i = count($slots) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$slots[$i], $slots[$j]] = [$slots[$j], $slots[$i]];
        }
        $pdo->prepare('INSERT INTO rand_blocks (stratum, block_no, slots, used) VALUES (?, ?, ?, 0)')
            ->execute([$stratum, $blockNo, implode(',', $slots)]);
        $row = ['block_no' => $blockNo, 'slots' => implode(',', $slots), 'used' => 0];
    }
    $slots = explode(',', $row['slots']);
    $slot = $slots[(int)$row['used']];
    $pdo->prepare('UPDATE rand_blocks SET used = used + 1 WHERE stratum = ? AND block_no = ?')
        ->execute([$stratum, $row['block_no']]);
    return $slot;
}

function newPid(PDO $pdo): string
{
    $check = $pdo->prepare('SELECT 1 FROM participants WHERE pid = ?');
    do {
        $c = '';
        for ($i = 0; $i < 8; $i++) {
            $c .= PID_ALPHABET[random_int(0, strlen(PID_ALPHABET) - 1)];
        }
        $pid = 'MK-' . substr($c, 0, 4) . '-' . substr($c, 4, 4);
        $check->execute([$pid]);
    } while ($check->fetchColumn());
    return $pid;
}

function audit(PDO $pdo, string $action, string $pid, string $pepper, ?string $consentVersion = null): void
{
    $pdo->prepare('INSERT INTO audit_log (at, action, pid_hash, consent_version) VALUES (UTC_TIMESTAMP(), ?, ?, ?)')
        ->execute([$action, hash('sha256', $pepper . $pid), $consentVersion]);
}

// --- Anmelden prüfen ----------------------------------------------------------

function authenticate(PDO $pdo, array $b, bool $allowWithdrawn = false): array
{
    $pid = matches($b['pid'] ?? null, '/^MK-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/');
    $secret = matches($b['secret'] ?? null, '/^[a-f0-9]{48}$/');
    $q = $pdo->prepare('SELECT * FROM participants WHERE pid = ?');
    $q->execute([$pid]);
    $p = $q->fetch();
    if (!$p) {
        respond(410, ['error' => 'Diese Teilnahme gibt es auf dem Server nicht mehr.']);
    }
    if (!password_verify($secret, $p['secret_hash'])) {
        respond(403, ['error' => 'Zugangsschlüssel passt nicht.']);
    }
    if ($p['status'] !== 'active' && !$allowWithdrawn) {
        respond(410, ['error' => 'Die Teilnahme wurde beendet.']);
    }
    return $p;
}

// --- Daten hochladen ----------------------------------------------------------

function upload(PDO $pdo, array $b, array $study): void
{
    $p = authenticate($pdo, $b);
    $events = is_array($b['events'] ?? null) ? $b['events'] : [];
    $sessions = is_array($b['sessions'] ?? null) ? $b['sessions'] : [];
    if (count($events) > 500 || count($sessions) > 100) {
        respond(413, ['error' => 'Zu viele Einträge auf einmal.']);
    }
    $checkIds = array_column($study['schedule'], 'id');
    $app = matches($b['app'] ?? null, '/^[0-9A-Za-z.\-]{1,16}$/');
    $enrolled = new DateTimeImmutable($p['enrolled_at'], new DateTimeZone('UTC'));
    $earliest = $enrolled->modify('-1 day')->format('Y-m-d H:i:s');
    $latest = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->modify('+1 day')->format('Y-m-d H:i:s');

    $insT = $pdo->prepare('INSERT IGNORE INTO trials (pid, seq, sid, kind, check_id, trial_idx, block_no, ts, day_index,
            local_hour, task, item_key, quantity, rep, fmt, val_left, val_right, options, stage, max_n, exposure_ms, answer,
            correct, rt_ms, cls, answered_visible, theta_before, beta_before, p_pred, ladder_level, is_retry, interrupted,
            baseline_ms, received_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())');
    $insS = $pdo->prepare('INSERT IGNORE INTO sessions (pid, sid, kind, check_id, started_at, day_index, local_hour,
            duration_s, n_trials, n_correct, n_fast, completed, only_task, standalone, device_class, app_version, received_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())');

    $accepted = 0;
    $rejected = 0;
    $pdo->beginTransaction();
    try {
        foreach ($events as $e) {
            try {
                if (!is_array($e)) {
                    throw new InvalidArgumentException('Eintrag ist kein Objekt.');
                }
                $kind = oneOf($e['kind'] ?? null, ['train', 'check']);
                $ts = utcDate((string)($e['ts'] ?? ''));
                if ($ts < $earliest || $ts > $latest) {
                    throw new InvalidArgumentException('Zeitstempel außerhalb der Teilnahme.');
                }
                $row = [
                    $p['pid'],
                    intIn($e['seq'] ?? null, 1, 4000000000),
                    matches($e['sid'] ?? null, '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/'),
                    $kind,
                    $kind === 'check' ? oneOf($e['check'] ?? null, $checkIds) : null,
                    intIn($e['idx'] ?? null, 0, 200),
                    intIn($e['block'] ?? null, 0, 100, true),
                    $ts,
                    intIn($e['day'] ?? null, 0, 2000),
                    intIn($e['hour'] ?? null, 0, 23),
                    oneOf($e['task'] ?? null, TASKS),
                    matches($e['item'] ?? null, '/^[a-z0-9|]{1,40}$/'),
                    intIn($e['q'] ?? null, 0, 10, true),
                    oneOf($e['rep'] ?? null, REPS, true),
                    oneOf($e['fmt'] ?? null, ['digits', 'dots', 'mixed'], true),
                    intIn($e['vl'] ?? null, 1, 10, true),
                    intIn($e['vr'] ?? null, 1, 10, true),
                    matches($e['opts'] ?? null, '/^\d{1,2}(,\d{1,2}){0,3}$/', true),
                    intIn($e['stage'] ?? null, 1, 2),
                    intIn($e['maxn'] ?? null, 5, 10),
                    intIn($e['expo_ms'] ?? null, 0, 30000, true),
                    intIn($e['answer'] ?? null, 0, 10, true),
                    intIn($e['correct'] ?? null, 0, 1),
                    intIn($e['rt_ms'] ?? null, 0, 3600000),
                    oneOf($e['cls'] ?? null, CLASSES),
                    intIn($e['visible'] ?? null, 0, 1, true),
                    floatIn($e['theta'] ?? null, -10, 10),
                    floatIn($e['beta'] ?? null, -10, 10),
                    floatIn($e['p'] ?? null, 0, 1),
                    intIn($e['lv'] ?? null, 0, 20, true),
                    flag($e['retry'] ?? 0),
                    flag($e['intr'] ?? 0),
                    intIn($e['base_ms'] ?? null, 0, 30000, true),
                ];
                $insT->execute($row);
                $accepted += $insT->rowCount();
            } catch (InvalidArgumentException $ex) {
                $rejected++;
            }
        }
        foreach ($sessions as $s) {
            try {
                if (!is_array($s)) {
                    throw new InvalidArgumentException('Eintrag ist kein Objekt.');
                }
                $kind = oneOf($s['kind'] ?? null, ['train', 'check']);
                $insS->execute([
                    $p['pid'],
                    matches($s['sid'] ?? null, '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/'),
                    $kind,
                    $kind === 'check' ? oneOf($s['check'] ?? null, $checkIds) : null,
                    utcDate((string)($s['started'] ?? '')),
                    intIn($s['day'] ?? null, 0, 2000),
                    intIn($s['hour'] ?? null, 0, 23),
                    intIn($s['dur_s'] ?? null, 0, 86400),
                    intIn($s['n'] ?? null, 0, 200),
                    intIn($s['ok'] ?? null, 0, 200),
                    intIn($s['fast'] ?? null, 0, 200),
                    flag($s['completed'] ?? 0),
                    oneOf($s['only'] ?? null, TASKS, true),
                    flag($s['standalone'] ?? 0),
                    oneOf($s['device'] ?? null, ['phone', 'tablet', 'desktop'], true),
                    $app,
                ]);
            } catch (InvalidArgumentException $ex) {
                $rejected++;
            }
        }
        $pdo->prepare('UPDATE participants SET last_upload_at = UTC_TIMESTAMP(), app_version = ? WHERE pid = ?')
            ->execute([$app, $p['pid']]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    respond(200, ['ok' => true, 'accepted' => $accepted, 'rejected' => $rejected]);
}

// --- Auskunft (Art. 15 und 20 DSGVO) -------------------------------------------

function myData(PDO $pdo, array $b): void
{
    $p = authenticate($pdo, $b, true);
    unset($p['secret_hash']);
    $s = $pdo->prepare('SELECT * FROM sessions WHERE pid = ? ORDER BY started_at');
    $s->execute([$p['pid']]);
    $t = $pdo->prepare('SELECT * FROM trials WHERE pid = ? ORDER BY seq');
    $t->execute([$p['pid']]);
    respond(200, [
        'exported_at' => gmdate('Y-m-d\TH:i:s\Z'),
        'participant' => $p,
        'sessions' => $s->fetchAll(),
        'trials' => $t->fetchAll(),
    ]);
}

// --- Widerruf (Art. 7 Abs. 3 und Art. 17 DSGVO) ----------------------------------

function withdraw(PDO $pdo, array $b, string $pepper): void
{
    $p = authenticate($pdo, $b, true);
    $delete = flag($b['delete'] ?? 0) === 1;
    $pdo->beginTransaction();
    try {
        if ($delete) {
            // Sitzungen und Antworten werden über ON DELETE CASCADE mitgelöscht
            $pdo->prepare('DELETE FROM participants WHERE pid = ?')->execute([$p['pid']]);
            audit($pdo, 'withdraw_delete', $p['pid'], $pepper);
        } else {
            $pdo->prepare("UPDATE participants SET status = 'withdrawn', withdrawn_at = UTC_TIMESTAMP() WHERE pid = ?")
                ->execute([$p['pid']]);
            audit($pdo, 'withdraw_keep', $p['pid'], $pepper);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    respond(200, ['ok' => true, 'deleted' => $delete]);
}
