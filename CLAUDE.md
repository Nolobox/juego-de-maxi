# Juegos de Maxi — instrucciones para Claude Code

## Contexto
Juego web para un niño de **3 años**, para celular y tablet en horizontal. Estilo claymation (plastilina).
Está hecho en HTML, CSS y JavaScript puro, sin dependencias ni paso de build (scripts clásicos que comparten variables globales, cargados en orden desde `index.html`).
Los personajes, escenarios, juguetes y videos se generaron en Google Flow y están en `assets/`.

**Personajes:** Maxi (protagonista), Rex (bebé dinosaurio amigo), Bip (robot ayudante) y Gruñi (nube traviesa que esconde los juguetes, nunca da miedo).

**Menú principal:** ¡Jugar! abre un menú con un botón grande por minijuego (hoy son 3; se arma solo con `registrarMinijuego`). Al tocar uno, dice su frase y lo abre.

**Videos únicos:** cada minijuego (y cada mundo de "¡Que no llueva!") tiene su propio video de victoria. No reutilizar un video en otro mundo ni en otro minijuego.

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
- Al entrar se ve un **mapa de 5 niveles** (botones grandes con dibujos, ⭐ si está completo, 🔒 si falta el anterior). Cada nivel completo abre el siguiente y Bip avisa "¡Se abrió un nivel nuevo!". `prog.bip` = niveles completados; el rincón de los papás puede abrir todos.
- Niveles (`NIVELES_BIP`):
  1. **Colores, 3 objetos** — "¿Me ayudas a encender mi antena? ¡Busca algo rojo!" (5 aciertos).
  2. **Colores, 4 objetos** (uno de cada color, 5 aciertos).
  3. **Los dos del color** — 5 objetos, 2 son del color pedido: "¡Busca las dos cosas rojas!"; al primero, "¡Falta una más!" (4 aciertos).
  4. **Contar del 1 al 3** — 3 tarjetas con 1, 2 o 3 copias del mismo objeto: "¡Busca tres estrellas!" (5 aciertos).
  5. **Contar del 1 al 5** — igual, con cantidades hasta 5.
- Acierto: el objeto salta, Bip lo nombra ("¡Sí, la manzana es roja!", "¡Sí, son tres estrellas!"), pone cara feliz, se enciende una luz y crece el brillo de la antena.
- Error: sonido "uy" (`sfx.uy`), el objeto se sacude y Bip corrige ("Mmm, ese es azul. ¡Busca el rojo!", "Mmm, ese tiene dos. ¡Busca el que tiene tres!"). No se pierde nunca.
- Pista que se gana buscando (`BIP_CFG.pista`): 15 s sin tocar -> Bip anima; 1 error -> el correcto se mueve; 2 errores -> brilla.
- Al completar las luces: confeti, "¡Mi antena está encendida!", video `v_bip_720.mp4` y vuelta al mapa de niveles.
- No se repite: el pedido cambia en cada ronda y los objetos de la ronda anterior no vuelven en la siguiente (en contar, cambia el objeto).
- **Cómo sumar niveles:** agregar una entrada a `NIVELES_BIP` con un `modo` existente (`colores`, `pares`, `numeros`) y sus parámetros, o crear un modo nuevo en `MODOS_BIP` con `sortear(e, nivel)`, `dibujar(o, boton)` y `voz.pedir/acierto/error` (ids de voz, o listas de ids que se dicen seguidas). Formas necesitaría imágenes nuevas.
- Imágenes en `assets/colores/` (`bip-apagado|feliz|pensando.webp` y `<color>-<objeto>.webp`), recortadas con `tools/recortar_colores.py` desde `Referencias/colores-bip/`. Voces `col_*` y `num_*` con `juego-hombre` (Bip).

