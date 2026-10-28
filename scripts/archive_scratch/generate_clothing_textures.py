from PIL import Image, ImageDraw, ImageFilter
import os, math

os.makedirs('assets/textures', exist_ok=True)

w, h = 1024, 1024
tunic_img = Image.new('RGBA', (w, h), (46, 124, 78, 255))
draw = ImageDraw.Draw(tunic_img)

# Subtle cloth grain
for y in range(0, h, 4):
    c = 44 + (y % 8)
    draw.line([(0, y), (w, y)], fill=(c, 120 + (y % 6), 76 + (y % 4), 255), width=2)

torso_w = 665  # 0 to 0.65 of 1024
cx_front = int(0.325 * 1023)  # Exact midpoint of torso (332px)

# 1. Collar Gold Trim (V in [0.93, 1.00] -> Y in [0, 71])
y_col_end = int((1.0 - 0.93) * 1023)
draw.rectangle([(0, 0), (torso_w, y_col_end)], fill=(232, 185, 58, 255))
draw.line([(0, y_col_end - 4), (torso_w, y_col_end - 4)], fill=(160, 120, 25, 255), width=3)
draw.line([(0, y_col_end + 2), (torso_w, y_col_end + 2)], fill=(28, 80, 50, 255), width=2)

# 2. Skirt Hem Gold Trim (V in [0.00, 0.07] -> Y in [952, 1023])
y_hem_start = int((1.0 - 0.07) * 1023)
draw.rectangle([(0, y_hem_start), (torso_w, 1023)], fill=(232, 185, 58, 255))
draw.line([(0, y_hem_start + 4), (torso_w, y_hem_start + 4)], fill=(160, 120, 25, 255), width=3)
draw.line([(0, y_hem_start - 2), (torso_w, y_hem_start - 2)], fill=(28, 80, 50, 255), width=2)

# 3. Belt (V in [0.28, 0.39] -> Y in [624, 736])
y_belt_top = int((1.0 - 0.39) * 1023)
y_belt_bot = int((1.0 - 0.28) * 1023)
draw.rectangle([(0, y_belt_top), (torso_w, y_belt_bot)], fill=(62, 36, 18, 255))
# Belt stitching
draw.line([(0, y_belt_top + 6), (torso_w, y_belt_top + 6)], fill=(195, 155, 105, 255), width=2)
draw.line([(0, y_belt_bot - 6), (torso_w, y_belt_bot - 6)], fill=(195, 155, 105, 255), width=2)

# Belt Notch Holes
for notch_x in range(cx_front + 75, cx_front + 240, 32):
    ny = (y_belt_top + y_belt_bot) // 2
    draw.ellipse([(notch_x - 4, ny - 4), (notch_x + 4, ny + 4)], fill=(25, 12, 6, 255), outline=(140, 105, 70, 255), width=2)

# Belt Buckle (Center Front at cx_front = 332)
bw, bh = 55, 46
by_mid = (y_belt_top + y_belt_bot) // 2
bx0, bx1 = cx_front - bw, cx_front + bw
by0, by1 = by_mid - bh, by_mid + bh
# Buckle shadow
draw.rounded_rectangle([(bx0 + 3, by0 + 4), (bx1 + 3, by1 + 4)], radius=8, fill=(20, 10, 5, 180))
# Buckle outer gold frame
draw.rounded_rectangle([(bx0, by0), (bx1, by1)], radius=8, fill=(248, 204, 68, 255), outline=(165, 125, 28, 255), width=4)
# Inner cutout (shows leather belt underneath)
draw.rounded_rectangle([(bx0 + 13, by0 + 12), (bx1 - 13, by1 - 12)], radius=5, fill=(62, 36, 18, 255), outline=(160, 120, 25, 255), width=3)
# Buckle tongue / prong
draw.rectangle([(cx_front - 4, by0 + 6), (cx_front + 4, by1 - 6)], fill=(255, 225, 95, 255), outline=(165, 125, 28, 255), width=1)

# 4. Chest Placket & Criss-Cross Lacing (V in [0.55, 0.90] -> Y in [102, 460])
y_plac_top = int((1.0 - 0.90) * 1023)
y_plac_bot = int((1.0 - 0.55) * 1023)
pw_top = 105  # Nice generous width across chest!
pw_bot = 35

points = [
    (cx_front - pw_top, y_plac_top),
    (cx_front + pw_top, y_plac_top),
    (cx_front + pw_bot, y_plac_bot),
    (cx_front - pw_bot, y_plac_bot)
]
draw.polygon(points, fill=(235, 226, 208, 255))
# Placket border
draw.line([(cx_front - pw_top, y_plac_top), (cx_front - pw_bot, y_plac_bot)], fill=(48, 26, 14, 255), width=5)
draw.line([(cx_front + pw_top, y_plac_top), (cx_front + pw_bot, y_plac_bot)], fill=(48, 26, 14, 255), width=5)
draw.line([(cx_front - pw_bot, y_plac_bot), (cx_front + pw_bot, y_plac_bot)], fill=(48, 26, 14, 255), width=5)

