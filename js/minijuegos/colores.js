// Minijuego: Los colores de Bip
// Bip pide una categoría (un color) y el niño toca, entre varias opciones, el objeto que corresponde.
// Cada acierto enciende una luz de la antena; al completarlas se ve el video de premio.
//
// El motor no sabe de colores: todo lo específico vive en un "modo" de MODOS_BIP.
// Para sumar formas o números del 1 al 5 basta con agregar otro modo con sus categorías,
// objetos e ids de voz, y elegirlo en COLORES_CFG.modo (o en una lista de rondas).

const COLORES_CFG = {
  modo: "colores",     // modo de MODOS_BIP
  aciertos: 5,         // luces de la antena
  opciones: 3,         // objetos por ronda (de categorías distintas; solo uno es el correcto)
  pistaMs: 10000,      // sin tocar nada, el correcto brilla
  video: "assets/v_bip_720.mp4",
};

// ---------- modos ----------
const COLOR_ADJ = { rojo:["rojo","roja"], azul:["azul","azul"], amarillo:["amarillo","amarilla"], verde:["verde","verde"] };
const MODOS_BIP = {
  colores: {
    categorias: ["rojo","azul","amarillo","verde"],
    // id, categoría, nombre con artículo y si es femenino (para "es roja")
    objetos: [
      ["manzana","rojo","la manzana",1], ["frutilla","rojo","la frutilla",1], ["carro","rojo","el carro de bomberos",0], ["corazon","rojo","el corazón",0],
      ["pez","azul","el pez",0], ["gorro","azul","el gorro",0], ["camion","azul","el camión",0], ["boton","azul","el botón",0],
      ["platano","amarillo","el plátano",0], ["sol","amarillo","el sol",0], ["pollito","amarillo","el pollito",0], ["estrella","amarillo","la estrella",1],
      ["hoja","verde","la hoja",1], ["rana","verde","la rana",1], ["pera","verde","la pera",1], ["tortuga","verde","la tortuga",1],
    ].map(([id,cat,nombre,f])=>({id,cat,nombre,f})),
    img: o=>`assets/colores/${o.cat}-${o.id}.webp`,
    // ids de voz (assets/voz/<id>.mp3, voz de Bip)
    voz: {
      pedirPrimera: c=>`col_pide1_${c}`,       // "¿Me ayudas a encender mi antena? ¡Busca algo rojo!"
      pedir:        c=>`col_pide_${c}`,        // "¡Ahora busca algo azul!"
      acierto:      o=>`col_si_${o.id}`,       // "¡Sí, la manzana es roja!"
      error:    (o,c)=>`col_no_${o.cat}_${c}`, // "Mmm, ese es azul. ¡Busca el rojo!"
      pista: "col_pista", final: "col_final",
    },
    // textos de respaldo si falta un mp3
    frases(){
      const f={ col_pista:"¡Mira, algo brilla!", col_final:"¡Mi antena está encendida! ¡Gracias, amigo!" };
      this.categorias.forEach(c=>{ f[`col_pide1_${c}`]=`¿Me ayudas a encender mi antena? ¡Busca algo ${c}!`; f[`col_pide_${c}`]=`¡Ahora busca algo ${c}!`;
        this.categorias.forEach(p=>{ if(p!==c) f[`col_no_${c}_${p}`]=`Mmm, ese es ${c}. ¡Busca el ${p}!` }) });
      this.objetos.forEach(o=>f[`col_si_${o.id}`]=`¡Sí, ${o.nombre} es ${COLOR_ADJ[o.cat][o.f]}!`);
      return f;
    },
  },
  // formas:  { categorias:["circulo","cuadrado","triangulo","estrella"], objetos:[...], img, voz, frases },
  // numeros: { categorias:[1,2,3,4,5], objetos:[...], dibujar(o,el){ /* n copias de un objeto */ }, voz, frases },
};

// Poses de Bip y dónde queda la bola de la antena en cada imagen (en % de la imagen), para el brillo
const BIP_POSES = {
  apagado:  { img:"assets/colores/bip-apagado.webp",  antena:[50.3,8] },
  pensando: { img:"assets/colores/bip-pensando.webp", antena:[62.8,7.2] },
  feliz:    { img:"assets/colores/bip-feliz.webp",    antena:null },   // ya trae la antena encendida
};

Object.values(MODOS_BIP).forEach(m=>m.frases&&registrarFrases(m.frases(), null));
registrarFrases({ menu_colores:"¡Vamos a jugar con los colores!" });

// ---------- juego ----------
let colEst=null;
const colPista = crearPista(COLORES_CFG.pistaMs, ()=>{
  const e=colEst; if(!e||e.ocupado) return;
  const k=e.opciones.findIndex(o=>o.cat===e.pedido); const el=$("colOpc").children[k];
  if(el){ el.classList.add("brilla"); say(e.modo.voz.pista) }
});

