// Utilidades compartidas: pantallas, registro de minijuegos, precarga, video de premio y confeti.
const $=id=>document.getElementById(id);
function show(id){ document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("on",s.id===id)) }
function goFull(){ const d=document.documentElement; try{ (d.requestFullscreen||d.webkitRequestFullscreen||(()=>{})).call(d) }catch(e){} }

const espera=ms=>new Promise(r=>setTimeout(r,ms));
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [a[i],a[j]]=[a[j],a[i]] } return a }

// Precarga en segundo plano: el video de este nivel y el escenario del mundo siguiente
const precargado = new Set();
function precargar(url){ if(precargado.has(url)) return; precargado.add(url);
  if(/\.(webp|png|jpg)$/.test(url)) new Image().src=url; else fetch(url).catch(()=>precargado.delete(url)) }

// ---------- minijuegos ----------
// Cada minijuego es un archivo en js/minijuegos/ que llama a registrarMinijuego({...}):
//   id, nombre, abrir()            -> obligatorio: muestra su primera pantalla
//   icono, color, frase            -> su botón en el menú principal (imagen, color de fondo e id de voz al tocarlo)
//   iconoCubre                     -> true si la imagen trae fondo propio y debe llenar el botón
//   pausar(), reanudar()           -> opcional: al abrir/cerrar el rincón de los papás
//   progresoCambio()               -> opcional: cuando los papás reinician o abren todo
const MINIJUEGOS = [];
function registrarMinijuego(m){ MINIJUEGOS.push(m) }
function avisar(evento){ MINIJUEGOS.forEach(m=>{ try{ m[evento]&&m[evento]() }catch(e){ console.error(e) } }) }

// Menú principal: un botón grande por minijuego. Al tocarlo dice su frase y lo abre.
let menuTurno=0;
function irAlMenu(){
  if(MINIJUEGOS.length===1) return MINIJUEGOS[0].abrir();
  const box=$("menuJuegos"); box.innerHTML="";
  MINIJUEGOS.forEach((m,i)=>{
    const b=document.createElement("button"); b.className="menu-j"+(m.iconoCubre?" cubre":""); b.style.setProperty("--c",m.color||"#fff");
    b.style.animationDelay=(i*.4)+"s"; b.setAttribute("aria-label",m.nombre);
    b.innerHTML=`<img src="${m.icono}" alt=""><span class="lbl">${m.nombre}</span>`;
    b.onclick=async()=>{ const t=++menuTurno; sfx.pop(); b.classList.remove("toque"); void b.offsetWidth; b.classList.add("toque");
      if(m.frase) await Promise.race([say(m.frase),espera(2500)]); if(t===menuTurno) m.abrir() };
    box.appendChild(b);
  });
  show("menu");
}

// ---------- pista (compartida) ----------
// La pista se gana buscando: esperar sin tocar nada no revela la respuesta.
//   - animarMs sin tocar nada  -> animar(): la voz anima a buscar, sin decir dónde (se repite)
//   - "suave" toques fallidos  -> mostrar(1): señal suave (zona amplia / movimiento leve)
//   - "fuerte" toques fallidos -> mostrar(2): brillo en el lugar exacto
// reiniciar() al empezar a buscar algo nuevo; fallo() en cada toque equivocado; tocar() en cualquier toque.
function crearPista({animarMs=15000, suave=2, fuerte=4, mostrar, animar}={}){
  let t=null, fallos=0, nivel=0, activa=false;
  const armar=()=>{ clearTimeout(t); if(activa) t=setTimeout(()=>{ if(animar) animar(); armar() },animarMs) };
  return {
    reiniciar(){ activa=true; fallos=0; nivel=0; armar() },
    tocar(){ armar() },
    fallo(){ fallos++; armar(); const n=fallos>=fuerte?2:fallos>=suave?1:0; if(n>nivel){ nivel=n; if(mostrar) mostrar(n) } },
    parar(){ activa=false; clearTimeout(t) },
    reanudar(){ activa=true; armar() },           // después del rincón de los papás, sin perder los fallos
  };
}

// ---------- siempre en horizontal ----------
// iOS no deja bloquear la orientación. Si el teléfono queda vertical, el juego se gira por dentro
// para seguir sobre el lado largo, hacia el mismo lado en que se tenía en horizontal.
let giro=0, ultimoHorizontal=90;
function anguloPantalla(){
  const a=(screen.orientation&&typeof screen.orientation.angle==="number")?screen.orientation.angle:(window.orientation||0);
  return ((a%360)+360)%360;
}
// El tamaño y el giro los pone el CSS (@media orientation). Aquí solo se elige hacia qué lado girar.
const mqVertical=matchMedia("(orientation: portrait)");
function ajustarGiro(){
  const vertical=mqVertical.matches, a=anguloPantalla();
  if(a===90||a===270) ultimoHorizontal=a;
  // 90 = girado a la izquierda (la parte de arriba del teléfono queda a la izquierda)
  giro=vertical?(ultimoHorizontal===270?-90:90):0;
  document.documentElement.style.setProperty("--giro",(giro||90)+"deg");
  window.scrollTo(0,0);
}
function alGirar(){ ajustarGiro(); setTimeout(ajustarGiro,300) }
// Convierte un desplazamiento medido en pantalla (px) a las coordenadas del juego (por si está girado)
function aJuego(dx,dy){ const t=-giro*Math.PI/180, c=Math.cos(t), s=Math.sin(t); return [dx*c-dy*s, dx*s+dy*c] }
if(mqVertical.addEventListener) mqVertical.addEventListener("change",alGirar); else if(mqVertical.addListener) mqVertical.addListener(alGirar);
addEventListener("orientationchange",alGirar);
if(screen.orientation&&screen.orientation.addEventListener) screen.orientation.addEventListener("change",alGirar);
ajustarGiro();

function playVideo(src,done){
  const box=$("vid"), v=$("video"); v.src=src; box.classList.add("on"); v.currentTime=0; musicaPausa(true);
  v.volume=cfg.vol;
  let fin=()=>{ v.onended=null; v.pause(); box.classList.remove("on"); musicaPausa(false); done&&done(); fin=()=>{} };
  v.onended=()=>fin(); $("skip").onclick=()=>fin(); v.onerror=()=>fin();
  const p=v.play(); if(p&&p.catch) p.catch(()=>{ v.muted=true; v.play().catch(()=>fin()) });
}

// ---------- confeti ----------
function confetti(){
  const c=$("confetti"), st=$("stage"); c.width=st.clientWidth; c.height=st.clientHeight; const x=c.getContext("2d");
  const cols=["#ff595e","#ffca3a","#8ac926","#1982c4","#6a4c93","#ff9f1c"];
  const ps=Array.from({length:140},()=>({x:Math.random()*c.width,y:-Math.random()*c.height*.5,vy:2+Math.random()*4,vx:-2+Math.random()*4,r:Math.random()*6,s:5+Math.random()*8,c:cols[Math.random()*6|0],a:Math.random()*6}));
  let t=0; (function f(){ x.clearRect(0,0,c.width,c.height); ps.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.a+=.1;
    x.save(); x.translate(p.x,p.y); x.rotate(p.a); x.fillStyle=p.c; x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2); x.restore() });
    if(++t<150) requestAnimationFrame(f); else x.clearRect(0,0,c.width,c.height) })();
}
