import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { useResearch, enroll, withdraw, exportMyData, logTrial, markWaveDone, trialMetrics, setFieldScale } from "./research.js";

// ─── CSS animations injected once ────────────────────────────────────────────
const STYLE = `
@keyframes unicornRun  { 0%{transform:scaleX(-1) translateY(0)} 50%{transform:scaleX(-1) translateY(-18px)} 100%{transform:scaleX(-1) translateY(0)} }
@keyframes sparkle     { 0%,100%{opacity:0;transform:scale(0) rotate(0deg)} 50%{opacity:1;transform:scale(1) rotate(180deg)} }
@keyframes fallStar    { from{transform:translateY(0) rotate(0deg);opacity:1} to{transform:translateY(100vh) rotate(720deg);opacity:0} }
@keyframes popIn       { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
@keyframes wiggle      { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }
@keyframes floatUp     { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-60px);opacity:0} }
@keyframes rainbowShift{ 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }
@keyframes glowPulse   { 0%,100%{box-shadow:0 0 12px #fbbf24aa} 50%{box-shadow:0 0 28px #fbbf24ff} }
@keyframes slideUp     { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes shake       { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
`;
if (typeof document !== "undefined" && !document.getElementById("slk-style")) {
  const s = document.createElement("style"); s.id = "slk-style"; s.textContent = STYLE;
  document.head.appendChild(s);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRICHDATEN — Deutsche Druckschrift (Grundschule)
// ═══════════════════════════════════════════════════════════════════════════════
// Koordinaten: x 0–100, y 0–130; sie werden auf das Schreibfeld gestreckt.
// Vierliniensystem wie im Schulheft:
//   Oberlinie  — Großbuchstaben, Ziffern und Oberlängen (b d f h k l t) reichen bis hier
//   Mittellinie — Kleinbuchstaben („Erdgeschoss") beginnen hier
//   Grundlinie — auf ihr steht jeder Buchstabe
//   Unterlinie — Unterlängen (g j p q y) reichen bis hier („Keller")
// LINES sind die Linien auf dem Schreibfeld. Über der Oberlinie bleibt Platz für
// die Umlaut-Punkte der Großbuchstaben (Ä Ö Ü).
const LINES={top:22, mid:55, base:88, bottom:121};
// Die Buchstaben selbst sind in einem Entwurfsraster gezeichnet (Bänder je 36).
// S() verkleinert sie gleichmäßig auf das Schreibfeld, damit Kreise rund bleiben.
const OL=14, ML=50, GL=86, UL=122;
const FIT=(LINES.base-LINES.top)/(GL-OL);
// Das Schreibfeld ist 260×310 px groß, eine x-Einheit ist also etwas breiter als
// eine y-Einheit. AX rechnet Bogen-Radien so um, dass Kreise wirklich rund werden.
const AX=(310/130)/(260/100);

// Bausteine für einen Strich:
//   [x,y]                         — Gerade zu diesem Punkt (bzw. Startpunkt)
//   arc(cx,cy,rx,ry,von,bis)       — Bogen um (cx,cy); Radien in y-Einheiten,
//                                    Winkel in Grad: 0 = rechts, 90 = unten.
//                                    Abnehmender Winkel = gegen den Uhrzeigersinn.
//   curve(x1,y1,x2,y2,x,y)         — Bézierkurve vom letzten Punkt aus
const arc=(cx,cy,rx,ry,from,to)=>({arc:[cx,cy,rx,ry,from,to]});
const curve=(x1,y1,x2,y2,x,y)=>({curve:[x1,y1,x2,y2,x,y]});
function S(...parts){
  const pts=[];
  const add=(x,y)=>{const l=pts[pts.length-1];if(!l||Math.hypot(l[0]-x,l[1]-y)>0.05)pts.push([+x.toFixed(2),+y.toFixed(2)]);};
  for(const p of parts){
    if(Array.isArray(p)){add(p[0],p[1]);continue;}
    if(p.arc){
      const[cx,cy,rx,ry,a0,a1]=p.arc;const n=Math.max(2,Math.ceil(Math.abs(a1-a0)/4));
      for(let i=0;i<=n;i++){const a=(a0+(a1-a0)*i/n)*Math.PI/180;add(cx+rx*AX*Math.cos(a),cy+ry*Math.sin(a));}
    } else if(p.curve){
      const[x1,y1,x2,y2,x,y]=p.curve;const[x0,y0]=pts[pts.length-1];
      for(let i=1;i<=24;i++){const t=i/24,u=1-t;
        add(u*u*u*x0+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x, u*u*u*y0+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y);}
    }
  }
  return pts.map(([x,y])=>[+(50+(x-50)*FIT).toFixed(2),+(LINES.top+(y-OL)*FIT).toFixed(2)]);
}

const STROKES=(()=>{
  const R=18, RX=R*AX;                 // Kreis im Mittelband, Radius in y- und x-Einheiten
  const MID=(ML+GL)/2;                 // Mitte des Mittelbands
  const dot=(x,y=33)=>S([x,y-1.5],[x,y+1.5]);     // i-Punkt, Umlaut-Punkte
  const CAPDOT=-2.5;                   // Umlaut-Punkte der Großbuchstaben: deutlich über der Oberlinie
  // Kreis gegen den Uhrzeigersinn, beginnt oben rechts (a, d, g, q)
  const ring=(cx)=>S(arc(cx,MID,R,R,-35,-395));
  // Bauch im Uhrzeigersinn, beginnt am Strich (b, p)
  const belly=(x0)=>S(arc(x0+RX,MID,R,R,180,540));
  // Bogen für h, n, m, r: löst sich vom Strich, berührt die Mittellinie und geht
  // rechts senkrecht hinunter (end < 360 ergibt nur die „Schulter" des r)
  const arch=(x0,w,end=360)=>{
    const ry=17,c=Math.cos(Math.PI/12),rx=w/(1+c);
    const a=S(arc(x0+rx*c,ML+ry,rx/AX,ry,195,end));
    return end===360?[...a,[x0+w,GL]]:a;
  };

  const A_=[S([50,OL],[22,GL]),S([50,OL],[78,GL]),S([31,62],[69,62])];
  const O_=[S(arc(50,ML,36,36,-90,-450))];
  const U_=[S([24,OL],[24,58],arc(50,58,26/AX,28,180,0),[76,OL])];
  const a_=[ring(46),S([46+RX,ML],[46+RX,GL])];
  const o_=[S(arc(50,MID,R,R,-90,-450))];
  const u_=[S([30,ML],[30,MID],arc(30+RX,MID,R,R,180,0),[30+2*RX,ML]),S([30+2*RX,ML],[30+2*RX,GL])];

  return{
    // ── Großbuchstaben ───────────────────────────────────────────────────────
    A:A_,
    B:[S([24,OL],[24,GL]),
       S([24,OL],[40,OL],arc(40,32,19,18,-90,90),[24,ML]),
       S([24,ML],[43,ML],arc(43,68,22,18,-90,90),[24,GL])],
    C:[S(arc(53,ML,36,36,-40,-320))],
    D:[S([24,OL],[24,GL]),S([24,OL],[40,OL],arc(40,ML,36,36,-90,90),[24,GL])],
    E:[S([26,OL],[26,GL]),S([26,OL],[72,OL]),S([26,ML],[66,ML]),S([26,GL],[72,GL])],
    F:[S([26,OL],[26,GL]),S([26,OL],[72,OL]),S([26,ML],[66,ML])],
    G:[S(arc(52,ML,36,36,-40,-360),[60,ML])],
    H:[S([24,OL],[24,GL]),S([76,OL],[76,GL]),S([24,ML],[76,ML])],
    I:[S([50,OL],[50,GL])],
    J:[S([62,OL],[62,66],arc(62-18*AX,66,18,20,0,160))],
    K:[S([26,OL],[26,GL]),S([74,OL],[27,54],[76,GL])],
    L:[S([28,OL],[28,GL],[74,GL])],
    M:[S([20,OL],[20,GL]),S([20,OL],[50,62],[80,OL],[80,GL])],
    N:[S([24,OL],[24,GL]),S([24,OL],[76,GL],[76,OL])],
    O:O_,
    P:[S([24,OL],[24,GL]),S([24,OL],[42,OL],arc(42,32,20,18,-90,90),[24,ML])],
    Q:[...O_,S([60,68],[82,92])],
    R:[S([24,OL],[24,GL]),S([24,OL],[42,OL],arc(42,32,20,18,-90,90),[24,ML]),S([40,ML],[76,GL])],
    S:[S(arc(50,32,20,18,-25,-270),arc(50,68,22,18,-90,155))],
    T:[S([20,OL],[80,OL]),S([50,OL],[50,GL])],
    U:U_,
    V:[S([20,OL],[50,GL],[80,OL])],
    W:[S([12,OL],[31,GL],[50,OL],[69,GL],[88,OL])],
    X:[S([22,OL],[78,GL]),S([78,OL],[22,GL])],
    Y:[S([22,OL],[50,ML]),S([78,OL],[50,ML],[50,GL])],
    Z:[S([22,OL],[78,OL],[22,GL],[78,GL])],
    "Ä":[...A_,dot(40,CAPDOT),dot(60,CAPDOT)],
    "Ö":[...O_,dot(40,CAPDOT),dot(60,CAPDOT)],
    "Ü":[...U_,dot(38,CAPDOT),dot(62,CAPDOT)],

    // ── Kleinbuchstaben ──────────────────────────────────────────────────────
    a:a_,
    b:[S([30,OL],[30,GL]),belly(30)],
    c:[S(arc(52,MID,R,R,-40,-320))],
    d:[ring(50),S([50+RX,OL],[50+RX,GL])],          // erst der Bauch, dann der Strich
    e:[S([50-RX,MID],[50+RX,MID],arc(50,MID,R,R,0,-315))],
    f:[S(arc(44+15*AX,30,15,16,-25,-180),[44,GL]),S([30,ML],[62,ML])],
    g:[ring(46),S([46+RX,ML],[46+RX,104],arc(46,104,R,R,0,150))],
    h:[S([28,OL],[28,GL]),arch(28,32)],
    i:[S([50,ML],[50,GL]),dot(50)],
    j:[S([56,ML],[56,106],arc(56-16*AX,106,16,16,0,160)),dot(56)],
    k:[S([30,OL],[30,GL]),S([64,ML],[31,70],[66,GL])],
    l:[S([50,OL],[50,GL])],
    m:[S([18,ML],[18,GL]),arch(18,30),arch(48,30)],
    n:[S([30,ML],[30,GL]),arch(30,32)],
    o:o_,
    p:[S([30,ML],[30,UL]),belly(30)],
    q:[ring(50),S([50+RX,ML],[50+RX,UL])],
    r:[S([36,ML],[36,GL]),arch(36,30,318)],
    s:[S(arc(50,59,13,9,-25,-270),arc(50,77,14.5,9,-90,155))],
    t:[S([46,24],[46,74],arc(46+12*AX,74,12,12,180,60)),S([32,ML],[62,ML])],
    u:u_,
    v:[S([22,ML],[50,GL],[78,ML])],
    w:[S([12,ML],[31,GL],[50,ML],[69,GL],[88,ML])],
    x:[S([26,ML],[74,GL]),S([74,ML],[26,GL])],
    y:[S([22,ML],[50,GL]),S([78,ML],[22,UL])],
    z:[S([26,ML],[74,ML],[26,GL],[74,GL])],
    "ä":[...a_,dot(38),dot(56)],
    "ö":[...o_,dot(42),dot(58)],
    "ü":[...u_,dot(38),dot(56)],
    "ß":[S([26,GL],[26,30],arc(26+15*AX,30,15,16,180,360),
           curve(53.5,40,48,47,40,48),curve(60,48,68,56,68,66),curve(68,78,58,GL,46,GL),[38,GL])],

    // ── Ziffern ──────────────────────────────────────────────────────────────
    "0":[S(arc(50,ML,24,36,-90,-450))],
    "1":[S([34,34],[56,OL],[56,GL])],                           // ohne Fuß
    "2":[S(arc(50,32,22,18,200,400),[26,GL],[76,GL])],
    "3":[S(arc(48,32,20,18,210,470),arc(48,68,22,18,-110,150))],  // zwei runde Bäuche
    "4":[S([38,OL],[22,62],[80,62]),S([64,OL],[64,GL])],          // oben offen
    "5":[S([32,OL],[32,52],arc(46,66,21,20,224,500)),S([32,OL],[72,OL])], // Hut zuletzt
    "6":[S([68,20],curve(56,10,32,14,31.7,48),arc(50,66,20,20,180,-180))],
    "7":[S([22,OL],[78,OL],[40,GL]),S([46,ML],[72,ML])],
    "8":[S([50,OL],curve(41,OL,35,20,35,28),curve(35,38,44,44,50,49),curve(57,54,68,59,68,70),
           curve(68,80,60,GL,50,GL),curve(40,GL,32,80,32,70),curve(32,59,43,54,50,49),
           curve(56,44,65,38,65,28),curve(65,20,59,OL,50,OL))],
    "9":[S(arc(48,33,19,19,-20,-360),[48+19*AX,GL])],
  };
})();

// Vierliniensystem zeichnen (Mittelband leicht hinterlegt wie im Schulheft)
function drawLineatur(ctx,W,H,{alpha="30",width=1.5,dash=[4,4]}={}){
  ctx.save();
  ctx.fillStyle="#fde68a26";
  ctx.fillRect(0,H*LINES.mid/130,W,H*(LINES.base-LINES.mid)/130);
  ctx.lineWidth=width;ctx.setLineDash(dash);
  [[LINES.top,"#3b82f6"],[LINES.mid,"#3b82f6"],[LINES.base,"#ef4444"],[LINES.bottom,"#3b82f6"]].forEach(([y,c])=>{
    ctx.strokeStyle=c+alpha;
    ctx.beginPath();ctx.moveTo(0,H*y/130);ctx.lineTo(W,H*y/130);ctx.stroke();
  });
  ctx.restore();
}

// Buchstabe als kleines Bild aus denselben Strichdaten (Auswahlraster, Anzeige),
// damit dort dieselbe Schulschrift erscheint wie beim Schreiben (z. B. „a" statt Arial-„a").
function Glyph({letter,height=24,color="currentColor",weight=2.2,crop=true}){
  const strokes=STROKES[letter]||[];
  // Gleicher Ausschnitt für alle Zeichen (Umlaut-Punkte bis Unterlinie), damit Groß- und
  // Kleinbuchstaben in der richtigen Größe zueinander stehen
  const top=crop?3:0, bottom=crop?LINES.bottom+5:130;
  const w=height*(100/(bottom-top))/AX;
  return(
    <svg width={w} height={height} viewBox={`0 ${top} 100 ${bottom-top}`} preserveAspectRatio="none" style={{display:"block",overflow:"visible"}}>
      {strokes.map((s,i)=>(
        <polyline key={i} points={s.map(p=>p.join(",")).join(" ")} fill="none" stroke={color}
          strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANLAUT-BILDER, STICKERS, WORDS
// ═══════════════════════════════════════════════════════════════════════════════
// Anlaut-Bilder wie auf der Anlauttabelle in der Schule: Das Wort beginnt mit dem
// Laut des Buchstabens („M wie Maus"). Das verbindet Form, Laut und Bild.
// Drittes Feld: true = Buchstabe steht nicht am Wortanfang („ß wie in Fuß").
const ANLAUT={
  A:["🐒","Affe"],B:["🐻","Bär"],C:["🦎","Chamäleon"],D:["🐬","Delfin"],E:["🐘","Elefant"],
  F:["🦊","Fuchs"],G:["🦍","Gorilla"],H:["🐹","Hamster"],I:["🦔","Igel"],J:["🐆","Jaguar"],
  K:["🦘","Känguru"],L:["🦁","Löwe"],M:["🐭","Maus"],N:["🦏","Nashorn"],O:["🐙","Oktopus"],
  P:["🐧","Pinguin"],Q:["🦆","Quietscheente"],R:["🐛","Raupe"],S:["☀️","Sonne"],T:["🐯","Tiger"],
  U:["🦉","Uhu"],V:["🐦","Vogel"],W:["🐺","Wolf"],X:["🧙","Hexe",true],Y:["⛵","Yacht"],
  Z:["🦓","Zebra"],"Ä":["🐒","Äffchen"],"Ö":["🛢️","Öl"],"Ü":["🎁","Überraschung"],"ß":["🦶","Fuß",true],
};
const anlautOf=(l)=>ANLAUT[l]||ANLAUT[l.toUpperCase()]||null;
// Zahlenbilder: Dinge, die wie die Ziffer aussehen (2 = Schwan, 8 = Schneemann …)
const ANIMALS={"0":"🥚","1":"🕯️","2":"🦢","3":"🐪","4":"⛵","5":"🖐️","6":"🐌","7":"🦩","8":"⛄","9":"🎈"};
const mascotOf=(l)=>anlautOf(l)?.[0]||ANIMALS[l]||"🐾";

const STICKERS = {
  A:"🍎",B:"🦋",C:"🌸",D:"💎",E:"🌍",F:"🌺",G:"🌟",H:"🏠",I:"🌈",
  J:"💫",K:"👑",L:"🍀",M:"🌙",N:"🌊",O:"🍊",P:"🎀",Q:"👸",R:"🌹",
  S:"☀️",T:"🌴",U:"🦄",V:"🌿",W:"🌊",X:"✨",Y:"🌻",Z:"⚡",
  a:"🍎",b:"🦋",c:"🌸",d:"💧",e:"⭐",f:"🌺",g:"🍇",h:"🏡",i:"🌈",
  j:"💫",k:"🎪",l:"🍋",m:"🍄",n:"🌙",o:"🍭",p:"🦚",q:"💜",r:"🌹",
  s:"🌞",t:"🌴",u:"🦄",v:"🌿",w:"🌊",x:"✨",y:"🌻",z:"⚡",
  "Ä":"🦅","Ö":"🫧","Ü":"🦉","ä":"🦅","ö":"🫧","ü":"🦉","ß":"🍯",
  "6":"🎪","7":"🌈","8":"🎡","9":"🌙",
};
const WORDS=[
  {word:"BAD",letters:["B","A","D"],meaning:"Bad 🛁"},
  {word:"FEE",letters:["F","E"],meaning:"Fee 🧚"},
  {word:"GEL",letters:["G","E","L"],meaning:"Gel 💈"},
  {word:"CAFE",letters:["C","A","F","E"],meaning:"Café ☕"},
  {word:"AFFE",letters:["A","F","E"],meaning:"Affe 🐒"},
  {word:"GABE",letters:["G","A","B","E"],meaning:"Gabe 🎁"},
  {word:"HELD",letters:["H","E","L","D"],meaning:"Held 🦸"},
  {word:"IGEL",letters:["I","G","E","L"],meaning:"Igel 🦔"},
  {word:"EIS",letters:["E","I","S"],meaning:"Eis 🍦"},
  {word:"SEE",letters:["S","E"],meaning:"See 🌊"},
  {word:"SIE",letters:["S","I","E"],meaning:"sie 👩"},
  {word:"IST",letters:["I","S","T"],meaning:"ist ✓"},
  {word:"EIN",letters:["E","I","N"],meaning:"ein 1️⃣"},
  {word:"GUT",letters:["G","U","T"],meaning:"gut 👍"},
  {word:"JA",letters:["J","A"],meaning:"ja ✅"},
  {word:"ROT",letters:["R","O","T"],meaning:"rot 🔴"},
  {word:"UND",letters:["U","N","D"],meaning:"und &"},
  {word:"NEIN",letters:["N","E","I"],meaning:"nein ❌"},
  {word:"HAUS",letters:["H","A","U","S"],meaning:"Haus 🏠"},
  {word:"KIND",letters:["K","I","N","D"],meaning:"Kind 👶"},
  {word:"BAUM",letters:["B","A","U","M"],meaning:"Baum 🌳"},
  {word:"HUND",letters:["H","U","N","D"],meaning:"Hund 🐕"},
  {word:"BALL",letters:["B","A","L"],meaning:"Ball ⚽"},
  {word:"FISCH",letters:["F","I","S","C","H"],meaning:"Fisch 🐟"},
  {word:"STERN",letters:["S","T","E","R","N"],meaning:"Stern ⭐"},
  {word:"BLUME",letters:["B","L","U","M","E"],meaning:"Blume 🌸"},
  {word:"APFEL",letters:["A","P","F","E","L"],meaning:"Apfel 🍎"},
  {word:"BROT",letters:["B","R","O","T"],meaning:"Brot 🍞"},
  {word:"HERZ",letters:["H","E","R","Z"],meaning:"Herz ❤️"},
  {word:"TIGER",letters:["T","I","G","E","R"],meaning:"Tiger 🐯"},
  {word:"VOGEL",letters:["V","O","G","E","L"],meaning:"Vogel 🐦"},
  {word:"KATZE",letters:["K","A","T","Z","E"],meaning:"Katze 🐱"},
  {word:"WALD",letters:["W","A","L","D"],meaning:"Wald 🌲"},
  {word:"ZEBRA",letters:["Z","E","B","R","A"],meaning:"Zebra 🦓"},
];

const UPPERCASE="ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ".split("");
const LOWERCASE="abcdefghijklmnopqrstuvwxyzäöüß".split("");
const NUMBERS="0123456789".split("");

// Lernweg: Reihenfolge für „automatisch weiter". Buchstaben mit gleicher Bewegung
// stehen zusammen (Striche, Kreise, Bögen, Schrägen); leicht verwechselbare Paare
// wie b/d und p/q liegen weit auseinander.
const LEARN_PATH={
  "GROß":"LITEFHOCQGSDPBRUJVAWMNKXYZÄÖÜ".split(""),
  klein:"litcoadgqesnmhrubpvwxyzkfjäöüß".split(""),
  Zahlen:NUMBERS,
};
const tabOf=(l)=>UPPERCASE.includes(l)?"GROß":LOWERCASE.includes(l)?"klein":"Zahlen";

// Übungsmodi. Pro Buchstabe gibt es drei Lernstufen, bei denen die Hilfe Schritt
// für Schritt verschwindet: nachfahren → abschreiben → aus dem Kopf schreiben.
const MODES={
  guided:{label:"🖐️ Geführt",color:"#22c55e"},
  trace: {label:"✏️ Nachfahren",color:"#4361ee"},
  copy:  {label:"👀 Abschreiben",color:"#f97316"},
  memory:{label:"🧠 Aus dem Kopf",color:"#a855f7"},
};
const STAGE_MODE={1:"guided",2:"copy",3:"memory"};
const MODE_STAGE={guided:1,trace:1,copy:2,memory:3};
// Wartezeit beim Aus-dem-Kopf-Schreiben wächst mit jedem Erfolg (in Sekunden)
const MEMORY_DELAYS=[1,3,5];
const STAGE_NEXT_TEXT={2:"Nächstes Mal schreibst du ihn ab!",3:"Nächstes Mal schreibst du ihn aus dem Kopf!"};
// Ab wann ein Buchstabe zur Wiederholung vorgeschlagen wird (verteiltes Üben)
const REVIEW_AFTER_MS=20*60*60*1000;

const DIFFICULTY={
  easy:  {label:"Einfach 😊",ghostAlpha:0.38,ghostWidth:34,tolerance:24,dashLine:[8,6]},
  medium:{label:"Mittel 🎯", ghostAlpha:0.22,ghostWidth:22,tolerance:14,dashLine:[6,5]},
  hard:  {label:"Schwer 💪", ghostAlpha:0.12,ghostWidth:12,tolerance:8, dashLine:[4,4]},
};

// Farb-Paletten: normal vs. kontrastreich (bessere Sichtbarkeit)
const PALETTE={
  normal:{
    ghost:"99,102,241", ghostActive:0.0, dash:"#6366f1", dashActive:"cc",
    dot:"#fbbf24", dotInner:"white", dotLabel:"#92400e",
    arrow:"rgba(99,102,241,0.65)", ok:"#4ade80", bad:"#f87171",
  },
  high:{
    ghost:"30,41,59", ghostActive:0.0, dash:"#0f172a", dashActive:"ee",
    dot:"#f97316", dotInner:"white", dotLabel:"#431407",
    arrow:"rgba(15,23,42,0.85)", ok:"#15803d", bad:"#b91c1c",
  },
};
// Kontrastmodus verstärkt Deckkraft und Linienbreite der Vorlage
function applyContrast(diff,high){
  if(!high)return diff;
  return{...diff,
    ghostAlpha:Math.min(0.75,diff.ghostAlpha*2.2),
    ghostWidth:diff.ghostWidth*1.25,
    dashLine:diff.dashLine.map(v=>v*1.2),
  };
}

const PRAISE=["","Weiter üben! 💪","Fast! 👏","Gut! 🌟","Sehr gut! ⭐","Perfekt! 🏆"];

const KID_TIPS=[
  "🌟 Übe jeden Tag ein bisschen!",
  "💪 Fehler sind Helfer!",
  "🎯 Folge den Zahlen der Reihe nach.",
  "🌈 Atme tief durch, wenn es schwer wird.",
  "🐾 Dein Tier freut sich, wenn du übst!",
  "✨ Je öfter du übst, desto besser wirst du!",
];

const EDU_TIPS=[
  {icon:"🌟",title:"Richtig motivieren",text:"Loben Sie den Prozess, nicht das Ergebnis. 'Du hast dir wirklich Mühe gegeben!' statt 'Toll gemalt!'"},
  {icon:"⏰",title:"Pausen machen",text:"Kurze Pausen (5 Min. nach 15–20 Min. Übung) fördern die Konzentration deutlich."},
  {icon:"💪",title:"Fehlerkultur",text:"Zeigen Sie: Fehler sind Lernchancen. 'Schau, der Strich ist etwas daneben – versuch's nochmal!'"},
  {icon:"📅",title:"Lern-Rhythmus",text:"Täglich 10–15 Minuten üben ist effektiver als einmal pro Woche eine Stunde."},
  {icon:"👀",title:"Bereitschaft erkennen",text:"Wenn Ihr Kind unruhig oder frustriert wirkt, ist es Zeit für eine Pause oder einen anderen Tag."},
  {icon:"🧠",title:"Aus dem Kopf schreiben",text:"Nachfahren ist nur der Anfang. Am meisten lernen Kinder, wenn sie einen Buchstaben ansehen, abdecken und dann aus dem Gedächtnis schreiben. Die App führt Schritt für Schritt dorthin."},
  {icon:"➡️",title:"Richtung zählt",text:"Achten Sie auf Startpunkt und Schreibrichtung, nicht nur auf das Aussehen. Wer Buchstaben immer gleich schreibt, schreibt später flüssiger."},
  {icon:"🔁",title:"Wiederholen lohnt sich",text:"Ein Buchstabe sitzt besser, wenn er nach einem Tag noch einmal geübt wird. Die App schlägt dafür im Menü passende Buchstaben vor."},
];

// ═══════════════════════════════════════════════════════════════════════════════
// VORLESE-SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
const LETTER_NAMES={
  A:"A",B:"Be",C:"Ce",D:"De",E:"E",F:"Ef",G:"Ge",H:"Ha",I:"I",J:"Jot",
  K:"Ka",L:"El",M:"Em",N:"En",O:"O",P:"Pe",Q:"Ku",R:"Er",S:"Es",T:"Te",
  U:"U",V:"Fau",W:"We",X:"Ix",Y:"Üpsilon",Z:"Zet",
  a:"kleines a",b:"kleines be",c:"kleines ce",d:"kleines de",e:"kleines e",
  f:"kleines ef",g:"kleines ge",h:"kleines ha",i:"kleines i",j:"kleines jot",
  k:"kleines ka",l:"kleines el",m:"kleines em",n:"kleines en",o:"kleines o",
  p:"kleines pe",q:"kleines ku",r:"kleines er",s:"kleines es",t:"kleines te",
  u:"kleines u",v:"kleines fau",w:"kleines we",x:"kleines ix",y:"kleines üpsilon",z:"kleines zet",
  "0":"Null","1":"Eins","2":"Zwei","3":"Drei","4":"Vier",
  "5":"Fünf","6":"Sechs","7":"Sieben","8":"Acht","9":"Neun",
  "Ä":"A-Umlaut","Ö":"O-Umlaut","Ü":"U-Umlaut",
  "ä":"kleines a-Umlaut","ö":"kleines o-Umlaut","ü":"kleines u-Umlaut","ß":"Eszett",
};
let _voices=[];
if(typeof window!=="undefined"&&window.speechSynthesis){
  const _lv=()=>{_voices=window.speechSynthesis.getVoices();};
  _lv(); window.speechSynthesis.onvoiceschanged=_lv;
}
function speak(text,rate=0.85,pitch=1.1){
  if(typeof window==="undefined")return;
  // Emojis und nicht sprechbare Zeichen entfernen
  const clean=text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,"").replace(/[^\p{L}\p{N}\p{P}\s]/gu,"").trim();
  if(!clean)return;
  // 1) Native Sprachausgabe (Android) — zuverlässiger als speechSynthesis im WebView
  if(window.__native?.tts){
    window.__native.tts.speak(clean,rate,pitch).then(ok=>{
      if(!ok) webSpeak(clean,rate,pitch); // Fallback falls native fehlschlägt
    });
    return;
  }
  webSpeak(clean,rate,pitch);
}
function webSpeak(clean,rate,pitch){
  if(!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(clean);
  u.lang="de-DE";u.rate=rate;u.pitch=pitch;u.volume=1;
  const vv=_voices.length?_voices:window.speechSynthesis.getVoices();
  const de=vv.find(v=>v.lang==="de-DE")||vv.find(v=>v.lang.startsWith("de"))||vv[0];
  if(de)u.voice=de;
  setTimeout(()=>window.speechSynthesis.speak(u),50);
}
function useSpeech(enabled){
  const say=useCallback((t,r,p)=>{if(enabled)speak(t,r,p);},[enabled]);
  // Buchstabe mit Anlaut-Wort: „Em, wie Maus" — verknüpft Name, Laut und Bild
  const sayLetter=useCallback((l)=>{
    if(!enabled)return;
    const a=anlautOf(l),name=LETTER_NAMES[l]||l;
    speak(a?`${name}, wie ${a[2]?"in ":""}${a[1]}`:name,0.85,1.2);
  },[enabled]);
  const sayIt=useCallback((t)=>{if(enabled)speak(t,0.85,1.1);},[enabled]);
  return{say,sayLetter,sayIt};
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAPTIK  — nutzt native Capacitor-Haptics wenn vorhanden, sonst Web Vibration
// ═══════════════════════════════════════════════════════════════════════════════
const HAPTIC_PATTERNS={
  tick:      12,   // Strich beendet
  off:       [0,8,40,8], // Linie verlassen (doppelter kurzer Impuls)
  success:   [0,18,60,18,60,40], // Buchstabe fertig
  celebrate: [0,30,50,30,50,30,50,80], // 5 Sterne
};
let _lastHaptic=0;
function haptic(kind="tick",enabled=true){
  if(!enabled)return;
  const now=Date.now();
  // Throttle: max. alle 120ms ein Impuls, sonst wird es unangenehm
  if(kind==="off"&&now-_lastHaptic<400)return;
  if(now-_lastHaptic<80)return;
  _lastHaptic=now;
  const pattern=HAPTIC_PATTERNS[kind]||HAPTIC_PATTERNS.tick;
  // 1) Native (Capacitor Haptics)
  const nh=typeof window!=="undefined"&&window.__native?.haptics;
  if(nh){
    if(kind==="celebrate"||kind==="success") nh.success();
    else if(kind==="off") nh.impact("light");
    else nh.impact("light");
    return;
  }
  // 2) Web Vibration API
  try{ if(navigator?.vibrate) navigator.vibrate(pattern); }catch{}
}

// ═══════════════════════════════════════════════════════════════════════════════
// BELOHNUNGS-ILLUSTRATIONEN  (Emoji-Style, PNG-ready für spätere Erweiterung)
// ═══════════════════════════════════════════════════════════════════════════════
const IlluUnicorn  = () => <div style={{fontSize:72,textAlign:"center",lineHeight:1}}>🦄</div>;
const IlluGlitter  = () => <div style={{fontSize:72,textAlign:"center",lineHeight:1}}>✨</div>;
const IlluRainbow  = () => <div style={{fontSize:72,textAlign:"center",lineHeight:1}}>🌈</div>;
const IlluStars    = () => <div style={{fontSize:72,textAlign:"center",lineHeight:1}}>🌟</div>;
const HeroKid      = () => <div style={{fontSize:80,textAlign:"center",lineHeight:1}}>✏️</div>;

// ═══════════════════════════════════════════════════════════════════════════════
// REWARD SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
const REWARDS = {
  glitter:  {name:"Glitzerstift ✨", desc:"Dein Stift zaubert goldene Glitzer-Spuren!", color:"#fbbf24", Illu:IlluGlitter},
  unicorn:  {name:"Einhorn 🦄",      desc:"Ein Einhorn springt über den Bildschirm!", color:"#c084fc", Illu:IlluUnicorn},
  rainbow:  {name:"Regenbogen 🌈",   desc:"Deine Linien werden bunt wie ein Regenbogen!", color:"#60a5fa", Illu:IlluRainbow},
  stardust: {name:"Sternenregen 🌟", desc:"Sterne tanzen um deine Buchstaben!", color:"#f87171", Illu:IlluStars},
};


function RewardModal({onEarn, onClose, hapticsEnabled=true}){
  const [phase,setPhase]=useState("offer"); // offer|opening|earned
  const [frame,setFrame]=useState(0);
  const [reward,setReward]=useState(null);
  const timerRef=useRef(null);

  // Schatzkiste öffnen — kurze Animation, keine Wartezeit-Mechanik
  const openChest=()=>{
    haptic("tick",hapticsEnabled);
    setPhase("opening");
    let f=0;
    timerRef.current=setInterval(()=>{
      f++;setFrame(f);
      if(f>=6){
        clearInterval(timerRef.current);
        const keys=Object.keys(REWARDS);
        const chosen=keys[Math.floor(Math.random()*keys.length)];
        setReward(chosen);
        haptic("celebrate",hapticsEnabled);
        setPhase("earned");
      }
    },160);
  };

  useEffect(()=>()=>clearInterval(timerRef.current),[]);

  const overlay={position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,backdropFilter:"blur(6px)",padding:16};
  const box={background:"white",borderRadius:28,padding:24,maxWidth:360,width:"100%",textAlign:"center",position:"relative",animation:"popIn 0.4s ease",boxShadow:"0 30px 80px #0004"};

  if(phase==="offer") return(
    <div style={overlay}>
      <div style={box}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
        <div style={{fontSize:48,marginBottom:8}}>🎁</div>
        <h3 style={{margin:"0 0 6px",fontSize:20,fontWeight:900,color:"#4361ee",fontFamily:"Arial,sans-serif"}}>Möchtest du eine Überraschung?</h3>
        <p style={{fontSize:13,color:"#64748b",margin:"0 0 16px",lineHeight:1.5}}>In der Schatzkiste wartet eine magische Belohnung für deine nächste Übung!</p>
        <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:18}}>
          {Object.entries(REWARDS).map(([k,r])=>(
            <div key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:26}}>{k==="glitter"?"✨":k==="unicorn"?"🦄":k==="rainbow"?"🌈":"🌟"}</span>
              <span style={{fontSize:10,color:"#6b7280",fontWeight:600}}>{r.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>
        <button onClick={openChest} style={{width:"100%",padding:14,background:"linear-gradient(135deg,#fb923c,#f97316)",color:"white",border:"none",borderRadius:18,fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"Arial,sans-serif",marginBottom:8}}>
          🎁 Schatzkiste öffnen!
        </button>
        <button onClick={onClose} style={{width:"100%",padding:14,background:"white",border:"2px solid #e2e8f0",borderRadius:18,fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"Arial,sans-serif",color:"#64748b"}}>
          Nein danke
        </button>
      </div>
    </div>
  );

  if(phase==="opening") return(
    <div style={overlay}>
      <div style={{...box,background:"#1e1b4b",color:"white"}}>
        <div style={{fontSize:80,marginBottom:8,lineHeight:1,
          transform:`scale(${1+frame*0.06}) rotate(${frame%2?-6:6}deg)`,transition:"transform 0.15s"}}>
          {frame<5?"🎁":"📦"}
        </div>
        <h3 style={{margin:"8px 0 0",fontSize:18,fontWeight:800,color:"white",fontFamily:"Arial,sans-serif"}}>
          {"✨".repeat(Math.min(frame,5))}
        </h3>
      </div>
    </div>
  );

  if(phase==="earned"&&reward){
    const r=REWARDS[reward];
    const Illu=r.Illu;
    return(
      <div style={overlay}>
        <div style={box}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><Illu size={100}/></div>
          <h3 style={{margin:"0 0 6px",fontSize:20,fontWeight:900,color:"#4361ee",fontFamily:"Arial,sans-serif"}}>Herzlichen Glückwunsch! 🎉</h3>
          <div style={{background:`${r.color}22`,border:`2px solid ${r.color}`,borderRadius:18,padding:14,marginBottom:16}}>
            <div style={{fontWeight:900,fontSize:17,color:"#374151"}}>{r.name}</div>
            <div style={{fontSize:13,color:"#6b7280",marginTop:4}}>{r.desc}</div>
          </div>
          <button onClick={()=>{onEarn(reward);onClose();}}
            style={{width:"100%",padding:14,background:`linear-gradient(135deg,${r.color},${r.color}cc)`,color:"white",border:"none",borderRadius:18,fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>
            ✨ Jetzt verwenden!
          </button>
        </div>
      </div>
    );
  }
  return null;
}

// ── Unicorn running across screen ─────────────────────────────────────────────
function UnicornRun({onDone}){
  const [x,setX]=useState(-140);
  useEffect(()=>{
    let pos=-140;
    const iv=setInterval(()=>{
      pos+=7; setX(pos);
      if(pos>window.innerWidth+140){ clearInterval(iv); onDone(); }
    },16);
    return()=>clearInterval(iv);
  },[]);
  return(
    <div style={{position:"fixed",bottom:80,left:x,zIndex:3000,pointerEvents:"none",animation:"unicornRun 0.5s infinite"}}>
      <IlluUnicorn size={110}/>
    </div>
  );
}

// ── Falling stars ─────────────────────────────────────────────────────────────
function StarRain({onDone}){
  const [stars,setStars]=useState(()=>
    Array.from({length:20},(_,i)=>({id:i,x:Math.random()*window.innerWidth,delay:i*150,size:Math.random()*16+10}))
  );
  useEffect(()=>{ const t=setTimeout(onDone,3500); return()=>clearTimeout(t); },[]);
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:3000,overflow:"hidden"}}>
      {stars.map(s=>(
        <div key={s.id} style={{position:"absolute",top:-30,left:s.x,fontSize:s.size,animation:`fallStar 3s linear ${s.delay}ms forwards`}}>⭐</div>
      ))}
    </div>
  );
}

// ── Rainbow overlay for canvas drawing ────────────────────────────────────────
const RAINBOW_COLS=["#f87171","#fb923c","#fbbf24","#4ade80","#60a5fa","#a78bfa","#f472b6"];
let rainbowIdx=0;

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function interpolatePts(stroke,steps=90){
  const segs=[];let total=0;
  for(let i=1;i<stroke.length;i++){const d=Math.hypot(stroke[i][0]-stroke[i-1][0],stroke[i][1]-stroke[i-1][1]);segs.push(d);total+=d;}
  const result=[];
  for(let s=0;s<=steps;s++){
    const target=(s/steps)*total;let acc=0,seg=0;
    while(seg<segs.length-1&&acc+segs[seg]<target){acc+=segs[seg];seg++;}
    const t=segs[seg]===0?0:Math.min(1,(target-acc)/segs[seg]);
    result.push([stroke[seg][0]+t*(stroke[seg+1][0]-stroke[seg][0]),stroke[seg][1]+t*(stroke[seg+1][1]-stroke[seg][1])]);
  }
  return result;
}
function toCanvas(p,W,H){return[p[0]/100*W,p[1]/130*H];}
// ─── Accurate point-to-polyline distance (uses segment math, not point sampling) ──
function distToPolyline(px,py,strokes){
  let minD=Infinity;
  for(const s of strokes){
    for(let i=1;i<s.length;i++){
      const ax=s[i-1][0],ay=s[i-1][1],bx=s[i][0],by=s[i][1];
      const dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy;
      if(len2===0){minD=Math.min(minD,Math.hypot(px-ax,py-ay));continue;}
      const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/len2));
      minD=Math.min(minD,Math.hypot(px-(ax+t*dx),py-(ay+t*dy)));
    }
  }
  return minD;
}
function useStrokes(letter,W,H){
  return useMemo(()=>{
    const raw=STROKES[letter]||STROKES["A"];
    return raw.map(s=>interpolatePts(s,90).map(p=>toCanvas(p,W,H)));
  },[letter,W,H]);
}

// ── Schreibfeld-Größe ─────────────────────────────────────────────────────────
// Gezeichnet wird immer im 260×310-Raster. Auf größeren Bildschirmen wird das Feld
// größer dargestellt (größere Buchstaben sind für Kinderfinger leichter zu treffen)
// und in Bildschirmauflösung gerendert, damit die Linien scharf bleiben.
function fieldScale(W=260,H=310){
  if(typeof window==="undefined")return 1;
  return Math.max(1,Math.min(1.8,(window.innerWidth-48)/W,(window.innerHeight-360)/H));
}
function pixelRatio(scale=1){
  const dpr=typeof window!=="undefined"&&window.devicePixelRatio||1;
  return scale*Math.min(dpr,2);
}
// Setzt den Maßstab auf den Canvas-Kontexten, bevor die Effekte zeichnen
function useCanvasScale(refs,k){
  useLayoutEffect(()=>{
    for(const r of refs){const c=r.current;if(c)c.getContext("2d").setTransform(k,0,0,k,0,0);}
  });
}

// ── Geometrie für Rückmeldungen ───────────────────────────────────────────────
function polyLength(p){let L=0;for(let i=1;i<p.length;i++)L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return L;}
function nearestIndex(pt,poly){
  let best=0,bd=Infinity;
  poly.forEach((q,i)=>{const d=Math.hypot(pt[0]-q[0],pt[1]-q[1]);if(d<bd){bd=d;best=i;}});
  return best;
}
function signedArea(p){let a=0;for(let i=0;i<p.length;i++){const[x1,y1]=p[i],[x2,y2]=p[(i+1)%p.length];a+=x1*y2-x2*y1;}return a/2;}
function bbox(pts){
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  return{x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)};
}

// Prüft Startpunkt und Richtung eines Strichs gegen die Vorlage.
// Ergebnis: null (passt), "start" (woanders angefangen) oder "direction" (falschherum).
function checkFormation(drawn,tpl,tol){
  if(drawn.length<4)return null;
  const L=polyLength(tpl);if(L<25)return null;                   // Punkte (i, ä …) egal
  const mean=drawn.reduce((s,p)=>s+distToPolyline(p[0],p[1],[tpl]),0)/drawn.length;
  if(mean>Math.max(28,tol*2.2))return "start";                    // ganz anderer Strich
  const first=drawn[0],last=drawn[drawn.length-1],n=tpl.length-1;
  const startOff=Math.hypot(first[0]-tpl[0][0],first[1]-tpl[0][1]);
  const closed=Math.hypot(tpl[0][0]-tpl[n][0],tpl[0][1]-tpl[n][1])<L*0.1;
  if(closed){
    // Kreise: Drehrichtung über die Fläche bestimmen (nicht bei der 8)
    const a=signedArea(tpl),b=signedArea(drawn),bb=bbox(tpl);
    const round=Math.abs(a)>0.3*(bb.x1-bb.x0)*(bb.y1-bb.y0);
    if(round&&Math.abs(b)>Math.abs(a)*0.3&&Math.sign(a)!==Math.sign(b))return "direction";
    // Sonst (z. B. 8): Wo liegt der Stift nach dem ersten Fünftel? Falschherum liegt er hinten.
    if(!round&&nearestIndex(drawn[Math.floor(drawn.length*0.2)],tpl)>n*0.5)return "direction";
    return startOff>Math.max(40,tol*3)?"start":null;
  }
  const i0=nearestIndex(first,tpl),i1=nearestIndex(last,tpl);
  if(i0-i1>n*0.25)return "direction";
  if(i0>n*0.35)return "start";
  return null;
}

// Bewertung: Genauigkeit 50 %, Abdeckung der Vorlage 40 %, Längen-Abzug fürs Kritzeln
function scoreDrawing(drawnStrokes,tpl,TOL){
  const pts=drawnStrokes.flat();if(pts.length<4)return{raw:0,accuracy:0,coverage:0};
  let acc=0;
  for(const p of pts){
    const d=distToPolyline(p[0],p[1],tpl);
    if(d<=TOL*0.5)acc+=1;else if(d<=TOL)acc+=1-(d-TOL*0.5)/(TOL*0.5);
  }
  const accuracy=acc/pts.length;
  const tplPts=tpl.flat();let covered=0;
  for(const t of tplPts){if(pts.some(p=>Math.hypot(p[0]-t[0],p[1]-t[1])<TOL*1.4))covered++;}
  const coverage=covered/tplPts.length;
  const drawnLen=drawnStrokes.reduce((s,st)=>s+polyLength(st),0);
  const ratio=drawnLen/Math.max(1,tpl.reduce((s,st)=>s+polyLength(st),0));
  const lengthPenalty=ratio>2?Math.min(1,(ratio-2)/3):0;
  return{raw:(accuracy*0.5+coverage*0.4)*(1-lengthPenalty*0.1),accuracy,coverage};
}
const shiftStrokes=(strokes,dx)=>strokes.map(s=>s.map(([x,y])=>[x+dx,y]));
// Spiegelbild um die senkrechte Mittelachse (typisch bei J, Z, 3, 7, 9 …)
function mirrorStrokes(strokes){
  const b=bbox(strokes.flat()),cx=(b.x0+b.x1)/2;
  return strokes.map(s=>s.map(([x,y])=>[2*cx-x,y]));
}

// Vorlage mit Startpunkten, Nummern und Richtungspfeilen (zum Einprägen)
function drawModel(ctx,strokes,{color="#4361ee",width=9,alpha=1,numbers=true,arrows=true,font=12}={}){
  ctx.save();ctx.globalAlpha=alpha;ctx.lineCap="round";ctx.lineJoin="round";
  strokes.forEach(pts=>{
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j][0],pts[j][1]);
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  });
  if(numbers||arrows)strokes.forEach((pts,i)=>{
    if(arrows&&pts.length>4&&polyLength(pts)>width*3){
      const m=Math.floor(pts.length*0.55),p=pts[m],pv=pts[m-1];
      const a=Math.atan2(p[1]-pv[1],p[0]-pv[0]),sz=width*1.3;
      ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(a);
      ctx.beginPath();ctx.moveTo(sz*0.6,0);ctx.lineTo(-sz*0.5,-sz*0.6);ctx.lineTo(-sz*0.5,sz*0.6);ctx.closePath();
      ctx.fillStyle="#fbbf24";ctx.fill();ctx.restore();
    }
    if(numbers){
      ctx.beginPath();ctx.arc(pts[0][0],pts[0][1],width*0.75,0,Math.PI*2);ctx.fillStyle="#f59e0b";ctx.fill();
      ctx.font=`bold ${font}px Arial`;ctx.fillStyle="#92400e";
      ctx.fillText(i+1,pts[0][0]+width*0.9,pts[0][1]-width*0.5);
    }
  });
  ctx.restore();
}

// Kleine Vorlagenkarte neben dem Schreibfeld (Modus „Abschreiben")
function ModelCard({letter,W=110,H=131}){
  const ref=useRef(null);
  const [k]=useState(()=>pixelRatio(1));
  const strokes=useStrokes(letter,W,H);
  useCanvasScale([ref],k);
  useEffect(()=>{
    const ctx=ref.current.getContext("2d");
    ctx.clearRect(0,0,W,H);drawLineatur(ctx,W,H,{alpha:"40",width:1,dash:[3,3]});
    drawModel(ctx,strokes,{width:4.5,font:10});
  },[strokes,W,H]);
  return(
    <div style={{background:"white",borderRadius:14,padding:4,border:"2px solid #fdba74",boxShadow:"0 2px 10px #f9731630"}}>
      <canvas ref={ref} width={W*k} height={H*k} style={{display:"block",width:W,height:H,borderRadius:10,background:"#fafafa"}}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFETTI
// ═══════════════════════════════════════════════════════════════════════════════
function Confetti(){
  const r=useRef(null);
  useEffect(()=>{
    const c=r.current;const ctx=c.getContext("2d");const W=c.width,H=c.height;
    const cols=["#fb923c","#4ade80","#60a5fa","#fbbf24","#f472b6","#a78bfa"];
    const ps=Array.from({length:80},()=>({x:Math.random()*W,y:-20,vx:(Math.random()-.5)*5,vy:Math.random()*3+2,r:Math.random()*7+3,col:cols[Math.floor(Math.random()*cols.length)],rot:Math.random()*360,rv:(Math.random()-.5)*8,shape:Math.random()>.5?"rect":"circ"}));
    let alive=true;
    function fr(){
      if(!alive)return;ctx.clearRect(0,0,W,H);
      ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.14;p.rot+=p.rv;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.col;ctx.globalAlpha=Math.max(0,1-p.y/H);if(p.shape==="rect")ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);else{ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();}ctx.restore();});
      if(ps.some(p=>p.y<H))requestAnimationFrame(fr);
    }
    requestAnimationFrame(fr);
    return()=>{alive=false;};
  },[]);
  return <canvas ref={r} width={340} height={420} style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",pointerEvents:"none",zIndex:60}}/>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIM CANVAS
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// STROKE PREVIEW  — zeigt alle Striche nebeneinander wie im Schreibheft
// ═══════════════════════════════════════════════════════════════════════════════
function StrokePreview({letter, W=80, H=96}){
  const strokes=useStrokes(letter,W,H);
  const canvasRefs=useRef([]);
  const [k]=useState(()=>pixelRatio(1));

  useEffect(()=>{
    strokes.forEach((pts,si)=>{
      const c=canvasRefs.current[si];if(!c)return;
      const ctx=c.getContext("2d");
      ctx.setTransform(k,0,0,k,0,0);
      ctx.clearRect(0,0,W,H);
      // Light background
      ctx.fillStyle="#f8fafc";ctx.fillRect(0,0,W,H);
      // Ruled lines
      drawLineatur(ctx,W,H,{alpha:"30",width:1,dash:[3,3]});
      // All previous strokes faint grey
      for(let i=0;i<si;i++){
        const p=strokes[i];
        ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);
        for(let j=1;j<p.length;j++)ctx.lineTo(p[j][0],p[j][1]);
        ctx.strokeStyle="rgba(180,180,200,0.45)";ctx.lineWidth=5;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
      }
      // This stroke — dark, prominent
      ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
      for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j][0],pts[j][1]);
      ctx.strokeStyle="#1e3a8a";ctx.lineWidth=7;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
      // Direction arrow at ~55% of stroke
      const mid=Math.floor(pts.length*0.55);
      if(mid>=1){
        const p=pts[mid],pv=pts[mid-1];
        const angle=Math.atan2(p[1]-pv[1],p[0]-pv[0]);const sz=9;
        ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(angle);
        ctx.beginPath();ctx.moveTo(sz*0.5,0);ctx.lineTo(-sz*0.5,-sz*0.55);ctx.lineTo(-sz*0.15,0);ctx.lineTo(-sz*0.5,sz*0.55);ctx.closePath();
        ctx.fillStyle="#2563eb";ctx.fill();ctx.restore();
      }
      // Small tail arrow at start
      if(pts.length>1){
        const p2=pts[1],s2=pts[0];
        const angle2=Math.atan2(p2[1]-s2[1],p2[0]-s2[0]);const sz2=7;
        ctx.save();ctx.translate(s2[0]+Math.cos(angle2)*4,s2[1]+Math.sin(angle2)*4);ctx.rotate(angle2);
        ctx.beginPath();ctx.moveTo(sz2*0.4,0);ctx.lineTo(-sz2*0.4,-sz2*0.5);ctx.lineTo(-sz2*0.15,0);ctx.lineTo(-sz2*0.4,sz2*0.5);ctx.closePath();
        ctx.fillStyle="rgba(37,99,235,0.5)";ctx.fill();ctx.restore();
      }
    });
  },[strokes,W,H]);

  return(
    <div style={{background:"#e0f2fe",borderRadius:16,padding:"10px 12px",border:"2px solid #7dd3fc",marginBottom:4}}>
      <div style={{fontSize:11,fontWeight:800,color:"#0369a1",marginBottom:8,textAlign:"center"}}>
        📋 So wird {letter} geschrieben — Strich für Strich:
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
        {strokes.map((pts,si)=>(
          <div key={si} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            {/* Blue numbered circle like in the book */}
            <div style={{
              background:"#0ea5e9",color:"white",borderRadius:"50%",
              width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:12,fontWeight:900,boxShadow:"0 2px 6px #0ea5e960"
            }}>{si+1}</div>
            {/* Canvas showing this stroke */}
            <div style={{background:"white",borderRadius:10,padding:3,boxShadow:"0 2px 8px #0002",border:"1.5px solid #bae6fd"}}>
              <canvas
                ref={el=>{canvasRefs.current[si]=el;}}
                width={W*k} height={H*k}
                style={{display:"block",width:W,height:H,borderRadius:8}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ANIM CANVAS  — animates stroke-by-stroke before tracing phase
// ═══════════════════════════════════════════════════════════════════════════════
function AnimCanvas({letter, onDone, scale=1, W=260, H=310}){
  const ref=useRef(null);const rafRef=useRef(null);const tmrRef=useRef(null);
  const [k]=useState(()=>pixelRatio(scale));
  useCanvasScale([ref],k);
  const strokes=useStrokes(letter,W,H);
  const drawRules=useCallback((ctx)=>{
    drawLineatur(ctx,W,H);
  },[W,H]);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");let si=0,pi=0;

    function drawArrow(ctx,pts,atIdx,color,size=20){
      if(atIdx<1||atIdx>=pts.length)return;
      const p=pts[atIdx],prev=pts[atIdx-1];
      const angle=Math.atan2(p[1]-prev[1],p[0]-prev[0]);
      ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(angle);
      ctx.shadowColor="rgba(0,0,0,0.2)";ctx.shadowBlur=5;
      ctx.beginPath();ctx.moveTo(size*0.5,0);
      ctx.lineTo(-size*0.5,-size*0.55);ctx.lineTo(-size*0.15,0);ctx.lineTo(-size*0.5,size*0.55);
      ctx.closePath();ctx.fillStyle=color;ctx.fill();
      ctx.shadowBlur=0;ctx.restore();
    }

    function frame(){
      ctx.clearRect(0,0,W,H);drawRules(ctx);
      // Draw order: upcoming → completed → active (on top)
      const order=[
        ...strokes.map((_,i)=>i).filter(i=>i>si),
        ...strokes.map((_,i)=>i).filter(i=>i<si),
        si,
      ].filter(i=>i<strokes.length);

      order.forEach(idx=>{
        const pts=strokes[idx];
        const active=idx===si;
        const completed=idx<si;
        ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
        for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j][0],pts[j][1]);
        ctx.strokeStyle=active?"rgba(99,102,241,0.15)":completed?"#4361ee":"rgba(180,180,210,0.28)";
        ctx.lineWidth=active?26:completed?9:18;
        ctx.lineCap="round";ctx.lineJoin="round";
        ctx.globalAlpha=completed?0.85:1;ctx.stroke();ctx.globalAlpha=1;
        if(active){
          // Drawn partial in orange
          const partial=pts.slice(0,pi+1);
          if(partial.length>=2){
            ctx.beginPath();ctx.moveTo(partial[0][0],partial[0][1]);
            for(let j=1;j<partial.length;j++)ctx.lineTo(partial[j][0],partial[j][1]);
            ctx.strokeStyle="#fb923c";ctx.lineWidth=13;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
          }
          // Tip dot
          if(partial.length){
            const tip=partial[partial.length-1];
            ctx.beginPath();ctx.arc(tip[0],tip[1],16,0,Math.PI*2);ctx.fillStyle="#fb923c18";ctx.fill();
            ctx.beginPath();ctx.arc(tip[0],tip[1],9,0,Math.PI*2);ctx.fillStyle="#fb923c40";ctx.fill();
            ctx.beginPath();ctx.arc(tip[0],tip[1],5,0,Math.PI*2);ctx.fillStyle="#fb923c";ctx.fill();
            ctx.beginPath();ctx.arc(tip[0],tip[1],2,0,Math.PI*2);ctx.fillStyle="white";ctx.fill();
          }
          // Live arrow at tip
          if(pi>=1) drawArrow(ctx,pts,Math.min(pi,pts.length-1),"#fb923c",22);
          // Static mid-path arrow (shows direction ahead)
          const midIdx=Math.min(Math.floor(pts.length*0.55),pts.length-1);
          if(midIdx>pi+4) drawArrow(ctx,pts,midIdx,"rgba(99,102,241,0.65)",18);
        }
        // Start dot + number
        ctx.beginPath();ctx.arc(pts[0][0],pts[0][1],active?11:completed?5:7,0,Math.PI*2);
        ctx.fillStyle=active?"#fbbf24":completed?"rgba(99,102,241,0.5)":"#cbd5e1";ctx.fill();
        if(active){ctx.beginPath();ctx.arc(pts[0][0],pts[0][1],5,0,Math.PI*2);ctx.fillStyle="white";ctx.fill();}
        ctx.font=`bold ${active?12:9}px Arial`;
        ctx.fillStyle=active?"#92400e":completed?"#6366f188":"#94a3b8";
        ctx.fillText(idx+1,pts[0][0]+13,pts[0][1]-4);
      });

      pi++;
      if(pi>=(strokes[si]||[]).length){
        pi=0;si++;
        if(si>=strokes.length){
          ctx.clearRect(0,0,W,H);drawRules(ctx);
          strokes.forEach(pts=>{ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j][0],pts[j][1]);ctx.strokeStyle="#4361ee";ctx.lineWidth=10;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();});
          tmrRef.current=setTimeout(onDone,700);return;
        }
        tmrRef.current=setTimeout(()=>{rafRef.current=requestAnimationFrame(frame);},200);return;
      }
      rafRef.current=requestAnimationFrame(frame);
    }
    tmrRef.current=setTimeout(()=>{rafRef.current=requestAnimationFrame(frame);},300);
    return()=>{cancelAnimationFrame(rafRef.current);clearTimeout(tmrRef.current);};
  },[letter,strokes,drawRules,onDone,W,H]);
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <div style={{background:"#1e1b4b",borderRadius:24,padding:10,boxShadow:"0 8px 32px #1e1b4b50"}}>
        <canvas ref={ref} width={W*k} height={H*k} style={{display:"block",width:W*scale,height:H*scale,borderRadius:16,background:"#fafafa"}}/>
      </div>
      <div style={{fontSize:13,color:"#6b7280",background:"#fff7ed",borderRadius:12,padding:"5px 14px",border:"1px solid #fed7aa"}}>👀 Schau zu — dann bist du dran!</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRACE CANVAS — Nachfahren, Abschreiben und Aus-dem-Kopf-Schreiben
