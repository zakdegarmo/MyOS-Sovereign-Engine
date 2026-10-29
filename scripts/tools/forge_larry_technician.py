"""
forge_larry_technician.py
Bespoke pipeline script that clones flesh_male_mannequin.blend into Larry:
The Frontline IT Support Flesh Golem.

Sculpts:
- Crisp white collared button-up dress shirt with collar wings and button placket
- Modular equippable Tie entity with swappable materials (Red Power Tie default)
- Light blue tailored office slacks with belt and brass buckle
- Dark oxford leather dress shoes
- Bespoke hand-drawn Mephit cel shading + thick inverted-hull ink outlines
- Films 8-way HD action sheets for idle, walk, sprint, repair, and damage
"""

import sys
sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")

import bpy
import bmesh
import mathutils
import math
import os
import tempfile
import time
from PIL import Image

def make_cel_mat(name, base_rgb, shadow_rgb, highlight_rgb=None):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (*base_rgb, 1.0)
    diff.inputs['Roughness'].default_value = 0.0
    
    s2rgb = nodes.new('ShaderNodeShaderToRGB')
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    
    if highlight_rgb:
        ramp.color_ramp.elements[0].position = 0.38
        ramp.color_ramp.elements[0].color = (*shadow_rgb, 1.0)
        elem1 = ramp.color_ramp.elements[1]
        elem1.position = 0.44
        elem1.color = (*base_rgb, 1.0)
        elem2 = ramp.color_ramp.elements.new(0.70)
        elem2.color = (*highlight_rgb, 1.0)
    else:
        ramp.color_ramp.elements[0].position = 0.40
        ramp.color_ramp.elements[0].color = (*shadow_rgb, 1.0)
        ramp.color_ramp.elements[1].position = 0.46
        ramp.color_ramp.elements[1].color = (*base_rgb, 1.0)
    
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], out.inputs['Surface'])
    return mat

def get_or_create_outline_mat():
    mat = bpy.data.materials.get('LPC_Outline_Mat')
    if not mat:
        mat = bpy.data.materials.new('LPC_Outline_Mat')
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        nodes.clear()
        out = nodes.new('ShaderNodeOutputMaterial')
        emit = nodes.new('ShaderNodeEmission')
        emit.inputs['Color'].default_value = (0.015, 0.015, 0.015, 1.0)
        mat.node_tree.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    mat.use_backface_culling = True
    if hasattr(mat, 'shadow_method'):
        mat.shadow_method = 'NONE'
    return mat

def apply_inverted_hull_outline(obj, outline_mat, thickness=0.007, mat_slot_idx=1):
    # Ensure outline mat is assigned
    if outline_mat.name not in [s.material.name for s in obj.material_slots if s.material]:
        obj.data.materials.append(outline_mat)
    
    # Solidify modifier for comic ink outline
    mod = obj.modifiers.get('LPC_Ink_Outline')
    if not mod:
        mod = obj.modifiers.new(name='LPC_Ink_Outline', type='SOLIDIFY')
    mod.thickness = -abs(thickness)
    mod.offset = 0.0
    mod.material_offset = mat_slot_idx
    mod.use_flip_normals = True
    return mod

