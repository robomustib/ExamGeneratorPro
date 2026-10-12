// ═══════════════════════════════════════════════════════════════════════════════
// BEWERTUNG — wie gut passt die Schrift des Kindes zur Vorlage?
// ═══════════════════════════════════════════════════════════════════════════════
// Nachfahren: Die Vorlage liegt im Feld, gemessen wird direkt an ihr (scoreDrawing).
// Frei geschrieben (abschreiben, aus dem Kopf, Schreibtest): Ohne Vorlage im Feld
// schreibt kaum ein Kind an genau derselben Stelle und in derselben Größe. Dann zählt
// die Form: Die Vorlage wird zuerst an die Schrift angelegt (verschoben, Größe angepasst,
// Breite und Höhe leicht unabhängig voneinander) und erst dann verglichen (scoreFree).
// Alle Maße in Feld-Koordinaten (260 × 310).

export function polyLength(p) {
  let L = 0;
  for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return L;
}

// Abstand eines Punkts zur nächsten Stelle der Striche (Strecken, nicht nur Stützpunkte)
export function distToPolyline(px, py, strokes) {
  let minD = Infinity;
  for (const s of strokes) {
    if (s.length === 1) minD = Math.min(minD, Math.hypot(px - s[0][0], py - s[0][1]));
    for (let i = 1; i < s.length; i++) {
      const ax = s[i - 1][0], ay = s[i - 1][1], bx = s[i][0], by = s[i][1];
      const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
      if (len2 === 0) { minD = Math.min(minD, Math.hypot(px - ax, py - ay)); continue; }
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      minD = Math.min(minD, Math.hypot(px - (ax + t * dx), py - (ay + t * dy)));
    }
  }
  return minD;
}

export function bbox(pts) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

// Nachfahren: Genauigkeit 50 %, Abdeckung der Vorlage 40 %, Längen-Abzug fürs Kritzeln
export function scoreDrawing(drawnStrokes, tpl, TOL) {
  const pts = drawnStrokes.flat(); if (pts.length < 4) return { raw: 0, accuracy: 0, coverage: 0 };
  let acc = 0;
  for (const p of pts) {
    const d = distToPolyline(p[0], p[1], tpl);
    if (d <= TOL * 0.5) acc += 1; else if (d <= TOL) acc += 1 - (d - TOL * 0.5) / (TOL * 0.5);
  }
  const accuracy = acc / pts.length;
  const tplPts = tpl.flat(); let covered = 0;
  for (const t of tplPts) { if (pts.some((p) => Math.hypot(p[0] - t[0], p[1] - t[1]) < TOL * 1.4)) covered++; }
  const coverage = covered / tplPts.length;
  const drawnLen = drawnStrokes.reduce((s, st) => s + polyLength(st), 0);
  const ratio = drawnLen / Math.max(1, tpl.reduce((s, st) => s + polyLength(st), 0));
  const lengthPenalty = ratio > 2 ? Math.min(1, (ratio - 2) / 3) : 0;
  return { raw: (accuracy * 0.5 + coverage * 0.4) * (1 - lengthPenalty * 0.1), accuracy, coverage };
}

// Spiegelbild um die senkrechte Mittelachse (typisch bei J, Z, 3, 7, 9 …)
export function mirrorStrokes(strokes) {
  const b = bbox(strokes.flat()), cx = (b.x0 + b.x1) / 2;
  return strokes.map((s) => s.map(([x, y]) => [2 * cx - x, y]));
}

// ── Frei geschrieben: Form statt Stelle ───────────────────────────────────────
const DOT = 25;              // kürzere Vorlagen-Striche sind Punkte (i, j, ä, ö, ü)
const STEP = 3;              // Abstand der Messpunkte entlang der Striche
const SCALE = [0.72, 1.4];   // so viel kleiner/größer als die Vorlage darf der Buchstabe sein
const ASPECT = 1.3;          // so viel schmaler/breiter (im Verhältnis zur Höhe)
// Seitlich darf der Buchstabe beliebig verschoben sein, in der Höhe nur um etwa ein
// Viertel einer Zeile: Ein „p“ eine Zone tiefer als „P“ oder ein kleines „o“ statt „O“
// bleibt so ein Fehler.
const MAXDY = 30;
const LIM = { scale: SCALE, maxDy: MAXDY };
// Nur zum Erkennen „Form stimmt, aber Größe oder Lage auf den Linien nicht“
const FREE = { scale: [0.35, 2.8], maxDy: 400 };

export const transformStrokes = (strokes, { sx, sy, tx, ty }) =>
  strokes.map((s) => s.map(([x, y]) => [sx * x + tx, sy * y + ty]));

