import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy, mathutils, math, os, time, json
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
import cv2

start_time = time.time()
print("=== Starting MyOS 8x8 Drawn Anime Cel Action Spritesheet Synthesis ===")

# Output directories
DIR_ACTIONS = os.path.abspath('apps/web/public/actions')
DIR_ARTIFACTS = os.path.abspath('artifacts/spritesheets')
DIR_TEMP = os.path.abspath('temp_tiles')
os.makedirs(DIR_ACTIONS, exist_ok=True)
os.makedirs(DIR_ARTIFACTS, exist_ok=True)
os.makedirs(DIR_TEMP, exist_ok=True)

# 1. Setup Calibrated Studio 3-Sun + Chin Fill Lighting
for o in list(bpy.data.objects):
    if o.type == 'LIGHT':
        bpy.data.objects.remove(o, do_unlink=True)

def add_sun(name, loc, energy, color, target=(0.0, 0.0, 0.75)):
    ldata = bpy.data.lights.new(name=name, type='SUN')
    ldata.energy = energy
    ldata.color = color
    lobj = bpy.data.objects.new(name=name, object_data=ldata)
    lobj.location = loc
    bpy.context.scene.collection.objects.link(lobj)
    dx = target[0] - loc[0]
    dy = target[1] - loc[1]
    dz = target[2] - loc[2]
    rot = mathutils.Vector((dx, dy, dz)).to_track_quat('-Z', 'Y').to_euler()
    lobj.rotation_euler = rot
    return lobj

# Key Sun (warm high-angle key from front-right)
add_sun("KeySun", (3.0, -4.0, 5.5), 3.8, (1.0, 0.98, 0.92), (0.0, 0.0, 0.75))
# Fill Sun (cool sky fill from front-left)
add_sun("FillSun", (-3.5, -3.0, 3.5), 2.0, (0.65, 0.82, 1.0), (0.0, 0.0, 0.75))
# Rim Sun (lavender hair backlight from rear)
add_sun("RimSun", (0.0, 4.5, 4.0), 2.5, (0.85, 0.75, 1.0), (0.0, 0.0, 0.75))
# Face & Chin Bounce Fill (soft warm upward fill from below camera to eliminate chin shadows)
add_sun("FaceFill", (0.0, -3.5, 0.6), 1.4, (1.0, 0.94, 0.90), (0.0, 0.0, 1.18))

# World ambient lighting
world = bpy.context.scene.world
if world and world.node_tree:
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (0.5, 0.55, 0.65, 1.0)
        bg.inputs['Strength'].default_value = 0.45

# View settings
bpy.context.scene.view_settings.view_transform = 'Standard'
bpy.context.scene.view_settings.exposure = 0.0

# 2. Material & Mesh Calibration
# Skin material
man = bpy.data.objects.get('Mannequin')
if man and man.data.materials:
    mat_skin = man.data.materials[0]
    bsdf_skin = mat_skin.node_tree.nodes.get('Principled BSDF')
    if bsdf_skin:
        # Healthy warm anime peach tone
        bsdf_skin.inputs['Base Color'].default_value = (0.90, 0.55, 0.38, 1.0)
        bsdf_skin.inputs['Roughness'].default_value = 0.85
        bsdf_skin.inputs['Specular IOR Level'].default_value = 0.1

# Hair material & shadows
hair = bpy.data.objects.get('Modular_Hair_Adventurer')
if hair:
    hair.visible_shadow = False # Prevent bangs from casting harsh shadow over face
    if hair.data.materials:
        bsdf_hair = hair.data.materials[0].node_tree.nodes.get('Principled BSDF')
        if bsdf_hair:
            bsdf_hair.inputs['Roughness'].default_value = 0.75
            bsdf_hair.inputs['Specular IOR Level'].default_value = 0.1

# Face Decal material (unlit crisp anime features)
face = bpy.data.objects.get('Chibi_Face_Decal')
if face:
    face.visible_shadow = False
    face.hide_render = False
    if face.data.materials:
        mat_face = face.data.materials[0]
        bsdf_face = mat_face.node_tree.nodes.get('Principled BSDF')
        tex_node = mat_face.node_tree.nodes.get('FaceTexture')
        if tex_node and tex_node.image:
            tex_node.image.reload()
            if bsdf_face:
                mat_face.node_tree.links.new(tex_node.outputs['Color'], bsdf_face.inputs['Emission Color'])
                bsdf_face.inputs['Emission Strength'].default_value = 1.0
                bsdf_face.inputs['Base Color'].default_value = (0, 0, 0, 1)
                bsdf_face.inputs['Specular IOR Level'].default_value = 0.0

