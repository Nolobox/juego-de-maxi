# Juego "¿Dónde está el juguete?" — instrucciones para Claude Code

## Contexto
Juego web para un niño de **3 años**, para celular y tablet en horizontal. Estilo claymation (plastilina).
Está hecho en HTML, CSS y JavaScript puro, sin dependencias ni paso de build. Todo el código vive en `index.html`.
Los personajes, escenarios, juguetes y videos se generaron en Google Flow y están en `assets/`.

**Personajes:** Maxi (protagonista), Rex (bebé dinosaurio amigo), Bip (robot ayudante) y Gruñi (nube traviesa que esconde los juguetes, nunca da miedo).

**Cómo funciona hoy:**
- Hay 5 mundos (casa, parque, valle, playa y taller) con 3 niveles cada uno, de 3, 4 y 5 juguetes.
- Los escondites son zonas táctiles definidas en `WORLDS[].spots` como `[x, y, ancho, alto]`, en % del escenario 16:9.
- Los juguetes se reparten al azar. Al encontrar uno, salta, una voz lo nombra (speechSynthesis) y vuela a la bandeja.
- Si pasan 12 segundos sin encontrar nada, el escondite con un juguete brilla como pista.
- Videos de premio: `v_maxi` al pasar el nivel 1, `v_rex` al pasar el nivel 2 y `v_gruni` al terminar el mundo.
- El progreso se guarda en localStorage con la clave `dej_prog`. Terminar un mundo desbloquea el siguiente.
- Abrir con `?debug` muestra los escondites con bordes rojos.

## Reglas de diseño (no romper)
- Pensado para 3 años: no se puede perder, no hay tiempo límite, no hay textos que haya que leer y no hay nada que asuste.
- Zonas táctiles grandes, de al menos 10 % del ancho. Las respuestas al tocar son inmediatas: sonido y animación.
- Siempre en horizontal. Probar en el celular y la tablet reales.
- Sin dependencias pesadas. Phaser solo si un minijuego futuro necesita física.
- Todo el texto y la voz en español (Chile).

## Tareas pendientes (en este orden)
1. **Servidor local y prueba en el teléfono:** levantar un servidor (por ejemplo `npx serve`) accesible desde la red local y darme la URL con la IP del PC, para abrirla en el teléfono conectado al mismo wifi.
2. **Calibrar escondites:** crear una herramienta de edición (por ejemplo `?editor`) donde pueda arrastrar y redimensionar los rectángulos de cada escenario sobre la imagen y copiar el array `spots` resultante. Después revisar los 5 mundos conmigo.
3. **Nivel 3 con Gruñi activo:** que Gruñi cruce volando y cambie un juguete de escondite a mitad del nivel, de forma visible y chistosa, con su risa.
4. **Audio:**
   - Música de fondo suave en loop, con botón para silenciarla, generada con Web Audio o un archivo libre de derechos.
   - En iOS Safari, desbloquear el audio con el primer toque.
   - Opción de reemplazar speechSynthesis por frases pregrabadas en `assets/voz/*.mp3`. Si existe el archivo se usa; si no, se usa la voz del sistema. Me gustaría grabarlas yo con mi voz.
5. **Rendimiento:** comprimir los videos (ffmpeg, H.264 a 720p, `-preset veryfast`, unos 1,5 MB cada uno) y precargar el siguiente escenario.
6. **PWA instalable y sin internet:** revisar `manifest.json` (íconos de 192 y 512 px, y maskable) y `sw.js`. La caché debe incluir todos los assets en la instalación y versionarse para que se actualice. Probar el modo avión.
7. **Rincón de los papás:** un botón escondido (mantener presionado 3 segundos en una esquina) para reiniciar el progreso, desbloquear todos los mundos y ajustar el volumen.
8. **Publicar:** subir a Netlify (`netlify deploy --prod` o Netlify Drop) y darme el link final.

## Futuro (no hacer todavía, solo dejar la estructura preparada)
Desde el mapa se podrá elegir entre más minijuegos con los mismos personajes:
1. **Los colores de Bip:** tocar el objeto del color que Bip pide para encender su antena.
2. **El paseo de Rex:** Rex camina solo y el niño toca la pantalla para saltar charcos y recoger frutas, sin poder perder.
3. **¡Que no llueva!:** alegrar a Gruñi con cosquillas, un globo o una canción, y al final sale un arcoíris.
4. **Vestir a Maxi:** elegir ropa según el clima.
5. **Cuento interactivo:** elegir qué pasa en la historia, con videos de Flow.

Organiza el código para que cada minijuego sea un módulo independiente y comparta el audio, el progreso y los personajes. Puedes separar `index.html` en `css/` y `js/` si ayuda.

## Cómo trabajar conmigo
- Antes de cada tarea, explícame brevemente qué harás. Al terminarla, dime cómo probarla en el teléfono.
- No borres ni sobrescribas los archivos de `assets/` originales. Las versiones comprimidas van en archivos nuevos.
- Usa git y haz un commit por tarea.