def extract_conformal_garment(body_obj, arm_obj, garment_name, filter_fn, displace_val=0.004, main_mat=None, outline_mat=None):
    old = bpy.data.objects.get(garment_name)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
        
    mesh = body_obj.data
    keep_faces = []
    for p in mesh.polygons:
        vs = [mesh.vertices[vi] for vi in p.vertices]
        if any(filter_fn(v) for v in vs):
            keep_faces.append(p.index)
            
    garment_mesh = mesh.copy()
    garment_mesh.name = garment_name + '_Mesh'
    garment_obj = bpy.data.objects.new(garment_name, garment_mesh)
    bpy.context.collection.objects.link(garment_obj)
    garment_obj.matrix_world = body_obj.matrix_world.copy()
    
    delete_poly_indices = set(range(len(garment_mesh.polygons))) - set(keep_faces)
    
    bm = bmesh.new()
    bm.from_mesh(garment_mesh)
    faces_to_del = [f for f in bm.faces if f.index in delete_poly_indices]
    bmesh.ops.delete(bm, geom=faces_to_del, context='FACES_ONLY')
    loose_verts = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose_verts, context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(garment_mesh)
    bm.free()
    
    garment_obj.data.materials.clear()
    if main_mat:
        garment_obj.data.materials.append(main_mat)
        
    disp = garment_obj.modifiers.new(name="Garment_Displace", type='DISPLACE')
    disp.mid_level = 0.0
    disp.strength = displace_val
    
    arm_mod = garment_obj.modifiers.new(name="Rig_Bind", type='ARMATURE')
    arm_mod.object = arm_obj
    
    if outline_mat:
        apply_inverted_hull_outline(garment_obj, outline_mat, thickness=0.007, mat_slot_idx=1)
        
    return garment_obj

def build_modular_tie(arm_obj, mat_tie, mat_outline):
    old = bpy.data.objects.get('Larry_Equippable_Tie')
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
        
    bm = bmesh.new()
    
    # 1. Windsor Tie Knot (at center collar base: X=0, Y=-0.145, Z=0.885)
    bmesh.ops.create_cube(
        bm, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.145, 0.885)) @
            mathutils.Euler((math.radians(12), 0, 0)).to_matrix().to_4x4() @
            mathutils.Matrix.Diagonal((0.040, 0.024, 0.038, 1.0))
        )
    )
    
    # 2. Upper Tie Neckband (tucking beneath shirt collar)
    for sign in [-1.0, 1.0]:
        bmesh.ops.create_cube(
            bm, size=1.0,
            matrix=(
                mathutils.Matrix.Translation((sign * 0.035, -0.11, 0.915)) @
                mathutils.Euler((math.radians(-10), 0, math.radians(-sign * 35))).to_matrix().to_4x4() @
                mathutils.Matrix.Diagonal((0.048, 0.022, 0.025, 1.0))
            )
        )
        
    # 3. Main Tie Blade (draping down the chest from Z=0.86 to Z=0.62)
    # Upper segment
    bmesh.ops.create_cube(
        bm, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.150, 0.770)) @
            mathutils.Euler((math.radians(7), 0, 0)).to_matrix().to_4x4() @
            mathutils.Matrix.Diagonal((0.034, 0.012, 0.190, 1.0))
        )
    )
    
    # Lower wider segment
    bmesh.ops.create_cube(
        bm, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.138, 0.635)) @
            mathutils.Euler((math.radians(2), 0, 0)).to_matrix().to_4x4() @
            mathutils.Matrix.Diagonal((0.042, 0.012, 0.120, 1.0))
        )
    )
    
    # 4. Pointed Diamond Tip at Belt Line (Z=0.56)
    bmesh.ops.create_cube(
        bm, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.132, 0.565)) @
            mathutils.Euler((0, 0, math.radians(45))).to_matrix().to_4x4() @
            mathutils.Matrix.Diagonal((0.030, 0.030, 0.010, 1.0))
        )
    )
    
    tie_mesh = bpy.data.meshes.new('Larry_Equippable_Tie_Mesh')
    bm.to_mesh(tie_mesh)
    bm.free()
    
    tie_obj = bpy.data.objects.new('Larry_Equippable_Tie', tie_mesh)
    bpy.context.collection.objects.link(tie_obj)
    
    tie_obj.data.materials.append(mat_tie)
    tie_obj.data.materials.append(mat_outline)
    
    # Parent to Armature and bind weights
    tie_obj.parent = arm_obj
    arm_mod = tie_obj.modifiers.new(name="Rig_Bind", type='ARMATURE')
    arm_mod.object = arm_obj
    
    # Vertex weight groups: predominantly Spine01 and Spine
    vg_spine01 = tie_obj.vertex_groups.new(name='Spine01')
    vg_spine = tie_obj.vertex_groups.new(name='Spine')
    vg_neck = tie_obj.vertex_groups.new(name='neck')
    
    for vi, v in enumerate(tie_mesh.vertices):
        z = v.co.z
        if z > 0.82:
            vg_neck.add([vi], 0.7, 'REPLACE')
            vg_spine01.add([vi], 0.3, 'REPLACE')
        elif z > 0.68:
            vg_spine01.add([vi], 0.85, 'REPLACE')
            vg_spine.add([vi], 0.15, 'REPLACE')
        else:
            vg_spine01.add([vi], 0.35, 'REPLACE')
            vg_spine.add([vi], 0.65, 'REPLACE')
            
    apply_inverted_hull_outline(tie_obj, mat_outline, thickness=0.005, mat_slot_idx=1)
    return tie_obj

