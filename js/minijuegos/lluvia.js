// Minijuego: ¡Que no llueva!
// Tres mundos con la misma idea: darle cosas a Gruñi (tocarlas o arrastrarlas hasta él) y ver cómo cambian su ánimo y el clima.
//   Mundo 1 "Alegra a Gruñi":       regalos; cada uno lo alegra un poco, la lluvia baja y al final sale el arcoíris.
//   Mundo 2 "La merienda de Gruñi": comida de todos los días (sale el sol) y de vez en cuando (rica, pero 2 seguidas dan dolor de guatita).
//   Mundo 3 "El día de Gruñi":      mañana, tarde y noche; Gruñi muestra en un globito lo que necesita.
// Cada mundo tiene 3 niveles que se juegan seguidos. Al terminar el tercero se ve el video del mundo (cada mundo tiene
// el suyo y no se repite en otro minijuego) y se abre el mundo siguiente.
//
// Cada mundo usa un MOTOR de MOTORES_LLU:
//   iniciar(e)            -> arma la escena y la primera ronda
//   dar(e, o, boton, d)   -> el niño le dio el objeto o (d = a quién lo arrastró, o null si solo lo tocó)
// La bandeja de abajo, el arrastre, el vuelo, la pista y el final de nivel son comunes.

const LLU_CFG = {
  // 10 s sin tocar -> brilla el objeto correcto y se repite el pedido; 1 error -> el correcto se mueve; 2 -> brilla
  pista: { animarMs:10000, suave:1, fuerte:2 },
};
const lluImg = n=>`assets/lluvia/${n}.webp`;

// ---------- objetos ----------
// tipo: diario (comida de todos los días) | dulce (de vez en cuando). alivia: agua o fruta, quita el dolor de guatita.
const LLU_OBJ = {
  pluma:{img:"regalo-pluma"}, globo:{img:"regalo-globo"}, flor:{img:"regalo-flor"}, nota:{img:"regalo-nota"}, caramelo:{img:"regalo-caramelo"},
  manzana:{img:"comida-manzana",tipo:"diario",alivia:1}, platano:{img:"comida-platano",tipo:"diario",alivia:1},
  zanahoria:{img:"comida-zanahoria",tipo:"diario"}, brocoli:{img:"comida-brocoli",tipo:"diario"}, leche:{img:"comida-leche",tipo:"diario"},
  agua:{img:"comida-agua",tipo:"diario",alivia:1}, pan:{img:"comida-pan",tipo:"diario"}, uvas:{img:"comida-uvas",tipo:"diario",alivia:1},
  torta:{img:"dulce-torta",tipo:"dulce"}, chupete:{img:"dulce-chupete",tipo:"dulce"}, papas:{img:"dulce-papas",tipo:"dulce"},
  bebida:{img:"dulce-bebida",tipo:"dulce"}, helado:{img:"dulce-helado",tipo:"dulce"}, dona:{img:"dulce-dona",tipo:"dulce"},
  cereal:{img:"manana-cereal"}, cepillo:{img:"manana-cepillo"}, peineta:{img:"manana-peineta"}, mochila:{img:"manana-mochila"},
  pelota:{img:"tarde-pelota"}, vaso:{img:"tarde-agua"}, balde:{img:"tarde-balde"}, fruta:{img:"tarde-manzana"},
  patito:{img:"noche-patito"}, pijama:{img:"noche-pijama"}, libro:{img:"noche-libro"}, almohada:{img:"noche-almohada"},
};
const REGALOS = ["pluma","globo","flor","nota","caramelo"];
const DIARIO = Object.keys(LLU_OBJ).filter(k=>LLU_OBJ[k].tipo==="diario");
const DULCE  = Object.keys(LLU_OBJ).filter(k=>LLU_OBJ[k].tipo==="dulce");

// ---------- mundos y niveles ----------
const MUNDOS_LLU = [
  { id:"llu1", nombre:"Alegra a Gruñi", motor:"alegrar", icono:"gruni-arcoiris", color:"#cfe3ff", video:"assets/v_lluvia_abrazo_720.mp4",
    niveles:[ { regalos:2 },                       // 2 regalos
              { regalos:3, especial:true },        // 3 regalos, y el segundo lo pide él ("¡Quiero algo que suene!")
              { regalos:2, nubes:2 } ] },          // dos nubes tristes
  { id:"llu2", nombre:"La merienda de Gruñi", motor:"merienda", icono:"gruni-comiendo", color:"#d5f2c4", video:"assets/v_lluvia_picnic_720.mp4",
    niveles:[ { modo:"elegir", meta:3 },           // 2 opciones muy distintas (una de todos los días y una de vez en cuando)
              { modo:"plato",  meta:3 },           // armar un plato con 3 alimentos
              { modo:"picnic" } ] },               // cada amigo pide algo de un color
  { id:"llu3", nombre:"El día de Gruñi", motor:"dia", icono:"gruni-durmiendo", color:"#d4cdf7", video:"assets/v_lluvia_noche_720.mp4",
    niveles:[ { escena:"manana", pasos:["desayuno","dientes"], inicio:"despierta" },
              { escena:"tarde",  pasos:["jugar","agua","fruta"], inicio:"riendo" },
              { escena:"noche",  pasos:["bano","pijama","cuento","almohada"], inicio:"cansado", tranquilo:true } ] },
];

