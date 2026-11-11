// Audio compartido: canales, efectos, música de fondo y desbloqueo en iOS.
// Todo pasa por tres canales (efectos, voz, música) que terminan en un volumen general.
let ac, bus={};
function actx(){
  if(!ac){ try{ ac=new (window.AudioContext||window.webkitAudioContext)();
    bus.master=ac.createGain(); bus.master.connect(ac.destination);
    ["sfx","voz","musica"].forEach(k=>{ bus[k]=ac.createGain(); bus[k].connect(bus.master) });
    bus.master.gain.value=cfg.vol; bus.musica.gain.value=0;
  }catch(e){} }
  if(ac&&ac.state==="suspended") ac.resume(); return ac }
function tone(f,t=0.15,type="sine",delay=0,vol=.25){ const a=actx(); if(!a) return;
  const o=a.createOscillator(), g=a.createGain(); o.type=type; o.frequency.value=f;
  const s=a.currentTime+delay; g.gain.setValueAtTime(vol,s); g.gain.exponentialRampToValueAtTime(.001,s+t);
  o.connect(g).connect(bus.sfx); o.start(s); o.stop(s+t) }
const sfx = {
  pop(){ tone(520,.12,"triangle"); tone(880,.18,"triangle",.08) },
  boing(){ const a=actx(); if(!a) return; const o=a.createOscillator(),g=a.createGain(); o.type="sine";
    o.frequency.setValueAtTime(300,a.currentTime); o.frequency.exponentialRampToValueAtTime(120,a.currentTime+.25);
    g.gain.setValueAtTime(.2,a.currentTime); g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.3); o.connect(g).connect(bus.sfx); o.start(); o.stop(a.currentTime+.3) },
  win(){ [523,659,784,1047].forEach((f,i)=>tone(f,.25,"triangle",i*.12)) },
  tap(){ tone(660,.08,"sine",0,.15) },
  // "uy" suave y chistoso para un error: dos notas que bajan con vibrato
  uy(){ const a=actx(); if(!a) return;
    [[440,370],[349,277]].forEach(([f1,f2],i)=>{ const t=a.currentTime+i*.2, o=a.createOscillator(), g=a.createGain(), l=a.createOscillator(), lg=a.createGain();
      o.type="triangle"; o.frequency.setValueAtTime(f1,t); o.frequency.exponentialRampToValueAtTime(f2,t+.18);
      l.frequency.value=14; lg.gain.value=10; l.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.16,t+.02); g.gain.exponentialRampToValueAtTime(.0001,t+.22);
      o.connect(g).connect(bus.sfx); o.start(t); l.start(t); o.stop(t+.24); l.stop(t+.24) }) },
  // nota que sube con cada luz encendida (n = 1..5)
  luz(n=1){ tone(440*Math.pow(2,(n*2)/12),.35,"sine",0,.18); tone(880*Math.pow(2,(n*2)/12),.25,"triangle",.05,.06) },
  // viento al volar Gruñi: ruido filtrado que sube y baja
  whoosh(ms=700){ const a=actx(); if(!a) return; const d=ms/1000, n=a.createBufferSource(), b=a.createBuffer(1,a.sampleRate*d,a.sampleRate), ch=b.getChannelData(0);
    for(let i=0;i<ch.length;i++) ch[i]=Math.random()*2-1; n.buffer=b;
    const f=a.createBiquadFilter(); f.type="bandpass"; f.Q.value=1.2; const t=a.currentTime;
    f.frequency.setValueAtTime(300,t); f.frequency.exponentialRampToValueAtTime(1400,t+d*.5); f.frequency.exponentialRampToValueAtTime(400,t+d);
    const g=a.createGain(); g.gain.setValueAtTime(.001,t); g.gain.exponentialRampToValueAtTime(.18,t+d*.4); g.gain.exponentialRampToValueAtTime(.001,t+d);
    n.connect(f).connect(g).connect(bus.sfx); n.start(t); n.stop(t+d) }
};

// ---------- música de fondo ----------
// Melodía de cajita de música sobre un bajo suave (Do - La menor - Fa - Sol), 8 compases en loop.
const MEL=[72,0,76,0,79,0,76,0, 76,0,72,0,69,0,72,0, 77,0,76,0,72,0,69,0, 71,0,74,0,79,0,74,0,
           76,79,81,0,79,0,76,0, 72,0,76,0,74,72,69,0, 69,0,72,0,77,0,76,0, 74,0,71,0,67,0,0,0];
const BAJO=[48,45,41,43,48,45,41,43];
const CORCHEA=60/88/2;                       // 88 pulsos por minuto
const MUSICA_VOL=.5, MUSICA_BAJA=.2;         // volumen normal y mientras habla la voz
const hz=m=>440*Math.pow(2,(m-69)/12);
function nota(m,t,dur,vol,type){ const a=ac, o=a.createOscillator(), g=a.createGain();
  o.type=type; o.frequency.value=hz(m); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.015);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g).connect(bus.musica); o.start(t); o.stop(t+dur+.05) }
let musT=null, musPaso=0, musProx=0, musPausa=false, musSuave=false;
function musicaTick(){
  while(musProx<ac.currentTime+.3){
    const i=musPaso%MEL.length, m=MEL[i];
    if(m){ nota(m,musProx,musSuave?1.3:.9,.09,"sine"); if(!musSuave) nota(m+12,musProx,.35,.02,"triangle") }
    if(i%8===0) nota(BAJO[i/8],musProx,CORCHEA*3.5,.08,"sine");
    if(i%8===4) nota(BAJO[(i-4)/8]+7,musProx,CORCHEA*3,.05,"sine");
    musPaso++; musProx+=CORCHEA*(musSuave?1.45:1);
  }
}
function musicaVolumen(){ if(!ac) return; const v=(cfg.musica&&!musPausa)?(vozSrc||("speechSynthesis" in window&&speechSynthesis.speaking)?MUSICA_BAJA:MUSICA_VOL*(musSuave?.6:1)):0;
  bus.musica.gain.setTargetAtTime(v,ac.currentTime,.25) }
function musicaIniciar(){ if(!actx()||musT) return; musProx=ac.currentTime+.1; musT=setInterval(musicaTick,100); musicaVolumen() }
function musicaPausa(p){ musPausa=p; musicaVolumen() }
// música suave (más lenta, más baja y sin brillo): para escenas tranquilas como la noche
function musicaSuave(s){ musSuave=!!s; musicaVolumen() }
function pintarMute(){ $("mute").textContent=cfg.musica?"🎵":"🔇"; $("mute").classList.toggle("off",!cfg.musica) }

// iOS Safari: el audio solo se habilita dentro de un toque; al primer toque se reproduce un sonido vacío.
function desbloquear(){ const a=actx(); if(!a) return;
  const b=a.createBuffer(1,1,22050), s=a.createBufferSource(); s.buffer=b; s.connect(a.destination); s.start(0);
  if(a.state==="running"){ ["pointerdown","touchend","click"].forEach(t=>document.removeEventListener(t,desbloquear,true)) } }
["pointerdown","touchend","click"].forEach(t=>document.addEventListener(t,desbloquear,true));
// en segundo plano no suena nada
document.addEventListener("visibilitychange",()=>{ if(!ac) return; if(document.hidden) ac.suspend(); else ac.resume() });

$("mute").onclick=()=>{ cfg.musica=!cfg.musica; saveCfg(); pintarMute(); musicaIniciar(); musicaVolumen(); sfx.tap() };
pintarMute();
