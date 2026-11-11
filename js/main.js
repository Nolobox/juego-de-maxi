// Arranque: pantalla de inicio, service worker y modos de prueba.
// Por ahora hay un solo minijuego; cuando haya más, ¡Jugar! abrirá un menú para elegir.
$("play").onclick=()=>{ actx(); sfx.tap(); goFull(); precargarVoces(); musicaIniciar(); MINIJUEGOS[0].abrir() };

if("serviceWorker" in navigator){ try{ navigator.serviceWorker.register("sw.js").catch(()=>{}) }catch(e){} }
// modo prueba: ?debug muestra los escondites
if(location.search.includes("debug")) document.head.insertAdjacentHTML("beforeend","<style>.spot{outline:3px dashed red;background:rgba(255,0,0,.15)}</style>");
// modo edición: ?editor abre el editor de escondites
if(/[?&]editor/.test(location.search)){ const s=document.createElement("script"); s.src="js/editor.js"; document.body.appendChild(s) }
