import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy, mathutils, math, os, time, json, argparse
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
import cv2

# Miniature Painting Cel Shader
def cartoonize_tile(im, outline_px=2, zenithal_strength=0.25, wash_strength=0.45, highlight_strength=0.30):
    im = im.convert('RGBA')
    w, h = im.size
    r, g, b, a = im.split()
    alpha = np.array(a, dtype=np.float32) / 255.0
    mask = alpha > 0.1

    im_boost = ImageEnhance.Color(im).enhance(1.22)
    rgb = np.array(im_boost.convert('RGB'), dtype=np.float32) / 255.0

    y_idx, x_idx = np.ogrid[:h, :w]
    face_mask = (
        (x_idx >= int(0.40 * w)) & (x_idx <= int(0.60 * w)) &
        (y_idx >= int(0.24 * h)) & (y_idx <= int(0.45 * h))
    )

    # 1. Bilateral smoothing
    lum_raw = 0.299 * rgb[:,:,0] + 0.587 * rgb[:,:,1] + 0.114 * rgb[:,:,2]
    lum_u8 = (np.clip(lum_raw, 0, 1) * 255).astype(np.uint8)
    lum_smooth_u8 = cv2.bilateralFilter(lum_u8, d=7, sigmaColor=35, sigmaSpace=5)
    lum_smooth = lum_smooth_u8.astype(np.float32) / 255.0

    # 2. Digital Zenithal Priming
    norm_y = y_idx / float(h)
    zenith_falloff = np.clip(1.0 - (norm_y - 0.20) * 0.32, 0.78, 1.15)
    dy = np.zeros_like(lum_smooth)
    dy[1:-1, :] = lum_smooth[:-2, :] - lum_smooth[2:, :]
    local_zenith = np.clip(1.0 + dy * 1.4, 0.85, 1.20)
    zenith_map = (zenith_falloff * (1.0 - zenithal_strength)) + (local_zenith * zenithal_strength)
    rgb_zenith = np.clip(rgb * np.expand_dims(zenith_map, 2), 0.0, 1.0)

    # 3. Recess Nuln Oil Wash
    k_sm = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    k_med = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    tophat_sm = cv2.morphologyEx(lum_smooth_u8, cv2.MORPH_BLACKHAT, k_sm).astype(np.float32) / 255.0
    tophat_med = cv2.morphologyEx(lum_smooth_u8, cv2.MORPH_BLACKHAT, k_med).astype(np.float32) / 255.0
    cavity = np.clip(tophat_sm * 1.1 + tophat_med * 0.7, 0.0, 1.0)
    cavity = cv2.GaussianBlur(cavity, (3, 3), 0)
    cavity[face_mask] *= 0.10

    wash_color = np.array([0.08, 0.09, 0.13])
    wash_factor = np.expand_dims(cavity * wash_strength, 2)
    rgb_washed = rgb_zenith * (1.0 - wash_factor) + wash_color * wash_factor

    # 4. Drybrush Edge Catch-Lights
    whitehat = cv2.morphologyEx(lum_smooth_u8, cv2.MORPH_TOPHAT, k_sm).astype(np.float32) / 255.0
    lap = cv2.Laplacian(lum_smooth_u8, cv2.CV_32F, ksize=3)
    ridge = np.clip(-lap / 255.0, 0.0, 1.0)
    highlight_smooth = cv2.GaussianBlur(np.clip(whitehat * 1.0 + ridge * 0.6, 0.0, 1.0), (3, 3), 0)
    highlight_smooth[face_mask] *= 0.15
    highlight_boost = np.expand_dims(highlight_smooth * highlight_strength, 2)
    rgb_highlighted = np.clip(rgb_washed * (1.0 + highlight_boost), 0.0, 1.0)

    # 5. Atmospheric Color Glaze
    cur_lum = 0.299 * rgb_highlighted[:,:,0] + 0.587 * rgb_highlighted[:,:,1] + 0.114 * rgb_highlighted[:,:,2]
    warm_tint = np.array([1.03, 1.01, 0.97])
    cool_tint = np.array([0.95, 0.97, 1.05])
    t = np.clip((cur_lum - 0.35) / 0.35, 0.0, 1.0)
    glaze = cool_tint * (1.0 - np.expand_dims(t, 2)) + warm_tint * np.expand_dims(t, 2)
    rgb_glazed = np.clip(rgb_highlighted * glaze, 0.0, 1.0)

    # 6. Stepped Anime Cel Quantization
    lum_final = 0.299 * rgb_glazed[:,:,0] + 0.587 * rgb_glazed[:,:,1] + 0.114 * rgb_glazed[:,:,2]
    lum_final_u8 = (np.clip(lum_final, 0, 1) * 255).astype(np.uint8)
    lum_final_smooth = cv2.bilateralFilter(lum_final_u8, d=5, sigmaColor=30, sigmaSpace=4).astype(np.float32) / 255.0

    lum_cel = np.copy(lum_final_smooth)
    lum_cel[(lum_final_smooth < 0.38) & mask] = 0.44
    lum_cel[(lum_final_smooth >= 0.38) & (lum_final_smooth < 0.64) & mask] = 0.68
    lum_cel[(lum_final_smooth >= 0.64) & (lum_final_smooth < 0.84) & mask] = 0.86
    lum_cel[(lum_final_smooth >= 0.84) & mask] = 1.00

    scale = np.ones_like(lum_final)
    np.divide(lum_cel, lum_final, out=scale, where=(lum_final > 0.03))
    scale = np.clip(scale, 0.65, 1.30)
    rgb_cel = np.clip(rgb_glazed * np.expand_dims(scale, 2), 0.0, 1.0)

    # 7. Comic Silhouette & Inking
    dx_cel = np.zeros_like(lum_final_smooth)
    dy_cel = np.zeros_like(lum_final_smooth)
    dx_cel[:, 1:-1] = lum_final_smooth[:, 2:] - lum_final_smooth[:, :-2]
    dy_cel[1:-1, :] = lum_final_smooth[2:, :] - lum_final_smooth[:-2, :]
    grad = np.sqrt(dx_cel**2 + dy_cel**2)
    
    is_seam = (grad > 0.30) & mask & (~face_mask)
    ink_color = np.array([0.08, 0.09, 0.14])
    for c in range(3):
        rgb_cel[is_seam, c] = rgb_cel[is_seam, c] * 0.20 + ink_color[c] * 0.80

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

