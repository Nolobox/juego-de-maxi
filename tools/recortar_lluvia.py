"""Recorta los recursos de "¡Que no llueva!" y les quita el fondo blanco.

Uso (desde la carpeta del juego):
    python tools/recortar_lluvia.py ../Referencias/alegra-a-gruñi

Crea en assets/lluvia/:
    gruni-<estado>.webp        (11 estados de Gruñi, uno por imagen)
    <grupo>-<objeto>.webp      (regalos, comidas y cosas del día, separadas de sus hojas)
Los originales no se modifican. Cómo quita el fondo: ver tools/recorte.py.
"""
import sys
from pathlib import Path
from PIL import Image
from recorte import quitar_fondo, recortar, separar, guardar

raiz = Path(__file__).resolve().parent.parent
ref = Path(sys.argv[1]) if len(sys.argv) > 1 else raiz.parent / "Referencias" / "alegra-a-gruñi"
out = raiz / "assets" / "lluvia"
out.mkdir(parents=True, exist_ok=True)

ESTADOS = {  # carpeta/prefijo del archivo -> nombre
    "mundo1/Sad_purple_cloud": "gruni-triste",
    "mundo1/Surprised_purple_cloud": "gruni-sorprendido",
    "mundo1/Purple_character_laughing": "gruni-riendo",
    "mundo1/Happy_purple_cloud_with_rainbow": "gruni-arcoiris",
    "mundo2/Character_eating_happily": "gruni-comiendo",
    "mundo2/Purple_cloud_character_tummy_ache": "gruni-guatita",
    "mundo2/Purple_character_smiling_with_sun": "gruni-sol",
    "mundo3/Purple_cloud_character_waking_up": "gruni-despierta",
    "mundo3/Purple_character_brushing_teeth": "gruni-dientes",
    "mundo3/Purple_character_sweating": "gruni-cansado",
    "mundo3/Purple_character_sleeping": "gruni-durmiendo",
}
HOJAS = {  # carpeta/prefijo -> (grupo, objetos por fila de izquierda a derecha)
    "mundo1/Sprite_sheet_of_game_objects": ("regalo", [["pluma", "globo", "flor", "nota", "caramelo"]]),
    "mundo2/Sprite_sheet_of_everyday_food": ("comida", [["manzana", "platano", "zanahoria", "brocoli"], ["leche", "agua", "pan", "uvas"]]),
    "mundo2/Food_game_sprite_sheet": ("dulce", [["torta", "chupete", "papas"], ["bebida", "helado", "dona"]]),
    "mundo3/Morning_routine_objects": ("manana", [["cereal", "cepillo", "peineta", "mochila"]]),
    "mundo3/Afternoon_routine_items": ("tarde", [["pelota", "agua", "balde", "manzana"]], {0}),   # {0}: rellena los parches blancos de la pelota
    "mundo3/Night_routine_game": ("noche", [["patito", "pijama", "libro", "almohada", "lampara"]]),
}


def buscar(clave):
    carpeta, prefijo = clave.split("/")
    f = sorted(p for p in (ref / carpeta).iterdir() if p.name.startswith(prefijo))
    assert f, clave
    return f[0]   # hay una imagen repetida ("... (1).jpg"): basta con una


for clave, nombre in ESTADOS.items():
    rgba, _ = quitar_fondo(Image.open(buscar(clave)))
    print(nombre, guardar(recortar(rgba), out, nombre, 720))

for clave, (grupo, filas, *rell) in HOJAS.items():
    piezas = separar(Image.open(buscar(clave)), [len(f) for f in filas], rellenar=rell[0] if rell else ())
    for pieza, obj in zip(piezas, [o for f in filas for o in f]):
        print(f"{grupo}-{obj}", guardar(pieza, out, f"{grupo}-{obj}", 480))
print("Listo en", out)
