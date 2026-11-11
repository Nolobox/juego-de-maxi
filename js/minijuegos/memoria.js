// Minijuego: La memoria de Rex
// Cartas boca abajo: se dan vuelta de a dos y hay que encontrar los pares. No se puede perder: sin tiempo y sin límite de intentos.
// 5 niveles; cada uno completo abre el siguiente y al terminar el 5 se ve el video de victoria (exclusivo de este minijuego).
// En el celular hay menos cartas que en la tablet para que queden grandes (ver MEM_CFG.niveles).

const MEM_CFG = {
  // celular si el lado más corto de la pantalla mide menos de 600 px
  celular: Math.min(screen.width, screen.height) < 600,
  // pares por nivel en celular y en tablet; vista: cuántos ms se muestran todas al inicio (0 = sin vista previa)
  niveles: [ { cel:3, tab:3, vista:3000 }, { cel:4, tab:4, vista:2000 }, { cel:5, tab:6, vista:0 },
             { cel:6, tab:8, vista:0 }, { cel:7, tab:10, vista:0 } ],
  pista: 4,               // intentos seguidos sin acierto antes de que brille una carta de un par pendiente
  esperaError: 1000,      // ms que quedan a la vista dos cartas distintas antes de volver a girar
  video: "assets/v_rex_memoria_720.mp4",
};
const memImg = n=>`assets/memoria/${n}.webp`;
// las 10 caras: id (= imagen) y cómo se nombra el par
const MEM_DIBUJOS = [["triceratops","triceratops"],["estegosaurio","estegosaurios"],["braquiosaurio","braquiosaurios"],
  ["pterodactilo","pterodáctilos"],["anquilosaurio","anquilosaurios"],["huevo","huevos"],["volcan","volcanes"],
  ["hueso","huesos"],["huella","huellas"],["palmera","palmeras"]];
const memPares = i=>MEM_CFG.niveles[i][MEM_CFG.celular?"cel":"tab"];

(function(){
  const f={ menu_memoria:"¡Vamos a jugar a la memoria con Rex!", mem_intro:"¡Busca las cartas iguales!", mem_mira:"¡Mira bien las cartas!",
    mem_muy_bien:"¡Muy bien!", mem_final:"¡Lo lograste! ¡Encontraste todos los pares! ¡Rex está feliz!",
    mem_bloqueado:"¡Primero juguemos el nivel anterior!", mem_nuevo_nivel:"¡Se abrió un nivel nuevo!" };
  MEM_DIBUJOS.forEach(([id,pl])=>f[`mem_par_${id}`]=`¡Dos ${pl}!`);
  registrarFrases(f);
  addVar("mem_no",["¡Uy, no son iguales!","¡Uy, no son iguales! ¡Prueba otra vez!"]);
})();

// ---------- progreso ----------
// prog.memoria = niveles completados (0..5). Los ya pasados se pueden volver a jugar.
const memHechos = ()=>prog.memoria||0;
const memAbierto = i=>i===0 || prog._abiertos || memHechos()>=i;

// ---------- mapa de niveles ----------
function memMapa(nuevo){
  const box=$("memLista"); box.innerHTML="";
  MEM_CFG.niveles.forEach((nv,i)=>{
    const b=document.createElement("button"), hecho=memHechos()>i, dib=MEM_DIBUJOS.slice(0,i+1).map(d=>d[0]);
    b.className="bipn"+(memAbierto(i)?"":" locked")+(i===nuevo?" nuevo":""); b.setAttribute("aria-label",`Nivel ${i+1}`);
    b.innerHTML=`<div class="bipn-ico n${dib.length}">${dib.map(x=>`<img src="${memImg(x)}" alt="">`).join("")}</div><div class="bipn-est">${hecho?"⭐":"☆"}</div>`;
    b.onclick=()=>{ if(!memAbierto(i)){ sfx.boing(); say("mem_bloqueado"); return } sfx.tap(); memIniciar(i) };
    box.appendChild(b);
  });
  show("memNiveles");
  if(nuevo!=null) setTimeout(()=>say("mem_nuevo_nivel"),400);
}
$("memNivBack").onclick=()=>{ sfx.tap(); callar(); irAlMenu() };

