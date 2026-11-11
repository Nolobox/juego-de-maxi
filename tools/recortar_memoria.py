"""Recorta los recursos de "La memoria de Rex" y les quita el fondo blanco.

Uso (desde la carpeta del juego):
    python tools/recortar_memoria.py ../Referencias/la-memoria-de-rex

Crea en assets/memoria/:
    rex-pensando.webp, rex-celebra.webp, rex-chistoso.webp   (estados de Rex, sin fondo)
    <dibujo>.webp      (las 10 caras de las cartas, separadas de sus 2 hojas, sin fondo)
    reverso.webp       (reverso de las cartas, recortado justo al borde; las esquinas las redondea el CSS)
Los originales no se modifican. Cómo quita el fondo: ver tools/recorte.py.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from recorte import quitar_fondo, recortar, separar, guardar

raiz = Path(__file__).resolve().parent.parent
ref = Path(sys.argv[1]) if len(sys.argv) > 1 else raiz.parent / "Referencias" / "la-memoria-de-rex"
out = raiz / "assets" / "memoria"
out.mkdir(parents=True, exist_ok=True)

REX = {"Dinosaur_thinking_pose": "rex-pensando", "Dinosaur_celebrating": "rex-celebra", "Claymation_dinosaur_making_silly": "rex-chistoso"}
HOJAS = {
    "Baby_dinosaurs_sprite_sheet": ["triceratops", "estegosaurio", "braquiosaurio", "pterodactilo", "anquilosaurio"],
    "Dinosaur_memory_game_sprite_sheet": ["huevo", "volcan", "hueso", "huella", "palmera"],
}


def buscar(prefijo):
    f = sorted(p for p in ref.iterdir() if p.name.startswith(prefijo))
    assert len(f) == 1, (prefijo, f)
    return f[0]


for pref, nombre in REX.items():
    rgba, _ = quitar_fondo(Image.open(buscar(pref)))
    print(nombre, guardar(recortar(rgba), out, nombre, 640))

for pref, nombres in HOJAS.items():
    rell = {0} if "huevo" in nombres else ()   # el huevo es blanco como el fondo: se rellena su óvalo
    for pieza, nombre in zip(separar(Image.open(buscar(pref)), [len(nombres)], rellenar=rell), nombres):
        print(nombre, guardar(pieza, out, nombre, 400))

# reverso: el borde crema se parece al fondo blanco, así que no se le quita el fondo; solo se recorta al borde de la carta
im = Image.open(buscar("Dinosaur_smiling_on_green")).convert("RGB")
a = np.asarray(im).astype(np.float32)
d = np.abs(a - np.median(np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]), axis=0)).max(axis=2)
ys, xs = np.nonzero(d > 14)
caja = (xs.min() + 4, ys.min() + 4, xs.max() - 3, ys.max() - 3)
print("reverso", guardar(im.crop(caja), out, "reverso", 480))
print("Listo en", out)
