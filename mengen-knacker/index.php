<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Blitz-Mengen-Knacker</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Fredoka:wght@500;600;700&display=swap">
<style>
/* Layout: ein Blatt aus dem Rechenheft. Karopapier als Grund, eine Bühne mit dem Mengenbild,
   darunter die Zifferntasten in Zehnerfeld-Anordnung (1–5 oben, 6–10 unten). Menüs sind Overlays. */
:root {
  --paper: #f3f6fb;
  --grid: #dde5f0;
  --card: #ffffff;
  --card-2: #f6f8fc;
  --ink: #1b2a41;
  --ink-soft: #56667d;
  --line: #d3dce8;
  --red: #e0362c;
  --red-deep: #a8231b;
  --red-wash: #fde7e4;
  --blue: #1f63c9;
  --blue-deep: #12458f;
  --blue-wash: #e4edfb;
  --board: #24493c;
  --board-2: #2e5a4a;
  --chalk: #f3f1e6;
  --sun: #f0a500;
  --sun-deep: #a86f00;
  --sun-wash: #fff2cc;
  --leaf: #2c9a58;
  --leaf-deep: #1d6e3e;
  --leaf-wash: #dcf3e5;
  --stem: #6b3f1d;
  --bug: #1f2734;
  --bug-line: #1f2734;
  --spot: #161b24;
  --pip: #1b2a41;
  --scrim: rgba(18, 28, 44, .55);
  --shadow: 0 1px 0 rgba(27, 42, 65, .06), 0 10px 26px -14px rgba(27, 42, 65, .35);
  /* Status (fest, nie thematisiert) */
  --st-good: #0ca30c;
  --st-warn: #fab219;
  --st-serious: #ec835a;
  --st-crit: #d03b3b;
  --st-none: #a3adbb;
  /* Diagramm-Reihen (eine Farbfamilie, geordnet) */
  --s1: #2a78d6;
  --s2: #86b6ef;
  --font-display: 'Fredoka', ui-rounded, 'Arial Rounded MT Bold', 'Trebuchet MS', system-ui, sans-serif;
  --font-body: 'Andika', 'Segoe UI', system-ui, -apple-system, sans-serif;
  --font-data: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper: #0f1725; --grid: #182335; --card: #172234; --card-2: #1c293d;
    --ink: #e9eef6; --ink-soft: #a5b3c7; --line: #2b3a52;
    --red: #ff5d52; --red-deep: #c93229; --red-wash: #3b1f26;
    --blue: #5e9dff; --blue-deep: #2e6fd6; --blue-wash: #172a4b;
    --board: #1c3b31; --board-2: #24493d; --chalk: #eeede3;
    --sun: #ffc23a; --sun-deep: #ffd36e; --sun-wash: #3a3014;
    --leaf: #4cc580; --leaf-deep: #7fdca5; --leaf-wash: #163627;
    --stem: #c79465; --bug: #0b1019; --bug-line: #b9c4d4; --spot: #0b0f16; --pip: #1b2a41;
    --scrim: rgba(3, 7, 14, .72);
    --shadow: 0 1px 0 rgba(0, 0, 0, .3), 0 10px 28px -12px rgba(0, 0, 0, .75);
    --s1: #3987e5; --s2: #1c5cab;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --paper: #0f1725; --grid: #182335; --card: #172234; --card-2: #1c293d;
  --ink: #e9eef6; --ink-soft: #a5b3c7; --line: #2b3a52;
  --red: #ff5d52; --red-deep: #c93229; --red-wash: #3b1f26;
  --blue: #5e9dff; --blue-deep: #2e6fd6; --blue-wash: #172a4b;
  --board: #1c3b31; --board-2: #24493d; --chalk: #eeede3;
  --sun: #ffc23a; --sun-deep: #ffd36e; --sun-wash: #3a3014;
  --leaf: #4cc580; --leaf-deep: #7fdca5; --leaf-wash: #163627;
  --stem: #c79465; --bug: #0b1019; --bug-line: #b9c4d4; --spot: #0b0f16; --pip: #1b2a41;
  --scrim: rgba(3, 7, 14, .72);
  --shadow: 0 1px 0 rgba(0, 0, 0, .3), 0 10px 28px -12px rgba(0, 0, 0, .75);
  --s1: #3987e5; --s2: #1c5cab;
  color-scheme: dark;
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }
html, body { height: 100%; }
body {
  margin: 0;
  background-color: var(--paper);
  background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 22px 22px;
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.45;
  -webkit-tap-highlight-color: transparent;
}
button { font: inherit; color: inherit; }
button:focus-visible, input:focus-visible, select:focus-visible, [tabindex]:focus-visible {
  outline: 3px solid var(--blue); outline-offset: 2px;
}
h1, h2, h3 { text-wrap: balance; margin: 0; }
.app {
  max-width: 660px; margin: 0 auto; min-height: 100%;
  padding-inline: 16px; padding-block: 10px 20px;
  display: flex; flex-direction: column; gap: 12px;
  user-select: none; -webkit-user-select: none; touch-action: manipulation;
}
.ic { width: 24px; height: 24px; flex: none; }

/* ---------- Kopfzeile ---------- */
.topbar { display: flex; align-items: center; gap: 8px; }
.icon-btn {
  width: 46px; height: 46px; border-radius: 50%; border: 2px solid var(--line);
  background: var(--card); color: var(--ink); display: grid; place-items: center;
  cursor: pointer; flex: none; box-shadow: var(--shadow); padding: 0;
}
.icon-btn:active { transform: scale(.94); }
.pips { flex: 1; display: flex; gap: 4px; justify-content: center; align-items: center; min-width: 0; }
.pip { flex: 0 1 12px; min-width: 6px; aspect-ratio: 1; border-radius: 50%; background: var(--line); transition: background .2s; }
.pip.ok { background: var(--leaf); }
.pip.fast { background: var(--sun); }
.pip.miss { background: var(--ink-soft); opacity: .45; }
.pip.now { outline: 2px solid var(--ink); outline-offset: 2px; }
.stars {
  display: flex; align-items: center; gap: 5px; font-family: var(--font-display); font-weight: 600;
  font-size: 20px; padding: 6px 12px 6px 9px; border-radius: 999px; background: var(--sun-wash); color: var(--ink); flex: none;
}
.stars .ic { color: var(--sun); width: 22px; height: 22px; }