### Minijuego 3: ¡Que no llueva! (`js/minijuegos/lluvia.js`)
Darle cosas a Gruñi y ver cómo cambian su ánimo y el clima. Las cosas están en una bandeja abajo: se **tocan** (vuelan solas a Gruñi) o se **arrastran** hasta él (si se suelta hacia arriba también vale). 3 mundos con 3 niveles cada uno, que se juegan seguidos. Terminar un mundo muestra su video y abre el siguiente (`prog.llu1/llu2/llu3` = niveles completados). Cada mundo usa un motor de `MOTORES_LLU` (`iniciar(e)`, `dar(e, o, boton, destino)`).
- **Mundo 1, "Alegra a Gruñi"** (motor `alegrar`): Gruñi empieza triste con lluvia ("Gruñi está triste. ¿Lo ayudamos a sonreír?"). Hay 5 regalos y cada uno tiene su reacción: la pluma le hace cosquillas, el globo sube flotando, la flor suelta corazones, la nota toca una melodía y el caramelo hace "¡ñam!". Cada regalo lo sube un estado (triste → sorprendido → riendo → feliz con arcoíris) y baja la lluvia. Nivel 1: 2 regalos. Nivel 2: 3 regalos, y el segundo lo pide él en un globito ("¡Quiero algo que suene!"). Nivel 3: dos nubes tristes. Al final sale el arcoíris. Video: `v_lluvia_abrazo_720.mp4`.
- **Mundo 2, "La merienda de Gruñi"** (motor `merienda`): la comida de todos los días la come feliz, brilla y sale un poco de sol (es lo que avanza). La de vez en cuando: la primera le encanta ("¡Mmm, qué rica la torta!"). Si come 2 seguidas, le duele la guatita y caen gotitas, y entonces solo el agua o una fruta lo alivian. Nivel 1: elegir entre 2 opciones muy distintas. Nivel 2: armar un plato con 3 alimentos. Nivel 3: picnic donde Maxi, Rex, Bip y Gruñi piden algo de un color ("¡Rex quiere algo verde!"). Video: `v_lluvia_picnic_720.mp4`.
  - **Regla de lenguaje con la comida:** nunca decir "mala", "prohibida" ni nada que suene a regaño. La comida de vez en cuando es rica. El dolor de guatita es suave ("me duele un poquito") y siempre se arregla.
- **Mundo 3, "El día de Gruñi"** (motor `dia`): el fondo cambia con la hora (amanecer, tarde soleada, noche azul). Gruñi muestra en un globito lo que necesita y el niño elige entre 3 cosas (`PASOS_DIA`). Mañana: cereal y cepillo de dientes, y sale el sol. Tarde: pelota, después agua y manzana. Noche, en orden: patito, pijama, libro y almohada, y al final el niño apaga la lámpara. Si elige algo que no sirve, Gruñi pone cara chistosa ("¡Jiji, la pelota no sirve para dormir!"). La noche es tranquila: música suave (`musicaSuave`), sin confeti, solo estrellas que aparecen de a poco. Video: `v_lluvia_noche_720.mp4`.
- Pista (`LLU_CFG.pista`, pedida por el equipo): 10 s sin tocar → brilla lo correcto y se repite el pedido; 1 error → se mueve; 2 errores → brilla.
- Imágenes en `assets/lluvia/` (`gruni-<estado>.webp`, `regalo-*`, `comida-*`, `dulce-*`, `manana-*`, `tarde-*`, `noche-*`), recortadas con `tools/recortar_lluvia.py` desde `Referencias/alegra-a-gruñi/`. Voces `llu_*` con `juego-mujer` (narradora) y `llg_*` con `juego-hombre` (Gruñi, a velocidad 1.12).
- `?llu=23` abre directo el mundo 2, nivel 3 (para revisar escenas).

