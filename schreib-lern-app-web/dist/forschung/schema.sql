-- ═══════════════════════════════════════════════════════════════════════════
-- Schreib & Lern — Datenbank für den Forschungsmodus
-- MySQL 8 / MariaDB 10.5 oder neuer, Zeichensatz utf8mb4
-- Einmalig in phpMyAdmin (Reiter „SQL") oder per Kommandozeile ausführen.
-- Gespeichert werden nur pseudonyme Daten: kein Name, keine E-Mail, keine IP.
-- ═══════════════════════════════════════════════════════════════════════════

-- Auslosung der Gruppen. Enthält keine personenbezogenen Daten und wird nie
-- gelöscht, damit die Blockrandomisierung auch nach Widerrufen stimmt.
CREATE TABLE IF NOT EXISTS allocations (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  study_id    VARCHAR(32) NOT NULL,
  stratum     VARCHAR(8)  NOT NULL,          -- Altersgruppe: u6 = unter 6 Jahre, 6plus
  grp         VARCHAR(16) NOT NULL,
  created_on  DATE        NOT NULL,
  KEY idx_alloc (study_id, stratum)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teilnehmende: ein Kind = ein zufälliger Code
CREATE TABLE IF NOT EXISTS participants (
  pid               CHAR(6)     NOT NULL PRIMARY KEY,    -- Teilnahmecode, z. B. K7F3QX
  token_hash        CHAR(64)    NOT NULL,                -- SHA-256 des geheimen Schlüssels auf dem Gerät
  study_id          VARCHAR(32) NOT NULL,
  grp               VARCHAR(16) NOT NULL,                -- lernweg | nachfahren
  stratum           VARCHAR(8)  NOT NULL,
  enrolled_on       DATE        NOT NULL,
  consent_version   VARCHAR(16) NOT NULL,
  consent_traces    TINYINT(1)  NOT NULL DEFAULT 0,      -- Einwilligung Schreibspuren
  age_months        SMALLINT UNSIGNED NULL,
  grade             ENUM('kita','k1','k2','andere') NULL,
  handedness        ENUM('rechts','links','beide','unklar') NULL,
  home_lang         ENUM('deutsch','teilweise','andere','keine_angabe') NULL,
  gender            ENUM('m','w','d','keine_angabe') NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sitzungen: ein Öffnen der App
CREATE TABLE IF NOT EXISTS sessions (
  sid           CHAR(12)    NOT NULL PRIMARY KEY,
  pid           CHAR(6)     NOT NULL,
  started_on    DATE        NOT NULL,
  started_hour  TINYINT UNSIGNED NULL,
  day_index     SMALLINT    NULL,                        -- Tage seit der Anmeldung
  app_version   VARCHAR(16) NULL,
  device        ENUM('phone','tablet','desktop') NULL,
  input         ENUM('touch','pen','mouse','unknown') NULL,
  screen_w      SMALLINT UNSIGNED NULL,
  screen_h      SMALLINT UNSIGNED NULL,
  dpr           DECIMAL(3,1) NULL,
  field_scale   DECIMAL(4,2) NULL,
  CONSTRAINT fk_sess_part FOREIGN KEY (pid) REFERENCES participants(pid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Schreibversuche: eine Übung oder eine Aufgabe im Schreibtest
CREATE TABLE IF NOT EXISTS trials (
  tid             CHAR(16)    NOT NULL PRIMARY KEY,      -- auf dem Gerät erzeugt (doppelte Uploads werden ignoriert)
  pid             CHAR(6)     NOT NULL,
  sid             CHAR(12)    NOT NULL,
  received_on     DATE        NOT NULL,
  seq             INT UNSIGNED NULL,                     -- Reihenfolge in der Sitzung
  day_index       SMALLINT    NULL,
  kind            ENUM('practice','word','probe') NOT NULL,
  wave            TINYINT UNSIGNED NULL,                 -- Schreibtest: 0 Vortest, 1 Nachtest, 2 Follow-up
  ch              VARCHAR(4)  NOT NULL,                  -- Zeichen
  mode            ENUM('guided','trace','copy','memory','probe') NOT NULL,
  stage           TINYINT UNSIGNED NULL,                 -- Lernstufe des Buchstabens
  difficulty      ENUM('easy','medium','hard') NULL,
  memory_delay_s  TINYINT UNSIGNED NULL,
  restricted      TINYINT(1)  NULL,                      -- Wartekontrolle aktiv
  t_onset_ms      INT UNSIGNED NULL,                     -- Aufgabenbeginn, ms seit Sitzungsbeginn
  completed       TINYINT(1)  NOT NULL,
  skipped         TINYINT(1)  NOT NULL DEFAULT 0,        -- „Weiß ich nicht"
  latency_ms      INT NULL,                              -- Aufgabe sichtbar → erste Berührung
  movement_ms     INT NULL,                              -- erste Berührung → letztes Abheben
  pendown_ms      INT NULL,
  inair_ms        INT NULL,
  n_strokes       SMALLINT UNSIGNED NULL,
  n_rejected      SMALLINT UNSIGNED NULL,                -- zurückgenommene Striche (Start/Richtung falsch)
  path_len        FLOAT NULL,                            -- Buchstaben-Einheiten (Feldbreite = 100)
  mean_speed      FLOAT NULL,                            -- Einheiten pro Sekunde
  niv_per_stroke  FLOAT NULL,                            -- Geschwindigkeitsgipfel pro Strich
  accuracy        FLOAT NULL,
  coverage        FLOAT NULL,
  score_raw       FLOAT NULL,                            -- 0 bis 0,9
  stars           TINYINT UNSIGNED NULL,
  mirrored        TINYINT(1)  NULL,
  KEY idx_trials_pid (pid, kind, wave),
  CONSTRAINT fk_trial_part FOREIGN KEY (pid) REFERENCES participants(pid) ON DELETE CASCADE,
  CONSTRAINT fk_trial_sess FOREIGN KEY (sid) REFERENCES sessions(sid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Einzelne Striche eines Versuchs (auch zurückgenommene)
CREATE TABLE IF NOT EXISTS strokes (
  tid           CHAR(16)    NOT NULL,
  idx           SMALLINT UNSIGNED NOT NULL,
  expected_idx  SMALLINT UNSIGNED NULL,                  -- welcher Strich der Vorlage erwartet war
  accepted      TINYINT(1)  NOT NULL,
  verdict       ENUM('ok','start','direction') NOT NULL,
  start_ms      INT NULL,                                -- ms seit Aufgabenbeginn
  dur_ms        INT NULL,
  len           FLOAT NULL,
  niv           SMALLINT UNSIGNED NULL,
  PRIMARY KEY (tid, idx),
  CONSTRAINT fk_stroke_trial FOREIGN KEY (tid) REFERENCES trials(tid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Schreibspuren — nur bei gesonderter Einwilligung (participants.consent_traces = 1)
CREATE TABLE IF NOT EXISTS traces (
  tid   CHAR(16) NOT NULL,
  idx   SMALLINT UNSIGNED NOT NULL,
  pts   MEDIUMTEXT NOT NULL,                             -- JSON [[x, y, ms], …]
  PRIMARY KEY (tid, idx),
  CONSTRAINT fk_trace_trial FOREIGN KEY (tid) REFERENCES trials(tid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auswertungssicht: Schreibtest mit Gruppe, Alter und Gerät in einer Zeile
CREATE OR REPLACE VIEW v_probe AS
SELECT t.pid, p.grp, p.stratum, p.age_months, p.grade, p.handedness, p.home_lang, p.gender,
       t.wave, t.day_index, t.seq, t.ch, t.completed, t.skipped,
       t.latency_ms, t.movement_ms, t.pendown_ms, t.inair_ms, t.n_strokes, t.path_len, t.mean_speed,
       t.niv_per_stroke, t.accuracy, t.coverage, t.score_raw, t.mirrored,
       s.device, s.input, s.field_scale
FROM trials t
JOIN participants p ON p.pid = t.pid
JOIN sessions s ON s.sid = t.sid
WHERE t.kind = 'probe';

-- Übungsmenge pro Kind und Tag
CREATE OR REPLACE VIEW v_practice_per_day AS
SELECT t.pid, p.grp, t.day_index, COUNT(*) AS trials, SUM(t.completed) AS completed,
       ROUND(SUM(COALESCE(t.movement_ms, 0)) / 60000, 1) AS writing_minutes
FROM trials t JOIN participants p ON p.pid = t.pid
WHERE t.kind IN ('practice','word')
GROUP BY t.pid, p.grp, t.day_index;
