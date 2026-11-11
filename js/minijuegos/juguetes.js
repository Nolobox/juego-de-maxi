// Minijuego: ¿Dónde está el juguete? (Gruñi escondió los juguetes y hay que encontrarlos)
// Coordenadas de escondites en % del escenario (x, y, ancho, alto)
const WORLDS = [
 {id:"casa",  name:"Casa de Maxi", bg:"assets/bg_casa.webp", spots:[
   [2,65,28,30],[5,30,36,35],[41.5,14,17,45],[60,39,33,27],[64,72,22,25],[83,54,15,36]]},
 {id:"parque",name:"El parque", bg:"assets/bg_parque.webp", spots:[
   [1,48,24,35],[25,30,16,42],[37,48,21,32],[57,38,20,32],[64,68,29,22],[83,44,15,31]]},
 {id:"valle", name:"Valle de Rex", bg:"assets/bg_valle.webp", spots:[
   [0,20,31,62],[27,46,18,22],[30,68,20,16],[53,50,17,30],[78,47,22,26],[88,72,12,20]]},
 {id:"playa", name:"La playa", bg:"assets/bg_playa.webp", spots:[
   [7,30,28,40],[24,63,14,25],[40,26,21,49],[71,50,18,20],[59,66,16,25],[80,64,15,27]]},
 {id:"taller",name:"Taller de Bip", bg:"assets/bg_taller.webp", spots:[
   [0,45,18,50],[21,58,14,28],[41,64,18,18],[63,53,19,32],[78,67,22,28],[55,14,14,26]]},
];
const TOYS = [["pelota","la pelota"],["osito","el osito"],["autito","el autito"],["cubo","el cubo"],["trompo","el trompo"],
  ["patito","el patito"],["dino","el dinosaurio"],["cohete","el cohete"],["tambor","el tambor"],["globo","el globo"]];
const LEVEL_TOYS = [3,4,5];

// niveles completados de un mundo (0..3) y si está abierto
const stars = id => prog[id]||0;           // niveles completados 0..3
const unlocked = i => i===0 || prog._abiertos || stars(WORLDS[i-1].id)>=3;

// ---------- frases ----------
registrarFrases({
  intro:"¡Gruñi escondió los juguetes! ¿Me ayudas a encontrarlos?",
  nivel_tres:"¡Busca los tres juguetes que escondió Gruñi!",
  nivel_cuatro:"¡Ahora son cuatro los juguetes escondidos!",
  nivel_cinco:"¡Ahora son cinco los juguetes escondidos!",
  no_1:"Aquí no está.", no_2:"Mmm, aquí no hay nada.", no_3:"¡Busca en otro sitio!",
  pista:"¡Mira, algo brilla!",
  nivel_ok_1:"¡Muy bien! ¡Lo lograste!", nivel_ok_2:"¡Qué bien buscas! ¡Los encontraste todos!", nivel_ok_3:"¡Bravo! ¡Eres un gran buscador!",
  mundo_ok:"¡Encontraste todos los juguetes! ¡Gruñi está feliz!",
  bloqueado:"Primero vamos a terminar este otro mundo.",
  bip_hola:"¡Bip bip! ¡Hola, amigo!",
  gruni_risa:"¡Jijijí! ¡Jijijí! ¡Qué divertido!",
  gruni_cambio:"¡Uy! Gruñi cambió un juguete de lugar. ¿Viste dónde lo dejó?",
}, { gruni_risa:1.12 });   // a Gruñi lo subimos un poco para distinguirlo de Bip
TOYS.forEach(([k,n])=>addVar(`enc_${k}`,[`¡Encontraste ${n}!`,`¡Muy bien, ahí estaba ${n}!`,`¡Bravo, apareció ${n}!`]));
VARIANTES.nivel_ok=3; VARIANTES.no=3;
WORLDS.slice(1).forEach(W=>FRASES[`abre_${W.id}`]=`¡Se abrió ${W.name}, ya podemos entrar a jugar!`);

// ---------- mapa ----------
$("mapHome").onclick=()=>{ sfx.tap(); callar(); irAlMenu() };
$("gameBack").onclick=()=>{ sfx.tap(); pistaJ.parar(); cur=null; callar(); renderMap(); show("map") };

