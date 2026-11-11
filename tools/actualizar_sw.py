"""Actualiza la lista de archivos y la versión de la caché en sw.js.

Uso (desde la carpeta del juego):  python tools/actualizar_sw.py
Ejecutar después de cambiar cualquier archivo del juego. La versión es un hash del contenido:
si algo cambió, el teléfono descarga la versión nueva y borra la caché vieja.
"""
import hashlib
import json
import re
from pathlib import Path

raiz = Path(__file__).resolve().parent.parent
# Lo que se guarda para jugar sin internet
INCLUIR = ["index.html", "manifest.json", "js/**/*.js", "css/**/*.css",
           "assets/*.webp", "assets/*.png", "assets/icons/*.png", "assets/voz/*.mp3", "assets/*_720.mp4"]
# Los videos originales (sin comprimir) no se usan en el juego

archivos = sorted({p.relative_to(raiz).as_posix() for pat in INCLUIR for p in raiz.glob(pat) if p.is_file()})
h = hashlib.sha1()
for a in archivos:
    h.update(a.encode()); h.update((raiz / a).read_bytes())
# también cuenta la lógica del propio sw.js (sin el bloque generado)
h.update(re.sub(r"// <precache>.*?// </precache>", "", (raiz / "sw.js").read_text(encoding="utf-8"), flags=re.S).encode())
version = h.hexdigest()[:10]
lista = archivos           # "/" se sirve desde index.html (ver clave() en sw.js)

sw = raiz / "sw.js"
txt = sw.read_text(encoding="utf-8")
bloque = ("// <precache>\nconst VERSION = %s;\nconst ARCHIVOS = [\n%s\n];\n// </precache>"
          % (json.dumps(version), ",\n".join("  " + json.dumps(a) for a in lista)))
nuevo, n = re.subn(r"// <precache>.*?// </precache>", lambda m: bloque, txt, flags=re.S)
assert n == 1, "no encontré las marcas <precache> en sw.js"
sw.write_text(nuevo, encoding="utf-8", newline="\n")
peso = sum((raiz / a).stat().st_size for a in archivos) / 1e6
print(f"sw.js: versión {version}, {len(lista)} archivos, {peso:.1f} MB")
