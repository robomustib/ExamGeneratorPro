import { createContext, useContext } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// KLECKS — der Begleiter: ein kleiner Tintenklecks, der beim Schreiben hilft
// ═══════════════════════════════════════════════════════════════════════════════
// Lernbegleiter-Figuren haben in Studien einen kleinen, aber messbaren Nutzen,
// bei Schulkindern mehr als bei Erwachsenen (Schroeder, Adesope & Gilbert 2013).
// Farbe vom Kind gewählt (Personalisierung), Rückmeldung über Mimik und kurze,
// geschriebene und vorgelesene Sätze. Klecks setzt das Kind nie unter Druck
// („Ich bin traurig, wenn du nicht übst" gibt es bewusst nicht).

export const KLECKS_COLORS = [
  { id: "lila", c: "#9b6bff", d: "#6f42d9", name: "Lila" },
  { id: "blau", c: "#38bdf8", d: "#0b8fcf", name: "Blau" },
  { id: "gruen", c: "#34d399", d: "#139c6b", name: "Grün" },
  { id: "orange", c: "#ffa046", d: "#e07b17", name: "Orange" },
  { id: "pink", c: "#ff7eb6", d: "#e0538f", name: "Pink" },
  { id: "rot", c: "#ff6b6b", d: "#d94343", name: "Rot" },
];
export const klecksColor = (id) => KLECKS_COLORS.find((k) => k.id === id) || KLECKS_COLORS[0];

export const CompanionCtx = createContext({ color: "lila", accs: [] });

// Zubehör: mehrere Teile gleichzeitig. Teile am selben Platz (Hut und Krone sitzen
// beide auf der Spitze) ersetzen sich gegenseitig, alles andere lässt sich kombinieren.
const ACC_SLOT = { hat: "top", crown: "top", bow: "right", flower: "left", glasses: "face" };
const ACC_ORDER = ["flower", "bow", "glasses", "hat", "crown"];
export const accList = (a) => (Array.isArray(a) ? a : a ? [a] : []).filter((id) => ACC_SLOT[id]);
export function wearAcc(accs, id) {
  const list = accList(accs).filter((x) => ACC_SLOT[x] !== ACC_SLOT[id]);
  return [...list, id];
}
export function toggleAcc(accs, id) {
  const list = accList(accs);
  return list.includes(id) ? list.filter((x) => x !== id) : wearAcc(list, id);
}

const INK = "#2b2d42";

function Accessory({ id }) {
  if (id === "bow")
    return (
      <g transform="translate(83 36) rotate(18)" fill="#ff4d8d" stroke="#c2185b" strokeWidth="2" strokeLinejoin="round">
        <path d="M0 0 L-14 -8 L-14 8 Z" />
        <path d="M0 0 L14 -8 L14 8 Z" />
        <circle r="4.5" />
      </g>
    );
  if (id === "hat")
    return (
      <g>
        <path d="M60 -13 L45 21 Q60 27 75 21 Z" fill="#ffc93c" stroke="#e0a100" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="56" cy="9" r="2.6" fill="#ff7a59" />
        <circle cx="63" cy="1" r="2.4" fill="#38bdf8" />
        <circle cx="64" cy="15" r="2.6" fill="#34d399" />
        <circle cx="60" cy="-14" r="5" fill="#ff7eb6" stroke="#e0538f" strokeWidth="1.5" />
      </g>
    );
  if (id === "crown")
    return (
      <g>
        <path d="M44 23 L43 3 L52 13 L60 -4 L68 13 L77 3 L76 23 Z" fill="#ffd23f" stroke="#e0a100" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="60" cy="15" r="3" fill="#ff4d8d" />
        <circle cx="50" cy="18" r="2" fill="#38bdf8" />
        <circle cx="70" cy="18" r="2" fill="#34d399" />
      </g>
    );
  if (id === "flower")
    return (
      <g transform="translate(36 40)">
        {[0, 72, 144, 216, 288].map((a) => (
          <circle key={a} cx={6.5 * Math.cos((a * Math.PI) / 180)} cy={6.5 * Math.sin((a * Math.PI) / 180)} r="6" fill="white" stroke="#f9a8d4" strokeWidth="1.5" />
        ))}
        <circle r="4.5" fill="#ffc93c" />
      </g>
    );
  if (id === "glasses")
    return (
      <g fill="#ffffff38" stroke={INK} strokeWidth="3" strokeLinecap="round">
        <circle cx="46" cy="76" r="13.5" />
        <circle cx="74" cy="76" r="13.5" />
        <path d="M59 73 Q60 70 61 73" fill="none" />
        <path d="M32.5 73 L25 69 M87.5 73 L95 69" fill="none" />
      </g>
    );
  return null;
}