function renderMap(){
  const w=$("worlds"); w.innerHTML="";
  WORLDS.forEach((W,i)=>{
    const d=document.createElement("div"); d.className="world"+(unlocked(i)?"":" locked");
    const s=stars(W.id);
    d.innerHTML=`<img src="${W.bg}" alt=""><div class="stars">${"⭐".repeat(s)}${"☆".repeat(3-s)}</div><div class="lbl">${W.name}</div>`;
    d.onclick=()=>{ if(!unlocked(i)){ sfx.boing(); say("bloqueado"); return }
      sfx.tap(); startWorld(i, s>=3?0:s) };
    w.appendChild(d);
  });
  const m=document.createElement("div"); m.className="world mascot";
  m.innerHTML=`<img src="${PERSONAJES.bip.img}" alt="" style="object-fit:cover">`;
  m.onclick=()=>{ sfx.pop(); say("bip_hola") };
  w.appendChild(m);
}

// ---------- juego ----------
let cur=null;
// Pista: 15 s sin tocar -> la narradora anima a buscar; 2 toques vacíos -> brilla la zona; 4 -> brilla el escondite.
const pistaJ = crearPista({ animarMs:15000, suave:2, fuerte:4,
  animar(){ if(cur&&!cur.busy&&$("game").classList.contains("on")) say(Math.random()<.5?"anima_buscar":"anima_buscar_2") },
  mostrar(n){ if(!cur||cur.busy) return; const k=Object.keys(cur.hidden)[0]; if(k===undefined) return;
    if(n===1){ const [x,y]=centro(cur.wi,+k); quitarPistas(); const z=document.createElement("div"); z.className="zona-pista";
      z.style.left=x+"%"; z.style.top=y+"%"; $("spots").appendChild(z) }
    else { $("spots").children[k].classList.add("hint"); say("pista") } } });
function quitarPistas(){ document.querySelectorAll(".spot.hint").forEach(s=>s.classList.remove("hint")); document.querySelectorAll(".zona-pista").forEach(z=>z.remove()) }
// Gruñi descansa a la izquierda o a la derecha de la bandeja de juguetes, nunca encima (left en %, mide 13 %)
const lugarGruni=()=>Math.random()<.5 ? 8.5+Math.random()*10 : 67.5+Math.random()*11;

function startWorld(wi, level){
  const W=WORLDS[wi], n=LEVEL_TOYS[level];
  const toys=shuffle(TOYS).slice(0,n);
  const spotIdx=shuffle(W.spots.map((_,i)=>i));
  const hidden={}; toys.forEach((t,k)=>hidden[spotIdx[k]]=t);
  cur={wi,level,toys,hidden,found:0,busy:false,gruni:null,travesura:false};
  $("gbg").src=W.bg; $("lvl").textContent=`${W.name} · Nivel ${level+1}`;
  const tray=$("tray"); tray.innerHTML="";
  toys.forEach(t=>{ const s=document.createElement("div"); s.className="slot"; s.dataset.t=t[0]; s.innerHTML=`<img src="assets/t_${t[0]}.png" alt="">`; tray.appendChild(s) });
  const sp=$("spots"); sp.innerHTML="";
  W.spots.forEach((r,i)=>{ const d=document.createElement("div"); d.className="spot";
    Object.assign(d.style,{left:r[0]+"%",top:r[1]+"%",width:r[2]+"%",height:r[3]+"%"});
    d.onpointerdown=e=>{ e.preventDefault(); tapSpot(i,d) }; sp.appendChild(d) });
  // Gruñi flota arriba en los niveles 2 y 3; en el nivel 3 además cambia un juguete de escondite (gruniTravesura)
  if(level>0){ const g=document.createElement("img"); g.src=PERSONAJES.gruni.recorte; g.className="gruni";
    g.style.cssText+=`left:${lugarGruni()}%;top:4%`; sp.appendChild(g); cur.gruni=g }
  show("game"); quitarPistas(); pistaJ.reiniciar();
  precargar(videoPremio(level)); if(WORLDS[wi+1]) precargar(WORLDS[wi+1].bg);
  setTimeout(()=>say(["nivel_tres","nivel_cuatro","nivel_cinco"][level]),300);
}



function puff(x,y,ch){ const p=document.createElement("div"); p.className="puff"; p.textContent=ch;
  p.style.left=x+"%"; p.style.top=y+"%"; $("game").appendChild(p); setTimeout(()=>p.remove(),900) }