// Mundo 3: lo que pide Gruñi. ok = lo que sirve; otros = de dónde salen las 2 opciones que no sirven; pose = cómo queda.
const PASOS_DIA = {
  desayuno:{ ok:"cereal",   otros:["peineta","mochila","pelota"],  verbo:"desayunar", pose:"comiendo" },
  dientes: { ok:"cepillo",  otros:["peineta","mochila","balde"],   verbo:"dientes",   pose:"dientes" },
  jugar:   { ok:"pelota",   otros:["cepillo","almohada","pijama"], verbo:"jugar",     pose:"cansado" },
  agua:    { ok:"vaso",     otros:["pelota","peineta","mochila"],  verbo:"tomar",     pose:"riendo" },
  fruta:   { ok:"fruta",    otros:["pelota","balde","peineta"],    verbo:"comer",     pose:"comiendo" },
  bano:    { ok:"patito",   otros:["pelota","mochila","peineta"],  verbo:"banarse",   pose:"riendo" },
  pijama:  { ok:"pijama",   otros:["pelota","balde","mochila"],    verbo:"dormir",    pose:"riendo" },
  cuento:  { ok:"libro",    otros:["pelota","cereal","balde"],     verbo:"leer",      pose:"despierta" },
  almohada:{ ok:"almohada", otros:["pelota","mochila","balde"],    verbo:"dormir",    pose:"despierta" },
};
// Mundo 2, picnic: quién pide, de qué color (para el globito) y qué comida es de ese color
const PICNIC = {
  rex:  { img:PERSONAJES.rex.img,               css:"#3cb44b", comida:"brocoli" },
  maxi: { img:PERSONAJES.maxi.img,              css:"#e53935", comida:"manzana" },
  bip:  { img:"assets/colores/bip-feliz.webp",  css:"#ffd23f", comida:"platano" },
  gruni:{ img:lluImg("gruni-riendo"),           css:"#8e44ad", comida:"uvas" },
};
const PICNIC_COLORES = ["manzana","platano","zanahoria","brocoli","uvas"];   // una comida por color, sin dudas

