// ═══════════════════════════════════════════════════════════════════════════════
// TÖNE — kurze, leise Klänge, direkt im Browser erzeugt (keine Audiodateien)
// ═══════════════════════════════════════════════════════════════════════════════
// Töne bestätigen eine Handlung (Strich geschafft, Buchstabe fertig) und ersetzen
// keine Sprache. Sie bleiben kurz und leise, damit sie nicht vom Schreiben ablenken.
let actx = null;
let soundOn = true;

export function setSoundOn(on) {
  soundOn = !!on;
}

function ctx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!actx) actx = new AC();
  // Browser starten Audio erst nach einer Berührung — dann wieder aufwecken
  if (actx.state === "suspended") actx.resume().catch(() => {});
  return actx;
}

function tone(ac, f, start, dur, { type = "sine", vol = 0.1, to = null } = {}) {
  const t = ac.currentTime + start;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(ac.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

const SOUNDS = {
  tap: (ac) => tone(ac, 880, 0, 0.06, { vol: 0.05 }),
  pop: (ac) => tone(ac, 520, 0, 0.09, { vol: 0.07, to: 820 }),
  stroke: (ac) => {
    tone(ac, 660, 0, 0.09, { type: "triangle", vol: 0.08 });
    tone(ac, 990, 0.07, 0.12, { type: "triangle", vol: 0.07 });
  },
  oops: (ac) => {
    tone(ac, 330, 0, 0.15, { type: "triangle", vol: 0.07, to: 260 });
    tone(ac, 260, 0.13, 0.2, { type: "triangle", vol: 0.06, to: 210 });
  },
  soft: (ac) => [440, 554].forEach((f, i) => tone(ac, f, i * 0.1, 0.18, { type: "triangle", vol: 0.07 })),
  done: (ac) => [523, 659, 784].forEach((f, i) => tone(ac, f, i * 0.09, 0.2, { type: "triangle", vol: 0.08 })),
  fanfare: (ac) =>
    [523, 659, 784, 1047].forEach((f, i) => tone(ac, f, i * 0.1, i === 3 ? 0.45 : 0.16, { type: "triangle", vol: 0.09 })),
  unlock: (ac) => [784, 988, 1175, 1568].forEach((f, i) => tone(ac, f, i * 0.07, 0.22, { vol: 0.07 })),
};

export function sfx(kind) {
  if (!soundOn) return;
  try {
    const ac = ctx();
    if (ac && SOUNDS[kind]) SOUNDS[kind](ac);
  } catch {
    /* Ton ist Zugabe — Fehler nie anzeigen */
  }
}
