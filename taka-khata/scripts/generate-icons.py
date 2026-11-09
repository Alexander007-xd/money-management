"""Generate the Taka Khata PWA icons.

The app is a paper account book: warm paper background, dark green ink, and a
simple ledger mark. Icons are drawn with Pillow so no extra npm dependency is
needed.

Run from the project root:
    python scripts/generate-icons.py
"""

from __future__ import annotations

import os
from PIL import Image, ImageDraw

PAPER = (251, 247, 239, 255)
INK = (31, 42, 36, 255)
INCOME = (30, 123, 79, 255)
EXPENSE = (181, 65, 47, 255)
LINE = (230, 222, 207, 255)

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "icons")


def draw_icon(size: int, maskable: bool) -> Image.Image:
    """Draw the app mark on a paper square.

    Maskable icons must keep their content inside the safe zone (the middle
    80% of the canvas), so the mark is scaled down and the background fills
    the whole square.
    """
    image = Image.new("RGBA", (size, size), PAPER)
    draw = ImageDraw.Draw(image)

    # Rounded ledger card.
    inset = size * (0.16 if maskable else 0.12)
    radius = size * (0.10 if maskable else 0.14)
    draw.rounded_rectangle(
        [inset, inset, size - inset, size - inset],
        radius=radius,
        fill=(255, 255, 255, 255),
        outline=INK,
        width=max(2, int(size * 0.018)),
    )

    # Ledger lines: two muted rules and one bold ink rule.
    left = inset + size * 0.10
    right = size - inset - size * 0.10
    top = inset + size * 0.16
    gap = size * 0.13
    rule_width = max(2, int(size * 0.016))

    for index in range(3):
        y = top + gap * index
        draw.line([left, y, right, y], fill=LINE, width=rule_width)

    # The bold rule with a green plus and a red minus, like the app's ledger.
    y = top + gap * 2
    draw.line([left, y, right, y], fill=INK, width=max(3, int(size * 0.026)))

    bar = size * 0.055
    cy = y - size * 0.075
    cx = left + size * 0.06

    draw.line([cx - bar, cy, cx + bar, cy], fill=INCOME, width=rule_width)
    draw.line([cx, cy - bar, cx, cy + bar], fill=INCOME, width=rule_width)

    mx = right - size * 0.06
    draw.line([mx - bar, cy, mx + bar, cy], fill=EXPENSE, width=rule_width)

    return image


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)

    targets = [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-maskable-192.png", 192, True),
        ("icon-maskable-512.png", 512, True),
        ("apple-touch-icon.png", 180, False),
        ("favicon.png", 64, False),
    ]

    for name, size, maskable in targets:
        path = os.path.join(OUT_DIR, name)
        draw_icon(size, maskable).save(path, "PNG")
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
