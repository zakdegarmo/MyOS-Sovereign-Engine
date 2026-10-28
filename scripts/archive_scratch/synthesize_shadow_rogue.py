import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy, mathutils, math, os, time, json
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

start_time = time.time()
print("=== Starting Unified Shadow Rogue Cel-Shaded Action Spritesheet Synthesis ===")

# Output directories
DIR_ACTIONS = os.path.abspath('apps/web/public/actions')
DIR_ARTIFACTS = os.path.abspath('artifacts/spritesheets')
DIR_TEMP = os.path.abspath('temp_tiles')
os.makedirs(DIR_ACTIONS, exist_ok=True)
os.makedirs(DIR_ARTIFACTS, exist_ok=True)
os.makedirs(DIR_TEMP, exist_ok=True)

# 1. Studio Lighting Calibration
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

# Key Sun (high-angle key from front-right)
add_sun("KeySun", (3.0, -4.0, 5.5), 3.8, (1.0, 0.98, 0.92), (0.0, 0.0, 0.75))
# Fill Sun (cool sky fill from front-left)
add_sun("FillSun", (-3.5, -3.0, 3.5), 2.0, (0.65, 0.82, 1.0), (0.0, 0.0, 0.75))
# Rim Sun (crimson/lavender backlight from rear to highlight cowl silhouette)
add_sun("RimSun", (0.0, 4.5, 4.0), 3.0, (0.95, 0.45, 0.65), (0.0, 0.0, 0.75))
# Face & Chin Bounce Fill
add_sun("FaceFill", (0.0, -3.5, 0.6), 1.2, (1.0, 0.90, 0.90), (0.0, 0.0, 1.18))

# Ambient
world = bpy.context.scene.world
if world and world.node_tree:
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (0.35, 0.38, 0.45, 1.0)
        bg.inputs['Strength'].default_value = 0.40

bpy.context.scene.view_settings.view_transform = 'Standard'
bpy.context.scene.view_settings.exposure = 0.0

# 2. Camera Setup (snug framing for chibi rogue)
cam = bpy.data.objects.get('RenderCam')
if not cam:
    cam_data = bpy.data.cameras.new('RenderCam')
    cam = bpy.data.objects.new('RenderCam', cam_data)
    bpy.context.collection.objects.link(cam)

cam.parent = None
cam.location = (0.0, -2.75, 0.90)
cam.rotation_euler = (math.radians(78), 0, 0)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.70
bpy.context.scene.camera = cam

# Render Settings
scene = bpy.context.scene
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.resolution_x = 256
scene.render.resolution_y = 256

tile_tmp = os.path.join(DIR_TEMP, 'rogue_render_tile_raw.png')
scene.render.filepath = tile_tmp

arm = bpy.data.objects['Armature']
arm.parent = None
arm.location = (0, 0, 0)
arm.data.pose_position = 'POSE'

# 8 Directions in standard MyOS order:
DIR_ANGLES = [0, -45, -90, -135, 180, 135, 90, 45]

# 7 Actions
ACTIONS = [
    ('idle', 'Idle_Loop'),
    ('walk', 'Walk_Loop'),
    ('run', 'Jog_Fwd_Loop'),
    ('slash', 'Melee_Weapon_Attack'),
    ('spellcast', 'Spell_Simple_Shoot'),
    ('hurt', 'Hit_Chest'),
    ('death', 'Death01'),
]

# 3. Drawn Anime Cel-Shading & Comic Inking Algorithm
def cartoonize_tile(im, outline_px=2):
    im = im.convert('RGBA')
    w, h = im.size
    r, g, b, a = im.split()
    alpha_np = np.array(a)
    mask = alpha_np > 25

    # A. Color & Contrast Pop
    im_boost = ImageEnhance.Color(im).enhance(1.25)
    im_boost = ImageEnhance.Contrast(im_boost).enhance(1.15)
    rgb = np.array(im_boost.convert('RGB'), dtype=np.float32) / 255.0

    # B. Stepped Anime Cel-Shading
    lum = 0.299 * rgb[:,:,0] + 0.587 * rgb[:,:,1] + 0.114 * rgb[:,:,2]
    lum_cel = np.copy(lum)
    lum_cel[(lum < 0.38) & mask] = 0.42
    lum_cel[(lum >= 0.38) & (lum < 0.62) & mask] = 0.65
    lum_cel[(lum >= 0.62) & (lum < 0.82) & mask] = 0.84
    lum_cel[(lum >= 0.82) & mask] = 1.00

    scale = np.ones_like(lum)
    np.divide(lum_cel, lum, out=scale, where=(lum > 0.04))
    scale = np.clip(scale, 0.65, 1.30)
    rgb_cel = np.clip(rgb * np.expand_dims(scale, 2), 0.0, 1.0)

    # C. Major Crease / Seam Inking
    dx = np.zeros_like(lum)
    dy = np.zeros_like(lum)
    dx[:, 1:-1] = lum[:, 2:] - lum[:, :-2]
    dy[1:-1, :] = lum[2:, :] - lum[:-2, :]
    grad = np.sqrt(dx**2 + dy**2)

    # Exclude eye/face decal area
    y_coords, x_coords = np.ogrid[:h, :w]
    face_box = (x_coords >= 105) & (x_coords <= 150) & (y_coords >= 72) & (y_coords <= 116)

    is_seam = (grad > 0.28) & mask & (~face_box)
    ink_color = np.array([0.06, 0.07, 0.10])
    for c in range(3):
        rgb_cel[is_seam, c] = rgb_cel[is_seam, c] * 0.25 + ink_color[c] * 0.75

    # D. Bold Comic Silhouette Outline
    char_img = Image.fromarray((rgb_cel * 255).astype(np.uint8))
    char_img.putalpha(a)

    sil = Image.fromarray((mask * 255).astype(np.uint8))
    sil_dil = sil.filter(ImageFilter.MaxFilter(2 * outline_px + 1))
    outline_mask = np.array(sil_dil) > 100

    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ink_outline = Image.new('RGBA', (w, h), (14, 16, 22, 255))
    out.paste(ink_outline, (0, 0), Image.fromarray((outline_mask * 255).astype(np.uint8)))
    out.paste(char_img, (0, 0), char_img)
    return out