function tapSpot(i,el){
  if(!cur||cur.busy) return; actx();
  el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
  const r=WORLDS[cur.wi].spots[i], cx=r[0]+r[2]/2, cy=r[1]+r[3]/2;
  const t=cur.hidden[i];
  if(!t){ sfx.boing(); puff(cx-2,cy-4,["💨","🍃","✨"][Math.random()*3|0]); pistaJ.fallo();
    if(Math.random()<.4) say("no"); return }
  delete cur.hidden[i]; cur.busy=true; pistaJ.parar(); quitarPistas();
  sfx.pop(); puff(cx-2,cy-6,"⭐");
  const toy=document.createElement("img"); toy.src=`assets/t_${t[0]}.png`; toy.className="toy";
  toy.style.left=(cx-5.5)+"%"; toy.style.top=(cy-8)+"%"; $("game").appendChild(toy);
  const slot=[...$("tray").children].find(s=>s.dataset.t===t[0]);
  toy.animate([{transform:"translateY(40%) scale(0)"},{transform:"translateY(-60%) scale(1.25)",offset:.6},{transform:"translateY(-40%) scale(1)"}],{duration:650,easing:"cubic-bezier(.3,1.6,.5,1)",fill:"forwards"});
  say(`enc_${t[0]}`);
  setTimeout(()=>{
    const a=toy.getBoundingClientRect(), b=slot.getBoundingClientRect();
    const [dx,dy]=aJuego(b.left+b.width/2-(a.left+a.width/2), b.top+b.height/2-(a.top+a.height/2));   // por si el juego está girado
    toy.animate([{transform:"translateY(-40%) scale(1)"},{transform:`translateY(-40%) translate(${dx}px,${dy}px) scale(.35)`}],{duration:600,easing:"ease-in",fill:"forwards"}).onfinish=()=>{
      toy.remove(); slot.classList.add("got"); sfx.tap(); cur.found++; cur.busy=false; pistaJ.reiniciar();
      if(cur.found===cur.toys.length) levelDone();
      else if(cur.level===2 && cur.found===2 && !cur.travesura) gruniTravesura() };
  },1300);
}
// Video de premio de cada nivel (versiones comprimidas a 720p; los originales siguen en assets/)
const videoPremio = lv => ["assets/v_maxi_720.mp4","assets/v_rex_720.mp4","assets/v_gruni_720.mp4"][lv];