HERO_SPECS = {
    "fighter": {
        "blend": "chibi_adventurer_production.blend",
        "prefix": "chibi_adventurer",
        "alias_prefix": "chibi_fighter",
        "manifest_id": "chibi_fighter",
        "name": "Chibi Fighter",
        "cam_loc": (0.0, -2.60, 0.95),
        "cam_rot": (math.radians(78), 0, 0),
        "ortho_scale": 1.65,
    },
    "paladin": {
        "blend": "sunlit_paladin_chibi_master.blend",
        "prefix": "sunlit_paladin",
        "alias_prefix": "chibi_paladin",
        "manifest_id": "sunlit_paladin",
        "name": "Sunlit Paladin",
        "cam_loc": (0.0, -2.65, 0.95),
        "cam_rot": (math.radians(78), 0, 0),
        "ortho_scale": 1.65,
    },
    "mage": {
        "blend": "moonlit_mage_chibi_master.blend",
        "prefix": "moonlit_mage",
        "alias_prefix": "chibi_mage",
        "manifest_id": "moonlit_mage",
        "name": "Moonlit Mage",
        "cam_loc": (0.0, -2.65, 0.95),
        "cam_rot": (math.radians(78), 0, 0),
        "ortho_scale": 1.65,
    },
    "rogue": {
        "blend": "shadow_rogue_chibi_master.blend",
        "prefix": "shadow_rogue",
        "alias_prefix": "shadow_rogue",
        "manifest_id": "shadow_rogue",
        "name": "Shadow Rogue",
        "cam_loc": (0.0, -2.75, 0.90),
        "cam_rot": (math.radians(78), 0, 0),
        "ortho_scale": 1.70,
    }
}

ACTIONS = [
    ('idle', 'Idle_Loop'),
    ('walk', 'Walk_Loop'),
    ('run', 'Jog_Fwd_Loop'),
    ('slash', 'Melee_Weapon_Attack'),
    ('spellcast', 'Spell_Simple_Shoot'),
    ('hurt', 'Hit_Chest'),
    ('death', 'Death01'),
]

DIR_ANGLES = [0, -45, -90, -135, 180, 135, 90, 45]

DIR_ACTIONS = os.path.abspath('apps/web/public/actions')
DIR_ARTIFACTS = os.path.abspath('artifacts/spritesheets')
DIR_TEMP = os.path.abspath('temp_tiles')
os.makedirs(DIR_ACTIONS, exist_ok=True)
os.makedirs(DIR_ARTIFACTS, exist_ok=True)
os.makedirs(DIR_TEMP, exist_ok=True)

