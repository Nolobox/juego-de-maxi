"""Funciones compartidas para recortar imágenes de Google Flow y quitarles el fondo blanco.

Cómo quita el fondo: toma como fondo la zona clara conectada con el borde de la imagen
(relleno desde la esquina) y la vuelve transparente con un borde suave. Lo claro que está
dentro del objeto (ojos, agujeros) no se toca. La sombra suave queda translúcida.
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def quitar_fondo(im, bajo=10, alto=55, rellenar=0):
    """Devuelve RGBA. 'bajo'/'alto': cuánto se aleja del blanco del fondo para ser transparente/opaco.
    rellenar: para un objeto redondo con partes blancas que tocan el borde (la pelota): la elipse que
    llena la caja del objeto se vuelve opaca. Solo para imágenes con un único objeto redondo."""
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
    if rellenar:   # objeto redondo: la elipse que llena la caja del objeto no es fondo
        ys, xs = np.nonzero(d > 70)
        cy, cx, ry, rx = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2, (ys.max() - ys.min()) / 2, (xs.max() - xs.min()) / 2
        yy, xx = np.mgrid[0:h, 0:w]
        dentro = ((yy - cy) / ry) ** 2 + ((xx - cx) / rx) ** 2 <= 0.97
        conectado &= ~dentro
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


def guardar(im, out, nombre, lado):
    im = im.copy()
    im.thumbnail((lado, lado), Image.LANCZOS)
    im.save(out / f"{nombre}.webp", quality=88, method=6)
    return im.size



def tramos(activo, unir=25, minimo=0):
    """Tramos [ini, fin) donde activo es True, uniendo los separados por menos de 'unir' píxeles."""
    t, dentro = [], False
    for x, v in enumerate(activo):
        if v and not dentro: ini, dentro = x, True
        if not v and dentro: t.append((ini, x)); dentro = False
    if dentro: t.append((ini, len(activo)))
    unidos = []
    for a in t:
        if unidos and a[0] - unidos[-1][1] < unir: unidos[-1] = (unidos[-1][0], a[1])
        else: unidos.append(a)
    return [a for a in unidos if a[1] - a[0] >= minimo]


def separar(im, por_fila, umbral=70, rellenar=()):
    """Separa una hoja de objetos en piezas sueltas (RGBA sin fondo), de izquierda a derecha y de arriba abajo.
    por_fila: cuántos objetos hay en cada fila, por ejemplo [4, 4].
    rellenar: números de las piezas (0, 1, ...) a las que se les rellena el interior (ver quitar_fondo)."""
    rgba, d = quitar_fondo(im)
    solido = d > umbral
    h, k = im.height, len(por_fila)
    perfil = solido.sum(axis=1)
    filas = sorted(sorted(tramos(perfil > 3, 30), key=lambda t: t[1] - t[0], reverse=True)[:k])
    if len(filas) == k:
        cortes_f = [0] + [(filas[i][1] + filas[i + 1][0]) // 2 for i in range(k - 1)] + [h]
    else:   # las filas se tocan (un palito que sobresale): corta donde hay menos objeto, cerca de la división pareja
        cortes_f = [0]
        for i in range(1, k):
            c, m = h * i // k, h // 8
            cortes_f.append(c - m + int(perfil[c - m:c + m].argmin()))
        cortes_f.append(h)
    piezas = []
    for r, n in enumerate(por_fila):
        y0, y1 = cortes_f[r], cortes_f[r + 1]
        cols = sorted(sorted(tramos(solido[y0:y1].sum(axis=0) > 3), key=lambda t: t[1] - t[0], reverse=True)[:n])
        assert len(cols) == n, (r, cols)
        cortes = [0] + [(cols[i][1] + cols[i + 1][0]) // 2 for i in range(n - 1)] + [im.width]
        for i in range(n):
            caja = (cortes[i], y0, cortes[i + 1], y1)
            if len(piezas) in rellenar: piezas.append(recortar(quitar_fondo(im.crop(caja), rellenar=True)[0]))
            else: piezas.append(recortar(rgba.crop(caja)))
    return piezas
