"""
bake_makehuman_wardrobe.py

Headless Blender batch baker for MakeHuman 3D clothing assets onto the
LPC Decivoxel Flesh Base Mannequin rig.
Renders pixel-perfect 8-directional 2048x2048 RGBA master action sheets
using the canonical camera matrix.
"""

import sys
sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")

import bpy
import os
import math
import tempfile
import time
import shutil
from PIL import Image

def fit_mesh_to_flesh(obj, z_min, z_max, scale_xy=0.10, x_compress=1.0):
    """
    Fits MakeHuman OBJ coordinates to the anatomical bounds of the
    chibi Decivoxel Flesh Mannequin.
    """
    zs = [v.co.z for v in obj.data.vertices]
    z_min_orig = min(zs)
    z_max_orig = max(zs)
    h_orig = max(0.001, z_max_orig - z_min_orig)
    h_target = z_max - z_min
    scale_z = h_target / h_orig

    for v in obj.data.vertices:
        v.co.x *= scale_xy * x_compress
        v.co.y *= scale_xy
        v.co.z = z_min + (v.co.z - z_min_orig) * scale_z
    obj.data.update()

def create_cel_material(name, diffuse_rgb):
    """
    Creates or retrieves a stylized cel-shaded material with custom diffuse color.
    """
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out_node = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (*diffuse_rgb, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.85
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.1
    links.new(bsdf.outputs['BSDF'], out_node.inputs['Surface'])
    return mat

def bake_all():
    blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_base_comic.blend"
    out_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions"
    base_clothes_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\clothes"

    if not os.path.exists(blend_path):
        print(f"[ERROR] Blend not found: {blend_path}")
        return False

    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256

    body = bpy.data.objects['LPC_Decivoxel_Flesh_Fused']
    arm = bpy.data.objects['Armature']

    # Set Canonical Camera Setup
    cam_rot = bpy.data.objects.get('Cam_Rot_Empty')
    if not cam_rot:
        cam_rot = bpy.data.objects.new('Cam_Rot_Empty', None)
        bpy.context.collection.objects.link(cam_rot)

    cam_tgt = bpy.data.objects.get('CamTarget')
    if not cam_tgt:
        cam_tgt = bpy.data.objects.new('CamTarget', None)
        bpy.context.collection.objects.link(cam_tgt)

    cam_rot.location = (0.0, -1.20, 0.60)
    cam_tgt.location = (0.0, -1.20, 0.60)

    cam = bpy.data.objects.get('RenderCam')
    if not cam:
        cam_data = bpy.data.cameras.new('RenderCam')
        cam = bpy.data.objects.new('RenderCam', cam_data)
        bpy.context.collection.objects.link(cam)

    scene.camera = cam
    cam.parent = cam_rot
    cam.location = (0.0, -2.40, 0.25)
    cam.data.lens = 45.0

    track = next((c for c in cam.constraints if c.type == 'TRACK_TO'), None)
    if not track:
        track = cam.constraints.new('TRACK_TO')
    track.target = cam_tgt
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'

    # Outline material
    mat_outline = bpy.data.materials.get('LPC_Outline_Mat')
    if not mat_outline:
        mat_outline = bpy.data.materials.new(name='LPC_Outline_Mat')
        mat_outline.use_nodes = True
        nodes = mat_outline.node_tree.nodes
        nodes.clear()
        out = nodes.new('ShaderNodeOutputMaterial')
        emit = nodes.new('ShaderNodeEmission')
        emit.inputs['Color'].default_value = (0.02, 0.02, 0.02, 1.0)
        mat_outline.node_tree.links.new(emit.outputs['Emission'], out.inputs['Surface'])

    # Wardrobe Item Registry: (Category, ID, Folder, OBJ File, Z_Min, Z_Max, Scale_XY, X_Compress, RGB Color)
    wardrobe_catalog = [
        # --- Torso Options ---
        ('torso', 'tunic', 'wdg_mycenaean_tunic', 'mycenaean_tunic.obj', 0.45, 0.82, 0.10, 0.92, (0.12, 0.48, 0.22)),
        ('torso', 'sweater', 'toigo_fisherman_sweater', 'sweater_fisherman.obj', 0.45, 0.82, 0.10, 0.92, (0.84, 0.80, 0.72)),
        ('torso', 'kimono', 'mindfront_kimono', 'f_kimono.obj', 0.40, 0.82, 0.10, 0.92, (0.72, 0.14, 0.16)),
        ('torso', 'dinner_jacket', 'toigo_suit_with_dinner_jacket', 'suit_dinner_jacket.obj', 0.45, 0.82, 0.10, 0.92, (0.14, 0.15, 0.18)),
        ('torso', 'bodice', 'toigo_bodice-style_top', 'bodice_style_top.obj', 0.45, 0.80, 0.10, 0.92, (0.46, 0.28, 0.16)),

        # --- Legs Options ---
        ('legs', 'cargo_pants', 'cortu_cargo_pants', 'cargo_pants.obj', 0.10, 0.55, 0.10, 0.68, (0.16, 0.24, 0.42)),
        ('legs', 'wool_pants', 'toigo_wool_pants', 'pants_wool.obj', 0.10, 0.55, 0.10, 0.68, (0.26, 0.28, 0.32)),
        ('legs', 'harem_pants', 'toigo_harem_pants', 'pants_harem.obj', 0.10, 0.55, 0.10, 0.72, (0.36, 0.16, 0.46)),
        ('legs', 'jeans_shorts', 'cortu_jeans_shorts', 'jean_shorts.obj', 0.28, 0.55, 0.10, 0.68, (0.22, 0.38, 0.58)),

        # --- Boots Options ---
        ('feet', 'hero_boots', 'culturalibre_hero_boots_1', 'hero_boots_1.obj', -0.005, 0.26, 0.10, 0.68, (0.24, 0.15, 0.09)),
        ('feet', 'ankle_boots', 'toigo_ankle_boots_male', 'boots_ankle_male.obj', -0.005, 0.18, 0.10, 0.68, (0.13, 0.09, 0.06)),
        ('feet', 'shoes', 'shoes01', 'shoes01.obj', -0.005, 0.12, 0.10, 0.68, (0.07, 0.07, 0.09)),
    ]

    angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]
    actions_to_bake = [('idle', 'Idle_Loop'), ('walk', 'Walk_Loop')]
    num_frames = 8
    resolution = 256
    atlas_w = resolution * num_frames
    atlas_h = resolution * len(angles_deg)

    print(f"=== Starting MakeHuman Wardrobe Batch Baker ({len(wardrobe_catalog)} items) ===")
    t_start_total = time.time()

    for item_idx, (cat, item_id, folder, obj_filename, z_min, z_max, scale_xy, x_compress, rgb_col) in enumerate(wardrobe_catalog):
        t_item_start = time.time()
        obj_path = os.path.join(base_clothes_dir, folder, obj_filename)
        if not os.path.exists(obj_path):
            print(f"[SKIP] OBJ missing: {obj_path}")
            continue

        # Put Armature into REST mode for exact 1-to-1 vertex data transfer
        arm.data.pose_position = 'REST'
        bpy.context.view_layer.update()

        # Import OBJ
        bpy.ops.wm.obj_import(filepath=obj_path)
        clothing_obj = bpy.context.selected_objects[0]
        clothing_obj.name = f"MH_{cat}_{item_id}"
        clothing_obj.rotation_euler[0] = math.radians(90)
        bpy.ops.object.transform_apply(rotation=True)

        # Fit to Decivoxel anatomy
        fit_mesh_to_flesh(clothing_obj, z_min, z_max, scale_xy, x_compress)

        # Create matching vertex groups and transfer weights
        for vg in body.vertex_groups:
            clothing_obj.vertex_groups.new(name=vg.name)
        bpy.context.view_layer.objects.active = clothing_obj
        dt = clothing_obj.modifiers.new(name='DT', type='DATA_TRANSFER')
        dt.object = body
        dt.use_vert_data = True
        dt.data_types_verts = {'VGROUP_WEIGHTS'}
        dt.vert_mapping = 'POLYINTERP_NEAREST'
        bpy.ops.object.datalayout_transfer(modifier='DT')
        bpy.ops.object.modifier_apply(modifier='DT')

        # Armature Modifier
        arm_mod = clothing_obj.modifiers.new(name='Armature', type='ARMATURE')
        arm_mod.object = arm

        # Solidify Comic Ink Outline Modifier
        solid = clothing_obj.modifiers.new(name='Outline', type='SOLIDIFY')
        solid.thickness = -0.010
        solid.offset = 1.0
        solid.material_offset = 1

        # Material Assignment
        mat_cel = create_cel_material(f"Mat_{cat}_{item_id}", rgb_col)
        clothing_obj.data.materials.clear()
        clothing_obj.data.materials.append(mat_cel)
        clothing_obj.data.materials.append(mat_outline)

        # Switch Armature back to POSE mode for action filming
        arm.data.pose_position = 'POSE'
        bpy.context.view_layer.update()

        # Hide body and face decal so ONLY the clothing layer is filmed
        body.hide_render = True
        face_decal = bpy.data.objects.get('LPC_Face_Decal')
        if face_decal:
            face_decal.hide_render = True
        clothing_obj.hide_render = False

        for action_slug, action_blend_name in actions_to_bake:
            act = bpy.data.actions.get(action_blend_name)
            if not act:
                print(f"[WARN] Action {action_blend_name} not found in blend file!")
                continue

            arm.animation_data.action = act
            if hasattr(act, 'slots') and len(act.slots) > 0:
                arm.animation_data.action_slot = act.slots[0]

            f_start = int(act.frame_range[0])
            f_end = int(act.frame_range[1])
            step = (f_end - f_start) / float(num_frames)
            frame_indices = [int(round(f_start + i * step)) for i in range(num_frames)]

            master_atlas = Image.new('RGBA', (atlas_w, atlas_h), (0, 0, 0, 0))
            temp_dir = tempfile.mkdtemp(prefix="mh_wardrobe_")

            for row_idx, deg in enumerate(angles_deg):
                cam_rot.rotation_euler[2] = math.radians(deg)
                bpy.context.view_layer.update()

                for col_idx, f_num in enumerate(frame_indices):
                    scene.frame_set(f_num)
                    bpy.context.view_layer.update()

                    tmp_path = os.path.join(temp_dir, f"r{row_idx}_c{col_idx}.png")
                    scene.render.filepath = tmp_path
                    bpy.ops.render.render(write_still=True)

                    if os.path.exists(tmp_path):
                        with Image.open(tmp_path) as im:
                            tile = im.convert('RGBA')
                            master_atlas.paste(tile, (col_idx * resolution, row_idx * resolution), tile)
                        os.remove(tmp_path)

            try:
                os.rmdir(temp_dir)
            except Exception:
                pass

            out_filename = f"flesh_clothing_{cat}_{item_id}_{action_slug}.png"
            out_path = os.path.join(out_dir, out_filename)
            master_atlas.save(out_path)
            print(f"  -> Saved {out_filename} ({master_atlas.size})")

            # Canonical backward compatibility exports
            if cat == 'torso' and item_id == 'tunic':
                shutil.copyfile(out_path, os.path.join(out_dir, f"flesh_base_mannequin_clothing_tunic_{action_slug}.png"))
            elif cat == 'torso' and item_id == 'dinner_jacket':
                shutil.copyfile(out_path, os.path.join(out_dir, f"flesh_base_mannequin_clothing_plate_{action_slug}.png"))
            elif cat == 'torso' and item_id == 'bodice':
                shutil.copyfile(out_path, os.path.join(out_dir, f"flesh_base_mannequin_clothing_shadow_{action_slug}.png"))
            elif cat == 'legs' and item_id == 'cargo_pants':
                shutil.copyfile(out_path, os.path.join(out_dir, f"flesh_base_mannequin_clothing_pants_{action_slug}.png"))
            elif cat == 'feet' and item_id == 'hero_boots':
                shutil.copyfile(out_path, os.path.join(out_dir, f"flesh_base_mannequin_clothing_boots_{action_slug}.png"))

        # Clean up this clothing object before next
        bpy.data.objects.remove(clothing_obj, do_unlink=True)
        t_item_end = time.time()
        print(f"[{item_idx + 1}/{len(wardrobe_catalog)}] Completed {item_id} in {t_item_end - t_item_start:.1f}s")

    print(f"=== ALL WARDROBE BAKING FINISHED in {time.time() - t_start_total:.1f}s ===")
    return True

if __name__ == "__main__":
    bake_all()
