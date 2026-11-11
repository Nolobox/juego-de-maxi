"""Genera frases nuevas con el servidor de voz y las suma al juego sin regenerar las que ya existen.

Uso (desde la carpeta del juego):
    python tools/agregar_voces.py nuevas.json --voz juego-hombre

- Genera solo las frases de nuevas.json (formato de generar_voces.py) en una carpeta temporal.
- Copia los mp3 a assets/voz/.
- Junta el resultado en assets/voz/manifest.json (juego-mujer) o manifest_hombre.json (juego-hombre).
- Agrega las frases al guion maestro: tools/frases.json (juego-mujer) o tools/frases_hombre.json (juego-hombre).
"""
import argparse, json, shutil, subprocess, sys, tempfile
from pathlib import Path

raiz = Path(__file__).resolve().parent.parent
DESTINO = {"juego-mujer": ("manifest.json", "frases.json"), "juego-hombre": ("manifest_hombre.json", "frases_hombre.json")}

ap = argparse.ArgumentParser()
ap.add_argument("frases"); ap.add_argument("--voz", required=True, choices=DESTINO); ap.add_argument("--tomas", default="4")
a = ap.parse_args()
nuevas = json.loads(Path(a.frases).read_text(encoding="utf-8"))["lines"]
man_nombre, guion_nombre = DESTINO[a.voz]

with tempfile.TemporaryDirectory() as tmp:
    r = subprocess.run([sys.executable, str(raiz / "tools" / "generar_voces.py"), a.frases, "--voz", a.voz,
                        "--salida", tmp, "--formato", "mp3", "--tomas", a.tomas])
    if r.returncode: sys.exit(r.returncode)
    gen = json.loads((Path(tmp) / "manifest.json").read_text(encoding="utf-8"))
    for l in gen:
        shutil.copy(Path(tmp) / l["file"], raiz / "assets" / "voz" / l["file"])

man = raiz / "assets" / "voz" / man_nombre
viejo = json.loads(man.read_text(encoding="utf-8")) if man.exists() else []
ids = {l["id"] for l in gen}
man.write_text(json.dumps([l for l in viejo if l["id"] not in ids] + gen, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")

guion = raiz / "tools" / guion_nombre
g = json.loads(guion.read_text(encoding="utf-8"))["lines"]
g = [l for l in g if l["id"] not in {n["id"] for n in nuevas}] + nuevas
guion.write_text('{"lines": [\n' + ",\n".join("  " + json.dumps(l, ensure_ascii=False) for l in g) + "\n]}\n", encoding="utf-8", newline="\n")

malas = [l for l in gen if not l["passed"]]
print(f"{len(gen)} frases agregadas a assets/voz ({man_nombre}, {guion_nombre})")
for l in malas: print(f"  REVISAR {l['id']}: se entendió {l['heard']!r}")
