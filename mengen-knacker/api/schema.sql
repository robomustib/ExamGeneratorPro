-- Blitz-Mengen-Knacker – Datenbankschema für die Studie
-- MySQL 8.0+ oder MariaDB 10.5+, Zeichensatz utf8mb4. Alle Zeitangaben in UTC.
-- Es gibt keine Spalten für Namen, E-Mail-Adressen, Geburtsdaten oder IP-Adressen.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS participants (
  pid                 VARCHAR(12)  NOT NULL COMMENT 'zufälliger Teilnahme-Code, z. B. MK-7F3K-92QD',
  secret_hash         VARCHAR(255) NOT NULL COMMENT 'password_hash() des Geräte-Schlüssels',
  status              ENUM('active','withdrawn') NOT NULL DEFAULT 'active',
  enrolled_at         DATETIME     NOT NULL,
  withdrawn_at        DATETIME     NULL,
  last_upload_at      DATETIME     NULL,
  consent_version     VARCHAR(16)  NOT NULL,
  consent_participate TINYINT(1)   NOT NULL,
  consent_health      TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Art. 9 DSGVO: Angabe zur Rechenschwäche',
  consent_open_data   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'anonymisierte Veröffentlichung erlaubt',
  child_assent        TINYINT(1)   NOT NULL,
  age_months          SMALLINT     NOT NULL COMMENT 'Alter bei Anmeldung, 60–95',
  grade               ENUM('kita','1','2','other') NOT NULL,
  gender              ENUM('f','m','d','na') NOT NULL DEFAULT 'na',
  home_language       ENUM('de','partly','other','na') NOT NULL DEFAULT 'na',
  math_difficulty     ENUM('diagnosed','suspected','no','unknown') NULL COMMENT 'nur mit consent_health = 1',
  stratum             ENUM('young','old') NOT NULL COMMENT 'unter 78 / ab 78 Monate',
  arm_engine          ENUM('adaptive','static') NOT NULL COMMENT 'Faktor A',
  arm_stage           ENUM('basal','structured') NOT NULL COMMENT 'Faktor B',
  device_class        ENUM('phone','tablet','desktop') NULL,
  app_version         VARCHAR(16)  NOT NULL,
  PRIMARY KEY (pid),
  KEY idx_arm (arm_engine, arm_stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  pid           VARCHAR(12) NOT NULL,
  sid           CHAR(36)    NOT NULL,
  kind          ENUM('train','check') NOT NULL,
  check_id      VARCHAR(4)  NULL,
  started_at    DATETIME    NOT NULL,
  day_index     SMALLINT    NOT NULL COMMENT 'Tage seit Anmeldung (Ortszeit)',
  local_hour    TINYINT     NOT NULL,
  duration_s    INT         NOT NULL,
  n_trials      SMALLINT    NOT NULL,
  n_correct     SMALLINT    NOT NULL,
  n_fast        SMALLINT    NOT NULL,
  completed     TINYINT(1)  NOT NULL,
  only_task     VARCHAR(10) NULL COMMENT 'Kind hat nur dieses Spiel gewählt',
  standalone    TINYINT(1)  NOT NULL COMMENT 'als App installiert',
  device_class  ENUM('phone','tablet','desktop') NULL,
  app_version   VARCHAR(16) NOT NULL,
  received_at   DATETIME    NOT NULL,
  PRIMARY KEY (pid, sid),
  CONSTRAINT fk_sessions_pid FOREIGN KEY (pid) REFERENCES participants (pid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trials (
  pid             VARCHAR(12)  NOT NULL,
  seq             INT UNSIGNED NOT NULL COMMENT 'laufende Nummer pro Gerät, verhindert Doppelte',
  sid             CHAR(36)     NOT NULL,
  kind            ENUM('train','check') NOT NULL,
  check_id        VARCHAR(4)   NULL,
  trial_idx       SMALLINT     NOT NULL COMMENT 'Position in der Runde, ab 0',
  block_no        TINYINT      NULL,
  ts              DATETIME     NOT NULL COMMENT 'Zeitpunkt der Antwort, UTC',
  day_index       SMALLINT     NOT NULL,
  local_hour      TINYINT      NOT NULL,
  task            ENUM('blitz','match','compare','line','partner') NOT NULL,
  item_key        VARCHAR(40)  NOT NULL,
  quantity        TINYINT      NULL COMMENT 'gezeigte Menge bzw. gesuchte Zahl',
  rep             ENUM('tenframe','dice','fingers','ladybug','fruit','cloud') NULL,
  fmt             ENUM('digits','dots','mixed') NULL COMMENT 'nur Vergleichen',
  val_left        TINYINT      NULL,
  val_right       TINYINT      NULL,
  options         VARCHAR(16)  NULL COMMENT 'Zuordnen: angebotene Mengen',
  stage           TINYINT      NOT NULL COMMENT 'Lernstufe 1 oder 2',
  max_n           TINYINT      NOT NULL,
  exposure_ms     SMALLINT     NULL COMMENT 'Zeigezeit, NULL wenn Bild stehen bleibt',
  answer          TINYINT      NULL COMMENT 'getippte Zahl, Menge oder Position; NULL bei „Weiß nicht“',
  correct         TINYINT(1)   NOT NULL,
  rt_ms           INT          NOT NULL COMMENT 'ab Erscheinen des Bildes',
  cls             ENUM('fast','ok','slow','wrong','guess','help') NOT NULL,
  answered_visible TINYINT(1)  NULL COMMENT '1 = Antwort, solange das Bild noch zu sehen war',
  theta_before    FLOAT        NULL COMMENT 'Elo-Fähigkeit vor der Antwort',
  beta_before     FLOAT        NULL COMMENT 'Elo-Schwierigkeit der Aufgabe vor der Antwort',
  p_pred          FLOAT        NULL COMMENT 'vorhergesagte Lösungswahrscheinlichkeit',
  ladder_level    TINYINT      NULL COMMENT 'Zeigezeit-Stufe 0–7',
  is_retry        TINYINT(1)   NOT NULL DEFAULT 0,
  interrupted     TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'App war während der Aufgabe im Hintergrund',
  baseline_ms     SMALLINT     NULL COMMENT 'persönliches Grundtempo zu diesem Zeitpunkt',
  received_at     DATETIME     NOT NULL,
  PRIMARY KEY (pid, seq),
  KEY idx_session (pid, sid),
  KEY idx_check (kind, check_id),
  CONSTRAINT fk_trials_pid FOREIGN KEY (pid) REFERENCES participants (pid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Zuteilung: Blöcke zu 4 Plätzen je Altersschicht, Reihenfolge zufällig, vorher nicht einsehbar.
CREATE TABLE IF NOT EXISTS rand_blocks (
  stratum   ENUM('young','old') NOT NULL,
  block_no  INT     NOT NULL,
  slots     VARCHAR(64) NOT NULL COMMENT 'z. B. A2,S1,A1,S2 (A/S = adaptiv/statisch, 1/2 = basal/strukturiert)',
  used      TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (stratum, block_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nachweis von Anmeldung und Widerruf ohne Klartext-Code (Rechenschaftspflicht, Art. 5 Abs. 2 DSGVO).
CREATE TABLE IF NOT EXISTS audit_log (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  at        DATETIME    NOT NULL,
  action    ENUM('enrol','withdraw_keep','withdraw_delete','delete_by_staff') NOT NULL,
  pid_hash  CHAR(64)    NOT NULL COMMENT 'SHA-256 aus Pepper und Code',
  consent_version VARCHAR(16) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auswertungssichten ------------------------------------------------------------

-- Ein Punktwert je Kind und Mengen-Check. Nur vollständige Checks zählen für den primären Endpunkt.
CREATE OR REPLACE VIEW v_check_scores AS
SELECT
  t.pid,
  t.check_id,
  MIN(t.day_index)                                                   AS day_index,
  COUNT(*)                                                           AS n_items,
  SUM(t.interrupted)                                                 AS n_interrupted,
  SUM(t.task = 'blitz' AND t.correct = 1 AND t.quantity BETWEEN 4 AND 10) AS blitz_4_10,
  SUM(t.task = 'blitz' AND t.correct = 1)                            AS blitz_all,
  SUM(t.task = 'compare' AND t.correct = 1)                          AS compare_correct,
  AVG(CASE WHEN t.task = 'line' AND t.answer IS NOT NULL THEN ABS(t.answer - t.quantity) END) AS line_abs_error,
  (COUNT(*) = 36)                                                    AS complete
FROM trials t
WHERE t.kind = 'check'
GROUP BY t.pid, t.check_id;

-- Gruppen verblindet: Codes X/Y statt adaptiv/statisch, bis der Auswertungsplan eingefroren ist.
CREATE OR REPLACE VIEW v_participants_blind AS
SELECT
  pid, enrolled_at, status, age_months, grade, gender, home_language, stratum,
  CASE WHEN consent_health = 1 THEN math_difficulty END AS math_difficulty,
  consent_open_data,
  CASE arm_engine WHEN 'adaptive' THEN 'X' ELSE 'Y' END AS factor_a,
  CASE arm_stage  WHEN 'basal'    THEN 'P' ELSE 'Q' END AS factor_b,
  device_class
FROM participants;
