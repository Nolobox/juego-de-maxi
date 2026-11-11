// Editor de escondites: abrir con ?editor
// Arrastra un rectángulo para moverlo, la esquina inferior derecha para cambiar su tamaño.
// Los cambios se guardan en localStorage ("dej_editor") y se usan al jugar mientras exista ?editor.
(function(){
  const KEY="dej_editor";
  const r1=v=>Math.round(v*2)/2;                  // redondeo a 0,5 %
  let saved={}; try{ saved=JSON.parse(localStorage.getItem(KEY)||"{}") }catch(e){}
  WORLDS.forEach(W=>{ W.spotsOriginal=W.spots.map(s=>s.slice()); if(saved[W.id]) W.spots=saved[W.id] });
  const guardar=()=>{ const o={}; WORLDS.forEach(W=>o[W.id]=W.spots); try{ localStorage.setItem(KEY,JSON.stringify(o)) }catch(e){} };

  document.head.insertAdjacentHTML("beforeend",`<style>
  #editor{background:#000;z-index:30}
  #editor .bg{opacity:1}
  #edLayer{position:absolute;inset:0}
  .edr{position:absolute;outline:3px solid #ff3b30;background:rgba(255,59,48,.18);cursor:move;touch-action:none}
  .edr.sel{outline-color:#ffd60a;background:rgba(255,214,10,.22)}
  .edr.chico{outline-style:dashed}
  .edr b{position:absolute;left:3px;top:1px;font:800 1.6vw system-ui;color:#fff;text-shadow:0 0 3px #000}
  .edr i{position:absolute;right:3px;bottom:1px;font:600 1.1vw system-ui;color:#fff;text-shadow:0 0 3px #000;font-style:normal}
  .edr .h{position:absolute;right:-1.2vw;bottom:-1.2vw;width:2.4vw;height:2.4vw;border-radius:50%;background:#ffd60a;border:2px solid #000;cursor:nwse-resize;touch-action:none}
  #edBar{position:absolute;left:0;right:0;top:0;display:flex;flex-wrap:wrap;gap:.5vw;padding:.6vw;background:rgba(0,0,0,.7);z-index:2;font:600 1.3vw system-ui}
  #edBar button{font:inherit;padding:.4vw .9vw;border-radius:.6vw;border:0;background:#eee;cursor:pointer}
  #edBar button.on{background:#ffd60a}
  #edBar .sp{flex:1}
  #edMsg{position:absolute;left:50%;bottom:3%;transform:translateX(-50%);background:#000c;color:#fff;padding:.5vw 1.2vw;border-radius:.6vw;font:600 1.4vw system-ui;z-index:2;display:none}
  </style>`);
  const sec=document.createElement("section"); sec.className="screen"; sec.id="editor";
  sec.innerHTML=`<img class="bg" id="edBg" alt=""><div id="edLayer"></div><div id="edBar"></div><div id="edMsg"></div>`;
  $("stage").appendChild(sec);

  let wi=0, sel=-1;
  const W=()=>WORLDS[wi];
  function msg(t){ const m=$("edMsg"); m.textContent=t; m.style.display="block"; clearTimeout(msg.t); msg.t=setTimeout(()=>m.style.display="none",2200) }
  async function copiar(txt){ try{ await navigator.clipboard.writeText(txt); msg("Copiado") }catch(e){ prompt("Copia este texto:",txt) } }
  const fmt=s=>"["+s.map(r=>"["+r.map(r1).join(",")+"]").join(",")+"]";

  function barra(){
    const b=$("edBar"); b.innerHTML="";
    const btn=(t,f,on)=>{ const e=document.createElement("button"); e.textContent=t; if(on) e.className="on"; e.onclick=f; b.appendChild(e); return e };
    WORLDS.forEach((w,i)=>btn(w.name,()=>{ wi=i; sel=-1; pintar() },i===wi));
    const s=document.createElement("span"); s.className="sp"; b.appendChild(s);
    btn("+ Escondite",()=>{ W().spots.push([40,40,15,20]); sel=W().spots.length-1; guardar(); pintar() });
    btn("Borrar",()=>{ if(sel<0) return msg("Toca un rectángulo primero"); W().spots.splice(sel,1); sel=-1; guardar(); pintar() });
    btn("Restaurar",()=>{ if(!confirm("¿Volver a los escondites originales de este mundo?")) return; W().spots=W().spotsOriginal.map(s=>s.slice()); sel=-1; guardar(); pintar() });
    btn("Probar",()=>{ sec.classList.remove("on"); startWorld(wi,2) });
    btn("Copiar mundo",()=>copiar(`spots:${fmt(W().spots)}`));
    btn("Copiar todo",()=>copiar(WORLDS.map(w=>`${w.id}: spots:${fmt(w.spots)}`).join("\n")));
  }

  function pintar(){
    barra(); $("edBg").src=W().bg;
    const L=$("edLayer"); L.innerHTML="";
    W().spots.forEach((r,i)=>{
      const d=document.createElement("div"); d.className="edr"+(i===sel?" sel":"")+(r[2]<10?" chico":"");
      Object.assign(d.style,{left:r[0]+"%",top:r[1]+"%",width:r[2]+"%",height:r[3]+"%"});
      d.innerHTML=`<b>${i+1}</b><i>${r1(r[2])}×${r1(r[3])}</i><div class="h"></div>`;
      d.onpointerdown=e=>arrastrar(e,i,e.target.classList.contains("h"));
      L.appendChild(d);
    });
    if(W().spots.length<5) msg(`Este mundo necesita al menos 5 escondites (tiene ${W().spots.length})`);
  }

  function arrastrar(e,i,resize){
    e.preventDefault(); e.stopPropagation(); sel=i;
    const box=$("edLayer").getBoundingClientRect(), r=W().spots[i], ini=r.slice(), x0=e.clientX, y0=e.clientY;
    const el=e.currentTarget; el.setPointerCapture(e.pointerId);
    [...$("edLayer").children].forEach((c,k)=>c.classList.toggle("sel",k===i));
    el.onpointermove=ev=>{
      const dx=(ev.clientX-x0)/box.width*100, dy=(ev.clientY-y0)/box.height*100;
      if(resize){ r[2]=Math.max(4,Math.min(100-r[0],ini[2]+dx)); r[3]=Math.max(4,Math.min(100-r[1],ini[3]+dy)) }
      else{ r[0]=Math.max(0,Math.min(100-r[2],ini[0]+dx)); r[1]=Math.max(0,Math.min(100-r[3],ini[1]+dy)) }
      Object.assign(el.style,{left:r[0]+"%",top:r[1]+"%",width:r[2]+"%",height:r[3]+"%"});
      el.querySelector("i").textContent=`${r1(r[2])}×${r1(r[3])}`; el.classList.toggle("chico",r[2]<10);
    };
    el.onpointerup=()=>{ el.onpointermove=el.onpointerup=null; for(let k=0;k<4;k++) r[k]=r1(r[k]); guardar() };
  }

  // Botón para volver al editor desde el juego
  const vuelta=document.createElement("button"); vuelta.className="round"; vuelta.textContent="✏️";
  vuelta.style.cssText="top:2%;right:9%;z-index:8"; vuelta.onclick=abrir; $("game").appendChild(vuelta);

  function abrir(){ clearTimeout(hintT); cur=null; show("editor"); pintar() }
  abrir();
})();
