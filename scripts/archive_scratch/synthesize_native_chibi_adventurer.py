import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy, mathutils, math, os, time, json
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

start_time = time.time()
print("=== Starting Native Chibi Adventurer Cel-Shaded Spritesheet Synthesis ===")

DIR_ACTIONS = os.path.abspath('apps/web/public/actions')
DIR_ARTIFACTS = os.path.abspath('artifacts/spritesheets')
DIR_TEMP = os.path.abspath('temp_tiles')
os.makedirs(DIR_ACTIONS, exist_ok=True)
os.makedirs(DIR_ARTIFACTS, exist_ok=True)
os.makedirs(DIR_TEMP, exist_ok=True)

arm = bpy.data.objects['Armature']

# Camera Setup
cam = bpy.data.objects['RenderCam']
cam.parent = None
cam.location = (0.0, -2.60, 0.95)
cam.rotation_euler = (math.radians(78), 0, 0)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.65
bpy.context.scene.camera = cam

scene = bpy.context.scene
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.resolution_x = 256
scene.render.resolution_y = 256

tile_tmp = os.path.join(DIR_TEMP, 'chibi_adv_tile_raw.png')
scene.render.filepath = tile_tmp

DIR_ANGLES = [0, -45, -90, -135, 180, 135, 90, 45]

ACTIONS = [
    ('idle', 'Idle_Loop'),
    ('walk', 'Walk_Loop'),
    ('run', 'Jog_Fwd_Loop'),
    ('slash', 'Melee_Weapon_Attack'),
    ('spellcast', 'Spell_Simple_Shoot'),
    ('hurt', 'Hit_Chest'),
    ('death', 'Death01'),
]

# Stepped 4-Band Cel-Shading & 2px Comic Inking
def cartoonize_tile(im, outline_px=2):
    im = im.convert('RGBA')
    w, h = im.size
    r, g, b, a = im.split()
    alpha_np = np.array(a)
    mask = alpha_np > 25

    im_boost = ImageEnhance.Color(im).enhance(1.25)
    im_boost = ImageEnhance.Contrast(im_boost).enhance(1.15)
    rgb = np.array(im_boost.convert('RGB'), dtype=np.float32) / 255.0

    lum = 0.299 * rgb[:,:,0] + 0.587 * rgb[:,:,1] + 0.114 * rgb[:,:,2]
    lum_cel = np.copy(lum)
    lum_cel[(lum < 0.42) & mask] = 0.46
    lum_cel[(lum >= 0.42) & (lum < 0.65) & mask] = 0.68
    lum_cel[(lum >= 0.65) & (lum < 0.85) & mask] = 0.86
    lum_cel[(lum >= 0.85) & mask] = 1.00

    scale = np.ones_like(lum)
    np.divide(lum_cel, lum, out=scale, where=(lum > 0.04))
    scale = np.clip(scale, 0.6, 1.35)
    rgb_cel = np.clip(rgb * np.expand_dims(scale, 2), 0.0, 1.0)

    # Major crease inking
    dx = np.zeros_like(lum)
    dy = np.zeros_like(lum)
    dx[:, 1:-1] = lum[:, 2:] - lum[:, :-2]
    dy[1:-1, :] = lum[2:, :] - lum[:-2, :]
    grad = np.sqrt(dx**2 + dy**2)

    # Exclude anime face decal from crease lines
    y_coords, x_coords = np.ogrid[:h, :w]
    face_box = (x_coords >= 105) & (x_coords <= 150) & (y_coords >= 70) & (y_coords <= 118)

    is_seam = (grad > 0.30) & mask & (~face_box)
    ink_color = np.array([0.08, 0.09, 0.13])
    for c in range(3):
        rgb_cel[is_seam, c] = rgb_cel[is_seam, c] * 0.25 + ink_color[c] * 0.75

    char_img = Image.fromarray((rgb_cel * 255).astype(np.uint8))
    char_img.putalpha(a)

    sil = Image.fromarray((mask * 255).astype(np.uint8))
    sil_dil = sil.filter(ImageFilter.MaxFilter(2 * outline_px + 1))
    outline_mask = np.array(sil_dil) > 100

    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ink_outline = Image.new('RGBA', (w, h), (18, 20, 30, 255))
    out.paste(ink_outline, (0, 0), Image.fromarray((outline_mask * 255).astype(np.uint8)))
    out.paste(char_img, (0, 0), char_img)
    return out

rendered_manifest_actions = {}

for act_key, b_act_name in ACTIONS:
    t0 = time.time()
    b_act = bpy.data.actions.get(b_act_name)
    if not b_act:
        print(f"WARNING: Action '{b_act_name}' not found, skipping.")
        continue

    arm.animation_data.action = b_act

    f_start = int(b_act.frame_range[0])
    f_end = int(b_act.frame_range[1])
    f_len = max(1, f_end - f_start)
    sample_frames = [int(round(f_start + i * (f_len / 8.0))) for i in range(8)]

    sheet = Image.new('RGBA', (2048, 2048), (0, 0, 0, 0))

    for row_idx, deg in enumerate(DIR_ANGLES):
        arm.rotation_euler = (0, 0, math.radians(deg))
        for col_idx, f in enumerate(sample_frames):
            scene.frame_set(f)
            bpy.context.view_layer.update()
            bpy.ops.render.render(write_still=True)

            raw_tile = Image.open(tile_tmp)
            drawn_tile = cartoonize_tile(raw_tile, outline_px=2)
            sheet.paste(drawn_tile, (col_idx * 256, row_idx * 256))

    arm.rotation_euler = (0, 0, 0)

    filename = f"chibi_adventurer_{act_key}_loop.png"
    out_web_path = os.path.join(DIR_ACTIONS, filename)
    out_art_path = os.path.join(DIR_ARTIFACTS, filename)
    sheet.save(out_web_path)
    sheet.save(out_art_path)

    # 1024px version
    filename_1024 = f"chibi_adventurer_{act_key}_1024.png"
    sheet_1024 = sheet.resize((1024, 1024), Image.Resampling.LANCZOS)
    sheet_1024.save(os.path.join(DIR_ACTIONS, filename_1024))
    sheet_1024.save(os.path.join(DIR_ARTIFACTS, filename_1024))

    rendered_manifest_actions[act_key] = f"/actions/{filename}"
    dt = time.time() - t0
    print(f"Rendered & Cel-Shaded Native Chibi Adventurer '{act_key}': 64 tiles in {dt:.1f}s -> {filename}")

total_elapsed = time.time() - start_time
print(f"=== NATIVE CHIBI ADVENTURER SYNTHESIS COMPLETED in {total_elapsed:.1f}s ===")
