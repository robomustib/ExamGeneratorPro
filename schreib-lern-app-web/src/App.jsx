import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, useContext, createContext } from "react";
import { useResearch, enroll, withdraw, exportMyData, logTrial, markWaveDone, trialMetrics, setFieldScale } from "./research.js";
import { Klecks, KlecksBubble, CompanionCtx, KLECKS_COLORS, accList, wearAcc, toggleAcc } from "./klecks.jsx";
import { sfx, setSoundOn } from "./sound.js";
import { useInstall } from "./install.js";
// Schrift „Nunito" (SIL Open Font License) — wird in die App eingebettet, kein Google-Server
import nunito700 from "@fontsource/nunito/files/nunito-latin-700-normal.woff2";
import nunito800 from "@fontsource/nunito/files/nunito-latin-800-normal.woff2";
import nunito900 from "@fontsource/nunito/files/nunito-latin-900-normal.woff2";

// ─── Gestaltung: Schrift, Farben, Knöpfe, Animationen (einmal eingefügt) ─────────
const STYLE = `
@font-face{font-family:"Nunito";font-style:normal;font-weight:700;font-display:swap;src:url(${nunito700}) format("woff2")}
@font-face{font-family:"Nunito";font-style:normal;font-weight:800;font-display:swap;src:url(${nunito800}) format("woff2")}
@font-face{font-family:"Nunito";font-style:normal;font-weight:900;font-display:swap;src:url(${nunito900}) format("woff2")}
:root{--ink:#2b2d42;--ink2:#5c6378;--muted:#8a91a6;--paper:#fffdf7;--line:#e3e8f2;
  --coral:#ff7a59;--coralD:#e0553a;--sun:#ffc93c;--sunD:#dea000;--mint:#2ecc8f;--mintD:#17a06c;
  --sky:#38bdf8;--skyD:#0b8fcf;--grape:#9b6bff;--grapeD:#6f42d9;--pink:#ff7eb6;--pinkD:#e0538f}
body{font-family:"Nunito",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:var(--ink);font-weight:700}
button,input,select,textarea{font-family:inherit}
.k-press{border:none;cursor:pointer;box-shadow:0 5px 0 var(--sh,#00000026);transition:transform .08s ease,box-shadow .08s ease;-webkit-tap-highlight-color:transparent}
.k-press:active{transform:translateY(4px);box-shadow:0 1px 0 var(--sh,#00000026)}
.k-press:focus-visible{outline:3px solid #2b2d42;outline-offset:3px}
.k-press:disabled{opacity:.5;cursor:default}
.k-card{background:#fff;border-radius:24px;box-shadow:0 5px 0 #0f172a12,0 10px 26px #0f172a12}
.k-bubble{position:relative}
.k-bubble::before{content:"";position:absolute;left:-11px;top:50%;margin-top:-8px;border:8px solid transparent;border-right:11px solid var(--bb);border-left:0}
.k-bubble::after{content:"";position:absolute;left:-6px;top:50%;margin-top:-5px;border:5px solid transparent;border-right:7px solid var(--bg);border-left:0}
.k-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch}
@keyframes kBob      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes kBlink    { 0%,93%,100%{transform:scaleY(1)} 96%{transform:scaleY(0.1)} }
@keyframes kJump     { 0%,100%{transform:translateY(0) scale(1)} 35%{transform:translateY(-16px) scale(1.04,.96)} 70%{transform:translateY(0) scale(1.08,.92)} }
@keyframes kCloud    { from{transform:translateX(-40vw)} to{transform:translateX(140vw)} }
@keyframes kPulse    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
@keyframes kRing     { 0%{box-shadow:0 0 0 0 var(--ring,#ffc93caa)} 100%{box-shadow:0 0 0 16px #ffc93c00} }
@keyframes kStarPop  { 0%{transform:scale(0) rotate(-40deg);opacity:0} 70%{transform:scale(1.3) rotate(8deg);opacity:1} 100%{transform:scale(1) rotate(0)} }
@keyframes unicornRun  { 0%{transform:scaleX(-1) translateY(0)} 50%{transform:scaleX(-1) translateY(-18px)} 100%{transform:scaleX(-1) translateY(0)} }
@keyframes fallStar    { from{transform:translateY(0) rotate(0deg);opacity:1} to{transform:translateY(100vh) rotate(720deg);opacity:0} }
@keyframes popIn       { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
@keyframes glowPulse   { 0%,100%{box-shadow:0 0 10px #ffc93caa} 50%{box-shadow:0 0 26px #ffc93cff} }
@keyframes slideUp     { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes shake       { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
@keyframes hintWiggle  { 0%,100%{transform:rotate(0) scale(1)} 25%{transform:rotate(-6deg) scale(1.08)} 75%{transform:rotate(6deg) scale(1.08)} }
/* Wer in den Systemeinstellungen „Bewegung reduzieren" gewählt hat, bekommt keine Animationen */
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
}
`;
if (typeof document !== "undefined" && !document.getElementById("slk-style")) {
  const s = document.createElement("style"); s.id = "slk-style"; s.textContent = STYLE;
  document.head.appendChild(s);
}
const reducedMotion=()=>typeof window!=="undefined"&&!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Knopf mit „Knautsch"-Effekt: fühlt sich beim Drücken wie ein echter Knopf an
function Btn({bg="var(--coral)",sh="var(--coralD)",color="white",style,className="",children,...rest}){
  return <button className={"k-press "+className} style={{background:bg,color,"--sh":sh,borderRadius:18,padding:"10px 16px",fontWeight:900,fontSize:15,lineHeight:1.15,...style}} {...rest}>{children}</button>;
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
function Glyph({letter,height=24,color="currentColor",weight=2.2,crop=true,fit=false,tight=false,yr=null}){
  const strokes=STROKES[letter]||[];
  // Gleicher Ausschnitt für alle Zeichen (Umlaut-Punkte bis Unterlinie), damit Groß- und
  // Kleinbuchstaben in der richtigen Größe zueinander stehen. fit: nur der Buchstabe selbst
  // (für eine einzelne, große Anzeige)
  let x0=0,x1=100,top=crop?3:0,bottom=crop?LINES.bottom+5:130;
  if(fit&&strokes.length){
    const pts=strokes.flat(),ys=pts.map(p=>p[1]),xs=pts.map(p=>p[0]);
    const pad=8;top=Math.min(...ys)-pad;bottom=Math.max(...ys)+pad;
    const h=bottom-top,wNeed=h*AX;               // mindestens quadratisch wirken lassen
    const cx=(Math.min(...xs)+Math.max(...xs))/2,half=Math.max((Math.max(...xs)-Math.min(...xs))/2+pad,wNeed*0.35);
    x0=cx-half;x1=cx+half;
  }
  if(yr){top=yr[0];bottom=yr[1];}
  if(tight&&strokes.length){
    // Für Wörter: Buchstaben dicht nebeneinander, Höhe bleibt für alle gleich
    const xs=strokes.flat().map(p=>p[0]),pad=7;
    x0=Math.min(...xs)-pad;x1=Math.max(...xs)+pad;
  }
  const w=height*((x1-x0)/(bottom-top))/AX;
  return(
    <svg width={w} height={height} viewBox={`${x0} ${top} ${x1-x0} ${bottom-top}`} preserveAspectRatio="none" style={{display:"block",overflow:"visible"}}>
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

// Sterne zeigen, wie genau geschrieben wurde (Information, kein Urteil über das Kind)
const PRAISE=["","Weiter so! 💪","Schon fast! 👏","Gut geschrieben! 🌟","Sehr schön! ⭐","Super genau! 🏆"];

// Lob für den Weg, nicht für die Person: Startpunkt, Richtung, Dranbleiben, Strategie.
// Kinder, die für Anstrengung und Vorgehen gelobt werden, bleiben bei Fehlern eher dran
// (Mueller & Dweck 1998; Gunderson u. a. 2013).
function processPraise({stars,mode,formationErrors=0,tries=0}){
  if(stars<=2)return "Gut, dass du es versuchst! Schau nochmal genau hin. 💪";
  if(mode==="memory"&&stars>=4)return "Aus dem Kopf geschrieben! Du hast ihn dir gemerkt. 🧠";
  if(mode==="copy"&&stars>=4)return "Genau hingeschaut und abgeschrieben! 👀";
  if(tries>0)return "Du hast nicht aufgegeben – so lernt man! 💪";
  if(mode==="trace"&&formationErrors===0&&stars>=4)return "Jeden Strich am richtigen Punkt angefangen! 🎯";
  if(formationErrors>0)return "Du hast die Richtung verbessert! ↩️";
  if(stars>=4)return "Du hast genau auf die Linien geachtet! ✨";
  return "Gut geschrieben! Nächstes Mal noch näher an der Linie. 👍";
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPIELWELT — Welten, Tagesziel, Überraschungen, Stifte
// ═══════════════════════════════════════════════════════════════════════════════
// Jede Buchstabengruppe ist eine kleine Welt mit eigenem Lernweg (Karte).
// Nichts ist gesperrt: Kinder dürfen frei wählen (Autonomie).
const WORLDS={
  "GROß":{key:"GROß",short:"ABC",name:"Buchstaben-Berg",emoji:"⛰️",acc:"#8b5cf6",dark:"#6d28d9",soft:"#ede9fe",
    bg:"linear-gradient(180deg,#e9e3ff 0%,#f6f3ff 45%,#ffffff 100%)",deco:["🏔️","🌲","☁️","🐐","⛺","🌷","🦅","🌲"]},
  klein:{key:"klein",short:"abc",name:"Buchstaben-Wald",emoji:"🌳",acc:"#22c55e",dark:"#15803d",soft:"#dcfce7",
    bg:"linear-gradient(180deg,#d9f7e4 0%,#f0fdf4 45%,#ffffff 100%)",deco:["🌳","🍄","🦔","🌲","🐿️","🌼","🦉","🍄"]},
  Zahlen:{key:"Zahlen",short:"123",name:"Zahlen-Insel",emoji:"🏝️",acc:"#0ea5e9",dark:"#0369a1",soft:"#e0f2fe",
    bg:"linear-gradient(180deg,#d7f0ff 0%,#eff9ff 45%,#ffffff 100%)",deco:["🌴","🐚","🦀","🐠","⛵","🌊","🐳","🐚"]},
};
const ThemeCtx=createContext(WORLDS["GROß"]);

// Tagesziel: drei verschiedene Zeichen — danach sagt die App ausdrücklich,
// dass jetzt Pause sein darf (natürlicher Endpunkt statt Endlos-Schleife).
const DAILY_GOAL=3;
const todayKey=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};

// Überraschungen: werden beim Üben gefunden, aber vorher nicht angekündigt.
// Angekündigte Belohnungen („Wenn du …, bekommst du …") können die Freude an der
// Sache selbst verdrängen, unerwartete nicht (Deci, Koestner & Ryan 1999).
// Zähler: Zeichen, die mindestens einmal mit 4 oder 5 Sternen geschrieben wurden.
// Glücksspiel-Mechaniken (Zufallskisten) gibt es bewusst nicht.
const SURPRISES=[
  {id:"glitter",at:2, kind:"pen",name:"Glitzerstift",   emoji:"✨",text:"Du hast einen Glitzerstift gefunden!"},
  {id:"bow",    at:4, kind:"acc",name:"Schleife",       emoji:"🎀",text:"Klecks hat eine Schleife gefunden!"},
  {id:"hat",    at:7, kind:"acc",name:"Partyhut",       emoji:"🥳",text:"Klecks hat einen Partyhut gefunden!"},
  {id:"rainbow",at:10,kind:"pen",name:"Regenbogenstift",emoji:"🌈",text:"Du hast einen Regenbogenstift gefunden!"},
  {id:"flower", at:14,kind:"acc",name:"Blume",          emoji:"🌼",text:"Klecks hat eine Blume gefunden!"},
  {id:"glasses",at:20,kind:"acc",name:"Brille",         emoji:"👓",text:"Klecks hat eine Brille gefunden!"},
  {id:"crown",  at:28,kind:"acc",name:"Krone",          emoji:"👑",text:"Klecks hat eine Krone gefunden!"},
];
// Stiftfarben zum Aussuchen. Rot fehlt absichtlich: Rot bedeutet beim Nachfahren „neben der Linie".
const PENS={
  classic:{name:"Klassik",color:null,     swatch:"conic-gradient(#2ecc8f 0 50%,#1e3a8a 0)"},
  blue:   {name:"Blau",   color:"#2563eb",swatch:"#2563eb"},
  purple: {name:"Lila",   color:"#9333ea",swatch:"#9333ea"},
  teal:   {name:"Türkis", color:"#0d9488",swatch:"#0d9488"},
  glitter:{name:"Glitzer",color:null,     swatch:"radial-gradient(circle at 35% 35%,#fff7c2,#fbbf24 60%,#d97706)",special:true},
  rainbow:{name:"Regenbogen",color:null,  swatch:"conic-gradient(#fb923c,#fbbf24,#4ade80,#60a5fa,#a78bfa,#f472b6,#fb923c)",special:true},
};
const penAvailable=(id,unlocks)=>!!PENS[id]&&(!PENS[id].special||unlocks.includes(id));

const EDU_TIPS=[
  {icon:"🌟",title:"Richtig motivieren",text:"Loben Sie den Prozess, nicht das Ergebnis. 'Du hast dir wirklich Mühe gegeben!' statt 'Toll gemalt!'"},
  {icon:"⏰",title:"Pausen machen",text:"Kurze Pausen (5 Min. nach 15–20 Min. Übung) fördern die Konzentration deutlich."},
  {icon:"💪",title:"Fehlerkultur",text:"Zeigen Sie: Fehler sind Lernchancen. 'Schau, der Strich ist etwas daneben – versuch's nochmal!'"},
  {icon:"📅",title:"Lern-Rhythmus",text:"Täglich 10–15 Minuten üben ist effektiver als einmal pro Woche eine Stunde."},
  {icon:"👀",title:"Bereitschaft erkennen",text:"Wenn Ihr Kind unruhig oder frustriert wirkt, ist es Zeit für eine Pause oder einen anderen Tag."},
  {icon:"🧠",title:"Aus dem Kopf schreiben",text:"Nachfahren ist nur der Anfang. Am meisten lernen Kinder, wenn sie einen Buchstaben ansehen, abdecken und dann aus dem Gedächtnis schreiben. Die App führt Schritt für Schritt dorthin."},
  {icon:"➡️",title:"Richtung zählt",text:"Achten Sie auf Startpunkt und Schreibrichtung, nicht nur auf das Aussehen. Wer Buchstaben immer gleich schreibt, schreibt später flüssiger."},
  {icon:"🎁",title:"Spielen ohne Druck",text:"Die App belohnt Fortschritt mit kleinen Überraschungen, die vorher nicht angekündigt werden, statt mit Punkten zum Sammeln. Es gibt keine Serien, die abreißen, und kein „Komm zurück!“. Nach dem Tagesziel schlägt Klecks eine Pause vor."},
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
      <div style={{fontSize:96,lineHeight:1}}>🦄</div>
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
// ── Stifte: Farbe und Effekt eines Stücks Tinte ──────────────────────────────
// Regenbogen: Die Farbe wandert mit der geschriebenen Länge sanft von Orange über
// Gelb, Grün, Blau und Lila bis Pink und zurück. Rot bleibt ausgespart, weil Rot
// beim Nachfahren „neben der Linie" bedeutet.
let rainbowPos=0;
function rainbowColor(len){
  rainbowPos+=len;
  const t=(rainbowPos/240)%2,tri=t<1?t:2-t;
  return`hsl(${Math.round(28+290*tri)},92%,54%)`;
}
const penColorFor=(pen,len)=>pen==="rainbow"?rainbowColor(len):PENS[pen]?.color||null;
function paintInk(ctx,a,b,{color,glitter=false,width=10,alpha=0.85}){
  const line=(c,w)=>{ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();};
  ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
  if(glitter){
    // Leuchten hinter die Schrift legen, sonst entstehen Streifen
    ctx.save();ctx.globalCompositeOperation="destination-over";ctx.shadowColor="#fbbf24";ctx.shadowBlur=14;line("#fde68acc",width+2);ctx.restore();
    line(color,width-3);
  }else{ctx.globalAlpha=alpha;line(color,width);}
  ctx.restore();
}

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
// Vorlagen-Strich, der nur ein Punkt ist (i-Punkt, Umlaut-Punkte): einmal antippen reicht
const isDotStroke=(pts)=>pts.length>0&&polyLength(pts)<25;
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

// Rahmen ums Schreibfeld in der Farbe der Welt — wie ein Heftblatt auf einem Brett
function FieldFrame({W,H,scale,children}){
  const th=useContext(ThemeCtx);
  return(
    <div style={{background:"white",borderRadius:28,padding:7,border:`4px solid ${th.acc}`,boxShadow:`0 6px 0 ${th.dark}, 0 14px 30px ${th.dark}30`}}>
      <div style={{position:"relative",width:W*scale,height:H*scale,borderRadius:18,overflow:"hidden",background:"var(--paper)"}}>{children}</div>
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
  const th=useContext(ThemeCtx);
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
        ctx.strokeStyle=active?"rgba(99,102,241,0.15)":completed?th.acc:"rgba(180,180,210,0.28)";
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
          strokes.forEach(pts=>{ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j][0],pts[j][1]);ctx.strokeStyle=th.acc;ctx.lineWidth=10;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();});
          tmrRef.current=setTimeout(onDone,700);return;
        }
        tmrRef.current=setTimeout(()=>{rafRef.current=requestAnimationFrame(frame);},200);return;
      }
      rafRef.current=requestAnimationFrame(frame);
    }
    tmrRef.current=setTimeout(()=>{rafRef.current=requestAnimationFrame(frame);},300);
    return()=>{cancelAnimationFrame(rafRef.current);clearTimeout(tmrRef.current);};
  },[letter,strokes,drawRules,onDone,W,H,th.acc]);
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
      <KlecksBubble text="👀 Schau zu – dann bist du dran!" mood="think" tone="think" maxWidth={W*scale+22}/>
      <FieldFrame W={W} H={H} scale={scale}>
        <canvas ref={ref} width={W*k} height={H*k} style={{display:"block",width:"100%",height:"100%"}}/>
      </FieldFrame>
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
function TraceCanvas({letter,onComplete,onNext=null,tools=null,difficulty="medium",mode="trace",memoryDelay=1,pen="classic",
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
  const tries=useRef(0);        // neue Versuche am selben Buchstaben (für das Lob „nicht aufgegeben")
  // Messung: Aufgabenbeginn und alle Strichversuche mit Zeitstempeln
  const onsetRef=useRef(null);
  const attempts=useRef([]);
  const reported=useRef(false);
  const onTrialRef=useRef(onTrial);onTrialRef.current=onTrial;
  const markOnset=()=>requestAnimationFrame(ts=>{onsetRef.current=ts;});
  const [done,setDone]=useState(false);const [result,setResult]=useState(null);
  const [hasLines,setHasLines]=useState(false);const [confetti,setConfetti]=useState(false);
  const [kick,setKick]=useState(0);   // Klecks hüpft bei jedem geschafften Strich
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
  const paintSeg=(ctx,{a,b,kind,color})=>paintInk(ctx,a,b,{color,glitter:kind==="glitter",
    width:kind==="dot"?14:kind==="rainbow"?11:10,alpha:kind==="ink"?0.85:1});
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
    if(drawn.current.length)tries.current++;
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
    // Stiftfarbe: vom Kind gewählt; Regenbogen wechselt die Farbe, Glitzer leuchtet
    const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const penColor=()=>penColorFor(pen,len);
    const penKind=pen==="glitter"?"glitter":pen==="rainbow"?"rainbow":"ink";
    let seg;
    if(probe){seg={a,b,kind:"ink",color:"#1e3a8a"};}           // Schreibtest: immer gleich, ohne Effekte
    else if(!guided){seg={a,b,kind:penKind,color:penColor()||"#1e3a8a"};}
    else{
      // Nachfahren: Stiftfarbe (Klassik: Grün) auf der Linie, Rot daneben
      const d=distToPolyline(b[0],b[1],strokes);
      const onTrack=d<diff.tolerance;
      if(!onTrack&&!offTrackRef.current){haptic("off",hapticsEnabled);offTrackRef.current=true;}
      else if(onTrack&&offTrackRef.current){offTrackRef.current=false;}
      seg=onTrack
        ?{a,b,kind:pen==="glitter"||d<diff.tolerance*0.35?"glitter":penKind,color:penColor()||"#22c55e"}
        :{a,b,kind:"ink",color:"#f87171"};
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
    // Nur angetippt? Zählt nur als Punkt (i-Punkt, Umlaut-Punkte), sonst nicht als Strich.
    if(stroke.length<3){
      const p=stroke[0],exp=guided?strokes[strokeIdx.current]:null;
      const dotOk=guided
        ?!!exp&&isDotStroke(exp)&&Math.hypot(p[0]-exp[0][0],p[1]-exp[0][1])<Math.max(30,diff.tolerance*2.2)
        :strokes.some(isDotStroke);
      if(!dotOk){undoLastStroke();return;}
      const q=[p[0],p[1]+0.6,p[2]+1];
      stroke.splice(1,stroke.length-1,q,[p[0],p[1]+1.2,p[2]+2]);
      const color=probe?"#1e3a8a":penColorFor(pen,4)||(guided?"#22c55e":"#1e3a8a");
      const seg={a:p,b:q,kind:!probe&&pen==="glitter"?"glitter":"dot",color};
      segs.current.push(seg);paintSeg(ovRef.current.getContext("2d"),seg);
    }
    if(guided&&strokeIdx.current<strokes.length){
      const verdict=checkFormation(stroke,strokes[strokeIdx.current],diff.tolerance);
      attempts.current.push({pts:stroke.slice(),accepted:!verdict,verdict:verdict||"ok",expected:strokeIdx.current});
      if(verdict){
        formationErrors.current++;
        undoLastStroke();haptic("off",hapticsEnabled);sfx("oops");
        showCoach(COACH[verdict]);
        setTimeout(startPulse,80);
        return;
      }
      strokeIdx.current++;
      haptic("tick",hapticsEnabled);sfx("stroke");
      drawTemplate(bgRef.current.getContext("2d"));
      setKick(n=>n+1);
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
    const praise=processPraise({stars:s,mode,formationErrors:formationErrors.current,tries:tries.current});
    clearTimeout(coachTimer.current);setCoach(null);
    setResult({stars:s,note,praise});setDone(true);
    clearTimeout(idleTimerRef.current);setShowHintBtn(false);
    haptic(s===5?"celebrate":s>=3?"success":"tick",hapticsEnabled);
    sfx(s>=4?"fanfare":s>=3?"done":"soft");
    setTimeout(()=>onSpeak(note||praise),500);
    if(s===5)setConfetti(true);
    onComplete(s,{mode,mirrored});
  };

  const allStrokesDone=guided&&strokeIdx.current>=strokes.length;
  const hint=mode==="memory"&&memPhase==="show"?"🧠 Merk dir den Buchstaben!"
    :mode==="memory"&&memPhase==="wait"?"🤫 Gleich bist du dran …"
    :mode==="memory"?"✏️ Jetzt aus dem Kopf schreiben!"
    :mode==="copy"?"👀 Schau auf die Vorlage und schreib ihn ab!"
    :probe?"✏️ Schreib ihn aus dem Kopf!"
    :allStrokesDone?"✓ Super! Tippe auf Fertig."
    :`👉 Strich ${strokeIdx.current+1} von ${strokes.length} — nachfahren!`;
  // Klecks: Mimik und Farbe der Sprechblase passen zur Situation
  const bubble=done&&result?{text:result.note||result.praise,mood:result.note?"think":result.stars>=3?"cheer":"happy",tone:result.note?"coach":result.stars>=3?"praise":"info"}
    :coach?{text:coach,mood:"oops",tone:"coach"}
    :mode==="memory"&&memPhase!=="write"?{text:hint,mood:"think",tone:"think"}
    :allStrokesDone?{text:hint,mood:"cheer",tone:"praise"}
    :{text:hint,mood:"happy",tone:"info"};

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
      {probe
        ?<div style={{fontSize:15,color:"#334155",background:"white",borderRadius:16,padding:"8px 18px",border:"3px solid #ccfbf1",fontWeight:800,textAlign:"center"}}>{hint}</div>
        :mode==="copy"
          ?<div style={{display:"flex",alignItems:"center",gap:8,width:"100%",maxWidth:W*scale+22}}>
             <div style={{flex:1,minWidth:0}}><KlecksBubble {...bubble} kick={kick}/></div>
             <ModelCard letter={letter} W={96} H={114}/>
           </div>
          :<KlecksBubble {...bubble} kick={kick} maxWidth={W*scale+22}/>}
      <div style={{position:"relative"}}>
        <FieldFrame W={W} H={H} scale={scale}>
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
            {done&&result&&!probe&&<StarResult stars={result.stars} hint={!guided?"Grün = so sieht die Vorlage aus":null}/>}
        </FieldFrame>
        {confetti&&<Confetti/>}
      </div>
      <div style={{display:"flex",gap:10,marginTop:4,flexWrap:"wrap",justifyContent:"center",alignItems:"center"}}>
        {probe&&!done&&<Btn bg="white" sh="#cbd5e1" color="#64748b" style={{border:"2px solid #cbd5e1"}} onClick={()=>{report(false,{skipped:1});setDone(true);onComplete(0,{mode,skipped:true});}}>🤷 Weiß ich nicht</Btn>}
        {!(done&&probe)&&<Btn bg="white" sh="#fca5a5" color="#e11d48" style={{border:"2px solid #fecdd3"}} onClick={()=>{sfx("tap");mode==="memory"?setRound(r=>r+1):reset();}}>{done?"🔁 Nochmal":"🗑️ Neu"}</Btn>}
        {hasLines&&!done&&<Btn bg="var(--mint)" sh="var(--mintD)" onClick={checkScore} style={{animation:allStrokesDone?"glowPulse 1.6s infinite":"none"}}>✓ Fertig</Btn>}
        {done&&!probe&&onNext&&<Btn bg="var(--coral)" sh="var(--coralD)" data-k="next" onClick={()=>{sfx("pop");onNext();}} style={{minWidth:120,animation:"popIn 0.35s ease-out"}}>Weiter ➜</Btn>}
        {showHintBtn&&!done&&!hasLines&&guided&&(
          <Btn bg="#fff4c2" sh="#f2c94c" color="#8a5a00" style={{border:"2px solid #ffc93c",animation:"hintWiggle 0.5s ease-in-out 0s 3"}}
            onClick={()=>{setShowHintBtn(false);resetIdleTimer();startPulse();haptic("tick",hapticsEnabled);}}>
            👆 Hier starten!
          </Btn>
        )}
        {showHintBtn&&!done&&hasLines&&!allStrokesDone&&(
          <Btn bg="#fff4c2" sh="#f2c94c" color="#8a5a00" style={{border:"2px solid #ffc93c",animation:"hintWiggle 0.5s ease-in-out 0s 3"}} onClick={checkScore}>
            🤔 Fertig?
          </Btn>
        )}
        {!probe&&tools}
      </div>
    </div>
  );
}

// Ergebnis im Schreibfeld: Sterne erscheinen nacheinander
function StarResult({stars,hint,label}){
  return(
    <div data-stars={stars} style={{position:"absolute",left:0,right:0,bottom:0,background:"#ffffffeb",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"10px 8px 12px",borderTop:"3px solid #ffe7a3",animation:"slideUp 0.3s ease-out"}}>
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        {[1,2,3,4,5].map(i=><span key={i} style={{fontSize:30,lineHeight:1,display:"inline-block",filter:i<=stars?"none":"grayscale(1) opacity(0.22)",animation:i<=stars?`kStarPop 0.45s ease-out ${i*0.12}s both`:"none"}}>⭐</span>)}
      </div>
      <div style={{fontSize:18,color:"var(--ink)",fontWeight:900}}>{label||PRAISE[stars]}</div>
      {hint&&<div style={{fontSize:11,color:"#16a34a",fontWeight:800}}>{hint}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GUIDED CANVAS  — Phase 1: geführt, Phase 2: frei nachzeichnen, Phase 3: Vergleich
// ═══════════════════════════════════════════════════════════════════════════════
function GuidedCanvas({letter, onComplete, onNext=null, tools=null, pen="classic", onSpeak=()=>{}, onTrial=null, scale=1, W=260, H=310}){
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
  const [statusMsg,setStatusMsg]=useState("👆 Leg den Finger auf den orangen Punkt!");
  const [kick,setKick]=useState(0);
  const [confetti,setConfetti]=useState(false);
  const [hasDrawn,setHasDrawn]=useState(false);
  const [scoreInfo,setScoreInfo]=useState({score:0,label:"",color:"#374151"});

  const strokes=useStrokes(letter,W,H);

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
    setStatusMsg("👆 Leg den Finger auf den orangen Punkt!");
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
        const tpl=strokes[strokeIdx.current];
        if(isDotStroke(tpl)){
          // Punkt (i, ä, ö, ü): einmal antippen reicht
          const c=tpl[Math.floor(tpl.length/2)];
          paintInk(ovRef.current.getContext("2d"),c,[c[0],c[1]+0.6],{color:penColorFor(pen,4)||"#4361ee",glitter:pen==="glitter",width:15,alpha:1});
          finishGuidedStroke();
          return;
        }
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
      const a=[lastSnapped.current.x,lastSnapped.current.y];
      paintInk(ctx,a,sp,{color:penColorFor(pen,Math.hypot(sp[0]-a[0],sp[1]-a[1]))||"#4361ee",glitter:pen==="glitter",width:11,alpha:1});
      ctx.beginPath();ctx.arc(sp[0],sp[1],9,0,Math.PI*2);ctx.fillStyle="#fbbf2450";ctx.fill();
      ctx.beginPath();ctx.arc(sp[0],sp[1],4,0,Math.PI*2);ctx.fillStyle="#fbbf24";ctx.fill();
    }
    lastSnapped.current={x:sp[0],y:sp[1]};currentStrokePts.current.push({x:sp[0],y:sp[1]});
    drawGuidedTemplate(bgRef.current.getContext("2d"));
    const pts=strokes[strokeIdx.current];
    if(progressRef.current>=pts.length-3)finishGuidedStroke();
  };
  // Strich im geführten Teil geschafft → nächster Strich oder ab ins freie Nachfahren
  const finishGuidedStroke=()=>{
    currentStrokePts.current=[];strokeStarted.current=false;isDrawing.current=false;progressRef.current=0;lastSnapped.current=null;
    setKick(n=>n+1);sfx("stroke");
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
      const m=isDotStroke(strokes[strokeIdx.current])?"👆 Jetzt den Punkt antippen!":"👆 Tippe auf den nächsten Punkt!";setStatusMsg(m);onSpeak(m);
      drawGuidedTemplate(bgRef.current.getContext("2d"));
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
      const a=[freeLastPos.current.x,freeLastPos.current.y],near=ratio<0.6;
      const pc=near?penColorFor(pen,Math.hypot(pos.x-a[0],pos.y-a[1])):null;
      paintInk(ctx,a,[pos.x,pos.y],{color:pc||`rgb(${r},${g2},${b})`,glitter:pen==="glitter"&&near,width:10,alpha:1});
    }
    freePoints.current.push(pos);freeStrokePts.current.push(pos);freeLastPos.current=pos;
    drawFreeTemplate(bgRef.current.getContext("2d"));
  };
  const freeEnd=(e)=>{
    e?.preventDefault();isDrawing.current=false;freeLastPos.current=null;
    // Punkt (i, ä, ö, ü): einmal antippen reicht
    const fp=freeStrokePts.current,tpl=strokes[freeStrokeIdx.current];
    if(fp.length&&fp.length<3&&tpl&&isDotStroke(tpl)){
      const p=fp[0],near=distToPolyline(p.x,p.y,strokes)<18;
      paintInk(ovRef.current.getContext("2d"),[p.x,p.y],[p.x,p.y+0.6],{color:near?(penColorFor(pen,4)||"rgb(34,197,94)"):"rgb(239,68,68)",glitter:pen==="glitter"&&near,width:14,alpha:1});
      const extra=[{x:p.x,y:p.y+0.6},{x:p.x,y:p.y+1.2}];
      freePoints.current.push(...extra);fp.push(...extra);
    }
    freePoints.current.push(null);
    if(freeStrokePts.current.length<3){freeStrokePts.current=[];return;}
    freeStrokePts.current=[];
    const next=freeStrokeIdx.current+1;
    if(next<strokes.length){
      sfx("stroke");setKick(n=>n+1);
      freeStrokeIdx.current=next;
      drawFreeTemplate(bgRef.current.getContext("2d"));
      const m=`✏️ Strich ${next+1} von ${strokes.length}!`;setStatusMsg(m);onSpeak(m);
      setHasDrawn(false);
    } else {
      setHasDrawn(true);const m="✓ Super! Tippe auf Fertig!";setStatusMsg(m);onSpeak(m);
    }
  };

  const finishFree=()=>{
    const pct=calcScore(),stars=Math.max(1,Math.round(pct/20));
    const label=pct>=90?"🌟 Super genau!":pct>=70?"👍 Sehr schön!":pct>=50?"😊 Gut geschrieben!":"💪 Weiter so!";
    const color=pct>=90?"#16a34a":pct>=70?"#4361ee":pct>=50?"#f59e0b":"#f97316";
    const praise=stars>=3?"Erst mit Hilfe, dann ganz allein nachgefahren! 🖐️":processPraise({stars,mode:"guided"});
    setScoreInfo({score:pct,label,color,praise,stars});setPhase("compare");
    sfx(stars>=4?"fanfare":stars>=3?"done":"soft");
    setTimeout(()=>onSpeak(praise),500);
    reportG(true,{score_raw:pct/100,stars,n_strokes:strokes.length});
    onComplete(stars,{mode:"guided"});
  };

  const bubble=phase==="compare"?{text:scoreInfo.praise,mood:scoreInfo.stars>=3?"cheer":"happy",tone:scoreInfo.stars>=3?"praise":"info"}
    :statusMsg.startsWith("✓")?{text:statusMsg,mood:"cheer",tone:"praise"}
    :{text:statusMsg,mood:"happy",tone:"info"};
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
      <KlecksBubble {...bubble} kick={kick} maxWidth={W*scale+22}/>
      <div style={{position:"relative"}}>
        <FieldFrame W={W} H={H} scale={scale}>
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
              <div style={{position:"absolute",inset:0,overflow:"hidden",background:"#f8fafc"}}>
                <canvas ref={compareRef} width={W*k} height={H*k} style={{display:"block",width:"100%",height:"100%"}}/>
                <div style={{position:"absolute",top:0,left:0,right:0,display:"flex",justifyContent:"center",gap:10,padding:"5px 8px",background:"rgba(255,255,255,0.92)",borderBottom:"1px solid #e2e8f0",fontSize:11,fontWeight:800}}>
                  <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:14,height:5,borderRadius:3,background:"rgba(180,180,200,0.7)",display:"inline-block"}}/>Vorlage</span>
                  <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:14,height:5,borderRadius:3,background:"#22c55e",display:"inline-block"}}/>Genau</span>
                  <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:14,height:5,borderRadius:3,background:"#ef4444",display:"inline-block"}}/>Abweichung</span>
                </div>
                <StarResult stars={scoreInfo.stars} label={scoreInfo.label}/>
              </div>
            )}
        </FieldFrame>
        {confetti&&<Confetti/>}
      </div>
      <div style={{display:"flex",gap:10,marginTop:4,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
        <Btn bg="white" sh="#fca5a5" color="#e11d48" style={{border:"2px solid #fecdd3"}} onClick={()=>{sfx("tap");reset();}}>{phase==="compare"?"🔁 Nochmal":"🗑️ Neu"}</Btn>
        {phase==="freeTrace"&&hasDrawn&&<Btn bg="var(--mint)" sh="var(--mintD)" onClick={finishFree} style={{animation:"glowPulse 1.6s infinite"}}>✓ Fertig</Btn>}
        {phase==="compare"&&onNext&&<Btn bg="var(--coral)" sh="var(--coralD)" data-k="next" onClick={()=>{sfx("pop");onNext();}} style={{minWidth:120,animation:"popIn 0.35s ease-out"}}>Weiter ➜</Btn>}
        {tools}
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// FORSCHUNG — Teilnahme im Elternbereich, Zustimmung des Kindes, Schreibtest
// ═══════════════════════════════════════════════════════════════════════════════
const fmtCode=(pid)=>pid?`${pid.slice(0,3)}-${pid.slice(3)}`:"";
const studyBtn=(bg,fg="white",border="none")=>({width:"100%",padding:10,background:bg,color:fg,border,borderRadius:14,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:6});

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
  const box={background:"white",borderRadius:24,padding:20,maxWidth:440,width:"100%",maxHeight:"88vh",overflowY:"auto",position:"relative",boxShadow:"0 20px 60px #0004",fontFamily:"inherit",color:"#334155"};
  const p={fontSize:13,lineHeight:1.55,margin:"0 0 8px"};
  const check=(k,label)=>(
    <label style={{display:"flex",gap:9,alignItems:"flex-start",fontSize:13,lineHeight:1.45,marginBottom:10,cursor:"pointer"}}>
      <input type="checkbox" checked={c[k]} onChange={e=>setC({...c,[k]:e.target.checked})} style={{width:18,height:18,marginTop:1,flexShrink:0}}/>
      <span>{label}</span>
    </label>
  );
  const select=(k,label,opts)=>(
    <label style={{display:"block",fontSize:12,fontWeight:700,margin:"0 0 8px"}}>{label}
      <select value={d[k]} onChange={e=>setD({...d,[k]:e.target.value})} style={{display:"block",width:"100%",marginTop:3,padding:8,borderRadius:10,border:"2px solid #e2e8f0",fontSize:13,fontFamily:"inherit"}}>
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
  const page={minHeight:"100vh",background:"linear-gradient(160deg,#ecfeff,#f0fdfa)",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",padding:12,gap:10};
  const big={padding:"14px 28px",borderRadius:18,border:"none",background:"#0f766e",color:"white",fontWeight:900,fontSize:17,cursor:"pointer",fontFamily:"inherit"};
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

// Als App auf den Startbildschirm — mit eigenem Knopf, weil Browser ihren Hinweis
// nach dem Löschen der App oft nicht mehr von selbst zeigen
function InstallSection(){
  const inst=useInstall();
  const [msg,setMsg]=useState(null);
  const p={fontSize:12,color:"#475569",margin:"0 0 6px",lineHeight:1.5};
  return(
    <div style={{marginBottom:14,paddingBottom:14,borderBottom:"1px solid #e2e8f0"}}>
      <h4 style={{margin:"0 0 6px",fontSize:14,fontWeight:800,color:"#1e3a8a"}}>📲 Als App installieren</h4>
      {inst.standalone?<p style={p}>✓ Die App ist installiert und läuft im Vollbild.</p>
      :!inst.secure?<p style={p}>Installieren geht nur, wenn die Seite über <b>https://</b> aufgerufen wird.</p>
      :inst.canPrompt?<button onClick={async()=>setMsg(await inst.prompt()?"✓ Wird installiert.":"Abgebrochen – du kannst es jederzeit wieder versuchen.")} style={studyBtn("#1e3a8a")}>📲 Jetzt installieren</button>
      :inst.ios?<p style={p}>In <b>Safari</b> auf das Teilen-Symbol <b>⬆️</b> tippen, dann <b>„Zum Home-Bildschirm“</b>.</p>
      :<p style={p}>Im Browser-Menü <b>⋮</b> auf <b>„App installieren“</b> oder <b>„Zum Startbildschirm hinzufügen“</b> tippen. Wurde die App gerade gelöscht, die Seite einmal neu laden – dann erscheint hier ein Knopf.</p>}
      {msg&&<p style={{...p,fontWeight:700}}>{msg}</p>}
      <p style={{...p,color:"#94a3b8",margin:0}}>
        {inst.ios?"Auf iPhone und iPad wird beim Löschen der App auch der Fortschritt gelöscht."
          :"Der Fortschritt ist im Browser gespeichert und bleibt auch erhalten, wenn die App gelöscht und neu installiert wird. Für einen Neuanfang unten „Fortschritt zurücksetzen“ wählen."}
      </p>
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
        <h3 style={{margin:"0 0 4px",fontSize:18,fontWeight:900,color:"#1e3a8a",fontFamily:"inherit"}}>Elternbereich</h3>
        <p style={{fontSize:13,color:"#64748b",margin:"0 0 16px"}}>Bitte löse die Aufgabe:</p>
        <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center",marginBottom:12}}>
          <span style={{fontSize:22,fontWeight:900,color:"#1e3a8a"}}>{math.a}</span>
          <span style={{fontSize:18,color:"#64748b"}}>+</span>
          <span style={{fontSize:22,fontWeight:900,color:"#1e3a8a"}}>{math.b}</span>
          <span style={{fontSize:18,color:"#64748b"}}>=</span>
          <input value={ans} onChange={e=>setAns(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(parseInt(ans)===math.ans?setAccess(true):setErr(true))}
            style={{width:56,padding:"8px",fontSize:18,border:`2px solid ${err?"#ef4444":"#e2e8f0"}`,borderRadius:10,textAlign:"center",fontFamily:"inherit"}}/>
        </div>
        {err&&<p style={{color:"#ef4444",fontSize:12,margin:"0 0 10px"}}>✗ Leider falsch — nochmal!</p>}
        <button onClick={()=>parseInt(ans)===math.ans?setAccess(true):setErr(true)}
          style={{width:"100%",padding:12,background:"#1e3a8a",color:"white",border:"none",borderRadius:14,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
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
        <h3 style={{margin:"0 0 2px",fontSize:18,fontWeight:900,color:"#1e3a8a",fontFamily:"inherit"}}>Elternbereich</h3>
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
              <button key={k} onClick={()=>onChange({...settings,difficulty:k})} style={{padding:"10px 14px",borderRadius:12,border:`2px solid ${settings.difficulty===k?"#4361ee":"#e2e8f0"}`,background:settings.difficulty===k?"#4361ee":"white",color:settings.difficulty===k?"white":"#374151",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Screen time */}
        <div style={{marginBottom:14,paddingBottom:14,borderBottom:"1px solid #e2e8f0"}}>
          <h4 style={{margin:"0 0 8px",fontSize:14,fontWeight:800,color:"#1e3a8a"}}>⏱️ Bildschirmzeit</h4>
          <select value={settings.screenTime} onChange={e=>onChange({...settings,screenTime:parseInt(e.target.value)})}
            style={{width:"100%",padding:10,borderRadius:10,border:"2px solid #e2e8f0",fontSize:13,fontFamily:"inherit"}}>
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
          {[["autoAdvance","Automatisch zum nächsten Buchstaben (sonst mit dem Knopf „Weiter“)"],["speechEnabled","Vorlesen aktiviert"],["soundEnabled","Töne (kurze Klänge bei Erfolg)"],["rewardVideos","Überraschungen und Effekte zeigen (Fundstücke, Einhorn, Sternenregen)"]].map(([k,label])=>(
            <label key={k} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#374151",marginBottom:8,cursor:"pointer"}}>
              <input type="checkbox" checked={k==="soundEnabled"?settings[k]!==false:!!settings[k]} onChange={e=>onChange({...settings,[k]:e.target.checked})} style={{width:16,height:16}}/>
              {label}
            </label>
          ))}
        </div>

        <InstallSection/>

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
            <div><b>Gefundene Überraschungen:</b> {(settings.unlocks||[]).length} von {SURPRISES.length}</div>
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

        <button onClick={onClose} style={{width:"100%",padding:10,background:"#e2e8f0",border:"none",borderRadius:14,fontWeight:700,fontSize:13,cursor:"pointer",color:"#475569",fontFamily:"inherit"}}>
          Elternbereich schließen
        </button>
        <button onClick={()=>{if(window.confirm("Wirklich alle Fortschritte zurücksetzen? Das kann nicht rückgängig gemacht werden.")){clearPersisted();setTimeout(()=>window.location.reload(),120);}}} style={{width:"100%",padding:8,background:"white",border:"2px solid #f87171",borderRadius:14,fontWeight:700,fontSize:12,cursor:"pointer",color:"#ef4444",fontFamily:"inherit",marginTop:6}}>
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
    <div style={{position:"fixed",inset:0,background:"rgba(20,24,44,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,backdropFilter:"blur(4px)",padding:16}}>
      <div className="k-card" style={{padding:24,maxWidth:330,textAlign:"center",animation:"slideUp 0.4s ease"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:6}}><Klecks size={96} mood="sleepy"/></div>
        <h3 style={{margin:"0 0 8px",fontSize:22,fontWeight:900}}>Pausen-Zeit!</h3>
        <p style={{fontSize:15,color:"var(--ink2)",margin:"0 0 18px",lineHeight:1.5}}>Du hast jetzt {limit} Minuten geübt.<br/>Dein Kopf freut sich über eine kleine Pause. 🌱</p>
        <Btn bg="var(--mint)" sh="var(--mintD)" style={{width:"100%",fontSize:16,marginBottom:10}} onClick={onDismiss}>OK, mache Pause!</Btn>
        <button onClick={onDismiss} style={{background:"none",border:"none",color:"var(--muted)",fontSize:13,cursor:"pointer",fontWeight:800}}>Noch 5 Minuten üben</button>
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
    <div className="k-card" style={{background:"linear-gradient(135deg,#fffbea,#fff1c1)",padding:16,maxWidth:560,margin:"0 auto"}}>
      <div style={{fontSize:16,fontWeight:900,color:"#78350f",marginBottom:10}}>🎀 {perfect.length} Sticker gesammelt</div>
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
      {perfect.length===0&&<div style={{textAlign:"center",color:"#a16207",fontSize:14,marginTop:8}}>Hier kleben bald deine ersten Sticker! ✨</div>}
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
    <div className="k-card" style={{background:"linear-gradient(135deg,#f3fff7,#dcfce7)",padding:14}}>
      <div style={{fontSize:16,fontWeight:900,color:"#166534",marginBottom:8}}>{WORLDS[tab].emoji} {WORLDS[tab].name}</div>
      <div style={{display:"flex",gap:14,marginBottom:10}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"#16a34a"}}>{learned.length}</div><div style={{fontSize:10,color:"#6b7280"}}>geübt</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"#f59e0b"}}>{perfect.length}</div><div style={{fontSize:10,color:"#6b7280"}}>perfekt 🌻</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"#6366f1"}}>⭐{avg}</div><div style={{fontSize:10,color:"#6b7280"}}>Ø</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(9,1fr)",gap:3}}>
        {items.map(l=><span key={l} title={`${l}: ${learnedMap[l]||0}⭐`} style={{fontSize:20,textAlign:"center"}}>{flower(learnedMap[l]||0)}</span>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LETTER GRID
// ═══════════════════════════════════════════════════════════════════════════════
// Anlaut-Karte neben dem Buchstaben: „🐭 Maus" mit hervorgehobenem Buchstaben
function AnlautChip({letter,onSay}){
  const th=useContext(ThemeCtx);
  const a=anlautOf(letter)||(ANIMALS[letter]?[ANIMALS[letter],LETTER_NAMES[letter]]:null);if(!a)return null;
  const [emoji,word]=a;
  const i=word.toLowerCase().indexOf(letter.toLowerCase());
  return(
    <button onClick={onSay} className="k-press" style={{display:"flex",alignItems:"center",gap:6,background:"white","--sh":"#dfe4ee",borderRadius:16,padding:"5px 12px",minWidth:0,overflow:"hidden"}}>
      <span style={{fontSize:26,lineHeight:1}}>{emoji}</span>
      <span style={{fontSize:17,fontWeight:800,color:"var(--ink2)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
        {i<0?word:<>{word.slice(0,i)}<span style={{color:th.acc,fontWeight:900,fontSize:21}}>{word[i]}</span>{word.slice(i+1)}</>}
      </span>
    </button>
  );
}

function LetterGrid({items,learnedMap,onSelect,current}){
  const th=useContext(ThemeCtx);
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:7}}>
      {items.map(item=>{
        const s=learnedMap[item]||0;const active=current===item;
        return(
          <button key={item} data-letter={item} onClick={()=>onSelect(item)} className="k-press"
            style={{background:active?th.acc:s>=5?"#fff1a8":s>=1?th.soft:"white","--sh":active?th.dark:s>=5?"#e9c46a":"#dfe4ee",borderRadius:14,padding:"6px 2px 3px",display:"flex",flexDirection:"column",alignItems:"center"}}>
            <Glyph letter={item} height={30} weight={2.6} color={active?"white":"var(--ink)"}/>
            <span style={{fontSize:9,lineHeight:1.2,height:11}}>{s>=5?"🌻":s>=3?"🌼":s>=1?"🌱":""}</span>
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
    <div style={{display:"flex",flexDirection:"column",gap:16,maxWidth:560,margin:"0 auto"}}>
      {available.length===0&&(
        <div className="k-card" style={{display:"flex",alignItems:"center",gap:12,padding:14}}>
          <Klecks size={56} mood="think"/>
          <div style={{fontSize:15,color:"var(--ink2)",lineHeight:1.35}}>Schreib noch ein paar Buchstaben – dann kannst du hier ganze Wörter schreiben!</div>
        </div>
      )}
      {available.length>0&&(
        <div>
          <div style={{fontSize:16,fontWeight:900,color:"#78350f",marginBottom:10}}>✅ Diese Wörter kannst du schon schreiben:</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
            {available.map(w=>(
              <button key={w.word} data-word={w.word} onClick={()=>{sfx("tap");onPractice(w);}} className="k-press"
                style={{background:"white","--sh":"#f2c94c",border:"3px solid #ffd666",borderRadius:20,padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <div style={{fontSize:30,lineHeight:1}}>{w.meaning.split(" ").slice(-1)[0]}</div>
                <GlyphWord word={w.word} height={26} color="#78350f"/>
                <div style={{fontSize:12,color:"#b45309",fontWeight:900}}>✏️ Schreiben</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {almost.length>0&&(
        <div>
          <div style={{fontSize:16,fontWeight:900,color:"var(--ink2)",marginBottom:10}}>🔜 Fast geschafft:</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
            {almost.map(w=>{
              const miss=w.letters.filter(l=>!learned.has(l));
              return(
                <div key={w.word} style={{background:"#ffffffb3",borderRadius:20,padding:"12px 8px",textAlign:"center",border:"3px dashed #e2c98a"}}>
                  <GlyphWord word={w.word} height={22} color="#a8a29e" missing={miss}/>
                  <div style={{fontSize:12,color:"#ef4444",marginTop:6,fontWeight:800}}>es fehlt: {miss.join(", ")}</div>
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
const WORD_THEME={key:"wort",acc:"#f59e0b",dark:"#b45309",soft:"#fef3c7",bg:"linear-gradient(180deg,#fff3c4 0%,#fffbea 45%,#ffffff 100%)"};
function WordPractice({word, settings, pen="classic", onSpeak=()=>{}, onTrial=null, scale=1, onBack}){
  const letters=word.word.split("");
  const [idx,setIdx]=useState(0);           // current letter index
  const [doneLetters,setDoneLetters]=useState([]); // stars per letter
  const [phase,setPhase]=useState("anim"); // anim | trace
  const [replayKey,setReplayKey]=useState(0);
  const [finished,setFinished]=useState(false);

  const current=letters[idx];

  const handleLetterDone=(stars)=>{
    const next=[...doneLetters,stars];
    setDoneLetters(next);
    if(idx<letters.length-1){
      setTimeout(()=>{ setIdx(idx+1); setPhase("anim"); setReplayKey(k=>k+1); },2600);
    } else {
      setTimeout(()=>{setFinished(true);sfx("fanfare");},2600);
    }
  };

  if(finished){
    return(
      <div style={{minHeight:"100vh",background:WORD_THEME.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:20}}>
        <Klecks size={110} mood="cheer" anim="jump"/>
        <div style={{fontSize:56,lineHeight:1}}>{word.meaning.split(" ").slice(-1)[0]}</div>
        <GlyphWord word={word.word} height={48} color="#78350f"/>
        <div className="k-card" style={{padding:"12px 20px",fontSize:17,fontWeight:900,textAlign:"center"}}>
          Du hast das ganze Wort geschrieben! 🎉
          <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:6}}>
            {letters.map((l,i)=><div key={i} style={{textAlign:"center",fontSize:12}}><b style={{fontSize:16}}>{l}</b><br/>{"⭐".repeat(doneLetters[i]||0)}</div>)}
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <Btn bg="var(--sun)" sh="var(--sunD)" color="#5a3a00" onClick={()=>{ setIdx(0);setDoneLetters([]);setPhase("anim");setReplayKey(k=>k+1);setFinished(false); }}>🔄 Nochmal</Btn>
          <Btn bg="var(--sky)" sh="var(--skyD)" onClick={onBack}>← Zurück</Btn>
        </div>
      </div>
    );
  }

  const pill=(active,c)=>({padding:"6px 12px",borderRadius:14,background:active?c:"white",color:active?"white":c,border:`2px solid ${c}`,fontWeight:900,fontSize:13,"--sh":active?"#0002":"#dfe4ee"});
  return(
    <ThemeCtx.Provider value={WORD_THEME}>
    <div style={{minHeight:"100vh",background:WORD_THEME.bg,display:"flex",flexDirection:"column",alignItems:"center",padding:10,gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:8,width:"100%",maxWidth:560}}>
        <RoundBtn onClick={onBack} aria-label="Zurück">←</RoundBtn>
        <div className="k-card" style={{flex:1,padding:"8px 12px",display:"flex",alignItems:"center",gap:10,borderRadius:18}}>
          <span style={{fontSize:30,lineHeight:1}}>{word.meaning.split(" ").slice(-1)[0]}</span>
          <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
            {letters.map((l,i)=>{
              const done=i<idx,active=i===idx;
              return(
                <div key={i} style={{width:34,height:38,borderRadius:10,background:done?"#d9f7e4":active?WORD_THEME.acc:"#f4f5f8",border:`2px solid ${done?"#2ecc8f":active?WORD_THEME.dark:"#e3e8f2"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",transform:active?"scale(1.12)":"none",transition:"all .2s"}}>
                  {done?<span style={{fontSize:16}}>✓</span>:<Glyph letter={l} height={30} weight={2.6} color={active?"white":"#9aa3b5"}/>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:6,justifyContent:"center"}}>
        <button className="k-press" style={pill(phase==="anim","#f97316")} onClick={()=>{setPhase("anim");setReplayKey(k=>k+1);}}>▶ Zeigen</button>
        {settings.allowedModes?.guided&&<button className="k-press" style={pill(phase==="trace_guided","#22c55e")} onClick={()=>setPhase("trace_guided")}>🖐️ Geführt</button>}
        {settings.allowedModes?.trace&&<button className="k-press" style={pill(phase==="trace_free","#4361ee")} onClick={()=>setPhase("trace_free")}>✏️ Nachfahren</button>}
      </div>
      <div style={{display:"flex",justifyContent:"center"}}>
        {phase==="anim"&&
          <AnimCanvas key={`wanim-${current}-${idx}-${replayKey}`} letter={current} scale={scale}
            onDone={()=>setPhase(settings.allowedModes?.guided?"trace_guided":"trace_free")}/>}
        {phase==="trace_guided"&&
          <GuidedCanvas key={`wguided-${current}-${idx}-${replayKey}`} letter={current} onComplete={handleLetterDone} onSpeak={onSpeak} scale={scale} pen={pen}
            onTrial={onTrial&&(t=>onTrial(current,t))}/>}
        {phase==="trace_free"&&
          <TraceCanvas key={`wtrace-${current}-${idx}-${replayKey}`} letter={current}
            onComplete={handleLetterDone} difficulty={settings.difficulty} mode="trace" pen={pen}
            lefthanded={!!settings.lefthanded} highContrast={!!settings.highContrast} hapticsEnabled={settings.hapticsEnabled!==false}
            onSpeak={onSpeak} scale={scale} onTrial={onTrial&&(t=>onTrial(current,t))}/>}
      </div>
    </div>
    </ThemeCtx.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPIELWELT-BAUSTEINE — Kopfzeile, Tagesziel, Lernkarte, Klecks-Zimmer, Überraschungen
// ═══════════════════════════════════════════════════════════════════════════════
// Meisterschaft pro Zeichen: 0 neu · 1 geübt · 2 abschreiben · 3 aus dem Kopf · 4 sitzt (👑)
function masteryOf(l,learnedMap,stageMap,memMap){
  if(!((learnedMap[l]||0)>0))return 0;
  if((memMap[l]||0)>0)return 4;
  return Math.min(3,stageMap[l]||1);
}
// Begleiter aus dem Speicher: Farbe und Liste der angezogenen Sachen
function normCompanion(c){
  if(!c)return null;
  return{color:c.color||"lila",accs:accList(c.accs??c.acc)};
}
// Vorschlag „Weiter geht's": erst neue Zeichen auf dem Lernweg, dann die am wenigsten sicheren
function nextLetterFor(tab,learnedMap,stageMap,memMap){
  const path=LEARN_PATH[tab];
  const fresh=path.find(l=>!((learnedMap[l]||0)>0));
  if(fresh)return fresh;
  let best=path[0],bm=9;
  for(const l of path){const m=masteryOf(l,learnedMap,stageMap,memMap);if(m<bm){bm=m;best=l;}}
  return best;
}
const sayName=(l)=>NUMBERS.includes(l)?`die ${l}`:l==="ß"?"das ß":UPPERCASE.includes(l)?`das große ${l}`:`das kleine ${l}`;

function RoundBtn({children,bg="white",sh="#d5dbe7",color="var(--ink)",size=42,style,...rest}){
  return <button className="k-press" style={{width:size,height:size,borderRadius:"50%",background:bg,color,"--sh":sh,fontSize:size*0.45,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:0,...style}} {...rest}>{children}</button>;
}

function ScreenHeader({title,onBack,right,color="var(--ink)"}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:12,width:"100%",maxWidth:560,margin:"0 auto 14px"}}>
      <RoundBtn onClick={onBack} aria-label="Zurück">←</RoundBtn>
      <h2 style={{margin:0,color,fontWeight:900,fontSize:23,flex:1,lineHeight:1.1}}>{title}</h2>
      {right}
    </div>
  );
}

// Ring für das Tagesziel (füllt sich, bleibt danach gefüllt — kein Verlust, keine Serie)
function DailyRing({count,goal=DAILY_GOAL,size=56}){
  const r=size/2-5,c=2*Math.PI*r,p=Math.min(1,count/goal),done=count>=goal;
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}} aria-label={`Heute ${Math.min(count,goal)} von ${goal}`}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="white" stroke="#ffe8a8" strokeWidth="7"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={done?"#2ecc8f":"#ffb020"} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c*(1-p)} style={{transition:"stroke-dashoffset .6s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:done?size*0.42:size*0.28,fontWeight:900,color:"var(--ink)"}}>
        {done?"⭐":`${count}/${goal}`}
      </div>
    </div>
  );
}

// Stift aussuchen (Wahlfreiheit bei Nebensächlichem steigert Motivation und Lernen — Cordova & Lepper 1996).
// Ein runder Knopf in der Farbe des Stifts; Antippen öffnet die Auswahl.
function PenPicker({pen,unlocks,onPick}){
  const [open,setOpen]=useState(false);
  const ids=Object.keys(PENS).filter(id=>penAvailable(id,unlocks));
  return(
    <div style={{position:"relative"}}>
      {open&&(
        <div style={{position:"absolute",bottom:58,right:-6,display:"flex",gap:8,background:"white",borderRadius:26,padding:"8px 10px",boxShadow:"0 5px 0 #0f172a14,0 12px 28px #0f172a24",zIndex:30,animation:"popIn 0.2s ease-out"}}>
          {ids.map(id=>(
            <button key={id} data-pen={id} aria-label={PENS[id].name} title={PENS[id].name} onClick={()=>{sfx("tap");onPick(id);setOpen(false);}}
              style={{width:34,height:34,borderRadius:"50%",border:pen===id?"3px solid var(--ink)":"3px solid white",background:PENS[id].swatch,cursor:"pointer",padding:0,
                boxShadow:"0 2px 4px #0003",flexShrink:0}}/>
          ))}
        </div>
      )}
      <button data-k="pen" className="k-press" aria-label="Stift aussuchen" aria-expanded={open} onClick={()=>{sfx("tap");setOpen(o=>!o);}}
        style={{width:48,height:48,borderRadius:"50%",background:PENS[pen]?.swatch||PENS.classic.swatch,"--sh":"#0003",border:"3px solid white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,padding:0}}>🖍️</button>
    </div>
  );
}

// ── Erster Start: Klecks stellt sich vor, das Kind wählt seine Farbe ──
function Onboarding({onDone,onSpeak}){
  const [color,setColor]=useState("lila");
  const [kick,setKick]=useState(0);
  const intro="Hallo! Ich bin Klecks, ein kleiner Tintenklecks. Ich helfe dir beim Schreiben. Welche Farbe soll ich haben?";
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#8fd8ff 0%,#c9efff 45%,#fff6dc 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:18,padding:20,textAlign:"center"}}>
      <Klecks key={kick} size={150} color={color} acc={null} mood="cheer" anim={kick?"jump":"bob"} onClick={()=>{setKick(k=>k+1);onSpeak(intro);}} title="Klecks"/>
      <div className="k-card" style={{padding:"14px 18px",maxWidth:340}}>
        <div style={{fontSize:22,fontWeight:900,marginBottom:4}}>Hallo! Ich bin Klecks.</div>
        <div style={{fontSize:16,color:"var(--ink2)",lineHeight:1.35}}>Ich helfe dir beim Schreiben. Welche Farbe soll ich haben?</div>
        <button onClick={()=>onSpeak(intro)} style={{marginTop:8,background:"none",border:"none",fontSize:22,cursor:"pointer"}} aria-label="Vorlesen">🔊</button>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",maxWidth:360}}>
        {KLECKS_COLORS.map(k=>(
          <button key={k.id} data-color={k.id} aria-label={k.name} onClick={()=>{setColor(k.id);setKick(n=>n+1);sfx("pop");onSpeak(k.name);}}
            style={{width:46,height:46,borderRadius:"50%",background:k.c,border:color===k.id?"4px solid var(--ink)":"4px solid white",cursor:"pointer",boxShadow:`0 4px 0 ${k.d}`,transform:color===k.id?"scale(1.12)":"none",transition:"transform .12s"}}/>
        ))}
      </div>
      <Btn data-k="start" bg="var(--coral)" sh="var(--coralD)" style={{fontSize:20,padding:"14px 34px",borderRadius:22}} onClick={()=>{sfx("fanfare");onDone({color,accs:[]});}}>Los geht's 🚀</Btn>
    </div>
  );
}

// ── Lernkarte einer Welt: ein Weg aus Steinen, Klecks steht beim nächsten Zeichen ──
function WorldMap({world,learnedMap,stageMap,memMap,next,onOpen,onBack}){
  const path=LEARN_PATH[world.key];
  const [cw]=useState(()=>Math.min((typeof window!=="undefined"?window.innerWidth:400)-24,440));
  const nextRef=useRef(null);
  useEffect(()=>{nextRef.current?.scrollIntoView({block:"center"});},[]);
  const STEP=88,PAD=64,STONE=66;
  const pts=path.map((l,i)=>({l,i,x:cw/2+Math.sin(i*0.9)*(cw/2-STONE*0.85),y:PAD+i*STEP}));
  const height=PAD*2+(path.length-1)*STEP;
  let d=`M${pts[0].x} ${pts[0].y}`;
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],my=(a.y+b.y)/2;d+=` C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`;}
  const ms=path.map(l=>masteryOf(l,learnedMap,stageMap,memMap));
  const practiced=ms.filter(m=>m>0).length,crowns=ms.filter(m=>m>=4).length;
  return(
    <div style={{minHeight:"100vh",background:world.bg}}>
      <div style={{position:"sticky",top:0,zIndex:5,padding:"12px 12px 8px",background:`linear-gradient(180deg,${world.soft} 88%,${world.soft}00)`}}>
        <ScreenHeader onBack={onBack} title={<span>{world.emoji} {world.name}</span>} color={world.dark}
          right={<div style={{background:"white",borderRadius:14,padding:"5px 10px",fontSize:13,fontWeight:900,color:world.dark,boxShadow:"0 3px 0 #0f172a12",whiteSpace:"nowrap"}}>{practiced}/{path.length} · {crowns}👑</div>}/>
        <div style={{display:"flex",gap:5,justifyContent:"center",flexWrap:"wrap",fontSize:11,fontWeight:800,color:"var(--ink2)"}}>
          {[["●","geübt"],["●●","abschreiben"],["●●●","aus dem Kopf"],["👑","kann ich"]].map(([s,t])=>(
            <span key={t} style={{background:"#ffffffcc",borderRadius:12,padding:"3px 7px",whiteSpace:"nowrap"}}><b style={{color:world.acc}}>{s}</b> {t}</span>
          ))}
        </div>
      </div>
      <div style={{position:"relative",width:cw,height,margin:"0 auto"}}>
        <svg width={cw} height={height} style={{position:"absolute",inset:0}} aria-hidden="true">
          <path d={d} fill="none" stroke="#ffffff" strokeWidth="26" strokeLinecap="round"/>
          <path d={d} fill="none" stroke={world.acc} strokeOpacity="0.35" strokeWidth="6" strokeDasharray="2 14" strokeLinecap="round"/>
        </svg>
        {pts.map(({l,i,x,y})=>(i%2===0)&&(
          <div key={"d"+i} aria-hidden="true" style={{position:"absolute",left:(x<cw/2?cw-44:14),top:y-18,fontSize:30,opacity:0.9}}>{world.deco[(i/2)%world.deco.length]}</div>
        ))}
        <div aria-hidden="true" style={{position:"absolute",left:pts[0].x-14,top:pts[0].y-STONE/2-34,fontSize:26}}>🚩</div>
        <div aria-hidden="true" style={{position:"absolute",left:pts[pts.length-1].x-16,top:pts[pts.length-1].y+STONE/2+4,fontSize:30}}>🏆</div>
        {pts.map(({l,i,x,y})=>{
          const m=ms[i],isNext=l===next;
          const bg=m>=4?"linear-gradient(160deg,#fff1a8,#ffc93c)":m>0?world.soft:"white";
          const border=m>=4?"#dea000":m>0?world.acc:"#d5dbe7";
          return(
            <div key={l} ref={isNext?nextRef:null} style={{position:"absolute",left:x-STONE/2,top:y-STONE/2,width:STONE}}>
              {isNext&&<div style={{position:"absolute",left:x<cw/2?STONE-6:-36,top:-26,pointerEvents:"none"}}><Klecks size={40}/></div>}
              {m>=4&&<div aria-hidden="true" style={{position:"absolute",left:STONE/2-13,top:-24,fontSize:24,pointerEvents:"none"}}>👑</div>}
              <button data-letter={l} aria-label={`${l} üben`} className="k-press" onClick={()=>{sfx("tap");onOpen(l);}}
                style={{width:STONE,height:STONE,borderRadius:"50%",background:bg,border:`4px solid ${border}`,"--sh":m>=4?"#c98d00":m>0?world.dark:"#c3cad8",
                  display:"flex",alignItems:"center",justifyContent:"center",padding:0,animation:isNext?"kRing 1.6s ease-out infinite":"none","--ring":world.acc+"aa"}}>
                <Glyph letter={l} height={42} weight={3} color={m>0?"var(--ink)":"#9aa3b5"}/>
              </button>
              <div style={{display:"flex",gap:3,justifyContent:"center",marginTop:7,height:8}}>
                {m>0&&m<4&&[1,2,3].map(k=><span key={k} style={{width:8,height:8,borderRadius:"50%",background:k<=m?world.acc:"#ffffffcc",border:`1.5px solid ${world.acc}`}}/>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Klecks-Zimmer: Farbe, gefundene Sachen und Stifte aussuchen ──
function KlecksRoom({companion,onChange,unlocks,pen,onPen,onBack,onSpeak}){
  const [kick,setKick]=useState(0);
  const accs=SURPRISES.filter(x=>x.kind==="acc"),pens=Object.keys(PENS),worn=accList(companion.accs);
  const tile=(active)=>({background:active?"#fff4c2":"white",border:active?"3px solid #ffb020":"3px solid #eef1f6",borderRadius:18,padding:"8px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontWeight:800,fontSize:12,color:"var(--ink2)"});
  const found=SURPRISES.filter(x=>unlocks.includes(x.id)).length;
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#f3edff 0%,#fff 70%)",padding:16}}>
      <ScreenHeader onBack={onBack} title="🎨 Mein Klecks" color="#5b34c7"/>
      <div style={{maxWidth:520,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}}>
        <div className="k-card" style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"18px 12px 12px"}}>
          <Klecks key={kick} size={140} mood={kick?"cheer":"happy"} anim={kick?"jump":"bob"} onClick={()=>{setKick(k=>k+1);sfx("pop");onSpeak("Hihi! Das kitzelt!");}} title="Klecks"/>
          <div style={{fontSize:13,color:"var(--muted)",marginTop:6}}>{found} von {SURPRISES.length} Überraschungen gefunden</div>
        </div>
        <div className="k-card" style={{padding:14}}>
          <div style={{fontWeight:900,fontSize:16,marginBottom:10}}>Farbe</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
            {KLECKS_COLORS.map(k=>(
              <button key={k.id} data-color={k.id} aria-label={k.name} onClick={()=>{onChange({...companion,color:k.id});setKick(n=>n+1);sfx("pop");onSpeak(k.name);}}
                style={{width:46,height:46,borderRadius:"50%",background:k.c,border:companion.color===k.id?"4px solid var(--ink)":"4px solid white",boxShadow:`0 4px 0 ${k.d}`,cursor:"pointer"}}/>
            ))}
          </div>
        </div>
        <div className="k-card" style={{padding:14}}>
          <div style={{fontWeight:900,fontSize:16,marginBottom:2}}>Anziehen</div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:10}}>Tippe mehrere Sachen an – Klecks kann sie zusammen tragen. Hut oder Krone: nur eins passt auf den Kopf.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            <button style={tile(!worn.length)} onClick={()=>{onChange({...companion,accs:[]});sfx("tap");}}><span style={{fontSize:28}}>🚫</span>Nichts</button>
            {accs.map(x=>{const have=unlocks.includes(x.id),on=worn.includes(x.id);return(
              <button key={x.id} data-acc={x.id} aria-pressed={on} disabled={!have} style={{...tile(on),opacity:have?1:0.55,cursor:have?"pointer":"default",position:"relative"}}
                onClick={()=>{if(!have)return;onChange({...companion,accs:toggleAcc(worn,x.id)});setKick(n=>n+1);sfx(on?"tap":"pop");}}>
                {on&&<span style={{position:"absolute",top:4,right:8,fontSize:14,color:"#17a06c"}}>✓</span>}
                <span style={{fontSize:28}}>{have?x.emoji:"❓"}</span>{have?x.name:"versteckt"}
              </button>);})}
          </div>
        </div>
        <div className="k-card" style={{padding:14}}>
          <div style={{fontWeight:900,fontSize:16,marginBottom:10}}>Stifte</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {pens.map(id=>{const have=penAvailable(id,unlocks);return(
              <button key={id} disabled={!have} style={{...tile(pen===id),opacity:have?1:0.55,cursor:have?"pointer":"default"}} onClick={()=>{if(have){onPen(id);sfx("tap");}}}>
                <span style={{width:30,height:30,borderRadius:"50%",background:have?PENS[id].swatch:"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{have?"":"❓"}</span>{have?PENS[id].name:"versteckt"}
              </button>);})}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Überraschung gefunden / Tagesziel geschafft ──
function SurpriseModal({item,effects,onUse,onClose,onHome}){
  const s=item.type==="unlock"?item.s:null;
  const comp=useContext(CompanionCtx);
  const overlay={position:"fixed",inset:0,background:"rgba(20,24,44,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2500,backdropFilter:"blur(5px)",padding:16};
  return(
    <div style={overlay} role="dialog" aria-modal="true">
      {effects&&item.type==="goal"&&<StarRain onDone={()=>{}}/>}
      <div className="k-card" style={{padding:"20px 20px 18px",maxWidth:340,width:"100%",textAlign:"center",animation:"popIn 0.4s ease-out",position:"relative"}}>
        <div style={{display:"flex",justifyContent:"center",marginTop:-70}}>
          <Klecks size={120} mood="cheer" anim="jump" acc={s&&s.kind==="acc"?wearAcc(comp.accs,s.id):undefined}/>
        </div>
        {s?(<>
          <div style={{fontSize:14,fontWeight:900,color:"#e0a100",letterSpacing:1,textTransform:"uppercase",marginTop:4}}>Überraschung!</div>
          {s.kind==="pen"&&<div style={{width:64,height:64,borderRadius:"50%",margin:"8px auto",background:PENS[s.id].swatch,boxShadow:"0 4px 0 #0002",animation:"kPulse 1.4s ease-in-out infinite"}}/>}
          <h3 style={{margin:"6px 0 14px",fontSize:22,fontWeight:900,lineHeight:1.2}}>{s.text}</h3>
          <Btn data-k="use" bg="var(--mint)" sh="var(--mintD)" style={{width:"100%",fontSize:17,marginBottom:10}} onClick={()=>onUse(s)}>{s.kind==="acc"?"✨ Anziehen!":"✏️ Ausprobieren!"}</Btn>
          <Btn bg="white" sh="#d5dbe7" color="var(--ink2)" style={{width:"100%",border:"2px solid #eef1f6"}} onClick={onClose}>Später</Btn>
        </>):(<>
          <h3 style={{margin:"8px 0 6px",fontSize:24,fontWeight:900}}>Tagesziel geschafft! 🌟</h3>
          <p style={{margin:"0 0 14px",fontSize:16,color:"var(--ink2)",lineHeight:1.4}}>Du hast heute {DAILY_GOAL} Zeichen geschrieben. Jetzt darfst du Pause machen – oder weiter üben, wenn du magst.</p>
          <Btn data-k="pause" bg="var(--sky)" sh="var(--skyD)" style={{width:"100%",fontSize:17,marginBottom:10}} onClick={onHome}>🏠 Pause machen</Btn>
          <Btn data-k="more" bg="white" sh="#d5dbe7" color="var(--ink2)" style={{width:"100%",border:"2px solid #eef1f6"}} onClick={onClose}>✏️ Weiter üben</Btn>
        </>)}
      </div>
    </div>
  );
}

// Wörter in derselben Schulschrift wie beim Schreiben
function GlyphWord({word,height=30,color="var(--ink)",missing=[]}){
  return(
    <div style={{display:"flex",gap:height*0.12,alignItems:"flex-end",justifyContent:"center"}} aria-label={word}>
      {word.split("").map((ch,i)=><Glyph key={i} letter={ch} height={height} weight={2.8} tight yr={[LINES.top-7,LINES.base+7]} color={missing.includes(ch)?"#ef4444":color}/>)}
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
  const startTab=WORLDS[persisted.tab]?persisted.tab:"GROß";
  // Begleiter (Farbe und Zubehör, vom Kind gewählt). Ohne Begleiter: erst Begrüßung
  const [companion,setCompanion]=useState(()=>normCompanion(persisted.companion));
  const [screen,setScreen]=useState(()=>persisted.companion?"menu":"hello");
  const [tab,setTab]=useState(startTab);
  const [letter,setLetter]=useState(()=>LEARN_PATH[startTab][0]);
  const [phase,setPhase]=useState("anim");
  const [learnedMap,setLearnedMap]=useState(()=>persisted.learnedMap||{});
  const [totalScore,setTotalScore]=useState(()=>persisted.totalScore||0);
  const [replayKey,setReplayKey]=useState(0);
  const [settings,setSettings]=useState(()=>{
    let s={
      difficulty:"medium",screenTime:15,autoAdvance:false,rewardVideos:true,
      allowedModes:{guided:true,trace:true,copy:true,memory:true},speechEnabled:true,soundEnabled:true,
      lefthanded:false,highContrast:false,hapticsEnabled:true,settingsVersion:3,
      ...(persisted.settings||{})
    };
    const v=s.settingsVersion||1;
    // Ältere Einstellungen: neue Modi „Abschreiben" und „Aus dem Kopf" einschalten
    if(v<2)s={...s,allowedModes:{...s.allowedModes,copy:true,memory:true}};
    // Version 3: „Weiter"-Knopf statt automatischem Weiterspringen; Töne neu
    if(v<3)s={...s,autoAdvance:false,soundEnabled:s.soundEnabled!==false};
    return{...s,settingsVersion:3};
  });
  // Lernstufe pro Buchstabe (1 geführt → 2 abschreiben → 3 aus dem Kopf)
  const [stageMap,setStageMap]=useState(()=>persisted.stageMap||{});
  const [memMap,setMemMap]=useState(()=>persisted.memMap||{});           // Erfolge aus dem Kopf
  const [lastPracticed,setLastPracticed]=useState(()=>persisted.lastPracticed||{});
  const [unlocks,setUnlocks]=useState(()=>persisted.unlocks||[]);        // gefundene Überraschungen
  const [pen,setPen]=useState(()=>persisted.pen||"classic");
  const [daily,setDaily]=useState(()=>persisted.daily||{date:"",letters:[],celebrated:false});
  const [queue,setQueue]=useState([]);                                   // Überraschungen / Tagesziel
  const [levelUp,setLevelUp]=useState(null);
  const [backTo,setBackTo]=useState("menu");
  const [mapWorld,setMapWorld]=useState(startTab);
  const [homeKick,setHomeKick]=useState(0);
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
  const [mode,setMode]=useState(()=>modeFor(LEARN_PATH[startTab][0]));
  const fs=useMemo(()=>fieldScale(),[]);
  useEffect(()=>{setFieldScale(fs);},[fs,rs.enrolled]);
  useEffect(()=>{setSoundOn(settings.soundEnabled!==false);},[settings.soundEnabled]);
  // Messwerte eines Versuchs an den Forschungsmodus geben (nur bei Teilnahme)
  const studyLog=rs.enrolled?(extra)=>(t)=>logTrial({...t,difficulty:settings.difficulty,restricted:rs.restricted?1:0,...extra}):null;
  const [gridOpen,setGridOpen]=useState(false);
  const [showParent,setShowParent]=useState(false);
  const [practiceWord,setPracticeWord]=useState(null);
  const [showUnicorn,setShowUnicorn]=useState(false);
  const [showStarRain,setShowStarRain]=useState(false);
  const [showScreenTime,setShowScreenTime]=useState(false);
  const [journal,setJournal]=useState([]);
  const screenTimerRef=useRef(null);
  const surpriseTimer=useRef(null);
  const {say,sayLetter,sayIt}=useSpeech(settings.speechEnabled);

  // Fortschritt automatisch speichern
  useEffect(()=>{
    savePersisted({learnedMap,totalScore,settings,stageMap,memMap,lastPracticed,companion,unlocks,pen,daily,tab});
  },[learnedMap,totalScore,settings,stageMap,memMap,lastPracticed,companion,unlocks,pen,daily,tab]);

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
      if(data.unlocks)setUnlocks(data.unlocks);
      if(data.pen)setPen(data.pen);
      if(data.daily)setDaily(data.daily);
      if(data.companion){setCompanion(normCompanion(data.companion));setScreen(sc=>sc==="hello"?"menu":sc);}
    });
    return()=>{cancelled=true;};
  },[]);

  // Zurück-Taste: zuerst Fenster schließen, dann eine Ebene zurück
  useEffect(()=>{
    const onBack=(e)=>{
      if(queue.length){e.preventDefault();setQueue(q=>q.slice(1));return;}
      if(showParent){e.preventDefault();setShowParent(false);return;}
      if(gridOpen){e.preventDefault();setGridOpen(false);return;}
      if(practiceWord){e.preventDefault();setPracticeWord(null);return;}
      if(screen==="practice"){e.preventDefault();setScreen(backTo);return;}
      if(screen!=="menu"&&screen!=="hello"){e.preventDefault();setScreen("menu");return;}
      // sonst: nicht abfangen → Seite darf verlassen werden
    };
    window.addEventListener("app:backbutton",onBack);
    return()=>window.removeEventListener("app:backbutton",onBack);
  },[queue,showParent,gridOpen,practiceWord,screen,backTo]);

  const items=tab==="GROß"?UPPERCASE:tab==="klein"?LOWERCASE:NUMBERS;
  const learnedCount=Object.values(learnedMap).filter(v=>v>0).length;
  const perfectCount=Object.values(learnedMap).filter(v=>v>=5).length;
  const today=todayKey();
  const todayLetters=daily.date===today?daily.letters:[];
  const dailyCount=todayLetters.length;

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
  useEffect(()=>()=>{clearTimeout(advanceTimer.current);clearTimeout(surpriseTimer.current);},[]);
  const selectLetter=(l)=>{clearTimeout(advanceTimer.current);const m=modeFor(l);setTab(tabOf(l));setLetter(l);setMode(m);setPhase(m==="memory"?"write":"anim");setReplayKey(k=>k+1);sayLetter(l);};
  const changeTab=(t)=>{setTab(t);selectLetter(nextLetterFor(t,learnedMap,stageMap,memMap));};
  const openLetter=(l,from="menu")=>{selectLetter(l);setBackTo(from);setGridOpen(false);setScreen("practice");};
  const chooseMode=(m)=>{clearTimeout(advanceTimer.current);sfx("tap");setMode(m);setPhase("write");setReplayKey(k=>k+1);};
  const step=(d)=>{const path=LEARN_PATH[tabOf(letter)],i=path.indexOf(letter);selectLetter(path[(i+d+path.length)%path.length]);};
  const goNext=()=>step(1);

  const handleDone=(s,info={})=>{
    const now=new Date();
    const newLearned={...learnedMap,[letter]:Math.max(learnedMap[letter]||0,s)};
    setLearnedMap(newLearned);
    setTotalScore(sc=>sc+s*10);
    setLastPracticed(m=>({...m,[letter]:now.getTime()}));
    setJournal(j=>[...j,{letter,stars:s,mode:info.mode||mode,time:`${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}`}]);
    // Lernstufe: ab 4 Sternen geht es zur nächsten Stufe (weniger Hilfe)
    const used=info.mode||mode,cur=stageOf(letter);let next=null,firstFromMemory=false;
    if(s>=4){
      if(used==="memory"){firstFromMemory=!((memMap[letter]||0)>0);setMemMap(m=>({...m,[letter]:(m[letter]||0)+1}));}
      const target=Math.min(3,MODE_STAGE[used]+1);   // wer es schon aus dem Kopf kann, bleibt dort
      if(target>cur&&!rs.restricted){
        next=target;
        setStageMap(m=>({...m,[letter]:next}));
        setLevelUp({letter,stage:next});setTimeout(()=>setLevelUp(null),4500);
        setTimeout(()=>say(STAGE_NEXT_TEXT[next],0.85,1.2),3400);
      }
    }
    // Effekte nur bei echtem Lernfortschritt — nie zufällig
    const fx=settings.rewardVideos!==false&&!reducedMotion();
    if(fx&&firstFromMemory)setTimeout(()=>setShowUnicorn(true),1200);
    else if(fx&&next)setTimeout(()=>setShowStarRain(true),900);
    // Tagesziel: verschiedene Zeichen heute
    const base=daily.date===today?daily:{date:today,letters:[],celebrated:false};
    let goalHit=false;
    if(!base.letters.includes(letter)){
      const nd={...base,letters:[...base.letters,letter]};
      if(nd.letters.length>=DAILY_GOAL&&!nd.celebrated){nd.celebrated=true;goalHit=true;}
      setDaily(nd);
    }
    // Überraschungen: gefunden, sobald genug Zeichen gut sitzen (vorher nicht angekündigt)
    const good=Object.values(newLearned).filter(v=>v>=4).length;
    const fresh=SURPRISES.filter(x=>good>=x.at&&!unlocks.includes(x.id));
    const show=[];
    if(fresh.length){
      setUnlocks(u=>[...u,...fresh.map(f=>f.id).filter(id=>!u.includes(id))]);
      if(settings.rewardVideos!==false)show.push(...fresh.map(f=>({type:"unlock",s:f})));
    }
    if(goalHit)show.push({type:"goal"});
    if(show.length){
      clearTimeout(surpriseTimer.current);
      surpriseTimer.current=setTimeout(()=>{setQueue(q=>[...q,...show]);sfx("unlock");},2600);
    }
    if(settings.autoAdvance){
      // Weiter auf dem Lernweg (ähnliche Bewegungen zusammen, b/d getrennt)
      advanceTimer.current=setTimeout(goNext,next?5200:3800);
    }
  };

  const settingsWithData={...settings,learnedMap,totalScore,stageMap,memMap,unlocks};
  // Lerndaten nicht in die Einstellungen übernehmen
  const updateSettings=({learnedMap:_l,totalScore:_t,stageMap:_s,memMap:_m,unlocks:_u,...rest})=>setSettings(rest);
  // Verteiltes Üben: Buchstaben, die vor mehr als einem Tag geübt wurden
  const due=Object.keys(lastPracticed)
    .filter(l=>(learnedMap[l]||0)>0&&Date.now()-lastPracticed[l]>REVIEW_AFTER_MS)
    .sort((a,b)=>lastPracticed[a]-lastPracticed[b]).slice(0,6);

  const comp=companion||{color:"lila",accs:[]};
  const inst=useInstall();
  const closeSurprise=()=>setQueue(q=>q.slice(1));
  const wrap=(el)=>(
    <CompanionCtx.Provider value={comp}>
      {el}
      {queue[0]&&screen!=="probe"&&(
        <SurpriseModal key={queue.length} item={queue[0]} effects={settings.rewardVideos!==false&&!reducedMotion()}
          onUse={(x)=>{sfx("pop");if(x.kind==="acc")setCompanion(c=>({...(c||comp),accs:wearAcc((c||comp).accs,x.id)}));else setPen(x.id);closeSurprise();}}
          onClose={closeSurprise} onHome={()=>{closeSurprise();setScreen("menu");}}/>
      )}
      {showUnicorn&&<UnicornRun onDone={()=>setShowUnicorn(false)}/>}
      {showStarRain&&<StarRain onDone={()=>setShowStarRain(false)}/>}
      {showParent&&<ParentZone settings={settingsWithData} onChange={updateSettings} onStartProbe={()=>{setShowParent(false);setScreen("probe");}} onClose={()=>setShowParent(false)} journal={journal}/>}
    </CompanionCtx.Provider>
  );

  // ── BEGRÜSSUNG (erster Start) ──
  if(screen==="hello") return wrap(<Onboarding onSpeak={sayIt} onDone={(c)=>{setCompanion(c);setScreen("menu");}}/>);

  // ── STARTSEITE ──
  if(screen==="menu"){
    const next=nextLetterFor(tab,learnedMap,stageMap,memMap);
    const an=anlautOf(next);
    const hour=new Date().getHours();
    const hello=hour<11?"Guten Morgen!":hour>=17?"Guten Abend!":"Hallo!";
    const goalDone=dailyCount>=DAILY_GOAL;
    const greet=goalDone?`${hello} Heute hast du schon fleißig geübt! 🌟`
      :learnedCount===0?`${hello} Ich bin Klecks. Wollen wir zusammen schreiben?`
      :due.length?`${hello} Magst du ein paar alte Bekannte wiederholen?`
      :`${hello} Heute ist ${sayName(next)} dran!`;
    const link={background:"#ffffffb3",border:"none",borderRadius:14,padding:"8px 14px",color:"var(--ink2)",fontSize:13,fontWeight:800,cursor:"pointer"};
    return wrap(
      <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#8fd8ff 0%,#c9efff 34%,#fff6dc 100%)",position:"relative"}}>
        <SkyDecor/>
        <div style={{position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",padding:"12px 16px 120px",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{flex:1,fontSize:21,fontWeight:900,color:"#0b4f7a",letterSpacing:0.2}}>✏️ Schreib & Lern</div>
            <RoundBtn aria-label={settings.speechEnabled?"Vorlesen ausschalten":"Vorlesen einschalten"} bg={settings.speechEnabled?"var(--sun)":"white"} sh={settings.speechEnabled?"var(--sunD)":"#d5dbe7"}
              onClick={()=>{const n=!settings.speechEnabled;setSettings(s=>({...s,speechEnabled:n}));if(n)setTimeout(()=>speak("Vorlesen ist an!"),100);}}>{settings.speechEnabled?"🔊":"🔇"}</RoundBtn>
            <RoundBtn aria-label={settings.soundEnabled!==false?"Töne ausschalten":"Töne einschalten"} bg={settings.soundEnabled!==false?"var(--sun)":"white"} sh={settings.soundEnabled!==false?"var(--sunD)":"#d5dbe7"}
              onClick={()=>{const n=settings.soundEnabled===false;setSettings(s=>({...s,soundEnabled:n}));setSoundOn(n);if(n)sfx("pop");}}>{settings.soundEnabled!==false?"🎵":"🔕"}</RoundBtn>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Klecks key={homeKick} size={100} mood={goalDone||homeKick?"cheer":"happy"} anim={homeKick?"jump":"bob"} title="Klecks"
              onClick={()=>{setHomeKick(k=>k+1);sfx("pop");sayIt(greet);}}/>
            <div className="k-bubble" style={{"--bb":"#ffffff","--bg":"#ffffff",flex:1,background:"white",borderRadius:20,padding:"12px 14px",fontSize:17,fontWeight:800,lineHeight:1.3,boxShadow:"0 4px 0 #0f172a12"}}>{greet}</div>
          </div>

          <button data-k="go" className="k-press" onClick={()=>{sfx("pop");openLetter(next,"menu");}}
            style={{"--sh":"var(--coralD)",background:"linear-gradient(135deg,#ff9271,#ff6a4d)",borderRadius:26,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,color:"white",textAlign:"left"}}>
            <div style={{width:76,height:76,borderRadius:20,background:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Glyph letter={next} height={58} weight={3.4} color="var(--coralD)" fit/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:26,fontWeight:900,lineHeight:1.05}}>✏️ Schreiben</div>
              <div style={{fontSize:15,fontWeight:800,opacity:0.95,marginTop:4}}>{learnedCount?"Weiter mit":"Los geht's mit"} {an?`${an[0]} ${an[1]}`:`${ANIMALS[next]||""} ${next}`}</div>
            </div>
            <div style={{fontSize:30,fontWeight:900}}>➜</div>
          </button>

          <div className="k-card" style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px"}}>
            <DailyRing count={dailyCount}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:17,fontWeight:900}}>{goalDone?"Tagesziel geschafft! 🌟":"Heute"}</div>
              <div style={{fontSize:14,color:"var(--ink2)"}}>{goalDone?"Jetzt darfst du Pause machen.":`${dailyCount} von ${DAILY_GOAL} Zeichen geschrieben`}</div>
            </div>
            <div style={{display:"flex",gap:4,flexShrink:0}}>
              {!goalDone&&todayLetters.slice(-3).map(l=><div key={l} style={{background:"#f4f5f8",borderRadius:10,padding:"3px 5px"}}><Glyph letter={l} height={26} weight={2.6} fit/></div>)}
            </div>
          </div>

          {rs.enrolled&&rs.dueWave!=null&&(
            <Btn bg="linear-gradient(135deg,#14b8a6,#0f766e)" sh="#0b5e57" style={{fontSize:17,padding:"14px 16px",borderRadius:22,animation:"glowPulse 2s infinite"}} onClick={()=>setScreen("probe")}>
              🔬 Kleiner Schreibtest
            </Btn>
          )}

          {due.length>0&&(
            <div className="k-card" style={{padding:"12px 14px",animation:"slideUp 0.4s ease-out"}}>
              <div style={{fontSize:16,fontWeight:900,marginBottom:8}}>🔁 Heute wiederholen</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {due.map(l=>(
                  <button key={l} data-letter={l} className="k-press" onClick={()=>openLetter(l,"menu")} style={{background:"#eef4ff","--sh":"#c9d6f2",borderRadius:14,padding:"5px 8px"}}>
                    <Glyph letter={l} height={36} weight={2.8} color="var(--ink)"/>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div style={{fontSize:17,fontWeight:900,color:"#0b4f7a",margin:"2px 4px 8px"}}>🗺️ Meine Welten</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {Object.values(WORLDS).map(w=>{
                const path=LEARN_PATH[w.key],done=path.filter(l=>(learnedMap[l]||0)>0).length;
                const crowns=path.filter(l=>masteryOf(l,learnedMap,stageMap,memMap)>=4).length;
                return(
                  <button key={w.key} data-world={w.key} className="k-press" onClick={()=>{sfx("tap");setTab(w.key);setMapWorld(w.key);setScreen("map");}}
                    style={{background:`linear-gradient(180deg,${w.soft},#ffffff)`,"--sh":w.dark,border:`3px solid ${w.acc}`,borderRadius:22,padding:"10px 6px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <div style={{fontSize:36,lineHeight:1}}>{w.emoji}</div>
                    <div style={{fontSize:21,fontWeight:900,color:w.dark,lineHeight:1.1}}>{w.short}</div>
                    <div style={{fontSize:11,fontWeight:800,color:"var(--ink2)",lineHeight:1.1,minHeight:24}}>{w.name}</div>
                    <div style={{width:"100%",height:8,background:"white",borderRadius:6,overflow:"hidden",border:`1.5px solid ${w.acc}66`}}>
                      <div style={{width:`${done/path.length*100}%`,height:"100%",background:w.acc,transition:"width .5s"}}/>
                    </div>
                    <div style={{fontSize:11,fontWeight:900,color:w.dark}}>{done}/{path.length}{crowns?` · ${crowns}👑`:""}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[{k:"words",e:"📖",t:"Wörter",bg:"var(--sun)",sh:"var(--sunD)",c:"#5a3a00"},
              {k:"progress",e:"🌻",t:"Garten",bg:"var(--mint)",sh:"var(--mintD)"},
              {k:"stickers",e:"🎀",t:"Sticker",bg:"var(--pink)",sh:"var(--pinkD)"},
              {k:"klecks",e:"🎨",t:"Klecks",bg:"var(--grape)",sh:"var(--grapeD)"}].map(b=>(
              <Btn key={b.k} data-nav={b.k} bg={b.bg} sh={b.sh} color={b.c||"white"} onClick={()=>{sfx("tap");setScreen(b.k);}}
                style={{padding:"10px 2px",borderRadius:20,display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontSize:13}}>
                <span style={{fontSize:28,lineHeight:1.1}}>{b.e}</span>{b.t}
              </Btn>
            ))}
          </div>

          <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:4,flexWrap:"wrap"}}>
            <button onClick={()=>setShowParent(true)} style={link}>👨‍👩‍👧 Eltern</button>
            <button onClick={()=>setScreen("impressum")} style={link}>📄 Impressum</button>
            {inst.canPrompt&&!inst.standalone&&<button data-k="install" onClick={()=>inst.prompt()} style={link}>📲 Installieren</button>}
          </div>
        </div>
      </div>
    );
  }

  if(screen==="impressum") return wrap(<ImpressumScreen onBack={()=>setScreen("menu")}/>);

  if(screen==="probe"){
    if(!rs.enrolled||rs.dueWave==null){setTimeout(()=>setScreen("menu"),0);return null;}
    const wave=rs.dueWave;
    return wrap(<ProbeTest key={wave} wave={wave} chars={rs.probeChars} difficulty={settings.difficulty} scale={fs} onSpeak={sayIt}
      onLog={t=>logTrial({...t,difficulty:settings.difficulty,restricted:rs.restricted?1:0})}
      onFinish={()=>{markWaveDone(wave);setScreen("menu");}} onExit={()=>setScreen("menu")}/>);
  }

  if(screen==="map") return wrap(
    <WorldMap world={WORLDS[mapWorld]} learnedMap={learnedMap} stageMap={stageMap} memMap={memMap}
      next={nextLetterFor(mapWorld,learnedMap,stageMap,memMap)} onOpen={(l)=>openLetter(l,"map")} onBack={()=>setScreen("menu")}/>
  );

  if(screen==="klecks") return wrap(
    <KlecksRoom companion={comp} onChange={setCompanion} unlocks={unlocks} pen={pen} onPen={setPen} onSpeak={sayIt} onBack={()=>setScreen("menu")}/>
  );

  if(screen==="words"){
    if(practiceWord) return wrap(
      <WordPractice word={practiceWord} settings={settings} pen={pen} onSpeak={sayIt} scale={fs}
        onTrial={studyLog&&((ch,t)=>studyLog({kind:"word",ch,stage:stageOf(ch)})(t))}
        onBack={()=>setPracticeWord(null)}/>
    );
    return wrap(
      <div style={{minHeight:"100vh",background:WORD_THEME.bg,padding:16}}>
        <ScreenHeader title="📖 Meine Wörter" color="#78350f" onBack={()=>setScreen("menu")}/>
        <WordsPanel learnedMap={learnedMap} onPractice={w=>setPracticeWord(w)}/>
      </div>
    );
  }

  if(screen==="progress") return wrap(
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#d9f7e4 0%,#ffffff 70%)",padding:16}}>
      <ScreenHeader title="🌻 Mein Garten" color="#166534" onBack={()=>setScreen("menu")}/>
      <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:560,margin:"0 auto"}}>
        {["GROß","klein","Zahlen"].map(t=><FlowerGarden key={t} learnedMap={learnedMap} tab={t}/>)}
      </div>
    </div>
  );

  if(screen==="stickers") return wrap(
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#ffe3f1 0%,#ffffff 70%)",padding:16}}>
      <ScreenHeader title="🎀 Sticker-Album" color="#9d174d" onBack={()=>setScreen("menu")}/>
      <StickerBook learnedMap={learnedMap}/>
    </div>
  );

  // ── ÜBEN ──
  const world=WORLDS[tab];
  const pill=(active,c)=>({position:"relative",padding:"7px 11px",borderRadius:14,background:active?c:"white",color:active?"white":c,border:`2px solid ${c}`,fontWeight:900,fontSize:13,"--sh":active?"#00000033":"#dfe4ee"});
  return wrap(
    <ThemeCtx.Provider value={world}>
    <div style={{minHeight:"100vh",background:world.bg,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 10px 18px",gap:10}}>
      <div style={{width:"100%",maxWidth:560,display:"flex",alignItems:"center",gap:7}}>
        <RoundBtn onClick={()=>setScreen(backTo)} aria-label="Zurück">←</RoundBtn>
        <RoundBtn size={34} onClick={()=>step(-1)} aria-label="Vorheriges Zeichen">‹</RoundBtn>
        <button className="k-press" onClick={()=>sayLetter(letter)} aria-label={`${letter} vorlesen`}
          style={{background:world.acc,"--sh":world.dark,borderRadius:16,width:56,height:56,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:0}}>
          <Glyph letter={letter} height={42} weight={3.4} color="white" fit/>
        </button>
        <RoundBtn size={34} data-k="nextletter" onClick={()=>step(1)} aria-label="Nächstes Zeichen">›</RoundBtn>
        <div style={{flex:1,minWidth:0,display:"flex"}}><AnlautChip letter={letter} onSay={()=>sayLetter(letter)}/></div>
        <DailyRing count={dailyCount} size={42}/>
      </div>

      <div className="k-card" style={{width:"100%",maxWidth:560,borderRadius:20,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,padding:6}}>
          <div style={{display:"flex",background:"#f1f3f8",borderRadius:14,padding:3,gap:2}}>
            {Object.values(WORLDS).map(w=>(
              <button key={w.key} data-tab={w.key} onClick={()=>{sfx("tap");changeTab(w.key);setGridOpen(true);}}
                style={{padding:"6px 10px",borderRadius:11,border:"none",fontSize:14,fontWeight:900,cursor:"pointer",background:tab===w.key?w.acc:"transparent",color:tab===w.key?"white":"var(--ink2)"}}>{w.short}</button>
            ))}
          </div>
          <button data-k="grid" onClick={()=>setGridOpen(g=>!g)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6,background:"none",border:"none",cursor:"pointer",fontSize:14,fontWeight:900,color:"var(--ink2)",padding:"6px 2px"}}>
            {tab==="Zahlen"?"Zahl wählen":"Buchstabe wählen"} <span style={{display:"inline-block",transition:"transform 0.2s",transform:gridOpen?"rotate(180deg)":"none"}}>▾</span>
          </button>
          <RoundBtn size={34} onClick={()=>setShowParent(true)} aria-label="Elternbereich">👪</RoundBtn>
        </div>
        {gridOpen&&(
          <div style={{padding:"2px 8px 12px"}}>
            <LetterGrid items={items} learnedMap={learnedMap} onSelect={(l)=>{sfx("tap");selectLetter(l);setGridOpen(false);}} current={letter}/>
          </div>
        )}
      </div>

      {/* Lernweg: Vorführen, dann Hilfe Schritt für Schritt abbauen */}
      <div style={{display:"flex",gap:7,flexWrap:"wrap",justifyContent:"center"}}>
        <button className="k-press" style={pill(phase==="anim","#f97316")} onClick={()=>{clearTimeout(advanceTimer.current);sfx("tap");setPhase("anim");setReplayKey(k=>k+1);}}>▶ Zeigen</button>
        {Object.entries(MODES).filter(([m])=>allowed(m)).map(([m,{label,color}])=>{
          const active=phase==="write"&&mode===m;
          const recommended=m===modeFor(letter);
          const passed=MODE_STAGE[m]<stageOf(letter)||(m==="memory"&&(memMap[letter]||0)>0);
          return(
            <button key={m} data-mode={m} className="k-press" onClick={()=>chooseMode(m)} style={pill(active,color)}>
              {passed?"✓ ":""}{label}
              {recommended&&!passed&&<span aria-label="empfohlen" style={{position:"absolute",top:-10,right:-7,fontSize:15}}>⭐</span>}
            </button>
          );
        })}
      </div>

      {levelUp&&levelUp.letter===letter&&(
        <div style={{position:"fixed",top:12,left:0,right:0,display:"flex",justifyContent:"center",zIndex:1500,pointerEvents:"none",padding:"0 12px"}}>
          <div role="status" style={{background:"linear-gradient(135deg,#fff4c2,#ffe08a)",borderRadius:18,padding:"10px 16px",textAlign:"center",fontSize:16,fontWeight:900,color:"#6b4400",border:"3px solid #ffc93c",boxShadow:"0 6px 0 #dea00055, 0 12px 30px #0002",animation:"popIn 0.4s ease-out",maxWidth:520}}>
            🎉 Neue Stufe! {STAGE_NEXT_TEXT[levelUp.stage]}
          </div>
        </div>
      )}

      <div style={{display:"flex",justifyContent:"center",flexDirection:"column",alignItems:"center",gap:8}}>
        {phase==="anim"&&<StrokePreview letter={letter}/>}
        {phase==="anim"
          ?<AnimCanvas key={`anim-${letter}-${replayKey}`} letter={letter} onDone={()=>setPhase("write")} scale={fs}/>
          :mode==="guided"
            ?<GuidedCanvas key={`guided-${letter}-${replayKey}`} letter={letter} onComplete={handleDone} onNext={goNext} onSpeak={sayIt} scale={fs}
               pen={penAvailable(pen,unlocks)?pen:"classic"} tools={<PenPicker pen={penAvailable(pen,unlocks)?pen:"classic"} unlocks={unlocks} onPick={setPen}/>}
               onTrial={studyLog&&studyLog({kind:"practice",ch:letter,stage:stageOf(letter)})}/>
            :<TraceCanvas key={`trace-${letter}-${mode}-${replayKey}`} letter={letter} onComplete={handleDone} onNext={goNext}
               difficulty={settings.difficulty} mode={mode} pen={penAvailable(pen,unlocks)?pen:"classic"}
               memoryDelay={MEMORY_DELAYS[Math.min(memMap[letter]||0,MEMORY_DELAYS.length-1)]}
               lefthanded={!!settings.lefthanded} highContrast={!!settings.highContrast} hapticsEnabled={settings.hapticsEnabled!==false}
               tools={<PenPicker pen={penAvailable(pen,unlocks)?pen:"classic"} unlocks={unlocks} onPick={setPen}/>}
               onSpeak={sayIt} scale={fs} onTrial={studyLog&&studyLog({kind:"practice",ch:letter,stage:stageOf(letter)})}/>
        }
      </div>

      {showScreenTime&&<ScreenTimeReminder limit={settings.screenTime} onDismiss={()=>setShowScreenTime(false)}/>}
    </div>
    </ThemeCtx.Provider>
  );
}

// Himmel der Startseite: zwei ziehende Wolken und grüne Hügel
function SkyDecor(){
  return(
    <div aria-hidden="true" style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:64,left:0,fontSize:64,opacity:0.9,animation:"kCloud 70s linear infinite"}}>☁️</div>
      <div style={{position:"absolute",top:200,left:0,fontSize:42,opacity:0.75,animation:"kCloud 95s linear -45s infinite"}}>☁️</div>
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{position:"absolute",left:0,bottom:0,width:"100%",height:110}}>
        <path d="M0 70 Q80 22 170 58 T400 48 V120 H0Z" fill="#b5ecaa"/>
        <path d="M0 96 Q110 58 220 90 T400 84 V120 H0Z" fill="#86d97f"/>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPRESSUM SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function ImpressumScreen({onBack}){
  const [tab,setTab]=useState("impressum"); // impressum | datenschutz | attribution
  const s = {
    page:{minHeight:"100vh",background:"#f8fafc",fontFamily:"inherit",fontSize:13,color:"#374151"},
    header:{background:"white",borderBottom:"1px solid #e2e8f0",padding:"12px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10},
    tabs:{display:"flex",gap:0,background:"#f1f5f9",borderRadius:12,padding:3,margin:"16px 16px 0"},
    tab:{flex:1,padding:"8px 4px",borderRadius:9,border:"none",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"},
    body:{padding:16,display:"flex",flexDirection:"column",gap:14},
    card:{background:"white",borderRadius:16,padding:16,border:"1px solid #e2e8f0"},
    h2:{fontSize:15,fontWeight:900,color:"#1e3a8a",margin:"0 0 10px",fontFamily:"inherit"},
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
        <h2 style={{margin:0,fontSize:17,fontWeight:900,color:"#1e3a8a",fontFamily:"inherit"}}>📄 Rechtliches</h2>
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
            <p style={s.p}>Diese App speichert <strong>keine personenbezogenen Daten</strong> auf externen Servern. Lernfortschritte (Sterne, gelernte Buchstaben, Punkte, Tagesziel, gefundene Überraschungen), die gewählte Farbe von Klecks und die Einstellungen aus dem Elternbereich werden ausschließlich lokal im Speicher deines Browsers (localStorage) auf diesem Gerät abgelegt und nicht übertragen. Du kannst sie jederzeit im Elternbereich über „Fortschritt zurücksetzen" oder durch Löschen der Browserdaten entfernen.</p>

            <h3 style={s.h3}>3. Aufruf der Webseite (Server-Logfiles)</h3>
            <p style={s.p}>Beim Aufrufen der App überträgt dein Browser technisch bedingt Daten an unseren Webserver bzw. Hoster <span style={{background:"#fde68a",borderRadius:4,padding:"1px 5px"}}>[Name des Hosters]</span>: IP-Adresse, Datum und Uhrzeit, aufgerufene Datei, Browsertyp und Betriebssystem. Diese Daten sind für die Auslieferung der App erforderlich (Art. 6 Abs. 1 lit. f DSGVO), werden nicht mit anderen Daten zusammengeführt und nach <span style={{background:"#fde68a",borderRadius:4,padding:"1px 5px"}}>[z. B. 7]</span> Tagen gelöscht. Nach dem ersten Laden funktioniert die App auch offline.</p>

            <h3 style={s.h3}>3a. Forschungsmodus (nur mit Einwilligung)</h3>
            <p style={s.p}>Nur wenn Eltern im Elternbereich in die Teilnahme an einer Studie einwilligen und das Kind zustimmt, sendet die App pseudonyme Messwerte (z. B. Reaktionszeiten, Schreibdauer, Genauigkeit sowie Alter in Monaten, Klassenstufe, Händigkeit, Familiensprache) unter einem zufälligen Teilnahmecode an unseren Server. Namen, E-Mail- und IP-Adressen werden dabei nicht gespeichert. Einzelheiten stehen in der Elterninformation zur Studie. Die Teilnahme kann jederzeit im Elternbereich beendet werden; dann werden alle Studiendaten gelöscht.</p>

            <h3 style={s.h3}>4. Kinder & besonderer Schutz (Art. 8 DSGVO)</h3>
            <p style={s.p}>Diese App richtet sich an Kinder im Vorschul- und Grundschulalter. Wir erheben bewusst keinerlei personenbezogene Daten. Es werden keine Nutzerkonten erstellt, keine E-Mail-Adressen abgefragt und keine Tracking-Technologien eingesetzt.</p>

            <h3 style={s.h3}>5. Externe Inhalte</h3>
            <p style={s.p}>Die App lädt keine Inhalte von anderen Servern nach. Schrift, Figuren und Töne sind in der App enthalten; Bilder sind die Emojis deines Geräts. Es gibt keine Werbung und keine Links zu Shops.</p>

            <h3 style={s.h3}>6. Überraschungen und Effekte (optional)</h3>
            <p style={s.p}>Die kleinen Überraschungen (neue Stifte, Sachen für Klecks, Einhorn, Sternenregen) entstehen direkt in der App. Dabei werden keine Daten übertragen. Eltern können sie im Elternbereich ausschalten.</p>

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
            <p style={s.p}>Die Figur „Klecks“, die Buchstaben-Vorlagen und die Töne wurden für diese App selbst erstellt. Alle übrigen Bilder sind Emojis des jeweiligen Betriebssystems.</p>
            <div style={{...s.divider}}/>
            <h3 style={s.h3}>Weitere verwendete Ressourcen</h3>
            <p style={{...s.p,fontSize:12}}>
              <strong>React</strong> — MIT License — <a href="https://react.dev" style={s.link} target="_blank" rel="noreferrer">react.dev</a><br/>
              <strong>Schrift</strong> — Nunito von Vernon Adams u. a., SIL Open Font License 1.1 — <a href="https://fonts.google.com/specimen/Nunito" style={s.link} target="_blank" rel="noreferrer">fonts.google.com/specimen/Nunito</a> (in der App eingebettet, kein Abruf bei Google)<br/>
              <strong>Emojis</strong> — System-Emojis des jeweiligen Betriebssystems
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
