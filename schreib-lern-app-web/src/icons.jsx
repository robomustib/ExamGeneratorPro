// ═══════════════════════════════════════════════════════════════════════════════
// SYMBOLE — ein ruhiger, einheitlicher Satz statt bunter Emojis
// ═══════════════════════════════════════════════════════════════════════════════
// Viele verschiedene, detailreiche Bildchen lenken Kinder ab. Deshalb: wenige,
// klare Linien-Symbole in einer Farbe. Emojis bleiben nur dort, wo sie Lerninhalt
// sind (Anlaut-Bild „Maus“, Wortbilder).

const PATHS = {
  back: "M15 5 8 12l7 7",
  close: "M6 6l12 12M18 6 6 18",
  check: "M5 12.5l4.5 4.5L19 7",
  redo: "M4 12a8 8 0 1 0 2.4-5.7M4 4.5v4h4",
  next: "M9 5l7 7-7 7",
  speaker: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11",
  speakerOff: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5",
  music: "M9 17.5V6l10-2v11.5M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 15.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z",
  musicOff: "M9 17.5V6l10-2v11.5M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM3 3l18 18",
  book: "M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5v13",
  chest: "M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4M10 10v3h4v-3",
  map: "M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6zM9 4v14M15 6v14",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  // Übungsarten
  hand: "M8.5 12.5V5.5a1.5 1.5 0 0 1 3 0V11M11.5 10.5V4a1.5 1.5 0 0 1 3 0v6.5M14.5 10.5V6a1.5 1.5 0 0 1 3 0v7.5a6.5 6.5 0 0 1-6.5 6.5h-.5a6 6 0 0 1-5-2.7l-2.4-3.6a1.5 1.5 0 0 1 2.4-1.8l2 2.6",
  pencil: "M4 20l1.2-4.5L15.5 5.2a2 2 0 0 1 2.8 0l.5.5a2 2 0 0 1 0 2.8L8.5 18.8zM14 6.7l3.3 3.3",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  bulb: "M9.5 17.5h5M10.5 20.5h3M12 3.5a5.5 5.5 0 0 0-3.4 9.8c.7.6 1 1.3 1 2.2h4.8c0-.9.3-1.6 1-2.2A5.5 5.5 0 0 0 12 3.5z",
  install: "M12 4v10M8 10l4 4 4-4M5 17v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2",
};
const FILLED = {
  play: "M8 5.2v13.6a1 1 0 0 0 1.5.9l10.6-6.8a1 1 0 0 0 0-1.7L9.5 4.3A1 1 0 0 0 8 5.2z",
  star: "M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z",
};

export function Icon({ name, size = 22, color = "currentColor", stroke = 2.6, style, title }) {
  const fill = FILLED[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0, ...style }}
      role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {fill ? <path d={fill} fill={color} strokeLinejoin="round" stroke={color} strokeWidth="1" />
        : <path d={PATHS[name]} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

// Stern für Bewertungen (gefüllt oder leer)
export function Star({ size = 22, on = true, color = "#ffc93c", edge = "#e0a100", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0, ...style }} aria-hidden="true">
      <path d={FILLED.star} fill={on ? color : "#e6e9f0"} stroke={on ? edge : "#d3d8e3"} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

// Schlichte Bilder der drei Welten (flache Formen in den Farben der Welt)
export function WorldArt({ world, size = 64 }) {
  const w = size, h = size * 0.75;
  if (world === "GROß")
    return (
      <svg width={w} height={h} viewBox="0 0 64 48" aria-hidden="true">
        <circle cx="50" cy="12" r="6" fill="#ffd54a" />
        <path d="M2 44 22 12l20 32z" fill="#8b5cf6" />
        <path d="M22 12l-6.5 10.4 3.5-1.5 3 2.6 3-2.6 3.5 1.5z" fill="#fff" />
        <path d="M26 44l16-24 20 24z" fill="#a78bfa" />
        <path d="M42 20l-5 7.5 2.7-1 2.3 2 2.3-2 2.7 1z" fill="#fff" />
        <rect x="0" y="43" width="64" height="5" rx="2.5" fill="#c4b5fd" />
      </svg>
    );
  if (world === "klein")
    return (
      <svg width={w} height={h} viewBox="0 0 64 48" aria-hidden="true">
        <rect x="14" y="30" width="5" height="14" rx="2" fill="#a16207" />
        <circle cx="16.5" cy="24" r="12" fill="#22c55e" />
        <rect x="40" y="26" width="5" height="18" rx="2" fill="#a16207" />
        <circle cx="42.5" cy="18" r="14" fill="#16a34a" />
        <circle cx="38" cy="14" r="3" fill="#4ade80" />
        <rect x="0" y="43" width="64" height="5" rx="2.5" fill="#86efac" />
      </svg>
    );
  return (
    <svg width={w} height={h} viewBox="0 0 64 48" aria-hidden="true">
      <path d="M0 40q8-4 16 0t16 0 16 0 16 0v8H0z" fill="#7dd3fc" />
      <path d="M12 41a20 9 0 0 1 40 0z" fill="#fcd34d" />
      <path d="M33 40c0-9 1-17 4-24" stroke="#a16207" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M37 16c-6-4-12-3-15 1 5-1 9 0 15-1zM37 16c3-6 9-8 14-6-4 1-9 3-14 6zM37 16c5-1 10 2 12 7-4-3-8-5-12-7zM37 16c-3 2-6 6-6 10 2-4 4-7 6-10z" fill="#0ea5e9" />
    </svg>
  );
}

// Schatztruhe auf der Lernkarte: zu (noch nicht erreicht), bereit (wackelt) oder offen
export function ChestArt({ state = "locked", size = 56 }) {
  const gold = state === "locked" ? "#c3cad8" : "#f5b72d";
  const wood = state === "locked" ? "#9aa3b5" : "#b4672b";
  const woodD = state === "locked" ? "#7f889b" : "#8a4b1c";
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
      {state === "ready" && <circle cx="28" cy="30" r="26" fill="#ffe58a" opacity="0.55" />}
      {state !== "open" && <rect x="8" y="26" width="40" height="22" rx="4" fill={wood} stroke={woodD} strokeWidth="2.5" />}
      {state !== "open" && <rect x="8" y="34" width="40" height="4" fill={gold} />}
      {state === "open" ? (
        <>
          <circle cx="28" cy="22" r="22" fill="#ffe58a" opacity="0.45" />
          <path d="M9 27C9 12 18 7 28 7s19 5 19 20z" fill={wood} stroke={woodD} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M14 26c0-9 6-13 14-13s14 4 14 13z" fill="#6b3512" />
          <rect x="8" y="27" width="40" height="21" rx="4" fill={wood} stroke={woodD} strokeWidth="2.5" />
          <rect x="11" y="27" width="34" height="5" rx="1.5" fill="#3b2412" />
          <rect x="8" y="35" width="40" height="4" fill={gold} />
        </>
      ) : (
        <>
          <path d="M8 26a8 8 0 0 1 8-8h24a8 8 0 0 1 8 8z" fill={wood} stroke={woodD} strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="23" y="23" width="10" height="13" rx="2.5" fill={gold} stroke={woodD} strokeWidth="2" />
          {state === "locked" && <circle cx="28" cy="30" r="1.8" fill={woodD} />}
          {state === "ready" && <path d="M28 27.5v4" stroke={woodD} strokeWidth="2" strokeLinecap="round" />}
        </>
      )}
    </svg>
  );
}