// Gleichmäßig verteilte Messpunkte, damit langsam geschriebene Stellen nicht mehr zählen.
// Jeder Punkt kennt seinen Strich (si) und die Richtung der Linie dort (dx, dy).
// Ein Punkt (Antippen oder i-Punkt der Vorlage) zählt wie ein kurzes Stück Strich.
function resample(strokes, step = STEP) {
  const out = [];
  strokes.forEach((s, si) => {
    if (!s.length) return;
    if (polyLength(s) < DOT) {
      const c = s[Math.floor(s.length / 2)];
      for (let i = 0; i < 4; i++) out.push([c[0], c[1], si, 0, 0, 1]);
      return;
    }
    const pts = [[s[0][0], s[0][1]]];
    let acc = 0;
    for (let i = 1; i < s.length; i++) {
      const ax = s[i - 1][0], ay = s[i - 1][1], bx = s[i][0], by = s[i][1];
      const d = Math.hypot(bx - ax, by - ay); if (!d) continue;
      let pos = step - acc;
      while (pos <= d) { pts.push([ax + ((bx - ax) * pos) / d, ay + ((by - ay) * pos) / d]); pos += step; }
      acc = d - (pos - step);
    }
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 2)], b = pts[Math.min(pts.length - 1, i + 2)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      out.push([p[0], p[1], si, (b[0] - a[0]) / l, (b[1] - a[1]) / l, 0]);
    });
  });
  return out;
}

