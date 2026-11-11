// Service worker: deja el juego listo para jugar sin internet.
// La lista de archivos y la versión las escribe tools/actualizar_sw.py (no editar a mano entre las marcas).
// <precache>
const VERSION = "882ba9d16d";
const ARCHIVOS = [
  "assets/bg_casa.webp",
  "assets/bg_parque.webp",
  "assets/bg_playa.webp",
  "assets/bg_taller.webp",
  "assets/bg_valle.webp",
  "assets/c_gruni.png",
  "assets/icon.png",
  "assets/icons/apple-touch-180.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/maskable-512.png",
  "assets/p_bip.webp",
  "assets/p_gruni.webp",
  "assets/p_maxi.webp",
  "assets/p_rex.webp",
  "assets/t_autito.png",
  "assets/t_cohete.png",
  "assets/t_cubo.png",
  "assets/t_dino.png",
  "assets/t_globo.png",
  "assets/t_osito.png",
  "assets/t_patito.png",
  "assets/t_pelota.png",
  "assets/t_tambor.png",
  "assets/t_trompo.png",
  "assets/v_bip_720.mp4",
  "assets/v_gruni_720.mp4",
  "assets/v_maxi_720.mp4",
  "assets/v_rex_720.mp4",
  "assets/voz/abre_parque.mp3",
  "assets/voz/abre_playa.mp3",
  "assets/voz/abre_taller.mp3",
  "assets/voz/abre_valle.mp3",
  "assets/voz/anima_buscar.mp3",
  "assets/voz/anima_buscar_2.mp3",
  "assets/voz/bip_hola.mp3",
  "assets/voz/bloqueado.mp3",
  "assets/voz/col_anima.mp3",
  "assets/voz/col_final.mp3",
  "assets/voz/col_no_amarillo_azul.mp3",
  "assets/voz/col_no_amarillo_rojo.mp3",
  "assets/voz/col_no_amarillo_verde.mp3",
  "assets/voz/col_no_azul_amarillo.mp3",
  "assets/voz/col_no_azul_rojo.mp3",
  "assets/voz/col_no_azul_verde.mp3",
  "assets/voz/col_no_rojo_amarillo.mp3",
  "assets/voz/col_no_rojo_azul.mp3",
  "assets/voz/col_no_rojo_verde.mp3",
  "assets/voz/col_no_verde_amarillo.mp3",
  "assets/voz/col_no_verde_azul.mp3",
  "assets/voz/col_no_verde_rojo.mp3",
  "assets/voz/col_pide1_amarillo.mp3",
  "assets/voz/col_pide1_azul.mp3",
  "assets/voz/col_pide1_rojo.mp3",
  "assets/voz/col_pide1_verde.mp3",
  "assets/voz/col_pide_amarillo.mp3",
  "assets/voz/col_pide_azul.mp3",
  "assets/voz/col_pide_rojo.mp3",
  "assets/voz/col_pide_verde.mp3",
  "assets/voz/col_pista.mp3",
  "assets/voz/col_si_boton.mp3",
  "assets/voz/col_si_camion.mp3",
  "assets/voz/col_si_carro.mp3",
  "assets/voz/col_si_corazon.mp3",
  "assets/voz/col_si_estrella.mp3",
  "assets/voz/col_si_frutilla.mp3",
  "assets/voz/col_si_gorro.mp3",
  "assets/voz/col_si_hoja.mp3",
  "assets/voz/col_si_manzana.mp3",
  "assets/voz/col_si_pera.mp3",
  "assets/voz/col_si_pez.mp3",
  "assets/voz/col_si_platano.mp3",
  "assets/voz/col_si_pollito.mp3",
  "assets/voz/col_si_rana.mp3",
  "assets/voz/col_si_sol.mp3",
  "assets/voz/col_si_tortuga.mp3",
  "assets/voz/enc_autito_1.mp3",
  "assets/voz/enc_autito_2.mp3",
  "assets/voz/enc_autito_3.mp3",
  "assets/voz/enc_cohete_1.mp3",
  "assets/voz/enc_cohete_2.mp3",
  "assets/voz/enc_cohete_3.mp3",
  "assets/voz/enc_cubo_1.mp3",
  "assets/voz/enc_cubo_2.mp3",
  "assets/voz/enc_cubo_3.mp3",
  "assets/voz/enc_dino_1.mp3",
  "assets/voz/enc_dino_2.mp3",
  "assets/voz/enc_dino_3.mp3",
  "assets/voz/enc_globo_1.mp3",
  "assets/voz/enc_globo_2.mp3",
  "assets/voz/enc_globo_3.mp3",
  "assets/voz/enc_osito_1.mp3",
  "assets/voz/enc_osito_2.mp3",
  "assets/voz/enc_osito_3.mp3",
  "assets/voz/enc_patito_1.mp3",
  "assets/voz/enc_patito_2.mp3",
  "assets/voz/enc_patito_3.mp3",
  "assets/voz/enc_pelota_1.mp3",
  "assets/voz/enc_pelota_2.mp3",
  "assets/voz/enc_pelota_3.mp3",
  "assets/voz/enc_tambor_1.mp3",
  "assets/voz/enc_tambor_2.mp3",
  "assets/voz/enc_tambor_3.mp3",
  "assets/voz/enc_trompo_1.mp3",
  "assets/voz/enc_trompo_2.mp3",
  "assets/voz/enc_trompo_3.mp3",
  "assets/voz/gruni_cambio.mp3",
  "assets/voz/gruni_risa.mp3",
  "assets/voz/intro.mp3",
  "assets/voz/menu_colores.mp3",
  "assets/voz/menu_juguetes.mp3",
  "assets/voz/mundo_ok.mp3",
  "assets/voz/nivel_cinco.mp3",
  "assets/voz/nivel_cuatro.mp3",
  "assets/voz/nivel_ok_1.mp3",
  "assets/voz/nivel_ok_2.mp3",
  "assets/voz/nivel_ok_3.mp3",
  "assets/voz/nivel_tres.mp3",
  "assets/voz/no_1.mp3",
  "assets/voz/no_2.mp3",
  "assets/voz/no_3.mp3",
  "assets/voz/pista.mp3",
  "css/estilos.css",
  "index.html",
  "js/comun/audio.js",
  "js/comun/nucleo.js",
  "js/comun/papas.js",
  "js/comun/personajes.js",
  "js/comun/progreso.js",
  "js/comun/voz.js",
  "js/editor.js",
  "js/main.js",
  "js/minijuegos/colores.js",
  "js/minijuegos/juguetes.js",
  "manifest.json"
];
// </precache>
const CACHE = "juguetes-" + VERSION;
// Código: primero la red (para ver cambios al instante) y, si no hay internet, la caché.
const ES_CODIGO = url => url.pathname.endsWith("/") || /\.(html|js|css|json)$/.test(url.pathname);

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ARCHIVOS.map(u => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith("juguetes-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.headers.has("range")) { e.respondWith(rango(req)); return; }
  e.respondWith(ES_CODIGO(url) ? redPrimero(req) : cachePrimero(req));
});

