// Minijuego: Los colores de Bip
// Bip pide algo y el niño lo toca entre varias opciones. Cada acierto enciende una luz de la antena;
// al completarlas hay confeti, video de premio y se abre el nivel siguiente.
//
// El motor no sabe de colores ni de números: cada NIVEL usa un MODO de MODOS_BIP, que decide
//   sortear(e, nivel) -> { pedido, opciones:[{..., ok}], faltan }   (faltan = cuántas opciones correctas hay que tocar)
//   dibujar(o, boton)  -> qué se ve en cada opción
//   voz.pedir(e, primera), voz.acierto(e, o), voz.error(e, o)        -> ids de voz (o lista de ids, se dicen seguidos)
// Para sumar formas basta con otro modo con sus imágenes y voces, y un nivel que lo use.

const BIP_CFG = {
  // pista que se gana buscando (ver crearPista): 15 s sin tocar -> Bip anima; 1 error -> el correcto se mueve; 2 -> brilla
  pista: { animarMs:15000, suave:1, fuerte:2 },
  video: "assets/v_bip_720.mp4",
};

// Niveles en orden. "icono": imágenes de assets/colores/ que se ven en su botón del mapa de niveles.
const NIVELES_BIP = [
  { modo:"colores", opciones:3, aciertos:5, icono:["rojo-manzana","azul-pez","amarillo-sol"] },
  { modo:"colores", opciones:4, aciertos:5, icono:["rojo-manzana","azul-pez","amarillo-sol","verde-hoja"] },
  { modo:"pares",   opciones:5, aciertos:4, icono:["rojo-manzana","rojo-frutilla"] },          // los 2 del color pedido
  { modo:"numeros", opciones:3, aciertos:5, max:3, icono:["amarillo-estrella","amarillo-estrella","amarillo-estrella"] },
  { modo:"numeros", opciones:3, aciertos:5, max:5, icono:["amarillo-estrella","amarillo-estrella","amarillo-estrella","amarillo-estrella","amarillo-estrella"] },
];

// ---------- datos ----------
const COLOR_ADJ = { rojo:["rojo","roja"], azul:["azul","azul"], amarillo:["amarillo","amarilla"], verde:["verde","verde"] };
const COLOR_PL  = { rojo:"rojas", azul:"azules", amarillo:"amarillas", verde:"verdes" };
const OBJETOS_BIP = [   // id, color, nombre con artículo, femenino
  ["manzana","rojo","la manzana",1], ["frutilla","rojo","la frutilla",1], ["carro","rojo","el carro de bomberos",0], ["corazon","rojo","el corazón",0],
  ["pez","azul","el pez",0], ["gorro","azul","el gorro",0], ["camion","azul","el camión",0], ["boton","azul","el botón",0],
  ["platano","amarillo","el plátano",0], ["sol","amarillo","el sol",0], ["pollito","amarillo","el pollito",0], ["estrella","amarillo","la estrella",1],
  ["hoja","verde","la hoja",1], ["rana","verde","la rana",1], ["pera","verde","la pera",1], ["tortuga","verde","la tortuga",1],
].map(([id,cat,nombre,f])=>({id,cat,nombre,f}));
const imgObj = o=>`assets/colores/${o.cat}-${o.id}.webp`;
const CATS = ["rojo","azul","amarillo","verde"];
const NUM = { 1:"uno", 2:"dos", 3:"tres", 4:"cuatro", 5:"cinco" };
// objetos fáciles de contar: id, singular, plural, femenino
const CONTABLES = [["estrella","estrella","estrellas",1],["manzana","manzana","manzanas",1],["pez","pez","peces",0],
  ["sol","sol","soles",0],["corazon","corazón","corazones",0],["pollito","pollito","pollitos",0]]
  .map(([id,sing,pl,f])=>({ ...OBJETOS_BIP.find(o=>o.id===id), sing, pl, f }));

// elige un objeto del color c que no estuvo en la ronda anterior
const libreDe=(e,c,usados=[])=>shuffle(OBJETOS_BIP.filter(o=>o.cat===c&&!e.previos.includes(o.id)&&!usados.includes(o.id)))[0]
  || shuffle(OBJETOS_BIP.filter(o=>o.cat===c&&!usados.includes(o.id)))[0];   // por si no queda ninguno nuevo
const dibujarObjeto=(o,b)=>{ b.innerHTML=`<img src="${imgObj(o)}" alt="">` };

