"""Recorta los recursos de "Los colores de Bip" y les quita el fondo blanco.

Uso (desde la carpeta del juego):
    python tools/recortar_colores.py ../Referencias/colores-bip

Crea en assets/colores/:
    bip-apagado.webp, bip-feliz.webp, bip-pensando.webp
    <color>-<objeto>.webp   (16 objetos, 4 por hoja)
Los originales no se modifican.

Cómo quita el fondo: toma como fondo la zona clara conectada con el borde de la imagen
(relleno desde la esquina) y la vuelve transparente con un borde suave. Lo claro que está
dentro del objeto (ojos, agujeros del botón) no se toca. La sombra suave queda translúcida.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

raiz = Path(__file__).resolve().parent.parent
ref = Path(sys.argv[1]) if len(sys.argv) > 1 else raiz.parent / "Referencias" / "colores-bip"
out = raiz / "assets" / "colores"
out.mkdir(parents=True, exist_ok=True)

HOJAS = {  # archivo (prefijo) -> color, objetos de izquierda a derecha
    "Red_objects":        ("rojo",     ["manzana", "frutilla", "carro", "corazon"]),
    "Sprite_sheet_of_blue": ("azul",   ["pez", "gorro", "camion", "boton"]),
    "Yellow_objects":     ("amarillo", ["platano", "sol", "pollito", "estrella"]),
    "Green_objects":      ("verde",    ["hoja", "rana", "pera", "tortuga"]),
}
BIP = {"Robot_Bip_with_sad_face": "bip-apagado", "Robot_Bip_smiling": "bip-feliz", "Robot_thinking": "bip-pensando"}


def buscar(prefijo):
    f = [p for p in ref.iterdir() if p.name.startswith(prefijo)]
    assert len(f) == 1, (prefijo, f)
    return f[0]


def quitar_fondo(im, bajo=10, alto=55):
    """Devuelve RGBA. 'bajo'/'alto': cuánto se aleja del blanco del fondo para ser transparente/opaco."""
    a = np.asarray(im.convert("RGB")).astype(np.float32)
    h, w, _ = a.shape
    # color de fondo: promedio del borde (no siempre es blanco puro)
    borde = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    fondo = np.median(borde, axis=0)
    d = np.abs(a - fondo).max(axis=2)                       # distancia al fondo
    cand = Image.fromarray(((d < alto) * 255).astype(np.uint8)).copy()   # copy: si no, el relleno no se guarda
    for semilla in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if cand.getpixel(semilla) == 255:
            ImageDraw.floodfill(cand, semilla, 128)
    conectado = np.asarray(cand) == 128                      # fondo alcanzable desde el borde
    alfa = np.ones((h, w), np.float32)
    alfa[conectado] = np.clip((d[conectado] - bajo) / (alto - bajo), 0, 1)
    # suaviza el borde un pelo para que no se vea serrucho
    alfa_img = Image.fromarray((alfa * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    alfa = np.asarray(alfa_img).astype(np.float32) / 255
    # quita el halo blanco: des-mezcla el color del fondo en los bordes semitransparentes
    seguro = np.maximum(alfa, 1e-3)[..., None]
    rgb = np.clip((a - fondo * (1 - alfa[..., None])) / seguro, 0, 255)
    rgb = np.where(alfa[..., None] > 0.02, rgb, 0)
    return Image.fromarray(np.dstack([rgb, alfa * 255]).astype(np.uint8), "RGBA"), d


def recortar(rgba, margen=12):
    caja = rgba.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    x0, y0, x1, y1 = caja
    W, H = rgba.size
    return rgba.crop((max(0, x0 - margen), max(0, y0 - margen), min(W, x1 + margen), min(H, y1 + margen)))


def guardar(im, nombre, lado):
    im = im.copy()
    im.thumbnail((lado, lado), Image.LANCZOS)
    im.save(out / f"{nombre}.webp", quality=88, method=6)
    return im.size


# Bip: una imagen por pose
for pref, nombre in BIP.items():
    rgba, _ = quitar_fondo(Image.open(buscar(pref)))
    print(nombre, guardar(recortar(rgba), nombre, 720))

# Hojas de objetos: separa los 4 objetos por las columnas vacías
for pref, (color, objetos) in HOJAS.items():
    im = Image.open(buscar(pref))
    rgba, d = quitar_fondo(im)
    solido = d > 70                                         # objeto claro, sin sombras
    cols = solido.sum(axis=0) > 3
    tramos, dentro = [], False
    for x, v in enumerate(cols):
        if v and not dentro: ini, dentro = x, True
        if not v and dentro: tramos.append((ini, x)); dentro = False
    if dentro: tramos.append((ini, len(cols)))
    # une trozos cercanos (por ejemplo el tallo separado de la fruta) y deja los 4 más anchos
    unidos = []
    for t in tramos:
        if unidos and t[0] - unidos[-1][1] < 25: unidos[-1] = (unidos[-1][0], t[1])
        else: unidos.append(t)
    unidos = sorted(sorted(unidos, key=lambda t: t[1] - t[0], reverse=True)[:4])
    assert len(unidos) == 4, (pref, unidos)
    # cortes a mitad de camino entre objetos
    cortes = [0] + [(unidos[i][1] + unidos[i + 1][0]) // 2 for i in range(3)] + [im.width]
    for i, obj in enumerate(objetos):
        trozo = rgba.crop((cortes[i], 0, cortes[i + 1], im.height))
        print(f"{color}-{obj}", guardar(recortar(trozo), f"{color}-{obj}", 480))
print("Listo en", out)