// ---------- cuadrícula ----------
// Busca cuántas columnas dejan las cartas más grandes en el espacio libre (a la derecha de Rex).
// Todo en cqw: el escenario mide 100 de ancho y 56,25 de alto, así no depende de los píxeles de cada pantalla.
const MEM_AREA = { x0:15, x1:93, y0:3, y1:54, gap:1.8, prop:349/480 };   // prop = ancho/alto de la carta
function memCuadricula(n){
  const A=MEM_AREA, aw=A.x1-A.x0, ah=A.y1-A.y0; let mejor=null;
  for(let c=1;c<=n;c++){ const r=Math.ceil(n/c);
    const w=Math.min((aw-A.gap*(c-1))/c, (ah-A.gap*(r-1))/r*A.prop);
    if(!mejor||w>mejor.w+.01||(Math.abs(w-mejor.w)<=.01&&c*r<mejor.c*mejor.r)) mejor={c,r,w} }
  const {c,r,w}=mejor, h=w/A.prop, pos=[];
  const alto=r*h+(r-1)*A.gap, y=A.y0+(ah-alto)/2;
  for(let i=0;i<n;i++){ const fila=Math.floor(i/c), enFila=Math.min(c,n-fila*c), col=i%c;
    const ancho=enFila*w+(enFila-1)*A.gap, x=A.x0+(aw-ancho)/2;      // la última fila incompleta queda centrada
    pos.push({ x:x+col*(w+A.gap), y:y+fila*(h+A.gap), w, h }) }
  return pos;
}

// ---------- juego ----------
let memEst=null;
const memSigue = e=>memEst===e;
let memPoseT=null;
function memRex(p,ms){ const img=$("memRex"), src=memImg("rex-"+p); if(!img.src.endsWith(src)) img.src=src;
  clearTimeout(memPoseT); if(ms) memPoseT=setTimeout(()=>{ if(memEst&&!memEst.ocupado) memRex("pensando") },ms);
  if(p!=="pensando"){ img.classList.remove("salta"); void img.offsetWidth; img.classList.add("salta") } }
const memGiro = ()=>{ tone(620,.09,"sine",0,.1); tone(830,.12,"sine",.06,.07) };   // sonido suave al dar vuelta

function memIniciar(i){
  callar();
  const n=memPares(i), dib=shuffle(MEM_DIBUJOS).slice(0,n).map(d=>d[0]);   // las caras se sortean en cada partida
  const cartas=shuffle([...dib,...dib]).map(id=>({ id, arriba:false, par:false }));
  const e=memEst={ i, cartas, abiertas:[], ocupado:true, fallos:0, pares:0, total:n };
  const mesa=$("memMesa"); mesa.innerHTML="";
  memCuadricula(cartas.length).forEach((p,k)=>{
    const c=cartas[k], b=document.createElement("button"); b.className="mem-carta"; b.setAttribute("aria-label","carta");
    b.style.cssText=`left:${p.x}cqw;top:${p.y}cqw;width:${p.w}cqw;height:${p.h}cqw;animation-delay:${k*.04}s`;
    b.innerHTML=`<div class="mem-giro"><div class="mem-dorso"><img src="${memImg("reverso")}" alt=""></div><div class="mem-cara"><img src="${memImg(c.id)}" alt=""></div></div>`;
    b.onpointerdown=ev=>{ ev.preventDefault(); memTocar(c) };
    c.el=b; mesa.appendChild(b);
  });
  memRex("pensando"); show("memoria"); precargar(MEM_CFG.video);
  const vista=MEM_CFG.niveles[i].vista;
  (async()=>{
    await espera(cartas.length*40+450); if(!memSigue(e)) return;
    if(vista){                                   // ayuda de los primeros niveles: se ven todas un rato
      decir("mem_mira"); cartas.forEach(c=>c.el.classList.add("arriba")); memGiro();
      await espera(vista); if(!memSigue(e)) return;
      cartas.forEach(c=>c.el.classList.remove("arriba")); memGiro(); await espera(500); if(!memSigue(e)) return;
    }
    decir("mem_intro"); e.ocupado=false;
  })();
}

