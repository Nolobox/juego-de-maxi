// Voz compartida: frases grabadas en assets/voz/<id>.mp3 con respaldo a la voz del sistema.
// Cada frase tiene un id = nombre del archivo en assets/voz/<id>.mp3 (generados con tools/generar_voces.py).
// Si el archivo no existe o no carga, se usa la voz del sistema con este texto.
// Cada minijuego agrega sus frases con registrarFrases({id:"texto"}, {id:velocidad}).
const FRASES = {}, VELOCIDAD = {}, VARIANTES = {};
function registrarFrases(frases, velocidad){ Object.assign(FRASES, frases); if(velocidad) Object.assign(VELOCIDAD, velocidad) }
// Grupo de variantes: addVar("enc_pelota",[t1,t2,t3]) crea enc_pelota_1.._3 y say("enc_pelota") elige una al azar.
function addVar(base,textos){ VARIANTES[base]=textos.length; textos.forEach((t,i)=>FRASES[`${base}_${i+1}`]=t) }

const vozBuf={}, vozCarga={};
let vozSrc=null;
function cargarVoz(id){
  if(vozBuf[id]) return Promise.resolve(vozBuf[id]);
  if(!vozCarga[id]) vozCarga[id]=fetch(`assets/voz/${id}.mp3`).then(r=>{ if(!r.ok) throw 0; return r.arrayBuffer() })
    .then(b=>new Promise((ok,ko)=>actx().decodeAudioData(b,ok,ko))).then(buf=>vozBuf[id]=buf)
    .catch(()=>{ vozBuf[id]=null; return null });
  return vozCarga[id];
}
let sysVoice=null;
function pickVoice(){ const v=speechSynthesis.getVoices(); sysVoice = v.find(x=>/es[-_](CL|419|MX|US)/i.test(x.lang)) || v.find(x=>/^es/i.test(x.lang)) || null }
if("speechSynthesis" in window){ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice }
function callar(){ if(vozSrc){ try{ vozSrc.stop() }catch(e){} vozSrc=null } if("speechSynthesis" in window) speechSynthesis.cancel() }
function vozSistema(txt,fin){ if(!txt||!("speechSynthesis" in window)) return fin();
  const u=new SpeechSynthesisUtterance(txt); u.lang=sysVoice?sysVoice.lang:"es-ES"; if(sysVoice) u.voice=sysVoice; u.rate=.95; u.pitch=1.25;
  u.onend=u.onerror=()=>{ musicaVolumen(); fin() }; speechSynthesis.speak(u); setTimeout(musicaVolumen,50) }
// say("pista") dice una frase; si el id tiene variantes (say("enc_pelota")) elige una al azar.
// Devuelve una promesa que se cumple cuando termina de hablar (o si otra frase la interrumpe).
let vozTurno=0;
function say(id){ return new Promise(fin=>{
  if(VARIANTES[id]) id=`${id}_${1+(Math.random()*VARIANTES[id]|0)}`;
  const txt=FRASES[id]; const turno=++vozTurno; callar();
  const a=actx();
  if(!a) return vozSistema(txt,fin);
  cargarVoz(id).then(buf=>{ if(turno!==vozTurno) return fin();      // ya se pidió otra frase
    if(!buf) return vozSistema(txt,fin);
    const s=a.createBufferSource(); s.buffer=buf; s.playbackRate.value=VELOCIDAD[id]||1;
    s.connect(bus.voz); s.onended=()=>{ if(vozSrc===s) vozSrc=null; musicaVolumen(); fin() }; s.start(); vozSrc=s; musicaVolumen() });
}) }
function precargarVoces(){ Object.keys(FRASES).forEach(cargarVoz) }
