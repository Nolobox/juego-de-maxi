# Juegos de Maxi — instrucciones para Claude Code

## Contexto
Juego web para un niño de **3 años**, para celular y tablet en horizontal. Estilo claymation (plastilina).
Está hecho en HTML, CSS y JavaScript puro, sin dependencias ni paso de build (scripts clásicos que comparten variables globales, cargados en orden desde `index.html`).
Los personajes, escenarios, juguetes y videos se generaron en Google Flow y están en `assets/`.

**Personajes:** Maxi (protagonista), Rex (bebé dinosaurio amigo), Bip (robot ayudante) y Gruñi (nube traviesa que esconde los juguetes, nunca da miedo).

**Menú principal:** ¡Jugar! abre un menú con un botón grande por minijuego (se arma solo con `registrarMinijuego`). Al tocar uno, dice su frase y lo abre.

### Minijuego 1: ¿Dónde está el juguete? (`js/minijuegos/juguetes.js`)
- Hay 5 mundos (casa, parque, valle, playa y taller) con 3 niveles cada uno, de 3, 4 y 5 juguetes.
- Los escondites son zonas táctiles definidas en `WORLDS[].spots` (en `js/minijuegos/juguetes.js`) como `[x, y, ancho, alto]`, en % del escenario 16:9.
- Los juguetes se reparten al azar. Al encontrar uno, salta, la voz lo nombra (una de 3 frases al azar) y vuela a la bandeja.
- **La pista se gana buscando** (`crearPista` en `nucleo.js`, compartida): esperar sin tocar no revela nada; a los 15 s la narradora solo anima a buscar. Con 2 toques vacíos brilla suave una zona amplia alrededor del juguete; con 4, brilla el escondite exacto. (Antes era por tiempo y el niño aprendió a esperar la luz.)
- En el nivel 3, al encontrar el segundo juguete, Gruñi baja volando, saca un juguete, se ríe y lo lleva a otro escondite.
- Gruñi descansa a la izquierda o a la derecha de la bandeja (`lugarGruni`), nunca encima.
- Videos de premio (versiones `_720.mp4`): `v_maxi` al pasar el nivel 1, `v_rex` al pasar el nivel 2 y `v_gruni` al terminar el mundo.
- Música de fondo generada con Web Audio, botón 🎵/🔇 arriba a la derecha.
- El progreso se guarda en localStorage con la clave `dej_prog` y la configuración (música, volumen) en `dej_cfg`. Terminar un mundo desbloquea el siguiente.
- **Rincón de los papás:** mantener presionada 3 segundos la esquina inferior izquierda.
- Abrir con `?debug` muestra los escondites con bordes rojos. Abrir con `?editor` abre el editor de escondites.

### Minijuego 2: Los colores de Bip (`js/minijuegos/colores.js`)
- Bip aparece con la antena apagada y pide un color con su voz ("¿Me ayudas a encender mi antena? ¡Busca algo rojo!"; después "¡Ahora busca algo azul!").
- Aparecen 3 objetos grandes de colores distintos; solo uno es del color pedido.
- Acierto: el objeto salta, Bip dice "¡Sí, la manzana es roja!", pone cara feliz, se enciende una de las 5 luces y el brillo de la antena crece.
- Error: sonido "uy" suave (`sfx.uy`), el objeto se sacude y Bip dice "Mmm, ese es azul. ¡Busca el rojo!". No se pierde nunca.
- Pista que se gana buscando (`COLORES_CFG.pista`): 15 s sin tocar -> Bip anima ("¿Cuál será? ¡Toca uno!"); 1 error -> el correcto se mueve un poco; 2 errores -> brilla y Bip dice "¡Mira, algo brilla!".
- 5 aciertos: antena encendida, confeti, "¡Mi antena está encendida!" y el video `v_bip_720.mp4`; luego vuelve al menú. `prog.colores` cuenta las veces completadas.
- Cada ronda sortea un color distinto al anterior y objetos que no estuvieron en la ronda anterior.
- Configuración en `COLORES_CFG` (aciertos, opciones, pista, video). Lo específico de los colores está en `MODOS_BIP.colores` (categorías, objetos, imagen, ids de voz y textos de respaldo). Para formas o números del 1 al 5 se agrega otro modo (`dibujar(o, el)` permite mostrar, por ejemplo, n copias de un objeto) y se elige en `COLORES_CFG.modo`.
- Imágenes en `assets/colores/` (`bip-apagado|feliz|pensando.webp` y `<color>-<objeto>.webp`), recortadas con `tools/recortar_colores.py` desde `Referencias/colores-bip/`. Voces `col_*` con `juego-hombre` (Bip).