def add_shirt_collar_and_placket(shirt_obj, arm_obj, mat_shirt, mat_buttons):
    bm = bmesh.new()
    
    # Collar Wings (Stiff folded collar wings around the neck)
    for sign in [-1.0, 1.0]:
        bmesh.ops.create_cube(
            bm, size=1.0,
            matrix=(
                mathutils.Matrix.Translation((sign * 0.055, -0.125, 0.915)) @
                mathutils.Euler((math.radians(22), math.radians(sign * 15), math.radians(-sign * 28))).to_matrix().to_4x4() @
                mathutils.Matrix.Diagonal((0.055, 0.022, 0.065, 1.0))
            )
        )
        
    # Front Button Placket (Crisp vertical seam strip down chest)
    bmesh.ops.create_cube(
        bm, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.142, 0.720)) @
            mathutils.Euler((math.radians(6), 0, 0)).to_matrix().to_4x4() @
            mathutils.Matrix.Diagonal((0.028, 0.012, 0.360, 1.0))
        )
    )
    
    # 4 Mother-of-pearl buttons along placket
    for bz in [0.83, 0.74, 0.65, 0.57]:
        bmesh.ops.create_cube(
            bm, size=1.0,
            matrix=(
                mathutils.Matrix.Translation((0.0, -0.151, bz)) @
                mathutils.Matrix.Diagonal((0.012, 0.008, 0.012, 1.0))
            )
        )
        
    collar_mesh = bpy.data.meshes.new('Larry_Collar_Placket_Mesh')
    bm.to_mesh(collar_mesh)
    bm.free()
    
    collar_obj = bpy.data.objects.new('Larry_Collar_Placket', collar_mesh)
    bpy.context.collection.objects.link(collar_obj)
    collar_obj.data.materials.append(mat_shirt)
    collar_obj.data.materials.append(mat_buttons)
    
    # Assign button material to button faces
    for p in collar_mesh.polygons:
        if any(collar_mesh.vertices[vi].co.y < -0.146 for vi in p.vertices):
            p.material_index = 1
            
    collar_obj.parent = arm_obj
    arm_mod = collar_obj.modifiers.new(name="Rig_Bind", type='ARMATURE')
    arm_mod.object = arm_obj
    
    vg_spine01 = collar_obj.vertex_groups.new(name='Spine01')
    vg_neck = collar_obj.vertex_groups.new(name='neck')
    for vi, v in enumerate(collar_mesh.vertices):
        if v.co.z > 0.85:
            vg_neck.add([vi], 0.8, 'REPLACE')
            vg_spine01.add([vi], 0.2, 'REPLACE')
        else:
            vg_spine01.add([vi], 0.9, 'REPLACE')
            
    outline_mat = get_or_create_outline_mat()
    collar_obj.data.materials.append(outline_mat)
    apply_inverted_hull_outline(collar_obj, outline_mat, thickness=0.005, mat_slot_idx=2)
    return collar_obj