# 4 pairs of eyelets & criss-cross laces
n_pairs = 4
eyelet_coords = []
for i in range(n_pairs):
    frac = (i + 0.5) / float(n_pairs)
    ey = int(y_plac_top + frac * (y_plac_bot - y_plac_top))
    half_w = int(pw_top + frac * (pw_bot - pw_top)) - 16
    lx = cx_front - half_w
    rx = cx_front + half_w
    eyelet_coords.append((lx, rx, ey))

# Under-lace shadow
for i in range(len(eyelet_coords) - 1):
    lx0, rx0, ey0 = eyelet_coords[i]
    lx1, rx1, ey1 = eyelet_coords[i + 1]
    draw.line([(lx0, ey0 + 2), (rx1, ey1 + 2)], fill=(30, 15, 6, 140), width=7)
    draw.line([(rx0, ey0 + 2), (lx1, ey1 + 2)], fill=(30, 15, 6, 140), width=7)

# Leather laces
for i in range(len(eyelet_coords) - 1):
    lx0, rx0, ey0 = eyelet_coords[i]
    lx1, rx1, ey1 = eyelet_coords[i + 1]
    draw.line([(lx0, ey0), (rx1, ey1)], fill=(96, 56, 28, 255), width=5)
    draw.line([(rx0, ey0), (lx1, ey1)], fill=(96, 56, 28, 255), width=5)

# Eyelet Grommets (Brass circles)
for lx, rx, ey in eyelet_coords:
    for ex in [lx, rx]:
        draw.ellipse([(ex - 9, ey - 9), (ex + 9, ey + 9)], fill=(245, 202, 65, 255), outline=(155, 115, 22, 255), width=3)
        draw.ellipse([(ex - 4, ey - 4), (ex + 4, ey + 4)], fill=(28, 14, 6, 255))

# 5. Sleeves (Right 30% of texture: X in [690, 1000])
for sl_y0, sl_y1 in [(40, 480), (530, 970)]:
    draw.rectangle([(690, sl_y0), (1000, sl_y1)], fill=(44, 120, 76, 255))
    # Turned-up gold cuff
    draw.rectangle([(690, sl_y1 - 42), (1000, sl_y1)], fill=(232, 185, 58, 255))
    draw.line([(690, sl_y1 - 42), (1000, sl_y1 - 42)], fill=(160, 120, 25, 255), width=3)
    # Cuff stitch line
    draw.line([(690, sl_y1 - 12), (1000, sl_y1 - 12)], fill=(185, 145, 95, 255), width=2)

tunic_img.save('assets/textures/tunic_stylized_diffuse.png')
print('Regenerated tunic_stylized_diffuse.png with bold placket and buckle!')

# -------------------------------------------------------------
# 2. PANTS TEXTURE (1024 x 1024)
# -------------------------------------------------------------
pants_img = Image.new('RGBA', (w, h), (50, 54, 66, 255))
draw_p = ImageDraw.Draw(pants_img)

for d in range(-h, w + h, 6):
    draw_p.line([(d, 0), (d + h, h)], fill=(45, 49, 60, 255), width=2)

for lx0, lx1, is_left in [(20, 490, True), (530, 1000, False)]:
    # Waistband
    draw_p.rectangle([(lx0, 0), (lx1, 75)], fill=(36, 40, 50, 255))
    draw_p.line([(lx0, 75), (lx1, 75)], fill=(65, 72, 88, 255), width=3)
    draw_p.line([(lx0, 35), (lx1, 35)], fill=(75, 82, 100, 255), width=2)

    # Outer seam piping
    seam_x = lx0 + 20 if is_left else lx1 - 20
    draw_p.line([(seam_x, 75), (seam_x, 920)], fill=(78, 86, 108, 255), width=5)
    draw_p.line([(seam_x + 3, 75), (seam_x + 3, 920)], fill=(30, 34, 42, 255), width=2)

    # Ankle Cuff Gathering & Drawstring
    draw_p.rectangle([(lx0, 915), (lx1, 1023)], fill=(38, 42, 52, 255))
    draw_p.line([(lx0, 915), (lx1, 915)], fill=(72, 80, 100, 255), width=3)
    for px in range(lx0 + 20, lx1 - 20, 28):
        draw_p.line([(px, 915), (px, 985)], fill=(26, 28, 36, 255), width=3)
        draw_p.line([(px + 2, 915), (px + 2, 985)], fill=(65, 72, 88, 255), width=1)
    
    # Leather bow / knot
    bow_x = (lx0 + lx1) // 2
    bow_y = 952
    draw_p.ellipse([(bow_x - 14, bow_y - 9), (bow_x + 14, bow_y + 9)], fill=(118, 80, 48, 255), outline=(62, 40, 22, 255), width=2)
    draw_p.line([(bow_x - 12, bow_y), (bow_x - 32, bow_y + 28)], fill=(118, 80, 48, 255), width=5)
    draw_p.line([(bow_x + 12, bow_y), (bow_x + 32, bow_y + 28)], fill=(118, 80, 48, 255), width=5)

pants_img.save('assets/textures/pants_stylized_diffuse.png')
print('Regenerated pants_stylized_diffuse.png!')
