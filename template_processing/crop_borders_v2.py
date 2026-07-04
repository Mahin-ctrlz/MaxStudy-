"""
v2: per-pixel matching against a precisely-sampled corner color, using the
percentage of matching pixels in a strip (not averaged color) so a strip
that's mostly-gray-but-partly-content doesn't get misjudged the way an
averaged color can. Every result gets saved for manual visual verification
before any is trusted.
"""

from PIL import Image
import os
import json

SRC_DIR = "/mnt/user-data/uploads"
OUT_DIR = "/home/claude/template_processing/cropped"
os.makedirs(OUT_DIR, exist_ok=True)

FILES = {
    "botanical": "1783062978846_2.png",
    "celestial": "1783062978846_3.png",
    "vintage_maps": "1783062978846_4.png",
    "cotton_candy": "1783062978846_5.png",
    "urban_sketching": "1783062978847_6.png",
    "forest_gnome": "1783062978847_7.png",
    "geometric": "1783062978847_8.png",
    "retro_pixel": "1783062978847_9.png",
    "sweet_treats": "1783062978847_10.png",
    "dark_academia": "1783062978847_11.png",
    "frog_hearts": "1783062978847_1.jpg",
}

PER_PIXEL_TOLERANCE = 8    # how close a pixel must be to the corner color to count as "background"
MATCH_FRACTION_CUTOFF = 0.90  # a row/col counts as "still background" if >=90% of its pixels match


def sample_corner_color(img, w, h):
    """Average of a small true-corner patch, well away from any content."""
    patch = img.crop((0, 0, 6, 6))
    pixels = list(patch.getdata())
    n = len(pixels)
    return tuple(sum(p[i] for p in pixels) / n for i in range(3))


def row_match_fraction(img, y, w, ref, tol):
    row = img.crop((0, y, w, y + 1))
    pixels = list(row.getdata())
    matches = sum(
        1 for p in pixels
        if abs(p[0] - ref[0]) <= tol and abs(p[1] - ref[1]) <= tol and abs(p[2] - ref[2]) <= tol
    )
    return matches / len(pixels)


def col_match_fraction(img, x, h, ref, tol):
    col = img.crop((x, 0, x + 1, h))
    pixels = list(col.getdata())
    matches = sum(
        1 for p in pixels
        if abs(p[0] - ref[0]) <= tol and abs(p[1] - ref[1]) <= tol and abs(p[2] - ref[2]) <= tol
    )
    return matches / len(pixels)


def find_edges_flat_canvas(img, w, h, ref):
    CONSECUTIVE_REQUIRED = 4  # a boundary must hold for this many rows/cols in a row

    def scan(length, get_fraction, forward):
        rng = range(length) if forward else range(length - 1, -1, -1)
        streak = 0
        for i in rng:
            frac = get_fraction(i)
            if frac < MATCH_FRACTION_CUTOFF:
                streak += 1
                if streak >= CONSECUTIVE_REQUIRED:
                    # back up to the start of this streak — that's the true boundary
                    return i + (CONSECUTIVE_REQUIRED - 1) if not forward else i - (CONSECUTIVE_REQUIRED - 1)
            else:
                streak = 0
        return None

    top_hit = scan(h, lambda y: row_match_fraction(img, y, w, ref, PER_PIXEL_TOLERANCE), forward=True)
    bottom_hit = scan(h, lambda y: row_match_fraction(img, y, w, ref, PER_PIXEL_TOLERANCE), forward=False)
    left_hit = scan(w, lambda x: col_match_fraction(img, x, h, ref, PER_PIXEL_TOLERANCE), forward=True)
    right_hit = scan(w, lambda x: col_match_fraction(img, x, h, ref, PER_PIXEL_TOLERANCE), forward=False)

    top = top_hit if top_hit is not None else 0
    bottom = (bottom_hit + 1) if bottom_hit is not None else h
    left = left_hit if left_hit is not None else 0
    right = (right_hit + 1) if right_hit is not None else w
    return left, top, right, bottom


results = {}
for name, fname in FILES.items():
    img = Image.open(f"{SRC_DIR}/{fname}").convert("RGB")
    w, h = img.size
    ref = sample_corner_color(img, w, h)

    left, top, right, bottom = find_edges_flat_canvas(img, w, h, ref)

    cropped = img.crop((left, top, right, bottom))
    out_path = f"{OUT_DIR}/{name}.png"
    cropped.save(out_path, "PNG")

    results[name] = {
        "original_size": [w, h],
        "corner_ref_color": [round(c, 1) for c in ref],
        "crop_box": [left, top, right, bottom],
        "cropped_size": list(cropped.size),
    }
    print(f"{name}: ref={tuple(round(c) for c in ref)} crop={(left, top, right, bottom)} -> {cropped.size}")

with open("/home/claude/template_processing/crop_results.json", "w") as f:
    json.dump(results, f, indent=2)
