# scripts/tools/generate_retro_posters.py
import os
import math
from PIL import Image, ImageDraw, ImageFont

POSTERS_DIR = os.path.abspath("apps/web/public/textures/posters")
os.makedirs(POSTERS_DIR, exist_ok=True)

def generate_cybercycle():
    w, h = 600, 900
    img = Image.new("RGB", (w, h), "#0f051d")
    draw = ImageDraw.Draw(img)

    # Synthwave gradient background
    for y in range(h):
        ratio = y / h
        if ratio < 0.45:
            # Deep purple to magenta
            r = int(15 + (192 - 15) * (ratio / 0.45))
            g = int(5 + (38 - 5) * (ratio / 0.45))
            b = int(29 + (211 - 29) * (ratio / 0.45))
        elif ratio < 0.7:
            # Magenta to vibrant orange
            t = (ratio - 0.45) / 0.25
            r = int(192 + (249 - 192) * t)
            g = int(38 + (115 - 38) * t)
            b = int(211 + (22 - 211) * t)
        else:
            # Orange to deep twilight
            t = (ratio - 0.7) / 0.3
            r = int(249 * (1 - t * 0.8))
            g = int(115 * (1 - t * 0.8))
            b = int(22 + 40 * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Giant glowing synth sun
    sun_cx, sun_cy, sun_r = w // 2, 440, 140
    for r in range(sun_r, 0, -2):
        t = 1.0 - (r / sun_r)
        sr = int(253)
        sg = int(224 - 50 * t)
        sb = int(71 - 40 * t)
        draw.ellipse([sun_cx - r, sun_cy - r, sun_cx + r, sun_cy + r], fill=(sr, sg, sb))

    # Sun horizontal slice blinds
    for y in range(sun_cy - 20, sun_cy + sun_r, 22):
        bar_h = 3 + int((y - (sun_cy - 20)) * 0.08)
        draw.rectangle([(sun_cx - sun_r - 10, y), (sun_cx + sun_r + 10, y + bar_h)], fill="#3b0764")

    # Perspective 3D Grid Floor
    grid_y_start = 540
    for y in range(grid_y_start, h, 28):
        draw.line([(0, y), (w, y)], fill="#22d3ee", width=2)
    for x in range(-200, w + 200, 60):
        draw.line([(sun_cx, grid_y_start), (x, h)], fill="#22d3ee", width=2)

    # Silhouette unicycle rider
    ux, uy = sun_cx, 530
    draw.ellipse([ux - 45, uy - 45, ux + 45, uy + 45], fill="#0f051d", outline="#f43f5e", width=4)
    draw.line([(ux, uy), (ux, uy - 75)], fill="#0f051d", width=8)
    draw.polygon([(ux - 35, uy - 75), (ux + 35, uy - 75), (ux + 15, uy - 90), (ux - 15, uy - 90)], fill="#f43f5e")

    # Typography
    draw.rectangle([(20, 20), (w - 20, 160)], fill="#09090b", outline="#f43f5e", width=4)
    draw.text((w // 2 - 190, 35), "SUPER CYBER-CYCLE", fill="#ffffff")
    draw.text((w // 2 - 40, 95), "64", fill="#fde047")
    draw.text((w // 2 - 130, 840), "THE FUTURE HAS ONE WHEEL", fill="#e2e8f0")

    p = os.path.join(POSTERS_DIR, "poster_cybercycle.png")
    img.save(p)
    print("Saved:", p)

def generate_glyphrider():
    w, h = 600, 900
    img = Image.new("RGB", (w, h), "#030712")
    draw = ImageDraw.Draw(img)

    # Neon arcade grid & torus knot curve
    for y in range(h):
        r = int(3 + 20 * (y / h))
        g = int(7 + 45 * (y / h))
        b = int(18 + 90 * (y / h))
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Torus knot wireframe pattern
    cx, cy = w // 2, 460
    points = []
    for deg in range(0, 720, 4):
        rad = math.radians(deg)
        r = 160 + 60 * math.sin(rad * 3)
        px = cx + int(r * math.cos(rad * 2))
        py = cy + int(r * math.sin(rad * 2) * 0.65)
        points.append((px, py))
    for i in range(len(points) - 1):
        draw.line([points[i], points[i+1]], fill="#06b6d4", width=3)

    draw.rectangle([(20, 25), (w - 20, 150)], fill="#0f172a", outline="#06b6d4", width=4)
    draw.text((w // 2 - 160, 45), "GLYPHRIDER 2000", fill="#38bdf8")
    draw.text((w // 2 - 180, 100), "HIGH-VELOCITY TORUS COMBAT", fill="#a5f3fc")
    draw.text((w // 2 - 140, 835), "INSERT COIN TO RIDE", fill="#facc15")

    p = os.path.join(POSTERS_DIR, "poster_glyphrider.png")
    img.save(p)
    print("Saved:", p)

def generate_outlaw():
    w, h = 600, 900
    img = Image.new("RGB", (w, h), "#18181b")
    draw = ImageDraw.Draw(img)

    # Heavy industrial metal / fire burst
    for y in range(h):
        ratio = y / h
        r = int(50 + 160 * ratio * (0.8 + 0.2 * math.sin(ratio * 10)))
        g = int(15 + 40 * ratio)
        b = int(10 + 20 * ratio)
        draw.line([(0, y), (w, y)], fill=(min(255, r), min(255, g), min(255, b)))

    # Iron cog & skull motif
    cx, cy = w // 2, 460
    draw.ellipse([cx - 150, cy - 150, cx + 150, cy + 150], fill="#09090b", outline="#e2e8f0", width=8)
    # Cog teeth
    for i in range(12):
        ang = i * (math.pi / 6)
        tx = cx + int(170 * math.cos(ang))
        ty = cy + int(170 * math.sin(ang))
        draw.rectangle([tx - 18, ty - 18, tx + 18, ty + 18], fill="#cbd5e1")

    # Center chopper wheel
    draw.ellipse([cx - 90, cy - 90, cx + 90, cy + 90], fill="#dc2626", outline="#ffffff", width=5)

    draw.rectangle([(25, 30), (w - 25, 170)], fill="#000000", outline="#ef4444", width=5)
    draw.text((w // 2 - 130, 48), "OUTLAW UNICYCLE", fill="#ef4444")
    draw.text((w // 2 - 155, 110), "CHOPPER REVENGE '94", fill="#fde047")
    draw.text((w // 2 - 165, 830), "BORN TO SPIN • NEVER COMPACTED", fill="#ffffff")

    p = os.path.join(POSTERS_DIR, "poster_outlaw.png")
    img.save(p)
    print("Saved:", p)

def generate_radical():
    w, h = 600, 900
    img = Image.new("RGB", (w, h), "#022c22")
    draw = ImageDraw.Draw(img)

    # 90s rad checkerboard & speed streaks
    for y in range(h):
        t = y / h
        draw.line([(0, y), (w, y)], fill=(int(10 + 20 * t), int(80 + 120 * t), int(60 + 60 * t)))

    # Yellow / Black hazard stripes
    for i in range(-200, w + 200, 40):
        draw.polygon([(i, 350), (i + 20, 350), (i + 140, 520), (i + 120, 520)], fill="#facc15")

    draw.rectangle([(30, 35), (w - 30, 160)], fill="#042f2e", outline="#14b8a6", width=4)
    draw.text((w // 2 - 145, 55), "RADICAL RACERS", fill="#2dd4bf")
    draw.text((w // 2 - 120, 110), "TOTAL MONO-SPIN", fill="#fef08a")
    draw.text((w // 2 - 170, 835), "SPEED IS NOTHING WITHOUT BALANCE", fill="#ffffff")

    p = os.path.join(POSTERS_DIR, "poster_radical.png")
    img.save(p)
    print("Saved:", p)

def generate_rug():
    w, h = 800, 600
    img = Image.new("RGB", (w, h), "#3f1a24")
    draw = ImageDraw.Draw(img)

    # Weathered border
    draw.rectangle([(25, 25), (w - 25, h - 25)], outline="#c29b38", width=16)
    draw.rectangle([(45, 45), (w - 45, h - 45)], outline="#1e293b", width=8)

    # Diamond motif
    cx, cy = w // 2, h // 2
    draw.polygon([(cx, 80), (w - 120, cy), (cx, h - 80), (120, cy)], fill="#831843", outline="#d97706")
    draw.polygon([(cx, 160), (w - 220, cy), (cx, h - 160), (220, cy)], fill="#0f172a", outline="#fbbf24")

    p = os.path.join(POSTERS_DIR, "rug_garage.png")
    img.save(p)
    print("Saved:", p)

if __name__ == "__main__":
    generate_cybercycle()
    generate_glyphrider()
    generate_outlaw()
    generate_radical()
    generate_rug()
    print("All retro textures generated successfully!")
