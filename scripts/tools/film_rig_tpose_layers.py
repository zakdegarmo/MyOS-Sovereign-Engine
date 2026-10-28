"""
film_rig_tpose_layers.py
Films the 8-directional T-pose of:
1. The Octahedral Rig-Mesh Visualizer (apps/web/public/actions/rig_tpose_8way.png)
2. The Flesh Decivoxel Mannequin (apps/web/public/actions/flesh_tpose_8way.png)
And calculates the 2D screen-space projected bone pivots for all 8 compass directions
(apps/web/public/actions/rig_bone_pivots_8way.json).
"""

import sys
sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")

import bpy
import bpy_extras
import math
import os
import json
import tempfile
from PIL import Image

def film_layers(blend_path="artifacts/mixamo_rig_studio.blend", out_dir="apps/web/public/actions", resolution=256):
    blend_path = os.path.abspath(blend_path)
    out_dir = os.path.abspath(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    
    # Camera setup
    cam = bpy.data.objects['RenderCam']
    cam_rot = bpy.data.objects['Cam_Rot_Empty']
    tgt = bpy.data.objects['CamTarget']
    
    cam_rot.location = (0.0, 0.0, 0.69)
    tgt.location = (0.0, 0.0, 0.69)
    cam.location = (0.0, -3.10, 0.30)
    cam.data.type = 'PERSP'
    cam.data.lens = 45.0
    
    arm = bpy.data.objects['Armature']
    arm.data.pose_position = 'REST'
    arm.animation_data_clear()
    
    vis_mesh = bpy.data.objects.get('Rig_Visualizer_Mesh')
    flesh_mesh = bpy.data.objects.get('LPC_Decivoxel_Flesh_Fused')
    face_decal = bpy.data.objects.get('LPC_Face_Decal')
    
    bpy.context.view_layer.update()
    
    # 8-way compass directions:
    # 0: S (0°), 1: SW (45°), 2: W (90°), 3: NW (135°),
    # 4: N (180°), 5: NE (225°), 6: E (270°), 7: SE (315°)
    angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]
    dir_names = ["South", "Southwest", "West", "Northwest", "North", "Northeast", "East", "Southeast"]
    
    temp_dir = tempfile.mkdtemp(prefix="myos_tpose_")
    
    # --- PASS 1: RIG VISUALIZER LAYER ---
    print("--- Filming Pass 1: Octahedral Rig-Mesh Layer (8 directions) ---")
    rig_atlas = Image.new('RGBA', (resolution * 8, resolution), (0, 0, 0, 0))
    
    for o in bpy.data.objects:
        o.hide_render = (o != vis_mesh and o.type != 'LIGHT')
        
    for col_idx, deg in enumerate(angles_deg):
        cam_rot.rotation_euler[2] = math.radians(deg)
        bpy.context.view_layer.update()
        
        tmp_path = os.path.join(temp_dir, f"rig_d{col_idx}.png")
        scene.render.filepath = tmp_path
        bpy.ops.render.render(write_still=True)
        
        with Image.open(tmp_path) as im:
            tile = im.convert('RGBA')
            rig_atlas.paste(tile, (col_idx * resolution, 0), tile)
            
    rig_out_path = os.path.join(out_dir, "rig_tpose_8way.png")
    rig_atlas.save(rig_out_path)
    print(f"[OK] Saved Rig Layer: {rig_out_path}")
    
    # --- PASS 2: FLESH MANNEQUIN LAYER ---
    print("--- Filming Pass 2: Flesh Mannequin Layer (8 directions) ---")
    flesh_atlas = Image.new('RGBA', (resolution * 8, resolution), (0, 0, 0, 0))
    
    for o in bpy.data.objects:
        o.hide_render = (o != flesh_mesh and o != face_decal and o.type != 'LIGHT')
        
    for col_idx, deg in enumerate(angles_deg):
        cam_rot.rotation_euler[2] = math.radians(deg)
        bpy.context.view_layer.update()
        
        tmp_path = os.path.join(temp_dir, f"flesh_d{col_idx}.png")
        scene.render.filepath = tmp_path
        bpy.ops.render.render(write_still=True)
        
        with Image.open(tmp_path) as im:
            tile = im.convert('RGBA')
            flesh_atlas.paste(tile, (col_idx * resolution, 0), tile)
            
    flesh_out_path = os.path.join(out_dir, "flesh_tpose_8way.png")
    flesh_atlas.save(flesh_out_path)
    print(f"[OK] Saved Flesh Layer: {flesh_out_path}")
    
    # --- PASS 3: 2D PROJECTED BONE PIVOT COORDINATES ---
    print("--- Calculating 2D Screen-Space Projected Bone Pivots (8 directions) ---")
    bone_pivots_manifest = {
        "resolution": resolution,
        "directions": {}
    }
    
    for dir_idx, (deg, d_name) in enumerate(zip(angles_deg, dir_names)):
        cam_rot.rotation_euler[2] = math.radians(deg)
        bpy.context.view_layer.update()
        
        pivots = {}
        for b in arm.data.bones:
            if 'socket' in b.name.lower() or 'toe' in b.name.lower() or b.length < 0.035:
                continue
            head_world = arm.matrix_world @ b.head_local
            tail_world = arm.matrix_world @ b.tail_local
            
            co_head = bpy_extras.object_utils.world_to_camera_view(scene, cam, head_world)
            co_tail = bpy_extras.object_utils.world_to_camera_view(scene, cam, tail_world)
            
            px_h = round(co_head.x * resolution, 1)
            py_h = round((1.0 - co_head.y) * resolution, 1)
            pz_h = round(co_head.z, 3)
            
            px_t = round(co_tail.x * resolution, 1)
            py_t = round((1.0 - co_tail.y) * resolution, 1)
            pz_t = round(co_tail.z, 3)
            
            pivots[b.name] = {
                "head": [px_h, py_h, pz_h],
                "tail": [px_t, py_t, pz_t]
            }
            
        bone_pivots_manifest["directions"][d_name] = {
            "index": dir_idx,
            "angle_deg": deg,
            "pivots": pivots
        }
        
    pivots_out_path = os.path.join(out_dir, "rig_bone_pivots_8way.json")
    with open(pivots_out_path, 'w') as f:
        json.dump(bone_pivots_manifest, f, indent=2)
    print(f"[OK] Saved 2D Bone Pivots: {pivots_out_path}")
    
    return rig_out_path, flesh_out_path, pivots_out_path

if __name__ == "__main__":
    film_layers()