/* ---------- Plätti + Sprechblase ---------- */
.prompt { display: flex; align-items: center; gap: 12px; min-height: 66px; }
.platti { width: 60px; height: 60px; flex: none; perspective: 500px; }
.platti.big { width: 120px; height: 120px; }
.platti-inner { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform .5s cubic-bezier(.3, 1.5, .5, 1); }
.platti-face { position: absolute; inset: 0; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.platti-back { transform: rotateY(180deg); }
.platti.flip .platti-inner { transform: rotateY(180deg); }
.platti.nod .platti-inner { animation: nod .9s ease; }
@keyframes nod { 0%, 100% { transform: rotate(0); } 30% { transform: rotate(-10deg); } 65% { transform: rotate(7deg); } }
.pl-rim-r { fill: var(--red-deep); } .pl-face-r { fill: var(--red); }
.pl-rim-b { fill: var(--blue-deep); } .pl-face-b { fill: var(--blue); }
.pl-eye { fill: #fff; } .pl-pupil { fill: #1b2a41; }
.pl-mouth { fill: none; stroke: #fff; stroke-width: 3.2; stroke-linecap: round; }
.pl-mouth-fill { fill: #7a1410; }
.pl-cheek { fill: #ffb3a8; opacity: .55; }
.pl-gloss { fill: #fff; opacity: .35; }
.bubble {
  position: relative; background: var(--card); border: 2px solid var(--line); border-radius: 18px;
  padding: 10px 16px; font-size: 20px; font-weight: 700; flex: 1; min-width: 0; box-shadow: var(--shadow);
  min-height: 52px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.bubble::before {
  content: ''; position: absolute; left: -9px; top: 50%; width: 14px; height: 14px; background: var(--card);
  border-left: 2px solid var(--line); border-bottom: 2px solid var(--line); transform: translateY(-50%) rotate(45deg);
}
.big-digit { font-family: var(--font-display); font-size: 38px; line-height: 1; color: var(--ink); }
.calm-eye { display: inline-flex; align-items: center; gap: 6px; font-size: 16px; color: var(--ink-soft); }

/* ---------- Bühne ---------- */
.expo-bar { height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; margin-bottom: -6px; }
.expo-bar i { display: block; height: 100%; width: 100%; background: var(--sun); transform-origin: left center; }
.stage {
  position: relative; background: var(--card); border: 2px solid var(--line); border-radius: 24px;
  box-shadow: var(--shadow); overflow: hidden;
}
.pic { display: block; width: 100%; height: auto; aspect-ratio: 400 / 280; max-width: 100%; max-height: max(200px, calc(100dvh - 440px)); margin: 0 auto; }
.curtain {
  position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; pointer-events: none;
  background-color: var(--board);
  background-image: radial-gradient(rgba(255, 255, 255, .06) 1px, transparent 1.4px), linear-gradient(180deg, var(--board-2), var(--board));
  background-size: 7px 7px, 100% 100%;
  border-bottom: 10px solid #8a5a33;
  transform: translateY(-104%); transition: transform .18s ease-in;
}
.curtain.down { transform: translateY(0); }
.curtain span { font-family: var(--font-display); font-weight: 600; color: var(--chalk); font-size: clamp(54px, 15vw, 96px); opacity: .9; }
@media (prefers-reduced-motion: reduce) {
  .curtain { transform: none; opacity: 0; transition: opacity .12s; }
  .curtain.down { opacity: 1; }
  .platti-inner { transition: none; }
}
.toast {
  position: absolute; left: 50%; top: 12px; z-index: 5; transform: translateX(-50%);
  display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px;
  background: var(--leaf); color: #fff; font-family: var(--font-display); font-size: 24px; font-weight: 600;
  box-shadow: var(--shadow); animation: pop .35s cubic-bezier(.2, 1.6, .5, 1);
  white-space: nowrap;
}
.toast .plus { background: rgba(255, 255, 255, .22); border-radius: 999px; padding: 0 10px; font-size: 18px; display: inline-flex; align-items: center; gap: 3px; }
.toast .plus .ic { width: 18px; height: 18px; color: #fff3b0; }
@keyframes pop { from { transform: translateX(-50%) scale(.4); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }

/* SVG-Bausteine */
.tf-frame { fill: var(--card-2); stroke: var(--ink-soft); stroke-width: 3; }
.tf-cell { fill: var(--card); stroke: var(--line); stroke-width: 2; }
.tf-mid { stroke: var(--ink-soft); stroke-width: 3; }
.chip-r .chip-rim { fill: var(--red-deep); } .chip-r .chip-face { fill: var(--red); }
.chip-b .chip-rim { fill: var(--blue-deep); } .chip-b .chip-face { fill: var(--blue); }
.chip-gloss { fill: #fff; opacity: .45; }
.ghost { fill: var(--leaf-wash); stroke: var(--leaf); stroke-width: 3; stroke-dasharray: 6 5; }
.die { fill: #fffdf8; stroke: var(--ink-soft); stroke-width: 3; }
.pip { fill: var(--pip); }
.palm { fill: var(--red-wash); stroke: var(--red-deep); stroke-width: 3; }
.fg.up { fill: var(--red); stroke: var(--red-deep); stroke-width: 3; }
.fg.down { fill: var(--red-wash); stroke: var(--red-deep); stroke-width: 3; }
.leafbg { fill: var(--leaf-wash); }
.bug-leg { stroke: var(--bug-line); stroke-width: 4.5; fill: none; stroke-linecap: round; }
.bug-dark { fill: var(--bug); stroke: var(--bug-line); stroke-width: 1.5; }
.bug-wing { fill: var(--red); stroke: var(--red-deep); stroke-width: 3; }
.bug-mid { stroke: var(--bug); stroke-width: 3.5; }
.spot { fill: var(--spot); }
.eye-w { fill: #fff; } .eye-b { fill: #000; }
.plate { fill: var(--card-2); stroke: var(--line); stroke-width: 3; }
.apple { fill: var(--red); } .stem { stroke: var(--stem); stroke-width: 4; fill: none; stroke-linecap: round; }
.leafp { fill: var(--leaf); } .gloss { fill: #fff; opacity: .45; }
.cdot { fill: var(--ink); }
.grp { animation: grpIn .45s ease both; }
.grp-box { fill: none; stroke: var(--sun); stroke-width: 5; }
.grp-gap .grp-box { stroke: var(--leaf); }
.grp-badge { fill: var(--sun); }
.grp-gap .grp-badge { fill: var(--leaf); }
.grp-num { fill: #1b2a41; font-family: var(--font-display); font-weight: 700; font-size: 22px; text-anchor: middle; dominant-baseline: central; }
@keyframes grpIn { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
.cnt-ring { fill: none; stroke: var(--sun); stroke-width: 5; animation: grpIn .25s ease both; }
.cnt-num { fill: #fff; font-family: var(--font-display); font-weight: 700; font-size: 20px; text-anchor: middle; dominant-baseline: central; paint-order: stroke; stroke: rgba(0, 0, 0, .35); stroke-width: 3px; }

/* Zahlenstrahl */
.nl-axis { stroke: var(--ink); stroke-width: 5; stroke-linecap: round; }
.nl-tick { stroke: var(--ink-soft); stroke-width: 3; stroke-linecap: round; }
.nl-tick.big { stroke: var(--ink); stroke-width: 4; }
.nl-label { fill: var(--ink); font-family: var(--font-display); font-weight: 600; font-size: 30px; text-anchor: middle; }
.nl-target circle { fill: var(--sun-wash); stroke: var(--sun); stroke-width: 3; }
.nl-target text { fill: var(--ink); font-family: var(--font-display); font-weight: 700; font-size: 34px; text-anchor: middle; dominant-baseline: central; }
.nl-star { fill: var(--sun); stroke: var(--sun-deep); stroke-width: 2; }
.nl-hop { fill: none; stroke: var(--leaf); stroke-width: 3.5; stroke-linecap: round; }
.nl-hint { fill: var(--leaf-deep); font-family: var(--font-display); font-size: 22px; font-weight: 600; text-anchor: middle; }
.frog-body { fill: var(--leaf); stroke: var(--leaf-deep); stroke-width: 2.5; }
.frog-eye { fill: #fff; stroke: var(--leaf-deep); stroke-width: 2; }
.frog-pupil { fill: #1b2a41; }
.frog { animation: hop .4s ease-out; }
@keyframes hop { 0% { transform: translateY(-26px); } 70% { transform: translateY(2px); } 100% { transform: none; } }
.line-svg { display: block; width: 100%; height: auto; aspect-ratio: 400 / 220; max-height: max(200px, calc(100dvh - 330px)); margin: 0 auto; cursor: pointer; touch-action: none; }

/* Vergleichen + Zuordnen */
.cmp { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 14px; }
.cmp-btn {
  position: relative; border: 3px solid var(--line); border-radius: 20px; background: var(--card-2);
  aspect-ratio: 1; cursor: pointer; overflow: hidden; padding: 0; max-width: 100%; max-height: max(180px, calc(100dvh - 330px)); justify-self: center; width: 100%;
}
.cmp-btn svg { display: block; width: 100%; height: 100%; }
.cmp-btn .curtain span { font-size: 64px; }
.cmp-digit { fill: var(--ink); font-family: var(--font-display); font-weight: 600; font-size: 128px; text-anchor: middle; dominant-baseline: central; }
.cmp-count { fill: var(--ink); font-family: var(--font-display); font-weight: 700; font-size: 30px; text-anchor: middle; dominant-baseline: central; }
.cmp-badge { fill: var(--sun-wash); stroke: var(--sun); stroke-width: 3; }
.win { border-color: var(--leaf) !important; box-shadow: 0 0 0 4px var(--leaf-wash); }
.lose { opacity: .7; }
.match { padding: 14px; display: grid; gap: 12px; }
.opts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.opt {
  border: 3px solid var(--line); border-radius: 18px; background: var(--card-2); padding: 4px;
  cursor: pointer; display: grid; place-items: center; min-width: 0;
}
.opt svg { width: auto; max-width: 100%; height: clamp(104px, calc(33dvh - 60px), 180px); display: block; }
@media (max-width: 520px) {
  .opts { grid-template-columns: 1fr; }
  .opt svg { width: auto; height: 104px; max-width: 100%; }
}

/* ---------- Antwortbereich ---------- */
.answer { display: grid; gap: 10px; }
.keypad { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.key {
  height: clamp(52px, min(16vw, 10.5dvh), 96px); border-radius: 18px; border: 3px solid var(--ink-soft); background: var(--card);
  font-family: var(--font-display); font-weight: 600; font-size: clamp(26px, 7.4vw, 40px); line-height: 1;
  cursor: pointer; display: grid; place-items: center; padding: 0;
  box-shadow: 0 4px 0 var(--line); transition: transform .07s, box-shadow .07s, opacity .2s;
}
.key:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--line); }
.keypad.locked .key, .key:disabled { opacity: .4; }
.key.right { border-color: var(--leaf); background: var(--leaf-wash); }
.key.picked { border-color: var(--ink); background: var(--card-2); }
.answer-foot { display: flex; justify-content: flex-end; }
.help-btn {
  display: inline-flex; align-items: center; gap: 8px; border: 2px solid var(--line); background: var(--card);
  border-radius: 999px; padding: 8px 16px 8px 10px; cursor: pointer; font-weight: 700; color: var(--ink-soft);
}
.help-btn .ic { color: var(--blue); width: 28px; height: 28px; }
.explain {
  display: grid; gap: 12px; padding: 16px; border-radius: 22px; background: var(--sun-wash);
  border: 2px solid var(--sun); animation: rise .3s ease both;
}
@keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.explain-title { font-weight: 700; font-size: 19px; color: var(--ink); }
.explain-eq { font-family: var(--font-display); font-weight: 600; font-size: clamp(28px, 8vw, 40px); color: var(--ink); line-height: 1.1; }
.go-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px; border: 0; border-radius: 18px;
  background: var(--leaf); color: #fff; font-family: var(--font-display); font-weight: 600; font-size: 24px;
  padding: 14px 26px; cursor: pointer; box-shadow: 0 4px 0 var(--leaf-deep);
}
.go-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--leaf-deep); }
.go-btn .ic { width: 28px; height: 28px; }
.go-btn.big { width: 100%; font-size: 30px; padding: 18px; }
.ghost-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 2px solid var(--line);
  border-radius: 18px; background: var(--card); padding: 12px 20px; cursor: pointer; font-weight: 700;
}

/* ---------- Overlays ---------- */
.overlay {
  position: fixed; inset: 0; z-index: 50; display: grid; place-items: center;
  padding: 16px; padding-top: max(16px, env(safe-area-inset-top, 0px)); padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
  background: var(--scrim); overflow-y: auto;
}
.sheet {
  background: var(--card); border-radius: 28px; width: min(560px, 100%); padding: 22px;
  box-shadow: var(--shadow); display: grid; gap: 16px; border: 2px solid var(--line);
}
.sheet.wide { width: min(820px, 100%); align-self: start; }
.sheet.center { text-align: center; justify-items: center; }
.home {
  background-color: var(--paper);
  background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 22px 22px; place-items: start center;
}
.home-inner { width: min(620px, 100%); display: grid; gap: 18px; padding-block: 8px 24px; }
.hero { display: flex; align-items: center; gap: 16px; }
.hero h1 { font-family: var(--font-display); font-weight: 700; font-size: clamp(32px, 9vw, 50px); line-height: .98; letter-spacing: -.01em; }
.hero h1 .r { color: var(--red); } .hero h1 .b { color: var(--blue); }
.dots10 { display: flex; gap: 6px; margin-top: 10px; }
.dots10 i { width: 13px; height: 13px; border-radius: 50%; background: var(--red); }
.hello { font-size: 20px; font-weight: 700; color: var(--ink-soft); margin: 0; }
.tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
@media (min-width: 640px) { .tiles { grid-template-columns: repeat(6, 1fr); } }
.tile {
  border: 2px solid var(--line); background: var(--card); border-radius: 20px; padding: 12px 6px 10px;
  display: grid; justify-items: center; gap: 6px; cursor: pointer; text-align: center; min-width: 0;
  font-weight: 700; font-size: 14px; line-height: 1.2; box-shadow: var(--shadow); position: relative;
}
.tile svg.gi { width: 54px; height: 54px; }
.tile.locked { cursor: default; opacity: .7; box-shadow: none; }
.tile .lock {
  position: absolute; top: 8px; right: 8px; display: inline-flex; align-items: center; gap: 2px;
  font-size: 12px; background: var(--card-2); border: 1px solid var(--line); border-radius: 999px; padding: 1px 6px 1px 4px;
}
.tile .lock .ic { width: 14px; height: 14px; }
.home-meta { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; color: var(--ink-soft); font-weight: 700; }
.home-meta span { display: inline-flex; align-items: center; gap: 6px; background: var(--card); border: 2px solid var(--line); border-radius: 999px; padding: 6px 14px; }
.home-meta .ic { width: 18px; height: 18px; color: var(--sun); }
.intro-icon svg { width: 110px; height: 110px; }
.intro-title { font-family: var(--font-display); font-weight: 600; font-size: 34px; }
.intro-text { font-size: 20px; margin: 0; max-width: 34ch; }
.row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.end-stars { font-family: var(--font-display); font-weight: 700; font-size: 56px; display: inline-flex; align-items: center; gap: 8px; }
.end-stars .ic { width: 52px; height: 52px; color: var(--sun); }
.badges { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: var(--card-2); border: 2px solid var(--line); font-weight: 700; }
.badge .ic { width: 18px; height: 18px; }
.unlock { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 18px; background: var(--leaf-wash); border: 2px solid var(--leaf); text-align: left; }
.unlock svg.gi { width: 54px; height: 54px; flex: none; }

/* Spiel-Icons */
.gi-bg { fill: var(--red-wash); stroke: var(--red); stroke-width: 3; }
.gi-bolt { fill: var(--sun); stroke: var(--sun-deep); stroke-width: 2.5; stroke-linejoin: round; }
.gi-card { fill: var(--card-2); stroke: var(--ink-soft); stroke-width: 3; }
.gi-digit { fill: var(--ink); font-family: var(--font-display); font-weight: 700; font-size: 30px; text-anchor: middle; dominant-baseline: central; }
.gi-stroke { stroke: var(--ink); stroke-width: 4; fill: none; stroke-linecap: round; stroke-linejoin: round; }
.gi-pan { fill: var(--blue-wash); stroke: var(--ink); stroke-width: 3; }

/* ---------- Eltern-Bereich ---------- */
.parent { font-family: var(--font-body); user-select: text; -webkit-user-select: text; }
.p-head { display: flex; align-items: center; gap: 12px; justify-content: space-between; }
.p-head h2 { font-family: var(--font-display); font-weight: 600; font-size: 28px; }
.tabs { display: flex; gap: 6px; flex-wrap: wrap; border-bottom: 2px solid var(--line); padding-bottom: 10px; }
.tab-btn { border: 2px solid transparent; background: transparent; border-radius: 999px; padding: 6px 12px; font-size: 15px; cursor: pointer; font-weight: 700; color: var(--ink-soft); }
.tab-btn[aria-selected="true"] { background: var(--blue-wash); color: var(--ink); border-color: var(--blue); }
.p-sec { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; min-width: 0; }
.p-sec > * { min-width: 0; }
.sheet { grid-template-columns: minmax(0, 1fr); }
.p-sec h3 { font-size: 18px; font-family: var(--font-body); }
.p-note { margin: 0; color: var(--ink-soft); font-size: 15px; max-width: 70ch; }
.p-text { margin: 0; max-width: 70ch; font-size: 16px; }
.stat-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
@media (max-width: 640px) { .stat-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.stat { background: var(--card-2); border: 1px solid var(--line); border-radius: 16px; padding: 12px 14px; display: grid; gap: 2px; min-width: 0; }
.stat b { font-family: var(--font-data); font-size: 26px; font-weight: 650; }
.stat span { font-size: 13px; color: var(--ink-soft); }
.days { display: grid; grid-template-columns: repeat(14, minmax(0, 1fr)); gap: 4px; }
.day { aspect-ratio: 1; border-radius: 6px; background: var(--line); opacity: .6; }
.day.on { background: var(--s1); opacity: 1; }
.day-labels { display: flex; justify-content: space-between; font-size: 12px; color: var(--ink-soft); font-family: var(--font-data); }
.tbl-wrap { overflow-x: auto; }
table.tbl { border-collapse: collapse; width: 100%; font-family: var(--font-data); font-size: 14px; font-variant-numeric: tabular-nums; }
.tbl th, .tbl td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); white-space: nowrap; }
.tbl th { font-weight: 600; color: var(--ink-soft); font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
.meter { width: 90px; height: 8px; border-radius: 4px; background: var(--blue-wash); overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 8px; }
.meter i { display: block; height: 100%; background: var(--s1); border-radius: 4px; }
.num-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
@media (max-width: 520px) { .num-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.num-tile { border: 1px solid var(--line); border-radius: 16px; padding: 10px; background: var(--card-2); display: grid; gap: 4px; min-width: 0; font-family: var(--font-data); font-size: 13px; }
.num-tile .n { font-family: var(--font-display); font-size: 30px; font-weight: 600; line-height: 1; }
.num-tile .meta { color: var(--ink-soft); font-variant-numeric: tabular-nums; }
.chip-st { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 2px 8px 2px 4px; border-radius: 999px; background: var(--card); border: 1px solid var(--line); width: fit-content; }
.chip-st i { width: 16px; height: 16px; border-radius: 50%; display: grid; place-items: center; }
.chip-st i .ic { width: 11px; height: 11px; color: #fff; }
.legend { display: flex; gap: 12px; flex-wrap: wrap; font-family: var(--font-data); font-size: 13px; color: var(--ink-soft); }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.legend i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
.chart-svg { display: block; width: 100%; height: auto; }
.c-grid { stroke: var(--line); stroke-width: 1; }
.c-axis { stroke: var(--ink-soft); stroke-width: 1; }
.c-tick, .c-xl { fill: var(--ink-soft); font-family: var(--font-data); font-size: 12px; }
.c-xl { font-size: 13px; }
.c-ref { fill: none; stroke: var(--ink); stroke-width: 2; stroke-linejoin: round; opacity: .55; }
.c-ref-l { fill: var(--ink-soft); font-family: var(--font-data); font-size: 12px; }
.c-hit { fill: transparent; cursor: default; }
.c-hit:hover, .c-hit:focus { fill: var(--ink); opacity: .05; }
.tip {
  position: fixed; z-index: 90; pointer-events: none; max-width: 260px; padding: 8px 10px; border-radius: 10px;
  background: var(--ink); color: var(--card); font-family: var(--font-data); font-size: 13px; line-height: 1.35; box-shadow: var(--shadow);
}
.reco { display: grid; gap: 10px; }
.reco-item { border: 1px solid var(--line); border-left: 0; background: var(--card-2); border-radius: 14px; padding: 12px 14px; display: grid; gap: 4px; }
.reco-item b { font-size: 16px; }
.reco-item p { margin: 0; font-size: 15px; color: var(--ink-soft); max-width: 70ch; }
.src { font-size: 13px; color: var(--ink-soft); }
.src a { color: var(--blue); }
.form { display: grid; gap: 14px; }
.field { display: grid; gap: 6px; }
.field > label, .field > .lbl { font-weight: 700; font-size: 15px; }
.field small { color: var(--ink-soft); font-size: 13px; }
.seg { display: flex; flex-wrap: wrap; gap: 6px; }
.seg button { border: 2px solid var(--line); background: var(--card); border-radius: 12px; padding: 8px 12px; cursor: pointer; font-weight: 700; font-size: 14px; }
.seg button[aria-pressed="true"] { border-color: var(--blue); background: var(--blue-wash); }
.checks { display: flex; flex-wrap: wrap; gap: 8px 14px; }
.checks label { display: inline-flex; align-items: center; gap: 6px; font-size: 15px; }
.checks input, .toggle input { width: 20px; height: 20px; accent-color: var(--blue); }
.toggle { display: flex; align-items: center; gap: 10px; font-size: 15px; }
input[type="text"], input[type="number"], .gate-in {
  font: inherit; font-size: 18px; padding: 10px 12px; border-radius: 12px; border: 2px solid var(--line);
  background: var(--card); color: var(--ink); width: 100%; max-width: 320px;
}
input[type="range"] { width: 100%; max-width: 320px; accent-color: var(--blue); }
.danger { border-color: var(--st-crit) !important; color: var(--st-crit); }
.gate-err { color: var(--st-crit); margin: 0; font-weight: 700; }
details.p-details { border: 1px solid var(--line); border-radius: 14px; padding: 10px 14px; background: var(--card-2); }
details.p-details summary { cursor: pointer; font-weight: 700; }
ol.find { margin: 0; padding-left: 20px; display: grid; gap: 12px; max-width: 72ch; }
ol.find li p { margin: 2px 0 0; font-size: 15px; color: var(--ink-soft); }
.empty { color: var(--ink-soft); font-style: italic; margin: 0; }
</style>
</head>
<body>
<noscript><p style="padding:16px">Für dieses Spiel muss JavaScript eingeschaltet sein.</p></noscript>

<div class="app" id="app">
  <header class="topbar">
    <button class="icon-btn" id="btn-home" aria-label="Zum Startbildschirm"></button>
    <div class="pips" id="pips" aria-label="Fortschritt der Runde"></div>
    <div class="stars" id="stars" aria-label="Sterne"></div>
    <button class="icon-btn" id="btn-say" aria-label="Aufgabe vorlesen"></button>
  </header>

  <div class="prompt">
    <div class="platti" id="platti" aria-hidden="true"></div>
    <div class="bubble" id="bubble" aria-live="polite">Hallo!</div>
  </div>

  <div class="expo-bar" id="expo-bar" hidden><i></i></div>
  <main class="stage" id="stage"></main>

  <section class="answer" id="answer">
    <div class="keypad" id="keypad"></div>
    <div class="answer-foot"><button class="help-btn" id="btn-help"></button></div>
  </section>
  <section class="explain" id="explain" hidden>
    <div class="explain-title" id="explain-title"></div>
    <div class="explain-eq" id="explain-eq"></div>
    <div><button class="go-btn" id="btn-next"></button></div>
  </section>
</div>

<!-- Startbildschirm -->
<div class="overlay home" id="home">
  <div class="home-inner">
    <div class="hero">
      <div class="platti big" id="platti-home" aria-hidden="true"></div>
      <div>
        <h1><span class="r">Blitz</span>-Mengen-<span class="b">Knacker</span></h1>
        <div class="dots10" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      </div>
    </div>
    <p class="hello" id="hello">Hallo!</p>
    <button class="go-btn big" id="btn-play"></button>
    <div class="tiles" id="tiles"></div>
    <div class="home-meta" id="home-meta"></div>
  </div>
</div>

<!-- Block-Einführung -->
<div class="overlay" id="intro" hidden>
  <div class="sheet center">
    <div class="intro-icon" id="intro-icon"></div>
    <div class="intro-title" id="intro-title"></div>
    <p class="intro-text" id="intro-text"></p>
    <div class="row">
      <button class="ghost-btn" id="intro-say" aria-label="Nochmal vorlesen"></button>
      <button class="go-btn" id="intro-go"></button>
    </div>
  </div>
</div>

<!-- Rundenende -->
<div class="overlay" id="end" hidden>
  <div class="sheet center">
    <div class="platti big" id="platti-end" aria-hidden="true"></div>
    <div class="intro-title">Geschafft!</div>
    <div class="end-stars" id="end-stars"></div>
    <div class="badges" id="end-badges"></div>
    <div id="end-unlock"></div>
    <p class="intro-text" id="end-note"></p>
    <div class="row">
      <button class="ghost-btn" id="end-home"></button>
      <button class="go-btn" id="end-again"></button>
    </div>
  </div>
</div>

<!-- Runde abbrechen? -->
<div class="overlay" id="quit" hidden>
  <div class="sheet center">
    <div class="intro-title">Runde beenden?</div>
    <div class="row">
      <button class="ghost-btn" id="quit-no"></button>
      <button class="go-btn" id="quit-yes"></button>
    </div>
  </div>
</div>

<!-- Eltern-Tor -->
<div class="overlay" id="gate" hidden>
  <form class="sheet parent" id="gate-form" autocomplete="off">
    <h2 style="font-family:var(--font-display);font-weight:600">Für Eltern</h2>
    <p class="p-text">Damit Kinder nicht aus Versehen Einstellungen ändern, bitte kurz rechnen:</p>
    <label class="field"><span class="lbl" id="gate-q">7 × 6 = ?</span>
      <input class="gate-in" id="gate-in" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" aria-describedby="gate-err">
    </label>
    <p class="gate-err" id="gate-err" hidden>Das stimmt nicht. Bitte noch einmal versuchen.</p>
    <div class="row" style="justify-content:flex-start">
      <button type="button" class="ghost-btn" id="gate-cancel">Zurück zum Spiel</button>
      <button type="submit" class="go-btn" style="font-size:20px;padding:12px 22px">Öffnen</button>
    </div>
  </form>
</div>

<!-- Eltern-Bereich -->
<div class="overlay" id="parent" hidden>
  <div class="sheet wide parent">
    <div class="p-head">
      <h2>Eltern-Bereich</h2>
      <button class="icon-btn" id="parent-close" aria-label="Eltern-Bereich schließen"></button>
    </div>
    <div class="tabs" role="tablist" id="tabs">
      <button class="tab-btn" role="tab" data-tab="overview" aria-selected="true">Übersicht</button>
      <button class="tab-btn" role="tab" data-tab="numbers" aria-selected="false">Mengen-Profil</button>
      <button class="tab-btn" role="tab" data-tab="settings" aria-selected="false">Einstellungen</button>
      <button class="tab-btn" role="tab" data-tab="research" aria-selected="false">Forschung &amp; Tipps</button>
    </div>
    <div id="tab-body" class="p-sec"></div>
  </div>
</div>
<div class="tip" id="tip" hidden></div>

<script>
(() => {
'use strict';
document.documentElement.lang = 'de';

/* =========================================================
   Hilfsfunktionen
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const logistic = x => 1 / (1 + Math.exp(-x));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const median = arr => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const fmtS = s => s.toFixed(1).replace('.', ',') + ' s';
const pct = x => Math.round(x * 100) + ' %';
const now = () => Date.now();
const DAY = 864e5;
const dayKey = t => { const d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function weightedPick(items, w) {
  const tot = w.reduce((s, x) => s + x, 0);
  let r = Math.random() * tot;
  for (let i = 0; i < items.length; i++) { r -= w[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
const WORD = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn'];
const NAME = ['Null', 'Eins', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn'];

/* =========================================================
   Icons
   ========================================================= */
const IC = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  speaker: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  parents: '<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M3 19c.6-3.4 2.8-5.2 5.5-5.2S13.4 15.6 14 19"/><path d="M14.5 14.6c.6-.4 1.3-.6 2-.6 2.2 0 3.8 1.6 4.3 4.6"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="currentColor" stroke="none"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 1 1 3.7 2.3c-.8.4-1.2 1-1.2 1.9v.6"/><circle cx="12" cy="17.2" r=".9" fill="currentColor"/>',
  next: '<path d="M5 12h13"/><path d="m13 6.5 5.5 5.5-5.5 5.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  bolt: '<path d="M13.5 2.5 5.5 13.5h5.5l-1 8 8-11h-5.5z" fill="currentColor" stroke="none"/>',
  hourglass: '<path d="M7 4h10M7 20h10"/><path d="M8 4c0 5 8 5 8 8s-8 3-8 8M16 4c0 5-8 5-8 8s8 3 8 8"/>',
  sprout: '<path d="M12 20v-8"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.4" fill="currentColor"/><circle cx="15" cy="15" r="1.4" fill="currentColor"/><circle cx="15" cy="9" r="1.4" fill="currentColor"/><circle cx="9" cy="15" r="1.4" fill="currentColor"/>',
  dot: '<circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  x: '<path d="M7 7l10 10M17 7 7 17"/>',
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

function plattiSVG() {
  return `<div class="platti-inner">
  <svg class="platti-face" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" class="pl-rim-r"/><circle cx="32" cy="32" r="25" class="pl-face-r"/>
  <ellipse cx="24" cy="28" rx="5" ry="6" class="pl-eye"/><ellipse cx="40" cy="28" rx="5" ry="6" class="pl-eye"/>
  <circle cx="25" cy="29.5" r="2.6" class="pl-pupil"/><circle cx="41" cy="29.5" r="2.6" class="pl-pupil"/>
  <path d="M24 40q8 7 16 0" class="pl-mouth"/><circle cx="17" cy="38" r="3.6" class="pl-cheek"/><circle cx="47" cy="38" r="3.6" class="pl-cheek"/><circle cx="21" cy="17" r="4" class="pl-gloss"/></svg>
  <svg class="platti-face platti-back" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" class="pl-rim-b"/><circle cx="32" cy="32" r="25" class="pl-face-b"/>
  <path d="M19 28q5-6 10 0M35 28q5-6 10 0" class="pl-mouth"/><path d="M21 37h22q-2 11-11 11t-11-11z" class="pl-mouth-fill"/><path d="M21 37h22" class="pl-mouth"/>
  <circle cx="16" cy="37" r="3.6" class="pl-cheek"/><circle cx="48" cy="37" r="3.6" class="pl-cheek"/><circle cx="21" cy="17" r="4" class="pl-gloss"/></svg>
  </div>`;
}

const GAME_ICON = {
  blitz: '<svg class="gi" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" class="gi-bg"/><path d="M37 7 19 36h12l-5 21 20-31H34l3-19z" class="gi-bolt"/></svg>',
  match: `<svg class="gi" viewBox="0 0 64 64" aria-hidden="true"><rect x="4" y="10" width="28" height="44" rx="9" class="gi-card"/><text x="18" y="33" class="gi-digit">3</text>${chip(46, 18, 7, 'r')}${chip(46, 33, 7, 'r')}${chip(46, 48, 7, 'r')}</svg>`,
  compare: `<svg class="gi" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8v44M18 56h28M10 22l22-6 22 6" class="gi-stroke"/><path d="M3 34h18l-9-12z" class="gi-pan"/><path d="M43 30h18l-9-12z" class="gi-pan"/>${chip(8, 29, 4.5, 'r')}${chip(16, 29, 4.5, 'r')}${chip(12, 23, 4.5, 'r')}${chip(52, 25, 4.5, 'r')}</svg>`,
  line: '<svg class="gi" viewBox="0 0 64 64" aria-hidden="true"><path d="M5 44h54M5 36v16M32 36v16M59 36v16M18.5 40v8M45.5 40v8" class="gi-stroke"/><ellipse cx="45.5" cy="27" rx="10" ry="8" class="frog-body"/><circle cx="41" cy="20" r="4" class="frog-eye"/><circle cx="50" cy="20" r="4" class="frog-eye"/><circle cx="41" cy="20" r="1.6" class="frog-pupil"/><circle cx="50" cy="20" r="1.6" class="frog-pupil"/></svg>',
  partner: `<svg class="gi" viewBox="0 0 64 64" aria-hidden="true"><rect x="3" y="20" width="58" height="24" rx="6" class="gi-card"/>${chip(12, 32, 5.5, 'r')}${chip(23, 32, 5.5, 'r')}${chip(34, 32, 5.5, 'r')}<circle cx="45" cy="32" r="4.6" class="ghost"/><circle cx="55" cy="32" r="4.6" class="ghost"/></svg>`,
};
const GAME = {
  blitz: { name: 'Blitzblick', intro: 'Schau genau hin! Wie viele sind es? Tippe die Zahl, sobald du es weißt.' },
  match: { name: 'Zahl findet Menge', intro: 'Hör gut zu! Finde das Bild, das genau zur Zahl passt.' },
  compare: { name: 'Wer hat mehr?', intro: 'Tippe auf die Seite, die mehr hat.' },
  line: { name: 'Zahlenstrahl', intro: 'Wo wohnt die Zahl? Tippe auf die richtige Stelle. Die Fünf hilft dir!' },
  partner: { name: 'Wie viele fehlen?', intro: 'Wie viele Plätze sind noch frei?' },
};
const REP_NAME = { tenframe: 'Zehnerfeld', dice: 'Würfelbilder', fingers: 'Fingerbilder', ladybug: 'Marienkäfer', fruit: 'Äpfel', cloud: 'Punktewolke' };

/* =========================================================
   Speicher
   ========================================================= */
const STORE_KEY = 'blitz-mengen-knacker.v2';
const TASKS = ['blitz', 'match', 'compare', 'line', 'partner'];
const REPS = ['tenframe', 'dice', 'fingers', 'ladybug', 'fruit', 'cloud'];
const UNLOCK = { line: 20, partner: 45 };
// Zeigezeiten (Sekunden). Start bei 4 s; kürzer erst nach 3 sicheren schnellen Treffern in Folge.
const EXPO = [5.0, 4.0, 3.2, 2.6, 2.1, 1.7, 1.4, 1.1];
const START_LEVEL = { pre: 0, school: 1, fit: 2 };
const START_THETA = { pre: -1.2, school: -0.5, fit: 0.3 };

function freshData() {
  return {
    v: 2, name: '', created: now(), startProfile: 'school',
    settings: {
      max: 10, stage: 1, len: 12, target: 0.8, sound: true, speech: true, timer: false,
      expoMode: 'auto', expoFixed: 4.0,
      tasks: { blitz: true, match: true, compare: true, line: true, partner: true },
      reps: { tenframe: true, dice: true, fingers: true, ladybug: true, fruit: true, cloud: true },
    },
    stars: 0,
    unlocked: { blitz: true, match: true, compare: true, line: false, partner: false },
    theta: { blitz: -0.5, match: -0.5, compare: -0.5, line: -0.5, partner: -0.5 },
    nTask: { blitz: 0, match: 0, compare: 0, line: 0, partner: 0 },
    items: {}, ladder: {}, hist: [], sessions: [], seen: {},
  };
}
function mergeData(base, saved) {
  if (!saved || typeof saved !== 'object' || saved.v !== 2) return base;
  const out = { ...base, ...saved };
  const ss = saved.settings || {};
  out.settings = { ...base.settings, ...ss, tasks: { ...base.settings.tasks, ...(ss.tasks || {}) }, reps: { ...base.settings.reps, ...(ss.reps || {}) } };
  out.unlocked = { ...base.unlocked, ...(saved.unlocked || {}) };
  out.theta = { ...base.theta, ...(saved.theta || {}) };
  out.nTask = { ...base.nTask, ...(saved.nTask || {}) };
  out.items = saved.items || {};
  out.ladder = saved.ladder || {};
  out.hist = Array.isArray(saved.hist) ? saved.hist : [];
  out.sessions = Array.isArray(saved.sessions) ? saved.sessions : [];
  out.seen = saved.seen || {};
  return out;
}
function loadData() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return mergeData(freshData(), JSON.parse(raw)); } catch (e) { /* ohne Speicher spielen */ }
  return freshData();
}
let D = loadData();
function save() {
  if (D.hist.length > 2500) D.hist.splice(0, D.hist.length - 2500);
  if (D.sessions.length > 300) D.sessions.splice(0, D.sessions.length - 300);
  try { localStorage.setItem(STORE_KEY, JSON.stringify(D)); } catch (e) { /* Speicher voll oder gesperrt */ }
}

/* =========================================================
   Ton & Sprache
   ========================================================= */
const Sound = {
  ctx: null,
  init() {
    try {
      if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) this.ctx = new C(); }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { this.ctx = null; }
  },
  tone(freq, t0, dur, type = 'triangle', vol = 0.16) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  },
  good(fast) {
    if (!D.settings.sound) return; this.init(); if (!this.ctx) return;
    const t = this.ctx.currentTime; const notes = fast ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
    notes.forEach((f, i) => this.tone(f, t + i * 0.07, 0.28));
  },
  soft() { // freundlich, nicht strafend
    if (!D.settings.sound) return; this.init(); if (!this.ctx) return;
    const t = this.ctx.currentTime; this.tone(392, t, 0.22, 'sine', 0.12); this.tone(440, t + 0.16, 0.3, 'sine', 0.12);
  },
  whoosh() {
    if (!D.settings.sound) return; this.init(); if (!this.ctx) return;
    const t = this.ctx.currentTime; this.tone(220, t, 0.12, 'sine', 0.05);
  },
};
const Speech = {
  ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
  voice: null,
  init() {
    if (!this.ok) return;
    const pickVoice = () => {
      try {
        const vs = speechSynthesis.getVoices().filter(v => /^de(-|_|$)/i.test(v.lang));
        this.voice = vs.find(v => /female|anna|petra|helena|katja|marlene|vicki|google/i.test(v.name)) || vs[0] || null;
      } catch (e) { this.voice = null; }
    };
    pickVoice();
    try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) { /* alte Browser */ }
  },
  say(text, interrupt = true) {
    if (!this.ok || !D.settings.speech || !text) return;
    try {
      if (interrupt) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'de-DE'; if (this.voice) u.voice = this.voice; u.rate = 0.92; u.pitch = 1.08;
      speechSynthesis.speak(u);
    } catch (e) { /* ohne Sprache weiter */ }
  },
  stop() { if (this.ok) { try { speechSynthesis.cancel(); } catch (e) { /* egal */ } } },
};

/* =========================================================
   Aufgaben-Bank mit Startschwierigkeiten (Logit-Skala)
   ========================================================= */
const BLITZ_BASE = [0, -3.5, -3.0, -2.4, -1.5, -0.9, -0.3, 0.3, 0.7, 0.9, 0.2];
function repAvailable(rep, n, stage) {
  if (rep === 'dice') return stage === 2 || n <= 6;          // Stufe 1: nur echte Würfelbilder 1–6
  if (rep === 'cloud') return stage === 2 ? true : n <= 5;    // Stufe 1: ungeordnete Punkte nur bis 5
  return true;
}
function repAdj(rep, n, stage) {
  switch (rep) {
    case 'tenframe': return n === 5 ? -0.4 : n === 10 ? -0.8 : (stage === 1 && n > 5 ? 0.15 : 0);
    case 'dice': return n <= 6 ? -0.4 : 0.3;
    case 'fingers': return n === 5 ? -0.4 : n === 10 ? -0.8 : 0.1;
    case 'ladybug': return 0.15;
    case 'fruit': return n === 5 ? -0.2 : 0.15;
    case 'cloud': return n <= 3 ? 0.2 : n === 4 ? 0.8 : n === 5 ? 1.3 : 1.6;
  }
  return 0;
}
function bank(task) {
  const M = D.settings.max, stage = D.settings.stage, out = [];
  if (task === 'blitz') {
    let reps = REPS.filter(r => D.settings.reps[r]);
    if (!reps.length) reps = ['tenframe'];
    for (let n = 1; n <= M; n++) for (const rep of reps) {
      if (!repAvailable(rep, n, stage)) continue;
      out.push({ key: `blitz|${n}|${rep}`, task, q: n, rep, prior: BLITZ_BASE[n] + repAdj(rep, n, stage) });
    }
    if (!out.length) for (let n = 1; n <= M; n++) out.push({ key: `blitz|${n}|tenframe`, task, q: n, rep: 'tenframe', prior: BLITZ_BASE[n] });
  } else if (task === 'match') {
    for (let n = 1; n <= M; n++) for (const v of ['far', 'near']) out.push({ key: `match|${n}|${v}`, task, q: n, v, prior: 0.6 * BLITZ_BASE[n] - 0.5 + (v === 'near' ? 0.6 : 0) });
  } else if (task === 'compare') {
    const P = { digits: [-0.5, -1.3, -2.2], dots: [0.9, 0.0, -1.2], mixed: [0.4, -0.5, -1.6] };
    for (const f of ['digits', 'dots', 'mixed']) for (let d = 1; d <= 3; d++) out.push({ key: `compare|${f}|${d}`, task, f, d, prior: P[f][d - 1] });
  } else if (task === 'line') {
    const anchors = M === 10 ? [0, 5, 10] : [0, 5];
    for (let n = 1; n < M; n++) {
      const dist = Math.min(...anchors.map(a => Math.abs(a - n)));
      out.push({ key: `line|${M}|${n}`, task, q: n, prior: dist === 0 ? -2.5 : dist === 1 ? -1.0 : -0.2 });
    }
  } else if (task === 'partner') {
    for (let k = 1; k < M; k++) {
      const a = M - k; let prior = 0.75 * BLITZ_BASE[a] + (M === 10 ? 0.8 : 0.5);
      if (M === 10 && a === 5) prior = -1.0;
      out.push({ key: `partner|${M}|${k}`, task, k, q: a, prior });
    }
  }
  return out;
}
const beta = it => (D.items[it.key] ? D.items[it.key].b : it.prior);
const pCorrect = it => logistic(D.theta[it.task] - beta(it));

/* =========================================================
   Reaktionszeit-Auswertung
   ========================================================= */
// Grundtempo: Median der letzten richtigen Antworten auf 1–3 Dinge (das erfassen Sechsjährige meist auf einen Blick).
function baseline() {
  const xs = [];
  for (let i = D.hist.length - 1; i >= 0 && xs.length < 15; i--) {
    const h = D.hist[i];
    if (h.k === 'blitz' && h.ok && h.q <= 3 && !h.x && h.rt < 5) xs.push(h.rt);
  }
  return xs.length < 4 ? 1.6 : clamp(median(xs), 0.7, 3.5);
}
function thresholds(task, t) {
  const b = baseline(); let fast, slow;
  if (task === 'blitz') { const n = t.q; fast = b + 0.12 * (n - 1) + 0.25; slow = b + 0.32 * (n - 1) + 1.0; }
  else if (task === 'partner') { const a = t.q; fast = b + 0.15 * (a - 1) + 0.6; slow = b + 0.35 * (a - 1) + 1.8; }
  else if (task === 'match') { fast = b + 0.9 + 0.06 * t.q; slow = b + 2.8 + 0.25 * t.q; }
  else if (task === 'compare') { fast = b + 0.4; slow = b + 2.4; }
  else { fast = b + 1.3; slow = b + 4.2; }
  return { fast, slow, b };
}
// „Blitzschnell“ heißt immer: innerhalb des persönlichen Erkennungstempos, auch wenn das Bild noch länger stehen würde.
// Wer erst nach dem Schließen der Tafel antwortet, bekommt „richtig“, solange er dann nicht lange überlegt.
function classify(task, t, ok, rt, help) {
  if (help) return 'help';
  const th = thresholds(task, t);
  if (ok) {
    if (rt <= th.fast) return 'fast';
    if (rt <= th.slow) return 'ok';
    if (t.expo && rt > t.expo && rt - t.expo <= th.b + 1.2) return 'ok';
    return 'slow';
  }
  return rt < th.fast * 0.6 ? 'guess' : 'wrong';
}
// Teil-Gutschrift: langsam (gezählt) zählt nur teilweise, damit das System bei dieser Menge bleibt, bis sie flüssig sitzt.
const CREDIT = { fast: 1, ok: 0.85, slow: 0.6, wrong: 0, guess: 0, help: 0 };

/* Elo-Aktualisierung (nach dem Rekentuin-Prinzip: Fähigkeit und Aufgabenschwierigkeit wandern gemeinsam) */
function updateModel(item, cls) {
  const task = item.task, x = CREDIT[cls];
  const st = D.items[item.key] || (D.items[item.key] = { b: item.prior, n: 0, c: 0, last: 0 });
  const p = logistic(D.theta[task] - st.b);
  const err = x - p;
  const nT = D.nTask[task] || 0;
  const kT = 0.45 / (1 + nT / 30) + 0.08;
  const kI = 0.35 / (1 + st.n / 8) + 0.05;
  D.theta[task] = clamp(D.theta[task] + kT * err, -6, 6);
  st.b = clamp(st.b - kI * err, -7, 7);
  st.n++; if (x > 0) st.c++; st.last = now();
  D.nTask[task] = nT + 1;
}

/* Blitzzeit-Treppe pro Menge (3 schnelle Treffer in Folge = kürzer, Fehler = länger) */
function ladderKey(task, t) { return task === 'blitz' ? 'blitz:' + t.q : task === 'partner' ? 'partner' : task === 'compare' ? 'compare' : null; }
function ladderGet(key) {
  if (!D.ladder[key]) D.ladder[key] = { lv: START_LEVEL[D.startProfile] ?? 1, st: 0 };
  return D.ladder[key];
}
function exposureFor(task, t) {
  const f = task === 'partner' ? 1.2 : 1;
  if (D.settings.expoMode === 'fixed') return D.settings.expoFixed * f;
  return EXPO[ladderGet(ladderKey(task, t)).lv] * f;
}
function updateLadder(task, t, cls) {
  if (D.settings.expoMode === 'fixed' || !t.expo) return 0;
  const key = ladderKey(task, t); if (!key) return 0;
  const L = ladderGet(key), before = L.lv;
  if (cls === 'fast') L.st += 1;
  else if (cls === 'ok') L.st += 0.5;
  else if (cls === 'slow') L.st = 0;
  else { L.lv = Math.max(0, L.lv - 1); L.st = 0; }
  if (L.st >= 3) { L.lv = Math.min(EXPO.length - 1, L.lv + 1); L.st = 0; }
  return L.lv - before;
}

/* =========================================================
   Aufgabenauswahl
   ========================================================= */
let S = null;   // aktuelle Runde
let T = null;   // aktuelle Aufgabe
let trialSeq = 0;

function availableTasks() {
  const list = TASKS.filter(k => D.settings.tasks[k] && D.unlocked[k] && (k !== 'partner' || D.settings.stage === 2));
  return list.length ? list : ['blitz'];
}
function recentCredit(task, n) {
  const hs = D.hist.filter(h => h.k === task && !h.x).slice(-n);
  if (hs.length < 5) return null;
  return mean(hs.map(h => CREDIT[h.c] ?? 0));
}
const BASE_W = { blitz: 3, match: 1.6, compare: 1.5, line: 1.4, partner: 1.4 };
function pickBlockTask() {
  if (S.only) return S.only;
  const avail = availableTasks();
  if (S.blockNo === 0 && avail.includes('blitz')) return 'blitz';
  const w = avail.map(k => {
    let x = BASE_W[k];
    const rc = recentCredit(k, 15);
    if (rc !== null) x *= 1 + clamp(0.85 - rc, 0, 0.5) * 2;
    if (S.retries.some(r => r.task === k)) x *= 2;
    if (!D.seen[k]) x *= 1.6;
    if (k === S.blockTask && avail.length > 1) x *= 0.08;
    return x;
  });
  return weightedPick(avail, w);
}
function chooseItem(task) {
  const items = bank(task);
  const ri = S.retries.findIndex(r => r.task === task && r.due <= S.trialNo);
  if (ri >= 0) {
    const r = S.retries.splice(ri, 1)[0];
    let c = task === 'compare' ? items.filter(it => it.key === r.key) : items.filter(it => it.q === r.q);
    if (task === 'blitz') { const structured = c.filter(it => it.rep !== 'cloud'); if (structured.length) c = structured; }
    if (c.length) return { item: pick(c), retry: true };
  }
  let target = D.settings.target;
  if (S.ease > 0) target = 0.95;
  if (S.trialNo === S.total - 1) target = Math.max(target, 0.92); // jede Runde endet mit einem Erfolg
  const recent = S.recentKeys.slice(-4);
  const w = items.map(it => {
    const p = pCorrect(it);
    let x = Math.exp(-((p - target) ** 2) / (2 * 0.09 ** 2)) + 0.01;
    if (recent.includes(it.key)) x *= 0.05;
    if (it.q !== undefined && it.q === S.lastQ) x *= 0.35;
    const st = D.items[it.key];
    if (!st) x *= 1.2;
    else if (now() - st.last > DAY && p > 0.8) x *= 1.5; // verteilte Wiederholung
    return x;
  });
  return { item: weightedPick(items, w), retry: false };
}

/* =========================================================
   Bilder (SVG) – jede Darstellung liefert Bild, Gruppen und Einzelteile
   ========================================================= */
function chip(cx, cy, r, c) {
  return `<g class="chip chip-${c}"><circle cx="${cx}" cy="${cy}" r="${r}" class="chip-rim"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.8).toFixed(1)}" class="chip-face"/><circle cx="${(cx - r * 0.32).toFixed(1)}" cy="${(cy - r * 0.34).toFixed(1)}" r="${(r * 0.2).toFixed(1)}" class="chip-gloss"/></g>`;
}
function boxOf(items, pad, count, kind) {
  const x0 = Math.min(...items.map(p => p[0] - p[2])) - pad, x1 = Math.max(...items.map(p => p[0] + p[2])) + pad;
  const y0 = Math.min(...items.map(p => p[1] - p[2])) - pad, y1 = Math.max(...items.map(p => p[1] + p[2])) + pad;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, count, kind };
}
function svgTenframe(filled, M, twoColor, ghosts = 0) {
  const rows = M === 10 ? 2 : 1, cell = 64, W = 5 * cell, H = rows * cell;
  const x0 = (400 - W) / 2, y0 = (280 - H) / 2;
  let s = `<rect class="tf-frame" x="${x0 - 8}" y="${y0 - 8}" width="${W + 16}" height="${H + 16}" rx="18"/>`;
  for (let r = 0; r < rows; r++) for (let c = 0; c < 5; c++) s += `<rect class="tf-cell" x="${x0 + c * cell + 4}" y="${y0 + r * cell + 4}" width="${cell - 8}" height="${cell - 8}" rx="12"/>`;
  const pos = i => [x0 + (i % 5) * cell + cell / 2, y0 + Math.floor(i / 5) * cell + cell / 2];
  const items = [];
  for (let i = 0; i < filled; i++) { const [cx, cy] = pos(i); s += chip(cx, cy, 24, twoColor && i >= 5 ? 'b' : 'r'); items.push([cx, cy, 24]); }
  for (let i = filled; i < filled + ghosts; i++) { const [cx, cy] = pos(i); s += `<circle cx="${cx}" cy="${cy}" r="19" class="ghost"/>`; }
  const groups = [];
  const rowGroup = (r, from, to, kind) => { if (to > from) groups.push({ x: x0 + from * cell + 1, y: y0 + r * cell + 1, w: (to - from) * cell - 2, h: cell - 2, count: to - from, kind }); };
  if (!ghosts) { rowGroup(0, 0, Math.min(filled, 5)); if (rows === 2) rowGroup(1, 0, Math.max(0, filled - 5)); }
  else {
    const e0 = filled, e1 = filled + ghosts;
    if (e0 < 5) rowGroup(0, e0, Math.min(5, e1), 'gap');
    if (rows === 2 && e1 > 5) rowGroup(1, Math.max(0, e0 - 5), e1 - 5, 'gap');
  }
  return { svg: s, groups, items };
}
const PIPS = { 1: [[1, 1]], 2: [[2, 0], [0, 2]], 3: [[2, 0], [1, 1], [0, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
function die(x, y, size, n, items) {
  let s = `<rect class="die" x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.2}"/>`;
  const pad = size * 0.24, step = (size - 2 * pad) / 2, r = size * 0.095;
  for (const [cx, cy] of PIPS[n]) { const px = x + pad + cx * step, py = y + pad + cy * step; s += `<circle class="pip" cx="${px}" cy="${py}" r="${r}"/>`; items.push([px, py, r]); }
  return s;
}
function svgDice(n, pair) {
  const items = [];
  if (n > 6 && !pair) pair = shuffle([...pick(DICE_PAIRS[n])]);
  if (n <= 6) { const sz = 170, x = 115, y = 55; return { svg: die(x, y, sz, n, items), groups: [{ x: x - 6, y: y - 6, w: sz + 12, h: sz + 12, count: n }], items }; }
  const sz = 150, gap = 28, x1 = 200 - gap / 2 - sz, x2 = 200 + gap / 2, y = 65;
  const svg = die(x1, y, sz, pair[0], items) + die(x2, y, sz, pair[1], items);
  return { svg, groups: [{ x: x1 - 6, y: y - 6, w: sz + 12, h: sz + 12, count: pair[0] }, { x: x2 - 6, y: y - 6, w: sz + 12, h: sz + 12, count: pair[1] }], items };
}
function handSVG(raised) {
  // Lokale Koordinaten, Daumen rechts. Reihenfolge beim Zählen: Daumen, Zeige-, Mittel-, Ring-, kleiner Finger.
  const fingers = [{ x: 82, top: 22 }, { x: 58, top: 10 }, { x: 34, top: 18 }, { x: 12, top: 40 }];
  let s = '';
  if (raised >= 1) s += '<rect class="fg up" x="104" y="64" width="22" height="70" rx="11" transform="rotate(28 115 134)"/>';
  fingers.forEach((f, i) => { const up = raised >= i + 2, top = up ? f.top : 78; s += `<rect class="fg ${up ? 'up' : 'down'}" x="${f.x}" y="${top}" width="21" height="${130 - top}" rx="10.5"/>`; });
  s += '<rect class="palm" x="8" y="92" width="102" height="96" rx="34"/>';
  if (raised < 1) s += '<rect class="fg down" x="70" y="118" width="20" height="44" rx="10" transform="rotate(-62 80 140)"/>';
  return s;
}
const TIP_LOCAL = [[142.7, 81.9], [92.5, 34], [68.5, 22], [44.5, 30], [22.5, 52]];
function svgFingers(n) {
  const sc = 1.15, y = 26, items = [], groups = [];
  const place = (raised, tx, mirror) => {
    const tr = mirror ? `translate(${tx} ${y}) scale(${-sc} ${sc})` : `translate(${tx} ${y}) scale(${sc})`;
    for (let i = 0; i < raised; i++) { const [lx, ly] = TIP_LOCAL[i]; items.push([mirror ? tx - lx * sc : tx + lx * sc, y + ly * sc, 12]); }
    const gx = mirror ? tx - 156 * sc : tx + 4 * sc;
    groups.push({ x: gx, y: y + 4, w: 152 * sc, h: 190 * sc, count: raised });
    return `<g transform="${tr}">${handSVG(raised)}</g>`;
  };
  let svg;
  if (n <= 5) svg = place(n, 108, false);
  else svg = place(5, 15, false) + place(n - 5, 385, true);
  return { svg, groups, items };
}
const BUG_PAT = { 1: [[.55, .5]], 2: [[.38, .22], [.62, .78]], 3: [[.32, .2], [.54, .5], [.72, .8]], 4: [[.3, .22], [.75, .22], [.3, .78], [.75, .78]], 5: [[.3, .2], [.75, .2], [.52, .5], [.3, .8], [.75, .8]] };
function svgLadybug(n) {
  const L = n <= 5 ? Math.ceil(n / 2) : 5, R = n - L;
  const tx = 60, ty = 16, sc = 1.4, items = [];
  const spots = (count, side) => (BUG_PAT[count] || []).map(([u, v]) => {
    const lx = side === 'L' ? 48 + u * 44 : 152 - u * 44, ly = 82 + v * 62;
    items.push([tx + lx * sc, ty + ly * sc, 8.5 * sc]);
    return `<circle class="spot" cx="${lx}" cy="${ly}" r="8.5"/>`;
  }).join('');
  const body = `<path d="M85 45Q70 15 50 20M115 45Q130 15 150 20M40 70Q20 65 15 50M35 100Q15 105 10 95M40 130Q20 145 25 155M160 70Q180 65 185 50M165 100Q185 105 190 95M160 130Q180 145 175 155" class="bug-leg"/>
    <circle cx="50" cy="20" r="5" class="bug-dark"/><circle cx="150" cy="20" r="5" class="bug-dark"/>
    <ellipse cx="100" cy="50" rx="32" ry="24" class="bug-dark"/>
    <circle cx="88" cy="42" r="4.5" class="eye-w"/><circle cx="89" cy="42" r="2.2" class="eye-b"/><circle cx="112" cy="42" r="4.5" class="eye-w"/><circle cx="111" cy="42" r="2.2" class="eye-b"/>
    <path d="M98 56Q30 58 35 125C38 160 90 162 98 162Z" class="bug-wing"/><path d="M102 56Q170 58 165 125C162 160 110 162 102 162Z" class="bug-wing"/>
    <line x1="100" y1="56" x2="100" y2="162" class="bug-mid"/>`;
  const svg = `<ellipse cx="200" cy="148" rx="190" ry="124" class="leafbg"/><g transform="translate(${tx} ${ty}) scale(${sc})">${body}${spots(L, 'L')}${spots(R, 'R')}</g>`;
  const groups = [];
  if (L) groups.push({ x: tx + 36 * sc, y: ty + 62 * sc, w: 62 * sc, h: 96 * sc, count: L });
  if (R) groups.push({ x: tx + 102 * sc, y: ty + 62 * sc, w: 62 * sc, h: 96 * sc, count: R });
  return { svg, groups, items };
}
const APPLE = '<path class="stem" d="M50 22Q54 8 62 6"/><path class="leafp" d="M52 14Q68 8 68 18Q58 20 52 14Z"/><path class="apple" d="M50 32C38 20 18 25 18 46C18 76 38 90 50 90C62 90 82 76 82 46C82 25 62 20 50 32Z"/><circle class="gloss" cx="34" cy="44" r="7"/>';
function svgFruit(n) {
  // Immer nur eine Obstsorte, damit Menge erfasst und nicht nach Sorten getrennt gezählt wird.
  const top = Math.min(n, 5), bottom = Math.max(0, n - 5), size = 64, gap = 6, items = [], groups = [];
  const rowYs = bottom ? [58, 146] : [102];
  let s = '<ellipse cx="200" cy="146" rx="186" ry="122" class="plate"/>';
  const row = (count, y) => {
    const w = count * size + (count - 1) * gap, x0 = 200 - w / 2;
    const its = [];
    for (let i = 0; i < count; i++) { const x = x0 + i * (size + gap); s += `<g transform="translate(${x} ${y}) scale(0.64)">${APPLE}</g>`; its.push([x + 32, y + 37, 22]); }
    items.push(...its); groups.push(boxOf(its, 10, count));
  };
  row(top, rowYs[0]); if (bottom) row(bottom, rowYs[1]);
  return { svg: s, groups, items };
}
const SPLITS = { 5: [[3, 2]], 6: [[3, 3], [4, 2]], 7: [[4, 3], [5, 2]], 8: [[4, 4], [5, 3]], 9: [[5, 4]], 10: [[5, 5]] };
function cloudLayout(n, stage) {
  const clusters = (n <= 4 || stage === 1) ? [n] : shuffle([...pick(SPLITS[n])]);
  const place = (count, cx, cy, rad, dmin) => {
    const mine = []; let tries = 0;
    while (mine.length < count && tries < 4000) {
      tries++;
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * rad;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.9;
      const dm = tries > 2500 ? dmin * 0.8 : dmin;
      if (x > 24 && x < 376 && y > 24 && y < 256 && mine.every(p => Math.hypot(p[0] - x, p[1] - y) >= dm)) mine.push([x, y, 14]);
    }
    return mine;
  };
  if (clusters.length === 1) {
    const pts = place(n, 200, 140, n <= 2 ? 60 : 100, 50);
    return { pts, groups: [boxOf(pts, 12, n)] };
  }
  const c1 = [118 + rand(-12, 12), 140 + rand(-28, 28)], c2 = [282 + rand(-12, 12), 140 + rand(-28, 28)];
  const rad = c => (c >= 4 ? 48 : 38);
  const m1 = place(clusters[0], c1[0], c1[1], rad(clusters[0]), 31), m2 = place(clusters[1], c2[0], c2[1], rad(clusters[1]), 31);
  return { pts: [...m1, ...m2], groups: [boxOf(m1, 12, clusters[0]), boxOf(m2, 12, clusters[1])] };
}
function svgCloud(layout) {
  const items = [...layout.pts].sort((a, b) => a[0] - b[0]);
  return { svg: layout.pts.map(([x, y]) => `<circle class="cdot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14"/>`).join(''), groups: layout.groups, items };
}
function renderRep(rep, n, t) {
  const two = D.settings.stage === 2;
  switch (rep) {
    case 'dice': return svgDice(n, t.dicePair);
    case 'fingers': return svgFingers(n);
    case 'ladybug': return svgLadybug(n);
    case 'fruit': return svgFruit(n);
    case 'cloud': return svgCloud(t.layout || cloudLayout(n, D.settings.stage));
    default: return svgTenframe(n, t.M, two);
  }
}
function groupMarks(groups) {
  return groups.map((g, i) => {
    const bx = clamp(g.x + g.w - 6, 22, 378), by = clamp(g.y + 4, 22, 258);
    return `<g class="grp ${g.kind === 'gap' ? 'grp-gap' : ''}" style="animation-delay:${i * 0.3}s"><rect class="grp-box" x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="20"/><circle class="grp-badge" cx="${bx}" cy="${by}" r="19"/><text class="grp-num" x="${bx}" y="${by}">${g.count}</text></g>`;
  }).join('');
}

/* =========================================================
   Aufgabe erzeugen
   ========================================================= */
const DICE_PAIRS = { 7: [[6, 1], [5, 2], [4, 3]], 8: [[6, 2], [5, 3], [4, 4]], 9: [[6, 3], [5, 4]], 10: [[6, 4], [5, 5]] };
function matchOptions(q, v, M) {
  const cands = v === 'near' ? [q - 1, q + 1, q - 2, q + 2] : shuffle([q - 4, q - 3, q - 2, q + 2, q + 3, q + 4]);
  const out = [q];
  for (const c of cands) { if (out.length === 3) break; if (c >= 1 && c <= M && !out.includes(c)) out.push(c); }
  for (let c = 1; out.length < 3 && c <= M; c++) if (!out.includes(c)) out.push(c);
  return shuffle(out);
}
function comparePair(d, M) {
  const pairs = [];
  for (let a = 1; a <= M; a++) for (let b = 1; b <= M; b++) { const dd = Math.abs(a - b); if (a !== b && (d === 3 ? dd >= 3 : dd === d)) pairs.push([a, b]); }
  return pick(pairs);
}
function panelDots(n) {
  const pts = []; let tries = 0, dmin = 34;
  while (pts.length < n && tries < 4000) {
    tries++; if (tries === 2500) dmin = 28;
    const x = rand(26, 174), y = rand(26, 174);
    if (pts.every(p => Math.hypot(p[0] - x, p[1] - y) >= dmin)) pts.push([x, y]);
  }
  return pts;
}
function makeTrial(task, item) {
  const M = D.settings.max, stage = D.settings.stage;
  const t = { id: ++trialSeq, task, item, M, stage, state: 'show' };
  if (task === 'blitz') {
    t.q = item.q; t.rep = item.rep; t.ans = t.q;
    if (t.rep === 'cloud') t.layout = cloudLayout(t.q, stage);
    if (t.rep === 'dice' && t.q > 6) t.dicePair = shuffle([...pick(DICE_PAIRS[t.q])]);
    t.expo = exposureFor('blitz', t);
  } else if (task === 'partner') {
    t.k = item.k; t.q = item.q; t.ans = t.q; t.expo = exposureFor('partner', t);
  } else if (task === 'match') {
    t.q = item.q;
    const reps = ['tenframe', 'dice', 'fingers'].filter(r => D.settings.reps[r] && (r !== 'dice' || stage === 2 || M <= 6));
    t.rep = reps.length ? pick(reps) : 'tenframe';
    t.options = matchOptions(t.q, item.v, M); t.ans = t.options.indexOf(t.q);
  } else if (task === 'compare') {
    t.f = item.f;
    const [a, b] = comparePair(item.d, M); t.vals = [a, b];
    t.kinds = item.f === 'digits' ? ['digit', 'digit'] : item.f === 'dots' ? ['dots', 'dots'] : shuffle(['digit', 'dots']);
    t.dots = t.kinds.map((k, i) => (k === 'dots' ? panelDots(t.vals[i]) : null));
    if (t.kinds.includes('dots')) t.expo = exposureFor('compare', t);
    t.ans = a > b ? 0 : 1;
  } else if (task === 'line') {
    t.q = item.q; t.ans = t.q;
  }
  return t;
}

/* =========================================================
   Oberfläche: Grundgerüst
   ========================================================= */
const el = {
  stage: $('#stage'), keypad: $('#keypad'), answer: $('#answer'), explain: $('#explain'), bubble: $('#bubble'),
  platti: $('#platti'), pips: $('#pips'), stars: $('#stars'), expoBar: $('#expo-bar'),
};
$('#btn-home').innerHTML = icon('home');
$('#btn-say').innerHTML = icon('speaker');
$('#btn-help').innerHTML = icon('help') + '<span>Weiß nicht</span>';
$('#btn-next').innerHTML = 'Weiter ' + icon('next');
$('#btn-play').innerHTML = icon('play') + ' Los geht’s!';
$('#intro-go').innerHTML = 'Los ' + icon('play');
$('#intro-say').innerHTML = icon('speaker');
$('#end-again').innerHTML = icon('play') + ' Noch eine Runde';
$('#end-home').innerHTML = icon('home') + ' Fertig';
$('#quit-no').innerHTML = icon('x') + ' Weiterspielen';
$('#quit-yes').innerHTML = icon('home') + ' Beenden';
$('#parent-close').innerHTML = icon('close');
el.platti.innerHTML = plattiSVG();
$('#platti-home').innerHTML = plattiSVG();
$('#platti-end').innerHTML = plattiSVG();

function setStars() { el.stars.innerHTML = icon('star') + `<span>${D.stars}</span>`; }
function plattiDo(cls, ms = 950) {
  el.platti.classList.remove('flip', 'nod'); void el.platti.offsetWidth;
  el.platti.classList.add(cls);
  clearTimeout(plattiDo.t); plattiDo.t = setTimeout(() => el.platti.classList.remove(cls), ms);
}
function setBubble(html) { el.bubble.innerHTML = `<span>${html}</span>`; }
function buildKeypad() {
  const M = D.settings.max;
  el.keypad.innerHTML = '';
  for (let n = 1; n <= M; n++) {
    const b = document.createElement('button');
    b.className = 'key'; b.type = 'button'; b.textContent = n; b.dataset.n = n;
    b.setAttribute('aria-label', NAME[n]);
    b.addEventListener('click', () => answer(n));
    el.keypad.appendChild(b);
  }
}
function updatePips() {
  if (!S) { el.pips.innerHTML = ''; return; }
  let h = '';
  for (let i = 0; i < S.total; i++) {
    const r = S.results[i];
    const cls = r ? (r.ok ? (r.cls === 'fast' ? 'fast' : 'ok') : 'miss') : (i === S.trialNo ? 'now' : '');
    h += `<span class="pip ${cls}"></span>`;
  }
  el.pips.innerHTML = h;
}
function show(id) { $(id).hidden = false; }
function hide(id) { $(id).hidden = true; }

/* =========================================================
   Runde
   ========================================================= */
function startSession(only = null) {
  Sound.init();
  S = {
    only, total: D.settings.len, trialNo: 0, blockNo: 0, blockTask: null, blockLeft: 0, prevTask: null,
    results: [], retries: [], recentKeys: [], lastQ: null, ease: 0, wrongRun: 0, calm: 0,
    stars: 0, t0: now(), newUnlocks: [], idx: (D.sessions.length ? (D.sessions[D.sessions.length - 1].i || D.sessions.length) : 0) + 1,
    lastFmt: null, paused: false,
  };
  buildKeypad(); hide('#home'); hide('#end'); updatePips(); setStars();
  nextStep();
}
function nextStep() {
  if (!S) return;
  clearTimeout(S.nextTimer);
  if (S.trialNo >= S.total) return endSession();
  if (S.blockLeft <= 0) {
    S.prevTask = S.blockTask;
    S.blockTask = pickBlockTask();
    S.blockLeft = Math.min(3, S.total - S.trialNo);
    S.blockNo++;
    if (S.blockTask !== S.prevTask) return showIntro(S.blockTask);
  }
  runTrial();
}
function introText(task) {
  if (task === 'partner') return `Wie viele Plätze sind noch frei bis zur ${NAME[D.settings.max]}?`;
  return GAME[task].intro;
}
function showIntro(task) {
  $('#intro-icon').innerHTML = GAME_ICON[task];
  $('#intro-title').textContent = GAME[task].name;
  $('#intro-text').textContent = introText(task);
  show('#intro');
  D.seen[task] = true; save();
  Speech.say(GAME[task].name + '! ' + introText(task));
  setTimeout(() => $('#intro-go').focus(), 50);
}
$('#intro-go').addEventListener('click', () => { hide('#intro'); Sound.init(); runTrial(); });
$('#intro-say').addEventListener('click', () => Speech.say(introText(S ? S.blockTask : 'blitz')));

function runTrial() {
  if (!S) return;
  el.explain.hidden = true;
  const { item, retry } = chooseItem(S.blockTask);
  T = makeTrial(S.blockTask, item);
  T.retry = retry;
  renderTrial(T);
  updatePips();
  const id = T.id;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!T || T.id !== id) return;
    T.t0 = performance.now();
    if (T.expo) {
      T.curtainTimer = setTimeout(() => closeCurtain(id), T.expo * 1000);
      if (D.settings.timer) runExpoBar(T.expo);
    }
    enableInputs(S.calm > 0 ? 900 : 0);
  }));
}
function runExpoBar(sec) {
  el.expoBar.hidden = false;
  const bar = el.expoBar.firstElementChild;
  bar.style.transition = 'none'; bar.style.transform = 'scaleX(1)';
  void bar.offsetWidth;
  bar.style.transition = `transform ${sec}s linear`; bar.style.transform = 'scaleX(0)';
}
function closeCurtain(id) {
  if (!T || T.id !== id || T.state !== 'show') return;
  T.state = 'covered';
  el.stage.querySelectorAll('.curtain').forEach(c => c.classList.add('down'));
  Sound.whoosh();
}
function openCurtains() { el.stage.querySelectorAll('.curtain').forEach(c => c.classList.remove('down')); }
function enableInputs(delay) {
  if (!T) return;
  const id = T.id;
  T.inputOn = false;
  el.keypad.classList.toggle('locked', delay > 0);
  if (delay > 0) {
    el.bubble.insertAdjacentHTML('beforeend', `<span class="calm-eye" id="calm">${icon('eye')} Erst gut schauen …</span>`);
    setTimeout(() => {
      if (!T || T.id !== id) return;
      T.inputOn = true; el.keypad.classList.remove('locked');
      const c = $('#calm'); if (c) c.remove();
    }, delay);
  } else T.inputOn = true;
}

/* ---------- Aufgaben zeichnen ---------- */
const CURTAIN = '<div class="curtain" aria-hidden="true"><span>?</span></div>';
function renderTrial(t) {
  el.expoBar.hidden = true;
  const usesKeypad = t.task === 'blitz' || t.task === 'partner';
  el.answer.hidden = false;
  el.keypad.hidden = !usesKeypad;
  el.keypad.querySelectorAll('.key').forEach(k => { k.classList.remove('right', 'picked'); k.disabled = false; });
  if (t.task === 'blitz') {
    const pic = renderRep(t.rep, t.q, t);
    t.pic = pic;
    el.stage.innerHTML = `<svg class="pic" viewBox="0 0 400 280" role="img" aria-label="Mengenbild">${pic.svg}<g class="marks"></g></svg>${CURTAIN}`;
    setBubble('Wie viele sind es?');
  } else if (t.task === 'partner') {
    const pic = svgTenframe(t.k, t.M, true);
    t.pic = pic;
    el.stage.innerHTML = `<svg class="pic" viewBox="0 0 400 280" role="img" aria-label="Zehnerfeld">${pic.svg}<g class="marks"></g></svg>${CURTAIN}`;
    setBubble(`Wie viele fehlen bis zur <span class="big-digit">${t.M}</span>?`);
  } else if (t.task === 'match') {
    t.optPics = t.options.map(v => renderRep(t.rep, v, { M: t.M }));
    el.stage.innerHTML = `<div class="match"><div class="opts">${t.optPics.map((p, i) => `<button type="button" class="opt" data-i="${i}" aria-label="Bild ${i + 1}"><svg viewBox="${optViewBox(t.rep, t.M, t.options[i])}" aria-hidden="true">${p.svg}<g class="marks"></g></svg></button>`).join('')}</div></div>`;
    el.stage.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => answer(Number(b.dataset.i))));
    setBubble(`Finde die <span class="big-digit">${t.q}</span>`);
    Speech.say(`Finde die ${NAME[t.q]}!`);
  } else if (t.task === 'compare') {
    const panel = (i) => {
      const k = t.kinds[i], v = t.vals[i];
      const inner = k === 'digit' ? `<text class="cmp-digit" x="100" y="104">${v}</text>` : t.dots[i].map(([x, y]) => `<circle class="cdot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13"/>`).join('');
      return `<button type="button" class="cmp-btn" data-i="${i}" aria-label="${i === 0 ? 'Linke' : 'Rechte'} Seite"><svg viewBox="0 0 200 200" aria-hidden="true">${inner}<g class="marks"></g></svg>${k === 'dots' ? CURTAIN : ''}</button>`;
    };
    el.stage.innerHTML = `<div class="cmp">${panel(0)}${panel(1)}</div>`;
    el.stage.querySelectorAll('.cmp-btn').forEach(b => b.addEventListener('click', () => answer(Number(b.dataset.i))));
    const txt = t.f === 'digits' ? 'Welche Zahl ist größer?' : t.f === 'dots' ? 'Wo sind mehr Punkte?' : 'Was ist mehr?';
    setBubble(txt);
    if (S.lastFmt !== t.f) Speech.say(txt);
    S.lastFmt = t.f;
  } else if (t.task === 'line') {
    el.answer.hidden = false;
    el.stage.innerHTML = `<div class="line-wrap"><svg class="line-svg" viewBox="0 0 400 220" role="img" aria-label="Zahlenstrahl von 0 bis ${t.M}">${svgLine(t)}<g class="marks"></g></svg></div>`;
    const svg = el.stage.querySelector('svg');
    svg.addEventListener('pointerdown', e => {
      const r = svg.getBoundingClientRect();
      const vx = (e.clientX - r.left) / r.width * 400;
      const step = 340 / t.M;
      answer(clamp(Math.round((vx - 30) / step), 0, t.M));
    });
    setBubble(`Wo wohnt die <span class="big-digit">${t.q}</span>?`);
    Speech.say(`Wo wohnt die ${NAME[t.q]}?`);
  }
}
function optViewBox(rep, M, v) {
  if (rep === 'tenframe') return M === 10 ? '22 56 356 168' : '22 92 356 96';
  if (rep === 'dice') return v <= 6 ? '95 40 210 200' : '25 50 350 180';
  if (rep === 'fingers') return v <= 5 ? '95 14 210 250' : '0 14 400 250';
  return '0 10 400 260';
}
function svgLine(t) {
  const M = t.M, x0 = 30, y = 140, step = 340 / M;
  let s = '<rect x="0" y="0" width="400" height="220" fill="transparent"/>';
  s += `<line class="nl-axis" x1="${x0}" y1="${y}" x2="${x0 + 340}" y2="${y}"/>`;
  for (let i = 0; i <= M; i++) {
    const x = x0 + i * step, big = i === 0 || i === 5 || i === M;
    s += `<line class="nl-tick ${big ? 'big' : ''}" x1="${x}" y1="${y - (big ? 20 : 12)}" x2="${x}" y2="${y + (big ? 20 : 12)}"/>`;
    if (big) s += `<text class="nl-label" x="${x}" y="${y + 56}">${i}</text>`;
  }
  return s;
}
function frogSVG(x, y) {
  return `<g transform="translate(${x} ${y})"><g class="frog"><ellipse cx="0" cy="0" rx="17" ry="13" class="frog-body"/><circle cx="-7" cy="-11" r="6" class="frog-eye"/><circle cx="7" cy="-11" r="6" class="frog-eye"/><circle cx="-7" cy="-11" r="2.4" class="frog-pupil"/><circle cx="7" cy="-11" r="2.4" class="frog-pupil"/><path d="M-7 3q7 5 14 0" class="nl-hop" style="stroke:var(--leaf-deep);stroke-width:2"/></g></g>`;
}
function starPath(cx, cy, r) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); }
  return d + 'Z';
}

/* ---------- Antworten ---------- */
function answer(value) {
  if (!T || !S || (T.state !== 'show' && T.state !== 'covered') || !T.inputOn) return;
  const rt = (performance.now() - T.t0) / 1000;
  clearTimeout(T.curtainTimer);
  const ok = value === T.ans;
  finishTrial(ok, rt, false, value);
}
function helpMe() {
  if (!T || !S || (T.state !== 'show' && T.state !== 'covered')) return;
  const rt = (performance.now() - (T.t0 || performance.now())) / 1000;
  clearTimeout(T.curtainTimer);
  finishTrial(false, rt, true, null);
}
$('#btn-help').addEventListener('click', helpMe);

function finishTrial(ok, rt, help, given) {
  T.state = 'feedback'; T.inputOn = false;
  el.expoBar.hidden = true;
  const cls = T.interrupted ? (help ? 'help' : ok ? 'ok' : 'wrong') : classify(T.task, T, ok, rt, help);
  let lvChange = 0;
  if (!T.interrupted) { updateModel(T.item, cls); lvChange = updateLadder(T.task, T, cls); }
  S.results.push({ task: T.task, cls, ok });
  S.recentKeys.push(T.item.key);
  S.lastQ = T.q ?? null;
  if (ok) S.wrongRun = 0; else S.wrongRun++;
  if (S.ease > 0) S.ease--;
  T.encourage = false;
  if (S.wrongRun >= 2) { S.ease = 2; S.wrongRun = 0; T.encourage = true; }
  if (S.calm > 0) S.calm--;
  if (cls === 'guess' && S.results.slice(-5).filter(r => r.cls === 'guess').length >= 2) S.calm = 3;
  if (!ok && !S.retries.some(r => r.task === T.task && (T.q !== undefined ? r.q === T.q : r.key === T.item.key))) {
    S.retries.push({ task: T.task, q: T.q, key: T.item.key, due: S.trialNo + 2 });
  }
  const stars = ok ? (cls === 'fast' ? 2 : 1) : 0;
  S.stars += stars; D.stars += stars;
  D.hist.push({
    t: now(), s: S.idx, k: T.task, key: T.item.key, q: T.q ?? null, a: given, ok: ok ? 1 : 0,
    rt: Math.round(rt * 100) / 100, c: cls, ex: T.expo ? Math.round(T.expo * 100) / 100 : 0,
    r: T.rep || T.f || null, st: T.stage, x: T.interrupted ? 1 : 0,
  });
  for (const k of Object.keys(UNLOCK)) if (!D.unlocked[k] && D.stars >= UNLOCK[k]) { D.unlocked[k] = true; S.newUnlocks.push(k); }
  save();
  S.trialNo++; S.blockLeft--;
  updatePips(); setStars();
  showFeedback(T, ok, cls, stars, given, lvChange);
}

/* ---------- Rückmeldung ---------- */
const PRAISE_FAST = ['Blitzschnell erkannt!', 'Super hingeschaut!', 'Wie ein Blitz!', 'Klasse gesehen!'];
const PRAISE_OK = ['Richtig!', 'Genau!', 'Prima!', 'Stimmt!'];
const ENCOURAGE = ['Nächstes Mal schaffst du es bestimmt!', 'Fast! Schau mal:', 'Kein Problem – schau mal:', 'Gleich klappt’s! Schau:'];
function explain(t) {
  const W = WORD, two = t.stage === 2;
  if (t.task === 'blitz') {
    const n = t.q;
    if (two) {
      const g = t.pic.groups.map(x => x.count).filter(c => c > 0);
      if (g.length >= 2) return { text: `${g.join(' und ')} sind ${n}`, say: `${g.map(c => W[c]).join(' und ')} sind ${W[n]}.`, groups: true };
      if (n === 4 && ['tenframe', 'fingers', 'fruit'].includes(t.rep)) return { text: '4 – eins weniger als 5', say: 'Vier. Eins weniger als fünf.', groups: true };
    }
    if (n === 5 && t.rep === 'fingers') return { text: 'Eine ganze Hand: 5', say: 'Eine ganze Hand. Das sind fünf.' };
    if (n === 10 && t.rep === 'fingers') return { text: 'Zwei ganze Hände: 10', say: 'Zwei ganze Hände. Das sind zehn.' };
    if (n === 5 && (t.rep === 'tenframe' || t.rep === 'fruit')) return { text: 'Eine volle Reihe: 5', say: 'Eine volle Reihe. Das sind fünf.' };
    if (n === 10 && t.rep === 'tenframe') return { text: 'Alles voll: 10', say: 'Alles voll. Das sind zehn.' };
    if (t.rep === 'dice' && n <= 6) return { text: `Das Würfelbild der ${n}`, say: `Das ist das Würfelbild der ${NAME[n]}.` };
    return { text: n === 1 ? 'Das ist 1' : `Das sind ${n}`, say: n === 1 ? 'Das ist eins.' : `Das sind ${W[n]}.` };
  }
  if (t.task === 'partner') {
    const k = t.k, a = t.q, M = t.M;
    return { text: `${k} und ${a} sind ${M}`, say: `${W[k]} und ${W[a]} sind ${W[M]}. Es ${a === 1 ? 'fehlt eins' : 'fehlen ' + W[a]}.` };
  }
  if (t.task === 'match') {
    const q = t.q;
    if (two && q > 5 && t.rep !== 'dice') return { text: `So sieht die ${q} aus: 5 und ${q - 5}`, say: `So sieht die ${NAME[q]} aus. Fünf und ${W[q - 5]}.` };
    return { text: `So sieht die ${q} aus`, say: `So sieht die ${NAME[q]} aus.` };
  }
  if (t.task === 'compare') {
    const big = Math.max(...t.vals), small = Math.min(...t.vals);
    return { text: `${big} ist mehr als ${small}`, say: `${W[big]} ist mehr als ${W[small]}.` };
  }
  const h = lineHint(t.q, t.M, two);
  return { text: h.text, say: h.say };
}
function lineHint(n, M, two) {
  if (!two) return { text: `Die ${n} wohnt hier`, say: `Die ${NAME[n]} wohnt hier.`, from: null };
  if (n === 5) return { text: 'Die 5 wohnt genau in der Mitte', say: 'Die Fünf wohnt genau in der Mitte.', from: null };
  if (n < 3) return { text: `Von der 0 aus: ${n} ${n === 1 ? 'Schritt' : 'Schritte'}`, say: `Von der Null aus ${n === 1 ? 'ein Schritt' : WORD[n] + ' Schritte'}.`, from: 0 };
  if (n < 5) return { text: `${5 - n} vor der 5`, say: `Die ${NAME[n]} ist ${WORD[5 - n]} vor der Fünf.`, from: 5 };
  if (M === 10 && n >= 8) return { text: `${10 - n} vor der 10`, say: `Die ${NAME[n]} ist ${WORD[10 - n]} vor der Zehn.`, from: 10 };
  return { text: `5 und noch ${n - 5}`, say: `Fünf und noch ${n - 5 === 1 ? 'ein Schritt' : WORD[n - 5] + ' Schritte'}.`, from: 5 };
}
function showToast(text, stars) {
  const old = el.stage.querySelector('.toast'); if (old) old.remove();
  const plus = stars ? `<span class="plus">+${stars}${icon('star')}</span>` : '';
  el.stage.insertAdjacentHTML('beforeend', `<div class="toast" role="status">${icon('check')}<span>${esc(text)}</span>${plus}</div>`);
}
function countAnimation(svgMarks, items, total, extraSay) {
  // Stufe 1: Teile leuchten nacheinander auf (eins, zwei, …), dann wird die ganze Menge benannt.
  const step = 430;
  items.forEach((p, i) => setTimeout(() => {
    if (!svgMarks.isConnected) return;
    const label = p[2] >= 14 ? `<text class="cnt-num" x="${p[0]}" y="${p[1]}">${i + 1}</text>` : '';
    svgMarks.insertAdjacentHTML('beforeend', `<g><circle class="cnt-ring" cx="${p[0]}" cy="${p[1]}" r="${p[2] + 5}"/>${label}</g>`);
  }, 300 + i * step));
  setTimeout(() => {
    if (!svgMarks.isConnected) return;
    svgMarks.insertAdjacentHTML('beforeend', groupMarks([boxOf(items, 14, total)]));
  }, 300 + items.length * step);
  Speech.say(items.map((_, i) => WORD[i + 1]).join(', ') + '. ' + extraSay);
}
function showFeedback(t, ok, cls, stars, given, lvChange) {
  disableInputsVisual();
  openCurtains();
  const ex = explain(t);
  const marks = el.stage.querySelector('.marks');
  // Wahl sichtbar machen
  if ((t.task === 'blitz' || t.task === 'partner') && given) { const k = el.keypad.querySelector(`[data-n="${given}"]`); if (k) k.classList.add(ok ? 'right' : 'picked'); }
  if (!ok) { const k = el.keypad.querySelector(`[data-n="${t.ans}"]`); if (k && (t.task === 'blitz' || t.task === 'partner')) k.classList.add('right'); }
  if (t.task === 'compare') {
    const btns = el.stage.querySelectorAll('.cmp-btn');
    btns.forEach((b, i) => { b.classList.add(i === t.ans ? 'win' : 'lose'); if (t.kinds[i] === 'dots') b.querySelector('.marks').innerHTML = `<circle cx="168" cy="32" r="24" class="cmp-badge"/><text class="cmp-count" x="168" y="33">${t.vals[i]}</text>`; });
  }
  if (t.task === 'match') {
    const btns = el.stage.querySelectorAll('.opt');
    btns.forEach((b, i) => { if (i === t.ans) b.classList.add('win'); else if (i === given) b.classList.add('lose'); });
  }
  if (t.task === 'line') {
    const step = 340 / t.M, xa = 30 + t.q * step;
    let s = '';
    if (given !== null && given !== undefined) s += frogSVG(30 + given * step, 112);
    if (!ok || cls === 'slow') {
      const h = lineHint(t.q, t.M, t.stage === 2);
      if (h.from !== null && h.from !== undefined) {
        const dir = Math.sign(t.q - h.from);
        for (let i = 0; i < Math.abs(t.q - h.from); i++) {
          const a = 30 + (h.from + dir * i) * step, b = 30 + (h.from + dir * (i + 1)) * step;
          s += `<path class="nl-hop" d="M${a} 134Q${(a + b) / 2} 96 ${b} 134"/>`;
        }
      }
      s += `<path class="nl-star" d="${starPath(xa, 140, 15)}"/>`;
      if (![0, 5, t.M].includes(t.q)) s += `<text class="nl-label" x="${xa}" y="196" style="fill:var(--leaf-deep)">${t.q}</text>`;
    }
    marks.innerHTML = s;
  }

  if (ok && cls !== 'slow') {
    const praise = cls === 'fast' ? pick(PRAISE_FAST) : pick(PRAISE_OK);
    const head = (t.task === 'blitz' || t.task === 'partner' || t.task === 'match') ? `${t.q}! ` : '';
    showToast(head + praise, stars);
    plattiDo('flip', 1000); Sound.good(cls === 'fast');
    const name = D.name && Math.random() < 0.3 ? `, ${D.name}` : '';
    const sayHead = (t.task === 'blitz' || t.task === 'partner' || t.task === 'match') ? NAME[t.q] + '! ' : '';
    Speech.say(sayHead + praise.replace('!', '') + name + '!');
    S.nextTimer = setTimeout(nextStep, cls === 'fast' ? 1250 : 1450);
    return;
  }
  if (ok && cls === 'slow') {
    // Richtig, aber vermutlich gezählt: kurz zeigen, wie man es schneller sieht.
    showToast(`${t.task === 'compare' || t.task === 'line' ? '' : t.q + '! '}Richtig!`, stars);
    plattiDo('flip', 1000); Sound.good(false);
    if (t.task === 'blitz' && marks) marks.innerHTML = groupMarks(ex.groups ? t.pic.groups : [boxOf(t.pic.items, 14, t.q)]);
    if (t.task === 'partner' && marks) marks.innerHTML = groupMarks(svgTenframe(t.k, t.M, true, t.q).groups);
    if (t.task === 'match') { const m = el.stage.querySelectorAll('.opt .marks')[t.ans]; const p = t.optPics[t.ans]; if (m) m.innerHTML = groupMarks(t.stage === 2 && t.q > 5 ? p.groups : [boxOf(p.items, 14, t.q)]); }
    Speech.say('Richtig! ' + ex.say);
    S.nextTimer = setTimeout(nextStep, 2700);
    return;
  }
  // Falsch, geraten oder „Weiß nicht“: freundlich erklären, nie schimpfen.
  plattiDo('nod', 950); Sound.soft();
  const title = cls === 'help' ? 'Ich zeig’s dir:' : cls === 'guess' ? 'Ganz in Ruhe – schau mal:' : pick(ENCOURAGE);
  $('#explain-title').textContent = title;
  $('#explain-eq').textContent = ex.text;
  el.answer.hidden = true; el.explain.hidden = false;
  const endSay = cls === 'help' ? '' : cls === 'guess' ? 'Schau beim nächsten Mal ganz in Ruhe.' : pick(['Nächstes Mal schaffst du es bestimmt!', 'Du schaffst das!', 'Beim nächsten Mal klappt es!']);
  let sayText = (cls === 'help' ? 'Ich zeig es dir. ' : cls === 'guess' ? 'Schau ganz in Ruhe hin. ' : title.replace(/:$/, '.') + ' ') + ex.say;
  if (t.task === 'blitz') {
    if (t.stage === 2 && ex.groups) { marks.innerHTML = groupMarks(t.pic.groups); Speech.say(sayText); }
    else countAnimation(marks, t.pic.items, t.q, ex.say + ' ' + endSay);
  } else if (t.task === 'partner') {
    const ghost = svgTenframe(t.k, t.M, true, t.q);
    el.stage.querySelector('svg.pic').innerHTML = ghost.svg + `<g class="marks">${groupMarks(ghost.groups)}</g>`;
    Speech.say(sayText);
  } else if (t.task === 'match') {
    const m = el.stage.querySelectorAll('.opt .marks')[t.ans], p = t.optPics[t.ans];
    if (t.stage === 2 && t.q > 5 && t.rep !== 'dice') { m.innerHTML = groupMarks(p.groups); Speech.say(sayText); }
    else countAnimation(m, p.items, t.q, ex.say + ' ' + endSay);
  } else Speech.say(sayText);
  if (T.encourage) setBubble('Du schaffst das!');
  setTimeout(() => $('#btn-next').focus({ preventScroll: true }), 60);
}
function disableInputsVisual() { el.keypad.querySelectorAll('.key').forEach(k => { k.disabled = true; }); }
$('#btn-next').addEventListener('click', () => {
  if (!S || !T || T.state !== 'feedback') return;
  T.state = 'done';
  Speech.stop();
  nextStep();
});

/* ---------- Rundenende ---------- */
function endSession() {
  const n = S.results.length, ok = S.results.filter(r => r.ok).length, fast = S.results.filter(r => r.cls === 'fast').length;
  const dur = Math.min(now() - S.t0, n * 60000);
  D.sessions.push({ t: now(), i: S.idx, dur, n, ok, fast, stars: S.stars, only: S.only });
  save();
  const today = D.sessions.filter(s => dayKey(s.t) === dayKey(now()));
  const mins = today.reduce((a, s) => a + s.dur, 0) / 60000;
  $('#end-stars').innerHTML = `+${S.stars}${icon('star')}`;
  $('#end-badges').innerHTML = `<span class="badge">${icon('check')} ${ok} von ${n} richtig</span>` + (fast ? `<span class="badge">${icon('bolt')} ${fast}× blitzschnell</span>` : '');
  $('#end-unlock').innerHTML = S.newUnlocks.map(k => `<div class="unlock">${GAME_ICON[k]}<div><b>Neues Spiel!</b><br>${GAME[k].name}${k === 'partner' && D.settings.stage !== 2 ? ' (ab Lernstufe 2)' : ''}</div></div>`).join('');
  $('#end-note').textContent = mins >= 15 ? 'Toll geübt! Für heute reicht es – morgen geht es weiter.' : '';
  const unlockSay = S.newUnlocks.length ? ` Du hast ein neues Spiel freigeschaltet: ${GAME[S.newUnlocks[0]].name}!` : '';
  const starSay = S.stars === 1 ? 'einen Stern' : `${S.stars} Sterne`;
  Speech.say(`Geschafft${D.name ? ', ' + D.name : ''}! Du hast ${starSay} gesammelt.${unlockSay}`);
  const lastOnly = S.only;
  S = null; T = null;
  show('#end');
  const p = $('#platti-end'); p.classList.remove('flip'); void p.offsetWidth; p.classList.add('flip');
  $('#end-again').onclick = () => { hide('#end'); startSession(lastOnly); };
}
$('#end-home').addEventListener('click', () => { hide('#end'); showHome(); });

/* ---------- Startbildschirm ---------- */
function showHome() {
  Speech.stop();
  if (S) { clearTimeout(S.nextTimer); if (T) clearTimeout(T.curtainTimer); }
  S = null; T = null;
  ['#intro', '#end', '#quit', '#gate', '#parent'].forEach(hide);
  el.answer.hidden = false; el.explain.hidden = true;
  $('#hello').textContent = D.name ? `Hallo, ${D.name}!` : 'Hallo! Schön, dass du da bist.';
  const tiles = TASKS.map(k => {
    const stageLock = k === 'partner' && D.settings.stage !== 2;
    const locked = !D.unlocked[k] || stageLock || !D.settings.tasks[k];
    const why = !D.settings.tasks[k] ? 'aus' : !D.unlocked[k] ? `${UNLOCK[k]}` : stageLock ? 'Stufe 2' : '';
    const lock = locked ? `<span class="lock">${icon(why && /^\d/.test(why) ? 'star' : 'lock')}${why}</span>` : '';
    return `<button type="button" class="tile ${locked ? 'locked' : ''}" data-task="${k}" ${locked ? 'aria-disabled="true"' : ''}>${lock}${GAME_ICON[k]}<span>${GAME[k].name}</span></button>`;
  }).join('') + `<button type="button" class="tile" id="tile-parent">${'<svg class="gi" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" class="gi-card"/><g transform="translate(14 14) scale(1.5)" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' + IC.parents + '</g></svg>'}<span>Für Eltern</span></button>`;
  $('#tiles').innerHTML = tiles;
  $('#tiles').querySelectorAll('.tile[data-task]').forEach(b => b.addEventListener('click', () => {
    if (b.classList.contains('locked')) { Speech.say(D.unlocked[b.dataset.task] ? 'Dieses Spiel kommt später.' : `Dieses Spiel bekommst du bei ${UNLOCK[b.dataset.task]} Sternen.`); return; }
    startSession(b.dataset.task);
  }));
  $('#tile-parent').addEventListener('click', openGate);
  const today = D.sessions.filter(s => dayKey(s.t) === dayKey(now())).length;
  $('#home-meta').innerHTML = `<span>${icon('star')} ${D.stars} Sterne</span><span>${icon('check')} Heute ${today} ${today === 1 ? 'Runde' : 'Runden'}</span>`;
  updatePips(); setStars();
  show('#home');
}
$('#btn-play').addEventListener('click', () => { Speech.say(''); startSession(null); });
$('#btn-home').addEventListener('click', () => { if (S) { show('#quit'); } else showHome(); });
$('#quit-no').addEventListener('click', () => hide('#quit'));
$('#quit-yes').addEventListener('click', () => { hide('#quit'); showHome(); });
$('#btn-say').addEventListener('click', () => {
  if (!T) return;
  const t = T;
  const txt = t.task === 'match' ? `Finde die ${NAME[t.q]}!` : t.task === 'line' ? `Wo wohnt die ${NAME[t.q]}?` : t.task === 'compare' ? el.bubble.textContent : t.task === 'partner' ? `Wie viele fehlen bis zur ${NAME[t.M]}?` : 'Wie viele sind es?';
  Speech.say(txt);
});

/* ---------- Pausen: Unterbrechung macht die Zeitmessung ungültig ---------- */
document.addEventListener('visibilitychange', () => { if (document.hidden && T && (T.state === 'show' || T.state === 'covered')) T.interrupted = true; });
function pauseGame() {
  if (!S) return;
  Speech.stop();
  clearTimeout(S.nextTimer);
  if (T && (T.state === 'show' || T.state === 'covered')) { clearTimeout(T.curtainTimer); T.state = 'aborted'; S.resume = 'trial'; }
  else if (T && T.state === 'feedback') S.resume = 'next';
  else S.resume = null;
}
function resumeGame() {
  if (!S || !S.resume) return;
  const r = S.resume; S.resume = null;
  if (r === 'trial') runTrial(); else if (r === 'next') nextStep();
}

/* ---------- Tastatur ---------- */
window.addEventListener('keydown', e => {
  if (!$('#parent').hidden || !$('#gate').hidden) return;
  if (!$('#intro').hidden && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); $('#intro-go').click(); return; }
  if (!T || !S) return;
  if (T.state === 'feedback' && !el.explain.hidden && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); $('#btn-next').click(); return; }
  if (T.state !== 'show' && T.state !== 'covered') return;
  if (T.task === 'blitz' || T.task === 'partner') {
    let v = null;
    if (e.key >= '1' && e.key <= '9') v = Number(e.key); else if (e.key === '0') v = 10;
    if (v !== null && v <= D.settings.max) answer(v);
  } else if (T.task === 'compare') {
    if (e.key === 'ArrowLeft') answer(0); else if (e.key === 'ArrowRight') answer(1);
  } else if (T.task === 'match' && e.key >= '1' && e.key <= '3') answer(Number(e.key) - 1);
  if (e.key === '?') helpMe();
});

/* =========================================================
   Eltern-Bereich
   ========================================================= */
let gateAns = 0;
function openGate() {
  pauseGame();
  const a = 3 + Math.floor(Math.random() * 7), b = 3 + Math.floor(Math.random() * 7);
  gateAns = a * b;
  $('#gate-q').textContent = `${a} × ${b} = ?`;
  $('#gate-in').value = ''; $('#gate-err').hidden = true;
  show('#gate');
  setTimeout(() => $('#gate-in').focus(), 50);
}
$('#gate-form').addEventListener('submit', e => {
  e.preventDefault();
  if (Number($('#gate-in').value) === gateAns) { hide('#gate'); openParent(); }
  else { $('#gate-err').hidden = false; $('#gate-in').select(); }
});
$('#gate-cancel').addEventListener('click', () => { hide('#gate'); resumeGame(); });

let parentTab = 'overview';
function openParent() { show('#parent'); renderTab(parentTab); }
$('#parent-close').addEventListener('click', () => {
  hide('#parent'); $('#tip').hidden = true;
  if (S) { buildKeypad(); resumeGame(); } else showHome();
});
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('.tab-btn'); if (!b) return;
  parentTab = b.dataset.tab; renderTab(parentTab);
});
function renderTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  const body = $('#tab-body');
  body.innerHTML = tab === 'overview' ? tabOverview() : tab === 'numbers' ? tabNumbers() : tab === 'settings' ? tabSettings() : tabResearch();
  if (tab === 'settings') bindSettings();
}