## Estructura
```
index.html                 pantallas (HTML) y carga de scripts en orden
css/estilos.css
js/comun/progreso.js       prog, cfg y guardado
js/comun/nucleo.js         $, show, espera, shuffle, precargar, playVideo, confetti, crearPista, menú y registro de minijuegos
js/comun/personajes.js     imágenes de Maxi, Rex, Bip y Gruñi
js/comun/audio.js          canales (efectos, voz, música), sfx, música de fondo, desbloqueo iOS
js/comun/voz.js            say(id), registrarFrases, addVar (variantes al azar)
js/comun/papas.js          rincón de los papás
js/minijuegos/juguetes.js  ¿Dónde está el juguete? (mundos, mapa, niveles, Gruñi)
js/minijuegos/colores.js   Los colores de Bip (modos y rondas configurables)
js/main.js                 botón ¡Jugar!, service worker, ?debug y ?editor
js/editor.js               editor de escondites (solo con ?editor)
sw.js                      caché sin internet (la lista la genera tools/actualizar_sw.py)
tools/                     scripts para el PC: voces, íconos y service worker (no se usan en el juego)
assets/voz/                frases grabadas (<id>.mp3) y manifest*.json de la generación
assets/icons/              íconos de la PWA
assets/colores/            Bip y objetos de colores, sin fondo
```
Un minijuego nuevo va en `js/minijuegos/<nombre>.js` (y su `<script>` en `index.html`, antes de `main.js`), registra sus frases con `registrarFrases()` y se registra con `registrarMinijuego({id, nombre, icono, color, frase, abrir, pausar, reanudar, progresoCambio})`. Guarda su progreso dentro de `prog` con su propio prefijo. Los estilos nuevos usan `cqw` (1 % del ancho del escenario) en vez de `vw`.

## Reglas de diseño (no romper)
- Pensado para 3 años: no se puede perder, no hay tiempo límite, no hay textos que haya que leer y no hay nada que asuste.
- Zonas táctiles grandes, de al menos 10 % del ancho. Las respuestas al tocar son inmediatas: sonido y animación.
- Siempre en horizontal. iOS no deja bloquear la orientación: si el teléfono queda vertical, `ajustarGiro()` (nucleo.js) gira el juego por dentro para que siga sobre el lado largo. Por eso **todas las medidas dentro del escenario van en `cqw`/% y no en `vw`**, y los desplazamientos medidos en pantalla se pasan por `aJuego(dx, dy)`. Probar en el celular y la tablet reales.
- Sin dependencias pesadas. Phaser solo si un minijuego futuro necesita física.
- Todo el texto y la voz en español (Chile).

## Cómo trabajar en el proyecto
- **Servidor local:** desde `Juegos-Maxi/` correr `npx -y serve@14 -l tcp://0.0.0.0:8080 juego-juguetes` (o el preview "juego" de `.claude/launch.json`). En el teléfono, mismo wifi: `http://<IP del PC>:8080`. `serve.json` sirve `index.html` en la raíz y no lista carpetas.
- **Después de cambiar cualquier archivo del juego:** correr `python tools/actualizar_sw.py` para que el teléfono descargue la versión nueva.
- **Voces:** se generan con el servidor de voz local de Manuel (guía en `Videos-HyperFrames/_servidor-medios/tts/voces-juego-infantil/GUIA_PARA_OTRO_CHAT.md`). Solo las voces `juego-mujer` (narradora: `tools/frases.json`) y `juego-hombre` (Bip y Gruñi: `tools/frases_hombre.json`). Una petición a la vez. Para frases nuevas: `python tools/agregar_voces.py nuevas.json --voz juego-hombre` genera solo esas, las copia a `assets/voz/` y las suma al manifest y al guion. Agregar también el texto en `registrarFrases()` como respaldo.
- **Íconos:** `python tools/iconos.py` los regenera desde `assets/icon.png`.

## Estado de las tareas
1. ✅ **Servidor local y prueba en el teléfono.** Falta probar en el teléfono real (si no abre, revisar el firewall de Windows para Node en redes privadas).
2. ✅ **Editor de escondites (`?editor`).** Pendiente: revisar los 5 mundos con Manuel y pegar los `spots` nuevos en `js/minijuegos/juguetes.js`.
3. ✅ **Nivel 3 con Gruñi activo.**
4. ✅ **Audio:** música en loop con botón de silencio, desbloqueo en iOS, frases grabadas en `assets/voz/` con respaldo a la voz del sistema.
5. ✅ **Rendimiento:** videos `*_720.mp4` (0,8–1,3 MB) y precarga del video del nivel y del mundo siguiente.
6. ✅ **PWA sin internet:** íconos 192/512/maskable, caché completa versionada por hash, videos con Range desde caché. Probado sin servidor en el navegador del PC; falta probar modo avión en el teléfono.
7. ✅ **Rincón de los papás.**
8. ⏸️ **Publicar en Netlify:** por ahora no, solo se prueba en local.

## Futuro (no hacer todavía; la estructura ya está preparada)
Desde el mapa se podrá elegir entre más minijuegos con los mismos personajes:
1. ✅ **Los colores de Bip** (hecho). Pendiente: modos formas y números del 1 al 5.
2. **El paseo de Rex:** Rex camina solo y el niño toca la pantalla para saltar charcos y recoger frutas, sin poder perder.
3. **¡Que no llueva!:** alegrar a Gruñi con cosquillas, un globo o una canción, y al final sale un arcoíris.
4. **Vestir a Maxi:** elegir ropa según el clima.
5. **Cuento interactivo:** elegir qué pasa en la historia, con videos de Flow.

## Cómo trabajar conmigo
- Antes de cada tarea, explícame brevemente qué harás. Al terminarla, dime cómo probarla en el teléfono.
- No borres ni sobrescribas los archivos de `assets/` originales. Las versiones comprimidas van en archivos nuevos.
- Usa git y haz un commit por tarea.