# Ensure visibility of character components
for name in ['Mannequin', 'Modular_Adventurer_Tunic', 'Modular_Adventurer_Pants', 
             'Modular_Adventurer_Boots', 'Modular_Hair_Adventurer', 
             'Modular_1H_Sword', 'Modular_Round_Shield', 'Chibi_Face_Decal']:
    obj = bpy.data.objects.get(name)
    if obj:
        obj.hide_viewport = False
        obj.hide_render = False

# Ensure hat and staff are hidden
for name in ['Modular_Mage_Hat', 'Modular_2H_Staff', 'Modular_Knight_Cape']:
    obj = bpy.data.objects.get(name)
    if obj:
        obj.hide_viewport = True
        obj.hide_render = True

# Camera setup
cam = bpy.data.objects['RenderCam']
cam.parent = None
cam.location = (0.0, -2.60, 0.95)
cam.rotation_euler = (math.radians(78), 0, 0)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.65
bpy.context.scene.camera = cam

# Scene render settings
scene = bpy.context.scene
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.resolution_x = 256
scene.render.resolution_y = 256

arm = bpy.data.objects['Armature']
arm.parent = None
arm.location = (0, 0, 0)
arm.data.pose_position = 'POSE'

# 8 Directions in exact MyOS Standard Order:
# Row 0: D (facing front / south) -> 0 deg
# Row 1: DL (facing front-left / south-west) -> -45 deg
# Row 2: L (facing left / west) -> -90 deg
# Row 3: UL (facing back-left / north-west) -> -135 deg
# Row 4: U (facing back / north) -> 180 deg
# Row 5: UR (facing back-right / north-east) -> 135 deg
# Row 6: R (facing right / east) -> 90 deg
# Row 7: DR (facing front-right / south-east) -> 45 deg
DIR_ANGLES = [0, -45, -90, -135, 180, 135, 90, 45]

# Actions mapping: (action_key, blend_action_name)
ACTIONS = [
    ('idle', 'Idle_Loop'),
    ('walk', 'Walk_Loop'),
    ('run', 'Jog_Fwd_Loop'),
    ('slash', 'Melee_Weapon_Attack'),
    ('spellcast', 'Spell_Simple_Shoot'),
    ('hurt', 'Hit_Chest'),
    ('death', 'Death01'),
]

tile_tmp = os.path.join(DIR_TEMP, 'render_tile_raw.png')
scene.render.filepath = tile_tmp

