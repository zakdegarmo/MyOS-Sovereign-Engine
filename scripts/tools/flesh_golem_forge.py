import sys
sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")
import bpy
import bmesh
import mathutils
import math
import os
import json
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
        elem2 = ramp.color_ramp.elements.new(0.68)
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

def make_emission_mat(name, rgb, strength=40.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    emis = nodes.new('ShaderNodeEmission')
    emis.inputs['Color'].default_value = (*rgb, 1.0)
    emis.inputs['Strength'].default_value = strength
    
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(emis.outputs['Emission'], out.inputs['Surface'])
    return mat

def extract_conformal_shell(body_obj, shell_name, filter_fn, displace_amt=0.0035, mat=None, mat_outline=None):
    old = bpy.data.objects.get(shell_name)
    if old: bpy.data.objects.remove(old, do_unlink=True)
        
    mesh = body_obj.data
    keep_faces = []
    for p in mesh.polygons:
        vs = [mesh.vertices[vi] for vi in p.vertices]
        if any(filter_fn(v) for v in vs):
            keep_faces.append(p.index)
            
    shell_mesh = mesh.copy()
    shell_mesh.name = shell_name + '_Mesh'
    shell_obj = bpy.data.objects.new(shell_name, shell_mesh)
    bpy.context.collection.objects.link(shell_obj)
    shell_obj.matrix_world = body_obj.matrix_world.copy()
    
    delete_poly_indices = set(range(len(shell_mesh.polygons))) - set(keep_faces)
    
    bm = bmesh.new()
    bm.from_mesh(shell_mesh)
    faces_to_del = [f for f in bm.faces if f.index in delete_poly_indices]
    bmesh.ops.delete(bm, geom=faces_to_del, context='FACES_ONLY')
    loose_verts = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose_verts, context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(shell_mesh)
    bm.free()
    
    shell_obj.data.materials.clear()
    if mat: shell_obj.data.materials.append(mat)
    if mat_outline: shell_obj.data.materials.append(mat_outline)
        
    disp = shell_obj.modifiers.new(name="Conformal_Displace", type='DISPLACE')
    disp.mid_level = 0.0
    disp.strength = displace_amt
    
    arm_mod = shell_obj.modifiers.new(name="Rig_Bind", type='ARMATURE')
    arm_mod.object = bpy.data.objects.get('Armature')
    
    return shell_obj

def build_cyber_helmet_worldspace(arm_obj, mat_armor, mat_highlight, mat_eyes, mat_outline):
    old = bpy.data.objects.get("Cyber_Helmet_Hardware")
    if old: bpy.data.objects.remove(old, do_unlink=True)
    
    bm = bmesh.new()
    
    # 1. Top Cranial Crest Ridge
    bmesh.ops.create_cube(
        bm, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.02, 1.25)) @
            mathutils.Matrix.Diagonal((0.08, 0.38, 0.09, 1.0))
        )
    )
    
    # 2. Flared Kabuto Side Cheek & Ear Shields
    for sign in [-1.0, 1.0]:
        bmesh.ops.create_cube(
            bm, size=1.0,
            matrix=(
                mathutils.Matrix.Translation((sign * 0.23, 0.01, 1.04)) @
                mathutils.Euler((math.radians(10), 0, math.radians(-sign * 22))).to_matrix().to_4x4() @
                mathutils.Matrix.Diagonal((0.05, 0.26, 0.22, 1.0))
            )
        )
        
    # 3. Lower Face Respirator Grille Mouthplate
    bmesh.ops.create_cube(
        bm, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.21, 0.94)) @
            mathutils.Matrix.Diagonal((0.18, 0.07, 0.13, 1.0))
        )
    )
    
    # 4. Vertical Grill Slits on Mouthplate
    for sign in [-1.0, 0.0, 1.0]:
        bmesh.ops.create_cube(
            bm, size=1.0,
            matrix=(
                mathutils.Matrix.Translation((sign * 0.045, -0.25, 0.94)) @
                mathutils.Matrix.Diagonal((0.018, 0.02, 0.09, 1.0))
            )
        )
        
    # 5. Brow Visor Ridge (projecting forward over the eyes)
    bmesh.ops.create_cube(
        bm, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.21, 1.07)) @
            mathutils.Matrix.Diagonal((0.22, 0.08, 0.05, 1.0))
        )
    )
    
    # 6. Recessed Visor Eye Trench (deep black backdrop behind eyes)
    bmesh.ops.create_cube(
        bm, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.195, 1.02)) @
            mathutils.Matrix.Diagonal((0.19, 0.04, 0.06, 1.0))
        )
    )
    
    # 7. Dual Glowing Crimson Optic Lenses
    for sign in [-1.0, 1.0]:
        bmesh.ops.create_icosphere(
            bm, subdivisions=2, radius=0.024,
            matrix=mathutils.Matrix.Translation((sign * 0.058, -0.218, 1.025))
        )
        
    mesh = bpy.data.meshes.new("Cyber_Helmet_Hardware_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    
    helm_obj = bpy.data.objects.new("Cyber_Helmet_Hardware", mesh)
    bpy.context.collection.objects.link(helm_obj)
    
    helm_obj.data.materials.append(mat_armor)
    helm_obj.data.materials.append(mat_highlight)
    helm_obj.data.materials.append(mat_eyes)
    if mat_outline: helm_obj.data.materials.append(mat_outline)
        
    for poly in mesh.polygons:
        center = poly.center
        if center.y < -0.21 and 1.00 <= center.z <= 1.05 and abs(center.x) > 0.03:
            poly.material_index = 2 # mat_eyes
        elif center.z > 1.22 or (center.y < -0.23 and 0.88 <= center.z <= 1.00):
            poly.material_index = 1 # mat_highlight
            
    arm_mod = helm_obj.modifiers.new("Rig_Bind", 'ARMATURE')
    arm_mod.object = arm_obj
    vg = helm_obj.vertex_groups.new(name="Head")
    vg.add(range(len(mesh.vertices)), 1.0, 'REPLACE')
    
    return helm_obj

def build_cyber_pauldrons_worldspace(arm_obj, mat_armor, mat_highlight, mat_outline):
    old_l = bpy.data.objects.get("Cyber_Pauldron_L")
    if old_l: bpy.data.objects.remove(old_l, do_unlink=True)
    old_r = bpy.data.objects.get("Cyber_Pauldron_R")
    if old_r: bpy.data.objects.remove(old_r, do_unlink=True)
    
    pauldrons = []
    for side, bone_name in [("L", "LeftArm"), ("R", "RightArm")]:
        sign = 1.0 if side == "L" else -1.0
        bm = bmesh.new()
        
        # Upper curved shoulder cap
        bmesh.ops.create_cone(
            bm, cap_ends=True, segments=16,
            radius1=0.13, radius2=0.07, depth=0.18,
            matrix=(
                mathutils.Matrix.Translation((sign * 0.27, 0.0, 0.82)) @
                mathutils.Euler((0, math.radians(-sign * 25), 0)).to_matrix().to_4x4()
            )
        )
        
        # Lower flared defensive guard
        bmesh.ops.create_cube(
            bm, size=1.0,
            matrix=(
                mathutils.Matrix.Translation((sign * 0.29, 0.0, 0.73)) @
                mathutils.Euler((0, math.radians(-sign * 30), 0)).to_matrix().to_4x4() @
                mathutils.Matrix.Diagonal((0.06, 0.22, 0.16, 1.0))
            )
        )
        
        mesh = bpy.data.meshes.new(f"Cyber_Pauldron_{side}_Mesh")
        bm.to_mesh(mesh)
        bm.free()
        
        p_obj = bpy.data.objects.new(f"Cyber_Pauldron_{side}", mesh)
        bpy.context.collection.objects.link(p_obj)
        p_obj.data.materials.append(mat_armor)
        p_obj.data.materials.append(mat_highlight)
        if mat_outline: p_obj.data.materials.append(mat_outline)
            
        arm_mod = p_obj.modifiers.new("Rig_Bind", 'ARMATURE')
        arm_mod.object = arm_obj
        vg = p_obj.vertex_groups.new(name=bone_name)
        vg.add(range(len(mesh.vertices)), 1.0, 'REPLACE')
        pauldrons.append(p_obj)
        
    return pauldrons

def film_8way_action(action_name, out_path, num_frames=8, resolution=256, supersample=256):
    arm = bpy.data.objects['Armature']
    act = bpy.data.actions.get(action_name)
    if not act:
        print(f"Action {action_name} not found, skipping!")
        return
    arm.animation_data.action = act
    
    scene = bpy.context.scene
    scene.render.resolution_x = supersample
    scene.render.resolution_y = supersample
    scene.render.film_transparent = True
    
    cam_rot = bpy.data.objects['Cam_Rot_Empty']
    
    # 8-way compass angles matching our compositor:
    # Row 0: D (0 deg)
    # Row 1: DL (45 deg)
    # Row 2: L (90 deg)
    # Row 3: UL (135 deg)
    # Row 4: U (180 deg)
    # Row 5: UR (225 deg)
    # Row 6: R (270 deg)
    # Row 7: DR (315 deg)
    angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]
    
    f_start = int(act.frame_range[0])
    f_end = int(act.frame_range[1])
    step = (f_end - f_start) / float(num_frames)
    frame_indices = [int(round(f_start + i * step)) for i in range(num_frames)]
    
    master_atlas = Image.new('RGBA', (resolution * num_frames, resolution * len(angles_deg)), (0, 0, 0, 0))
    temp_dir = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\temp_film_golem')
    os.makedirs(temp_dir, exist_ok=True)
    
    print(f"--- Filming 8-Way {action_name} -> {out_path} ({resolution}x{resolution} tiles) ---")
    
    for row_idx, deg in enumerate(angles_deg):
        cam_rot.rotation_euler[2] = math.radians(deg)
        bpy.context.view_layer.update()
        
        for col_idx, f_num in enumerate(frame_indices):
            scene.frame_set(f_num)
            bpy.context.view_layer.update()
            
            tmp_path = os.path.join(temp_dir, f"r{row_idx}_c{col_idx}.png")
            scene.render.filepath = tmp_path
            bpy.ops.render.render(write_still=True)
            
            with Image.open(tmp_path) as im:
                tile = im.convert('RGBA')
                if tile.size != (resolution, resolution):
                    tile = tile.resize((resolution, resolution), Image.Resampling.LANCZOS)
                master_atlas.paste(tile, (col_idx * resolution, row_idx * resolution), tile)
                
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    master_atlas.save(out_path)
    print(f"Successfully saved 8-way action atlas: {out_path}")