// ---------- frases ----------
// llu_* las dice la narradora (juego-mujer); llg_* las dice Gruñi (juego-hombre, un poco más rápido para distinguirlo de Bip).
(function(){
  const n={   // narradora
    menu_lluvia:"¡Vamos a alegrar a Gruñi!", llu_nuevo_mundo:"¡Se abrió un mundo nuevo!",
    llu_m1_intro:"Gruñi está triste. ¿Lo ayudamos a sonreír?", llu_regalo:"¡Toca un regalo o llévalo hasta Gruñi!",
    llu_m1_dos:"¡Oh, hay dos nubes tristes! ¿Alegramos a las dos?", llu_otra_nube:"¡Muy bien! ¡Ahora la otra nube!",
    llu_anima_regalo:"¡Dale un regalo a Gruñi!", llu_m1_fin:"¡Salió el arcoíris! ¡Gruñi está feliz!", llu_m1_fin2:"¡Salió el arcoíris! ¡Las dos nubes están felices!",
    llu_m2_intro:"¡Es la hora de la merienda! ¿Qué le damos a Gruñi?", llu_m2_plato:"¡Armemos un plato con tres cosas ricas para Gruñi!",
    llu_m2_picnic:"¡Vamos de picnic con los amigos! Cada uno quiere algo.", llu_anima_comida:"¿Qué le damos a Gruñi?",
    llu_pic_rex:"¡Rex quiere algo verde!", llu_pic_maxi:"¡Maxi quiere algo rojo!", llu_pic_bip:"¡Bip quiere algo amarillo!", llu_pic_gruni:"¡Gruñi quiere algo morado!",
    llu_picno_rex:"Mmm, eso no es verde. ¡Rex quiere algo verde!", llu_picno_maxi:"Mmm, eso no es rojo. ¡Maxi quiere algo rojo!",
    llu_picno_bip:"Mmm, eso no es amarillo. ¡Bip quiere algo amarillo!", llu_picno_gruni:"Mmm, eso no es morado. ¡Gruñi quiere algo morado!",
    llu_picsi_rex:"¡Sí! ¡El brócoli es verde! ¡Rex está feliz!", llu_picsi_maxi:"¡Sí! ¡La manzana es roja! ¡Maxi está feliz!",
    llu_picsi_bip:"¡Sí! ¡El plátano es amarillo! ¡Bip está feliz!", llu_picsi_gruni:"¡Sí! ¡Las uvas son moradas! ¡Gruñi está feliz!",
    llu_m3_manana:"¡Buenos días! Gruñi se está despertando. ¿Lo ayudamos?", llu_m3_tarde:"¡Qué linda tarde! ¿Qué quiere hacer Gruñi?",
    llu_m3_noche:"Ya es de noche. Gruñi se prepara para dormir.", llu_m3_f_manana:"¡Salió el sol! ¡Gruñi está listo para el día!",
    llu_m3_f_tarde:"¡Muy bien! Gruñi jugó, tomó agua y comió fruta.", llu_lampara:"Ahora, apaga la lámpara.",
    llu_m3_fin:"Buenas noches, Gruñi. Que tengas lindos sueños.",
  };
  const g={   // Gruñi
    llg_r_pluma:"¡Jijiji! ¡Me hace cosquillas!", llg_r_globo:"¡Uuuh! ¡Un globo que vuela!", llg_r_flor:"¡Qué flor tan linda! ¡Huele rico!",
    llg_r_nota:"¡La, la, la! ¡Qué linda música!", llg_r_caramelo:"¡Ñam, ñam! ¡Qué rico caramelo!",
    llg_pide_nota:"¡Quiero algo que suene!", llg_pide_pluma:"¡Quiero algo que haga cosquillas!", llg_pide_flor:"¡Quiero algo que huela rico!",
    llg_pide_caramelo:"¡Quiero algo dulce!", llg_pide_globo:"¡Quiero algo que vuele!",
    llg_no_nota:"¡Jiji, eso no suena! ¡Quiero algo que suene!", llg_no_pluma:"¡Jiji, eso no hace cosquillas! ¡Quiero algo que haga cosquillas!",
    llg_no_flor:"¡Jiji, eso no tiene olor! ¡Quiero algo que huela rico!", llg_no_caramelo:"¡Jiji, eso no se come! ¡Quiero algo dulce!",
    llg_no_globo:"¡Jiji, eso no vuela! ¡Quiero algo que vuele!",
    llg_come_manzana:"¡Ñam! ¡Qué rica la manzana!", llg_come_platano:"¡Ñam! ¡Qué rico el plátano!", llg_come_zanahoria:"¡Crunch, crunch! ¡Qué rica la zanahoria!",
    llg_come_brocoli:"¡Ñam! ¡Qué rico el brócoli!", llg_come_leche:"¡Glu, glu! ¡Qué rica la leche!", llg_come_agua:"¡Glu, glu! ¡Qué rica el agua!",
    llg_come_pan:"¡Ñam! ¡Qué rico el pan!", llg_come_uvas:"¡Ñam! ¡Qué ricas las uvas!",
    llg_dulce_torta:"¡Mmm, qué rica la torta!", llg_dulce_chupete:"¡Mmm, qué rico el chupete!", llg_dulce_papas:"¡Mmm, qué ricas las papas fritas!",
    llg_dulce_bebida:"¡Mmm, qué rica la bebida!", llg_dulce_helado:"¡Mmm, qué rico el helado!", llg_dulce_dona:"¡Mmm, qué rica la dona!",
    llg_guatita:"¡Uy, me duele un poquito la guatita! ¿Me das agua o una fruta?", llg_mejor:"¡Ahh, ya me siento mejor! ¡Gracias!",
    llg_guatita_no:"Mmm, mejor un poquito de agua o una fruta.", llg_plato:"¡Qué plato tan rico! ¡Ñam, ñam!",
    llg_m2_fin:"¡Qué rica merienda! ¡Salió el sol!", llg_picnic_fin:"¡Qué rico picnic! ¡Gracias, amigos!",
    llg_q_desayuno:"¡Tengo hambre! ¿Qué tomo de desayuno?", llg_q_dientes:"¡Ahora quiero lavarme los dientes!", llg_q_jugar:"¡Quiero jugar!",
    llg_q_agua:"¡Uf, qué cansado! Tengo sed.", llg_q_fruta:"¡Tengo hambre! Quiero una fruta.", llg_q_bano:"¡Hora del baño!",
    llg_q_pijama:"¡Ahora el pijama!", llg_q_cuento:"¡Léeme un cuento, por favor!", llg_q_almohada:"¡Tengo sueño! ¿Dónde está mi almohada?",
    llg_s_desayuno:"¡Ñam! ¡Qué rico el cereal!", llg_s_dientes:"¡Cepillo, cepillo! ¡Dientes limpios!", llg_s_jugar:"¡Qué divertido jugar a la pelota!",
    llg_s_agua:"¡Glu, glu! ¡Qué rica el agua!", llg_s_fruta:"¡Ñam! ¡Qué rica la manzana!", llg_s_bano:"¡Splash! ¡Qué rico el baño con el patito!",
    llg_s_pijama:"¡Qué suavecito mi pijama!", llg_s_cuento:"¡Qué lindo cuento!", llg_s_almohada:"¡Qué cómoda mi almohada!",
  };
  // "¡Jiji, la pelota no sirve para dormir!": solo las combinaciones que pueden salir en PASOS_DIA
  const NOMBRE = { peineta:"la peineta", mochila:"la mochila", pelota:"la pelota", balde:"el balde", cepillo:"el cepillo",
    almohada:"la almohada", pijama:"el pijama", cereal:"el cereal" };
  const VERBO = { desayunar:"desayunar", dientes:"lavarse los dientes", jugar:"jugar", tomar:"tomar agua", comer:"comer",
    banarse:"bañarse", dormir:"dormir", leer:"leer un cuento" };
  Object.values(PASOS_DIA).forEach(p=>p.otros.forEach(o=>g[`llg_j_${o}_${p.verbo}`]=`¡Jiji, ${NOMBRE[o]} no sirve para ${VERBO[p.verbo]}!`));
  const vel={}; Object.keys(g).forEach(k=>vel[k]=1.12);
  registrarFrases({ ...n, ...g }, vel);
})();

// ---------- progreso ----------
// prog.llu1 / llu2 / llu3 = niveles completados de cada mundo (0..3). Terminar un mundo abre el siguiente.
const lluHechos = i=>prog[MUNDOS_LLU[i].id]||0;
const lluAbierto = i=>i===0 || prog._abiertos || lluHechos(i-1)>=3;

// ---------- mapa de mundos ----------
function lluMapa(nuevo){
  const box=$("lluMundos"); box.innerHTML="";
  MUNDOS_LLU.forEach((W,i)=>{
    const b=document.createElement("button"), ab=lluAbierto(i), s=lluHechos(i);
    b.className="llu-mundo"+(ab?"":" locked")+(i===nuevo?" nuevo":""); b.style.setProperty("--c",W.color); b.setAttribute("aria-label",W.nombre);
    b.innerHTML=`<img src="${lluImg(W.icono)}" alt=""><div class="llu-est">${"⭐".repeat(s)}${"☆".repeat(3-s)}</div><span class="lbl">${W.nombre}</span>`;
    b.onclick=()=>{ if(!lluAbierto(i)){ sfx.boing(); say("bloqueado"); return } sfx.tap(); lluIniciar(i, s>=3?0:s) };
    box.appendChild(b);
  });
  show("lluMapa");
  if(nuevo!=null) setTimeout(()=>say("llu_nuevo_mundo"),400);
}
$("lluMapaBack").onclick=()=>{ sfx.tap(); callar(); irAlMenu() };