// Für jeden Punkt aus A: Index und Abstand des nächsten Punkts aus B
function nearest(A, B) {
  return A.map((a) => {
    let bi = 0, bd = Infinity;
    for (let j = 0; j < B.length; j++) {
      const dx = a[0] - B[j][0], dy = a[1] - B[j][1], d = dx * dx + dy * dy;
      if (d < bd) { bd = d; bi = j; }
    }
    return [bi, Math.sqrt(bd)];
  });
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Lage und Größe in den erlaubten Grenzen halten (cy: Mitte der Vorlage in der Höhe)
function limit({ sx, sy, tx, ty }, cy, lim = LIM) {
  const s = clamp(Math.sqrt(Math.max(1e-6, sx) * Math.max(1e-6, sy)), lim.scale[0], lim.scale[1]);
  const r = clamp(Math.sqrt(Math.max(1e-6, sx) / Math.max(1e-6, sy)), 1 / Math.sqrt(ASPECT), Math.sqrt(ASPECT));
  const f = { sx: s * r, sy: s / r, tx, ty };
  const dy = f.sy * cy + f.ty - cy;
  if (Math.abs(dy) > lim.maxDy) f.ty -= dy - Math.sign(dy) * lim.maxDy;
  return f;
}

// Vorlage an die Schrift anlegen: Schritt für Schritt die nächsten Punkte zuordnen (in
// beide Richtungen, damit die Vorlage weder schrumpft noch Teile übersieht) und Lage und
// Größe nach der Methode der kleinsten Quadrate anpassen.
function fit(D, P, start, lim = LIM, iters = 14) {
  const cy = P.reduce((m, p) => m + p[1], 0) / P.length;
  let f = limit(start, cy, lim);
  for (let it = 0; it < iters; it++) {
    const Pt = P.map(([x, y]) => [f.sx * x + f.tx, f.sy * y + f.ty]);
    const pairs = [];
    nearest(D, Pt).forEach(([j, d], i) => pairs.push([P[j], D[i], d]));
    nearest(Pt, D).forEach(([i, d], j) => pairs.push([P[j], D[i], d]));
    // Ausreißer (Kritzel, fehlende Teile) bestimmen die Lage nicht mit
    pairs.sort((a, b) => a[2] - b[2]);
    const keep = pairs.slice(0, Math.max(3, Math.ceil(pairs.length * 0.85)));
    let px = 0, py = 0, qx = 0, qy = 0;
    for (const [p, q] of keep) { px += p[0]; py += p[1]; qx += q[0]; qy += q[1]; }
    const n = keep.length; px /= n; py /= n; qx /= n; qy /= n;
    let xx = 0, xq = 0, yy = 0, yq = 0;
    for (const [p, q] of keep) {
      const ux = p[0] - px, uy = p[1] - py;
      xx += ux * ux; xq += ux * (q[0] - qx); yy += uy * uy; yq += uy * (q[1] - qy);
    }
    // Einheitliche Größe als Rückfall, wenn eine Richtung kaum Ausdehnung hat (l, i, 1)
    const su = (xq + yq) / Math.max(1e-6, xx + yy);
    let sx = xx > 40 * n ? xq / xx : su, sy = yy > 40 * n ? yq / yy : su;
    const g = limit({ sx, sy, tx: 0, ty: 0 }, 0, lim);
    const next = limit({ sx: g.sx, sy: g.sy, tx: qx - g.sx * px, ty: qy - g.sy * py }, cy, lim);
    const moved = Math.abs(next.tx - f.tx) + Math.abs(next.ty - f.ty) + 100 * (Math.abs(next.sx - f.sx) + Math.abs(next.sy - f.sy));
    f = next;
    if (moved < 0.3) break;
  }
  return f;
}

// Form vergleichen. Ein Punkt der Schrift passt, wenn an dieser Stelle der Vorlage eine
// Linie in ähnlicher Richtung verläuft (so zählt Gekritzel nicht als „getroffen“).
// Punkte (i, j, ä, ö, ü) passen nur zu Punkten und dürfen ungenauer sitzen.
//   accuracy: wie viel der Schrift an der Vorlage liegt
//   coverage: wie viel der Vorlage geschrieben ist; parts: dasselbe je Vorlagen-Strich
//   extra: ein ganzer Strich (oder Punkt), der nicht zur Vorlage gehört
const COS = Math.cos((40 * Math.PI) / 180);
function closest(a, B) {
  let bd = Infinity;
  for (const b of B) {
    if (!a[5] && Math.abs(a[3] * b[3] + a[4] * b[4]) < COS) continue;   // Richtung (vor oder zurück egal)
    const dx = a[0] - b[0], dy = a[1] - b[1], d = dx * dx + dy * dy;
    if (d < bd) bd = d;
  }
  return Math.sqrt(bd);
}
function compare(D, tpl, T, drawnLen) {
  const P = resample(tpl);
  const split = (A) => [A.filter((p) => !p[5]), A.filter((p) => p[5])];
  const [Pl, Pd] = split(P), [Dl, Dd] = split(D);
  let acc = 0, run = 0, longRun = 0;
  const own = {};                                                   // Treffer je gezeichnetem Strich
  D.forEach((p, i) => {
    const d = p[5] ? closest(p, Pd) : closest(p, Pl);
    const c = p[5] ? (d <= T * 1.6 ? 1 : 0) : d <= T * 0.4 ? 1 : d <= T ? 1 - (d - T * 0.4) / (T * 0.6) : 0;
    acc += c;
    const o = (own[p[2]] ||= [0, 0, p[5]]); o[0] += c; o[1]++;
    // Längstes Stück ohne jeden Treffer (z. B. die Oberlänge, wenn „h“ statt „n“ geschrieben ist)
    run = !p[5] && !c && i && D[i - 1][2] === p[2] ? run + 1 : !p[5] && !c ? 1 : 0;
    longRun = Math.max(longRun, run);
  });
  const accuracy = acc / D.length;
  const extra = Object.values(own).some(([c, n, dot]) => (dot || n >= 8) && c / n < 0.35) || longRun * STEP >= 45;
  const n = tpl.length, hit = new Array(n).fill(0), all = new Array(n).fill(0);
  for (const p of P) {
    all[p[2]]++;
    if (p[5] ? closest(p, Dd) < T * 1.6 : closest(p, Dl) < T * 0.9) hit[p[2]]++;
  }
  const coverage = hit.reduce((s, v) => s + v, 0) / Math.max(1, P.length);
  const parts = all.map((v, i) => (v ? hit[i] / v : 1));
  const ratio = drawnLen / Math.max(1, tpl.reduce((s, st) => s + polyLength(st), 0));
  const lengthPenalty = ratio > 1.8 ? Math.min(1, (ratio - 1.8) / 2) : 0;
  // Beides muss stimmen: Zu viel Geschriebenes zählt so stark wie Fehlendes
  return { raw: accuracy * coverage * (1 - lengthPenalty * 0.3), accuracy, coverage, parts, extra };
}

function bestFit(drawnStrokes, D, tplStrokes, TOL, lim = LIM) {
  const P = resample(tplStrokes);
  const drawnLen = drawnStrokes.reduce((s, st) => s + polyLength(st), 0);
  const c = (A) => A.reduce((m, p) => [m[0] + p[0] / A.length, m[1] + p[1] / A.length], [0, 0]);
  const rms = (A, m) => Math.sqrt(A.reduce((s, p) => s + (p[0] - m[0]) ** 2 + (p[1] - m[1]) ** 2, 0) / A.length);
  const cd = c(D), cp = c(P), s0 = rms(D, cd) / Math.max(1e-6, rms(P, cp));
  const bd = bbox(D), bp = bbox(P);
  // Mehrere Startlagen: wie sie ist, auf die Mitte und Größe der Schrift, nur seitlich verschoben
  const starts = [
    { sx: 1, sy: 1, tx: 0, ty: 0 },
    { sx: s0, sy: s0, tx: cd[0] - s0 * cp[0], ty: cd[1] - s0 * cp[1] },
    { sx: 1, sy: 1, tx: (bd.x0 + bd.x1) / 2 - (bp.x0 + bp.x1) / 2, ty: 0 },
  ];
  let best = null;
  for (const st of starts) {
    const f = fit(D, P, st, lim);
    const tpl = transformStrokes(tplStrokes, f);
    const T = TOL * clamp(Math.sqrt(Math.sqrt(f.sx * f.sy)), 0.8, 1.2);
    const sc = compare(D, tpl, T, drawnLen);
    if (!best || sc.raw > best.raw) best = { ...sc, tpl, fit: f, T, drawnLen };
  }
  return best;
}

// Ergebnis: raw (0–1), accuracy, coverage, tpl (angelegte Vorlage zum Anzeigen), fit
// (Verschiebung und Größe), missing ("part" oder "dots" fehlen), extra (ein Strich zu
// viel), size (Form stimmt, aber "small"/"big": viel kleiner/größer, z. B. „o“ statt „O“,
// oder "high"/"low": auf der falschen Zeile, z. B. „p“ statt „P“)
// und mirrored (Buchstabe deutlich besser gespiegelt)
export function scoreFree(drawnStrokes, tplStrokes, TOL) {
  const D = resample(drawnStrokes.map((s) => s.map((p) => [p[0], p[1]])));
  if (D.length < 4) return { raw: 0, accuracy: 0, coverage: 0, tpl: tplStrokes, fit: { sx: 1, sy: 1, tx: 0, ty: 0 }, missing: null, extra: false, size: null, mirrored: false };
  const best = bestFit(drawnStrokes, D, tplStrokes, TOL);
  const dots = tplStrokes.map((s) => polyLength(s) < DOT);
  const missing = best.parts.some((v, i) => !dots[i] && v < 0.7) ? "part"
    : best.parts.some((v, i) => dots[i] && v < 0.5) ? "dots" : null;
  // Größe und Lage: Passt die Form sehr gut, sobald Größe und Höhe frei sind, dann ist es
  // der richtige Buchstabe, nur zu klein, zu groß oder auf der falschen Zeile (o statt O, p statt P)
  let size = null;
  const hd = bbox(D.filter((p) => !p[5])), ht = bbox(tplStrokes.filter((_, i) => !dots[i]).flat());
  const h = D.some((p) => !p[5]) ? (hd.y1 - hd.y0) / Math.max(1, ht.y1 - ht.y0) : 1;
  const oddHeight = h < 0.65 || h > 1.55;
  if (best.raw < 0.8 || oddHeight) {
    const free = bestFit(drawnStrokes, D, tplStrokes, TOL, FREE);
    if (free.raw >= 0.8 && (free.raw > best.raw + 0.15 || oddHeight)) {
      const f = free.fit, sc = Math.sqrt(f.sx * f.sy);
      const cy = tplStrokes.flat().reduce((m, p, _, a) => m + p[1] / a.length, 0);
      size = sc < 0.82 ? "small" : sc > 1.22 ? "big" : f.sy * cy + f.ty < cy ? "high" : "low";
    }
  }
  // Gespiegelt? Nur bei Zeichen, die gespiegelt anders aussehen
  const m = mirrorStrokes(tplStrokes);
  const symmetric = m.flat().every((p) => distToPolyline(p[0], p[1], tplStrokes) < TOL * 0.6);
  let mirrored = false;
  if (!symmetric) {
    // Mit enger Toleranz vergleichen: Beim „a“ liegt der Strich am Kreis an, gespiegelt
    // sieht er mit großzügiger Toleranz fast gleich aus
    const bm = bestFit(drawnStrokes, D, m, TOL);
    const tight = (b) => compare(D, b.tpl, b.T * 0.5, b.drawnLen).raw;
    mirrored = bm.raw > 0.6 && (bm.raw > best.raw + 0.1 || tight(bm) > tight(best) + 0.15);
  }
  const { T, drawnLen, ...rest } = best;
  return { ...rest, missing, size, mirrored };
}

// Sterne (1–5) für frei Geschriebenes. 5 = gut erkennbare, sauber geformte Schrift;
// dafür muss ein Kind nicht pixelgenau schreiben. Fehlt ein Teil, ist ein Strich zu viel
// oder passt die Größe gar nicht, höchstens 3.
export function freeStars(sc) {
  const r = sc.raw;
  let s = r >= 0.88 ? 5 : r >= 0.74 ? 4 : r >= 0.55 ? 3 : r >= 0.38 ? 2 : 1;
  if (sc.missing || sc.extra || sc.size) s = Math.min(s, 3);
  if (sc.mirrored) s = Math.min(s, 2);
  return s;
}