function colPose(p){
  const P=BIP_POSES[p], img=$("colBipImg"), b=$("colBrillo");
  if(!img.src.endsWith(P.img)) img.src=P.img;
  if(P.antena){ b.style.display=""; b.style.left=P.antena[0]+"%"; b.style.top=P.antena[1]+"%" } else b.style.display="none";
}
function colLuces(){
  const e=colEst, box=$("colLuces");
  if(box.children.length!==COLORES_CFG.aciertos){ box.innerHTML=""; for(let i=0;i<COLORES_CFG.aciertos;i++){ const d=document.createElement("div"); d.className="col-luz"; box.appendChild(d) } }
  [...box.children].forEach((d,i)=>d.classList.toggle("on",i<e.aciertos));
  const f=e.aciertos/COLORES_CFG.aciertos, b=$("colBrillo");
  b.style.setProperty("--nivel",f); b.style.opacity=f?.35+.65*f:0;     // desde la primera luz ya se nota
}

function colIniciar(){
  const modo=MODOS_BIP[COLORES_CFG.modo];
  colEst={ modo, aciertos:0, pedido:null, opciones:[], previos:[], ocupado:false };
  colPose("apagado"); colLuces(); show("colores");
  colRonda(true);
}

// Sortea una ronda: una categoría pedida (distinta de la anterior) y objetos de categorías distintas,
// sin repetir ninguno de los objetos de la ronda anterior.
function colRonda(primera){
  const e=colEst, m=e.modo, n=Math.min(COLORES_CFG.opciones,m.categorias.length);
  const libres=m.objetos.filter(o=>!e.previos.includes(o.id));
  const pedido=shuffle(m.categorias.filter(c=>c!==e.pedido))[0];
  const otras=shuffle(m.categorias.filter(c=>c!==pedido)).slice(0,n-1);
  const elegir=c=>shuffle(libres.filter(o=>o.cat===c))[0];
  e.pedido=pedido; e.opciones=shuffle([pedido,...otras].map(elegir)); e.previos=e.opciones.map(o=>o.id);
  const box=$("colOpc"); box.innerHTML="";
  e.opciones.forEach(o=>{
    const b=document.createElement("button"); b.className="col-op"; b.setAttribute("aria-label",o.nombre);
    if(m.dibujar) m.dibujar(o,b); else b.innerHTML=`<img src="${m.img(o)}" alt="">`;
    b.onpointerdown=ev=>{ ev.preventDefault(); colTocar(o,b) };
    box.appendChild(b);
  });
  say(primera?m.voz.pedirPrimera(pedido):m.voz.pedir(pedido));
  colPista.reiniciar();
}

async function colTocar(o,el){
  const e=colEst; if(!e||e.ocupado) return; actx();
  const sigue=()=>colEst===e;                      // si sale del juego, se corta todo
  colPista.reiniciar();
  if(o.cat!==e.pedido){                            // error: sonido chistoso, se sacude y Bip vuelve a pedir
    sfx.uy(); el.classList.remove("sacude","brilla"); void el.offsetWidth; el.classList.add("sacude");
    if(e.aciertos>0) colPose("pensando");
    say(e.modo.voz.error(o,e.pedido)); return;
  }
  // acierto
  e.ocupado=true; colPista.parar();
  [...$("colOpc").children].forEach(b=>{ b.classList.remove("brilla"); if(b!==el) b.classList.add("listo") });
  el.classList.remove("sacude"); void el.offsetWidth; el.classList.add("salta");
  sfx.pop(); e.aciertos++; colLuces(); setTimeout(()=>sfx.luz(e.aciertos),250);
  colPose("feliz"); const bip=$("colBip"); bip.classList.remove("contento"); void bip.offsetWidth; bip.classList.add("contento");
  await Promise.race([say(e.modo.voz.acierto(o)), espera(4000)]); if(!sigue()) return;
  if(e.aciertos>=COLORES_CFG.aciertos) return colFinal();
  colPose("pensando"); await espera(350); if(!sigue()) return;
  e.ocupado=false; colRonda(false);
}

async function colFinal(){
  const e=colEst; e.ocupado=true;
  prog.colores=(prog.colores||0)+1; save();       // veces que encendió la antena completa
  colPose("feliz"); sfx.win(); confetti();
  await Promise.race([say(e.modo.voz.final), espera(5000)]); if(colEst!==e) return;
  playVideo(COLORES_CFG.video, ()=>{ if(colEst===e){ colEst=null; irAlMenu() } });
}

function colSalir(){ colPista.parar(); colEst=null; callar() }
$("colBack").onclick=()=>{ sfx.tap(); colSalir(); irAlMenu() };

registrarMinijuego({
  id:"colores", nombre:"Los colores de Bip", icono:BIP_POSES.feliz.img, color:"#bfe8ff", frase:"menu_colores",
  abrir(){
    const m=MODOS_BIP[COLORES_CFG.modo];
    Object.values(BIP_POSES).forEach(p=>precargar(p.img)); m.objetos.forEach(o=>m.img&&precargar(m.img(o))); precargar(COLORES_CFG.video);
    colIniciar();
  },
  pausar(){ colPista.parar() },
  reanudar(){ if(colEst&&!colEst.ocupado&&$("colores").classList.contains("on")) colPista.reiniciar() },
});
