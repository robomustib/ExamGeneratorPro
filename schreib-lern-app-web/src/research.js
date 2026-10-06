// ═══════════════════════════════════════════════════════════════════════════════
// FORSCHUNGSMODUS
// Erhebt pseudonyme Messwerte für eine Studie — aber nur, wenn
//   1. auf dem Webserver forschung/config.json mit "enabled": true liegt,
//   2. die Eltern eingewilligt haben und
//   3. das Kind zugestimmt hat.
// Ohne Einwilligung wird nichts gemessen, gespeichert oder gesendet.
// Details: Forschungsdesign-Dokument und forschung/README.md
// ═══════════════════════════════════════════════════════════════════════════════
import { useSyncExternalStore } from "react";

const CONFIG_URL = "./forschung/config.json";
const STATE_KEY = "slk_research_v1";
const APP_VERSION = "2.0";
const MAX_BATCH = 40;
const MAX_QUEUE = 3000;

let cfg = null;            // Studienkonfiguration vom Server
let endpoint = null;
let state = loadState();   // { pid, token, group, enrolledAt, consentVersion, traces, wavesDone, queue, sessions }
let session = null;        // aktuelle Sitzung (nur im Speicher, wird mit dem ersten Upload gesendet)
let seq = 0;
let flushTimer = null;
let flushing = false;
const listeners = new Set();
let snap;                  // Momentaufnahme für React (wird unten nach den Hilfsfunktionen gebaut)

// ── Zustand ───────────────────────────────────────────────────────────────────
function loadState() {
  try { return JSON.parse(localStorage.getItem(STATE_KEY)) || {}; } catch { return {}; }
}
function saveState() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch { /* Speicher voll */ }
}
const dayMs = 24 * 60 * 60 * 1000;
const localDay = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
const daysSince = (ms) => Math.round((localDay(Date.now()) - localDay(ms)) / dayMs);

function buildSnapshot() {
  const enrolled = !!state.pid;
  const waves = cfg?.waves || [0, 28, 56];
  const day = enrolled ? daysSince(state.enrolledAt) : 0;
  const done = state.wavesDone || {};
  let dueWave = null;
  if (enrolled) for (let i = 0; i < waves.length; i++) if (!done[i] && day >= waves[i]) { dueWave = i; break; }
  const complete = enrolled && waves.every((_, i) => done[i]);
  return {
    available: !!cfg?.enabled,
    enrolled,
    pid: state.pid || null,
    group: state.group || null,
    day,
    waves,
    wavesDone: done,
    dueWave,
    // Wartekontrollgruppe: bis alle Tests gemacht sind (spätestens 2 Wochen nach dem letzten)
    restricted: enrolled && state.group === "nachfahren" && !complete && day < waves[waves.length - 1] + 14,
    pending: (state.queue || []).length,
    probeChars: cfg?.probeChars || [],
    infoUrl: cfg?.infoUrl ? new URL(cfg.infoUrl, new URL(CONFIG_URL, location.href)).href : null,
    contact: cfg?.contact || "",
    studyTitle: cfg?.studyTitle || "Schreiben-lernen-Studie",
  };
}
function notify() { snap = buildSnapshot(); listeners.forEach((l) => l()); }
snap = buildSnapshot();

export function useResearch() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => snap);
}

// ── Start ─────────────────────────────────────────────────────────────────────
export async function initResearch() {
  if (location.protocol === "file:") return;   // per Doppelklick geöffnet: kein Server, keine Studie
  try {
    const res = await fetch(CONFIG_URL, { cache: "no-store" });
    if (!res.ok) return;
    const c = await res.json();
    if (!c?.enabled) return;
    cfg = c;
    endpoint = new URL(c.endpoint || "api.php", new URL(CONFIG_URL, location.href)).href;
  } catch { return; }    // kein Server (z. B. Datei lokal geöffnet) → Forschungsmodus aus
  if (state.pid) startSession();
  window.addEventListener("online", () => flush());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(true); });
  window.addEventListener("pointerdown", (e) => { if (session && session.input !== e.pointerType) session.input = e.pointerType || "unknown"; }, { capture: true, passive: true });
  notify();
  flush();
}

function randomString(alphabet, n) {
  const a = new Uint32Array(n); crypto.getRandomValues(a);
  return Array.from(a, (v) => alphabet[v % alphabet.length]).join("");
}
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne I, O, 0, 1 (Verwechslung)
const newId = (n) => randomString("abcdefghijklmnopqrstuvwxyz0123456789", n);