async function memTocar(c){
  const e=memEst; if(!e||e.ocupado||c.arriba||c.par) return;    // mientras se resuelve un par, las demás no se tocan
  actx(); c.arriba=true; c.el.classList.add("arriba"); c.el.classList.remove("pista"); memGiro();
  e.abiertas.push(c); if(e.abiertas.length<2) return;
  e.ocupado=true; const [a,b]=e.abiertas; e.abiertas=[];
  await espera(480); if(!memSigue(e)) return;                   // que termine de girar
  if(a.id===b.id){
    a.par=b.par=true; a.el.classList.add("par"); b.el.classList.add("par"); e.pares++; e.fallos=0;
    $("memMesa").querySelectorAll(".pista").forEach(x=>x.classList.remove("pista"));
    sfx.luz(Math.min(e.pares,5)); memRex("celebra",1800);
    if(e.pares>=e.total) return memFinal(e,a.id);
    say(`mem_par_${a.id}`); e.ocupado=false; return;
  }
  // no son iguales: cara chistosa, 1 segundo a la vista y vuelven a girar
  memRex("chistoso",2200); sfx.uy(); say("mem_no");
  await espera(MEM_CFG.esperaError); if(!memSigue(e)) return;
  a.arriba=b.arriba=false; a.el.classList.remove("arriba"); b.el.classList.remove("arriba"); memGiro();
  e.fallos++;
  if(e.fallos>=MEM_CFG.pista && !$("memMesa").querySelector(".pista")){   // pista: brilla una carta de un par pendiente
    const p=shuffle(e.cartas.filter(x=>!x.par))[0]; if(p) p.el.classList.add("pista") }
  await espera(300); if(memSigue(e)) e.ocupado=false;
}

async function memFinal(e,id){
  const ultimo=e.i+1>=MEM_CFG.niveles.length;
  const nuevo = memHechos()<=e.i && !ultimo ? e.i+1 : null;
  prog.memoria=Math.max(memHechos(),e.i+1); save();
  memRex("celebra"); sfx.win(); confetti();
  await decir([`mem_par_${id}`, ultimo?"mem_final":"mem_muy_bien"]); if(!memSigue(e)) return;
  if(!ultimo){ await espera(900); if(memSigue(e)) memIniciar(e.i+1); return }
  playVideo(MEM_CFG.video, ()=>{ if(memSigue(e)){ memEst=null; memMapa(nuevo) } });
}

function memSalir(){ memEst=null; clearTimeout(memPoseT); callar() }
$("memBack").onclick=()=>{ sfx.tap(); memSalir(); memMapa() };

registrarMinijuego({
  id:"memoria", nombre:"La memoria de Rex", icono:memImg("rex-celebra"), color:"#d4f1b5", frase:"menu_memoria",
  abrir(){
    ["rex-pensando","rex-celebra","rex-chistoso","reverso",...MEM_DIBUJOS.map(d=>d[0])].forEach(n=>precargar(memImg(n)));
    memMapa();
  },
  progresoCambio(){ if($("memNiveles").classList.contains("on")) memMapa() },
});
// modo prueba: ?mem=3 abre directo el nivel 3; ?mem=3a lo abre con todas las cartas boca arriba (para revisar la cuadrícula)
(function(){ const m=location.search.match(/[?&]mem=(\d)(a?)/); if(m) addEventListener("load",()=>{ memIniciar(+m[1]-1);
  if(m[2]) setTimeout(()=>memEst.cartas.forEach(c=>c.el.classList.add("arriba")),3500) }) })();