// ---------- modos ----------
const MODOS_BIP = {
  // Un objeto del color pedido entre objetos de colores distintos
  colores: {
    sortear(e,nv){
      const pedido=shuffle(CATS.filter(c=>c!==e.pedido))[0];
      const otras=shuffle(CATS.filter(c=>c!==pedido)).slice(0,Math.min(nv.opciones,CATS.length)-1);
      const opciones=shuffle([pedido,...otras].map(c=>({ ...libreDe(e,c), ok:c===pedido })));
      return { pedido, opciones, faltan:1 };
    },
    dibujar: dibujarObjeto,
    voz: {
      pedir:(e,primera)=>primera?`col_pide1_${e.pedido}`:`col_pide_${e.pedido}`,   // "¿Me ayudas…? ¡Busca algo rojo!" / "¡Ahora busca algo azul!"
      acierto:(e,o)=>`col_si_${o.id}`,                                            // "¡Sí, la manzana es roja!"
      error:(e,o)=>`col_no_${o.cat}_${e.pedido}`,                                 // "Mmm, ese es azul. ¡Busca el rojo!"
    },
  },
  // Dos objetos del color pedido entre cinco: hay que encontrar los dos
  pares: {
    sortear(e,nv){
      const pedido=shuffle(CATS.filter(c=>c!==e.pedido))[0];
      const a=libreDe(e,pedido), b=libreDe(e,pedido,[a.id]);
      const resto=nv.opciones-2, otras=[];
      for(let i=0;i<resto;i++){ const c=shuffle(CATS.filter(x=>x!==pedido))[0]; otras.push({ ...libreDe(e,c,otras.map(o=>o.id)), ok:false }) }
      return { pedido, opciones:shuffle([{...a,ok:true},{...b,ok:true},...otras]), faltan:2 };
    },
    dibujar: dibujarObjeto,
    voz: {
      pedir:(e)=>`col_par_${e.pedido}`,                                           // "¡Busca las dos cosas rojas!"
      acierto:(e,o)=>e.faltan>0?[`col_si_${o.id}`,"col_falta"]:`col_si_${o.id}`,   // "…¡Falta una más!"
      error:(e,o)=>`col_no_${o.cat}_${e.pedido}`,
    },
  },
  // Tarjetas con 1..max copias del mismo objeto: tocar la que tiene la cantidad pedida
  numeros: {
    sortear(e,nv){
      const obj=shuffle(CONTABLES.filter(o=>!e.ultimoObj||o.id!==e.ultimoObj))[0]; e.ultimoObj=obj.id;
      const nums=Array.from({length:nv.max},(_,i)=>i+1);
      const pedido=shuffle(nums.filter(n=>n!==e.pedido))[0];
      const otros=shuffle(nums.filter(n=>n!==pedido)).slice(0,nv.opciones-1);
      return { pedido, opciones:shuffle([pedido,...otros].map(n=>({ ...obj, id:`${obj.id}-${n}`, obj, n, ok:n===pedido }))), faltan:1 };
    },
    dibujar(o,b){ b.innerHTML=`<div class="cnt cnt-${o.n}">${`<img src="${imgObj(o.obj)}" alt="">`.repeat(o.n)}</div>` },
    voz: {
      pedir:(e,primera)=>{ const o=e.opciones[0].obj, id=`num_pide_${o.id}_${e.pedido}`; return primera?["num_intro",id]:id },  // "¡Busca tres estrellas!"
      acierto:(e,o)=>`num_si_${o.obj.id}_${o.n}`,                                // "¡Sí, son tres estrellas!"
      error:(e,o)=>`num_no_${o.n}_${e.pedido}`,                                  // "Mmm, ese tiene dos. ¡Busca el que tiene tres!"
    },
  },
};

