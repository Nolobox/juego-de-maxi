// Progreso y configuración guardados en el teléfono (compartidos por todos los minijuegos).
// prog: cada minijuego guarda lo suyo; el de los juguetes usa prog[<id del mundo>] = niveles completados.
let prog = {};
try{ prog = JSON.parse(localStorage.getItem("dej_prog")||"{}") }catch(e){}
function save(){ try{ localStorage.setItem("dej_prog",JSON.stringify(prog)) }catch(e){} }
// configuración: música encendida y volumen general (0..1)
let cfg = {musica:true, vol:1};
try{ Object.assign(cfg, JSON.parse(localStorage.getItem("dej_cfg")||"{}")) }catch(e){}
function saveCfg(){ try{ localStorage.setItem("dej_cfg",JSON.stringify(cfg)) }catch(e){} }