# 3. Tabletop Miniature Painting & Drawn Anime Cel-Shading Engine
def cartoonize_tile(im, outline_px=2, zenithal_strength=0.25, wash_strength=0.45, highlight_strength=0.30):
    """
    Applies Tabletop Miniature Techniques to 2D Anime Cel Rendering:
    - Bilateral edge-preserving smoothing (eliminates digital grain/noise)
    - Digital Zenithal Priming (directional top-down lighting volume)
    - Recess 'Nuln Oil' Wash (capillary crevice darkening in seams and folds)
    - Edge 'Drybrush' Highlighting (accentuating armor, weapons, and locks)
    - Atmospheric Color Glazing (warm sunlit highlights, cool slate shadows)
    - 4-Band Stepped Cel Quantization (clean anime color planes)
    - Comic Silhouette & Crease Inking (protective eye exclusion)
    """
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

    # 1. Bilateral Smoothing on Luminance
    lum_raw = 0.299 * rgb[:,:,0] + 0.587 * rgb[:,:,1] + 0.114 * rgb[:,:,2]
    lum_u8 = (np.clip(lum_raw, 0, 1) * 255).astype(np.uint8)
    lum_smooth_u8 = cv2.bilateralFilter(lum_u8, d=7, sigmaColor=35, sigmaSpace=5)
    lum_smooth = lum_smooth_u8.astype(np.float32) / 255.0

    # 2. Digital Zenithal Priming (Vertical Falloff + Surface Orientation)
    norm_y = y_idx / float(h)
    zenith_falloff = np.clip(1.0 - (norm_y - 0.20) * 0.32, 0.78, 1.15)
    
    dy = np.zeros_like(lum_smooth)
    dy[1:-1, :] = lum_smooth[:-2, :] - lum_smooth[2:, :]
    local_zenith = np.clip(1.0 + dy * 1.4, 0.85, 1.20)
    
    zenith_map = (zenith_falloff * (1.0 - zenithal_strength)) + (local_zenith * zenithal_strength)
    rgb_zenith = np.clip(rgb * np.expand_dims(zenith_map, 2), 0.0, 1.0)

    # 3. Recess 'Nuln Oil' Wash (Crevice Pigment Pooling)
    k_sm = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    k_med = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    
    tophat_sm = cv2.morphologyEx(lum_smooth_u8, cv2.MORPH_BLACKHAT, k_sm).astype(np.float32) / 255.0
    tophat_med = cv2.morphologyEx(lum_smooth_u8, cv2.MORPH_BLACKHAT, k_med).astype(np.float32) / 255.0
    
    cavity = np.clip(tophat_sm * 1.1 + tophat_med * 0.7, 0.0, 1.0)
    cavity = cv2.GaussianBlur(cavity, (3, 3), 0)
    cavity[face_mask] *= 0.10

    wash_color = np.array([0.08, 0.09, 0.13]) # Citadel Nuln Oil rich charcoal
    wash_factor = np.expand_dims(cavity * wash_strength, 2)
    rgb_washed = rgb_zenith * (1.0 - wash_factor) + wash_color * wash_factor

    # 4. 'Drybrushing' & Edge Catch-Lights
    whitehat = cv2.morphologyEx(lum_smooth_u8, cv2.MORPH_TOPHAT, k_sm).astype(np.float32) / 255.0
    lap = cv2.Laplacian(lum_smooth_u8, cv2.CV_32F, ksize=3)
    ridge = np.clip(-lap / 255.0, 0.0, 1.0)
    
    highlight_raw = np.clip(whitehat * 1.0 + ridge * 0.6, 0.0, 1.0)
    highlight_smooth = cv2.GaussianBlur(highlight_raw, (3, 3), 0)
    highlight_smooth[face_mask] *= 0.15
    
    highlight_boost = np.expand_dims(highlight_smooth * highlight_strength, 2)
    rgb_highlighted = np.clip(rgb_washed * (1.0 + highlight_boost), 0.0, 1.0)

    # 5. Atmospheric Color Glaze (Warm Sun Zenith / Cool Slate Shade)
    cur_lum = 0.299 * rgb_highlighted[:,:,0] + 0.587 * rgb_highlighted[:,:,1] + 0.114 * rgb_highlighted[:,:,2]
    warm_tint = np.array([1.03, 1.01, 0.97])
    cool_tint = np.array([0.95, 0.97, 1.05])
    t = np.clip((cur_lum - 0.35) / 0.35, 0.0, 1.0)
    glaze = cool_tint * (1.0 - np.expand_dims(t, 2)) + warm_tint * np.expand_dims(t, 2)
    rgb_glazed = np.clip(rgb_highlighted * glaze, 0.0, 1.0)

    # 6. Stepped Anime Cel Quantization (4-Band Posterization)
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

    # 7. Comic Silhouette & Major Seam Inking
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