function deviceClass() {
  const s = Math.min(screen.width, screen.height);
  const coarse = matchMedia("(pointer: coarse)").matches;
  return !coarse ? "desktop" : s < 600 ? "phone" : "tablet";
}

function startSession(fieldScale = 1) {
  const now = new Date();
  session = {
    sid: newId(12),
    t0: performance.now(),
    started_on: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    started_hour: now.getHours(),
    day_index: daysSince(state.enrolledAt),
    app_version: APP_VERSION,
    device: deviceClass(),
    input: "unknown",
    screen_w: Math.round(screen.width),
    screen_h: Math.round(screen.height),
    dpr: Math.round((window.devicePixelRatio || 1) * 10) / 10,
    field_scale: fieldScale,
  };
  seq = 0;
}
export function setFieldScale(s) { if (session) session.field_scale = Math.round(s * 100) / 100; }

// ── Server ────────────────────────────────────────────────────────────────────
async function post(body, { beacon = false } = {}) {
  const json = JSON.stringify(body);
  if (beacon && navigator.sendBeacon) {
    return navigator.sendBeacon(endpoint, new Blob([json], { type: "application/json" })) ? { ok: true, beacon: true } : null;
  }
  const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: json, keepalive: json.length < 60000 });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { code: data.error, status: res.status });
  return data;
}

// Anmeldung: Teilnahmecode und geheimer Schlüssel entstehen auf dem Gerät.
// Der Server speichert vom Schlüssel nur einen Hash und lost die Gruppe aus.
export async function enroll({ ageMonths, grade, handedness, homeLang, gender, traces }) {
  if (!cfg) throw new Error("not_available");
  for (let attempt = 0; attempt < 3; attempt++) {
    const pid = randomString(CODE_ALPHABET, 6);
    const token = randomString("0123456789abcdef", 64);
    try {
      const r = await post({
        action: "enroll", study: cfg.studyId, pid, token, consent_version: cfg.consentVersion,
        consent_traces: !!traces, age_months: ageMonths, grade, handedness, home_lang: homeLang, gender,
      });
      state = { pid, token, group: r.group, enrolledAt: Date.now(), consentVersion: cfg.consentVersion, traces: !!traces, wavesDone: {}, queue: [] };
      saveState();
      startSession(session?.field_scale || 1);
      notify();
      return state;
    } catch (e) {
      if (e.code !== "pid_taken") throw e;
    }
  }
  throw new Error("pid_taken");
}

export async function withdraw() {
  if (!state.pid) return;
  await post({ action: "withdraw", pid: state.pid, token: state.token });
  state = {}; session = null; saveState();
  try { localStorage.removeItem(STATE_KEY); } catch { /* egal */ }
  notify();
}