def film_action(action_name, out_path, num_frames=8, resolution=256):
    arm = bpy.data.objects['Armature']
    act = bpy.data.actions.get(action_name)
    if not act:
        print(f"[WARN] Action {action_name} not found, skipping!")
        return False
        
    arm.animation_data.action = act
    if hasattr(act, 'slots') and len(act.slots) > 0:
        arm.animation_data.action_slot = act.slots[0]
        
    scene = bpy.context.scene
    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    
    cam_rot = bpy.data.objects.get('Cam_Rot_Empty')
    if not cam_rot:
        print("[ERROR] Cam_Rot_Empty not found!")
        return False
        
    angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]
    f_start = int(act.frame_range[0])
    f_end = int(act.frame_range[1])
    step = (f_end - f_start) / float(num_frames)
    frame_indices = [int(round(f_start + i * step)) for i in range(num_frames)]
    
    atlas_w = resolution * num_frames
    atlas_h = resolution * len(angles_deg)
    master_atlas = Image.new('RGBA', (atlas_w, atlas_h), (0, 0, 0, 0))
    temp_dir = tempfile.mkdtemp(prefix="larry_film_")
    
    t0 = time.time()
    for row_idx, deg in enumerate(angles_deg):
        cam_rot.rotation_euler[2] = math.radians(deg)
        bpy.context.view_layer.update()
        
        for col_idx, f_num in enumerate(frame_indices):
            scene.frame_set(f_num)
            bpy.context.view_layer.update()
            
            tmp_file = os.path.join(temp_dir, f"r{row_idx}_c{col_idx}.png")
            scene.render.filepath = tmp_file
            bpy.ops.render.render(write_still=True)
            
            if os.path.exists(tmp_file):
                with Image.open(tmp_file) as im:
                    tile = im.convert('RGBA')
                    master_atlas.paste(tile, (col_idx * resolution, row_idx * resolution), tile)
                os.remove(tmp_file)
                
    try:
        os.rmdir(temp_dir)
    except Exception:
        pass
        
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    master_atlas.save(out_path)
    print(f"[FILMED] {action_name} -> {os.path.basename(out_path)} ({time.time() - t0:.1f}s)")
    return True