# 4. Render All Actions
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

    # 8 evenly distributed keyframe indices across animation cycle
    sample_frames = [int(round(f_start + i * (f_len / 8.0))) for i in range(8)]

    sheet = Image.new('RGBA', (2048, 2048), (0, 0, 0, 0))

    for row_idx, deg in enumerate(DIR_ANGLES):
        arm.rotation_euler = (0, 0, math.radians(deg))
        for col_idx, f in enumerate(sample_frames):
            scene.frame_set(f)
            bpy.context.view_layer.update()
            bpy.ops.render.render(write_still=True)

            raw_tile = Image.open(tile_tmp)
            # Apply Cel-Shading & Inking Pass
            drawn_tile = cartoonize_tile(raw_tile, outline_px=2)
            sheet.paste(drawn_tile, (col_idx * 256, row_idx * 256))

    arm.rotation_euler = (0, 0, 0)

    # Save 256px True HD Master Sheet (2048x2048)
    filename = f"chibi_adventurer_{act_key}_loop.png"
    out_web_path = os.path.join(DIR_ACTIONS, filename)
    out_art_path = os.path.join(DIR_ARTIFACTS, filename)
    sheet.save(out_web_path)
    sheet.save(out_art_path)

    # Save 128px Classic Downsampled Sheet (1024x1024)
    filename_1024 = f"chibi_adventurer_{act_key}_1024.png"
    sheet_1024 = sheet.resize((1024, 1024), Image.Resampling.LANCZOS)
    sheet_1024.save(os.path.join(DIR_ACTIONS, filename_1024))
    sheet_1024.save(os.path.join(DIR_ARTIFACTS, filename_1024))

    rendered_manifest_actions[act_key] = f"/actions/{filename}"
    dt = time.time() - t0
    print(f"Rendered & Cel-Shaded '{act_key}' ({b_act_name}): 64 tiles in {dt:.1f}s -> {filename}")

# 5. Update Manifest
manifest_path = os.path.abspath('apps/web/public/textures/avatars/myos_sprites_manifest.json')
if os.path.exists(manifest_path):
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest_data = json.load(f)

    manifest_data['sprites']['chibi_adventurer'] = {
        "id": "chibi_adventurer",
        "name": "Chibi Adventurer",
        "category": "heroes",
        "badge": "VOLUMETRIC HERO",
        "badgeColor": "bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border-emerald-500/50",
        "description": "True HD drawn anime cel hero with comic inking, studio lighting, medieval laced tunic, tapered breeches, adventurer boots, anime hair, sword, and shield.",
        "tileSize": 256,
        "grid": { "cols": 8, "rows": 8 },
        "scale": 1.0,
        "defaultAction": "idle",
        "actions": rendered_manifest_actions,
        "pillarAlignment": "unity"
    }

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest_data, f, indent=2)
    print("Updated myos_sprites_manifest.json with 'chibi_adventurer' entry!")

# Also register in mephit_manifest.json
mephit_manifest_path = os.path.abspath('apps/web/public/assets/mephit_manifest.json')
if os.path.exists(mephit_manifest_path):
    with open(mephit_manifest_path, 'r', encoding='utf-8') as f:
        mephit_data = json.load(f)
    if 'archetypes' in mephit_data:
        mephit_data['archetypes']['chibi_adventurer'] = {
            "id": "chibi_adventurer",
            "name": "Chibi Adventurer",
            "role": "Volumetric Hero",
            "personality": "True HD drawn anime cel hero with comic inking, studio lighting, medieval laced tunic, tapered breeches, adventurer boots, anime hair, sword, and shield.",
            "assetType": "myos_8way",
            "assetUrl": "/actions/chibi_adventurer_idle_loop.png",
            "scale": 1.0,
            "pillarScores": {
                "self": 80,
                "thought": 75,
                "logic": 70,
                "unity": 95,
                "existence": 85,
                "improvement": 90,
                "mastery": 85,
                "resonance": 80,
                "transcendence": 70,
                "omniscience": 65
            }
        }
        with open(mephit_manifest_path, 'w', encoding='utf-8') as f:
            json.dump(mephit_data, f, indent=4)
        print("Updated mephit_manifest.json with 'chibi_adventurer' archetype!")

# 6. Save Blend File Permanently
bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest5.blend')
print("Successfully saved mannequin_chibi_basic_rigTest5.blend with studio lights and cel materials!")

# 7. Export Master GLB
glb_path = os.path.abspath('apps/web/public/assets/mannequin_chibi_master.glb')
os.makedirs(os.path.dirname(glb_path), exist_ok=True)
arm.data.pose_position = 'REST'
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()

bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    use_selection=False,
    export_apply=False,
    export_animations=True
)
print(f"Exported master 3D asset to {glb_path}!")

total_elapsed = time.time() - start_time
print(f"=== ALL SPRITESHEET AND CEL TASKS COMPLETED in {total_elapsed:.1f}s ===")