const STATUS = {
  auto: { label: 'Blitzschnell erkannt', short: 'blitzschnell', ic: 'bolt', color: 'var(--st-good)' },
  count: { label: 'Richtig, aber noch gezählt', short: 'zählt noch', ic: 'hourglass', color: 'var(--st-warn)' },
  learn: { label: 'Wird noch geübt', short: 'übt noch', ic: 'sprout', color: 'var(--st-serious)' },
  guess: { label: 'Oft zu schnell geraten', short: 'rät oft', ic: 'dice', color: 'var(--st-crit)' },
  none: { label: 'Noch zu wenig Daten', short: 'noch offen', ic: 'dot', color: 'var(--st-none)' },
};
const stChip = s => `<span class="chip-st"><i style="background:${STATUS[s].color}">${icon(STATUS[s].ic)}</i>${STATUS[s].short}</span>`;

function profileNumbers() {
  const M = D.settings.max, out = [];
  for (let n = 1; n <= M; n++) {
    const hs = D.hist.filter(h => h.k === 'blitz' && h.q === n && !h.x).slice(-12);
    const tries = hs.length, ok = hs.filter(h => h.ok).length, fast = hs.filter(h => h.c === 'fast').length, guess = hs.filter(h => h.c === 'guess').length;
    const med = median(hs.filter(h => h.ok).map(h => h.rt));
    const L = D.ladder['blitz:' + n];
    const lv = L ? L.lv : (START_LEVEL[D.startProfile] ?? 1);
    let status = 'none';
    if (tries >= 3) {
      const acc = ok / tries;
      if (guess / tries >= 0.3) status = 'guess';
      else if (acc >= 0.8 && fast / tries >= 0.6) status = 'auto';
      else if (acc >= 0.7) status = 'count';
      else status = 'learn';
    }
    out.push({ n, tries, ok, fast, guess, med, lv, expo: D.settings.expoMode === 'fixed' ? D.settings.expoFixed : EXPO[lv], status, thr: thresholds('blitz', { q: n }).fast });
  }
  return out;
}
function countingSlope(prof) {
  const pts = prof.filter(p => p.n >= 4 && p.med != null && p.ok >= 2);
  if (pts.length < 3) return null;
  const mx = mean(pts.map(p => p.n)), my = mean(pts.map(p => p.med));
  const num = pts.reduce((s, p) => s + (p.n - mx) * (p.med - my), 0), den = pts.reduce((s, p) => s + (p.n - mx) ** 2, 0);
  return den ? num / den : null;
}
function taskSummary(k) {
  const hs = D.hist.filter(h => h.k === k && !h.x);
  const last = hs.slice(-20), prev = hs.slice(-40, -20);
  const acc = a => (a.length ? a.filter(h => h.ok).length / a.length : null);
  const items = bank(k);
  const sure = items.length ? items.filter(it => pCorrect(it) >= 0.8).length / items.length : 0;
  return { n: hs.length, acc: acc(last), fast: last.length ? last.filter(h => h.c === 'fast').length / last.length : null, trend: prev.length >= 10 && last.length >= 10 ? acc(last) - acc(prev) : null, sure };
}
function sureUpTo() {
  const M = D.settings.max; let best = 0;
  for (let n = 1; n <= M; n++) {
    const its = bank('blitz').filter(it => it.q === n && it.rep !== 'cloud');
    if (its.length && mean(its.map(pCorrect)) >= 0.8) best = n; else break;
  }
  return best;
}

