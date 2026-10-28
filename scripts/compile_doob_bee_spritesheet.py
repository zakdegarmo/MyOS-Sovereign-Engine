import os
import json
import numpy as np
import cv2
from PIL import Image, ImageEnhance

def apply_miniature_cel(im, outline_px=2, zenithal_strength=0.20, wash_strength=0.35, highlight_strength=0.25):
    im = im.convert('RGBA')
    w, h = im.size
    r, g, b, a = im.split()
    alpha = np.array(a, dtype=np.float32) / 255.0

    im_boost = ImageEnhance.Color(im).enhance(1.18)
    rgb = np.array(im_boost.convert('RGB'), dtype=np.float32) / 255.0

    y_idx, x_idx = np.ogrid[:h, :w]
    lum_raw = 0.299 * rgb[:,:,0] + 0.587 * rgb[:,:,1] + 0.114 * rgb[:,:,2]
    lum_u8 = (np.clip(lum_raw, 0, 1) * 255).astype(np.uint8)
    lum_smooth_u8 = cv2.bilateralFilter(lum_u8, d=5, sigmaColor=30, sigmaSpace=4)

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

    # Inking Outline
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (outline_px * 2 + 1, outline_px * 2 + 1))
    dilated_alpha = cv2.dilate(alpha, kernel, iterations=1)
    boundary = (dilated_alpha - alpha) > 0.25
    boundary_3d = np.expand_dims(boundary, 2)
    outline_color = np.array([0.05, 0.04, 0.05])
    rgb_final = np.where(boundary_3d, outline_color, rgb_highlighted)
    out_alpha = np.where(dilated_alpha > 0.05, 1.0, 0.0)

    out_arr = np.dstack([np.clip(rgb_final * 255, 0, 255).astype(np.uint8), np.clip(out_alpha * 255, 0, 255).astype(np.uint8)])
    return Image.fromarray(out_arr, mode="RGBA")

raw_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee\raw_frames"
out_sheet_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee_idle.png"
out_gif_front = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee_front_hover.gif"
out_gif_turntable = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee_turntable.gif"

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
print(f"Master Spritesheet saved: {out_sheet_path} ({sheet.size})")

# Fast buzzing wing rate (75ms per frame)
if front_frames:
    front_frames[0].save(
        out_gif_front,
        save_all=True,
        append_images=front_frames[1:],
        duration=75,
        loop=0,
        disposal=2
    )
    print(f"Front Hover GIF saved: {out_gif_front}")

# Turntable GIF (S, W, N, E)
turntable = []
for d_idx in [2, 1, 0, 3]: # S, W, N, E
    turntable.extend(all_direction_frames[d_idx])

if turntable:
    turntable[0].save(
        out_gif_turntable,
        save_all=True,
        append_images=turntable[1:],
        duration=75,
        loop=0,
        disposal=2
    )
    print(f"Turntable GIF saved: {out_gif_turntable}")

# Register into myos_sprites_manifest.json
manifest_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\myos_sprites_manifest.json"
try:
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    manifest["sprites"]["doob_bee"] = {
        "id": "doob_bee",
        "name": "Doob-bee",
        "category": "characters",
        "badge": "MUTATED HYBRID",
        "badgeColor": "bg-amber-500/20 text-amber-300 border-amber-500/40",
        "description": "Anthropomorphic honey bee fusing C's 2 golden wings and violet anime face, A's upright body & boots, and B's bold bumblebee stripes, smoking a lit joint while hovering.",
        "tileSize": 128,
        "grid": {
            "cols": 8,
            "rows": 4
        },
        "scale": 1.0,
        "defaultAction": "idle",
        "actions": {
            "idle": "/actions/doob_bee_idle.png"
        },
        "pillarAlignment": "creation"
    }

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print("Successfully registered doob_bee in myos_sprites_manifest.json!")
except Exception as e:
    print(f"Failed to update manifest: {e}")
