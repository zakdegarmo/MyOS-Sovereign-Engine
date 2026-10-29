import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')

import bpy
import math
import os
import json
import time
from PIL import Image

start_total = time.time()
print("======================================================================")
print("=== MyOS 8-Way Modernized LPC Mannequin Spritesheet Synthesizer ===")
print("======================================================================")

BLEND_PATH = os.path.abspath('mannequin_decivoxel_flesh_studio.blend')
bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)
print(f"Loaded: {BLEND_PATH}")

# Output paths
DIR_ACTIONS_PUBLIC = os.path.abspath('apps/web/public/actions')
DIR_ACTIONS_DIST = os.path.abspath('apps/web/dist/actions')
DIR_ARTIFACTS = os.path.abspath('artifacts/spritesheets')
DIR_VERIFY = os.path.abspath('artifacts/verification')
DIR_TEMP = os.path.abspath('artifacts/lpc_filming/raw_8way_temp')

for d in [DIR_ACTIONS_PUBLIC, DIR_ARTIFACTS, DIR_VERIFY, DIR_TEMP]:
    os.makedirs(d, exist_ok=True)
if os.path.exists(os.path.abspath('apps/web/dist')):
    os.makedirs(DIR_ACTIONS_DIST, exist_ok=True)

# 1. Hide unwanted reference billboards and accessories
for o in bpy.data.objects:
    if any(k in o.name for k in ['SideBySide', 'DirectOverlay', 'Mannequin', 'Modular_', 'Chibi_Face']):
        o.hide_render = True
        print(f"Hidden from render: {o.name}")

# Ensure LPC mannequin mesh and face decal are visible
mesh = bpy.data.objects.get('LPC_Decivoxel_Flesh_Fused')
face = bpy.data.objects.get('LPC_Face_Decal')
if mesh: mesh.hide_render = False
if face: face.hide_render = False

# 2. Studio Render Settings
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'

# 3. Camera Setup
cam = bpy.data.objects['RenderCam']
cam.parent = None
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.55
scene.camera = cam

for c in list(cam.constraints):
    cam.constraints.remove(c)

cx, cy, cz = 0.0, -1.28, 0.62
dist = 3.5

# 8 Directions in standard MyOS order:
# Row 0: D  (South / Front)       0 deg
# Row 1: DL (South-West)         45 deg
# Row 2: L  (West / Left)        90 deg
# Row 3: UL (North-West)        135 deg
# Row 4: U  (North / Back)      180 deg
# Row 5: UR (North-East)        225 deg
# Row 6: R  (East / Right)      270 deg
# Row 7: DR (South-East)        315 deg
DIRECTIONS = [
    ("D",  0,   0),
    ("DL", 1,  45),
    ("L",  2,  90),
    ("UL", 3, 135),
    ("U",  4, 180),
    ("UR", 5, 225),
    ("R",  6, 270),
    ("DR", 7, 315),
]

# Actions to render: (action_key, blender_action_name, frame_count)
ACTIONS_TO_FILM = [
    ("walk", "Walk_Loop", 40.0),
    ("idle", "Idle_Loop", 75.0),
]

arm = bpy.data.objects['Armature']

rendered_sheets = {}

