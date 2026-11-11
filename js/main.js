// Arranque: pantalla de inicio, service worker y modos de prueba.
// ¡Jugar! abre el menú de minijuegos (si hay uno solo, lo abre directo).
$("play").onclick=()=>{ actx(); sfx.tap(); goFull(); precargarVoces(); musicaIniciar(); irAlMenu() };
$("menuHome").onclick=()=>{ sfx.tap(); callar(); show("home") };

if("serviceWorker" in navigator){ try{ navigator.serviceWorker.register("sw.js").catch(()=>{}) }catch(e){} }
// modo prueba: ?debug muestra los escondites
if(location.search.includes("debug")) document.head.insertAdjacentHTML("beforeend","<style>.spot{outline:3px dashed red;background:rgba(255,0,0,.15)}</style>");
// modo edición: ?editor abre el editor de escondites
if(/[?&]editor/.test(location.search)){ const s=document.createElement("script"); s.src="js/editor.js"; document.body.appendChild(s) }