// ---------- Gruñi travieso (nivel 3) ----------
// Baja volando a un escondite con juguete, lo saca, se ríe y lo lleva a otro escondite vacío.
function centro(wi,i){ const r=WORLDS[wi].spots[i]; return [r[0]+r[2]/2, r[1]+r[3]/2] }
// mueve un elemento por una lista de puntos [x,y] en % del escenario; (ox,oy) = desfase del punto respecto a su esquina
function volar(el,pts,ms,ox,oy){
  const kf=pts.map(([x,y])=>({left:(x-ox)+"%",top:(y-oy)+"%"}));
  Object.assign(el.style,kf[kf.length-1]);
  return el.animate(kf,{duration:ms,easing:"ease-in-out"}).finished.catch(()=>{});
}
async function gruniTravesura(){
  const c=cur, g=c&&c.gruni; if(!g) return;
  const W=WORLDS[c.wi], llenos=Object.keys(c.hidden).map(Number);
  const vacios=W.spots.map((_,i)=>i).filter(i=>!(i in c.hidden));
  if(!llenos.length||!vacios.length) return;
  c.travesura=true; c.busy=true; pistaJ.parar(); quitarPistas();
  const vivo=()=>cur===c;                     // si el niño sale del nivel, se corta la escena
  await espera(500); if(!vivo()) return;
  const de=llenos[Math.random()*llenos.length|0], [x0,y0]=centro(c.wi,de);
  // destino: uno de los dos escondites vacíos más lejanos, para que el viaje se vea
  const dist=i=>{ const [x,y]=centro(c.wi,i); return (x-x0)**2+(y-y0)**2 };
  vacios.sort((p,q)=>dist(q)-dist(p));
  const a=vacios[Math.random()*Math.min(2,vacios.length)|0], [x1,y1]=centro(c.wi,a);
  const st=$("stage"), gw=g.offsetWidth/st.offsetWidth*100, gh=g.offsetHeight/st.offsetHeight*100;   // offset*: no cambian si está girado
  const gx=parseFloat(g.style.left)+gw/2, gy=parseFloat(g.style.top)+gh*.8;
  const spotEl=i=>$("spots").children[i], sacudir=el=>{ el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake") };
  // 1) baja hasta el escondite
  sfx.whoosh(900); await volar(g,[[gx,gy],[x0,y0-4]],900,gw/2,gh*.8); if(!vivo()) return;
  // 2) saca el juguete y se ríe
  sacudir(spotEl(de)); const t=c.hidden[de];
  const toy=document.createElement("img"); toy.src=`assets/t_${t[0]}.png`; toy.className="toy";
  Object.assign(toy.style,{left:(x0-5.5)+"%",top:(y0-8)+"%"}); $("game").appendChild(toy);
  toy.animate([{transform:"scale(0)"},{transform:"scale(1.15)",offset:.7},{transform:"scale(1)"}],{duration:350,easing:"ease-out"});
  sfx.pop(); const risa=say("gruni_risa");
  await espera(800); if(!vivo()) return toy.remove();
  // 3) vuela con el juguete, en curva, al otro escondite
  const alto=Math.max(6,Math.min(y0,y1)-22), medio=[(x0+x1)/2,alto];
  sfx.whoosh(1400);
  const balanceo=toy.animate([{rotate:"-12deg"},{rotate:"12deg"}],{duration:300,direction:"alternate",iterations:Infinity});
  await Promise.all([volar(g,[[x0,y0-4],medio,[x1,y1-4]],1400,gw/2,gh*.8), volar(toy,[[x0,y0],[medio[0],medio[1]+4],[x1,y1]],1400,5.5,8)]);
  balanceo.cancel(); if(!vivo()) return toy.remove();
  // 4) lo esconde ahí
  delete c.hidden[de]; c.hidden[a]=t;
  await toy.animate([{transform:"scale(1)"},{transform:"scale(1.2)",offset:.3},{transform:"scale(0)"}],{duration:400,easing:"ease-in",fill:"forwards"}).finished.catch(()=>{});
  toy.remove(); sacudir(spotEl(a)); puff(x1-2,y1-4,"💨"); sfx.boing();
  await risa; if(!vivo()) return;
  // 5) vuelve arriba y la narradora avisa
  sfx.whoosh(900); volar(g,[[x1,y1-4],[lugarGruni()+gw/2,4+gh*.8]],900,gw/2,gh*.8);
  c.busy=false; pistaJ.reiniciar(); say("gruni_cambio");
}

function levelDone(){
  pistaJ.parar(); quitarPistas(); const W=WORLDS[cur.wi]; const lv=cur.level;
  prog[W.id]=Math.max(stars(W.id),lv+1); save();
  sfx.win(); confetti();
  const worldDone = lv===2;
  setTimeout(()=>{
    say(worldDone?"mundo_ok":"nivel_ok");
    const v = videoPremio(lv);
    setTimeout(()=>playVideo(v,()=>{
      if(worldDone){ renderMap(); show("map");
        const nxt=WORLDS[cur.wi+1]; if(nxt) setTimeout(()=>say(`abre_${nxt.id}`),400) }
      else startWorld(cur.wi,lv+1) }),1600);
  },500);
}

// precarga: juguetes, Gruñi y el primer escenario (los demás se precargan al jugar y se ven en el mapa)
TOYS.forEach(t=>precargar(`assets/t_${t[0]}.png`)); precargar(PERSONAJES.gruni.recorte); precargar(WORLDS[0].bg);

registrarFrases({ menu_juguetes:"¡Vamos a buscar los juguetes!", anima_buscar:"¡Toca donde quieras para buscar!",
  anima_buscar_2:"¿Dónde estará? ¡Busca tocando, tú puedes!" });
registrarMinijuego({
  id:"juguetes", nombre:"¿Dónde está el juguete?", icono:PERSONAJES.maxi.img, iconoCubre:true, color:"#ffd166", frase:"menu_juguetes",
  abrir(){ say("intro"); renderMap(); show("map") },
  pausar(){ pistaJ.parar() },
  reanudar(){ if(cur&&!cur.busy&&$("game").classList.contains("on")) pistaJ.reanudar() },
  progresoCambio(){ renderMap() },
});