// ---------- escena (común) ----------
let lluEst=null;
const lluSigue = e=>lluEst===e;          // si sale del juego, se corta todo lo que estaba esperando

function lluCielo(c, nublado){ $("lluvia").dataset.cielo=c; lluNublado(nublado||0) }
function lluNublado(f){ $("lluNublado").style.opacity=f }
// Sol: en la merienda crece con cada comida; en la mañana sube desde abajo.
function lluSol(f){
  const s=$("lluSol"), c=$("lluvia").dataset.cielo;
  s.style.opacity = c==="noche"||c==="lluvia" ? 0 : c==="manana" ? 1 : .3+.7*f;
  s.style.transform = c==="manana" ? `translateY(${(1-f)*28}cqw) scale(${.8+.2*f})` : `scale(${.55+.45*f})`;
}
function lluEstrellas(n){
  const box=$("lluEstrellas");
  for(let i=0;i<n;i++){ const s=document.createElement("i"), t=.5+Math.random()*.8;
    s.style.cssText=`left:${3+Math.random()*94}%;top:${2+Math.random()*50}%;width:${t}cqw;height:${t}cqw;animation-delay:${i*.4}s,${Math.random()*2}s`;
    box.appendChild(s) }
}
// Un personaje en la escena (Gruñi o un amigo): imagen, lluvia debajo y globito de lo que pide. x, y, ancho en %.
function lluNube(x,ancho,y){
  const d=document.createElement("div"); d.className="llu-nube"; d.style.cssText=`left:${x}%;top:${y}%;width:${ancho}%`;
  const gotas=Array.from({length:16},()=>`<i style="left:${Math.random()*96}%;animation-delay:${-Math.random()}s;animation-duration:${.7+Math.random()*.4}s"></i>`).join("");
  d.innerHTML=`<div class="llu-gotas">${gotas}</div><img alt=""><div class="llu-globo"><img alt=""><div class="mancha"></div></div>`;
  $("lluEscena").appendChild(d); return d;
}
function lluPose(n,p){ const img=n.querySelector(":scope>img"), src=lluImg("gruni-"+p); if(!img.src.endsWith(src)) img.src=src; n.dataset.pose=p }
function lluLlueve(n,f){ n.querySelector(".llu-gotas").style.opacity=f }
// globito: con la imagen de un objeto (id) o con una mancha de color (css). Sin nada, se esconde.
function lluGlobo(n,id,css){
  const g=n.querySelector(".llu-globo"), im=g.querySelector("img"), m=g.querySelector(".mancha");
  g.classList.remove("on"); if(!id&&!css) return;
  im.style.display=id?"":"none"; if(id) im.src=lluImg(LLU_OBJ[id].img);
  m.style.display=css?"":"none"; if(css) m.style.background=css;
  void g.offsetWidth; g.classList.add("on");
}
function lluSalta(el,clase){ el.classList.remove(clase); void el.offsetWidth; el.classList.add(clase) }
function lluLuces(total,n){
  const box=$("lluLuces");
  if(box.children.length!==total){ box.innerHTML=""; for(let i=0;i<total;i++){ const d=document.createElement("div"); d.className="col-luz"; box.appendChild(d) } }
  [...box.children].forEach((d,i)=>d.classList.toggle("on",i<n));
}

// Centro y tamaño de un elemento en coordenadas del escenario (sirve aunque el teléfono esté vertical y el juego girado)
function enJuego(el){
  const st=$("stage"), r=el.getBoundingClientRect(), s=st.getBoundingClientRect();
  const [x,y]=aJuego(r.left+r.width/2-(s.left+s.width/2), r.top+r.height/2-(s.top+s.height/2));
  return { x:x+st.clientWidth/2, y:y+st.clientHeight/2, w:el.offsetWidth, h:el.offsetHeight };
}
// efectos que suben desde un personaje: corazones, notas, brillos
function lluChispas(el,emoji,n=6){
  const c=enJuego(el);
  for(let i=0;i<n;i++){ const s=document.createElement("span"); s.className="llu-chispa"; s.textContent=emoji;
    s.style.cssText=`left:${c.x+(Math.random()-.5)*c.w*.7}px;top:${c.y-c.h*(.1+Math.random()*.3)}px;animation-delay:${i*.1}s`;
    $("lluCapa").appendChild(s); setTimeout(()=>s.remove(),2400) }
}
function lluGloboSube(n){
  const c=enJuego(n), im=document.createElement("img"); im.src=lluImg("regalo-globo"); im.className="llu-sube";
  im.style.cssText=`left:${c.x-c.w*.1}px;top:${c.y-c.h*.45}px;width:${c.w*.2}px`;
  $("lluCapa").appendChild(im); setTimeout(()=>im.remove(),3200);
}
const lluMelodia = ()=>[784,880,988,1175,988,1319].forEach((f,i)=>tone(f,.32,"triangle",i*.17,.13));