def render_hero(hero_key: str):
    spec = HERO_SPECS.get(hero_key)
    if not spec:
        print(f"Unknown hero: {hero_key}")
        return

    print(f"\n========================================================")
    print(f"FILMING MASTER SPRITESHEETS: {spec['name']} ({spec['blend']})")
    print(f"Shading: Tabletop Miniature Painting + Anime Cel Inking")
    print(f"========================================================")

    bpy.ops.wm.open_mainfile(filepath=spec['blend'])
    scene = bpy.context.scene

    # Setup Camera
    cam = bpy.data.objects.get('RenderCam')
    if not cam:
        cdata = bpy.data.cameras.new('RenderCam')
        cam = bpy.data.objects.new('RenderCam', cdata)
        bpy.context.scene.collection.objects.link(cam)

    cam.parent = None
    cam.location = spec['cam_loc']
    cam.rotation_euler = spec['cam_rot']
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = spec['ortho_scale']
    scene.camera = cam

    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256

    tile_tmp = os.path.join(DIR_TEMP, f"{hero_key}_render_tile_raw.png")
    scene.render.filepath = tile_tmp

    arm = bpy.data.objects.get('Armature')
    if not arm:
        print(f"ERROR: Armature not found in {spec['blend']}")
        return

    arm.parent = None
    arm.location = (0, 0, 0)
    arm.data.pose_position = 'POSE'

    rendered_actions = {}

    for act_key, b_act_name in ACTIONS:
        t0 = time.time()
        b_act = bpy.data.actions.get(b_act_name)
        if not b_act:
            print(f"  WARNING: Action '{b_act_name}' not found, skipping.")
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
                cel_tile = cartoonize_tile(raw_tile, outline_px=2)
                sheet.paste(cel_tile, (col_idx * 256, row_idx * 256))

        arm.rotation_euler = (0, 0, 0)

        # Save True HD 2048px sheet
        filename = f"{spec['prefix']}_{act_key}_loop.png"
        sheet.save(os.path.join(DIR_ACTIONS, filename))
        sheet.save(os.path.join(DIR_ARTIFACTS, filename))

        # Also save alias if different
        if spec['alias_prefix'] != spec['prefix']:
            alias_filename = f"{spec['alias_prefix']}_{act_key}_loop.png"
            sheet.save(os.path.join(DIR_ACTIONS, alias_filename))

        # Save 1024px sheet
        filename_1024 = f"{spec['prefix']}_{act_key}_1024.png"
        sheet_1024 = sheet.resize((1024, 1024), Image.Resampling.LANCZOS)
        sheet_1024.save(os.path.join(DIR_ACTIONS, filename_1024))
        sheet_1024.save(os.path.join(DIR_ARTIFACTS, filename_1024))

        if spec['alias_prefix'] != spec['prefix']:
            alias_1024 = f"{spec['alias_prefix']}_{act_key}_1024.png"
            sheet_1024.save(os.path.join(DIR_ACTIONS, alias_1024))

        rendered_actions[act_key] = f"/actions/{filename}"
        dt = time.time() - t0
        print(f"  Rendered & Cel-Shaded '{act_key}' ({b_act_name}): 64 frames in {dt:.1f}s -> {filename}")

    # Update manifests
    update_manifests(spec, rendered_actions)
    print(f"Completed filming {spec['name']} successfully!")

def update_manifests(spec: dict, rendered_actions: dict):
    manifest_path = os.path.abspath('apps/web/public/textures/avatars/myos_sprites_manifest.json')
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest_data = json.load(f)

        for mid in [spec['manifest_id'], spec['prefix'], spec['alias_prefix']]:
            if mid in manifest_data.get('sprites', {}):
                manifest_data['sprites'][mid]['actions'] = rendered_actions

        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2)
        print(f"  Updated myos_sprites_manifest.json for {spec['name']}!")

if __name__ == "__main__":
    # Check command line args
    # When run with Blender: blender -b --python script.py -- [hero_name]
    argv = sys.argv
    if "--" in argv:
        args = argv[argv.index("--") + 1:]
    else:
        args = []

    target = args[0] if args else "all"

    if target == "all":
        for h in ["fighter", "paladin", "mage", "rogue"]:
            render_hero(h)
    else:
        render_hero(target)