def forge_larry():
    print("==================================================")
    print("FORGING LARRY: THE FRONTLINE IT SUPPORT FLESH GOLEM")
    print("==================================================")
    
    base_blend = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_male_mannequin.blend"
    out_blend = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_larry_technician.blend"
    artifact_blend = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\artifacts\flesh_golems\larry_it_technician.blend"
    actions_out_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions"
    
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(base_blend))
    
    body = bpy.data.objects['LPC_Decivoxel_Flesh_Male']
    arm = bpy.data.objects['Armature']
    
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    # 1. Shaders & Palettes
    outline_mat = get_or_create_outline_mat()
    
    # White dress shirt: crisp bright white with subtle cool slate shadow
    mat_shirt = make_cel_mat('Larry_Shirt_Cel', (0.95, 0.96, 0.98), (0.72, 0.76, 0.84), (1.0, 1.0, 1.0))
    # Button placket buttons: dark slate contrast
    mat_buttons = make_cel_mat('Larry_Buttons_Cel', (0.15, 0.18, 0.24), (0.05, 0.07, 0.10))
    # Light blue slacks: clean office powder-blue with tailored indigo shadow
    mat_slacks = make_cel_mat('Larry_Slacks_Cel', (0.45, 0.70, 0.92), (0.16, 0.35, 0.58), (0.65, 0.85, 1.0))
    # Dark oxford leather dress shoes
    mat_shoes = make_cel_mat('Larry_Shoes_Cel', (0.10, 0.12, 0.16), (0.03, 0.04, 0.06), (0.25, 0.28, 0.35))
    # Modular Ties: Red Power Tie (default), plus variants
    mat_tie_red = make_cel_mat('Tie_Red_Power', (0.82, 0.12, 0.15), (0.42, 0.04, 0.06), (0.95, 0.28, 0.32))
    mat_tie_navy = make_cel_mat('Tie_Navy_Stripe', (0.10, 0.22, 0.52), (0.04, 0.08, 0.25))
    mat_tie_green = make_cel_mat('Tie_Emerald_Hacker', (0.05, 0.60, 0.35), (0.02, 0.28, 0.15))
    mat_tie_gold = make_cel_mat('Tie_Executive_Gold', (0.88, 0.62, 0.12), (0.48, 0.30, 0.04))
    
    # Hair: Neat chestnut brown IT haircut
    mat_hair = make_cel_mat('Larry_Hair_Mat', (0.24, 0.16, 0.12), (0.10, 0.06, 0.04), (0.38, 0.26, 0.18))
    hair_obj = bpy.data.objects.get('Modular_Hair_JRPG_Adventurer')
    if hair_obj:
        hair_obj.data.materials.clear()
        hair_obj.data.materials.append(mat_hair)
        hair_obj.data.materials.append(outline_mat)
        apply_inverted_hull_outline(hair_obj, outline_mat, thickness=0.007, mat_slot_idx=1)
        hair_obj.hide_render = False
        
    # Ensure skin and face decal have outline
    apply_inverted_hull_outline(body, outline_mat, thickness=0.008, mat_slot_idx=1)
    face_decal = bpy.data.objects.get('LPC_Face_Decal_Male')
    if face_decal:
        face_decal.hide_render = False
        
    # 2. Extract Conformal Dress Shirt
    # Torso from waist to neck, plus sleeves down arms
    def shirt_filter(v):
        z = v.co.z
        x = abs(v.co.x)
        # Upper torso / chest
        if 0.53 <= z <= 0.95 and x <= 0.26:
            return True
        # Sleeves extending along arms
        if 0.52 <= z <= 0.92 and x > 0.18:
            return True
        return False
        
    shirt_obj = extract_conformal_garment(
        body, arm, 'Larry_Shirt_Mesh',
        shirt_filter, displace_val=0.0040,
        main_mat=mat_shirt, outline_mat=outline_mat
    )
    
    # 3. Add 3D Collar & Placket
    add_shirt_collar_and_placket(shirt_obj, arm, mat_shirt, mat_buttons)
    
    # 4. Build Modular Equippable Tie
    build_modular_tie(arm, mat_tie_red, outline_mat)
    
    # 5. Extract Conformal Light Blue Slacks
    def slacks_filter(v):
        z = v.co.z
        x = abs(v.co.x)
        return 0.08 <= z <= 0.56 and x <= 0.24
        
    extract_conformal_garment(
        body, arm, 'Larry_Slacks_Mesh',
        slacks_filter, displace_val=0.0045,
        main_mat=mat_slacks, outline_mat=outline_mat
    )
    
    # 6. Extract Conformal Dark Oxford Shoes
    def shoes_filter(v):
        z = v.co.z
        return z <= 0.085
        
    extract_conformal_garment(
        body, arm, 'Larry_Shoes_Mesh',
        shoes_filter, displace_val=0.0060,
        main_mat=mat_shoes, outline_mat=outline_mat
    )
    
    # Switch back to POSE position for filming
    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()
    
    # 7. Save Blend Models
    os.makedirs(os.path.dirname(artifact_blend), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(out_blend))
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(artifact_blend))
    print(f"[SAVED] Larry Model -> {out_blend}")
    print(f"[SAVED] Artifact Model -> {artifact_blend}")
    
    # 8. Film 8-Way Action Sheets
    actions_to_render = [
        ("Idle_Loop", "larry_idle_loop.png"),
        ("Walk_Loop", "larry_walk_loop.png"),
        ("Sprint_Loop", "larry_sprint_loop.png"),
        ("Fixing_Kneeling", "larry_repair_loop.png"),
        ("Hit_Chest", "larry_damage_loop.png")
    ]
    
    for act_name, filename in actions_to_render:
        out_sheet = os.path.join(actions_out_dir, filename)
        film_action(act_name, out_sheet, num_frames=8, resolution=256)
        
    print("==================================================")
    print("LARRY FORGED AND ALL ACTION SHEETS RENDERED!")
    print("==================================================")
    return True

if __name__ == "__main__":
    forge_larry()