// Clave de caché: sin "?..." y las carpetas ("/", "/?debug") como su index.html
function clave(req) {
  const u = new URL(req.url);
  return u.origin + (u.pathname.endsWith("/") ? u.pathname + "index.html" : u.pathname);
}

async function cachePrimero(req) {
  const c = await caches.open(CACHE), k = clave(req);
  const r = await c.match(k);
  if (r) return r;
  const n = await fetch(req);
  if (n.ok && n.status === 200) c.put(k, n.clone());
  return n;
}

async function redPrimero(req) {
  const c = await caches.open(CACHE), k = clave(req);
  try {
    const n = await conLimite(fetch(req), 4000);
    if (n.ok && n.status === 200 && !n.redirected) c.put(k, n.clone());
    return n;
  } catch (e) {
    const r = await c.match(k) || (req.mode === "navigate" && await c.match(new URL("index.html", self.registration.scope).href));
    if (r) return r;
    throw e;
  }
}
const conLimite = (p, ms) => Promise.race([p, new Promise((_, ko) => setTimeout(() => ko(new Error("lento")), ms))]);

// Videos: Safari pide trozos (Range). Se responden desde el archivo completo guardado en caché.
async function rango(req) {
  const c = await caches.open(CACHE);
  const k = clave(req);
  let r = await c.match(k);
  if (!r) {
    try { r = await fetch(k); if (r.ok && r.status === 200) c.put(k, r.clone()); else return fetch(req); }
    catch (e) { return fetch(req); }
  }
  const buf = await r.arrayBuffer(), total = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
  let ini = 0, fin = total - 1;
  if (m) {
    if (m[1] === "" && m[2] !== "") ini = Math.max(0, total - +m[2]);      // "bytes=-500": los últimos 500
    else { ini = +m[1] || 0; if (m[2] !== "") fin = Math.min(+m[2], total - 1); }
  }
  if (ini > fin || ini >= total) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  return new Response(buf.slice(ini, fin + 1), { status: 206, headers: {
    "Content-Type": r.headers.get("Content-Type") || "video/mp4",
    "Content-Range": `bytes ${ini}-${fin}/${total}`,
    "Content-Length": String(fin - ini + 1),
    "Accept-Ranges": "bytes" } });
}