# 4. Render All 7 Actions x 8 Angles (448 Frames)
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

    # Save 256px True HD Master Sheet (2048x2048)
    filename = f"shadow_rogue_{act_key}_loop.png"
    out_web_path = os.path.join(DIR_ACTIONS, filename)
    out_art_path = os.path.join(DIR_ARTIFACTS, filename)
    sheet.save(out_web_path)
    sheet.save(out_art_path)

    # Save 128px Classic Downsampled Sheet (1024x1024)
    filename_1024 = f"shadow_rogue_{act_key}_1024.png"
    sheet_1024 = sheet.resize((1024, 1024), Image.Resampling.LANCZOS)
    sheet_1024.save(os.path.join(DIR_ACTIONS, filename_1024))
    sheet_1024.save(os.path.join(DIR_ARTIFACTS, filename_1024))

    rendered_manifest_actions[act_key] = f"/actions/{filename}"
    dt = time.time() - t0
    print(f"Rendered & Cel-Shaded '{act_key}' ({b_act_name}): 64 tiles in {dt:.1f}s -> {filename}")

# 5. Update Manifests
manifest_path = os.path.abspath('apps/web/public/textures/avatars/myos_sprites_manifest.json')
if os.path.exists(manifest_path):
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest_data = json.load(f)

    manifest_data['sprites']['shadow_rogue'] = {
        "id": "shadow_rogue",
        "name": "Shadow Rogue",
        "category": "heroes",
        "badge": "PHANTOM ASSASSIN",
        "badgeColor": "bg-gradient-to-r from-red-600/30 to-purple-600/30 text-red-300 border-red-500/50",
        "description": "True HD drawn anime cel shadow assassin with comic inking, hooded cowl with crimson silk piping, glowing crimson phantom mask, obsidian studded leather brigandine, and dual curved stealth daggers.",
        "tileSize": 256,
        "grid": { "cols": 8, "rows": 8 },
        "scale": 1.0,
        "defaultAction": "idle",
        "actions": rendered_manifest_actions,
        "pillarAlignment": "logic"
    }

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest_data, f, indent=2)
    print("Updated myos_sprites_manifest.json with 'shadow_rogue' entry!")

mephit_manifest_path = os.path.abspath('apps/web/public/assets/mephit_manifest.json')
if os.path.exists(mephit_manifest_path):
    with open(mephit_manifest_path, 'r', encoding='utf-8') as f:
        mephit_data = json.load(f)
    if 'archetypes' in mephit_data:
        mephit_data['archetypes']['shadow_rogue'] = {
            "id": "shadow_rogue",
            "name": "Shadow Rogue",
            "role": "Phantom Assassin",
            "personality": "A lethal shadow operative cloaked in deep obsidian leather, peering through a hooded cowl with glowing crimson eyes, striking with dual curved daggers.",
            "assetType": "myos_8way",
            "assetUrl": "/actions/shadow_rogue_idle_loop.png",
            "scale": 1.0,
            "pillarScores": {
                "self": 95,
                "thought": 85,
                "logic": 90,
                "unity": 60,
                "existence": 90,
                "improvement": 85,
                "mastery": 95,
                "resonance": 70,
                "transcendence": 75,
                "omniscience": 70
            }
        }
        with open(mephit_manifest_path, 'w', encoding='utf-8') as f:
            json.dump(mephit_data, f, indent=4)
        print("Updated mephit_manifest.json with 'shadow_rogue' archetype!")

# 6. Export Master GLB
glb_path = os.path.abspath('apps/web/public/assets/shadow_rogue_chibi_master.glb')
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
print(f"=== ALL SHADOW ROGUE SPRITESHEET AND CEL TASKS COMPLETED in {total_elapsed:.1f}s ===")