function tabOverview() {
  const sess = D.sessions, last50 = D.hist.filter(h => !h.x).slice(-50);
  const days = []; const daySet = new Map();
  sess.forEach(s => daySet.set(dayKey(s.t), (daySet.get(dayKey(s.t)) || 0) + s.dur));
  for (let i = 13; i >= 0; i--) { const t = now() - i * DAY; days.push({ t, on: daySet.has(dayKey(t)), min: (daySet.get(dayKey(t)) || 0) / 60000 }); }
  const practiced = days.filter(d => d.on).length;
  const acc = last50.length ? last50.filter(h => h.ok).length / last50.length : null;
  const fast = last50.length ? last50.filter(h => h.c === 'fast').length / last50.length : null;
  let h = '';
  if (!D.hist.length) h += '<p class="empty">Noch keine Daten. Sobald Ihr Kind eine Runde gespielt hat, sehen Sie hier, wie sicher und wie schnell es Mengen erfasst.</p>';
  h += `<div class="stat-row">
    <div class="stat"><b>${sess.length}</b><span>Runden gespielt</span></div>
    <div class="stat"><b>${practiced} / 14</b><span>Übungstage (2 Wochen)</span></div>
    <div class="stat"><b>${acc === null ? '–' : pct(acc)}</b><span>Richtig (letzte 50)</span></div>
    <div class="stat"><b>${fast === null ? '–' : pct(fast)}</b><span>Blitzschnell (letzte 50)</span></div>
  </div>`;
  h += `<div><h3>Geübt in den letzten 14 Tagen</h3><div class="days" style="margin-top:8px">${days.map(d => `<span class="day ${d.on ? 'on' : ''}" data-tip="${esc(new Date(d.t).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' }) + (d.on ? ': ' + Math.max(1, Math.round(d.min)) + ' Min.' : ': nicht geübt'))}" tabindex="0"></span>`).join('')}</div><div class="day-labels"><span>vor 2 Wochen</span><span>heute</span></div></div>`;
  h += `<div><h3>Verlauf der letzten Runden</h3><p class="p-note">Anteil der Aufgaben pro Runde. Ziel ist, dass der dunkle Teil (blitzschnell, also ohne Abzählen erkannt) wächst.</p>${chartSessions(sess.slice(-12))}</div>`;
  h += `<div><h3>Spiele</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Spiel</th><th>Aufgaben</th><th>Richtig (letzte 20)</th><th>Blitzschnell</th><th>Trend</th><th>Sicher gekonnt</th></tr></thead><tbody>${TASKS.map(k => {
    const s = taskSummary(k);
    const tr = s.trend === null ? '–' : s.trend > 0.05 ? '▲ besser' : s.trend < -0.05 ? '▼ schwächer' : '● stabil';
    return `<tr><td>${GAME[k].name}${!D.unlocked[k] ? ' <span class="p-note">(gesperrt)</span>' : ''}</td><td>${s.n}</td><td>${s.acc === null ? '–' : pct(s.acc)}</td><td>${s.fast === null ? '–' : pct(s.fast)}</td><td>${tr}</td><td><span class="meter"><i style="width:${Math.round(s.sure * 100)}%"></i></span>${pct(s.sure)}</td></tr>`;
  }).join('')}</tbody></table></div><p class="p-note">„Sicher gekonnt“ ist der Anteil der Aufgaben eines Spiels, die Ihr Kind laut Lern-Steuerung mit mindestens 80 % Wahrscheinlichkeit löst.</p></div>`;
  h += `<div><h3>Empfehlungen für die nächsten Tage</h3><div class="reco">${recommendations().map(r => `<div class="reco-item" style="box-shadow: inset 4px 0 0 ${r.color}"><b>${r.title}</b><p>${r.text}</p></div>`).join('')}</div></div>`;
  return h;
}
function chartSessions(list) {
  if (!list.length) return '<p class="empty">Noch keine Runde gespielt.</p>';
  const W = 600, H = 210, L = 46, R = 12, T0 = 12, B = 30, band = (W - L - R) / list.length, bw = Math.min(24, band * 0.6);
  const y = v => T0 + (H - T0 - B) * (1 - v);
  let s = '';
  [0, 0.5, 1].forEach(v => { s += `<line class="c-grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="c-tick" x="${L - 8}" y="${y(v)}" text-anchor="end" dominant-baseline="central">${v * 100} %</text>`; });
  list.forEach((se, i) => {
    const cx = L + band * (i + 0.5), f = se.n ? se.fast / se.n : 0, o = se.n ? (se.ok - se.fast) / se.n : 0;
    const yb = y(0), yf = y(f), yo = y(f + o);
    if (f > 0) s += `<path d="${roundTop(cx - bw / 2, yf, bw, yb - yf, o > 0 ? 0 : 4)}" style="fill:var(--s1)"/>`;
    if (o > 0) s += `<path d="${roundTop(cx - bw / 2, yo, bw, Math.max(0, (f > 0 ? yf - 2 : yb) - yo), 4)}" style="fill:var(--s2)"/>`;
    const d = new Date(se.t).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });
    if (i === 0 || i === list.length - 1 || list.length <= 6) s += `<text class="c-xl" x="${cx}" y="${H - B + 18}" text-anchor="middle">${d}</text>`;
    s += `<rect class="c-hit" x="${cx - band / 2}" y="${T0}" width="${band}" height="${H - T0 - B}" tabindex="0" data-tip="${esc(`Runde vom ${d}: ${se.ok} von ${se.n} richtig, davon ${se.fast} blitzschnell`)}"/>`;
  });
  s += `<line class="c-axis" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>`;
  return `<div class="legend" style="margin-bottom:6px"><span><i style="background:var(--s1)"></i>blitzschnell richtig</span><span><i style="background:var(--s2)"></i>richtig, aber langsamer</span></div><svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Richtige und blitzschnelle Antworten pro Runde">${s}</svg>`;
}
function roundTop(x, y, w, h, r) {
  if (h <= 0) return '';
  r = Math.min(r, h, w / 2);
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
}
function chartRT(prof) {
  const vals = prof.map(p => p.med).filter(v => v != null);
  if (!vals.length) return '<p class="empty">Noch keine richtigen Antworten im Blitzblick. Nach ein bis zwei Runden erscheint hier die Reaktionszeit pro Menge.</p>';
  const W = 600, H = 240, L = 46, R = 78, T0 = 14, B = 32, M = prof.length;
  const top = Math.max(2, Math.ceil(Math.max(...vals, ...prof.map(p => p.thr))));
  const y = v => T0 + (H - T0 - B) * (1 - v / top);
  const band = (W - L - R) / M, bw = Math.min(24, band * 0.55);
  const stepv = top <= 5 ? 1 : 2;
  let s = '';
  for (let v = 0; v <= top; v += stepv) s += `<line class="c-grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="c-tick" x="${L - 8}" y="${y(v)}" text-anchor="end" dominant-baseline="central">${v} s</text>`;
  prof.forEach((p, i) => {
    const cx = L + band * (i + 0.5);
    if (p.med != null) s += `<path d="${roundTop(cx - bw / 2, y(p.med), bw, y(0) - y(p.med), 4)}" style="fill:${STATUS[p.status].color}"/>`;
    s += `<text class="c-xl" x="${cx}" y="${H - B + 19}" text-anchor="middle">${p.n}</text>`;
    const tip = `Menge ${p.n}: ${p.med != null ? 'typische Zeit ' + fmtS(p.med) : 'noch keine richtige Antwort'} · ${p.ok} von ${p.tries} richtig · ${STATUS[p.status].label}`;
    s += `<rect class="c-hit" x="${cx - band / 2}" y="${T0}" width="${band}" height="${H - T0 - B}" tabindex="0" data-tip="${esc(tip)}"/>`;
  });
  s += `<line class="c-axis" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>`;
  s += `<polyline class="c-ref" points="${prof.map((p, i) => `${L + band * (i + 0.5)},${y(p.thr)}`).join(' ')}"/>`;
  s += `<text class="c-ref-l" x="${W - R + 8}" y="${y(prof[M - 1].thr)}" dominant-baseline="central">Blitz-Ziel</text>`;
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Typische Reaktionszeit pro Menge im Blitzblick">${s}</svg>`;
}
function tabNumbers() {
  const prof = profileNumbers(), slope = countingSlope(prof), b = baseline();
  const haveBase = D.hist.filter(h => h.k === 'blitz' && h.ok && h.q <= 3).length >= 4;
  let interp;
  if (slope === null) interp = 'Für eine Einschätzung braucht es noch mehr richtige Antworten bei Mengen ab 4.';
  else if (slope > 0.4) interp = `Ab 4 Dingen steigt die Zeit um etwa ${fmtS(slope)} pro zusätzlichem Ding. Das spricht dafür, dass Ihr Kind größere Mengen noch einzeln abzählt. Ziel ist eine flache Kurve: Mengen werden dann als Ganzes (z. B. „eine volle Reihe und noch zwei“) gesehen.`;
  else if (slope > 0.2) interp = `Ab 4 Dingen steigt die Zeit um etwa ${fmtS(slope)} pro Ding. Ihr Kind erkennt einen Teil der Mengen schon als Ganzes, zählt aber bei manchen noch.`;
  else interp = `Die Zeit steigt ab 4 Dingen kaum noch an (etwa ${fmtS(Math.max(0, slope))} pro Ding). Ihr Kind erfasst die Mengen weitgehend ohne Abzählen.`;
  const conf = {};
  D.hist.filter(h => h.k === 'blitz' && !h.ok && h.a != null && !h.x).slice(-200).forEach(h => { const k = h.q + '>' + h.a; conf[k] = (conf[k] || 0) + 1; });
  const confs = Object.entries(conf).sort((a, b2) => b2[1] - a[1]).slice(0, 4).map(([k, c]) => { const [q, a] = k.split('>').map(Number); return { q, a, c }; });
  const reps = REPS.map(r => { const hs = D.hist.filter(h => h.k === 'blitz' && h.r === r && !h.x).slice(-30); return { r, n: hs.length, acc: hs.length ? hs.filter(h => h.ok).length / hs.length : null }; });
  let h = `<p class="p-text">So sicher und so schnell erkennt Ihr Kind die einzelnen Mengen im <b>Blitzblick</b>. Gewertet werden die letzten 12 Versuche je Menge.</p>`;
  h += `<div class="num-grid">${prof.map(p => `<div class="num-tile"><span class="n">${p.n}</span>${stChip(p.status)}<span class="meta">${p.tries ? `${p.ok}/${p.tries} richtig` : 'noch nicht geübt'}</span><span class="meta">${p.med != null ? 'Zeit ' + fmtS(p.med) : '&nbsp;'}</span><span class="meta">Zeigezeit ${fmtS(p.expo)}</span></div>`).join('')}</div>`;
  h += `<div class="legend">${['auto', 'count', 'learn', 'guess', 'none'].map(s => `<span>${stChip(s)} ${STATUS[s].label}</span>`).join('')}</div>`;
  h += `<div><h3>Reaktionszeit pro Menge</h3><p class="p-note">Balken: typische Zeit (Median) bis zur richtigen Antwort, gemessen ab dem Erscheinen des Bildes. Linie: bis hierhin gilt eine Antwort als „blitzschnell“. Sie ist an das Grundtempo Ihres Kindes angepasst (${haveBase ? fmtS(b) + ' für 1–3 Dinge' : 'noch Standardwert 1,6 s'}).</p>${chartRT(prof)}</div>`;
  h += `<div><h3>Was die Zeiten zeigen</h3><p class="p-text">${interp}</p></div>`;
  h += `<div><h3>Häufige Verwechslungen</h3>${confs.length ? `<ul class="p-text" style="margin:0;padding-left:20px">${confs.map(c => `<li>${c.q} als ${c.a} getippt (${c.c}×)${Math.abs(c.q - c.a) === 1 ? ' – um eins daneben, typisch für einen Zählfehler' : ' – weit daneben, eher geraten oder Menge noch nicht sicher'}</li>`).join('')}</ul>` : '<p class="empty">Noch keine Fehler im Blitzblick.</p>'}</div>`;
  h += `<div><h3>Darstellungen</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Darstellung</th><th>Versuche</th><th>Richtig</th></tr></thead><tbody>${reps.map(r => `<tr><td>${REP_NAME[r.r]}${D.settings.reps[r.r] ? '' : ' (aus)'}</td><td>${r.n}</td><td>${r.acc === null ? '–' : `<span class="meter"><i style="width:${Math.round(r.acc * 100)}%"></i></span>${pct(r.acc)}`}</td></tr>`).join('')}</tbody></table></div></div>`;
  return h;
}
function recommendations() {
  const prof = profileNumbers(), slope = countingSlope(prof), out = [];
  const small = prof.filter(p => p.n <= 5 && p.tries >= 3), big = prof.filter(p => p.n > 5 && p.tries >= 3);
  const smallWeak = small.filter(p => p.status === 'learn' || p.status === 'guess');
  const autoShare = prof.filter(p => p.status === 'auto').length / prof.length;
  const recentDays = new Set(D.sessions.filter(s => now() - s.t < 7 * DAY).map(s => dayKey(s.t))).size;
  if (D.sessions.length && recentDays < 3) out.push({ color: 'var(--s1)', title: 'Lieber oft und kurz', text: 'Am wirksamsten sind kurze, regelmäßige Einheiten: etwa 10 Minuten an 4–5 Tagen pro Woche über mehrere Wochen. In Studien mit Lernspielen waren das typischerweise 6–12 Wochen.' });
  if (smallWeak.length) out.push({ color: 'var(--st-serious)', title: `Mengen bis 5 sicher machen (${smallWeak.map(p => p.n).join(', ')})`, text: 'Im Alltag kleine Mengen benennen, ohne zu zählen: „Wie viele Löffel liegen da?“ Würfelspiele helfen sehr, weil Würfelbilder feste Muster sind. Auch Fingerbilder zeigen: „Zeig mir drei Finger – ohne zu zählen.“' });
  if ((slope !== null && slope > 0.3) || big.some(p => p.status === 'count')) out.push({ color: 'var(--st-warn)', title: 'Vom Zählen zum Sehen', text: 'Ihr Kind zählt größere Mengen noch ab. Hilfreich: ein Eierkarton mit 10 Mulden oder ein Zehnerfeld auf Papier. Legen Sie z. B. 7 Steine (eine volle Reihe und 2) und decken Sie sie nach 2 Sekunden ab: „Wie viele waren es?“ Danach gemeinsam nachschauen. Fingerbilder (eine ganze Hand = 5) üben dasselbe.' });
  if (prof.filter(p => p.status === 'guess').length >= 2) out.push({ color: 'var(--st-crit)', title: 'Ruhig hinschauen statt raten', text: 'Ihr Kind tippt manchmal sehr schnell und daneben. Loben Sie genaues Hinschauen („Du hast genau geguckt!“) statt Schnelligkeit. Das Spiel sperrt die Tasten nach schnellem Raten kurz, damit erst geschaut wird.' });
  const cmp = taskSummary('compare'); if (cmp.acc !== null && cmp.acc < 0.75) out.push({ color: 'var(--st-warn)', title: 'Vergleichen üben', text: 'Mit Zahlenkarten 1–10 „Wer hat mehr?“ spielen (jeder deckt eine Karte auf, die größere gewinnt). Beim Tischdecken fragen: „Wo liegen mehr Gabeln?“' });
  const ln = taskSummary('line'); if (ln.acc !== null && ln.acc < 0.75) out.push({ color: 'var(--st-warn)', title: 'Zahlenweg spielen', text: 'Ein einfaches Brettspiel mit einem geraden Weg von 1 bis 10, bei dem man beim Ziehen laut mitzählt („sechs, sieben“). In Studien von Siegler und Ramani reichten vier Spielrunden von 15–20 Minuten für messbare Fortschritte beim Zahlenverständnis.' });
  if (D.settings.stage === 1 && autoShare >= 0.6) out.push({ color: 'var(--st-good)', title: 'Bereit für Lernstufe 2', text: 'Die meisten Mengen werden schon blitzschnell erkannt. In den Einstellungen können Sie Lernstufe 2 einschalten: Dann kommen zwei Farben im Zehnerfeld, Würfelpaare und das Zerlegen („Wie viele fehlen bis 10?“) dazu.' });
  out.push({ color: 'var(--s2)', title: 'Anstrengung loben, nicht Begabung', text: 'Sätze wie „Du hast genau hingeschaut“ oder „Du hast die volle Reihe gesehen“ wirken langfristig besser als „Du bist schlau“. Und bitte keinen Zeitdruck aufbauen: Schon in Klasse 1 kann Mathe-Angst entstehen, und sie blockiert das Arbeitsgedächtnis.' });
  return out;
}
function tabResearch() {
  return `<div><h3>So arbeitet die Lern-Steuerung</h3>
  <ol class="find">
    <li><b>Jede Antwort wird nach Richtigkeit und Zeit eingeordnet.</b><p>Blitzschnell richtig (Menge erkannt), richtig, richtig aber langsam (wahrscheinlich gezählt), zu schnell geraten, falsch oder „Weiß nicht“. Die Zeit wird ab dem Erscheinen des Bildes gemessen, Ihrem Kind aber nie als Countdown gezeigt.</p></li>
    <li><b>Die Grenzen passen sich Ihrem Kind an.</b><p>Als Grundtempo gilt, wie schnell es 1–3 Dinge erkennt (das gelingt Sechsjährigen meist auf einen Blick). Größere Mengen bekommen etwas mehr Zeit. Wer deutlich länger braucht, hat vermutlich gezählt.</p></li>
    <li><b>Schwierigkeit wie beim niederländischen „Rekentuin“.</b><p>Ein Elo-Verfahren schätzt für jede Aufgabe, wie wahrscheinlich Ihr Kind sie löst, und wählt Aufgaben, die meist gelingen (Ziel ca. 80–85 %). Langsame, gezählte Treffer zählen nur teilweise. So bleibt das Spiel bei einer Menge, bis sie ohne Zählen sitzt.</p></li>
    <li><b>Die Zeigezeit wächst mit.</b><p>Am Anfang bleibt das Bild 4 Sekunden stehen. Erst nach drei blitzschnellen Treffern in Folge wird es bei dieser Menge kürzer gezeigt, nach einem Fehler wieder länger. So wird das Abzählen nach und nach überflüssig.</p></li>
    <li><b>Fehler werden erklärt, nicht bestraft.</b><p>In Lernstufe 1 leuchten die Dinge nacheinander auf und die Menge wird benannt („… sechs, sieben. Das sind sieben.“). In Lernstufe 2 wird die Struktur gezeigt („5 und 2 sind 7“). Die Menge kommt zwei Aufgaben später noch einmal.</p></li>
    <li><b>Schutz vor Frust.</b><p>Nach zwei Fehlern in Folge kommen leichtere Aufgaben. Bei häufigem Raten sind die Tasten kurz gesperrt. Jede Runde endet mit einer lösbaren Aufgabe.</p></li>
  </ol></div>
  <div><h3>Zwei Lernstufen</h3><p class="p-text"><b>Stufe 1 – Mengen erfassen:</b> nur eine Farbe und eine Sorte (z. B. nur Äpfel, nur rote Plättchen), echte Würfelbilder bis 6, ungeordnete Punkte nur bis 5. Hier geht es um die Grundfähigkeit, eine Menge als Ganzes zu sehen und mit der Zahl zu verbinden.</p><p class="p-text" style="margin-top:8px"><b>Stufe 2 – Strukturen und Zerlegen:</b> rote und blaue Plättchen (Kraft der 5), Würfelpaare mit verschiedenen Zerlegungen (6+1, 4+3 …), Punktgruppen und das Spiel „Wie viele fehlen?“. Das ist schon der Übergang zum Rechnen und sollte erst kommen, wenn Stufe 1 sitzt.</p></div>
  <div><h3>Was Studien zeigen</h3>
  <ol class="find">
    <li><b>Mengen mit Zahlen verknüpfen wirkt nachhaltig.</b><p>Erstklässler mit Risiko für Rechenschwierigkeiten erhielten 12 Sitzungen des Programms „Mengen, zählen, Zahlen“. Die Wirkung auf die Schulleistung zeigte sich nach 6 Monaten und hielt nach 15 Monaten noch an (d = 0,32 bis 1,12).</p><span class="src">Ennemoser, Sinner, Nguyen &amp; Krajewski (2024), Frontiers in Psychology. <a href="https://doi.org/10.3389/fpsyg.2024.1380036" target="_blank" rel="noopener">Studie</a></span></li>
    <li><b>Strukturen sehen sagt spätere Rechenleistung voraus.</b><p>Wie gut Kinder zu Schulbeginn Strukturen in Mengen erkennen, sagt ihre Rechenleistung am Ende von Klasse 2 vorher.</p><span class="src">Lüken (2012), Young children’s structure sense. <a href="https://pub.uni-bielefeld.de/record/2902263" target="_blank" rel="noopener">Eintrag</a></span></li>
    <li><b>Kurzes Computertraining mit Punktmustern hilft Erstklässlern.</b><p>147 Erstklässler übten am Computer entweder geordnete Punktmuster genau zu erfassen oder Mengen zu schätzen. Beide Gruppen verbesserten sich im Geübten und im Rechnen.</p><span class="src">Obersteiner, Reiss &amp; Ufer (2013), Learning and Instruction 23, 125–135.</span></li>
    <li><b>Lineare Zahlen-Brettspiele.</b><p>Vier Runden à 15–20 Minuten mit einem geraden Zahlenweg von 1 bis 10 verbesserten Zahlenstrahl-Schätzen, Größenvergleich, Zählen und Ziffernkenntnis.</p><span class="src">Siegler &amp; Ramani (2008, 2009). <a href="https://www.cmu.edu/dietrich/psychology/cs/research-teaching/docs/SieglerBoardGamesCDPerp2009.pdf" target="_blank" rel="noopener">Überblick (PDF)</a></span></li>
    <li><b>Zahlen vergleichen ist ein Kernbaustein.</b><p>Eine Metaanalyse mit über 17.000 Personen fand: Wer Ziffern schnell vergleichen kann, rechnet besser (r = .30), stärker als beim Vergleich von Punktmengen (r = .24).</p><span class="src">Schneider et al. (2017), Developmental Science. <a href="https://www.uni-trier.de/fileadmin/fb1/prof/PSY/PAE/Team/Schneider/SchneiderEtAl2017.pdf" target="_blank" rel="noopener">PDF</a></span></li>
    <li><b>Fingerbilder unterstützen das Zahlverständnis.</b><p>Ein Training der Fingerwahrnehmung verbesserte bei jungen Kindern Zählen, Ordnen und das Erfassen kleiner Mengen.</p><span class="src">Gracia-Bafalluy &amp; Noël (2008), Cortex.</span></li>
    <li><b>Adaptives Üben mit Antwortzeit.</b><p>Das niederländische Rekentuin (Math Garden) nutzt Antwortzeit und Richtigkeit gleichzeitig, um Fähigkeit und Aufgabenschwierigkeit laufend zu schätzen. Das Schweizer Programm Calcularis passte sich Kindern mit Rechenschwierigkeiten an und verbesserte die Zahlvorstellung (20 Min. täglich, 5 Tage pro Woche, 6–12 Wochen).</p><span class="src">Klinkenberg, Straatemeier &amp; van der Maas (2011), <a href="https://doi.org/10.1016/j.compedu.2011.02.003" target="_blank" rel="noopener">Computers &amp; Education</a>; Käser et al. (2013), <a href="https://doi.org/10.3389/fpsyg.2013.00489" target="_blank" rel="noopener">Frontiers in Psychology</a></span></li>
    <li><b>Die richtige Schwierigkeit.</b><p>Modellrechnungen zeigen: Am schnellsten wird gelernt, wenn etwa 85 % der Aufgaben gelingen.</p><span class="src">Wilson, Shenhav, Straccia &amp; Cohen (2019), <a href="https://doi.org/10.1038/s41467-019-12552-4" target="_blank" rel="noopener">Nature Communications</a></span></li>
    <li><b>Digitale Förderung wirkt, aber kein Wundermittel.</b><p>Eine Metaanalyse von 15 kontrollierten Studien fand einen mittleren Effekt (0,55). Spiele waren nicht besser als gut gemachtes Üben. Ergänzen Sie deshalb mit echten Materialien.</p><span class="src">Benavides-Varela et al. (2020), Computers &amp; Education. <a href="https://research.unipd.it/handle/11577/3345422" target="_blank" rel="noopener">Eintrag</a></span></li>
    <li><b>Kein Zeitdruck.</b><p>Mathe-Angst zeigt sich schon in Klasse 1 und 2 und belastet das Arbeitsgedächtnis. Deshalb zeigt das Spiel keinen Countdown und kein „Zeit vorbei“.</p><span class="src">Ramirez, Gunderson, Levine &amp; Beilock (2013). <a href="https://news.uchicago.edu/story/math-anxiety-causes-trouble-students-early-first-grade" target="_blank" rel="noopener">Bericht</a></span></li>
  </ol></div>
  <details class="p-details"><summary>Wann sollte man genauer hinschauen?</summary><p class="p-text" style="margin-top:8px">Viele Kinder brauchen zu Schulbeginn einfach Zeit. Wenn aber nach 6–8 Wochen regelmäßigen Übens kaum Fortschritte zu sehen sind, oder wenn Ihr Kind auch Mengen bis 3 oft nicht sicher erkennt, sprechen Sie mit der Lehrkraft. Eine Abklärung (z. B. über den schulpsychologischen Dienst oder die Kinderärztin bzw. den Kinderarzt) kann klären, ob eine Rechenschwäche vorliegt. Dieses Spiel ersetzt keine Diagnose.</p></details>`;
}
function tabSettings() {
  const s = D.settings;
  const seg = (name, opts, cur) => `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${String(String(cur) === String(v))}">${l}</button>`).join('')}</div>`;
  return `<form class="form" id="set-form">
    <div class="field"><label for="set-name">Name des Kindes (wird manchmal vorgelesen)</label><input type="text" id="set-name" maxlength="20" value="${esc(D.name)}" autocomplete="off"></div>
    <div class="field"><span class="lbl">Lernstufe</span>${seg('stage', [[1, '1 · Mengen erfassen'], [2, '2 · Strukturen &amp; Zerlegen']], s.stage)}<small>Stufe 1: eine Farbe, eine Sorte, keine Zerlegungen. Stufe 2: Kraft der 5 in zwei Farben, Würfelpaare, „Wie viele fehlen?“.</small></div>
    <div class="field"><span class="lbl">Zahlenraum</span>${seg('max', [[5, 'bis 5'], [10, 'bis 10']], s.max)}</div>
    <div class="field"><span class="lbl">Aufgaben pro Runde</span>${seg('len', [[9, '9'], [12, '12'], [15, '15']], s.len)}</div>
    <div class="field"><span class="lbl">Wie oft soll es klappen?</span>${seg('target', [[0.9, 'Sehr oft (leicht)'], [0.8, 'Meistens (empfohlen)'], [0.7, 'Öfter knifflig']], s.target)}</div>
    <div class="field"><span class="lbl">Zeigezeit im Blitzblick</span>${seg('expoMode', [['auto', 'Wächst mit (empfohlen)'], ['fixed', 'Feste Zeit']], s.expoMode)}
      <div id="fixed-wrap" ${s.expoMode === 'fixed' ? '' : 'hidden'}><label for="set-expo">Feste Zeigezeit: <b id="expo-val">${fmtS(s.expoFixed)}</b></label><br><input type="range" id="set-expo" min="1" max="6" step="0.5" value="${s.expoFixed}"></div>
      <small>Automatisch: Start bei 4 Sekunden; kürzer erst nach drei blitzschnellen Treffern in Folge, bei Fehlern wieder länger.</small></div>
    <div class="field"><span class="lbl">Neu einstufen</span>${seg('profile', [['pre', 'Vorschule (5 s)'], ['school', 'Schulanfang (4 s)'], ['fit', 'Schon sicher (3,2 s)']], D.startProfile)}<small>Setzt Schwierigkeit und Zeigezeiten auf einen neuen Startwert. Die bisherigen Ergebnisse bleiben erhalten.</small></div>
    <div class="field"><span class="lbl">Ton und Anzeige</span>
      <label class="toggle"><input type="checkbox" id="set-sound" ${s.sound ? 'checked' : ''}> Töne</label>
      <label class="toggle"><input type="checkbox" id="set-speech" ${s.speech ? 'checked' : ''}> Sprachausgabe (liest Aufgaben vor)</label>
      <label class="toggle"><input type="checkbox" id="set-timer" ${s.timer ? 'checked' : ''}> Balken zeigen, wie lange das Bild noch zu sehen ist</label>
      ${Speech.ok ? '<div><button type="button" class="ghost-btn" id="set-voice">Stimme testen</button></div>' : '<small>Dieser Browser kann nicht vorlesen.</small>'}
    </div>
    <div class="field"><span class="lbl">Spiele</span><div class="checks">${TASKS.map(k => `<label><input type="checkbox" data-task="${k}" ${s.tasks[k] ? 'checked' : ''}> ${GAME[k].name}${!D.unlocked[k] ? ' (ab ' + UNLOCK[k] + ' Sternen)' : ''}${k === 'partner' ? ' – nur Stufe 2' : ''}</label>`).join('')}</div>
      <div><button type="button" class="ghost-btn" id="set-unlock">Alle Spiele sofort freischalten</button></div></div>
    <div class="field"><span class="lbl">Darstellungen im Blitzblick</span><div class="checks">${REPS.map(r => `<label><input type="checkbox" data-rep="${r}" ${s.reps[r] ? 'checked' : ''}> ${REP_NAME[r]}</label>`).join('')}</div><small>Mindestens eine bleibt immer an.</small></div>
    <div class="field"><span class="lbl">Daten</span><p class="p-note">Alles wird nur auf diesem Gerät im Browser gespeichert.</p><div><button type="button" class="ghost-btn danger" id="set-reset">Alle Daten löschen</button></div></div>
  </form>`;
}
function bindSettings() {
  const f = $('#set-form'), s = D.settings;
  f.addEventListener('submit', e => e.preventDefault());
  f.querySelectorAll('.seg').forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const name = g.dataset.seg, v = b.dataset.v;
    if (name === 'profile') {
      D.startProfile = v;
      TASKS.forEach(k => { D.theta[k] = START_THETA[v]; });
      Object.values(D.ladder).forEach(L => { L.lv = START_LEVEL[v]; L.st = 0; });
    } else if (name === 'expoMode') { s.expoMode = v; $('#fixed-wrap').hidden = v !== 'fixed'; }
    else s[name] = Number(v);
    g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    save();
  }));
  $('#set-name').addEventListener('input', e => { D.name = e.target.value.trim().slice(0, 20); save(); });
  const ex = $('#set-expo'); if (ex) ex.addEventListener('input', e => { s.expoFixed = Number(e.target.value); $('#expo-val').textContent = fmtS(s.expoFixed); save(); });
  $('#set-sound').addEventListener('change', e => { s.sound = e.target.checked; save(); });
  $('#set-speech').addEventListener('change', e => { s.speech = e.target.checked; save(); });
  $('#set-timer').addEventListener('change', e => { s.timer = e.target.checked; save(); });
  const v = $('#set-voice'); if (v) v.addEventListener('click', () => Speech.say(`Hallo${D.name ? ' ' + D.name : ''}! Wie viele sind es?`));
  f.querySelectorAll('[data-task]').forEach(c => c.addEventListener('change', () => { s.tasks[c.dataset.task] = c.checked; if (!TASKS.some(k => s.tasks[k])) { s.tasks.blitz = true; f.querySelector('[data-task="blitz"]').checked = true; } save(); }));
  f.querySelectorAll('[data-rep]').forEach(c => c.addEventListener('change', () => { s.reps[c.dataset.rep] = c.checked; if (!REPS.some(r => s.reps[r])) { s.reps.tenframe = true; f.querySelector('[data-rep="tenframe"]').checked = true; } save(); }));
  $('#set-unlock').addEventListener('click', () => { TASKS.forEach(k => { D.unlocked[k] = true; }); save(); renderTab('settings'); });
  const r = $('#set-reset');
  r.addEventListener('click', () => {
    if (r.dataset.armed) { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* egal */ } D = freshData(); save(); S = null; T = null; renderTab('settings'); return; }
    r.dataset.armed = '1'; r.textContent = 'Wirklich alles löschen? Nochmal tippen';
    setTimeout(() => { if (r.isConnected) { delete r.dataset.armed; r.textContent = 'Alle Daten löschen'; } }, 4000);
  });
}

/* Tooltip für Diagramme und Tagesleiste */
const tip = $('#tip');
function showTip(target, x, y) { tip.textContent = target.dataset.tip; tip.hidden = false; const w = tip.offsetWidth, h = tip.offsetHeight; tip.style.left = clamp(x - w / 2, 8, window.innerWidth - w - 8) + 'px'; tip.style.top = Math.max(8, y - h - 12) + 'px'; }
$('#parent').addEventListener('pointermove', e => { const t = e.target.closest('[data-tip]'); if (t) showTip(t, e.clientX, e.clientY); else tip.hidden = true; });
$('#parent').addEventListener('pointerleave', () => { tip.hidden = true; });
$('#parent').addEventListener('focusin', e => { const t = e.target.closest('[data-tip]'); if (t) { const r = t.getBoundingClientRect(); showTip(t, r.left + r.width / 2, r.top); } });
$('#parent').addEventListener('focusout', () => { tip.hidden = true; });

/* =========================================================
   Start
   ========================================================= */
Speech.init();
buildKeypad();
setStars();
setBubble('Hallo!');
el.stage.innerHTML = `<svg class="pic" viewBox="0 0 400 280" role="img" aria-label="Zehnerfeld">${svgTenframe(0, D.settings.max, false).svg}</svg>`;
showHome();
document.addEventListener('pointerdown', () => Sound.init(), { once: true });

// Schnittstelle für Tests und Neugierige (z. B. in der Browser-Konsole)
window.BlitzMengen = {
  get data() { return D; }, get trial() { return T; }, get session() { return S; },
  bank, pCorrect, classify, thresholds, baseline, exposureFor, profileNumbers, countingSlope,
  engine: { chooseItem, makeTrial, updateModel, updateLadder, setSession: v => { S = v; } },
};
})();
</script>
</body>
</html>
