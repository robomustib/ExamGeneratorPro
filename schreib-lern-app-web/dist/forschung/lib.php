<?php
// ═══════════════════════════════════════════════════════════════════════════
// Gemeinsame Hilfen für api.php, export.php und setup.php
// Alle Tabellen tragen ein Präfix (Standard „sl_"), damit sie sich nicht mit
// anderen Tabellen in derselben Datenbank (z. B. WordPress) in die Quere kommen.
// ═══════════════════════════════════════════════════════════════════════════
declare(strict_types=1);

function study_config(): array {
    static $config = null;
    if ($config === null) {
        if (!is_file(__DIR__ . '/config.php')) {
            http_response_code(503);
            header('Content-Type: text/plain; charset=utf-8');
            exit('config.php fehlt: bitte config.sample.php nach config.php kopieren und ausfüllen.');
        }
        $config = require __DIR__ . '/config.php';
    }
    return $config;
}

function table_prefix(): string {
    $prefix = study_config()['table_prefix'] ?? 'sl_';
    if (!is_string($prefix) || !preg_match('/^[A-Za-z0-9_]{0,20}$/', $prefix)) {
        throw new RuntimeException('table_prefix darf nur Buchstaben, Ziffern und _ enthalten');
    }
    return $prefix;
}

// PDO, das in jeder SQL-Anweisung {p} durch das Tabellen-Präfix ersetzt
final class StudyDB extends PDO {
    private string $prefix;

    public function __construct(string $prefix, string $dsn, string $user, string $pass) {
        $this->prefix = $prefix;
        parent::__construct($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    private function t(string $sql): string { return str_replace('{p}', $this->prefix, $sql); }

    public function prepare(string $query, array $options = []): PDOStatement|false {
        return parent::prepare($this->t($query), $options);
    }

    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false {
        return $fetchMode === null ? parent::query($this->t($query)) : parent::query($this->t($query), $fetchMode, ...$fetchModeArgs);
    }

    public function exec(string $statement): int|false { return parent::exec($this->t($statement)); }
}

function study_db(): StudyDB {
    $c = study_config();
    return new StudyDB(table_prefix(), $c['db_dsn'], $c['db_user'], $c['db_pass']);
}

// Anmeldung für das Studienteam (export.php, setup.php)
function require_team_login(): void {
    $c = study_config();
    $user = $_SERVER['PHP_AUTH_USER'] ?? '';
    $pass = $_SERVER['PHP_AUTH_PW'] ?? '';
    // Manche Hoster (PHP als CGI/FPM) reichen die Anmeldung nur als Kopfzeile durch
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($user === '' && stripos($hdr, 'basic ') === 0) {
        [$user, $pass] = array_pad(explode(':', (string)base64_decode(substr($hdr, 6)), 2), 2, '');
    }
    $okUser = hash_equals((string)($c['export_user'] ?? ''), $user);
    $okPass = isset($c['export_password_hash'])
        ? password_verify($pass, $c['export_password_hash'])
        : (($c['export_password'] ?? '') !== '' && hash_equals((string)$c['export_password'], $pass));
    if (!$okUser || !$okPass || str_starts_with((string)($c['export_password'] ?? ''), 'HIER-')) {
        header('WWW-Authenticate: Basic realm="Studiendaten", charset="UTF-8"');
        http_response_code(401);
        header('Content-Type: text/plain; charset=utf-8');
        exit('Anmeldung erforderlich (export_user / export_password aus config.php).');
    }
}
