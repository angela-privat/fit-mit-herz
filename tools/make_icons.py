# Erzeugt die App-Symbole (Herz auf Korallen-Hintergrund). Start: python tools/make_icons.py
from pathlib import Path
from PIL import Image, ImageDraw
import math

OUT = Path(__file__).resolve().parent.parent / "icons"
OUT.mkdir(exist_ok=True)
CORAL = (226, 105, 74)
SUN = (238, 169, 59)
CREAM = (255, 247, 240)


def heart_points(cx, cy, s, n=400):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * s, cy - y * s))
    return pts


def make(size, maskable=False):
    big = size * 4
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable:
        d.rectangle([0, 0, big, big], fill=CORAL)
        scale = 0.55
    else:
        r = int(big * 0.22)
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=r, fill=CORAL)
        scale = 0.72
    # warmer Lichtschein oben rechts
    glow = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([big * 0.45, -big * 0.25, big * 1.25, big * 0.55], fill=SUN + (90,))
    img = Image.alpha_composite(img, Image.composite(glow, Image.new("RGBA", (big, big)), img.split()[3]))
    d = ImageDraw.Draw(img)
    s = big * scale / 34
    d.polygon(heart_points(big / 2, big * 0.52, s), fill=CREAM)
    # kleine Bewegungslinie (Puls) im Herz
    w = big * scale
    x0, y0 = big / 2 - w * 0.30, big * 0.50
    line = [(x0, y0), (x0 + w * 0.16, y0), (x0 + w * 0.24, y0 - w * 0.14), (x0 + w * 0.33, y0 + w * 0.12),
            (x0 + w * 0.41, y0 - w * 0.04), (x0 + w * 0.60, y0 - w * 0.04)]
    d.line(line, fill=CORAL, width=int(big * 0.035), joint="curve")
    for p in (line[0], line[-1]):
        rr = big * 0.0175
        d.ellipse([p[0] - rr, p[1] - rr, p[0] + rr, p[1] + rr], fill=CORAL)
    return img.resize((size, size), Image.LANCZOS)


make(192).save(OUT / "icon-192.png")
make(512).save(OUT / "icon-512.png")
make(512, maskable=True).save(OUT / "icon-maskable-512.png")
print("Symbole erstellt in", OUT)
