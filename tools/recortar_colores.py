"""Recorta los recursos de "Los colores de Bip" y les quita el fondo blanco.

Uso (desde la carpeta del juego):
    python tools/recortar_colores.py ../Referencias/colores-bip

Crea en assets/colores/:
    bip-apagado.webp, bip-feliz.webp, bip-pensando.webp
    <color>-<objeto>.webp   (16 objetos, 4 por hoja)
Los originales no se modifican.

Cómo quita el fondo: ver tools/recorte.py.
"""
import sys
from pathlib import Path
from PIL import Image
from recorte import quitar_fondo, recortar, guardar as _guardar

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


def guardar(im, nombre, lado): return _guardar(im, out, nombre, lado)


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