## Estructura
```
index.html                 pantallas (HTML) y carga de scripts en orden
css/estilos.css
js/comun/progreso.js       prog, cfg y guardado
js/comun/nucleo.js         $, show, espera, shuffle, precargar, playVideo, confetti, crearPista, menú y registro de minijuegos
js/comun/personajes.js     imágenes de Maxi, Rex, Bip y Gruñi
js/comun/audio.js          canales (efectos, voz, música), sfx, música de fondo (y musicaSuave), desbloqueo iOS
js/comun/voz.js            say(id), decir([ids]) seguidas, registrarFrases, addVar (variantes al azar)
js/comun/papas.js          rincón de los papás
js/minijuegos/juguetes.js  ¿Dónde está el juguete? (mundos, mapa, niveles, Gruñi)
js/minijuegos/colores.js   Los colores de Bip (modos y rondas configurables)
js/minijuegos/lluvia.js    ¡Que no llueva! (3 mundos con motores, bandeja para tocar o arrastrar)
js/main.js                 botón ¡Jugar!, service worker, ?debug y ?editor
js/editor.js               editor de escondites (solo con ?editor)
sw.js                      caché sin internet (la lista la genera tools/actualizar_sw.py)
tools/                     scripts para el PC: voces, íconos, recortes (recorte.py es el común) y service worker (no se usan en el juego)
assets/voz/                frases grabadas (<id>.mp3) y manifest*.json de la generación
assets/icons/              íconos de la PWA
assets/colores/            Bip y objetos de colores, sin fondo
assets/lluvia/             Gruñi (11 estados) y objetos de ¡Que no llueva!, sin fondo
```
Un minijuego nuevo va en `js/minijuegos/<nombre>.js` (y su `<script>` en `index.html`, antes de `main.js`), registra sus frases con `registrarFrases()` y se registra con `registrarMinijuego({id, nombre, icono, color, frase, abrir, pausar, reanudar, progresoCambio})`. Guarda su progreso dentro de `prog` con su propio prefijo. Los estilos nuevos usan `cqw` (1 % del ancho del escenario) en vez de `vw`.

## Reglas de diseño (no romper)
- Pensado para 3 años: no se puede perder, no hay tiempo límite, no hay textos que haya que leer y no hay nada que asuste.
- Zonas táctiles grandes, de al menos 10 % del ancho. Las respuestas al tocar son inmediatas: sonido y animación.
- Siempre en horizontal. iOS no deja bloquear la orientación: si el teléfono queda vertical, el escenario se gira por dentro para que siga sobre el lado largo. **El tamaño y el giro los pone solo el CSS** (`@media (orientation:portrait)` en `estilos.css`, con `--W`/`--H` en `dvw`/`dvh`); `ajustarGiro()` (nucleo.js) solo elige el lado (`--giro`). No volver a medir con `innerWidth`/`innerHeight`: iOS los informa tarde al girar y el juego quedaba con zoom. `#app` mide lo mismo que la pantalla y recorta. Para revisar problemas de pantalla en el teléfono: rincón de los papás → "Diagnóstico de pantalla". Por eso **todas las medidas dentro del escenario van en `cqw`/% y no en `vw`**, y los desplazamientos medidos en pantalla se pasan por `aJuego(dx, dy)`. Probar en el celular y la tablet reales.
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
1. ✅ **Los colores de Bip** (hecho, con 5 niveles: colores y números del 1 al 5). Pendiente: formas (necesita imágenes).
2. **El paseo de Rex:** Rex camina solo y el niño toca la pantalla para saltar charcos y recoger frutas, sin poder perder.
3. ✅ **¡Que no llueva!** (hecho, con 3 mundos).
4. **Vestir a Maxi:** elegir ropa según el clima.
5. **Cuento interactivo:** elegir qué pasa en la historia, con videos de Flow.

## Cómo trabajar conmigo
- Antes de cada tarea, explícame brevemente qué harás. Al terminarla, dime cómo probarla en el teléfono.
- No borres ni sobrescribas los archivos de `assets/` originales. Las versiones comprimidas van en archivos nuevos.
- Usa git y haz un commit por tarea.