function Eyes({ mood }) {
  if (mood === "cheer")
    return (
      <g stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none">
        <path d="M37 79 Q46 67 55 79" />
        <path d="M65 79 Q74 67 83 79" />
      </g>
    );
  if (mood === "sleepy")
    return (
      <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M37 77 Q46 84 55 77" />
        <path d="M65 77 Q74 84 83 77" />
      </g>
    );
  const look = mood === "think" ? [3, -4] : [2, 2];
  return (
    <g style={{ transformOrigin: "60px 76px", animation: "kBlink 4.6s infinite" }}>
      {[46, 74].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="76" rx="10" ry="12" fill="white" />
          <circle cx={x + look[0]} cy={76 + look[1]} r="5.6" fill={INK} />
          <circle cx={x + look[0] + 1.8} cy={76 + look[1] - 2.2} r="2" fill="white" />
        </g>
      ))}
      {mood === "oops" && (
        <g stroke={INK} strokeWidth="3.5" strokeLinecap="round">
          <path d="M37 62 L52 59" />
          <path d="M83 62 L68 59" />
        </g>
      )}
    </g>
  );
}

function Mouth({ mood }) {
  if (mood === "cheer")
    return (
      <g>
        <path d="M47 93 Q60 113 73 93 Z" fill="#7a2e3a" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="60" cy="102" rx="6" ry="3.5" fill="#ff8fab" />
      </g>
    );
  if (mood === "oops")
    return <path d="M49 100 Q54.5 94 60 100 Q65.5 106 71 100" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />;
  if (mood === "think" || mood === "sleepy") return <ellipse cx="62" cy="99" rx="4.5" ry="5" fill="#7a2e3a" stroke={INK} strokeWidth="2.5" />;
  return <path d="M49 95 Q60 107 71 95" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
}

// mood: happy | cheer | think | oops | sleepy
export function Klecks({ size = 96, mood = "happy", color, acc, anim = "bob", style, onClick, title }) {
  const comp = useContext(CompanionCtx);
  const col = klecksColor(color || comp.color);
  const accs = accList(acc === undefined ? comp.accs ?? comp.acc : acc);
  const up = mood === "cheer";
  const animation =
    anim === "bob" ? "kBob 2.8s ease-in-out infinite" : anim === "jump" ? "kJump 0.7s ease-out" : anim === "shake" ? "shake 0.3s ease-in-out 2" : "none";
  return (
    <svg
      viewBox="0 -18 120 148"
      width={size}
      height={(size * 148) / 120}
      onClick={onClick}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ display: "block", overflow: "visible", flexShrink: 0, cursor: onClick ? "pointer" : undefined, animation, ...style }}
    >
      <ellipse cx="60" cy="125" rx="34" ry="5" fill="#0f172a" opacity="0.12" />
      <g fill={col.c} stroke={col.d} strokeWidth="3">
        <ellipse cx="46" cy="117" rx="9" ry="6" />
        <ellipse cx="74" cy="117" rx="9" ry="6" />
        {up ? (
          <>
            <ellipse cx="17" cy="60" rx="7" ry="12" transform="rotate(-28 17 60)" />
            <ellipse cx="103" cy="60" rx="7" ry="12" transform="rotate(28 103 60)" />
          </>
        ) : (
          <>
            <ellipse cx="19" cy="90" rx="7" ry="11" transform="rotate(32 19 90)" />
            <ellipse cx="101" cy="90" rx="7" ry="11" transform="rotate(-32 101 90)" />
          </>
        )}
        <path d="M60 8 C70 27 104 45 104 78 C104 103 85 118 60 118 C35 118 16 103 16 78 C16 45 50 27 60 8 Z" strokeLinejoin="round" />
      </g>
      <ellipse cx="38" cy="57" rx="6.5" ry="12" transform="rotate(28 38 57)" fill="white" opacity="0.38" />
      <ellipse cx="33" cy="92" rx="7" ry="4.5" fill="#ff7aa2" opacity="0.75" />
      <ellipse cx="87" cy="92" rx="7" ry="4.5" fill="#ff7aa2" opacity="0.75" />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {ACC_ORDER.filter((id) => accs.includes(id)).map((id) => <Accessory key={id} id={id} />)}
    </svg>
  );
}

// Sprechblase mit Klecks: Hinweise, Tipps und Lob während des Schreibens
const TONES = {
  info: { bg: "#ffffff", border: "#dfe4ee", color: "#3d4357" },
  coach: { bg: "#fff4e0", border: "#ffb020", color: "#8a3c0c" },
  praise: { bg: "#e9fbf2", border: "#34d399", color: "#0f6b47" },
  think: { bg: "#f3edff", border: "#b79bff", color: "#4c2a9e" },
};
export function KlecksBubble({ text, mood = "happy", tone = "info", size = 46, maxWidth = 420, anim, kick = 0, onKlecks }) {
  const t = TONES[tone] || TONES.info;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth }}>
      <Klecks key={mood + tone + kick} size={size} mood={mood} anim={anim || (tone === "coach" ? "shake" : tone === "praise" || kick ? "jump" : "none")} onClick={onKlecks} />
      <div
        key={text}
        className="k-bubble"
        style={{
          "--bb": t.border,
          "--bg": t.bg,
          flex: 1,
          background: t.bg,
          border: `3px solid ${t.border}`,
          color: t.color,
          borderRadius: 18,
          padding: "7px 12px",
          fontSize: 15,
          fontWeight: 800,
          lineHeight: 1.25,
          minHeight: 40,
          display: "flex",
          alignItems: "center",
          animation: "popIn 0.3s ease-out",
        }}
      >
        {text}
      </div>
    </div>
  );
}