// textos de respaldo (si falta un mp3 se usa la voz del sistema)
(function(){
  const f={ col_pista:"¡Mira, algo brilla!", col_final:"¡Mi antena está encendida! ¡Gracias, amigo!", col_anima:"¿Cuál será? ¡Toca uno, tú puedes!",
    col_falta:"¡Muy bien! ¡Falta una más!", num_intro:"¿Me ayudas a encender mi antena? ¡Vamos a contar!",
    col_bloqueado:"¡Primero juguemos el nivel anterior!", col_nuevo_nivel:"¡Se abrió un nivel nuevo!", menu_colores:"¡Vamos a jugar con Bip!" };
  CATS.forEach(c=>{ f[`col_pide1_${c}`]=`¿Me ayudas a encender mi antena? ¡Busca algo ${c}!`; f[`col_pide_${c}`]=`¡Ahora busca algo ${c}!`;
    f[`col_par_${c}`]=`¡Busca las dos cosas ${COLOR_PL[c]}!`;
    CATS.forEach(p=>{ if(p!==c) f[`col_no_${c}_${p}`]=`Mmm, ese es ${c}. ¡Busca el ${p}!` }) });
  OBJETOS_BIP.forEach(o=>f[`col_si_${o.id}`]=`¡Sí, ${o.nombre} es ${COLOR_ADJ[o.cat][o.f]}!`);
  CONTABLES.forEach(o=>{ for(let n=1;n<=5;n++){
    const art=o.f?"una":"un";
    f[`num_pide_${o.id}_${n}`]=n===1?`¡Busca ${art} ${o.sing}!`:`¡Busca ${NUM[n]} ${o.pl}!`;
    f[`num_si_${o.id}_${n}`]=n===1?`¡Sí, es ${art} ${o.sing}!`:`¡Sí, son ${NUM[n]} ${o.pl}!` } });
  for(let a=1;a<=5;a++) for(let b=1;b<=5;b++) if(a!==b) f[`num_no_${a}_${b}`]=`Mmm, ese tiene ${NUM[a]}. ¡Busca el que tiene ${NUM[b]}!`;
  registrarFrases(f);
})();

// Poses de Bip y dónde queda la bola de la antena en cada imagen (en % de la imagen), para el brillo
const BIP_POSES = {
  apagado:  { img:"assets/colores/bip-apagado.webp",  antena:[50.3,8] },
  pensando: { img:"assets/colores/bip-pensando.webp", antena:[62.8,7.2] },
  feliz:    { img:"assets/colores/bip-feliz.webp",    antena:null },   // ya trae la antena encendida
};

// ---------- progreso ----------
// prog.bip = cuántos niveles completó (0..N). Antes se guardaba prog.colores (veces completado el primer nivel).
if(!prog.bip && prog.colores) { prog.bip=1; save() }
const bipNivelesHechos = ()=>prog.bip||0;
const bipAbierto = i => i===0 || prog._abiertos || bipNivelesHechos()>=i;

// ---------- mapa de niveles ----------
function bipMapa(nuevo){
  const box=$("bipLista"); box.innerHTML="";
  NIVELES_BIP.forEach((nv,i)=>{
    const b=document.createElement("button"), abierto=bipAbierto(i), hecho=bipNivelesHechos()>i;
    b.className="bipn"+(abierto?"":" locked")+(i===nuevo?" nuevo":""); b.setAttribute("aria-label",`Nivel ${i+1}`);
    b.innerHTML=`<div class="bipn-ico n${nv.icono.length}">${nv.icono.map(x=>`<img src="assets/colores/${x}.webp" alt="">`).join("")}</div>`+
      `<div class="bipn-est">${hecho?"⭐":"☆"}</div>`;
    b.onclick=()=>{ if(!bipAbierto(i)){ sfx.boing(); say("col_bloqueado"); return } sfx.tap(); colIniciar(i) };
    box.appendChild(b);
  });
  show("bipNiveles");
  if(nuevo!=null) setTimeout(()=>say("col_nuevo_nivel"),400);
}
$("bipNivBack").onclick=()=>{ sfx.tap(); callar(); irAlMenu() };

// ---------- juego ----------
let colEst=null;
const colPista = crearPista({ ...BIP_CFG.pista,
  animar(){ const e=colEst; if(e&&!e.ocupado&&$("colores").classList.contains("on")) say("col_anima") },
  mostrar(n){ const e=colEst; if(!e||e.ocupado) return;
    const k=e.opciones.findIndex(o=>o.ok&&!o.hecho), el=$("colOpc").children[k]; if(!el) return;
    if(n===1) el.classList.add("tiembla"); else { el.classList.remove("tiembla"); el.classList.add("brilla"); say("col_pista") } } });

// dice uno o varios ids seguidos
async function decir(ids){ for(const id of [].concat(ids)){ await Promise.race([say(id),espera(5000)]) } }

function colPose(p){
  const P=BIP_POSES[p], img=$("colBipImg"), b=$("colBrillo");
  if(!img.src.endsWith(P.img)) img.src=P.img;
  if(P.antena){ b.style.display=""; b.style.left=P.antena[0]+"%"; b.style.top=P.antena[1]+"%" } else b.style.display="none";
}
function colLuces(){
  const e=colEst, total=e.nivel.aciertos, box=$("colLuces");
  if(box.children.length!==total){ box.innerHTML=""; for(let i=0;i<total;i++){ const d=document.createElement("div"); d.className="col-luz"; box.appendChild(d) } }
  [...box.children].forEach((d,i)=>d.classList.toggle("on",i<e.aciertos));
  const f=e.aciertos/total, b=$("colBrillo");
  b.style.setProperty("--nivel",f); b.style.opacity=f?.35+.65*f:0;     // desde la primera luz ya se nota
}

