"""Genera los íconos de la PWA a partir de assets/icon.png (que no se modifica).

Uso (desde la carpeta del juego):  python tools/iconos.py
Crea assets/icons/icon-192.png, icon-512.png, maskable-512.png y apple-touch-180.png.
"""
from pathlib import Path
from PIL import Image, ImageFilter

raiz = Path(__file__).resolve().parent.parent
src = Image.open(raiz / "assets" / "icon.png").convert("RGB")
out = raiz / "assets" / "icons"
out.mkdir(exist_ok=True)

def guardar(im, nombre, lado):
    im.resize((lado, lado), Image.LANCZOS).save(out / nombre, optimize=True)

guardar(src, "icon-512.png", 512)
guardar(src, "icon-192.png", 192)
guardar(src, "apple-touch-180.png", 180)

# Maskable: el contenido debe caber en el círculo central (80 %). Se achica a 76 % y el borde
# se rellena, fila por fila, con el color promedio de los bordes laterales del ícono original.
from PIL import ImageDraw
L = 512
base = src.resize((L, L), Image.LANCZOS)
chico = src.resize((round(L * .76),) * 2, Image.LANCZOS)
off = (L - chico.size[0]) // 2
px = base.load()
fondo = Image.new("RGB", (L, L))
d = ImageDraw.Draw(fondo)
filas = []
for y in range(L):
    # la fila y del fondo toma el color de la fila equivalente del ícono achicado
    yo = min(L - 1, max(0, round((y - off) / .76)))
    cols = [px[x, yo] for x in list(range(0, 12)) + list(range(L - 12, L))]
    filas.append(tuple(sum(c[i] for c in cols) // len(cols) for i in range(3)))
for y, c in enumerate(filas):
    d.line([(0, y), (L, y)], fill=c)
mascara = Image.new("L", chico.size, 0)
ImageDraw.Draw(mascara).rounded_rectangle([0, 0, chico.size[0] - 1, chico.size[1] - 1], radius=60, fill=255)
mascara = mascara.filter(ImageFilter.GaussianBlur(12))
fondo.paste(chico, (off, off), mascara)
fondo.save(out / "maskable-512.png", optimize=True)
print("Íconos listos en", out)