def forge_cyber_golem(base_blend=r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_male_mannequin.blend'):
    print(f"=== Opening Master Flesh Mannequin: {base_blend} ===")
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(base_blend))
    
    arm = bpy.data.objects['Armature']
    body = bpy.data.objects.get('LPC_Decivoxel_Flesh_Male') or bpy.data.objects.get('LPC_Decivoxel_Flesh_Fused')
    
    hair = bpy.data.objects.get('Modular_Hair_JRPG_Adventurer')
    if hair: bpy.data.objects.remove(hair, do_unlink=True)
    face_decal = bpy.data.objects.get('LPC_Face_Decal_Male') or bpy.data.objects.get('LPC_Face_Decal')
    if face_decal:
        face_decal.hide_render = True
        face_decal.hide_viewport = True
        
    mat_outline = bpy.data.materials.get('LPC_Outline_Mat') or bpy.data.materials.get('M_Outline')
    
    # 1. Color Palette from Reference Image (02_navy_cyber_golem)
    mat_carapace = make_cel_mat(
        'M_Cyber_Carapace',
        base_rgb=(0.14, 0.16, 0.28),
        shadow_rgb=(0.06, 0.07, 0.14),
        highlight_rgb=(0.26, 0.30, 0.48)
    )
    mat_highlight = make_cel_mat(
        'M_Cyber_Highlight',
        base_rgb=(0.24, 0.28, 0.46),
        shadow_rgb=(0.12, 0.14, 0.24)
    )
    mat_undersuit = make_cel_mat(
        'M_Cyber_Undersuit',
        base_rgb=(0.09, 0.09, 0.12),
        shadow_rgb=(0.04, 0.04, 0.06)
    )
    mat_eyes = make_emission_mat('M_Optic_Eyes_Red', (1.0, 0.02, 0.06), strength=40.0)
    
    body.data.materials.clear()
    body.data.materials.append(mat_undersuit)
    if mat_outline: body.data.materials.append(mat_outline)
    print("Under-suit applied to base flesh body.")
    
    # 2. Conformal armor shells
    extract_conformal_shell(
        body, 'LPC_Cyber_Helmet_Shell',
        filter_fn=lambda v: v.co.z >= 0.86 and abs(v.co.x) <= 0.22,
        displace_amt=0.0055, mat=mat_carapace, mat_outline=mat_outline
    )
    extract_conformal_shell(
        body, 'LPC_Cyber_Chest_Plate',
        filter_fn=lambda v: 0.52 <= v.co.z <= 0.82 and (v.co.y >= -0.10 or v.co.z <= 0.78),
        displace_amt=0.0050, mat=mat_carapace, mat_outline=mat_outline
    )
    extract_conformal_shell(
        body, 'LPC_Cyber_Pectoral_Plates',
        filter_fn=lambda v: 0.62 <= v.co.z <= 0.76 and abs(v.co.x) <= 0.12 and v.co.y < -0.04,
        displace_amt=0.0080, mat=mat_highlight, mat_outline=mat_outline
    )
    extract_conformal_shell(
        body, 'LPC_Cyber_Gauntlets',
        filter_fn=lambda v: (0.30 <= v.co.z <= 0.50 and abs(v.co.x) > 0.20) or (v.co.z <= 0.44 and abs(v.co.x) > 0.38),
        displace_amt=0.0060, mat=mat_carapace, mat_outline=mat_outline
    )
    extract_conformal_shell(
        body, 'LPC_Cyber_Belt_Tassets',
        filter_fn=lambda v: 0.36 <= v.co.z <= 0.52 and (v.co.y >= -0.12 or v.co.z <= 0.48),
        displace_amt=0.0055, mat=mat_highlight, mat_outline=mat_outline
    )
    extract_conformal_shell(
        body, 'LPC_Cyber_Greaves',
        filter_fn=lambda v: 0.00 <= v.co.z <= 0.34,
        displace_amt=0.0050, mat=mat_carapace, mat_outline=mat_outline
    )
    extract_conformal_shell(
        body, 'LPC_Cyber_Knee_Guards',
        filter_fn=lambda v: 0.18 <= v.co.z <= 0.26 and v.co.y < -0.02,
        displace_amt=0.0080, mat=mat_highlight, mat_outline=mat_outline
    )
    
    # 3. 3D Rigged Accessories
    build_cyber_helmet_worldspace(arm, mat_carapace, mat_highlight, mat_eyes, mat_outline)
    build_cyber_pauldrons_worldspace(arm, mat_carapace, mat_highlight, mat_outline)
    print("3D Helmet and Pauldrons constructed and rigged.")
    
    # 4. Save 3D Golem Model
    out_blend_dir = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\artifacts\flesh_golems')
    os.makedirs(out_blend_dir, exist_ok=True)
    out_blend = os.path.join(out_blend_dir, 'cyber_goliath_golem.blend')
    bpy.ops.wm.save_as_mainfile(filepath=out_blend)
    print(f"Saved Rigged FLESH Golem -> {out_blend}")
    
    # 5. Camera setup
    cam_rot = bpy.data.objects['Cam_Rot_Empty']
    cam_rot.location = (0.0, -1.20, 0.96)
    cam_rot.rotation_euler = (0, 0, 0)
    cam_tgt = bpy.data.objects['CamTarget']
    cam_tgt.location = (0.0, -1.20, 0.96)
    cam = bpy.data.objects['RenderCam']
    cam.location = (0.0, -2.40, 0.25)
    
    scene = bpy.context.scene
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    
    arm.animation_data.action = bpy.data.actions['Idle_Loop']
    scene.frame_set(1)
    bpy.context.view_layer.update()
    
    actions_dir = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions')
    os.makedirs(actions_dir, exist_ok=True)
    
    out_preview = os.path.join(actions_dir, 'cyber_goliath_preview.png')
    scene.render.filepath = out_preview
    bpy.ops.render.render(write_still=True)
    print(f"Rendered Portrait Preview -> {out_preview}")
    
    # 6. Film 8-Way Action Sheets (256x256 HD tiles, 2048x2048 atlases)
    film_8way_action('Idle_Loop', os.path.join(actions_dir, 'cyber_goliath_idle_loop.png'), resolution=256)
    film_8way_action('Walk_Loop', os.path.join(actions_dir, 'cyber_goliath_walk_loop.png'), resolution=256)
    film_8way_action('Jog_Fwd_Loop', os.path.join(actions_dir, 'cyber_goliath_run_loop.png'), resolution=256)
    film_8way_action('Spell_Simple_Shoot', os.path.join(actions_dir, 'cyber_goliath_spellcast_loop.png'), resolution=256)
    
    # 7. Register in myos_sprites_manifest.json
    manifest_path = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\myos_sprites_manifest.json')
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
        
    manifest['sprites']['cyber_goliath'] = {
        "id": "cyber_goliath",
        "name": "Cyber Goliath (Heavy Golem)",
        "category": "heroes",
        "badge": "FLESH CYBER GOLEM",
        "badgeColor": "bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-cyan-300 border-blue-500/50",
        "description": "Heavy mechanized assault golem translated from reference art and sculpted from the master FLESH mannequin, encased in midnight ballistic kabuto carapace with dual crimson optic sensors.",
        "tileSize": 256,
        "grid": {
            "cols": 8,
            "rows": 8
        },
        "scale": 1.15,
        "defaultAction": "idle",
        "previewUrl": "/actions/cyber_goliath_preview.png",
        "actions": {
            "idle": "/actions/cyber_goliath_idle_loop.png",
            "walk": "/actions/cyber_goliath_walk_loop.png",
            "run": "/actions/cyber_goliath_run_loop.png",
            "spellcast": "/actions/cyber_goliath_spellcast_loop.png"
        },
        "pillarAlignment": "protection"
    }
    
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
        
    print(f"Registered cyber_goliath in {manifest_path}")

if __name__ == '__main__':
    forge_cyber_golem()
