"""Genera las frases de un juego con el servidor de voz local (Estudio de voz) y las guarda como archivos de audio.

Uso:
    python generar_voces.py frases.json --voz juego-mujer --salida assets/audio/voz --formato mp3

frases.json:
    {"lines": [{"id": "hola", "text": "¡Hola! ¿Quieres jugar conmigo?"},
               {"id": "muy_bien", "text": "¡Muy bien, lo encontraste!"}]}

Cada "id" es el nombre del archivo que se crea (hola.mp3, muy_bien.mp3). Solo letras, números, guion y guion bajo.
Además guarda manifest.json con la duración y la verificación de cada frase.
"""
import argparse
import io
import json
import sys
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

API = "http://192.168.1.100:8020"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("frases")
    ap.add_argument("--voz", required=True, help="juego-mujer o juego-hombre")
    ap.add_argument("--salida", required=True)
    ap.add_argument("--formato", default="mp3", help="wav, mp3, m4a, ogg, opus o flac")
    ap.add_argument("--tomas", type=int, default=4, help="intentos por frase; el servidor elige el mejor")
    ap.add_argument("--lote", type=int, default=15, help="frases por petición")
    a = ap.parse_args()

    lines = json.loads(Path(a.frases).read_text(encoding="utf-8"))["lines"]
    out = Path(a.salida)
    out.mkdir(parents=True, exist_ok=True)
    manifest, malas = [], []
    for i in range(0, len(lines), a.lote):
        body = {"voice": a.voz, "lines": lines[i:i + a.lote], "takes": a.tomas, "language": "Spanish"}
        req = urllib.request.Request(API + "/api/narrate", data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
                                     headers={"Content-Type": "application/json; charset=utf-8"})
        try:
            m = json.loads(urllib.request.urlopen(req, timeout=3600).read())
        except urllib.error.HTTPError as e:
            sys.exit("Error %s: %s" % (e.code, e.read().decode("utf-8", "ignore")))
        z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(
            API + "/api/narration/%s/zip?format=%s" % (m["id"], a.formato), timeout=600).read()))
        for name in z.namelist():
            if not name.startswith(("manifest", "captions")):
                (out / name).write_bytes(z.read(name))
        for l in m["lines"]:
            manifest.append({"id": l["id"], "text": l["text"], "file": "%s.%s" % (l["id"], a.formato),
                             "seconds": l["seconds"], "accuracy": l["accuracy"], "heard": l["heard"], "passed": l["passed"]})
            if not l["passed"]:
                malas.append(l["id"])
        print("lote %d: %d frases listas" % (i // a.lote + 1, len(m["lines"])), flush=True)
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print("Total: %d frases en %s" % (len(manifest), out.resolve()))
    print("Frases a revisar (el servidor no entendió bien el texto):", ", ".join(malas) if malas else "ninguna")


if __name__ == "__main__":
    main()