export async function exportMyData() {
  const data = await post({ action: "export", pid: state.pid, token: state.token });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `studiendaten-${state.pid}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function markWaveDone(i) {
  if (!state.pid) return;
  state.wavesDone = { ...(state.wavesDone || {}), [i]: true };
  saveState(); notify();
}

// ── Messwerte ─────────────────────────────────────────────────────────────────
// Punkte kommen als [x, y, t] im 260×310-Raster des Schreibfelds; gespeichert wird
// in Buchstaben-Einheiten (Breite 100, Höhe 130), damit Geräte vergleichbar sind.
const toUnits = (p, W, H) => [p[0] * 100 / W, p[1] * 130 / H, p[2]];

const SMOOTH_MS = 40;   // Glättungsfenster ±40 ms (entspricht etwa einem Tiefpass um 10 Hz)
function strokeStats(pts) {
  let len = 0;
  const v = [];          // [Zeit, Geschwindigkeit]
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    len += d;
    const dt = pts[i][2] - pts[i - 1][2];
    if (dt > 0) v.push([(pts[i][2] + pts[i - 1][2]) / 2, d / dt * 1000]);
  }
  // Flüssigkeit (NIV = number of inversions in velocity): Geschwindigkeitsgipfel nach
  // Glättung über ein Zeitfenster — unabhängig davon, wie oft das Gerät Punkte liefert
  const sm = v.map(([t]) => {
    let sum = 0, n = 0;
    for (const [tj, vj] of v) if (Math.abs(tj - t) <= SMOOTH_MS) { sum += vj; n++; }
    return sum / n;
  });
  const max = Math.max(0, ...sm);
  let niv = 0;
  for (let i = 1; i < sm.length - 1; i++) if (sm[i] > sm[i - 1] && sm[i] >= sm[i + 1] && sm[i] > 0.1 * max) niv++;
  if (sm.length && niv === 0) niv = 1;
  const dur = pts.length > 1 ? pts[pts.length - 1][2] - pts[0][2] : 0;
  return { len, dur, niv };
}

// attempts: [{ pts:[[x,y,t]…], accepted, verdict, expected }]
export function trialMetrics({ attempts, onset, W = 260, H = 310 }) {
  const ok = attempts.filter((a) => a.accepted && a.pts.length > 1);
  const all = attempts.filter((a) => a.pts.length > 0);
  const strokes = attempts.map((a, idx) => {
    const u = a.pts.map((p) => toUnits(p, W, H));
    const s = strokeStats(u);
    return {
      idx, expected_idx: a.expected ?? null, accepted: a.accepted ? 1 : 0, verdict: a.verdict || "ok",
      start_ms: u.length ? Math.round(u[0][2] - onset) : null, dur_ms: Math.round(s.dur),
      len: +s.len.toFixed(2), niv: s.niv, _pts: u,
    };
  });
  // Zeiten und Bewegung über alle Striche (auch zurückgenommene): so viel hat das Kind geschrieben
  const drawnS = strokes.filter((s) => s._pts.length > 0);
  const first = all.length ? all[0].pts[0][2] : null;
  const lastPts = all.length ? all[all.length - 1].pts : null;
  const last = lastPts ? lastPts[lastPts.length - 1][2] : null;
  const pendown = drawnS.reduce((s, x) => s + x.dur_ms, 0);
  const path = drawnS.reduce((s, x) => s + x.len, 0);
  const movement = first != null ? Math.round(last - first) : null;
  return {
    latency_ms: first != null ? Math.round(first - onset) : null,
    movement_ms: movement,
    pendown_ms: Math.round(pendown),
    inair_ms: movement != null ? Math.max(0, movement - Math.round(pendown)) : null,
    n_strokes: ok.length,
    n_rejected: attempts.filter((a) => !a.accepted).length,
    path_len: +path.toFixed(2),
    mean_speed: pendown > 0 ? +(path / pendown * 1000).toFixed(2) : null,
    niv_per_stroke: drawnS.length ? +(drawnS.reduce((s, x) => s + x.niv, 0) / drawnS.length).toFixed(2) : null,
    strokes,
  };
}

// Einen Schreibversuch in die Warteschlange legen
export function logTrial(t) {
  if (!state.pid || !cfg) return;
  if (!session) startSession();
  const { strokes = [], onset, ...rest } = t;
  const rec = {
    tid: newId(16), sid: session.sid, seq: seq++, day_index: daysSince(state.enrolledAt),
    t_onset_ms: onset != null ? Math.max(0, Math.round(onset - session.t0)) : null,
    ...rest,
    strokes: strokes.map(({ _pts, ...s }) => s),
  };
  if (state.traces) {
    // Schreibspuren (nur mit eigener Einwilligung): Zeit relativ zum Aufgabenbeginn, gerundet
    rec.trace = strokes.map((s) => s._pts.slice(0, 600).map((p) => [+p[0].toFixed(1), +p[1].toFixed(1), Math.round(p[2] - onset)]));
  }
  state.queue = [...(state.queue || []), rec].slice(-MAX_QUEUE);
  state.sessions = { ...(state.sessions || {}), [session.sid]: { ...session, t0: undefined } };
  saveState(); notify();
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => flush(), (cfg.uploadDelaySec || 20) * 1000);
}

export async function flush(beacon = false) {
  if (!cfg || !state.pid || flushing || !(state.queue || []).length || !navigator.onLine) return;
  flushing = true;
  try {
    while ((state.queue || []).length) {
      const batch = state.queue.slice(0, MAX_BATCH);
      const sids = [...new Set(batch.map((t) => t.sid))];
      const sessions = sids.map((sid) => state.sessions?.[sid]).filter(Boolean);
      const body = { action: "upload", pid: state.pid, token: state.token, sessions, trials: batch };
      const r = await post(body, { beacon });
      if (r.beacon) break;      // beim Verlassen der Seite: abschicken und nicht warten
      const accepted = new Set(r.accepted || []);
      state.queue = state.queue.filter((t) => !accepted.has(t.tid));
      // Sitzungen ohne offene Versuche müssen nicht erneut gesendet werden
      const open = new Set(state.queue.map((t) => t.sid));
      state.sessions = Object.fromEntries(Object.entries(state.sessions || {}).filter(([sid]) => open.has(sid) || sid === session?.sid));
      saveState(); notify();
      if (!accepted.size) break;
    }
  } catch (e) {
    if (e.code === "unknown_participant") { state = {}; saveState(); notify(); }   // auf dem Server gelöscht
  } finally {
    flushing = false;
  }
}