// ---------- bandeja: tocar o arrastrar ----------
// ops = [{id, ok}] ; ok marca cuál brilla como pista
function lluBandeja(ops){
  const e=lluEst; e.opciones=ops; e.marca=null;
  const box=$("lluBandeja"); box.innerHTML="";
  ops.forEach((o,i)=>{ const b=document.createElement("button"); b.className="llu-obj"; b.style.animationDelay=(i*.08)+"s";
    b.setAttribute("aria-label",o.id); b.innerHTML=`<img src="${lluImg(LLU_OBJ[o.id].img)}" alt="">`; lluArrastre(b,o); box.appendChild(b) });
}
function lluArrastre(b,o){
  let ini=null;
  const volver=()=>{ b.style.transition="transform .25s"; b.style.transform=""; setTimeout(()=>{ b.style.transition=""; b.classList.remove("arrastra") },260) };
  b.onpointerdown=ev=>{ ev.preventDefault(); const e=lluEst; if(!e||e.ocupado||ini) return; actx();
    ini={ x:ev.clientX, y:ev.clientY, id:ev.pointerId, mov:false, gy:0 }; try{ b.setPointerCapture(ev.pointerId) }catch(_){}
    b.classList.add("agarra"); lluPista.tocar() };
  b.onpointermove=ev=>{ if(!ini||ev.pointerId!==ini.id) return;
    const dx=ev.clientX-ini.x, dy=ev.clientY-ini.y; if(!ini.mov&&Math.hypot(dx,dy)<14) return;
    ini.mov=true; const [gx,gy]=aJuego(dx,dy); ini.gy=gy;
    b.classList.add("arrastra"); b.style.transform=`translate(${gx}px,${gy}px) scale(1.12)` };
  b.onpointerup=ev=>{ if(!ini||ev.pointerId!==ini.id) return; const t=ini; ini=null; b.classList.remove("agarra");
    const e=lluEst; if(!e||e.ocupado){ volver(); return }
    if(!t.mov) return lluDar(o,b,null);                                   // un toque: va al que corresponde
    const d=e.destinos.find(d=>{ const r=d.el.getBoundingClientRect(), m=r.width*.15;
      return ev.clientX>r.left-m&&ev.clientX<r.right+m&&ev.clientY>r.top-m&&ev.clientY<r.bottom+m });
    if(d||t.gy<-40) return lluDar(o,b,d||null);                           // generoso: si lo subió, también vale
    volver() };
  b.onpointercancel=()=>{ ini=null; b.classList.remove("agarra"); volver() };
}
function lluDar(o,b,d){ const e=lluEst; if(!e||e.ocupado) return; lluPista.tocar(); MOTORES_LLU[e.W.motor].dar(e,o,b,d) }
// El objeto vuela desde la bandeja (o desde donde lo soltó) hasta el destino
function lluVuela(desde,hasta,escala=.3){
  const a=enJuego(desde), z=enJuego(hasta), img=desde.querySelector("img"), w=img.offsetWidth, h=img.offsetHeight;
  const im=document.createElement("img"); im.src=img.src; im.className="llu-vuela";
  im.style.cssText=`left:${a.x-w/2}px;top:${a.y-h/2}px;width:${w}px;height:${h}px`; $("lluCapa").appendChild(im);
  desde.style.transform=""; desde.classList.remove("arrastra","brilla","tiembla"); desde.classList.add("dado");
  sfx.whoosh(450);
  const dx=z.x-a.x, dy=z.y-a.y;
  const an=im.animate([{transform:"none"},{transform:`translate(${dx*.5}px,${dy*.5-40}px) scale(1.05)`,offset:.45},
    {transform:`translate(${dx}px,${dy}px) scale(${escala})`,opacity:.5}],{duration:560,easing:"ease-in-out"});
  return new Promise(r=>{ const fin=()=>{ im.remove(); desde.classList.remove("dado"); r() }; an.onfinish=fin; setTimeout(fin,900) });
}
// No era eso: vuelve a su lugar, se sacude y suena el "uy"
function lluNo(b){ b.style.transform=""; b.classList.remove("arrastra"); lluSalta(b,"sacude"); sfx.uy(); lluPista.fallo() }
function lluLimpiarMarcas(){ [...$("lluBandeja").children].forEach(b=>b.classList.remove("brilla","tiembla")); const l=lluEst&&lluEst.lampara; if(l) l.classList.remove("brilla") }

// ---------- pista ----------
const lluPista = crearPista({ ...LLU_CFG.pista,
  animar(){ const e=lluEst; if(!e||e.ocupado||!$("lluvia").classList.contains("on")) return; lluMarcar(2); decir(e.repetir) },
  mostrar(n){ const e=lluEst; if(e&&!e.ocupado) lluMarcar(n) } });
function lluMarcar(n){
  const e=lluEst;
  if(e.lampara&&e.esperaLampara){ e.lampara.classList.add("brilla"); return }
  if(e.marca==null){ const oks=e.opciones.map((o,i)=>o.ok?i:-1).filter(i=>i>=0); e.marca=oks.length?shuffle(oks)[0]:-1 }   // si todos sirven, brilla uno
  const el=$("lluBandeja").children[e.marca]; if(!el) return;
  if(n===1) el.classList.add("tiembla"); else { el.classList.remove("tiembla"); el.classList.add("brilla") }
}

