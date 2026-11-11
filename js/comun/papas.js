// Rincón de los papás (compartido).
// Mantener presionada la esquina inferior izquierda 3 segundos. Un toque corto pasa al escondite de abajo.
(function(){
  const z=$("esquina"); let t=null;
  const soltar=()=>{ clearTimeout(t); t=null; z.classList.remove("cargando") };
  z.onpointerdown=e=>{
    e.preventDefault();
    z.style.pointerEvents="none"; const debajo=document.elementFromPoint(e.clientX,e.clientY); z.style.pointerEvents="";
    if(debajo&&debajo!==z&&debajo.onpointerdown) debajo.onpointerdown(e); else if(debajo&&debajo.click&&debajo!==z) debajo.click();
    z.classList.add("cargando"); t=setTimeout(()=>{ soltar(); abrirPapas() },3000);
  };
  z.onpointerup=z.onpointercancel=z.onpointerleave=soltar;
})();
// Diagnóstico de pantalla: muestra lo que informa el teléfono, para revisar problemas de giro o zoom
let diagT=null;
function pintarDiag(){
  const d=$("diag"); d.classList.toggle("on",!!cfg.diag); clearInterval(diagT); if(!cfg.diag) return;
  const f=()=>{ const vv=window.visualViewport, st=$("stage").getBoundingClientRect(), de=document.documentElement, r=n=>Math.round(n);
    d.textContent=[`ventana ${innerWidth}x${innerHeight}  vertical:${mqVertical.matches}`,
      vv?`visual ${r(vv.width)}x${r(vv.height)} zoom:${vv.scale.toFixed(2)} desp:${r(vv.offsetLeft)},${r(vv.offsetTop)}`:"visual -",
      `angulo ${anguloPantalla()} giro ${giro}  pantalla ${screen.width}x${screen.height}`,
      `escenario ${r(st.left)},${r(st.top)} ${r(st.width)}x${r(st.height)}`,
      `documento ${de.scrollWidth}x${de.scrollHeight} scroll ${r(scrollX)},${r(scrollY)}`,
      `pantalla activa: ${(document.querySelector(".screen.on")||{}).id||"-"}`].join(String.fromCharCode(10)) };
  f(); diagT=setInterval(f,500);
}
function pintarPapas(){
  $("pVol").value=Math.round(cfg.vol*100);
  $("pMus").textContent=cfg.musica?"Encendida":"Apagada"; $("pMus").className=cfg.musica?"verde":"";
  $("pAbrir").textContent=prog._abiertos?"Abiertos":"Abrir todos"; $("pAbrir").className=prog._abiertos?"verde":"";
  $("pReset").textContent="Reiniciar"; $("pReset").dataset.ok="";
  $("pDiag").textContent=cfg.diag?"Visible":"Oculto"; $("pDiag").className=cfg.diag?"verde":"";
}
function abrirPapas(){ pintarPapas(); $("papas").classList.add("on"); avisar("pausar") }
$("pVol").oninput=e=>{ cfg.vol=e.target.value/100; saveCfg(); if(ac) bus.master.gain.setTargetAtTime(cfg.vol,ac.currentTime,.05); $("video").volume=cfg.vol };
$("pVol").onchange=()=>sfx.tap();
$("pMus").onclick=()=>{ $("mute").onclick(); pintarPapas() };
$("pAbrir").onclick=()=>{ prog._abiertos=!prog._abiertos; save(); pintarPapas(); avisar("progresoCambio") };
$("pReset").onclick=()=>{ const b=$("pReset");
  if(!b.dataset.ok){ b.dataset.ok="1"; b.textContent="¿Seguro? Toca otra vez"; return }
  prog={}; save(); pintarPapas(); avisar("progresoCambio"); b.textContent="Listo, empezamos de cero" };
$("pDiag").onclick=()=>{ cfg.diag=!cfg.diag; saveCfg(); pintarPapas(); pintarDiag() };
pintarDiag();
$("pCerrar").onclick=()=>{ $("papas").classList.remove("on"); avisar("reanudar") };
