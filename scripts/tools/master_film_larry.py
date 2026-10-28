"""
master_film_larry.py
Constructs the definitive 3D Larry IT Technician in Blender:
- Mask modifier immunity (zero body skin poke-through)
- True T-pose aligned white dress shirt (collar wings, button placket, horizontal sleeves)
- Radiant red 3D necktie with anatomical spine/hips deformation pinning it to chest & buckle
- Tailored blue slacks with belt and 3D brass buckle
- Dark oxford leather dress shoes
- Neat IT haircut (short01 fitted to cranium, nape clamped neatly at skull base)
- Headless filming of 8x8 (2048x2048) action sheets:
  - larry_idle_loop.png
  - larry_walk_loop.png
  - larry_sprint_loop.png
  - larry_repair_loop.png
  - larry_damage_loop.png
"""

import sys
sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")

import bpy
import bmesh
import mathutils
import math
import os
import shutil
import tempfile
import time
from PIL import Image

def build_larry():
    print("==================================================")
    print("ASSEMBLING MASTER LARRY IT TECHNICIAN RIG")
    print("==================================================")
    
    blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_base_comic.blend"
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))
    
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    
    body = bpy.data.objects['LPC_Decivoxel_Flesh_Fused']
    arm = bpy.data.objects['Armature']
    face = bpy.data.objects.get('LPC_Face_Decal')
    if face:
        face.hide_render = False
        
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    mat_outline = bpy.data.materials.get('LPC_Outline_Mat')
    
    def make_cel_mat(name, stops):
        mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        nodes.clear()
        
        diff = nodes.new('ShaderNodeBsdfDiffuse')
        diff.inputs['Color'].default_value = (1.0, 1.0, 1.0, 1.0)
        diff.inputs['Roughness'].default_value = 0.0
        
        s2rgb = nodes.new('ShaderNodeShaderToRGB')
        ramp = nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.interpolation = 'CONSTANT'
        
        while len(ramp.color_ramp.elements) > 1:
            ramp.color_ramp.elements.remove(ramp.color_ramp.elements[-1])
            
        for i, (pos, col) in enumerate(stops):
            if i == 0:
                el = ramp.color_ramp.elements[0]
                el.position = pos
                el.color = (*col, 1.0)
            else:
                el = ramp.color_ramp.elements.new(pos)
                el.color = (*col, 1.0)
                
        emit = nodes.new('ShaderNodeEmission')
        out = nodes.new('ShaderNodeOutputMaterial')
        
        links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
        links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
        links.new(ramp.outputs['Color'], emit.inputs['Color'])
        links.new(emit.outputs['Emission'], out.inputs['Surface'])
        return mat
        
    mat_shirt = make_cel_mat('Larry_Shirt_Cel', [
        (0.00, (0.75, 0.78, 0.86)),
        (0.32, (0.86, 0.89, 0.95)),
        (0.48, (0.97, 0.98, 1.00)),
        (0.85, (1.00, 1.00, 1.00))
    ])

    mat_slacks = make_cel_mat('Larry_Slacks_Cel', [
        (0.00, (0.12, 0.18, 0.28)),
        (0.32, (0.20, 0.30, 0.44)),
        (0.48, (0.34, 0.46, 0.62)),
        (0.85, (0.50, 0.64, 0.80))
    ])

    mat_belt = make_cel_mat('Larry_Belt_Cel', [
        (0.00, (0.05, 0.04, 0.03)),
        (0.35, (0.12, 0.09, 0.07)),
        (0.50, (0.22, 0.16, 0.12))
    ])

    mat_buckle = make_cel_mat('Larry_Buckle_Cel', [
        (0.00, (0.35, 0.25, 0.05)),
        (0.35, (0.65, 0.50, 0.12)),
        (0.50, (0.95, 0.80, 0.22)),
        (0.85, (1.00, 0.92, 0.50))
    ])

    mat_tie = make_cel_mat('Larry_Tie_Cel', [
        (0.00, (0.45, 0.02, 0.04)),
        (0.32, (0.72, 0.04, 0.06)),
        (0.48, (0.95, 0.08, 0.10)),
        (0.85, (1.00, 0.25, 0.28))
    ])

    mat_shoes = make_cel_mat('Larry_Shoes_Cel', [
        (0.00, (0.04, 0.03, 0.02)),
        (0.35, (0.10, 0.08, 0.06)),
        (0.50, (0.18, 0.14, 0.11))
    ])

    mat_hair = make_cel_mat('Larry_Hair_Cel', [
        (0.00, (0.14, 0.08, 0.05)),
        (0.32, (0.28, 0.18, 0.11)),
        (0.48, (0.42, 0.28, 0.18)),
        (0.85, (0.58, 0.40, 0.28))
    ])

    def apply_solidify_outline(obj, outline_mat, thickness=0.006):
        if outline_mat.name not in [s.material.name for s in obj.material_slots if s.material]:
            obj.data.materials.append(outline_mat)
        slot_idx = [s.material.name for s in obj.material_slots if s.material].index(outline_mat.name)
        mod = obj.modifiers.get('LPC_Ink_Outline') or obj.modifiers.new(name='LPC_Ink_Outline', type='SOLIDIFY')
        mod.thickness = -abs(thickness)
        mod.offset = 0.0
        mod.material_offset = slot_idx
        mod.use_flip_normals = True
        return mod

    # 1. BODY MASK (Conceal body skin covered by shirt, pants, shoes, and scalp under hair)
    vg_vis = body.vertex_groups.get('Body_Visible') or body.vertex_groups.new(name='Body_Visible')
    for v in body.data.vertices:
        z = v.co.z
        x = abs(v.co.x)
        y = v.co.y
        is_scalp = (z > 1.15) or (y > 0.02 and z > 1.05)
        # Head AND Neck: Z >= 0.820 (chin at ~0.90, neck cylinder between 0.82 and 0.90)
        is_head_neck = (z >= 0.820 and not is_scalp)
        is_hand = (x >= 0.47 and z < 0.85)
        
        if is_head_neck or is_hand:
            vg_vis.add([v.index], 1.0, 'REPLACE')
        else:
            vg_vis.add([v.index], 0.0, 'REPLACE')

    mask_mod = body.modifiers.get('Body_Mask') or body.modifiers.new('Body_Mask', 'MASK')
    mask_mod.vertex_group = 'Body_Visible'
    mask_mod.invert_vertex_group = False
    bpy.context.view_layer.objects.active = body
    while body.modifiers[0].name != 'Body_Mask':
        bpy.ops.object.modifier_move_up(modifier='Body_Mask')

    # 2. WHITE DRESS SHIRT (True T-Pose Armature Alignment with Exposed Neck)
    print("Constructing 3D Dress Shirt...")
    bm_s = bmesh.new()

    N_CIRC = 16
    shirt_profiles = [
        (0.830, 0.082, 0.076, -0.005, 0.10, 0.90, 0.00), # Collar band wrapping around base of neck
        (0.800, 0.146, 0.118, -0.010, 0.00, 0.85, 0.15), # Shoulders / Clavicles
        (0.720, 0.156, 0.125, -0.010, 0.00, 0.50, 0.50), # Mid chest
        (0.640, 0.148, 0.118, -0.008, 0.00, 0.20, 0.80), # Ribcage
        (0.570, 0.142, 0.115, -0.004, 0.00, 0.05, 0.95), # Waist
        (0.530, 0.142, 0.116,  0.000, 0.00, 0.00, 1.00), # Tucked into slacks waistline
    ]

    shirt_rings = []
    shirt_weights = []
    for z, rx, ry, off_y, w_nk, w_sp1, w_sp in shirt_profiles:
        ring = []
        for i in range(N_CIRC):
            ang = (i / float(N_CIRC)) * 2.0 * math.pi
            vx = math.cos(ang) * rx
            vy = off_y + math.sin(ang) * ry
            vz = z
            v = bm_s.verts.new(mathutils.Vector((vx, vy, vz)))
            ring.append(v)
            shirt_weights.append((v, {'neck': w_nk, 'Spine01': w_sp1, 'Spine': w_sp}))
        shirt_rings.append(ring)

    for r in range(len(shirt_rings) - 1):
        for i in range(N_CIRC):
            i_next = (i + 1) % N_CIRC
            bm_s.faces.new([shirt_rings[r][i], shirt_rings[r][i_next], shirt_rings[r+1][i_next], shirt_rings[r+1][i]])

    N_SLV = 10
    sleeve_steps = [
        (0.140, 0.082, 0.50, 0.50, 0.00), # Shoulder / armhole
        (0.220, 0.080, 0.10, 0.90, 0.00), # Bicep
        (0.320, 0.076, 0.00, 0.70, 0.30), # Upper elbow
        (0.360, 0.074, 0.00, 0.30, 0.70), # Lower elbow
        (0.430, 0.072, 0.00, 0.00, 1.00), # Forearm
        (0.485, 0.074, 0.00, 0.00, 1.00), # Buttoned cuff at wrist
    ]

    def build_sleeve_tpose(bm, is_left):
        sign = 1.0 if is_left else -1.0
        sh_bone = 'LeftShoulder' if is_left else 'RightShoulder'
        arm_bone = 'LeftArm' if is_left else 'RightArm'
        fore_bone = 'LeftForeArm' if is_left else 'RightForeArm'
        
        rings = []
        w_list = []
        for x_val, r, w_sh, w_arm, w_fa in sleeve_steps:
            ring = []
            cx = sign * x_val
            cy = 0.000
            cz = 0.810
            for i in range(N_SLV):
                ang = (i / float(N_SLV)) * 2.0 * math.pi
                vy = cy + math.cos(ang) * r
                vz = cz + math.sin(ang) * r
                vx = cx
                v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
                ring.append(v)
                w_list.append((v, {sh_bone: w_sh, arm_bone: w_arm, fore_bone: w_fa}))
            rings.append(ring)
            
        for r in range(len(rings) - 1):
            for i in range(N_SLV):
                i_next = (i + 1) % N_SLV
                bm.faces.new([rings[r][i], rings[r][i_next], rings[r+1][i_next], rings[r+1][i]])
        return w_list

    w_s_l = build_sleeve_tpose(bm_s, True)
    w_s_r = build_sleeve_tpose(bm_s, False)

    # Collar Wings at base of neck
    for sign in [-1.0, 1.0]:
        bmesh.ops.create_cube(
            bm_s, size=1.0,
            matrix=(
                mathutils.Matrix.Translation((sign * 0.046, -0.084, 0.825)) @
                mathutils.Euler((math.radians(20), math.radians(sign * 12), math.radians(-sign * 30))).to_matrix().to_4x4() @
                mathutils.Matrix.Diagonal((0.042, 0.015, 0.046, 1.0))
            )
        )

    # Front Placket
    bmesh.ops.create_cube(
        bm_s, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.134, 0.670)) @
            mathutils.Euler((math.radians(3), 0, 0)).to_matrix().to_4x4() @
            mathutils.Matrix.Diagonal((0.028, 0.014, 0.270, 1.0))
        )
    )

    bm_s.verts.index_update()
    bm_s.verts.ensure_lookup_table()
    final_shirt_weights = [(v.index, w) for v, w in shirt_weights + w_s_l + w_s_r]

    mesh_shirt = bpy.data.meshes.new('Larry_Shirt_Mesh')
    bm_s.to_mesh(mesh_shirt)
    bm_s.free()

    obj_shirt = bpy.data.objects.new('Larry_Shirt', mesh_shirt)
    bpy.context.collection.objects.link(obj_shirt)
    obj_shirt.parent = arm
    mod_arm_s = obj_shirt.modifiers.new('Armature', 'ARMATURE')
    mod_arm_s.object = arm

    for b in ['neck', 'Spine01', 'Spine', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'RightShoulder', 'RightArm', 'RightForeArm']:
        obj_shirt.vertex_groups.new(name=b)

    for v_idx, weights in final_shirt_weights:
        for b_name, weight in weights.items():
            if weight > 0.001:
                obj_shirt.vertex_groups[b_name].add([v_idx], weight, 'REPLACE')

    for v in mesh_shirt.vertices:
        if v.index >= len(final_shirt_weights):
            obj_shirt.vertex_groups['Spine01'].add([v.index], 1.0, 'REPLACE')

    obj_shirt.data.materials.append(mat_shirt)
    apply_solidify_outline(obj_shirt, mat_outline, thickness=0.005)
    print("Dress shirt created.")

    # 3. RADIANT RED 3D NECKTIE (Collar-Nestled Knot)
    print("Constructing 3D Radiant Red Necktie...")
    bm_t = bmesh.new()

    bmesh.ops.create_cube(
        bm_t, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.100, 0.810)) @
            mathutils.Euler((math.radians(12), 0, 0)).to_matrix().to_4x4() @
            mathutils.Matrix.Diagonal((0.038, 0.024, 0.034, 1.0))
        )
    )
    bmesh.ops.create_cube(
        bm_t, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.142, 0.725)) @
            mathutils.Euler((math.radians(5), 0, 0)).to_matrix().to_4x4() @
            mathutils.Matrix.Diagonal((0.034, 0.016, 0.130, 1.0))
        )
    )
    bmesh.ops.create_cube(
        bm_t, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.136, 0.630)) @
            mathutils.Euler((math.radians(2), 0, 0)).to_matrix().to_4x4() @
            mathutils.Matrix.Diagonal((0.044, 0.016, 0.100, 1.0))
        )
    )
    bmesh.ops.create_cube(
        bm_t, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.134, 0.560)) @
            mathutils.Euler((0, 0, math.radians(45))).to_matrix().to_4x4() @
            mathutils.Matrix.Diagonal((0.032, 0.032, 0.016, 1.0))
        )
    )
    bmesh.ops.create_cube(
        bm_t, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.136, 0.555)) @
            mathutils.Euler((0, 0, math.radians(45))).to_matrix().to_4x4() @
            mathutils.Matrix.Diagonal((0.034, 0.034, 0.014, 1.0))
        )
    )

    mesh_tie = bpy.data.meshes.new('Larry_Tie_Mesh')
    bm_t.to_mesh(mesh_tie)
    bm_t.free()

    obj_tie = bpy.data.objects.new('Larry_Tie', mesh_tie)
    bpy.context.collection.objects.link(obj_tie)
    obj_tie.parent = arm
    mod_arm_t = obj_tie.modifiers.new('Armature', 'ARMATURE')
    mod_arm_t.object = arm

    vg_t_hp = obj_tie.vertex_groups.new(name='Hips')
    vg_t_sp = obj_tie.vertex_groups.new(name='Spine')
    vg_t_sp1 = obj_tie.vertex_groups.new(name='Spine01')
    vg_t_nk = obj_tie.vertex_groups.new(name='neck')

    def get_anatomical_tie_weights(z):
        if z <= 0.56:
            return 0.80, 0.20, 0.0, 0.0
        elif z <= 0.64:
            f = (z - 0.56) / 0.08
            w_hp = 0.80 * (1.0 - f)
            w_sp = 0.20 + 0.60 * f
            return w_hp, w_sp, 0.0, 0.0
        elif z <= 0.74:
            f = (z - 0.64) / 0.10
            w_sp = 0.80 * (1.0 - f) + 0.10 * f
            w_sp1 = 0.20 * (1.0 - f) + 0.90 * f
            return 0.0, w_sp, w_sp1, 0.0
        else:
            # Knot at collar: anchored to Spine01 with subtle neck tracking
            f = min(1.0, (z - 0.74) / 0.10)
            w_sp1 = 0.90 * (1.0 - f) + 0.75 * f
            w_nk = 0.10 * (1.0 - f) + 0.25 * f
            return 0.0, 0.0, w_sp1, w_nk

    for vi, v in enumerate(mesh_tie.vertices):
        w_hp, w_sp, w_sp1, w_nk = get_anatomical_tie_weights(v.co.z)
        if w_hp > 0.001: vg_t_hp.add([vi], w_hp, 'REPLACE')
        if w_sp > 0.001: vg_t_sp.add([vi], w_sp, 'REPLACE')
        if w_sp1 > 0.001: vg_t_sp1.add([vi], w_sp1, 'REPLACE')
        if w_nk > 0.001: vg_t_nk.add([vi], w_nk, 'REPLACE')

    obj_tie.data.materials.append(mat_tie)
    apply_solidify_outline(obj_tie, mat_outline, thickness=0.003)
    print("Red tie created.")

    # 4. TAILORED SLACKS & BELT
    print("Constructing Tailored Slacks & Belt...")
    bm_p = bmesh.new()

    N_PELV = 16
    pelvis_profiles = [
        (0.555, 0.146, 0.120, -0.005, 0.80, 0.20),
        (0.525, 0.150, 0.124, -0.005, 0.95, 0.05),
        (0.470, 0.156, 0.130, -0.005, 1.00, 0.00),
    ]

    pelv_rings = []
    pelv_w = []
    for z, rx, ry, off_y, w_hp, w_sp in pelvis_profiles:
        ring = []
        for i in range(N_PELV):
            ang = (i / float(N_PELV)) * 2.0 * math.pi
            vx = math.cos(ang) * rx
            vy = off_y + math.sin(ang) * ry
            vz = z
            v = bm_p.verts.new(mathutils.Vector((vx, vy, vz)))
            ring.append(v)
            pelv_w.append((v, {'Hips': w_hp, 'Spine': w_sp}))
        pelv_rings.append(ring)

    for r in range(len(pelv_rings) - 1):
        for i in range(N_PELV):
            i_next = (i + 1) % N_PELV
            bm_p.faces.new([pelv_rings[r][i], pelv_rings[r][i_next], pelv_rings[r+1][i_next], pelv_rings[r+1][i]])

    N_PL = 12
    leg_steps = [
        (0.460, 0.086, 0.080, -0.005, 0.40, 0.60, 0.00),
        (0.380, 0.092, 0.086, -0.005, 0.00, 0.90, 0.10),
        (0.280, 0.094, 0.088, -0.010, 0.00, 0.50, 0.50),
        (0.180, 0.088, 0.082,  0.000, 0.00, 0.10, 0.90),
        (0.080, 0.080, 0.076,  0.000, 0.00, 0.00, 1.00),
    ]

    def build_leg(bm, is_left):
        sign = 1.0 if is_left else -1.0
        up_bone = 'LeftUpLeg' if is_left else 'RightUpLeg'
        lo_bone = 'LeftLeg' if is_left else 'RightLeg'
        leg_cx = sign * 0.085
        
        rings = []
        w_list = []
        for z, rx, ry, off_y, w_hp, w_up, w_lo in leg_steps:
            ring = []
            for i in range(N_PL):
                ang = (i / float(N_PL)) * 2.0 * math.pi
                vx = leg_cx + math.cos(ang) * rx
                vy = off_y + math.sin(ang) * ry
                vz = z
                v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
                ring.append(v)
                w_list.append((v, {'Hips': w_hp, up_bone: w_up, lo_bone: w_lo}))
            rings.append(ring)
            
        for r in range(len(rings) - 1):
            for i in range(N_PL):
                i_next = (i + 1) % N_PL
                bm.faces.new([rings[r][i], rings[r][i_next], rings[r+1][i_next], rings[r+1][i]])
        return rings, w_list

    r_l, w_l = build_leg(bm_p, True)
    r_r, w_r = build_leg(bm_p, False)

    for i in range(N_PL):
        i_next = (i + 1) % N_PL
        p_idx_l = int((i / float(N_PL)) * (N_PELV // 2))
        p_next_l = (p_idx_l + 1) % N_PELV
        try:
            bm_p.faces.new([r_l[0][i], r_l[0][i_next], pelv_rings[-1][p_next_l], pelv_rings[-1][p_idx_l]])
        except: pass
        
        p_idx_r = (N_PELV // 2) + int((i / float(N_PL)) * (N_PELV // 2))
        p_next_r = (p_idx_r + 1) % N_PELV
        try:
            bm_p.faces.new([r_r[0][i], r_r[0][i_next], pelv_rings[-1][p_next_r], pelv_rings[-1][p_idx_r]])
        except: pass

    bmesh.ops.create_cube(
        bm_p, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((0.0, -0.134, 0.540)) @
            mathutils.Matrix.Diagonal((0.044, 0.016, 0.034, 1.0))
        )
    )

    bm_p.verts.index_update()
    bm_p.verts.ensure_lookup_table()
    final_pants_weights = [(v.index, w) for v, w in pelv_w + w_l + w_r]

    mesh_pants = bpy.data.meshes.new('Larry_Pants_Mesh')
    bm_p.to_mesh(mesh_pants)
    bm_p.free()

    obj_pants = bpy.data.objects.new('Larry_Slacks', mesh_pants)
    bpy.context.collection.objects.link(obj_pants)
    obj_pants.parent = arm
    mod_arm_p = obj_pants.modifiers.new('Armature', 'ARMATURE')
    mod_arm_p.object = arm

    for b in ['Hips', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg', 'Spine']:
        obj_pants.vertex_groups.new(name=b)

    for v_idx, weights in final_pants_weights:
        for b_name, weight in weights.items():
            if weight > 0.001:
                obj_pants.vertex_groups[b_name].add([v_idx], weight, 'REPLACE')

    for v in mesh_pants.vertices:
        if v.index >= len(final_pants_weights):
            obj_pants.vertex_groups['Hips'].add([v.index], 0.7, 'REPLACE')
            obj_pants.vertex_groups['Spine'].add([v.index], 0.3, 'REPLACE')

    obj_pants.data.materials.append(mat_slacks)
    obj_pants.data.materials.append(mat_belt)
    obj_pants.data.materials.append(mat_buckle)

    for poly in mesh_pants.polygons:
        cz = poly.center.z
        cy = poly.center.y
        cx = abs(poly.center.x)
        if cz > 0.525 and cy < -0.125 and cx < 0.030:
            poly.material_index = 2
        elif cz > 0.515:
            poly.material_index = 1
        else:
            poly.material_index = 0

    apply_solidify_outline(obj_pants, mat_outline, thickness=0.006)
    print("Slacks created.")

    # 5. DARK OXFORD SHOES
    print("Constructing Oxford Shoes...")
    bm_sh = bmesh.new()

    for is_left in [True, False]:
        sign = 1.0 if is_left else -1.0
        foot_cx = sign * 0.090
        bmesh.ops.create_cube(
            bm_sh, size=1.0,
            matrix=(
                mathutils.Matrix.Translation((foot_cx, -0.025, 0.045)) @
                mathutils.Matrix.Diagonal((0.082, 0.165, 0.080, 1.0))
            )
        )
        bmesh.ops.create_cube(
            bm_sh, size=1.0,
            matrix=(
                mathutils.Matrix.Translation((foot_cx, -0.095, 0.032)) @
                mathutils.Matrix.Diagonal((0.076, 0.080, 0.055, 1.0))
            )
        )

    mesh_shoes = bpy.data.meshes.new('Larry_Shoes_Mesh')
    bm_sh.to_mesh(mesh_shoes)
    bm_sh.free()

    obj_shoes = bpy.data.objects.new('Larry_Shoes', mesh_shoes)
    bpy.context.collection.objects.link(obj_shoes)
    obj_shoes.parent = arm
    mod_arm_sh = obj_shoes.modifiers.new('Armature', 'ARMATURE')
    mod_arm_sh.object = arm

    vg_lfoot = obj_shoes.vertex_groups.new(name='LeftFoot')
    vg_rfoot = obj_shoes.vertex_groups.new(name='RightFoot')

    for vi, v in enumerate(mesh_shoes.vertices):
        if v.co.x > 0:
            vg_lfoot.add([vi], 1.0, 'REPLACE')
        else:
            vg_rfoot.add([vi], 1.0, 'REPLACE')

    obj_shoes.data.materials.append(mat_shoes)
    apply_solidify_outline(obj_shoes, mat_outline, thickness=0.005)
    print("Shoes created.")

    # 6. NEAT IT HAIRCUT (Full Coverage short01, Clamped at Nape)
    print("Fitting Neat IT Haircut...")
    hair_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\hair"
    bpy.ops.wm.obj_import(filepath=os.path.join(hair_dir, "short01", "short01.obj"))
    h_obj = bpy.context.selected_objects[0]
    h_obj.name = "Larry_Hair"
    h_obj.rotation_euler[0] = math.radians(90)
    bpy.ops.object.transform_apply(rotation=True)

    xs = [v.co.x for v in h_obj.data.vertices]
    ys = [v.co.y for v in h_obj.data.vertices]
    zs = [v.co.z for v in h_obj.data.vertices]

    cx = (max(xs) + min(xs)) / 2.0
    cy = (max(ys) + min(ys)) / 2.0
    z_max = max(zs)
    w_orig = max(xs) - min(xs)
    d_orig = max(ys) - min(ys)

    scale_x = 0.545 / w_orig
    scale_y = 0.525 / d_orig
    scale_z = scale_x

    for v in h_obj.data.vertices:
        v.co.x = (v.co.x - cx) * scale_x
        v.co.y = (v.co.y - cy) * scale_y + 0.005
        calc_z = 1.285 + (v.co.z - z_max) * scale_z * 0.95
        # Cleanly terminates at skull nape (Z=0.925)
        v.co.z = max(0.925, calc_z)
    h_obj.data.update()

    h_obj.parent = arm
    h_mod = h_obj.modifiers.new('Armature', 'ARMATURE')
    h_mod.object = arm
    vg_h = h_obj.vertex_groups.new(name='Head')
    vg_h.add(list(range(len(h_obj.data.vertices))), 1.0, 'REPLACE')

    h_obj.data.materials.clear()
    h_obj.data.materials.append(mat_hair)
    apply_solidify_outline(h_obj, mat_outline, thickness=0.004)
    print("Hair fitted.")

    # 7. SAVE MASTER MODELS
    out_blend = os.path.abspath('flesh_larry_technician.blend')
    artifact_blend = os.path.abspath('artifacts/flesh_golems/larry_it_technician.blend')
    os.makedirs(os.path.dirname(artifact_blend), exist_ok=True)

    bpy.ops.wm.save_as_mainfile(filepath=out_blend)
    bpy.ops.wm.save_as_mainfile(filepath=artifact_blend)
    print(f"Saved master Larry models to:\n  {out_blend}\n  {artifact_blend}")
    return True

def film_master_action_sheets():
    print("==================================================")
    print("FILMING MASTER 8x8 ACTION SHEETS FOR LARRY")
    print("==================================================")
    
    out_blend = os.path.abspath('flesh_larry_technician.blend')
    bpy.ops.wm.open_mainfile(filepath=out_blend)
    
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256
    
    arm = bpy.data.objects['Armature']
    arm.data.pose_position = 'POSE'
    
    cam = bpy.data.objects['RenderCam']
    rot = bpy.data.objects['Cam_Rot_Empty']
    tgt = bpy.data.objects['CamTarget']
    
    rot.location = (0.0, -1.20, 0.62)
    tgt.location = (0.0, -1.20, 0.62)
    cam.location = (0.0, -2.15, 0.25)
    cam.data.lens = 45.0
    
    public_dir = os.path.abspath('apps/web/public/actions')
    dist_dir = os.path.abspath('apps/web/dist/actions')
    os.makedirs(public_dir, exist_ok=True)
    os.makedirs(dist_dir, exist_ok=True)
    
    actions_to_film = [
        ("Idle_Loop", "larry_idle_loop.png"),
        ("Walk_Loop", "larry_walk_loop.png"),
        ("Sprint_Loop", "larry_sprint_loop.png"),
        ("Fixing_Kneeling", "larry_repair_loop.png"),
        ("Hit_Chest", "larry_damage_loop.png")
    ]
    
    angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]
    num_frames = 8
    atlas_size = 256 * 8 # 2048x2048
    
    for act_name, filename in actions_to_film:
        act = bpy.data.actions.get(act_name)
        if not act:
            print(f"[WARN] Action {act_name} not found! Skipping...")
            continue
            
        arm.animation_data.action = act
        if hasattr(act, 'slots') and len(act.slots) > 0:
            arm.animation_data.action_slot = act.slots[0]
            
        f_start = int(act.frame_range[0])
        f_end = int(act.frame_range[1])
        step = (f_end - f_start) / float(num_frames)
        frame_indices = [int(round(f_start + i * step)) for i in range(num_frames)]
        
        master_atlas = Image.new('RGBA', (atlas_size, atlas_size), (0, 0, 0, 0))
        temp_dir = tempfile.mkdtemp(prefix="larry_film_")
        t0 = time.time()
        
        for row_idx, deg in enumerate(angles_deg):
            rot.rotation_euler[2] = math.radians(deg)
            bpy.context.view_layer.update()
            
            for col_idx, f_num in enumerate(frame_indices):
                scene.frame_set(f_num)
                bpy.context.view_layer.update()
                
                tmp_path = os.path.join(temp_dir, f"r{row_idx}_c{col_idx}.png")
                scene.render.filepath = tmp_path
                bpy.ops.render.render(write_still=True)
                
                frame_img = Image.open(tmp_path)
                master_atlas.paste(frame_img, (col_idx * 256, row_idx * 256))
                frame_img.close()
                os.remove(tmp_path)
                
        try:
            os.rmdir(temp_dir)
        except Exception:
            pass
            
        pub_path = os.path.join(public_dir, filename)
        master_atlas.save(pub_path)
        dist_path = os.path.join(dist_dir, filename)
        shutil.copyfile(pub_path, dist_path)
        print(f"[FILMED] {act_name} -> {filename} (2048x2048) in {time.time() - t0:.1f}s")

    # Render a dynamic 4-angle verification strip for Walk and Repair
    os.makedirs('artifacts/verification', exist_ok=True)
    for act_name, frame, label in [("Walk_Loop", 4, "walk"), ("Fixing_Kneeling", 4, "repair")]:
        act = bpy.data.actions.get(act_name)
        arm.animation_data.action = act
        if hasattr(act, 'slots') and len(act.slots) > 0:
            arm.animation_data.action_slot = act.slots[0]
        scene.frame_set(frame)
        for deg in [0, 45, 90, 180]:
            rot.rotation_euler[2] = math.radians(deg)
            bpy.context.view_layer.update()
            scene.render.filepath = os.path.abspath(f'artifacts/verification/master_larry_{label}_{deg}.png')
            bpy.ops.render.render(write_still=True)
    print("==================================================")
    print("ALL 5 MASTER LARRY ACTION SHEETS FILMED & COPIED!")
    print("==================================================")

if __name__ == "__main__":
    build_larry()
    film_master_action_sheets()