// ---------- motores ----------
const MOTORES_LLU = {
  // Mundo 1: cada regalo avanza a la nube un estado (triste -> sorprendido -> riendo -> feliz con arcoíris) y baja la lluvia
  alegrar: {
    iniciar(e){
      const nv=e.nv, k=nv.nubes||1;
      lluCielo("lluvia",.55);
      e.nubes=(k===1?[[36,28]]:[[11,25],[59,25]]).map(([x,w])=>({ el:lluNube(x,w,4), dados:0, feliz:false }));
      e.nubes.forEach(n=>{ lluPose(n.el,"triste"); lluLlueve(n.el,1) });
      e.destinos=e.nubes.map(n=>({ el:n.el, nube:n }));
      e.meta=k*nv.regalos; e.hechos=0; e.pedido=null; e.repetir="llu_anima_regalo";
      lluLuces(e.meta,0); this.bandeja(e);
      decir(k>1?"llu_m1_dos":["llu_m1_intro","llu_regalo"]); lluPista.reiniciar();
    },
    bandeja(e){ lluBandeja(shuffle(REGALOS).map(id=>({ id, ok:!e.pedido||id===e.pedido }))) },
    async dar(e,o,b,d){
      const n=d&&d.nube&&!d.nube.feliz ? d.nube : e.nubes.find(x=>!x.feliz);   // a una nube feliz no: va a la triste
      if(e.pedido&&o.id!==e.pedido){ lluNo(b); decir(`llg_no_${e.pedido}`); return }
      e.ocupado=true; lluPista.parar(); lluLimpiarMarcas();
      await lluVuela(b,n.el); if(!lluSigue(e)) return;
      if(e.pedido){ e.pedido=null; lluGlobo(n.el) }
      n.dados++; e.hechos++; lluLuces(e.meta,e.hechos); sfx.luz(e.hechos);
      const tot=e.nv.regalos;
      lluPose(n.el, n.dados>=tot?"arcoiris":["triste","sorprendido","riendo"][Math.min(n.dados,2)]);
      lluLlueve(n.el,1-n.dados/tot); lluNublado(.55*(1-e.hechos/e.meta));
      this.reaccion(o.id,n.el);
      await decir(`llg_r_${o.id}`); if(!lluSigue(e)) return;
      if(n.dados>=tot){ n.feliz=true; lluSalta(n.el,"contento");
        if(e.nubes.every(x=>x.feliz)) return this.fin(e);
        await decir("llu_otra_nube"); if(!lluSigue(e)) return }
      if(e.nv.especial&&e.hechos===1){         // nivel 2: el segundo regalo lo pide Gruñi
        e.pedido=shuffle(REGALOS)[0]; lluGlobo(n.el,e.pedido); e.repetir=`llg_pide_${e.pedido}`; decir(e.repetir);
      } else e.repetir="llu_anima_regalo";
      this.bandeja(e); e.ocupado=false; lluPista.reiniciar();
    },
    // la reacción de cada regalo
    reaccion(id,n){
      if(id==="pluma") lluSalta(n,"cosquillas");
      if(id==="globo") lluGloboSube(n);
      if(id==="flor") lluChispas(n,"❤️",7);
      if(id==="nota"){ lluMelodia(); lluChispas(n,"🎵",5) }
      if(id==="caramelo"){ lluSalta(n,"nam"); sfx.pop(); setTimeout(()=>sfx.pop(),250) }
    },
    async fin(e){
      e.ocupado=true; $("lluArco").classList.add("on"); lluNublado(0); sfx.win(); confetti();
      await decir(e.nubes.length>1?"llu_m1_fin2":"llu_m1_fin"); if(lluSigue(e)) lluNivelListo(e);
    },
  },

  // Mundo 2: comida de todos los días -> come feliz, brilla y sale el sol (cuenta).
  // De vez en cuando -> la primera le encanta (no cuenta); 2 seguidas -> le duele la guatita y caen gotitas,
  // y entonces solo agua o fruta lo alivian. Nunca se dice "mala" ni "prohibida": el dolor es suave y siempre se arregla.
  merienda: {
    iniciar(e){
      const nv=e.nv; e.hechos=0; e.dulces=0; e.guatita=false; e.previos=[];
      lluCielo("merienda", nv.modo==="picnic"?0:.35);
      if(nv.modo==="picnic") return this.picnicIniciar(e);
      e.nube=lluNube(nv.modo==="plato"?20:36,28,4); lluPose(e.nube,"sorprendido"); lluLlueve(e.nube,0);
      e.destinos=[{ el:e.nube }];
      if(nv.modo==="plato"){ e.plato=document.createElement("div"); e.plato.className="llu-plato"; e.plato.innerHTML="<i></i><i></i><i></i>";
        $("lluEscena").appendChild(e.plato); e.destinos.push({ el:e.plato }) }
      e.meta=nv.meta; lluLuces(e.meta,0); lluSol(0); e.repetir="llu_anima_comida";
      decir(nv.modo==="plato"?"llu_m2_plato":"llu_m2_intro");
      this.ronda(e);
    },
    // opciones nuevas en cada ronda, sin repetir las de la anterior
    ronda(e){
      const libres=l=>{ const x=l.filter(id=>!e.previos.includes(id)); return shuffle(x.length?x:l) };
      let ids;
      if(e.nv.modo==="elegir") ids = e.guatita ? [libres(DIARIO.filter(k=>LLU_OBJ[k].alivia))[0], libres(DULCE)[0]] : [libres(DIARIO)[0], libres(DULCE)[0]];
      else { const d = e.guatita ? ["agua", libres(["manzana","platano","uvas"])[0], libres(DIARIO.filter(k=>!LLU_OBJ[k].alivia))[0]] : libres(DIARIO).slice(0,3);
        ids = [...d, ...libres(DULCE).slice(0,2)] }
      e.previos=ids;
      lluBandeja(shuffle(ids).map(id=>({ id, ok: e.guatita ? !!LLU_OBJ[id].alivia : LLU_OBJ[id].tipo==="diario" })));
      lluPista.reiniciar();
    },
    async dar(e,o,b,d){
      if(e.nv.modo==="picnic") return this.picnicDar(e,o,b);
      const ob=LLU_OBJ[o.id];
      if(e.guatita&&!ob.alivia){ lluNo(b); decir("llg_guatita_no"); return }
      e.ocupado=true; lluPista.parar(); lluLimpiarMarcas();
      const guatita = ob.tipo==="dulce" && e.dulces>=1;                     // la segunda de vez en cuando seguida
      const cuenta = ob.tipo==="diario";
      const hueco = e.plato && cuenta ? e.plato.children[e.hechos] : null;   // en el plato solo va lo que cuenta
      await lluVuela(b, hueco||e.nube, hueco?.7:.3); if(!lluSigue(e)) return;
      if(hueco) hueco.innerHTML=`<img src="${lluImg(ob.img)}" alt="">`;
      let voz;
      if(guatita){ e.guatita=true; e.dulces=0; lluPose(e.nube,"guatita"); lluLlueve(e.nube,.5); lluNublado(.35); lluSalta(e.nube,"nam");
        voz="llg_guatita"; e.repetir="llg_guatita" }
      else if(e.guatita){ e.guatita=false; lluPose(e.nube,"comiendo"); lluLlueve(e.nube,0); voz="llg_mejor"; e.repetir="llu_anima_comida" }
      else { e.dulces = ob.tipo==="dulce" ? e.dulces+1 : 0; lluPose(e.nube,"comiendo"); lluSalta(e.nube,"nam");
        voz = cuenta ? `llg_come_${o.id}` : `llg_dulce_${o.id}` }
      if(cuenta){ e.hechos++; lluLuces(e.meta,e.hechos); sfx.luz(e.hechos); lluSol(e.hechos/e.meta); lluNublado(.35*(1-e.hechos/e.meta));
        lluChispas(e.nube,"✨",5); lluSalta(e.nube,"brillo") }
      await decir(voz); if(!lluSigue(e)) return;
      if(e.hechos>=e.meta) return this.fin(e);
      if(!e.guatita) lluPose(e.nube,"riendo");
      e.ocupado=false; this.ronda(e);
    },
    async fin(e){
      e.ocupado=true;
      if(e.plato){ lluPose(e.nube,"comiendo"); lluSalta(e.nube,"nam"); await decir("llg_plato"); if(!lluSigue(e)) return;
        [...e.plato.children].forEach(h=>h.innerHTML="") }
      lluPose(e.nube,"sol"); lluSol(1); lluNublado(0); sfx.win(); confetti();
      await decir("llg_m2_fin"); if(lluSigue(e)) lluNivelListo(e);
    },
    picnicIniciar(e){
      e.amigos=["maxi","rex","bip","gruni"].map((id,i)=>{ const el=lluNube(6+i*23.5,17,24); el.classList.add("amigo",id);
        el.querySelector(":scope>img").src=PICNIC[id].img; return { id, el } });
      e.destinos=e.amigos.map(a=>({ el:a.el }));
      e.pedidos=shuffle(Object.keys(PICNIC)); e.meta=e.pedidos.length; lluLuces(e.meta,0); lluSol(.4);
      this.picnicRonda(e,true);
    },
    picnicRonda(e,primera){
      const q=e.pedidos[e.hechos], P=PICNIC[q], a=e.amigos.find(x=>x.id===q); e.quien=q;
      e.amigos.forEach(x=>lluGlobo(x.el)); lluGlobo(a.el,null,P.css);
      const otros=shuffle(PICNIC_COLORES.filter(x=>x!==P.comida)).slice(0,2);
      lluBandeja(shuffle([P.comida,...otros]).map(id=>({ id, ok:id===P.comida })));
      e.repetir=`llu_pic_${q}`; decir(primera?["llu_m2_picnic",e.repetir]:e.repetir); lluPista.reiniciar();
    },
    async picnicDar(e,o,b){
      const P=PICNIC[e.quien];
      if(o.id!==P.comida){ lluNo(b); decir(`llu_picno_${e.quien}`); return }
      e.ocupado=true; lluPista.parar(); lluLimpiarMarcas();
      const a=e.amigos.find(x=>x.id===e.quien);
      await lluVuela(b,a.el); if(!lluSigue(e)) return;
      lluGlobo(a.el); lluSalta(a.el,"contento"); lluChispas(a.el,"✨",5);
      e.hechos++; lluLuces(e.meta,e.hechos); sfx.luz(e.hechos); lluSol(.4+.6*e.hechos/e.meta);
      await decir(`llu_picsi_${e.quien}`); if(!lluSigue(e)) return;
      if(e.hechos<e.meta){ e.ocupado=false; return this.picnicRonda(e,false) }
      e.amigos.find(x=>x.id==="gruni").el.querySelector(":scope>img").src=lluImg("gruni-sol");
      e.amigos.forEach(x=>lluSalta(x.el,"contento")); sfx.win(); confetti();
      await decir("llg_picnic_fin"); if(lluSigue(e)) lluNivelListo(e);
    },
  },

  // Mundo 3: Gruñi muestra en un globito lo que necesita y el niño elige entre 3 cosas.
  // Si no sirve, Gruñi pone cara chistosa ("¡Jiji, la pelota no sirve para dormir!"). La noche es tranquila.
  dia: {
    iniciar(e){
      const nv=e.nv; e.paso=0; e.hechos=0; e.meta=nv.pasos.length;
      lluCielo(nv.escena,0); lluSol(nv.escena==="manana"?0:1);
      e.nube=lluNube(30,28,5); lluPose(e.nube,nv.inicio); lluLlueve(e.nube,0); e.pose=nv.inicio;
      e.destinos=[{ el:e.nube }]; lluLuces(e.meta,0);
      if(nv.escena==="noche"){ lluEstrellas(5);
        e.lampara=document.createElement("button"); e.lampara.className="llu-lampara"; e.lampara.setAttribute("aria-label","lámpara");
        e.lampara.innerHTML=`<img src="${lluImg("noche-lampara")}" alt="">`;
        e.lampara.onpointerdown=ev=>{ ev.preventDefault(); this.apagar(e) }; $("lluEscena").appendChild(e.lampara) }
      this.ronda(e,true);
    },
    ronda(e,primera){
      const k=e.nv.pasos[e.paso], P=PASOS_DIA[k];
      lluGlobo(e.nube,P.ok);
      lluBandeja(shuffle([P.ok,...shuffle(P.otros).slice(0,2)]).map(id=>({ id, ok:id===P.ok })));
      e.repetir=`llg_q_${k}`; decir(primera?[`llu_m3_${e.nv.escena}`,e.repetir]:e.repetir); lluPista.reiniciar();
    },
    async dar(e,o,b){
      const k=e.nv.pasos[e.paso], P=PASOS_DIA[k];
      if(o.id!==P.ok){                         // cara chistosa y vuelve a como estaba
        lluNo(b); lluPose(e.nube,"sorprendido"); lluSalta(e.nube,"cosquillas");
        const t=e.chiste=(e.chiste||0)+1; setTimeout(()=>{ if(lluSigue(e)&&e.chiste===t&&!e.ocupado) lluPose(e.nube,e.pose) },1600);
        decir(`llg_j_${o.id}_${P.verbo}`); return;
      }
      e.ocupado=true; lluPista.parar(); lluLimpiarMarcas();
      await lluVuela(b,e.nube); if(!lluSigue(e)) return;
      lluGlobo(e.nube); e.pose=P.pose; lluPose(e.nube,P.pose); lluSalta(e.nube,"contento");
      const noche=e.nv.escena==="noche";
      if(noche) lluEstrellas(3); else lluChispas(e.nube,"✨",5);
      e.hechos++; lluLuces(e.meta,e.hechos); sfx.luz(e.hechos);
      if(e.nv.escena==="manana") lluSol(e.hechos/e.meta*.6);
      await decir(`llg_s_${k}`); if(!lluSigue(e)) return;
      e.paso++;
      if(e.paso<e.meta){ e.ocupado=false; return this.ronda(e,false) }
      if(noche){                               // falta apagar la lámpara
        $("lluBandeja").innerHTML=""; e.opciones=[]; e.esperaLampara=true; e.ocupado=false; e.repetir="llu_lampara";
        decir("llu_lampara"); lluPista.reiniciar(); return;
      }
      if(e.nv.escena==="manana"){ lluSol(1); lluPose(e.nube,"riendo") } else lluPose(e.nube,"sol");
      sfx.win(); confetti();
      await decir(`llu_m3_f_${e.nv.escena}`); if(lluSigue(e)) lluNivelListo(e);
    },
    // final de la noche: sin confeti; se apaga la lámpara, Gruñi se duerme y aparecen estrellas de a poco
    async apagar(e){
      if(!lluSigue(e)) return;
      if(!e.esperaLampara){ sfx.tap(); lluSalta(e.lampara,"sacude"); return }
      e.esperaLampara=false; e.ocupado=true; lluPista.parar(); lluLimpiarMarcas(); callar();
      e.lampara.classList.add("apagada"); $("lluvia").classList.add("apagada"); tone(392,.6,"sine",0,.08); tone(330,.9,"sine",.3,.07);
      lluPose(e.nube,"durmiendo"); lluEstrellas(16);
      await espera(1200); if(!lluSigue(e)) return;
      await decir("llu_m3_fin"); if(!lluSigue(e)) return;
      await espera(1800); if(lluSigue(e)) lluNivelListo(e);
    },
  },
};

