import os
import json
import numpy as np
import cv2
from PIL import Image, ImageEnhance

def apply_miniature_cel(im, outline_px=2, zenithal_strength=0.18, wash_strength=0.30, highlight_strength=0.25):
    im = im.convert('RGBA')
    w, h = im.size
    r, g, b, a = im.split()
    alpha = np.array(a, dtype=np.float32) / 255.0

    im_boost = ImageEnhance.Color(im).enhance(1.15)
    rgb = np.array(im_boost.convert('RGB'), dtype=np.float32) / 255.0

    lum_raw = 0.299 * rgb[:,:,0] + 0.587 * rgb[:,:,1] + 0.114 * rgb[:,:,2]
    lum_u8 = (np.clip(lum_raw, 0, 1) * 255).astype(np.uint8)
    lum_smooth_u8 = cv2.bilateralFilter(lum_u8, d=5, sigmaColor=28, sigmaSpace=4)

    # Nuln Oil Cavity Wash
    k_sm = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    cavity = cv2.morphologyEx(lum_smooth_u8, cv2.MORPH_BLACKHAT, k_sm).astype(np.float32) / 255.0
    cavity = cv2.GaussianBlur(cavity, (3, 3), 0)
    wash_color = np.array([0.08, 0.08, 0.12])
    wash_factor = np.expand_dims(cavity * wash_strength, 2)
    rgb_washed = rgb * (1.0 - wash_factor) + wash_color * wash_factor

    # Drybrush Edge Highlight
    whitehat = cv2.morphologyEx(lum_smooth_u8, cv2.MORPH_TOPHAT, k_sm).astype(np.float32) / 255.0
    highlight_smooth = cv2.GaussianBlur(whitehat, (3, 3), 0)
    highlight_boost = np.expand_dims(highlight_smooth * highlight_strength, 2)
    rgb_highlighted = np.clip(rgb_washed * (1.0 + highlight_boost), 0.0, 1.0)

    # Comic Inking with subtle organic line boil
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (outline_px * 2 + 1, outline_px * 2 + 1))
    dilated_alpha = cv2.dilate(alpha, kernel, iterations=1)
    boundary = (dilated_alpha - alpha) > 0.22
    boundary_3d = np.expand_dims(boundary, 2)
    outline_color = np.array([0.05, 0.04, 0.06])
    rgb_final = np.where(boundary_3d, outline_color, rgb_highlighted)
    out_alpha = np.where(dilated_alpha > 0.05, 1.0, 0.0)

    out_arr = np.dstack([np.clip(rgb_final * 255, 0, 255).astype(np.uint8), np.clip(out_alpha * 255, 0, 255).astype(np.uint8)])
    return Image.fromarray(out_arr, mode="RGBA")

raw_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee\juiced_frames"
out_sheet_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee_juiced_idle.png"
out_gif_front = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee_juiced_front.gif"
out_gif_turntable = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee_juiced_turntable.gif"

tile_size = 128
cols = 8
rows = 4

sheet = Image.new("RGBA", (cols * tile_size, rows * tile_size), (0, 0, 0, 0))

front_frames = []
all_direction_frames = []
dirs = ["N", "W", "S", "E"]

for r, d_name in enumerate(dirs):
    dir_row = []
    for c in range(cols):
        f_name = f"frame_{r}_{d_name}_{c}.png"
        f_path = os.path.join(raw_dir, f_name)
        if not os.path.exists(f_path):
            continue
        im = Image.open(f_path)
        im_down = im.resize((tile_size, tile_size), Image.Resampling.LANCZOS)
        im_cel = apply_miniature_cel(im_down, outline_px=1)
        
        sheet.paste(im_cel, (c * tile_size, r * tile_size), im_cel)
        
        if d_name == "S":
            front_frames.append(im_cel)
        dir_row.append(im_cel)
    all_direction_frames.append(dir_row)

sheet.save(out_sheet_path)
print(f"JUICED Spritesheet saved: {out_sheet_path} ({sheet.size})")

# Animated Front GIF with variable timing for the inhale flare
if front_frames:
    # 85ms base, slightly held on max inhale on frame 2 (130ms)
    durations = [85, 90, 130, 85, 85, 85, 85, 85]
    front_frames[0].save(
        out_gif_front,
        save_all=True,
        append_images=front_frames[1:],
        duration=durations,
        loop=0,
        disposal=2
    )
    print(f"JUICED Front GIF saved: {out_gif_front}")

turntable = []
for d_idx in [2, 1, 0, 3]:
    turntable.extend(all_direction_frames[d_idx])

if turntable:
    turntable[0].save(
        out_gif_turntable,
        save_all=True,
        append_images=turntable[1:],
        duration=80,
        loop=0,
        disposal=2
    )
    print(f"JUICED Turntable GIF saved: {out_gif_turntable}")

# Register in manifest
manifest_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\myos_sprites_manifest.json"
try:
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    manifest["sprites"]["doob_bee_juiced"] = {
        "id": "doob_bee_juiced",
        "name": "Doob-bee (Juiced)",
        "category": "characters",
        "badge": "DISNEY JUICE RIG",
        "badgeColor": "bg-rose-500/20 text-rose-300 border-rose-500/40",
        "description": "Juiced-up Doob-bee featuring dynamic joint combustion flare, springy antenna whip physics, sleepy eye blink, expanding smoke ring exhale, and rapid buzzing wings.",
        "tileSize": 128,
        "grid": {
            "cols": 8,
            "rows": 4
        },
        "scale": 1.0,
        "defaultAction": "idle",
        "actions": {
            "idle": "/actions/doob_bee_juiced_idle.png"
        },
        "pillarAlignment": "creation"
    }

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print("Successfully registered doob_bee_juiced in manifest!")
except Exception as e:
    print(f"Failed to update manifest: {e}")