for act_key, b_act_name, f_total in ACTIONS_TO_FILM:
    t_act_start = time.time()
    b_act = bpy.data.actions.get(b_act_name)
    if not b_act:
        print(f"ERROR: Action '{b_act_name}' not found in blend file!")
        continue
    
    arm.animation_data.action = b_act
    
    # 8 evenly distributed loop frames
    sampled_frames = [int(round(i * f_total / 8.0)) for i in range(8)]
    print(f"\n---> Filming '{act_key}' ({b_act_name}) with sampled frames: {sampled_frames}")
    
    sheet_1024 = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0)) # 128x128 tiles
    sheet_2048 = Image.new("RGBA", (2048, 2048), (0, 0, 0, 0)) # 256x256 tiles
    
    # Store raw tiles for building animated preview
    matrix_tiles_128 = {d_name: [] for d_name, _, _ in DIRECTIONS}
    
    for d_name, row_idx, deg in DIRECTIONS:
        rad = math.radians(deg)
        cam_x = cx + dist * math.sin(rad)
        cam_y = cy - dist * math.cos(rad)
        cam_z = cz
        
        cam.location = (cam_x, cam_y, cam_z)
        cam.rotation_euler = (math.radians(90), 0, rad)
        
        for col_idx, f_num in enumerate(sampled_frames):
            scene.frame_set(f_num)
            bpy.context.view_layer.update()
            
            raw_filename = f"{act_key}_{d_name}_r{row_idx}_c{col_idx}.png"
            raw_path = os.path.join(DIR_TEMP, raw_filename)
            scene.render.filepath = raw_path
            bpy.ops.render.render(write_still=True)
            
            # Load raw 512px frame
            tile_raw = Image.open(raw_path).convert("RGBA")
            
            # Downsample to 256px
            tile_256 = tile_raw.resize((256, 256), Image.Resampling.LANCZOS)
            sheet_2048.paste(tile_256, (col_idx * 256, row_idx * 256))
            
            # Downsample to 128px
            tile_128 = tile_raw.resize((128, 128), Image.Resampling.LANCZOS)
            sheet_1024.paste(tile_128, (col_idx * 128, row_idx * 128))
            
            matrix_tiles_128[d_name].append(tile_128)
            
        print(f"  [OK] Filmed Row {row_idx}: {d_name:>2} ({deg:>3} deg) - 8 frames")
        
    # Save sheets
    filename_1024 = f"lpc_mannequin_8way_{act_key}.png"
    filename_2048 = f"lpc_mannequin_8way_{act_key}_2048.png"
    
    sheet_1024.save(os.path.join(DIR_ACTIONS_PUBLIC, filename_1024), "PNG")
    sheet_2048.save(os.path.join(DIR_ACTIONS_PUBLIC, filename_2048), "PNG")
    sheet_1024.save(os.path.join(DIR_ARTIFACTS, filename_1024), "PNG")
    sheet_2048.save(os.path.join(DIR_ARTIFACTS, filename_2048), "PNG")
    sheet_1024.save(os.path.join(DIR_VERIFY, filename_1024), "PNG")
    
    if os.path.exists(DIR_ACTIONS_DIST):
        sheet_1024.save(os.path.join(DIR_ACTIONS_DIST, filename_1024), "PNG")
        sheet_2048.save(os.path.join(DIR_ACTIONS_DIST, filename_2048), "PNG")
        
    rendered_sheets[act_key] = f"/actions/{filename_1024}"
    dt = time.time() - t_act_start
    print(f"===> Completed '{act_key}' 8x8 Action Atlas in {dt:.1f}s -> {filename_1024}")
    
    # Generate 8-Way Animated Walk Preview GIF for Walk action
    if act_key == "walk":
        print("\n--- Generating 8-Way Animated Walk Preview GIF ---")
        preview_frames = []
        # Layout: 2 rows of 4 directions:
        # Row 0: D, DL, L, UL
        # Row 1: U, UR, R, DR
        grid_dirs = [
            ["D", "DL", "L", "UL"],
            ["U", "UR", "R", "DR"]
        ]
        comp_w = 4 * 128 # 512
        comp_h = 2 * 128 # 256
        
        for frame_i in range(8):
            comp = Image.new("RGBA", (comp_w, comp_h), (24, 26, 34, 255))
            for gy, r_dirs in enumerate(grid_dirs):
                for gx, dir_code in enumerate(r_dirs):
                    tile = matrix_tiles_128[dir_code][frame_i]
                    comp.paste(tile, (gx * 128, gy * 128), tile)
            preview_frames.append(comp)
            
        gif_path = os.path.join(DIR_VERIFY, "lpc_mannequin_8way_walk_preview.gif")
        preview_frames[0].save(
            gif_path,
            save_all=True,
            append_images=preview_frames[1:],
            duration=125,
            loop=0,
            disposal=2
        )
        print(f"Saved 8-way animated walk preview -> {gif_path}")

# 4. Register in myos_sprites_manifest.json
print("\n--- Registering LPC Mannequin in myos_sprites_manifest.json ---")
manifest_paths = [
    os.path.abspath('apps/web/public/textures/avatars/myos_sprites_manifest.json'),
    os.path.abspath('apps/web/dist/textures/avatars/myos_sprites_manifest.json'),
]

for m_path in manifest_paths:
    if os.path.exists(m_path):
        with open(m_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
            
        manifest['sprites']['lpc_mannequin'] = {
            "id": "lpc_mannequin",
            "name": "LPC Modern Mannequin",
            "category": "characters",
            "badge": "8-WAY LPC EVOLUTION",
            "badgeColor": "bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border-amber-500/50",
            "description": "Modernized Liberated Pixel Cup 3D humanoid mannequin featuring organic decivoxel flesh, authentic 3-tier cel shading, and full 8-directional omni-movement.",
            "tileSize": 128,
            "grid": {
                "cols": 8,
                "rows": 8
            },
            "scale": 1.0,
            "defaultAction": "idle",
            "actions": {
                "idle": "/actions/lpc_mannequin_8way_idle.png",
                "walk": "/actions/lpc_mannequin_8way_walk.png"
            },
            "pillarAlignment": "creation"
        }
        
        with open(m_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2)
        print(f"Successfully registered 'lpc_mannequin' in {m_path}")

dt_all = time.time() - start_total
print(f"\n======================================================================")
print(f"=== ALL 8-WAY LPC MANNEQUIN SPRITESHEETS SYNTHESIZED IN {dt_all:.1f}s ===")
print(f"======================================================================")