// ---------- niveles ----------
function lluIniciar(m,n){
  lluPista.parar(); callar();
  const W=MUNDOS_LLU[m], nv=W.niveles[n];
  lluEst={ m, n, W, nv, ocupado:false, opciones:[], destinos:[], repetir:null };
  ["lluEscena","lluCapa","lluBandeja","lluEstrellas","lluLuces"].forEach(id=>$(id).innerHTML="");
  $("lluArco").classList.remove("on"); $("lluvia").classList.remove("apagada");
  musicaSuave(!!nv.tranquilo);
  show("lluvia"); precargar(W.video);
  MOTORES_LLU[W.motor].iniciar(lluEst);
}
// Nivel terminado: guarda, y sigue con el próximo nivel o, si era el último del mundo, su video y vuelta al mapa
async function lluNivelListo(e){
  e.ocupado=true; lluPista.parar();
  const antes=lluHechos(e.m); prog[e.W.id]=Math.max(antes,e.n+1); save();
  if(e.n+1<e.W.niveles.length){ await espera(900); if(lluSigue(e)) lluIniciar(e.m,e.n+1); return }
  const nuevo = antes<3 && e.m+1<MUNDOS_LLU.length ? e.m+1 : null;       // primera vez que termina este mundo
  playVideo(e.W.video, ()=>{ if(lluSigue(e)){ lluSalir(); lluMapa(nuevo) } });
}
function lluSalir(){ lluPista.parar(); lluEst=null; callar(); musicaSuave(false) }
$("lluBack").onclick=()=>{ sfx.tap(); lluSalir(); lluMapa() };

registrarMinijuego({
  id:"lluvia", nombre:"¡Que no llueva!", icono:lluImg("gruni-arcoiris"), color:"#d9ccff", frase:"menu_lluvia",
  abrir(){
    MUNDOS_LLU.forEach(W=>precargar(lluImg(W.icono)));
    ["triste","sorprendido","riendo","arcoiris"].forEach(p=>precargar(lluImg("gruni-"+p))); REGALOS.forEach(id=>precargar(lluImg(LLU_OBJ[id].img)));
    lluMapa();
  },
  pausar(){ lluPista.parar() },
  reanudar(){ if(lluEst&&!lluEst.ocupado&&$("lluvia").classList.contains("on")) lluPista.reanudar() },
  progresoCambio(){ if($("lluMapa").classList.contains("on")) lluMapa() },
});
// modo prueba: ?llu=12 abre directo el mundo 1, nivel 2 (para revisar escenas sin jugar las anteriores)
(function(){ const m=location.search.match(/[?&]llu=(\d)(\d)/); if(m) addEventListener("load",()=>lluIniciar(+m[1]-1,+m[2]-1)) })();