// ═══════════════════════════════════════════════════════════════════════════════
// mode "trace":  Vorlage liegt im Feld; Startpunkt und Richtung jedes Strichs
//                werden geprüft, ein falscher Strich wird zurückgenommen.
// mode "copy":   Vorlage steht daneben, das Feld ist leer (abschreiben).
// mode "memory": Vorlage kurz zeigen, verstecken, kurz warten, dann aus dem Kopf.
//                Die Wartezeit wächst mit jedem Erfolg (memoryDelay Sekunden).
// mode "probe":  Schreibtest der Studie — keine Vorlage, keine Rückmeldung.
// In copy/memory gibt es während des Schreibens kein Grün/Rot — die Rückmeldung
// kommt danach als Vergleich mit der Vorlage.
// onTrial (nur im Forschungsmodus) erhält Zeiten und Messwerte jedes Versuchs.
const COACH={
  start:"👆 Fang beim gelben Punkt an!",
  direction:"↩️ Andersherum! Fang beim gelben Punkt an.",
};
function TraceCanvas({letter,onComplete,difficulty="medium",mode="trace",memoryDelay=1,activeReward,
                     lefthanded=false,highContrast=false,hapticsEnabled=true,onSpeak=()=>{},onTrial=null,scale=1,W=260,H=310}){
  const bgRef=useRef(null);const ovRef=useRef(null);
  const [k]=useState(()=>pixelRatio(scale));
  useCanvasScale([bgRef,ovRef],k);
  const isDrawing=useRef(false);
  const drawn=useRef([]);       // gezeichnete Striche: [[x,y], …]
  const segs=useRef([]);        // gemalte Teilstücke, um einen Strich zurücknehmen zu können
  const segStarts=useRef([]);
  const strokeIdx=useRef(0);
  const formationErrors=useRef(0);
  // Messung: Aufgabenbeginn und alle Strichversuche mit Zeitstempeln
  const onsetRef=useRef(null);
  const attempts=useRef([]);
  const reported=useRef(false);
  const onTrialRef=useRef(onTrial);onTrialRef.current=onTrial;
  const markOnset=()=>requestAnimationFrame(ts=>{onsetRef.current=ts;});
  const [done,setDone]=useState(false);const [result,setResult]=useState(null);
  const [hasLines,setHasLines]=useState(false);const [confetti,setConfetti]=useState(false);
  const [animalBounce,setAnimalBounce]=useState(false);
  const [memPhase,setMemPhase]=useState(mode==="memory"?"show":"write"); // show | wait | write
  const [countdown,setCountdown]=useState(0);
  const [round,setRound]=useState(0);
  const [coach,setCoach]=useState(null);
  const coachTimer=useRef(null);
  const [showHintBtn,setShowHintBtn]=useState(false);
  const idleTimerRef=useRef(null);
  const pulseRafRef=useRef(null);
  const offTrackRef=useRef(false);
  const diff=useMemo(()=>applyContrast(DIFFICULTY[difficulty],highContrast),[difficulty,highContrast]);
  const pal=highContrast?PALETTE.high:PALETTE.normal;
  const strokes=useStrokes(letter,W,H);
  const animal=mascotOf(letter);
  const guided=mode==="trace";                         // Vorlage im Feld?
  const probe=mode==="probe";                          // Schreibtest: keine Rückmeldung
  const canWrite=memPhase==="write"&&!done;

  const drawRules=useCallback((ctx)=>{drawLineatur(ctx,W,H);},[W,H]);

  const drawTemplate=useCallback((ctx,pulseR=11)=>{
    ctx.clearRect(0,0,W,H);drawRules(ctx);
    if(mode==="memory"&&memPhase==="show"){drawModel(ctx,strokes);return;}
    if(!guided)return;
    const si=strokeIdx.current;
    [...strokes.map((_,i)=>i).filter(i=>i>si),
     ...strokes.map((_,i)=>i).filter(i=>i<si), si]
    .filter(i=>i<strokes.length)
    .forEach(idx=>{
      const pts=strokes[idx];
      const active=idx===si; const completed=idx<si;
      ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
      for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j][0],pts[j][1]);
      ctx.strokeStyle=active?`rgba(${pal.ghost},${diff.ghostAlpha*1.8})`:completed?`rgba(${pal.ghost},0.45)`:"rgba(190,190,220,0.20)";
      ctx.lineWidth=active?diff.ghostWidth*1.3:completed?8:18;
      ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
      ctx.save();ctx.setLineDash(diff.dashLine);
      ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
      for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j][0],pts[j][1]);
      ctx.strokeStyle=active?pal.dash+pal.dashActive:completed?pal.dash+"55":pal.dash+"22";
      ctx.lineWidth=active?(highContrast?4:3):1.5;ctx.stroke();ctx.restore();
      // Linkshänder: Beschriftung links vom Punkt, damit die Hand sie nicht verdeckt
      const lx=lefthanded?-1:1;
      if(active){
        const mid=Math.floor(pts.length*0.55);
        if(mid>=1){
          const p=pts[mid],pv=pts[mid-1];
          const a=Math.atan2(p[1]-pv[1],p[0]-pv[0]),sz=highContrast?16:14;
          ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(a);
          ctx.beginPath();ctx.moveTo(sz*0.5,0);ctx.lineTo(-sz*0.5,-sz*0.55);ctx.lineTo(-sz*0.15,0);ctx.lineTo(-sz*0.5,sz*0.55);ctx.closePath();
          ctx.fillStyle=pal.arrow;ctx.fill();ctx.restore();
        }
        // Animierter Startpunkt — Glühring beim Pulsieren
        if(pulseR>11){
          ctx.beginPath();ctx.arc(pts[0][0],pts[0][1],pulseR+6,0,Math.PI*2);
          const glow=highContrast?"249,115,22":"251,191,36";
          ctx.fillStyle=`rgba(${glow},${0.18*(pulseR-11)/10})`;ctx.fill();
        }
        ctx.beginPath();ctx.arc(pts[0][0],pts[0][1],pulseR,0,Math.PI*2);ctx.fillStyle=pal.dot;ctx.fill();
        ctx.beginPath();ctx.arc(pts[0][0],pts[0][1],5,0,Math.PI*2);ctx.fillStyle=pal.dotInner;ctx.fill();
        ctx.font="bold 12px Arial";ctx.fillStyle=pal.dotLabel;
        ctx.textAlign=lefthanded?"right":"left";
        ctx.fillText(idx+1,pts[0][0]+14*lx,pts[0][1]-5);
        ctx.textAlign="left";
      } else {
        ctx.beginPath();ctx.arc(pts[0][0],pts[0][1],completed?5:6,0,Math.PI*2);
        ctx.fillStyle=completed?`rgba(${pal.ghost},0.5)`:"#d1d5db";ctx.fill();
        ctx.font="bold 9px Arial";ctx.fillStyle=completed?pal.dash+"88":"#94a3b8";
        ctx.textAlign=lefthanded?"right":"left";
        ctx.fillText(idx+1,pts[0][0]+9*lx,pts[0][1]-3);
        ctx.textAlign="left";
      }
    });
  },[strokes,diff,drawRules,pal,lefthanded,highContrast,guided,mode,memPhase,W,H]);

  // Ein gemaltes Teilstück zeichnen (auch beim Wiederherstellen nach dem Zurücknehmen)
  const paintSeg=(ctx,{a,b,kind,color})=>{
    const line=(c,w)=>{ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();};
    ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
    if(kind==="glitter"){ctx.shadowColor="#fbbf24";ctx.shadowBlur=16;line("#fde68a",10);ctx.shadowBlur=0;line("#4ade80",6);}
    else if(kind==="rainbow")line(color,11);
    else{ctx.globalAlpha=0.85;line(color,10);}
    ctx.restore();
  };
  const repaintInk=()=>{
    const ctx=ovRef.current.getContext("2d");ctx.clearRect(0,0,W,H);
    segs.current.forEach(s=>paintSeg(ctx,s));
  };

  const showCoach=useCallback((text,speakIt=true)=>{
    setCoach(text);clearTimeout(coachTimer.current);
    coachTimer.current=setTimeout(()=>setCoach(null),3200);
    if(speakIt)onSpeak(text);
  },[onSpeak]);

  // Versuch an den Forschungsmodus melden (einmal pro Versuch)
  const report=(completed,extra={})=>{
    if(!onTrialRef.current||reported.current||onsetRef.current==null)return;
    if(!completed&&!attempts.current.length&&!extra.skipped)return;
    reported.current=true;
    const m=trialMetrics({attempts:attempts.current,onset:onsetRef.current,W,H});
    onTrialRef.current({...m,onset:onsetRef.current,completed:completed?1:0,mode,
      memory_delay_s:mode==="memory"?memoryDelay:null,...extra});
  };

  const reset=useCallback(()=>{
    report(false);
    attempts.current=[];reported.current=false;markOnset();
    drawn.current=[];segs.current=[];segStarts.current=[];strokeIdx.current=0;formationErrors.current=0;
    isDrawing.current=false;
    setDone(false);setResult(null);setHasLines(false);setConfetti(false);setCoach(null);
    const bg=bgRef.current;const ov=ovRef.current;if(!bg||!ov)return;
    ov.getContext("2d").clearRect(0,0,W,H);
    drawTemplate(bg.getContext("2d"));
  },[drawTemplate,W,H]);

  useEffect(()=>{reset();},[letter,difficulty,mode,round]);
  // Vorlage neu zeichnen, wenn sich die Phase ändert (zeigen → verstecken)
  useEffect(()=>{if(bgRef.current)drawTemplate(bgRef.current.getContext("2d"));},[memPhase]);
  useEffect(()=>()=>{clearTimeout(coachTimer.current);report(false);},[]);

  // Aus-dem-Kopf: zeigen → warten (Countdown) → schreiben
  useEffect(()=>{
    if(mode!=="memory"){setMemPhase("write");return;}
    setMemPhase("show");
    const timers=[];
    const write=()=>{setMemPhase("write");markOnset();onSpeak("Jetzt du! Schreib ihn aus dem Kopf.");};
    timers.push(setTimeout(()=>{
      if(memoryDelay<=0){write();return;}
      setMemPhase("wait");setCountdown(memoryDelay);
      for(let i=1;i<=memoryDelay;i++)timers.push(setTimeout(()=>{
        if(i===memoryDelay)write();else setCountdown(memoryDelay-i);
      },i*1000));
    },2600));
    return()=>timers.forEach(clearTimeout);
  },[letter,mode,memoryDelay,round]);

  // ── Hilfe-Knopf nach 4 s ohne Zeichnen ──
  const resetIdleTimer=useCallback(()=>{
    setShowHintBtn(false);
    clearTimeout(idleTimerRef.current);
    if(!done) idleTimerRef.current=setTimeout(()=>setShowHintBtn(true),4000);
  },[done]);
  useEffect(()=>{resetIdleTimer();return()=>clearTimeout(idleTimerRef.current);},[letter,difficulty,resetIdleTimer]);

  // ── Startpunkt pulsieren lassen ──
  const startPulse=useCallback(()=>{
    cancelAnimationFrame(pulseRafRef.current);
    if(!guided)return;
    const t0=performance.now(),DURATION=1200,CYCLES=3;
    const tick=(now)=>{
      const elapsed=now-t0;
      const t=(elapsed%(DURATION/CYCLES))/(DURATION/CYCLES);
      const bg=bgRef.current;if(!bg)return;
      if(elapsed<DURATION){
        drawTemplate(bg.getContext("2d"),11+10*Math.sin(t*Math.PI));
        pulseRafRef.current=requestAnimationFrame(tick);
      } else drawTemplate(bg.getContext("2d"),11);
    };
    pulseRafRef.current=requestAnimationFrame(tick);
  },[drawTemplate,guided]);
  useEffect(()=>{
    const t=setTimeout(startPulse,350);
    return()=>{clearTimeout(t);cancelAnimationFrame(pulseRafRef.current);};
  },[letter,startPulse]);

  // Punkt = [x, y, Zeit in ms] — die Zeit stammt vom Ereignis selbst (gleiche Uhr wie performance.now)
  const getPos=(e)=>{const c=ovRef.current;const rect=c.getBoundingClientRect();const sx=W/rect.width,sy=H/rect.height;const src=e.touches?e.touches[0]:e;return[(src.clientX-rect.left)*sx,(src.clientY-rect.top)*sy,e.timeStamp||performance.now()];};

  const startDraw=(e)=>{
    e.preventDefault();if(!canWrite)return;
    isDrawing.current=true;
    drawn.current.push([getPos(e)]);segStarts.current.push(segs.current.length);
    setHasLines(true);resetIdleTimer();setShowHintBtn(false);
  };

  const draw=(e)=>{
    e.preventDefault();if(!isDrawing.current||!canWrite)return;
    const stroke=drawn.current[drawn.current.length-1];
    const a=stroke[stroke.length-1],b=getPos(e);
    stroke.push(b);
    let seg;
    if(activeReward==="rainbow"&&!probe){seg={a,b,kind:"rainbow",color:RAINBOW_COLS[rainbowIdx++%RAINBOW_COLS.length]};}
    else if(!guided){seg={a,b,kind:activeReward==="glitter"&&!probe?"glitter":"ink",color:"#1e3a8a"};}
    else{
      // Nachfahren: Grün auf der Linie, Rot daneben
      const d=distToPolyline(b[0],b[1],strokes);
      const onTrack=d<diff.tolerance;
      if(!onTrack&&!offTrackRef.current){haptic("off",hapticsEnabled);offTrackRef.current=true;}
      else if(onTrack&&offTrackRef.current){offTrackRef.current=false;}
      seg={a,b,kind:activeReward==="glitter"||d<diff.tolerance*0.35?"glitter":"ink",color:onTrack?"#4ade80":"#f87171"};
    }
    segs.current.push(seg);
    paintSeg(ovRef.current.getContext("2d"),seg);
  };

  const undoLastStroke=()=>{
    drawn.current.pop();
    segs.current=segs.current.slice(0,segStarts.current.pop());
    repaintInk();
    if(!drawn.current.length)setHasLines(false);
  };

  const endDraw=(e)=>{
    e?.preventDefault();if(!isDrawing.current)return;isDrawing.current=false;
    offTrackRef.current=false;
    const stroke=drawn.current[drawn.current.length-1];
    // Nur angetippt? Zählt nicht als Strich.
    if(stroke.length<3){undoLastStroke();return;}
    if(guided&&strokeIdx.current<strokes.length){
      const verdict=checkFormation(stroke,strokes[strokeIdx.current],diff.tolerance);
      attempts.current.push({pts:stroke.slice(),accepted:!verdict,verdict:verdict||"ok",expected:strokeIdx.current});
      if(verdict){
        formationErrors.current++;
        undoLastStroke();haptic("off",hapticsEnabled);
        showCoach(COACH[verdict]);
        setTimeout(startPulse,80);
        return;
      }
      strokeIdx.current++;
      haptic("tick",hapticsEnabled);
      drawTemplate(bgRef.current.getContext("2d"));
      setAnimalBounce(true);setTimeout(()=>setAnimalBounce(false),400);
      if(strokeIdx.current<strokes.length)setTimeout(startPulse,80);
      resetIdleTimer();
    } else {attempts.current.push({pts:stroke.slice(),accepted:true,verdict:"ok",expected:null});haptic("tick",hapticsEnabled);}
  };

  const checkScore=()=>{
    const TOL=diff.tolerance*(guided?1:1.3);
    let tpl=strokes,mirrored=false;
    if(!guided){
      // Frei geschrieben: Position darf seitlich abweichen — Vorlage zur Schrift schieben
      const d=bbox(drawn.current.flat()),t=bbox(strokes.flat());
      const dx=Math.max(-W*0.3,Math.min(W*0.3,(d.x0+d.x1)/2-(t.x0+t.x1)/2));
      tpl=shiftStrokes(strokes,dx);
    }
    const sc=scoreDrawing(drawn.current,tpl,TOL),raw=sc.raw;
    if(!guided){
      // Gespiegelt? Nur bei Zeichen, die gespiegelt anders aussehen
      const m=mirrorStrokes(tpl);
      const symmetric=m.flat().every(p=>distToPolyline(p[0],p[1],tpl)<TOL*0.6);
      if(!symmetric){const rawM=scoreDrawing(drawn.current,m,TOL).raw;mirrored=rawM>raw+0.12&&rawM>0.45;}
    }
    let s=Math.max(1,Math.min(5,Math.round(raw*5)));
    if(mirrored)s=Math.min(s,2);
    report(true,{accuracy:+sc.accuracy.toFixed(3),coverage:+sc.coverage.toFixed(3),score_raw:+raw.toFixed(3),stars:s,mirrored:guided?null:mirrored?1:0});
    if(probe){
      // Schreibtest: keine Bewertung zeigen, direkt weiter
      setResult({stars:s,note:null});setDone(true);clearTimeout(idleTimerRef.current);setShowHintBtn(false);
      haptic("tick",hapticsEnabled);
      setTimeout(()=>onComplete(s,{mode,mirrored}),500);
      return;
    }
    if(!guided){
      // Vergleich zeigen: Vorlage hinter die Schrift des Kindes legen
      const ctx=bgRef.current.getContext("2d");
      ctx.clearRect(0,0,W,H);drawRules(ctx);
      drawModel(ctx,tpl,{color:"#22c55e",width:16,alpha:0.35,numbers:false,arrows:false});
    }
    let note=null;
    if(mirrored)note="🪞 Gespiegelt! Schau, in welche Richtung er zeigt.";
    else if(formationErrors.current>=2)note="➡️ Tipp: Immer beim gelben Punkt anfangen.";
    setResult({stars:s,note});setDone(true);
    clearTimeout(idleTimerRef.current);setShowHintBtn(false);
    haptic(s===5?"celebrate":s>=3?"success":"tick",hapticsEnabled);
    if(note)setTimeout(()=>onSpeak(note),900);
    if(s===5){setConfetti(true);setAnimalBounce(true);}
    setTimeout(()=>onComplete(s,{mode,mirrored}),note?2600:1700);
  };

  const allStrokesDone=guided&&strokeIdx.current>=strokes.length;
  const hint=mode==="memory"&&memPhase==="show"?"🧠 Merk dir den Buchstaben!"
    :mode==="memory"&&memPhase==="wait"?"🤫 Gleich bist du dran …"
    :mode==="memory"?"✏️ Jetzt aus dem Kopf schreiben!"
    :mode==="copy"?"👀 Schau auf die Vorlage und schreib ihn ab!"
    :probe?"✏️ Schreib ihn aus dem Kopf!"
    :allStrokesDone?"✓ Super! Tippe auf Fertig."
    :`👉 Strich ${strokeIdx.current+1} von ${strokes.length} — nachfahren!`;
  const rewardHint=probe?null:activeReward==="glitter"?"✨ Glitzerstift aktiv!":activeReward==="rainbow"?"🌈 Regenbogenstift aktiv!":activeReward==="stardust"?"🌟 Sternenregen aktiv!":null;
  const banner=coach||rewardHint||hint;

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <div style={{fontSize:12,color:coach?"#9a3412":"#475569",background:coach?"#ffedd5":rewardHint?"#fef9c3":"#f0fdf4",borderRadius:12,padding:"5px 16px",border:`1px solid ${coach?"#fb923c":rewardHint?"#fbbf24":"#bbf7d0"}`,fontWeight:coach?800:600,animation:coach?"shake 0.3s ease-in-out 2":rewardHint?"glowPulse 2s infinite":"none",textAlign:"center"}}>
        {banner}
      </div>
      {mode==="copy"&&<ModelCard letter={letter}/>}
      <div style={{position:"relative"}}>
        <div style={{background:"#1e1b4b",borderRadius:24,padding:10,boxShadow:"0 8px 32px #1e1b4b50"}}>
          <div style={{position:"relative",width:W*scale,height:H*scale,borderRadius:16,overflow:"hidden",background:"#fafafa"}}>
            <canvas ref={bgRef} width={W*k} height={H*k} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>
            <canvas ref={ovRef} width={W*k} height={H*k} style={{position:"absolute",inset:0,width:"100%",height:"100%",touchAction:"none",cursor:"crosshair"}}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
            {memPhase==="wait"&&(
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                <div key={countdown} style={{fontSize:90*scale,fontWeight:900,color:"#a855f7",opacity:0.8,animation:"popIn 0.4s ease-out"}}>{countdown}</div>
              </div>
            )}
            {done&&probe&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:80,animation:"popIn 0.3s ease-out",pointerEvents:"none"}}>👍</div>}
            {done&&result&&!probe&&(
              <div style={{position:"absolute",left:0,right:0,bottom:0,background:"#ffffffe8",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 8px 12px",borderTop:"1px solid #e2e8f0",animation:"slideUp 0.3s ease-out"}}>
                <div style={{display:"flex",gap:4,alignItems:"center"}}>
                  <span style={{fontSize:26,marginRight:4}}>{result.stars===5?"🏆":"🎉"}</span>
                  {[1,2,3,4,5].map(i=><span key={i} style={{fontSize:22,filter:i<=result.stars?"none":"grayscale(1) opacity(0.25)"}}>⭐</span>)}
                </div>
                <div style={{fontSize:15,color:"#374151",fontWeight:800}}>{PRAISE[result.stars]}</div>
                {result.note&&<div style={{fontSize:12,color:"#9a3412",fontWeight:700,textAlign:"center"}}>{result.note}</div>}
                {!guided&&<div style={{fontSize:10,color:"#16a34a",fontWeight:700}}>Grün = so sieht die Vorlage aus</div>}
              </div>
            )}
          </div>
        </div>
        {!probe&&<div style={{position:"absolute",bottom:-14,right:-14,fontSize:38,transform:animalBounce?"scale(1.4) rotate(-12deg)":"scale(1)",transition:"transform 0.25s cubic-bezier(.34,1.56,.64,1)",filter:"drop-shadow(0 2px 4px #0003)",userSelect:"none"}}>{animal}</div>}
        {confetti&&<Confetti/>}
      </div>
      <div style={{display:"flex",gap:8,marginTop:6}}>
        {probe&&!done&&<button onClick={()=>{report(false,{skipped:1});setDone(true);onComplete(0,{mode,skipped:true});}} style={{padding:"8px 16px",borderRadius:20,border:"2px solid #cbd5e1",background:"white",color:"#64748b",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>🤷 Weiß ich nicht</button>}
        <button onClick={()=>mode==="memory"?setRound(r=>r+1):reset()} style={{padding:"8px 16px",borderRadius:20,border:"2px solid #f87171",background:"white",color:"#ef4444",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>🗑️ Neu</button>
        {hasLines&&!done&&<button onClick={checkScore} style={{padding:"8px 16px",borderRadius:20,border:"none",background:"linear-gradient(135deg,#4ade80,#16a34a)",color:"white",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Arial,sans-serif",animation:allStrokesDone?"glowPulse 1.6s infinite":"none"}}>✓ Fertig</button>}
        {showHintBtn&&!done&&!hasLines&&guided&&(
          <button onClick={()=>{setShowHintBtn(false);resetIdleTimer();startPulse();haptic("tick",hapticsEnabled);}}
            style={{padding:"8px 16px",borderRadius:20,border:"2px solid #fbbf24",background:"#fef9c3",color:"#92400e",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"Arial,sans-serif",
              animation:"hintWiggle 0.5s ease-in-out 0s 3"}}>
            👆 Hier starten!
          </button>
        )}
        {showHintBtn&&!done&&hasLines&&!allStrokesDone&&(
          <button onClick={checkScore}
            style={{padding:"8px 16px",borderRadius:20,border:"2px solid #fbbf24",background:"#fef9c3",color:"#92400e",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"Arial,sans-serif",
              animation:"hintWiggle 0.5s ease-in-out 0s 3"}}>
            🤔 Fertig?
          </button>
        )}
      </div>
      <style>{`
        @keyframes hintWiggle {
          0%,100%{transform:rotate(0deg) scale(1)}
          20%{transform:rotate(-8deg) scale(1.08)}
          40%{transform:rotate(8deg) scale(1.12)}
          60%{transform:rotate(-5deg) scale(1.08)}
          80%{transform:rotate(5deg) scale(1.05)}
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GUIDED CANVAS  — Phase 1: geführt, Phase 2: frei nachzeichnen, Phase 3: Vergleich
// ═══════════════════════════════════════════════════════════════════════════════
function GuidedCanvas({letter, onComplete, onSpeak=()=>{}, onTrial=null, scale=1, W=260, H=310}){
  const bgRef=useRef(null);
  const ovRef=useRef(null);
  const compareRef=useRef(null);
  const [k]=useState(()=>pixelRatio(scale));
  useCanvasScale([bgRef,ovRef,compareRef],k);
  // Messung (Forschungsmodus): Beginn, erste Berührung, Ende — die Linie hilft hier mit,
  // deshalb nur Grunddaten und keine Strichdetails
  const onsetRef=useRef(null),firstTouch=useRef(null),reported=useRef(false);
  const onTrialRef=useRef(onTrial);onTrialRef.current=onTrial;
  const reportG=(completed,extra={})=>{
    if(!onTrialRef.current||reported.current||onsetRef.current==null)return;
    if(!completed&&firstTouch.current==null)return;
    reported.current=true;
    const end=performance.now();
    onTrialRef.current({onset:onsetRef.current,completed:completed?1:0,mode:"guided",
      latency_ms:firstTouch.current!=null?Math.round(firstTouch.current-onsetRef.current):null,
      movement_ms:firstTouch.current!=null?Math.round(end-firstTouch.current):null,strokes:[],...extra});
  };
  useEffect(()=>()=>reportG(false),[]);
  const isDrawing=useRef(false);
  const strokeStarted=useRef(false);
  const progressRef=useRef(0);
  const strokeIdx=useRef(0);
  const lastSnapped=useRef(null);
  const currentStrokePts=useRef([]);
  const freeLastPos=useRef(null);
  const freePoints=useRef([]);
  const freeStrokeIdx=useRef(0);
  const freeStrokePts=useRef([]);

  const [phase,setPhase]=useState("guided");
  const [statusMsg,setStatusMsg]=useState("👆 Tippe auf den gelben Punkt um zu starten!");
  const [animalBounce,setAnimalBounce]=useState(false);
  const [confetti,setConfetti]=useState(false);
  const [hasDrawn,setHasDrawn]=useState(false);
  const [scoreInfo,setScoreInfo]=useState({score:0,label:"",color:"#374151"});

  const strokes=useStrokes(letter,W,H);
  const animal=mascotOf(letter);

  const drawRules=useCallback((ctx)=>{
    drawLineatur(ctx,W,H);
  },[W,H]);

  // Shared arrow helper
  const arrow=(ctx,pts,atIdx,color,size=13)=>{
    if(atIdx<1||atIdx>=pts.length)return;
    const p=pts[atIdx],pv=pts[atIdx-1];
    const a=Math.atan2(p[1]-pv[1],p[0]-pv[0]);
    ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(a);
    ctx.beginPath();ctx.moveTo(size*0.5,0);ctx.lineTo(-size*0.5,-size*0.55);ctx.lineTo(-size*0.15,0);ctx.lineTo(-size*0.5,size*0.55);ctx.closePath();
    ctx.fillStyle=color;ctx.fill();ctx.restore();
  };

  // Shared layer-draw helper: upcoming→completed→active
  const drawLayers=(ctx,activeIdx,getActive)=>{
    drawRules(ctx);
    const order=[
      ...strokes.map((_,i)=>i).filter(i=>i>activeIdx),
      ...strokes.map((_,i)=>i).filter(i=>i<activeIdx),
      activeIdx,
    ].filter(i=>i<strokes.length);
    order.forEach(idx=>{
      const pts=strokes[idx];
      const active=idx===activeIdx; const completed=idx<activeIdx;
      ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
      for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j][0],pts[j][1]);
      ctx.strokeStyle=active?"rgba(99,102,241,0.18)":completed?"rgba(99,102,241,0.45)":"rgba(190,190,220,0.20)";
      ctx.lineWidth=active?36:completed?10:20;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
      ctx.save();ctx.setLineDash([6,5]);
      ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
      for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j][0],pts[j][1]);
      ctx.strokeStyle=active?"#6366f1bb":completed?"#6366f155":"#6366f122";
      ctx.lineWidth=active?3:1.5;ctx.stroke();ctx.restore();
      if(active){
        getActive(pts,idx);
        const mid=Math.floor(pts.length*0.55);
        arrow(ctx,pts,mid,"rgba(99,102,241,0.6)",14);
        ctx.beginPath();ctx.arc(pts[0][0],pts[0][1],13,0,Math.PI*2);ctx.fillStyle=getActive._waiting?"#f97316":"#fbbf24";ctx.fill();
        ctx.beginPath();ctx.arc(pts[0][0],pts[0][1],6,0,Math.PI*2);ctx.fillStyle="white";ctx.fill();
        ctx.font="bold 13px Arial";ctx.fillStyle="#92400e";ctx.fillText(idx+1,pts[0][0]+16,pts[0][1]-5);
      } else {
        ctx.beginPath();ctx.arc(pts[0][0],pts[0][1],completed?5:7,0,Math.PI*2);
        ctx.fillStyle=completed?"rgba(99,102,241,0.5)":"#d1d5db";ctx.fill();
        ctx.font="bold 9px Arial";ctx.fillStyle=completed?"#6366f188":"#94a3b8";
        ctx.fillText(idx+1,pts[0][0]+9,pts[0][1]-3);
      }
    });
  };

  const drawGuidedTemplate=useCallback((ctx)=>{
    ctx.clearRect(0,0,W,H);
    const si=strokeIdx.current;
    const waiting=!strokeStarted.current;
    const activeFn=(pts)=>{
      if(!waiting&&progressRef.current<pts.length-1){
        const np=pts[Math.min(progressRef.current+3,pts.length-1)];
        ctx.beginPath();ctx.arc(np[0],np[1],8,0,Math.PI*2);ctx.fillStyle="#fbbf2460";ctx.fill();
        ctx.beginPath();ctx.arc(np[0],np[1],4,0,Math.PI*2);ctx.fillStyle="#fbbf24";ctx.fill();
        arrow(ctx,pts,Math.min(progressRef.current+2,pts.length-1),"#fb923c",12);
      }
    };
    activeFn._waiting=waiting;
    drawLayers(ctx,si,activeFn);
  },[strokes,drawRules,W,H]);

  const drawFreeTemplate=useCallback((ctx)=>{
    ctx.clearRect(0,0,W,H);
    const si=freeStrokeIdx.current;
    const activeFn=()=>{};
    activeFn._waiting=false;
    drawLayers(ctx,si,activeFn);
  },[strokes,drawRules,W,H]);

  // Comparison canvas
  const drawComparison=useCallback(()=>{
    const c=compareRef.current;if(!c)return;
    const ctx=c.getContext("2d");
    const sx=1,sy=1; // der Bildschirm-Maßstab steckt bereits im Canvas-Kontext
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#f8fafc";ctx.fillRect(0,0,W,H);
    drawLineatur(ctx,W,H,{alpha:"25",width:1,dash:[3,3]});
    strokes.forEach(pts=>{
      ctx.beginPath();ctx.moveTo(pts[0][0]*sx,pts[0][1]*sy);
      for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j][0]*sx,pts[j][1]*sy);
      ctx.strokeStyle="rgba(180,180,200,0.5)";ctx.lineWidth=20*sx;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
    });
    strokes.forEach(pts=>{
      ctx.save();ctx.setLineDash([5*sx,4*sx]);
      ctx.beginPath();ctx.moveTo(pts[0][0]*sx,pts[0][1]*sy);
      for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j][0]*sx,pts[j][1]*sy);
      ctx.strokeStyle="rgba(99,102,241,0.4)";ctx.lineWidth=2*sx;ctx.stroke();ctx.restore();
    });
    const pts=freePoints.current;const TOL=18;
    for(let j=1;j<pts.length;j++){
      if(!pts[j]||!pts[j-1])continue;
      const px=pts[j].x,py=pts[j].y;let minD=Infinity;
      strokes.forEach(tp=>{for(let k=1;k<tp.length;k++){
        const ax=tp[k-1][0],ay=tp[k-1][1],bx=tp[k][0],by=tp[k][1];
        const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
        const t=len===0?0:Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/len));
        const d=Math.hypot(px-(ax+t*dx),py-(ay+t*dy));if(d<minD)minD=d;
      }});
      const ratio=Math.min(1,minD/TOL);
      const r=Math.round(ratio*239+(1-ratio)*34),g=Math.round(ratio*68+(1-ratio)*197),b=Math.round(ratio*68+(1-ratio)*94);
      ctx.beginPath();ctx.moveTo(pts[j-1].x*sx,pts[j-1].y*sy);ctx.lineTo(pts[j].x*sx,pts[j].y*sy);
      ctx.strokeStyle=`rgb(${r},${g},${b})`;ctx.lineWidth=9*sx;ctx.lineCap="round";ctx.lineJoin="round";
      ctx.globalAlpha=0.9;ctx.stroke();ctx.globalAlpha=1;
    }
    strokes.forEach((pts2,si2)=>{
      ctx.beginPath();ctx.arc(pts2[0][0]*sx,pts2[0][1]*sy,5*sx,0,Math.PI*2);ctx.fillStyle="#fbbf24";ctx.fill();
      ctx.font=`bold ${10*sx}px Arial`;ctx.fillStyle="#92400e";
      ctx.fillText(si2+1,pts2[0][0]*sx+8*sx,pts2[0][1]*sy-4*sy);
    });
  },[strokes,W,H]);

  const calcScore=useCallback(()=>{
    const pts=freePoints.current.filter(p=>p);if(pts.length<4)return 0;
    const TOL=18;

    // Accuracy: weighted by how close each drawn point is to the template
    let weightedAcc=0;
    for(const p of pts){
      const d=distToPolyline(p.x,p.y,strokes);
      if(d<=TOL*0.5) weightedAcc+=1;
      else if(d<=TOL) weightedAcc+=(1-(d-TOL*0.5)/(TOL*0.5));
    }
    const accuracy=pts.length>0?weightedAcc/pts.length:0;

    // Coverage: how much of the template arc was visited
    const templatePts=strokes.flatMap(s=>s);
    let covered=0;
    for(const tp of templatePts){
      const near=pts.reduce((b,p)=>Math.min(b,Math.hypot(p.x-tp[0],p.y-tp[1])),Infinity);
      if(near<TOL*1.4) covered++;
    }
    const coverage=templatePts.length>0?covered/templatePts.length:0;

    // Length ratio penalty
    let drawnLen=0;
    for(let i=1;i<pts.length;i++) drawnLen+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);
    let templateLen=0;
    for(const s of strokes) for(let i=1;i<s.length;i++) templateLen+=Math.hypot(s[i][0]-s[i-1][0],s[i][1]-s[i-1][1]);
    const ratio=templateLen>0?drawnLen/templateLen:1;
    const lengthPenalty=ratio>2.0?Math.min(1,(ratio-2.0)/3.0):0;

    const raw=(accuracy*0.50+coverage*0.40)*(1-lengthPenalty*0.10);
    return Math.round(raw*100);
  },[strokes]);

  const reset=useCallback(()=>{
    reportG(false);reported.current=false;firstTouch.current=null;
    requestAnimationFrame(ts=>{onsetRef.current=ts;});
    strokeIdx.current=0;progressRef.current=0;
    isDrawing.current=false;strokeStarted.current=false;lastSnapped.current=null;currentStrokePts.current=[];
    freeLastPos.current=null;freePoints.current=[];freeStrokeIdx.current=0;freeStrokePts.current=[];
    setPhase("guided");setConfetti(false);setHasDrawn(false);setScoreInfo({score:0,label:"",color:"#374151"});
    setStatusMsg("👆 Tippe auf den gelben Punkt um zu starten!");
    const bg=bgRef.current;const ov=ovRef.current;if(!bg||!ov)return;
    ov.getContext("2d").clearRect(0,0,W,H);drawGuidedTemplate(bg.getContext("2d"));
  },[drawGuidedTemplate,W,H]);

  useEffect(()=>{reset();},[letter]);
  // Nach „Neu" aus dem Vergleich: Vorlage für den geführten Teil neu zeichnen
  useEffect(()=>{if(phase==="guided"&&bgRef.current)drawGuidedTemplate(bgRef.current.getContext("2d"));},[phase]);

  useEffect(()=>{
    if(phase!=="compare")return;
    requestAnimationFrame(()=>requestAnimationFrame(()=>drawComparison()));
  },[phase,drawComparison]);

  const getPos=(e)=>{
    const c=ovRef.current;const rect=c.getBoundingClientRect();
    const sx=W/rect.width,sy=H/rect.height;const src=e.touches?e.touches[0]:e;
    return{x:(src.clientX-rect.left)*sx,y:(src.clientY-rect.top)*sy};
  };

  // ── Phase 1: guided (snap to rail) ───────────────────────────────────────────
  const nearStart=(px,py)=>{const si=strokeIdx.current;if(si>=strokes.length)return false;return Math.hypot(px-strokes[si][0][0],py-strokes[si][0][1])<28;};
  const snap=(px,py)=>{
    const si=strokeIdx.current;if(si>=strokes.length)return null;
    const pts=strokes[si];const from=Math.max(0,progressRef.current-1),to=Math.min(pts.length-1,progressRef.current+6);
    let best=null,bestD=Infinity;
    for(let i=from;i<=to;i++){const d=Math.hypot(px-pts[i][0],py-pts[i][1]);if(d<bestD){bestD=d;best=i;}}
    return best!==null?{idx:best,pt:pts[best]}:null;
  };
  const guidedStart=(e)=>{
    e.preventDefault();if(phase!=="guided")return;
    if(firstTouch.current==null)firstTouch.current=e.timeStamp||performance.now();
    const pos=getPos(e);
    if(!strokeStarted.current){
      if(nearStart(pos.x,pos.y)){
        strokeStarted.current=true;isDrawing.current=true;currentStrokePts.current=[];
        const sp=strokes[strokeIdx.current][0];lastSnapped.current={x:sp[0],y:sp[1]};
        currentStrokePts.current.push({x:sp[0],y:sp[1]});
        const m=`✏️ Strich ${strokeIdx.current+1}/${strokes.length} — ziehe entlang!`;setStatusMsg(m);onSpeak(m);
        drawGuidedTemplate(bgRef.current.getContext("2d"));
      } else {setStatusMsg("👆 Starte beim orangen Punkt!");onSpeak("Starte beim orangen Punkt!");}
      return;
    }
    isDrawing.current=true;
  };
  const guidedMove=(e)=>{
    e.preventDefault();if(!isDrawing.current||!strokeStarted.current||phase!=="guided")return;
    const ctx=ovRef.current.getContext("2d");const pos=getPos(e);const s=snap(pos.x,pos.y);if(!s)return;
    if(s.idx>progressRef.current)progressRef.current=s.idx;
    const sp=s.pt;
    if(lastSnapped.current){
      ctx.beginPath();ctx.moveTo(lastSnapped.current.x,lastSnapped.current.y);ctx.lineTo(sp[0],sp[1]);
      ctx.strokeStyle="#4361ee";ctx.lineWidth=11;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
      ctx.beginPath();ctx.arc(sp[0],sp[1],9,0,Math.PI*2);ctx.fillStyle="#fbbf2450";ctx.fill();
      ctx.beginPath();ctx.arc(sp[0],sp[1],4,0,Math.PI*2);ctx.fillStyle="#fbbf24";ctx.fill();
    }
    lastSnapped.current={x:sp[0],y:sp[1]};currentStrokePts.current.push({x:sp[0],y:sp[1]});
    drawGuidedTemplate(bgRef.current.getContext("2d"));
    const pts=strokes[strokeIdx.current];
    if(progressRef.current>=pts.length-3){
      currentStrokePts.current=[];strokeStarted.current=false;isDrawing.current=false;progressRef.current=0;lastSnapped.current=null;
      setAnimalBounce(true);setTimeout(()=>setAnimalBounce(false),400);
      strokeIdx.current++;
      if(strokeIdx.current>=strokes.length){
        setConfetti(true);setTimeout(()=>setConfetti(false),1500);
        setTimeout(()=>{
          freePoints.current=[];freeStrokeIdx.current=0;freeStrokePts.current=[];
          ovRef.current.getContext("2d").clearRect(0,0,W,H);
          drawFreeTemplate(bgRef.current.getContext("2d"));
          setPhase("freeTrace");
          const m=`✏️ Jetzt selbst — Strich 1 von ${strokes.length}!`;setStatusMsg(m);onSpeak(m);
        },900);
      } else {
        const m="👆 Tippe auf den nächsten Punkt!";setStatusMsg(m);onSpeak(m);
        drawGuidedTemplate(bgRef.current.getContext("2d"));
      }
    }
  };
  const guidedEnd=(e)=>{e?.preventDefault();isDrawing.current=false;};

  // ── Phase 2: free stroke-by-stroke ───────────────────────────────────────────
  const freeStart=(e)=>{
    e.preventDefault();if(phase!=="freeTrace")return;
    isDrawing.current=true;const pos=getPos(e);
    freeLastPos.current=pos;freePoints.current.push(pos);freeStrokePts.current.push(pos);
  };
  const freeMove=(e)=>{
    e.preventDefault();if(!isDrawing.current||phase!=="freeTrace")return;
    const ctx=ovRef.current.getContext("2d");const pos=getPos(e);
    const TOL=18;let minD=Infinity;
    strokes.forEach(s=>{for(let k=1;k<s.length;k++){
      const ax=s[k-1][0],ay=s[k-1][1],bx=s[k][0],by=s[k][1];
      const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
      const t=len===0?0:Math.max(0,Math.min(1,((pos.x-ax)*dx+(pos.y-ay)*dy)/len));
      const d=Math.hypot(pos.x-(ax+t*dx),pos.y-(ay+t*dy));if(d<minD)minD=d;
    }});
    const ratio=Math.min(1,minD/TOL);
    const r=Math.round(ratio*239+(1-ratio)*34),g2=Math.round(ratio*68+(1-ratio)*197),b=Math.round(ratio*68+(1-ratio)*94);
    if(freeLastPos.current){
      ctx.beginPath();ctx.moveTo(freeLastPos.current.x,freeLastPos.current.y);ctx.lineTo(pos.x,pos.y);
      ctx.strokeStyle=`rgb(${r},${g2},${b})`;ctx.lineWidth=10;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
    }
    freePoints.current.push(pos);freeStrokePts.current.push(pos);freeLastPos.current=pos;
    drawFreeTemplate(bgRef.current.getContext("2d"));
  };
  const freeEnd=(e)=>{
    e?.preventDefault();isDrawing.current=false;freeLastPos.current=null;freePoints.current.push(null);
    if(freeStrokePts.current.length<3){freeStrokePts.current=[];return;}
    freeStrokePts.current=[];
    const next=freeStrokeIdx.current+1;
    if(next<strokes.length){
      freeStrokeIdx.current=next;
      drawFreeTemplate(bgRef.current.getContext("2d"));
      const m=`✏️ Strich ${next+1} von ${strokes.length}!`;setStatusMsg(m);onSpeak(m);
      setHasDrawn(false);
    } else {
      setHasDrawn(true);const m="✓ Super! Tippe auf Fertig!";setStatusMsg(m);onSpeak(m);
    }
  };

  const finishFree=()=>{
    const pct=calcScore();
    const label=pct>=90?"🌟 Ausgezeichnet!":pct>=70?"👍 Sehr gut!":pct>=50?"😊 Gut gemacht!":"💪 Weiter üben!";
    const color=pct>=90?"#16a34a":pct>=70?"#4361ee":pct>=50?"#f59e0b":"#f97316";
    setScoreInfo({score:pct,label,color});setPhase("compare");
    reportG(true,{score_raw:pct/100,stars:Math.max(1,Math.round(pct/20)),n_strokes:strokes.length});
    setTimeout(()=>onComplete(Math.max(1,Math.round(pct/20))),1800);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <div style={{fontSize:12,color:"#475569",background:phase==="freeTrace"?"#f0fdf4":"#eff6ff",borderRadius:12,padding:"5px 16px",border:`1px solid ${phase==="freeTrace"?"#bbf7d0":"#bfdbfe"}`,fontWeight:600,minHeight:28,textAlign:"center",transition:"all 0.3s"}}>
        {statusMsg}
      </div>
      <div style={{position:"relative"}}>
        <div style={{background:"#1e1b4b",borderRadius:24,padding:10,boxShadow:"0 8px 32px #1e1b4b50"}}>
          <div style={{position:"relative",width:W*scale,height:H*scale,borderRadius:16,overflow:"hidden",background:"#fafafa"}}>
            <canvas ref={bgRef} width={W*k} height={H*k} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>
            {phase!=="compare"&&(
              <canvas ref={ovRef} width={W*k} height={H*k}
                style={{position:"absolute",inset:0,width:"100%",height:"100%",touchAction:"none",cursor:"crosshair"}}
                onMouseDown={phase==="guided"?guidedStart:freeStart}
                onMouseMove={phase==="guided"?guidedMove:freeMove}
                onMouseUp={phase==="guided"?guidedEnd:freeEnd}
                onMouseLeave={phase==="guided"?guidedEnd:freeEnd}
                onTouchStart={phase==="guided"?guidedStart:freeStart}
                onTouchMove={phase==="guided"?guidedMove:freeMove}
                onTouchEnd={phase==="guided"?guidedEnd:freeEnd}/>
            )}
            {phase==="compare"&&(
              <div style={{position:"absolute",inset:0,borderRadius:16,overflow:"hidden",background:"#f8fafc"}}>
                <canvas ref={compareRef} width={W*k} height={H*k} style={{display:"block",width:"100%",height:"100%"}}/>
                <div style={{position:"absolute",top:0,left:0,right:0,display:"flex",justifyContent:"center",gap:10,padding:"5px 8px",background:"rgba(255,255,255,0.92)",borderBottom:"1px solid #e2e8f0",fontSize:10,fontWeight:700}}>
                  <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:14,height:5,borderRadius:3,background:"rgba(180,180,200,0.7)",display:"inline-block"}}/>Vorlage</span>
                  <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:14,height:5,borderRadius:3,background:"#22c55e",display:"inline-block"}}/>Genau</span>
                  <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:14,height:5,borderRadius:3,background:"#ef4444",display:"inline-block"}}/>Abweichung</span>
                </div>
                <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"6px 12px",background:"rgba(255,255,255,0.92)",borderTop:"1px solid #e2e8f0",textAlign:"center"}}>
                  <span style={{fontSize:16,fontWeight:900,color:scoreInfo.color}}>{scoreInfo.label}</span>
                  <span style={{fontSize:11,color:"#6b7280",marginLeft:8}}>({scoreInfo.score}%)</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{position:"absolute",bottom:-14,right:-14,fontSize:38,transform:animalBounce?"scale(1.4) rotate(-12deg)":"scale(1)",transition:"transform 0.25s cubic-bezier(.34,1.56,.64,1)",userSelect:"none"}}>{animal}</div>
        {confetti&&<Confetti/>}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={reset} style={{padding:"8px 16px",borderRadius:20,border:"2px solid #f87171",background:"white",color:"#ef4444",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>🗑️ Neu</button>
        {phase==="freeTrace"&&hasDrawn&&(
          <button onClick={finishFree} style={{padding:"8px 16px",borderRadius:20,border:"none",background:"linear-gradient(135deg,#4ade80,#16a34a)",color:"white",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>✓ Fertig</button>
        )}
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// FORSCHUNG — Teilnahme im Elternbereich, Zustimmung des Kindes, Schreibtest
// ═══════════════════════════════════════════════════════════════════════════════
const fmtCode=(pid)=>pid?`${pid.slice(0,3)}-${pid.slice(3)}`:"";
const studyBtn=(bg,fg="white",border="none")=>({width:"100%",padding:10,background:bg,color:fg,border,borderRadius:14,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Arial,sans-serif",marginTop:6});

function StudySection({onStartProbe}){
  const rs=useResearch();
  const [open,setOpen]=useState(false);
  const [msg,setMsg]=useState(null);
  const [busy,setBusy]=useState(false);
  if(!rs.available&&!msg)return null;
  const doneCount=Object.keys(rs.wavesDone||{}).length;
  return(
    <div style={{marginBottom:14,paddingBottom:14,borderBottom:"1px solid #e2e8f0"}}>
      <h4 style={{margin:"0 0 6px",fontSize:14,fontWeight:800,color:"#1e3a8a"}}>🔬 Forschung</h4>
      {msg&&<p style={{fontSize:12,color:"#0f766e",background:"#f0fdfa",borderRadius:10,padding:"6px 10px",margin:"0 0 8px"}}>{msg}</p>}
      {rs.available&&!rs.enrolled&&(
        <>
          <p style={{fontSize:12,color:"#475569",margin:"0 0 6px",lineHeight:1.5}}>
            <b>{rs.studyTitle}</b> — Mit Ihrer Einwilligung sendet die App pseudonyme Messwerte (z. B. Reaktionszeiten und Genauigkeit) an das Studienteam. Die Teilnahme ist freiwillig und jederzeit beendbar.
          </p>
          <button onClick={()=>setOpen(true)} style={studyBtn("#0f766e")}>Mehr erfahren und teilnehmen</button>
        </>
      )}
      {rs.enrolled&&(
        <>
          <div style={{background:"#f0fdfa",borderRadius:12,padding:10,fontSize:12,lineHeight:1.7,color:"#134e4a"}}>
            <div>Teilnahmecode: <b style={{fontSize:15,letterSpacing:1}}>{fmtCode(rs.pid)}</b></div>
            <div>Studientag {rs.day} · Schreibtests {doneCount} von {rs.waves.length}</div>
            <div>{rs.pending?`${rs.pending} Messungen warten auf das Senden`:"Alle Messungen gesendet"}</div>
          </div>
          {rs.dueWave!=null&&<button onClick={onStartProbe} style={studyBtn("#0f766e")}>🔬 Schreibtest jetzt starten</button>}
          <button disabled={busy} onClick={async()=>{setBusy(true);try{await exportMyData();}catch{setMsg("Herunterladen hat nicht geklappt. Bitte mit Internet erneut versuchen.");}setBusy(false);}}
            style={studyBtn("white","#0f766e","2px solid #99f6e4")}>📥 Meine Studiendaten herunterladen</button>
          <button disabled={busy} onClick={async()=>{
              if(!window.confirm("Teilnahme wirklich beenden? Alle Studiendaten Ihres Kindes werden auf dem Server gelöscht."))return;
              setBusy(true);
              try{await withdraw();setMsg("Die Teilnahme ist beendet und alle Studiendaten sind gelöscht.");}
              catch{setMsg(`Löschen hat nicht geklappt. Bitte mit Internet erneut versuchen${rs.contact?` oder mit dem Teilnahmecode an ${rs.contact} schreiben`:""}.`);}
              setBusy(false);
            }}
            style={studyBtn("white","#ef4444","2px solid #fecaca")}>Teilnahme beenden und Daten löschen</button>
        </>
      )}
      {open&&<StudyEnroll onClose={()=>setOpen(false)} onStartProbe={onStartProbe}/>}
    </div>
  );
}

function StudyEnroll({onClose,onStartProbe}){
  const rs=useResearch();
  const [step,setStep]=useState("info");   // info | consent | data | child | sending | done | declined
  const [c,setC]=useState({custody:false,consent:false,voluntary:false,traces:false});
  const now=new Date();
  const [d,setD]=useState({month:"",year:"",grade:"",handedness:"",homeLang:"",gender:"keine_angabe"});
  const [err,setErr]=useState(null);
  const ageMonths=d.month&&d.year?(now.getFullYear()-Number(d.year))*12+(now.getMonth()+1-Number(d.month)):null;
  const ageOk=ageMonths!=null&&ageMonths>=48&&ageMonths<=107;
  const dataOk=ageOk&&d.grade&&d.handedness&&d.homeLang;
  const send=async()=>{
    setStep("sending");setErr(null);
    try{
      await enroll({ageMonths,grade:d.grade,handedness:d.handedness,homeLang:d.homeLang,gender:d.gender,traces:c.traces});
      setStep("done");
    }catch{setErr("Keine Verbindung zum Studienserver. Bitte mit Internet erneut versuchen.");setStep("child");}
  };
  const box={background:"white",borderRadius:24,padding:20,maxWidth:440,width:"100%",maxHeight:"88vh",overflowY:"auto",position:"relative",boxShadow:"0 20px 60px #0004",fontFamily:"Arial,sans-serif",color:"#334155"};
  const p={fontSize:13,lineHeight:1.55,margin:"0 0 8px"};
  const check=(k,label)=>(
    <label style={{display:"flex",gap:9,alignItems:"flex-start",fontSize:13,lineHeight:1.45,marginBottom:10,cursor:"pointer"}}>
      <input type="checkbox" checked={c[k]} onChange={e=>setC({...c,[k]:e.target.checked})} style={{width:18,height:18,marginTop:1,flexShrink:0}}/>
      <span>{label}</span>
    </label>
  );
  const select=(k,label,opts)=>(
    <label style={{display:"block",fontSize:12,fontWeight:700,margin:"0 0 8px"}}>{label}
      <select value={d[k]} onChange={e=>setD({...d,[k]:e.target.value})} style={{display:"block",width:"100%",marginTop:3,padding:8,borderRadius:10,border:"2px solid #e2e8f0",fontSize:13,fontFamily:"Arial,sans-serif"}}>
        <option value="">Bitte wählen</option>
        {opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
  const years=Array.from({length:8},(_,i)=>now.getFullYear()-3-i);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2100,padding:16}}>
      <div style={box}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
        {step==="info"&&(<>
          <h3 style={{margin:"0 0 10px",fontSize:18,color:"#0f766e"}}>🔬 {rs.studyTitle}</h3>
          <p style={p}><b>Worum geht es?</b> Wir möchten herausfinden, ob Kinder Buchstaben besser lernen, wenn die App ihre Hilfe Schritt für Schritt abbaut.</p>
          <p style={p}><b>Ablauf:</b> Ihr Kind übt wie gewohnt. Dazu kommen drei kurze Schreibtests von 3 bis 5 Minuten: heute, nach 4 und nach 8 Wochen.</p>
          <p style={p}><b>Zwei Gruppen:</b> Der Zufall teilt Ihr Kind einer Gruppe zu. In einer Gruppe gibt es bis zum Studienende nur „Geführt“ und „Nachfahren“, danach alle Übungen.</p>
          <p style={p}><b>Welche Daten?</b> Messwerte wie Reaktionszeit, Schreibdauer und Genauigkeit sowie Alter in Monaten, Klassenstufe, Händigkeit und Familiensprache. Kein Name, keine E-Mail, keine IP-Adresse in der Datenbank.</p>
          <p style={p}><b>Freiwillig:</b> Sie können jederzeit hier im Elternbereich aufhören. Dann werden alle Studiendaten gelöscht.</p>
          {rs.infoUrl&&<p style={p}><a href={rs.infoUrl} target="_blank" rel="noreferrer" style={{color:"#0f766e",fontWeight:700}}>Vollständige Elterninformation lesen</a></p>}
          <button onClick={()=>setStep("consent")} style={studyBtn("#0f766e")}>Weiter</button>
        </>)}
        {step==="consent"&&(<>
          <h3 style={{margin:"0 0 12px",fontSize:17,color:"#0f766e"}}>Einwilligung</h3>
          {check("custody","Ich bin sorgeberechtigt für das Kind, das die App nutzt.")}
          {check("consent","Ich habe die Elterninformation gelesen und willige ein, dass die dort beschriebenen Daten meines Kindes pseudonym für die Studie verarbeitet werden.")}
          {check("voluntary","Ich weiß, dass die Teilnahme freiwillig ist und ich sie jederzeit ohne Nachteile beenden kann.")}
          <div style={{borderTop:"1px solid #e2e8f0",margin:"6px 0 10px"}}/>
          {check("traces","Freiwillig zusätzlich: Die Schreibspuren (Linien mit Zeitstempeln) dürfen gespeichert werden.")}
          <button disabled={!(c.custody&&c.consent&&c.voluntary)} onClick={()=>setStep("data")}
            style={{...studyBtn(c.custody&&c.consent&&c.voluntary?"#0f766e":"#cbd5e1")}}>Weiter</button>
        </>)}
        {step==="data"&&(<>
          <h3 style={{margin:"0 0 6px",fontSize:17,color:"#0f766e"}}>Angaben zum Kind</h3>
          <p style={{...p,fontSize:12,color:"#64748b"}}>Monat und Jahr der Geburt bleiben auf diesem Gerät. Gesendet wird nur das Alter in Monaten.</p>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1}}>{select("month","Geburtsmonat",Array.from({length:12},(_,i)=>[String(i+1),String(i+1).padStart(2,"0")]))}</div>
            <div style={{flex:1}}>{select("year","Geburtsjahr",years.map(y=>[String(y),String(y)]))}</div>
          </div>
          {ageMonths!=null&&!ageOk&&<p style={{...p,fontSize:12,color:"#b91c1c"}}>Die Studie richtet sich an Kinder von 4 bis 8 Jahren.</p>}
          {select("grade","Kita oder Schule",[["kita","Kita / Vorschuljahr"],["k1","Klasse 1"],["k2","Klasse 2"],["andere","Anderes"]])}
          {select("handedness","Schreibhand",[["rechts","Rechts"],["links","Links"],["beide","Mal so, mal so"],["unklar","Noch nicht klar"]])}
          {select("homeLang","Sprache in der Familie",[["deutsch","Deutsch"],["teilweise","Deutsch und eine andere Sprache"],["andere","Eine andere Sprache"],["keine_angabe","Keine Angabe"]])}
          {select("gender","Geschlecht (freiwillig)",[["keine_angabe","Keine Angabe"],["w","Mädchen"],["m","Junge"],["d","Divers"]])}
          <button disabled={!dataOk} onClick={()=>setStep("child")} style={studyBtn(dataOk?"#0f766e":"#cbd5e1")}>Weiter — jetzt das Kind fragen</button>
        </>)}
        {step==="child"&&(<>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:56}}>🔬✏️</div>
            <p style={{fontSize:17,fontWeight:800,color:"#1e3a8a",margin:"8px 0",lineHeight:1.4}}>Hallo! Wir möchten herausfinden, wie Kinder am besten schreiben lernen.</p>
            <p style={{fontSize:15,color:"#334155",margin:"0 0 6px",lineHeight:1.4}}>Darf die App sich merken, wie du schreibst? Du kannst jederzeit aufhören.</p>
            <p style={{fontSize:11,color:"#64748b",margin:"0 0 12px"}}>(Bitte lesen Sie Ihrem Kind diese Frage vor.)</p>
            {err&&<p style={{fontSize:12,color:"#b91c1c"}}>{err}</p>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={send} style={{flex:1,padding:"16px 8px",borderRadius:18,border:"none",background:"#22c55e",color:"white",fontSize:20,fontWeight:900,cursor:"pointer"}}>👍 Ja</button>
              <button onClick={()=>setStep("declined")} style={{flex:1,padding:"16px 8px",borderRadius:18,border:"none",background:"#94a3b8",color:"white",fontSize:20,fontWeight:900,cursor:"pointer"}}>👎 Nein</button>
            </div>
          </div>
        </>)}
        {step==="sending"&&<p style={{textAlign:"center",fontSize:15,padding:30}}>Einen Moment …</p>}
        {step==="declined"&&(<>
          <p style={{fontSize:16,textAlign:"center",lineHeight:1.5,margin:"20px 0"}}>👍 Alles gut! Dann machen wir nicht mit. Die App funktioniert ganz normal weiter.</p>
          <button onClick={onClose} style={studyBtn("#0f766e")}>Schließen</button>
        </>)}
        {step==="done"&&(<>
          <h3 style={{margin:"0 0 8px",fontSize:17,color:"#0f766e"}}>Danke für die Teilnahme!</h3>
          <p style={p}>Ihr Teilnahmecode:</p>
          <div style={{fontSize:30,fontWeight:900,letterSpacing:3,textAlign:"center",background:"#f0fdfa",borderRadius:14,padding:12,color:"#134e4a"}}>{fmtCode(rs.pid)}</div>
          <p style={{...p,marginTop:8,fontSize:12}}>Bitte notieren Sie den Code. Sie brauchen ihn, wenn Sie Fragen haben oder die Daten löschen lassen möchten.</p>
          <p style={p}>Am besten macht Ihr Kind jetzt den ersten kurzen Schreibtest.</p>
          <button onClick={()=>{onClose();onStartProbe();}} style={studyBtn("#0f766e")}>🔬 Ersten Schreibtest starten</button>
          <button onClick={onClose} style={studyBtn("white","#0f766e","2px solid #99f6e4")}>Später</button>
        </>)}
      </div>
    </div>
  );
}

// Schreibtest: Zeichen aus dem Gedächtnis, ohne Vorlage und ohne Rückmeldung
function probePrompt(ch){
  const name=LETTER_NAMES[ch]||ch;
  if(NUMBERS.includes(ch))return`Schreib die Zahl ${name}.`;
  const a=anlautOf(ch);const wie=a?`, wie ${a[2]?"in ":""}${a[1]}`:"";
  if(ch==="ß")return`Schreib das Eszett${wie}.`;
  return UPPERCASE.includes(ch)?`Schreib das große ${name}${wie}.`:`Schreib das kleine ${name.replace("kleines ","")}${wie}.`;
}
function ProbeTest({wave,chars,difficulty,scale,onSpeak,onLog,onFinish,onExit}){
  const [order]=useState(()=>{const a=[...chars];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;});
  const [i,setI]=useState(-1);
  const ch=order[i];
  useEffect(()=>{if(ch)onSpeak(probePrompt(ch));},[i]);
  const page={minHeight:"100vh",background:"linear-gradient(160deg,#ecfeff,#f0fdfa)",fontFamily:"Arial,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",padding:12,gap:10};
  const big={padding:"14px 28px",borderRadius:18,border:"none",background:"#0f766e",color:"white",fontWeight:900,fontSize:17,cursor:"pointer",fontFamily:"Arial,sans-serif"};
  if(i<0)return(
    <div style={{...page,justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:64}}>🔬</div>
      <h2 style={{margin:0,color:"#134e4a"}}>Kleiner Schreibtest</h2>
      <p style={{maxWidth:320,color:"#334155",lineHeight:1.5,fontSize:15}}>Ich zeige dir ein Bild und sage dir einen Buchstaben oder eine Zahl. Schreib ihn so gut du kannst — ganz ohne Vorlage. Wenn du ihn nicht weißt, tippe auf 🤷.</p>
      <button onClick={()=>setI(0)} style={big}>Los geht's!</button>
      <button onClick={onExit} style={{background:"none",border:"none",color:"#64748b",fontSize:13,cursor:"pointer",marginTop:6}}>Später</button>
    </div>
  );
  if(i>=order.length)return(
    <div style={{...page,justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:72}}>🎉</div>
      <h2 style={{margin:0,color:"#134e4a"}}>Danke! Du hast toll mitgemacht.</h2>
      <button onClick={onFinish} style={{...big,marginTop:12}}>Zurück zum Menü</button>
    </div>
  );
  const a=anlautOf(ch);
  return(
    <div style={page}>
      <div style={{display:"flex",alignItems:"center",gap:8,width:"100%",maxWidth:480}}>
        <button onClick={onExit} style={{background:"white",border:"1px solid #e2e8f0",borderRadius:50,width:36,height:36,fontSize:16,cursor:"pointer"}}>←</button>
        <div style={{flex:1,height:10,background:"#ccfbf1",borderRadius:6,overflow:"hidden"}}>
          <div style={{width:`${i/order.length*100}%`,height:"100%",background:"#14b8a6",transition:"width 0.3s"}}/>
        </div>
        <span style={{fontSize:12,fontWeight:800,color:"#0f766e"}}>{i+1}/{order.length}</span>
      </div>
      <button onClick={()=>onSpeak(probePrompt(ch))} style={{display:"flex",alignItems:"center",gap:12,background:"white",border:"2px solid #99f6e4",borderRadius:18,padding:"8px 18px",cursor:"pointer"}}>
        <span style={{fontSize:a?44:20,lineHeight:1.1,maxWidth:130,display:"inline-block",wordBreak:"break-all"}}>{a?a[0]:ch==="0"?"⭕":"●".repeat(Number(ch))}</span>
        <span style={{fontSize:22}}>🔊</span>
      </button>
      <TraceCanvas key={`probe-${i}`} letter={ch} mode="probe" difficulty={difficulty} scale={scale}
        onTrial={t=>onLog({...t,kind:"probe",wave,ch})}
        onComplete={()=>setTimeout(()=>setI(n=>n+1),250)}/>
    </div>
  );
}

function ParentZone({settings,onChange,onClose,journal,onStartProbe}){
  const [access,setAccess]=useState(false);
  const [ans,setAns]=useState("");
  const [err,setErr]=useState(false);
  const [tipIdx,setTipIdx]=useState(0);
  const [math]=useState(()=>{const a=Math.floor(Math.random()*10)+3,b=Math.floor(Math.random()*10)+3;return{a,b,ans:a+b};});

  useEffect(()=>{const t=setInterval(()=>setTipIdx(i=>(i+1)%EDU_TIPS.length),7000);return()=>clearInterval(t);},[]);

  const overlay={position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,backdropFilter:"blur(4px)",padding:16};

  if(!access) return(
    <div style={overlay}>
      <div style={{background:"white",borderRadius:24,padding:24,maxWidth:360,width:"100%",position:"relative",boxShadow:"0 20px 60px #0003",textAlign:"center"}}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
        <div style={{fontSize:36,marginBottom:8}}>🔒</div>
        <h3 style={{margin:"0 0 4px",fontSize:18,fontWeight:900,color:"#1e3a8a",fontFamily:"Arial,sans-serif"}}>Elternbereich</h3>
        <p style={{fontSize:13,color:"#64748b",margin:"0 0 16px"}}>Bitte löse die Aufgabe:</p>
        <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center",marginBottom:12}}>
          <span style={{fontSize:22,fontWeight:900,color:"#1e3a8a"}}>{math.a}</span>
          <span style={{fontSize:18,color:"#64748b"}}>+</span>
          <span style={{fontSize:22,fontWeight:900,color:"#1e3a8a"}}>{math.b}</span>
          <span style={{fontSize:18,color:"#64748b"}}>=</span>
          <input value={ans} onChange={e=>setAns(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(parseInt(ans)===math.ans?setAccess(true):setErr(true))}
            style={{width:56,padding:"8px",fontSize:18,border:`2px solid ${err?"#ef4444":"#e2e8f0"}`,borderRadius:10,textAlign:"center",fontFamily:"Arial,sans-serif"}}/>
        </div>
        {err&&<p style={{color:"#ef4444",fontSize:12,margin:"0 0 10px"}}>✗ Leider falsch — nochmal!</p>}
        <button onClick={()=>parseInt(ans)===math.ans?setAccess(true):setErr(true)}
          style={{width:"100%",padding:12,background:"#1e3a8a",color:"white",border:"none",borderRadius:14,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>
          Zugang erhalten
        </button>
      </div>
    </div>
  );

  const tip=EDU_TIPS[tipIdx];
  return(
    <div style={overlay}>
      <div style={{background:"white",borderRadius:24,padding:20,maxWidth:480,width:"100%",maxHeight:"88vh",overflowY:"auto",position:"relative",boxShadow:"0 20px 60px #0003"}}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
        <div style={{fontSize:28,marginBottom:4}}>👨‍👩‍👧</div>
        <h3 style={{margin:"0 0 2px",fontSize:18,fontWeight:900,color:"#1e3a8a",fontFamily:"Arial,sans-serif"}}>Elternbereich</h3>
        <p style={{fontSize:12,color:"#64748b",margin:"0 0 16px"}}>Pädagogische Einstellungen</p>

        {/* Edu tip */}
        <div style={{background:"#fef3c7",borderRadius:16,padding:14,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{fontSize:22}}>{tip.icon}</span>
            <span style={{fontWeight:800,fontSize:13,color:"#78350f"}}>{tip.title}</span>
          </div>
          <p style={{fontSize:12,color:"#92400e",margin:"0 0 10px",lineHeight:1.5}}>{tip.text}</p>
          <div style={{display:"flex",gap:5,justifyContent:"center"}}>
            {EDU_TIPS.map((_,i)=><span key={i} style={{width:7,height:7,borderRadius:"50%",background:i===tipIdx?"#f59e0b":"#e2e8f0",display:"inline-block"}}/>)}
          </div>
        </div>

        {/* Difficulty */}
        <div style={{marginBottom:14,paddingBottom:14,borderBottom:"1px solid #e2e8f0"}}>
          <h4 style={{margin:"0 0 8px",fontSize:14,fontWeight:800,color:"#1e3a8a"}}>🎯 Schwierigkeitsgrad</h4>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {Object.entries(DIFFICULTY).map(([k,d])=>(
              <button key={k} onClick={()=>onChange({...settings,difficulty:k})} style={{padding:"10px 14px",borderRadius:12,border:`2px solid ${settings.difficulty===k?"#4361ee":"#e2e8f0"}`,background:settings.difficulty===k?"#4361ee":"white",color:settings.difficulty===k?"white":"#374151",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Arial,sans-serif",textAlign:"left"}}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Screen time */}
        <div style={{marginBottom:14,paddingBottom:14,borderBottom:"1px solid #e2e8f0"}}>
          <h4 style={{margin:"0 0 8px",fontSize:14,fontWeight:800,color:"#1e3a8a"}}>⏱️ Bildschirmzeit</h4>
          <select value={settings.screenTime} onChange={e=>onChange({...settings,screenTime:parseInt(e.target.value)})}
            style={{width:"100%",padding:10,borderRadius:10,border:"2px solid #e2e8f0",fontSize:13,fontFamily:"Arial,sans-serif"}}>
            {[5,10,15,20,30,0].map(v=><option key={v} value={v}>{v===0?"Keine Begrenzung":`${v} Minuten`}</option>)}
          </select>
          <p style={{fontSize:11,color:"#94a3b8",margin:"4px 0 0"}}>Nach dieser Zeit erscheint eine freundliche Pausenerinnerung.</p>
        </div>

        {/* Übungs-Modi */}
        <div style={{marginBottom:14,paddingBottom:14,borderBottom:"1px solid #e2e8f0"}}>
          <h4 style={{margin:"0 0 4px",fontSize:14,fontWeight:800,color:"#1e3a8a"}}>🖐️ Erlaubte Übungs-Modi</h4>
          <p style={{fontSize:11,color:"#94a3b8",margin:"0 0 10px"}}>Wähle welche Modi dein Kind sehen darf. Mit 4 oder 5 Sternen geht es pro Buchstabe eine Stufe weiter: geführt → abschreiben → aus dem Kopf.</p>
          {[
            {key:"guided", label:"🖐️ Geführt", desc:"Stift klebt auf der Linie — ideal für Anfänger", color:"#22c55e"},
            {key:"trace",  label:"✏️ Nachfahren", desc:"Frei nachzeichnen, Startpunkt und Richtung werden geprüft", color:"#4361ee"},
            {key:"copy",   label:"👀 Abschreiben", desc:"Vorlage steht daneben, das Schreibfeld ist leer", color:"#f97316"},
            {key:"memory", label:"🧠 Aus dem Kopf", desc:"Kurz ansehen, dann ohne Vorlage schreiben — der wirksamste Schritt", color:"#a855f7"},
          ].map(({key,label,desc,color})=>{
            const active=!!(settings.allowedModes||{})[key];
            return(
              <div key={key} onClick={()=>{
                // At least one mode must stay active
                const next={...(settings.allowedModes||{}), [key]:!active};
                if(!Object.values(next).some(Boolean)) return;
                onChange({...settings, allowedModes:next});
              }} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,border:`2px solid ${active?color:"#e2e8f0"}`,background:active?`${color}15`:"white",cursor:"pointer",marginBottom:6,transition:"all 0.15s"}}>
                <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${active?color:"#cbd5e1"}`,background:active?color:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:13,color:"white",fontWeight:900,transition:"all 0.15s"}}>
                  {active?"✓":""}
                </div>
                <div>
                  <div style={{fontWeight:800,fontSize:13,color:active?color:"#374151"}}>{label}</div>
                  <div style={{fontSize:11,color:"#6b7280"}}>{desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Barrierefreiheit */}
        <div style={{marginBottom:14,paddingBottom:14,borderBottom:"1px solid #e2e8f0"}}>
          <h4 style={{margin:"0 0 4px",fontSize:14,fontWeight:800,color:"#1e3a8a"}}>♿ Barrierefreiheit</h4>
          <p style={{fontSize:11,color:"#94a3b8",margin:"0 0 10px"}}>Anpassungen für unterschiedliche Bedürfnisse.</p>
          {[
            {k:"lefthanded",  label:"🤚 Linkshänder-Modus", desc:"Beschriftung links vom Punkt — die Hand verdeckt die Vorlage nicht"},
            {k:"highContrast",label:"🔲 Kontrastreiche Darstellung", desc:"Dunklere, dickere Vorlagenlinien"},
            {k:"hapticsEnabled",label:"📳 Vibrations-Feedback", desc:"Spürbarer Impuls bei Strichende und beim Verlassen der Linie"},
          ].map(({k,label,desc})=>(
            <label key={k} style={{display:"flex",alignItems:"flex-start",gap:9,fontSize:13,color:"#374151",marginBottom:10,cursor:"pointer"}}>
              <input type="checkbox" checked={!!settings[k]} onChange={e=>onChange({...settings,[k]:e.target.checked})} style={{width:17,height:17,marginTop:1,flexShrink:0}}/>
              <span>
                <span style={{fontWeight:700,display:"block"}}>{label}</span>
                <span style={{fontSize:11,color:"#6b7280"}}>{desc}</span>
              </span>
            </label>
          ))}
        </div>

        {/* Options */}
        <div style={{marginBottom:14,paddingBottom:14,borderBottom:"1px solid #e2e8f0"}}>
          <h4 style={{margin:"0 0 8px",fontSize:14,fontWeight:800,color:"#1e3a8a"}}>⚙️ Optionen</h4>
          {[["autoAdvance","Automatisch zum nächsten Buchstaben"],["speechEnabled","Vorlesen aktiviert"],["rewardVideos","Schatzkisten-Belohnungen erlauben"]].map(([k,label])=>(
            <label key={k} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#374151",marginBottom:8,cursor:"pointer"}}>
              <input type="checkbox" checked={!!settings[k]} onChange={e=>onChange({...settings,[k]:e.target.checked})} style={{width:16,height:16}}/>
              {label}
            </label>
          ))}
        </div>

        <StudySection onStartProbe={onStartProbe}/>

        {/* Stats */}
        <div style={{marginBottom:14}}>
          <h4 style={{margin:"0 0 8px",fontSize:14,fontWeight:800,color:"#1e3a8a"}}>📊 Lern-Einblicke</h4>
          <div style={{background:"#f8fafc",borderRadius:12,padding:12,fontSize:12,lineHeight:1.8}}>
            <div><b>Geübte Buchstaben:</b> {Object.values(settings.learnedMap||{}).filter(v=>v>0).length}</div>
            <div><b>Perfekte Buchstaben (5⭐):</b> {Object.values(settings.learnedMap||{}).filter(v=>v>=5).length}</div>
            <div><b>Gesamtpunkte:</b> {settings.totalScore||0}</div>
            <div><b>Lernstufe Abschreiben:</b> {Object.values(settings.stageMap||{}).filter(v=>v===2).length} · <b>Aus dem Kopf:</b> {Object.values(settings.stageMap||{}).filter(v=>v>=3).length}</div>
            <div><b>Sicher aus dem Kopf geschrieben:</b> {Object.values(settings.memMap||{}).filter(v=>v>0).length}</div>
          </div>
          {journal.length>0&&(
            <div style={{marginTop:10}}>
              <div style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:6}}>📖 Letzte Übungen:</div>
              {journal.slice(-5).reverse().map((e,i)=>(
                <div key={i} style={{padding:"5px 8px",borderLeft:"3px solid #fbbf24",background:"#fff7ed",marginBottom:3,fontSize:11,borderRadius:"0 6px 6px 0"}}>
                  <b>{e.letter}</b> — {e.stars}⭐ — {MODES[e.mode]?.label||""} — {e.time}
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={onClose} style={{width:"100%",padding:10,background:"#e2e8f0",border:"none",borderRadius:14,fontWeight:700,fontSize:13,cursor:"pointer",color:"#475569",fontFamily:"Arial,sans-serif"}}>
          Elternbereich schließen
        </button>
        <button onClick={()=>{if(window.confirm("Wirklich alle Fortschritte zurücksetzen? Das kann nicht rückgängig gemacht werden.")){clearPersisted();setTimeout(()=>window.location.reload(),120);}}} style={{width:"100%",padding:8,background:"white",border:"2px solid #f87171",borderRadius:14,fontWeight:700,fontSize:12,cursor:"pointer",color:"#ef4444",fontFamily:"Arial,sans-serif",marginTop:6}}>
          🗑️ Fortschritt zurücksetzen
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN TIME REMINDER
// ═══════════════════════════════════════════════════════════════════════════════
function ScreenTimeReminder({limit,onDismiss}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,backdropFilter:"blur(4px)"}}>
      <div style={{background:"white",borderRadius:28,padding:28,maxWidth:320,textAlign:"center",boxShadow:"0 20px 60px #0003",animation:"slideUp 0.4s ease"}}>
        <div style={{fontSize:56,marginBottom:10}}>🧘</div>
        <h3 style={{margin:"0 0 8px",fontSize:20,fontWeight:900,color:"#1e3a8a",fontFamily:"Arial,sans-serif"}}>Pausen-Zeit!</h3>
        <p style={{fontSize:14,color:"#6b7280",margin:"0 0 20px",lineHeight:1.6}}>Du hast jetzt {limit} Minuten toll geübt!<br/>Dein Gehirn freut sich über eine kleine Pause. 🌱</p>
        <button onClick={onDismiss} style={{width:"100%",padding:14,background:"linear-gradient(135deg,#4ade80,#16a34a)",color:"white",border:"none",borderRadius:18,fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"Arial,sans-serif",marginBottom:8}}>
          OK, mache Pause!
        </button>
        <button onClick={onDismiss} style={{background:"none",border:"none",color:"#94a3b8",fontSize:12,cursor:"pointer"}}>Noch 5 Minuten üben</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STICKER BOOK
// ═══════════════════════════════════════════════════════════════════════════════
function StickerBook({learnedMap}){
  const allLetters=[...UPPERCASE,...LOWERCASE,...NUMBERS];
  const perfect=allLetters.filter(l=>(learnedMap[l]||0)>=5);
  return(
    <div style={{background:"linear-gradient(135deg,#fef9c3,#fde68a)",borderRadius:20,padding:16}}>
      <div style={{fontSize:13,fontWeight:800,color:"#78350f",marginBottom:10}}>🎀 Sticker-Album — {perfect.length} gesammelt!</div>
      <div style={{fontSize:11,fontWeight:700,color:"#92400e",marginBottom:6}}>Großbuchstaben</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:5,marginBottom:10}}>
        {UPPERCASE.map(l=>{const have=(learnedMap[l]||0)>=5;return(<div key={l} title={have?`${l} — ${STICKERS[l]}`:`${l} noch nicht`} style={{textAlign:"center",fontSize:have?22:14,filter:have?"none":"grayscale(1) opacity(0.2)",transition:"all 0.4s"}}>{have?STICKERS[l]||"⭐":"⬜"}</div>);})}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:"#92400e",marginBottom:6}}>Kleinbuchstaben</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:5,marginBottom:10}}>
        {LOWERCASE.map(l=>{const have=(learnedMap[l]||0)>=5;return(<div key={l} title={have?`${l} — ${STICKERS[l]}`:`${l} noch nicht`} style={{textAlign:"center",fontSize:have?22:14,filter:have?"none":"grayscale(1) opacity(0.2)",transition:"all 0.4s"}}>{have?STICKERS[l]||"⭐":"⬜"}</div>);})}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:"#92400e",marginBottom:6}}>Zahlen</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:5}}>
        {NUMBERS.map(l=>{const have=(learnedMap[l]||0)>=5;return(<div key={l} title={have?`${l} — ${STICKERS[l]}`:`${l} noch nicht`} style={{textAlign:"center",fontSize:have?22:14,filter:have?"none":"grayscale(1) opacity(0.2)",transition:"all 0.4s"}}>{have?STICKERS[l]||"⭐":"⬜"}</div>);})}
      </div>
      {perfect.length===0&&<div style={{textAlign:"center",color:"#a16207",fontSize:13,marginTop:8}}>Erreiche 5 Sterne für einen Sticker! ✨</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOWER GARDEN
// ═══════════════════════════════════════════════════════════════════════════════
function FlowerGarden({learnedMap,tab}){
  const items=tab==="GROß"?UPPERCASE:tab==="klein"?LOWERCASE:NUMBERS;
  const flower=s=>s>=5?"🌻":s>=3?"🌼":s>=1?"🌱":"⬜";
  const learned=items.filter(l=>learnedMap[l]>0);
  const perfect=items.filter(l=>(learnedMap[l]||0)>=5);
  const avg=learned.length?(learned.reduce((a,l)=>a+(learnedMap[l]||0),0)/learned.length).toFixed(1):0;
  return(
    <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:20,padding:14,border:"1px solid #bbf7d0"}}>
      <div style={{fontSize:13,fontWeight:800,color:"#166534",marginBottom:8}}>🌿 Mein Garten — {tab}</div>
      <div style={{display:"flex",gap:14,marginBottom:10}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"#16a34a"}}>{learned.length}</div><div style={{fontSize:10,color:"#6b7280"}}>geübt</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"#f59e0b"}}>{perfect.length}</div><div style={{fontSize:10,color:"#6b7280"}}>perfekt 🌻</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"#6366f1"}}>⭐{avg}</div><div style={{fontSize:10,color:"#6b7280"}}>Ø</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(9,1fr)",gap:3}}>
        {items.map(l=><span key={l} title={`${l}: ${learnedMap[l]||0}⭐`} style={{fontSize:18,textAlign:"center"}}>{flower(learnedMap[l]||0)}</span>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LETTER GRID
// ═══════════════════════════════════════════════════════════════════════════════
// Anlaut-Karte neben dem Buchstaben: „🐭 Maus" mit hervorgehobenem Buchstaben
function AnlautChip({letter,onSay}){
  const a=anlautOf(letter);if(!a)return null;
  const [emoji,word]=a;
  const i=word.toLowerCase().indexOf(letter.toLowerCase());
  return(
    <button onClick={onSay} style={{display:"flex",alignItems:"center",gap:6,background:"white",border:"2px solid #e2e8f0",borderRadius:14,padding:"4px 10px",cursor:"pointer",fontFamily:"Arial,sans-serif",minWidth:0}}>
      <span style={{fontSize:24,lineHeight:1}}>{emoji}</span>
      <span style={{fontSize:15,fontWeight:700,color:"#475569",whiteSpace:"nowrap"}}>
        {i<0?word:<>{word.slice(0,i)}<span style={{color:"#4361ee",fontWeight:900,fontSize:18}}>{word[i]}</span>{word.slice(i+1)}</>}
      </span>
    </button>
  );
}

function LetterGrid({items,learnedMap,onSelect,current}){
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4}}>
      {items.map(item=>{
        const s=learnedMap[item]||0;const active=current===item;
        const bg=active?"#4361ee":s>=5?"#fde68a":s>=3?"#bbf7d0":s>=1?"#dbeafe":"white";
        const border=active?"2.5px solid #4361ee":s>=5?"2px solid #fbbf24":s>=3?"2px solid #4ade80":s>=1?"2px solid #93c5fd":"2px solid #e2e8f0";
        return(
          <button key={item} onClick={()=>onSelect(item)} style={{background:bg,border,borderRadius:10,padding:"6px 2px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:0,transform:active?"scale(1.12)":"scale(1)",transition:"all 0.12s",boxShadow:active?"0 4px 14px #4361ee40":"none"}}>
            <Glyph letter={item} height={30} weight={2.6} color={active?"white":s>0?"#14532d":"#374151"}/>
            {s>0&&<span style={{fontSize:7,lineHeight:1.2}}>{s>=5?"🌻":s>=3?"🌼":"🌱"}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORDS PANEL  — clickable cards to start writing practice
// ═══════════════════════════════════════════════════════════════════════════════
function WordsPanel({learnedMap, onPractice}){
  const learned=new Set(Object.keys(learnedMap).filter(k=>learnedMap[k]>0).map(k=>k.toUpperCase()));
  const available=WORDS.filter(w=>w.letters.every(l=>learned.has(l)));
  const almost=WORDS.filter(w=>!w.letters.every(l=>learned.has(l))&&w.letters.filter(l=>!learned.has(l)).length<=2);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {available.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:"12px 0",fontSize:14}}>Lerne mehr Buchstaben! 🔒</div>}
      {available.length>0&&(
        <div>
          <div style={{fontSize:13,fontWeight:800,color:"#78350f",marginBottom:8}}>✅ Freigeschaltet — tippe zum Schreiben üben!</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
            {available.map(w=>(
              <button key={w.word} onClick={()=>onPractice(w)}
                style={{background:"linear-gradient(135deg,#fef3c7,#fde68a)",borderRadius:14,padding:"10px 16px",textAlign:"center",border:"2px solid #fbbf24",cursor:"pointer",boxShadow:"0 2px 8px #f59e0b20",transition:"transform 0.1s"}}
                onMouseDown={e=>e.currentTarget.style.transform="scale(0.95)"}
                onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
                onTouchStart={e=>e.currentTarget.style.transform="scale(0.95)"}
                onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
                <div style={{fontSize:20,fontWeight:900,letterSpacing:3,color:"#78350f",fontFamily:"Arial,sans-serif"}}>{w.word}</div>
                <div style={{fontSize:11,color:"#92400e",marginTop:2}}>{w.meaning}</div>
                <div style={{fontSize:10,color:"#b45309",marginTop:3}}>✏️ Schreiben üben</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {almost.length>0&&(
        <div>
          <div style={{fontSize:13,fontWeight:800,color:"#6b7280",marginBottom:8}}>🔜 Fast geschafft:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
            {almost.map(w=>{
              const miss=w.letters.filter(l=>!learned.has(l));
              return(
                <div key={w.word} style={{background:"white",borderRadius:14,padding:"10px 16px",textAlign:"center",border:"2px dashed #d1d5db"}}>
                  <div style={{fontSize:18,fontWeight:900,letterSpacing:3,fontFamily:"Arial,sans-serif"}}>
                    {w.word.split("").map((ch,i)=><span key={i} style={{color:miss.includes(ch.toUpperCase())?"#ef4444":"#9ca3af"}}>{ch}</span>)}
                  </div>
                  <div style={{fontSize:10,color:"#ef4444",marginTop:2}}>fehlt: {miss.join(", ")}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORD PRACTICE SCREEN — writes each letter of a word in sequence
// ═══════════════════════════════════════════════════════════════════════════════
function WordPractice({word, settings, onSpeak=()=>{}, onTrial=null, scale=1, onBack}){
  const letters=word.word.split("");
  const [idx,setIdx]=useState(0);           // current letter index
  const [doneLetters,setDoneLetters]=useState([]); // stars per letter
  const [phase,setPhase]=useState("anim"); // anim | trace
  const [replayKey,setReplayKey]=useState(0);
  const [finished,setFinished]=useState(false);

  const current=letters[idx];
  const totalStars=doneLetters.reduce((a,s)=>a+s,0);
  const maxStars=doneLetters.length*5;

  const handleLetterDone=(stars)=>{
    const next=[...doneLetters,stars];
    setDoneLetters(next);
    if(idx<letters.length-1){
      setTimeout(()=>{ setIdx(idx+1); setPhase("anim"); setReplayKey(k=>k+1); },1200);
    } else {
      setTimeout(()=>setFinished(true),1200);
    }
  };

  if(finished){
    const pct=maxStars>0?Math.round(totalStars/maxStars*100):0;
    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#fef9c3,#fde68a 80%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:20,fontFamily:"Arial,sans-serif"}}>
        <div style={{fontSize:72}}>🎉</div>
        <h2 style={{margin:0,fontSize:28,fontWeight:900,color:"#78350f"}}>{word.word}</h2>
        <div style={{fontSize:22,color:"#92400e"}}>{word.meaning}</div>
        <div style={{display:"flex",gap:6}}>
          {letters.map((l,i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:900,color:"#78350f",fontFamily:"Arial,sans-serif"}}>{l}</div>
              <div style={{fontSize:12}}>{"⭐".repeat(doneLetters[i]||0)}</div>
            </div>
          ))}
        </div>
        <div style={{background:"white",borderRadius:20,padding:"12px 24px",fontSize:15,fontWeight:800,color:"#374151"}}>
          Ergebnis: {totalStars}/{maxStars} Punkte — {pct}%
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>{ setIdx(0);setDoneLetters([]);setPhase("anim");setReplayKey(k=>k+1);setFinished(false); }}
            style={{padding:"12px 20px",borderRadius:18,border:"none",background:"#fb923c",color:"white",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>
            🔄 Nochmal
          </button>
          <button onClick={onBack}
            style={{padding:"12px 20px",borderRadius:18,border:"none",background:"#4361ee",color:"white",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>
            ← Zurück
          </button>
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"Arial,sans-serif",display:"flex",flexDirection:"column",padding:10,gap:8}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={onBack} style={{background:"white",border:"1px solid #e2e8f0",borderRadius:50,width:36,height:36,fontSize:16,cursor:"pointer",flexShrink:0}}>←</button>
        <div style={{flex:1,background:"white",borderRadius:14,padding:"8px 12px",border:"1px solid #e2e8f0"}}>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>Wort schreiben</div>
          {/* Letter progress strip */}
          <div style={{display:"flex",gap:4,marginTop:4,alignItems:"center"}}>
            {letters.map((l,i)=>{
              const done=i<idx;
              const active=i===idx;
              return(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                  <div style={{
                    width:28,height:28,borderRadius:8,
                    background:done?"#4ade80":active?"#4361ee":"#f1f5f9",
                    border:`2px solid ${done?"#22c55e":active?"#4361ee":"#e2e8f0"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:14,fontWeight:900,fontFamily:"Arial,sans-serif",
                    color:done||active?"white":"#94a3b8",
                    transition:"all 0.2s",
                    transform:active?"scale(1.15)":"scale(1)",
                  }}>{done?"✓":l}</div>
                  {done&&<div style={{fontSize:8,lineHeight:1}}>{"⭐".repeat(Math.min(doneLetters[i]||0,3))}</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{background:"#fbbf24",color:"#78350f",borderRadius:12,padding:"4px 10px",fontWeight:800,fontSize:13,flexShrink:0}}>
          {idx+1}/{letters.length}
        </div>
      </div>

      {/* Word meaning */}
      <div style={{background:"linear-gradient(135deg,#fef3c7,#fde68a)",borderRadius:14,padding:"8px 14px",textAlign:"center",border:"1px solid #fbbf24"}}>
        <span style={{fontSize:18,fontWeight:900,letterSpacing:4,color:"#78350f",fontFamily:"Arial,sans-serif"}}>{word.word}</span>
        <span style={{fontSize:14,color:"#92400e",marginLeft:10}}>{word.meaning}</span>
      </div>

      {/* Mode toggle */}
      <div style={{display:"flex",gap:4,justifyContent:"center"}}>
        <button onClick={()=>{setPhase("anim");setReplayKey(k=>k+1);}}
          style={{padding:"5px 10px",borderRadius:10,border:"2px solid #fb923c",background:phase==="anim"?"#fb923c":"white",color:phase==="anim"?"white":"#fb923c",fontWeight:800,fontSize:11,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>▶ Zeigen</button>
        {settings.allowedModes?.guided&&<button onClick={()=>{setPhase("trace_guided");}}
          style={{padding:"5px 10px",borderRadius:10,border:"2px solid #22c55e",background:phase==="trace_guided"?"#22c55e":"white",color:phase==="trace_guided"?"white":"#22c55e",fontWeight:800,fontSize:11,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>🖐️ Geführt</button>}
        {settings.allowedModes?.trace&&<button onClick={()=>{setPhase("trace_free");}}
          style={{padding:"5px 10px",borderRadius:10,border:"2px solid #4361ee",background:phase==="trace_free"?"#4361ee":"white",color:phase==="trace_free"?"white":"#4361ee",fontWeight:800,fontSize:11,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>✏️ Nachfahren</button>}
      </div>

      {/* Canvas */}
      <div style={{display:"flex",justifyContent:"center"}}>
        {phase==="anim"&&
          <AnimCanvas key={`wanim-${current}-${idx}-${replayKey}`} letter={current} scale={scale}
            onDone={()=>setPhase(settings.allowedModes?.guided?"trace_guided":"trace_free")}/>}
        {phase==="trace_guided"&&
          <GuidedCanvas key={`wguided-${current}-${idx}-${replayKey}`} letter={current} onComplete={handleLetterDone} onSpeak={onSpeak} scale={scale}
            onTrial={onTrial&&(t=>onTrial(current,t))}/>}
        {phase==="trace_free"&&
          <TraceCanvas key={`wtrace-${current}-${idx}-${replayKey}`} letter={current}
            onComplete={handleLetterDone} difficulty={settings.difficulty} mode="trace" activeReward={null}
            lefthanded={!!settings.lefthanded} highContrast={!!settings.highContrast} hapticsEnabled={settings.hapticsEnabled!==false}
            onSpeak={onSpeak} scale={scale} onTrial={onTrial&&(t=>onTrial(current,t))}/>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTENCE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const LS_KEY="slk_v1";
// Synchrones Laden aus localStorage (sofort beim ersten Render verfügbar).
// Auf Android wird zusätzlich Capacitor Preferences gelesen und gespiegelt,
// weil localStorage im WebView beim Cache-Löschen verloren gehen kann.
function loadPersisted(){
  try{
    const raw=localStorage.getItem(LS_KEY);
    if(!raw)return null;
    return JSON.parse(raw);
  }catch{return null;}
}
function savePersisted(data){
  const json=JSON.stringify(data);
  try{localStorage.setItem(LS_KEY,json);}catch{}
  // Zusätzlich nativ persistieren (fire-and-forget)
  try{window.__native?.storage?.set(LS_KEY,json);}catch{}
}
// Beim Start einmalig aus dem nativen Speicher wiederherstellen, falls
// localStorage leer ist (z. B. nach App-Update oder Cache-Löschung).
async function restoreFromNative(){
  if(!window.__native?.storage)return null;
  try{
    if(localStorage.getItem(LS_KEY))return null; // localStorage hat Vorrang
    const raw=await window.__native.storage.get(LS_KEY);
    if(!raw)return null;
    localStorage.setItem(LS_KEY,raw);
    return JSON.parse(raw);
  }catch{return null;}
}
function clearPersisted(){
  try{localStorage.removeItem(LS_KEY);}catch{}
  try{window.__native?.storage?.remove(LS_KEY);}catch{}
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const persisted=useMemo(()=>loadPersisted()||{},[]);
  const [screen,setScreen]=useState("menu");
  const [tab,setTab]=useState("GROß");
  const [letter,setLetter]=useState("A");
  const [phase,setPhase]=useState("anim");
  const [learnedMap,setLearnedMap]=useState(()=>persisted.learnedMap||{});
  const [totalScore,setTotalScore]=useState(()=>persisted.totalScore||0);
  const [replayKey,setReplayKey]=useState(0);
  const [settings,setSettings]=useState(()=>{
    const s={
      difficulty:"medium",screenTime:15,autoAdvance:true,rewardVideos:true,
      allowedModes:{guided:true,trace:true,copy:true,memory:true},speechEnabled:true,
      lefthanded:false,highContrast:false,hapticsEnabled:true,settingsVersion:2,
      ...(persisted.settings||{})
    };
    // Ältere Einstellungen: neue Modi „Abschreiben" und „Aus dem Kopf" einschalten
    if((s.settingsVersion||1)<2)return{...s,settingsVersion:2,allowedModes:{...s.allowedModes,copy:true,memory:true}};
    return s;
  });
  // Lernstufe pro Buchstabe (1 geführt → 2 abschreiben → 3 aus dem Kopf)
  const [stageMap,setStageMap]=useState(()=>persisted.stageMap||{});
  const [memMap,setMemMap]=useState(()=>persisted.memMap||{});           // Erfolge aus dem Kopf
  const [lastPracticed,setLastPracticed]=useState(()=>persisted.lastPracticed||{});
  const [levelUp,setLevelUp]=useState(null);
  const rs=useResearch();
  // Wartekontrollgruppe der Studie: bis zum Studienende nur geführt und nachfahren
  const allowed=(m)=>!!settings.allowedModes?.[m]&&(!rs.restricted||m==="guided"||m==="trace");
  const stageOf=(l)=>stageMap[l]||1;
  // Empfohlener Modus für einen Buchstaben: seine Lernstufe, sonst die nächstniedrigere erlaubte
  const modeFor=(l)=>{
    for(let st=stageOf(l);st>=1;st--){
      const m=st===1&&!allowed("guided")?"trace":STAGE_MODE[st];
      if(allowed(m))return m;
    }
    return Object.keys(MODES).find(allowed)||"trace";
  };
  const [mode,setMode]=useState(()=>modeFor("A"));
  const fs=useMemo(()=>fieldScale(),[]);
  useEffect(()=>{setFieldScale(fs);},[fs,rs.enrolled]);
  // Messwerte eines Versuchs an den Forschungsmodus geben (nur bei Teilnahme)
  const studyLog=rs.enrolled?(extra)=>(t)=>logTrial({...t,difficulty:settings.difficulty,restricted:rs.restricted?1:0,...extra}):null;
  const [gridOpen,setGridOpen]=useState(false);
  const gridOpenedOnce=useRef(false);
  const [showParent,setShowParent]=useState(false);
  const [showReward,setShowReward]=useState(false);
  const [activeReward,setActiveReward]=useState(null);
  const [practiceWord,setPracticeWord]=useState(null);
  const [showUnicorn,setShowUnicorn]=useState(false);
  const [showStarRain,setShowStarRain]=useState(false);
  const [showScreenTime,setShowScreenTime]=useState(false);
  const [journal,setJournal]=useState([]);
  const [kidTip]=useState(()=>KID_TIPS[Math.floor(Math.random()*KID_TIPS.length)]);
  const screenTimerRef=useRef(null);
  const {say,sayLetter,sayIt}=useSpeech(settings.speechEnabled);

  // Fortschritt automatisch speichern
  useEffect(()=>{
    savePersisted({learnedMap,totalScore,settings,stageMap,memMap,lastPracticed});
  },[learnedMap,totalScore,settings,stageMap,memMap,lastPracticed]);

  // Beim Start aus nativem Speicher wiederherstellen, falls localStorage leer war
  useEffect(()=>{
    let cancelled=false;
    restoreFromNative().then(data=>{
      if(cancelled||!data)return;
      if(data.learnedMap)setLearnedMap(data.learnedMap);
      if(typeof data.totalScore==="number")setTotalScore(data.totalScore);
      if(data.settings)setSettings(s=>({...s,...data.settings}));
      if(data.stageMap)setStageMap(data.stageMap);
      if(data.memMap)setMemMap(data.memMap);
      if(data.lastPracticed)setLastPracticed(data.lastPracticed);
    });
    return()=>{cancelled=true;};
  },[]);

  // Android Zurück-Taste: zuerst Overlays schließen, dann zum Menü
  useEffect(()=>{
    const onBack=(e)=>{
      if(showParent){e.preventDefault();setShowParent(false);return;}
      if(showReward){e.preventDefault();setShowReward(false);return;}
      if(gridOpen){e.preventDefault();setGridOpen(false);return;}
      if(practiceWord){e.preventDefault();setPracticeWord(null);return;}
      if(screen!=="menu"){e.preventDefault();setScreen("menu");return;}
      // sonst: nicht abfangen → App darf sich beenden
    };
    window.addEventListener("app:backbutton",onBack);
    return()=>window.removeEventListener("app:backbutton",onBack);
  },[showParent,showReward,gridOpen,practiceWord,screen]);

  const items=tab==="GROß"?UPPERCASE:tab==="klein"?LOWERCASE:NUMBERS;
  const learnedCount=Object.values(learnedMap).filter(v=>v>0).length;
  const perfectCount=Object.values(learnedMap).filter(v=>v>=5).length;

  useEffect(()=>{
    if(screen==="practice"&&!gridOpenedOnce.current){
      gridOpenedOnce.current=true;setGridOpen(true);
      const t=setTimeout(()=>setGridOpen(false),2000);return()=>clearTimeout(t);
    }
  },[screen]);
  useEffect(()=>{
    clearTimeout(screenTimerRef.current);
    if(settings.screenTime>0&&screen==="practice"){
      screenTimerRef.current=setTimeout(()=>setShowScreenTime(true),settings.screenTime*60*1000);
    }
    return()=>clearTimeout(screenTimerRef.current);
  },[settings.screenTime,screen]);

  // Beim Aus-dem-Kopf-Schreiben gibt es kein Vorführen — erst ansehen, dann erinnern
  // Automatisches Weiterschalten abbrechen, sobald das Kind selbst etwas wählt
  const advanceTimer=useRef(null);
  useEffect(()=>{if(screen!=="practice")clearTimeout(advanceTimer.current);},[screen]);
  useEffect(()=>()=>clearTimeout(advanceTimer.current),[]);
  const selectLetter=(l)=>{clearTimeout(advanceTimer.current);const m=modeFor(l);setLetter(l);setMode(m);setPhase(m==="memory"?"write":"anim");setReplayKey(k=>k+1);sayLetter(l);};
  const changeTab=(t)=>{setTab(t);selectLetter(LEARN_PATH[t][0]);};
  const openLetter=(l)=>{setTab(tabOf(l));selectLetter(l);setScreen("practice");};
  const chooseMode=(m)=>{clearTimeout(advanceTimer.current);setMode(m);setPhase("write");setReplayKey(k=>k+1);};

  const handleDone=(s,info={})=>{
    const now=new Date();
    setLearnedMap(m=>({...m,[letter]:Math.max(m[letter]||0,s)}));
    setTotalScore(sc=>sc+s*10);
    setLastPracticed(m=>({...m,[letter]:now.getTime()}));
    setJournal(j=>[...j,{letter,stars:s,mode:info.mode||mode,time:`${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}`}]);
    const praise=["","Weiter üben!","Fast!","Gut gemacht!","Sehr gut!","Perfekt!"][s]||"";
    if(praise)say(praise,0.85,1.3);
    // Lernstufe: ab 4 Sternen geht es zur nächsten Stufe (weniger Hilfe)
    const used=info.mode||mode,cur=stageOf(letter);let next=null;
    if(s>=4){
      if(used==="memory")setMemMap(m=>({...m,[letter]:(m[letter]||0)+1}));
      const target=Math.min(3,MODE_STAGE[used]+1);   // wer es schon aus dem Kopf kann, bleibt dort
      if(target>cur&&!rs.restricted){
        next=target;
        setStageMap(m=>({...m,[letter]:next}));
        setLevelUp({letter,stage:next});setTimeout(()=>setLevelUp(null),4000);
        setTimeout(()=>say(STAGE_NEXT_TEXT[next],0.85,1.2),1400);
      }
    }
    if(settings.autoAdvance){
      // Weiter auf dem Lernweg (ähnliche Bewegungen zusammen, b/d getrennt)
      const path=LEARN_PATH[tabOf(letter)],idx=path.indexOf(letter);
      if(idx>=0&&idx<path.length-1)advanceTimer.current=setTimeout(()=>selectLetter(path[idx+1]),next?4200:2200);
    }
  };

  const handleEarnReward=(type)=>{
    setActiveReward(type);
    if(type==="unicorn") setShowUnicorn(true);
    if(type==="stardust") setShowStarRain(true);
    // glitter and rainbow are handled in TraceCanvas via activeReward prop
    setTimeout(()=>setActiveReward(null),type==="unicorn"||type==="stardust"?5000:45000);
  };

  const settingsWithData={...settings,learnedMap,totalScore,stageMap,memMap};
  // Lerndaten nicht in die Einstellungen übernehmen
  const updateSettings=({learnedMap:_l,totalScore:_t,stageMap:_s,memMap:_m,...rest})=>setSettings(rest);
  // Verteiltes Üben: Buchstaben, die vor mehr als einem Tag geübt wurden
  const due=Object.keys(lastPracticed)
    .filter(l=>(learnedMap[l]||0)>0&&Date.now()-lastPracticed[l]>REVIEW_AFTER_MS)
    .sort((a,b)=>lastPracticed[a]-lastPracticed[b]).slice(0,6);

  // ── MENU ──
  if(screen==="menu") return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#312e81 0%,#4338ca 55%,#6366f1)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,fontFamily:"Arial,sans-serif",padding:20}}>
      <div style={{textAlign:"center"}}>
        <HeroKid/>
        <h1 style={{fontSize:30,fontWeight:900,color:"white",margin:"0 0 4px",fontFamily:"Arial,sans-serif"}}>Schreib & Lern</h1>
        <p style={{color:"#c7d2fe",fontSize:13,margin:0}}>Buchstaben, Zahlen & Wörter auf Deutsch</p>
      </div>
      <div style={{background:"#fef9c3",borderRadius:16,padding:"8px 16px",fontSize:13,color:"#78350f",fontWeight:600,maxWidth:260,textAlign:"center"}}>
        {kidTip}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,width:280}}>
        {[
          {label:"✏️ Schreiben",action:()=>setScreen("practice"),color:"#fb923c"},
          {label:"📖 Wörter",action:()=>setScreen("words"),color:"#4ade80"},
          {label:"🌻 Garten",action:()=>setScreen("progress"),color:"#60a5fa"},
          {label:"🎀 Sticker",action:()=>setScreen("stickers"),color:"#f472b6"},
        ].map(b=>(
          <button key={b.label} onClick={b.action} style={{padding:"16px 8px",borderRadius:18,border:"none",background:b.color,color:"white",fontWeight:900,fontSize:16,cursor:"pointer",fontFamily:"Arial,sans-serif",boxShadow:`0 4px 16px ${b.color}60`}}>{b.label}</button>
        ))}
      </div>
      <div style={{background:"rgba(255,255,255,0.15)",borderRadius:14,padding:"8px 16px",color:"white",fontSize:13,fontWeight:700}}>
        🏆 {totalScore} &nbsp;·&nbsp; {learnedCount} gelernt &nbsp;·&nbsp; {perfectCount} 🌻
      </div>
      {rs.enrolled&&rs.dueWave!=null&&(
        <button onClick={()=>setScreen("probe")} style={{background:"linear-gradient(135deg,#14b8a6,#0f766e)",border:"none",borderRadius:18,padding:"12px 16px",width:280,color:"white",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"Arial,sans-serif",boxShadow:"0 4px 16px #0f766e60",animation:"glowPulse 2s infinite"}}>
          🔬 Kleiner Schreibtest
        </button>
      )}
      {due.length>0&&(
        <div style={{background:"rgba(255,255,255,0.95)",borderRadius:18,padding:"10px 14px",width:280,boxShadow:"0 4px 16px #0003",animation:"slideUp 0.4s ease-out"}}>
          <div style={{fontSize:13,fontWeight:900,color:"#312e81",marginBottom:6}}>🔁 Heute wiederholen</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {due.map(l=>(
              <button key={l} onClick={()=>openLetter(l)} style={{background:"#eef2ff",border:"2px solid #c7d2fe",borderRadius:12,padding:"4px 6px",cursor:"pointer"}}>
                <Glyph letter={l} height={34} weight={2.8} color="#312e81"/>
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
        <button onClick={()=>{const n=!settings.speechEnabled;setSettings(s=>({...s,speechEnabled:n}));if(n)setTimeout(()=>speak("Vorlesen ist an!"),100);}}
          style={{background:settings.speechEnabled?"#fbbf24":"rgba(255,255,255,0.1)",border:`2px solid ${settings.speechEnabled?"#f59e0b":"rgba(255,255,255,0.2)"}`,borderRadius:50,width:52,height:52,fontSize:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:settings.speechEnabled?"0 4px 16px #fbbf2460":"none",transition:"all 0.2s"}}>
          {settings.speechEnabled?"🔊":"🔇"}
        </button>
        <button onClick={()=>setShowParent(true)} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:14,padding:"7px 18px",color:"#c7d2fe",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>
          👨‍👩‍👧 Eltern
        </button>
        <button onClick={()=>setScreen("impressum")} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:14,padding:"7px 18px",color:"#c7d2fe",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>
          📄 Impressum
        </button>
      </div>
      {showParent&&<ParentZone settings={settingsWithData} onChange={updateSettings} onStartProbe={()=>{setShowParent(false);setScreen("probe");}} onClose={()=>setShowParent(false)} journal={journal}/>}
    </div>
  );

  if(screen==="impressum") return <ImpressumScreen onBack={()=>setScreen("menu")}/>;

  if(screen==="probe"){
    if(!rs.enrolled||rs.dueWave==null){setTimeout(()=>setScreen("menu"),0);return null;}
    const wave=rs.dueWave;
    return <ProbeTest key={wave} wave={wave} chars={rs.probeChars} difficulty={settings.difficulty} scale={fs} onSpeak={sayIt}
      onLog={t=>logTrial({...t,difficulty:settings.difficulty,restricted:rs.restricted?1:0})}
      onFinish={()=>{markWaveDone(wave);setScreen("menu");}} onExit={()=>setScreen("menu")}/>;
  }

  if(screen==="words"){
    if(practiceWord) return(
      <WordPractice word={practiceWord} settings={settings} onSpeak={sayIt} scale={fs}
        onTrial={studyLog&&((ch,t)=>studyLog({kind:"word",ch,stage:stageOf(ch)})(t))}
        onBack={()=>setPracticeWord(null)}/>
    );
    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#fef9c3,#fde68a 80%)",fontFamily:"Arial,sans-serif",padding:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={()=>setScreen("menu")} style={{background:"white",border:"none",borderRadius:50,width:40,height:40,fontSize:20,cursor:"pointer"}}>←</button>
          <h2 style={{margin:0,color:"#78350f",fontWeight:900,fontSize:22,fontFamily:"Arial,sans-serif"}}>Meine Wörter 📖</h2>
        </div>
        <WordsPanel learnedMap={learnedMap} onPractice={w=>setPracticeWord(w)}/>
      </div>
    );
  }

  if(screen==="progress") return(
    <div style={{minHeight:"100vh",background:"#f0fdf4",fontFamily:"Arial,sans-serif",padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <button onClick={()=>setScreen("menu")} style={{background:"white",border:"none",borderRadius:50,width:40,height:40,fontSize:20,cursor:"pointer"}}>←</button>
        <h2 style={{margin:0,color:"#166534",fontWeight:900,fontSize:22,fontFamily:"Arial,sans-serif"}}>Mein Garten 🌻</h2>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {["GROß","klein","Zahlen"].map(t=><FlowerGarden key={t} learnedMap={learnedMap} tab={t}/>)}
      </div>
    </div>
  );

  if(screen==="stickers") return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#fdf2f8,#fce7f3 80%)",fontFamily:"Arial,sans-serif",padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <button onClick={()=>setScreen("menu")} style={{background:"white",border:"none",borderRadius:50,width:40,height:40,fontSize:20,cursor:"pointer"}}>←</button>
        <h2 style={{margin:0,color:"#9d174d",fontWeight:900,fontSize:22,fontFamily:"Arial,sans-serif"}}>Sticker-Album 🎀</h2>
      </div>
      <StickerBook learnedMap={learnedMap}/>
    </div>
  );

  // ── PRACTICE ──
  return(
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"Arial,sans-serif",display:"flex",flexDirection:"column",padding:10,gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <button onClick={()=>setScreen("menu")} style={{background:"white",border:"1px solid #e2e8f0",borderRadius:50,width:36,height:36,fontSize:16,cursor:"pointer",flexShrink:0}}>←</button>
        <div style={{flex:1,display:"flex",background:"white",borderRadius:12,padding:3,gap:2,border:"1px solid #e2e8f0"}}>
          {["GROß","klein","Zahlen"].map(t=>(
            <button key={t} onClick={()=>changeTab(t)} style={{flex:1,padding:"6px 2px",borderRadius:9,border:"none",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"Arial,sans-serif",background:tab===t?"#4361ee":"transparent",color:tab===t?"white":"#64748b"}}>{t}</button>
          ))}
        </div>
        <div style={{background:"#4361ee",color:"white",borderRadius:12,padding:"4px 10px",fontWeight:800,fontSize:12,flexShrink:0}}>🏆{totalScore}</div>
        <button onClick={()=>setShowParent(true)} style={{background:"white",border:"1px solid #e2e8f0",borderRadius:50,width:34,height:34,fontSize:16,cursor:"pointer",flexShrink:0}}>👪</button>
      </div>

      {/* Letter Grid — eingeklappt, aufklappbar */}
      <div style={{background:"white",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
        <button
          onClick={()=>setGridOpen(g=>!g)}
          style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"none",border:"none",cursor:"pointer",fontFamily:"Arial,sans-serif"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:13,fontWeight:800,color:"#374151"}}>
              {tab} — Buchstabe wählen
            </span>
            <span style={{background:"#4361ee",color:"white",borderRadius:8,padding:"1px 8px",fontSize:11,fontWeight:700}}>
              {letter}
            </span>
          </div>
          <span style={{fontSize:14,color:"#94a3b8",transition:"transform 0.2s",transform:gridOpen?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
        </button>
        {gridOpen&&(
          <div style={{padding:"0 8px 8px"}}>
            <LetterGrid items={items} learnedMap={learnedMap} onSelect={(l)=>{selectLetter(l);setGridOpen(false);}} current={letter}/>
          </div>
        )}
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <div style={{background:"#4361ee",color:"white",borderRadius:12,width:46,height:46,display:"flex",alignItems:"center",justifyContent:"center"}}><Glyph letter={letter} height={42} weight={3.2} color="white"/></div>
          <button onClick={()=>sayLetter(letter)} style={{background:"#fbbf24",border:"none",borderRadius:50,width:38,height:38,fontSize:18,cursor:"pointer",boxShadow:"0 2px 8px #fbbf2460"}}>🔊</button>
        </div>
        <AnlautChip letter={letter} onSay={()=>sayLetter(letter)}/>
      </div>

      {/* Lernweg: Vorführen, dann Hilfe Schritt für Schritt abbauen */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center"}}>
        <button onClick={()=>{clearTimeout(advanceTimer.current);setPhase("anim");setReplayKey(k=>k+1);}} style={{padding:"6px 9px",borderRadius:11,border:"2px solid #fb923c",background:phase==="anim"?"#fb923c":"white",color:phase==="anim"?"white":"#fb923c",fontWeight:800,fontSize:11,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>▶ Zeigen</button>
        {Object.entries(MODES).filter(([m])=>allowed(m)).map(([m,{label,color}])=>{
          const active=phase==="write"&&mode===m;
          const recommended=m===modeFor(letter);
          const passed=MODE_STAGE[m]<stageOf(letter)||(m==="memory"&&(memMap[letter]||0)>0);
          return(
            <button key={m} onClick={()=>chooseMode(m)} style={{position:"relative",padding:"6px 9px",borderRadius:11,border:`2px solid ${color}`,background:active?color:"white",color:active?"white":color,fontWeight:800,fontSize:11,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>
              {passed?"✓ ":""}{label}
              {recommended&&!passed&&<span style={{position:"absolute",top:-8,right:-6,fontSize:12}}>⭐</span>}
            </button>
          );
        })}
      </div>

      {levelUp&&levelUp.letter===letter&&(
        <div style={{background:"linear-gradient(135deg,#fef3c7,#fde68a)",borderRadius:14,padding:"8px 14px",textAlign:"center",fontSize:13,fontWeight:800,color:"#78350f",border:"2px solid #fbbf24",animation:"popIn 0.4s ease-out"}}>
          🎉 Neue Stufe! {STAGE_NEXT_TEXT[levelUp.stage]}
        </div>
      )}

      {activeReward&&(
        <div style={{background:activeReward==="glitter"?"#fef9c3":activeReward==="rainbow"?"#f0fdf4":activeReward==="stardust"?"#fdf2f8":"#f5f3ff",borderRadius:14,padding:"8px 14px",textAlign:"center",fontSize:13,fontWeight:700,animation:"glowPulse 2s infinite",border:"2px solid #fbbf24"}}>
          {activeReward==="glitter"&&"✨ Glitzerstift aktiv! Zeichne und schau was passiert!"}
          {activeReward==="rainbow"&&"🌈 Regenbogen-Stift aktiv! Jede Linie wird bunt!"}
          {activeReward==="stardust"&&"🌟 Sternenregen! Schau in den Himmel!"}
          {activeReward==="unicorn"&&"🦄 Das Einhorn ist vorbeigesprungen!"}
        </div>
      )}

      <div style={{display:"flex",justifyContent:"center",flexDirection:"column",gap:8}}>
        {phase==="anim"&&<StrokePreview letter={letter}/>}
        {phase==="anim"
          ?<AnimCanvas key={`anim-${letter}-${replayKey}`} letter={letter} onDone={()=>setPhase("write")} scale={fs}/>
          :mode==="guided"
            ?<GuidedCanvas key={`guided-${letter}-${replayKey}`} letter={letter} onComplete={handleDone} onSpeak={sayIt} scale={fs}
               onTrial={studyLog&&studyLog({kind:"practice",ch:letter,stage:stageOf(letter)})}/>
            :<TraceCanvas key={`trace-${letter}-${mode}-${replayKey}`} letter={letter} onComplete={handleDone}
               difficulty={settings.difficulty} mode={mode} activeReward={activeReward}
               memoryDelay={MEMORY_DELAYS[Math.min(memMap[letter]||0,MEMORY_DELAYS.length-1)]}
               lefthanded={!!settings.lefthanded} highContrast={!!settings.highContrast} hapticsEnabled={settings.hapticsEnabled!==false}
               onSpeak={sayIt} scale={fs} onTrial={studyLog&&studyLog({kind:"practice",ch:letter,stage:stageOf(letter)})}/>
        }
      </div>

      <div style={{display:"flex",gap:8}}>
        {learnedCount>=2&&<button onClick={()=>setScreen("words")} style={{flex:1,background:"linear-gradient(135deg,#fbbf24,#f59e0b)",border:"none",borderRadius:14,padding:"10px",color:"white",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>📖 Wörter ({learnedCount})</button>}
        {settings.rewardVideos&&<button onClick={()=>setShowReward(true)} style={{flex:1,background:"linear-gradient(135deg,#c084fc,#a855f7)",border:"none",borderRadius:14,padding:"10px",color:"white",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>🎁 Belohnung</button>}
        {perfectCount>=1&&<button onClick={()=>setScreen("stickers")} style={{flex:1,background:"linear-gradient(135deg,#f472b6,#ec4899)",border:"none",borderRadius:14,padding:"10px",color:"white",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"Arial,sans-serif"}}>🎀 ({perfectCount})</button>}
      </div>

      {showReward&&<RewardModal onEarn={handleEarnReward} onClose={()=>setShowReward(false)} hapticsEnabled={settings.hapticsEnabled!==false}/>}
      {showUnicorn&&<UnicornRun onDone={()=>setShowUnicorn(false)}/>}
      {showStarRain&&<StarRain onDone={()=>setShowStarRain(false)}/>}
      {showScreenTime&&<ScreenTimeReminder limit={settings.screenTime} onDismiss={()=>setShowScreenTime(false)}/>}
      {showParent&&<ParentZone settings={settingsWithData} onChange={updateSettings} onStartProbe={()=>{setShowParent(false);setScreen("probe");}} onClose={()=>setShowParent(false)} journal={journal}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPRESSUM SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function ImpressumScreen({onBack}){
  const [tab,setTab]=useState("impressum"); // impressum | datenschutz | attribution
  const s = {
    page:{minHeight:"100vh",background:"#f8fafc",fontFamily:"Arial,sans-serif",fontSize:13,color:"#374151"},
    header:{background:"white",borderBottom:"1px solid #e2e8f0",padding:"12px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10},
    tabs:{display:"flex",gap:0,background:"#f1f5f9",borderRadius:12,padding:3,margin:"16px 16px 0"},
    tab:{flex:1,padding:"8px 4px",borderRadius:9,border:"none",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"Arial,sans-serif"},
    body:{padding:16,display:"flex",flexDirection:"column",gap:14},
    card:{background:"white",borderRadius:16,padding:16,border:"1px solid #e2e8f0"},
    h2:{fontSize:15,fontWeight:900,color:"#1e3a8a",margin:"0 0 10px",fontFamily:"Arial,sans-serif"},
    h3:{fontSize:13,fontWeight:800,color:"#374151",margin:"10px 0 4px"},
    p:{margin:"0 0 8px",lineHeight:1.6,color:"#4b5563"},
    placeholder:{background:"#fef9c3",borderRadius:8,padding:"6px 10px",fontSize:11,color:"#92400e",margin:"6px 0"},
    link:{color:"#4361ee",textDecoration:"none",fontWeight:600},
    divider:{borderTop:"1px solid #e2e8f0",margin:"10px 0"},
  };

  return(
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={onBack} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:50,width:36,height:36,fontSize:16,cursor:"pointer",flexShrink:0}}>←</button>
        <h2 style={{margin:0,fontSize:17,fontWeight:900,color:"#1e3a8a",fontFamily:"Arial,sans-serif"}}>📄 Rechtliches</h2>
      </div>

      <div style={s.tabs}>
        {[["impressum","📋 Impressum"],["datenschutz","🔒 Datenschutz"],["attribution","🎨 Bildnachweise"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{...s.tab,background:tab===k?"white":"transparent",color:tab===k?"#1e3a8a":"#64748b",boxShadow:tab===k?"0 1px 4px #0001":"none"}}>{l}</button>
        ))}
      </div>

      {/* ── IMPRESSUM ── */}
      {tab==="impressum"&&(
        <div style={s.body}>
          {/* Checklist for developer */}
          <div style={{background:"#fef3c7",borderRadius:14,padding:14,border:"2px solid #fbbf24"}}>
            <div style={{fontWeight:900,fontSize:13,color:"#92400e",marginBottom:8}}>✏️ Vor Veröffentlichung ausfüllen:</div>
            {[
              "Vorname Nachname",
              "Straße + Hausnummer",
              "PLZ + Ort",
              "E-Mail-Adresse",
              "Hoster + Löschfrist der Server-Logs (Datenschutz)",
            ].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#78350f",marginBottom:4}}>
                <span style={{width:18,height:18,borderRadius:4,border:"2px solid #f59e0b",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:9}}>☐</span>
                {item}
              </div>
            ))}
          </div>
          <div style={s.card}>
            <h2 style={s.h2}>Impressum</h2>
            <p style={s.p}>Angaben gemäß § 5 TMG</p>
            <h3 style={s.h3}>Verantwortlich</h3>
            <p style={s.p}>
              <span style={{background:"#fde68a",borderRadius:4,padding:"1px 5px"}}>[Vorname Nachname]</span><br/>
              <span style={{background:"#fde68a",borderRadius:4,padding:"1px 5px"}}>[Straße Hausnummer]</span><br/>
              <span style={{background:"#fde68a",borderRadius:4,padding:"1px 5px"}}>[PLZ Ort]</span><br/>
              Deutschland
            </p>
            <h3 style={s.h3}>Kontakt</h3>
            <p style={s.p}>
              E-Mail: <span style={{background:"#fde68a",borderRadius:4,padding:"1px 5px"}}>[deine@email.de]</span><br/>
              Telefon: <span style={{background:"#fde68a",borderRadius:4,padding:"1px 5px"}}>[+49 ...]</span> (optional)
            </p>
            <div style={s.divider}/>
            <h3 style={s.h3}>Plattform der EU-Kommission zur Online-Streitbeilegung</h3>
            <p style={s.p}><a href="https://ec.europa.eu/consumers/odr/" style={s.link} target="_blank" rel="noreferrer">https://ec.europa.eu/consumers/odr/</a></p>
            <p style={s.p}>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
            <div style={s.divider}/>
            <h3 style={s.h3}>Haftung für Inhalte</h3>
            <p style={s.p}>Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte nach den allgemeinen Gesetzen verantwortlich. Diese App richtet sich an Kinder und Erziehungsberechtigte und dient ausschließlich Bildungszwecken.</p>
          </div>
        </div>
      )}

      {/* ── DATENSCHUTZ ── */}
      {tab==="datenschutz"&&(
        <div style={s.body}>
          <div style={s.card}>
            <h2 style={s.h2}>Datenschutzerklärung</h2>
            <p style={s.p}>Zuletzt aktualisiert: {new Date().toLocaleDateString("de-DE")}</p>

            <h3 style={s.h3}>1. Verantwortlicher</h3>
            <p style={s.p}>
              <span style={{background:"#fde68a",borderRadius:4,padding:"1px 5px"}}>[Vorname Nachname]</span>,{" "}
              <span style={{background:"#fde68a",borderRadius:4,padding:"1px 5px"}}>[Straße, PLZ Ort]</span><br/>
              Kontakt: <span style={{background:"#fde68a",borderRadius:4,padding:"1px 5px"}}>[deine@email.de]</span>
            </p>

            <h3 style={s.h3}>2. Speicherung auf deinem Gerät</h3>
            <p style={s.p}>Diese App speichert <strong>keine personenbezogenen Daten</strong> auf externen Servern. Lernfortschritte (Sterne, gelernte Buchstaben, Punkte) und die Einstellungen aus dem Elternbereich werden ausschließlich lokal im Speicher deines Browsers (localStorage) auf diesem Gerät abgelegt und nicht übertragen. Du kannst sie jederzeit im Elternbereich über „Fortschritt zurücksetzen" oder durch Löschen der Browserdaten entfernen.</p>

            <h3 style={s.h3}>3. Aufruf der Webseite (Server-Logfiles)</h3>
            <p style={s.p}>Beim Aufrufen der App überträgt dein Browser technisch bedingt Daten an unseren Webserver bzw. Hoster <span style={{background:"#fde68a",borderRadius:4,padding:"1px 5px"}}>[Name des Hosters]</span>: IP-Adresse, Datum und Uhrzeit, aufgerufene Datei, Browsertyp und Betriebssystem. Diese Daten sind für die Auslieferung der App erforderlich (Art. 6 Abs. 1 lit. f DSGVO), werden nicht mit anderen Daten zusammengeführt und nach <span style={{background:"#fde68a",borderRadius:4,padding:"1px 5px"}}>[z. B. 7]</span> Tagen gelöscht. Nach dem ersten Laden funktioniert die App auch offline.</p>

            <h3 style={s.h3}>3a. Forschungsmodus (nur mit Einwilligung)</h3>
            <p style={s.p}>Nur wenn Eltern im Elternbereich in die Teilnahme an einer Studie einwilligen und das Kind zustimmt, sendet die App pseudonyme Messwerte (z. B. Reaktionszeiten, Schreibdauer, Genauigkeit sowie Alter in Monaten, Klassenstufe, Händigkeit, Familiensprache) unter einem zufälligen Teilnahmecode an unseren Server. Namen, E-Mail- und IP-Adressen werden dabei nicht gespeichert. Einzelheiten stehen in der Elterninformation zur Studie. Die Teilnahme kann jederzeit im Elternbereich beendet werden; dann werden alle Studiendaten gelöscht.</p>

            <h3 style={s.h3}>4. Kinder & besonderer Schutz (Art. 8 DSGVO)</h3>
            <p style={s.p}>Diese App richtet sich an Kinder im Vorschul- und Grundschulalter. Wir erheben bewusst keinerlei personenbezogene Daten. Es werden keine Nutzerkonten erstellt, keine E-Mail-Adressen abgefragt und keine Tracking-Technologien eingesetzt.</p>

            <h3 style={s.h3}>5. Externe Inhalte / Bildmaterial</h3>
            <p style={s.p}>Diese App lädt Illustrationen von <strong>Freepik</strong> (freepik.com). Dabei kann es zu einer Verbindung zu Freepik-Servern kommen. Freepik's Datenschutzerklärung: <a href="https://www.freepik.com/privacy-policy" style={s.link} target="_blank" rel="noreferrer">freepik.com/privacy-policy</a></p>

            <h3 style={s.h3}>6. Belohnungs-Videos (optional)</h3>
            <p style={s.p}>Wenn die Eltern die Funktion "Belohnungs-Videos" aktivieren, werden kurze Animations-Sequenzen innerhalb der App abgespielt. Es werden dabei keine Daten an Dritte übermittelt, da es sich um simulierte (nicht echte) Werbevideos handelt.</p>

            <h3 style={s.h3}>7. Deine Rechte (Art. 15–21 DSGVO)</h3>
            <p style={s.p}>Da wir keine personenbezogenen Daten speichern, entfallen Auskunfts-, Berichtigungs- und Löschungsrechte praktisch. Bei Fragen wende dich an: <span style={{background:"#fde68a",borderRadius:4,padding:"1px 5px"}}>[deine@email.de]</span></p>

            <h3 style={s.h3}>8. Aufsichtsbehörde</h3>
            <p style={s.p}>Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Die zuständige Behörde richtet sich nach deinem Bundesland.</p>
          </div>
        </div>
      )}

      {/* ── ATTRIBUTION ── */}
      {tab==="attribution"&&(
        <div style={s.body}>
          <div style={s.card}>
            <h2 style={s.h2}>🎨 Bildnachweise & Lizenzen</h2>
            <p style={s.p}>Diese App verwendet Illustrationen von <strong>Freepik</strong>. Die Nutzung erfolgt gemäß der kostenlosen Freepik-Lizenz, die eine Namensnennung (Attribution) erfordert.</p>

            <div style={{background:"#f0fdf4",borderRadius:12,padding:14,border:"1px solid #bbf7d0",marginBottom:12}}>
              <div style={{fontWeight:800,color:"#166534",marginBottom:8,fontSize:13}}>📸 Verwendete Bilder:</div>
              {[
                {name:"Kind schreibt",  desc:"Cute boy writing illustration",   url:"https://www.freepik.com"},
                {name:"Einhorn",        desc:"Cute unicorn sitting illustration", url:"https://www.freepik.com"},
                {name:"Zauberstab",     desc:"Magic wand with sparkles",         url:"https://www.freepik.com"},
                {name:"Regenbogen",     desc:"Cute rainbow with clouds",         url:"https://www.freepik.com"},
                {name:"Sterne",         desc:"Stars sparkles collection",        url:"https://www.freepik.com"},
                {name:"Bleistift",      desc:"Cute pencil cartoon icon",         url:"https://www.freepik.com"},
              ].map((img,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid #dcfce7"}}>
                  <span style={{fontSize:18}}>{["👦","🦄","✨","🌈","⭐","✏️"][i]}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:12}}>{img.name}</div>
                    <div style={{fontSize:11,color:"#6b7280"}}>{img.desc}</div>
                  </div>
                  <a href={img.url} style={{...s.link,fontSize:11}} target="_blank" rel="noreferrer">freepik.com</a>
                </div>
              ))}
            </div>

            <div style={{background:"#eff6ff",borderRadius:12,padding:12,border:"1px solid #bfdbfe"}}>
              <div style={{fontWeight:800,color:"#1e40af",marginBottom:6,fontSize:13}}>📜 Lizenzhinweis</div>
              <p style={{...s.p,fontSize:12,margin:0}}>
                Designed by <a href="https://www.freepik.com" style={s.link} target="_blank" rel="noreferrer">Freepik</a> from <a href="https://www.flaticon.com" style={s.link} target="_blank" rel="noreferrer">Flaticon</a> &amp; <a href="https://www.freepik.com" style={s.link} target="_blank" rel="noreferrer">Freepik.com</a>.
                Genutzt unter der <a href="https://www.freepikcompany.com/legal" style={s.link} target="_blank" rel="noreferrer">Freepik Free License</a>.
              </p>
            </div>

            <div style={{...s.divider}}/>
            <h3 style={s.h3}>Weitere verwendete Ressourcen</h3>
            <p style={{...s.p,fontSize:12}}>
              <strong>React</strong> — MIT License — <a href="https://react.dev" style={s.link} target="_blank" rel="noreferrer">react.dev</a><br/>
              <strong>Schriften</strong> — Arial (Systemschrift, keine gesonderte Lizenz erforderlich)<br/>
              <strong>Emojis</strong> — System-Emojis des jeweiligen Betriebssystems
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