function colIniciar(i){
  const nivel=NIVELES_BIP[i];
  colEst={ i, nivel, modo:MODOS_BIP[nivel.modo], aciertos:0, pedido:null, opciones:[], previos:[], faltan:0, ocupado:false };
  $("colores").classList.toggle("muchas",nivel.opciones>4);
  colPose("apagado"); colLuces(); show("colores");
  colRonda(true);
}

// Sortea una ronda con el modo del nivel, sin repetir los objetos de la ronda anterior.
function colRonda(primera){
  const e=colEst, r=e.modo.sortear(e,e.nivel);
  e.pedido=r.pedido; e.opciones=r.opciones; e.faltan=r.faltan; e.previos=r.opciones.map(o=>(o.obj||o).id);
  const box=$("colOpc"); box.innerHTML="";
  e.opciones.forEach(o=>{
    const b=document.createElement("button"); b.className="col-op"; b.setAttribute("aria-label",o.nombre);
    e.modo.dibujar(o,b);
    b.onpointerdown=ev=>{ ev.preventDefault(); colTocar(o,b) };
    box.appendChild(b);
  });
  decir(e.modo.voz.pedir(e,primera));
  colPista.reiniciar();
}

async function colTocar(o,el){
  const e=colEst; if(!e||e.ocupado||o.hecho) return; actx();
  const sigue=()=>colEst===e;                      // si sale del juego, se corta todo
  if(!o.ok){                                       // error: sonido chistoso, se sacude y Bip vuelve a pedir
    sfx.uy(); el.classList.remove("sacude"); void el.offsetWidth; el.classList.add("sacude");
    if(e.aciertos>0) colPose("pensando");
    decir(e.modo.voz.error(e,o)); colPista.fallo(); return;
  }
  o.hecho=true; e.faltan--;
  el.classList.remove("sacude","brilla","tiembla"); void el.offsetWidth; el.classList.add("salta","hecho");
  sfx.pop(); colPose("feliz"); const bip=$("colBip"); bip.classList.remove("contento"); void bip.offsetWidth; bip.classList.add("contento");
  if(e.faltan>0){                                  // falta otro del mismo color: sigue la misma ronda
    colPista.reiniciar(); decir(e.modo.voz.acierto(e,o)); return;
  }
  // ronda completa
  e.ocupado=true; colPista.parar();
  [...$("colOpc").children].forEach(b=>{ b.classList.remove("brilla","tiembla"); if(!b.classList.contains("hecho")) b.classList.add("listo") });
  e.aciertos++; colLuces(); setTimeout(()=>sfx.luz(e.aciertos),250);
  await decir(e.modo.voz.acierto(e,o)); if(!sigue()) return;
  if(e.aciertos>=e.nivel.aciertos) return colFinal();
  colPose("pensando"); await espera(350); if(!sigue()) return;
  e.ocupado=false; colRonda(false);
}

async function colFinal(){
  const e=colEst; e.ocupado=true;
  const nuevo = bipNivelesHechos()<=e.i && e.i+1<NIVELES_BIP.length ? e.i+1 : null;   // primera vez que pasa este nivel
  prog.bip=Math.max(bipNivelesHechos(),e.i+1); prog.colores=(prog.colores||0)+1; save();
  colPose("feliz"); sfx.win(); confetti();
  await decir("col_final"); if(colEst!==e) return;
  playVideo(BIP_CFG.video, ()=>{ if(colEst===e){ colEst=null; bipMapa(nuevo) } });
}

function colSalir(){ colPista.parar(); colEst=null; callar() }
$("colBack").onclick=()=>{ sfx.tap(); colSalir(); bipMapa() };

registrarMinijuego({
  id:"colores", nombre:"Los colores de Bip", icono:BIP_POSES.feliz.img, color:"#bfe8ff", frase:"menu_colores",
  abrir(){
    Object.values(BIP_POSES).forEach(p=>precargar(p.img)); OBJETOS_BIP.forEach(o=>precargar(imgObj(o))); precargar(BIP_CFG.video);
    bipMapa();
  },
  pausar(){ colPista.parar() },
  reanudar(){ if(colEst&&!colEst.ocupado&&$("colores").classList.contains("on")) colPista.reanudar() },
  progresoCambio(){ if($("bipNiveles").classList.contains("on")) bipMapa() },
});
