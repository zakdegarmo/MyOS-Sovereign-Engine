import sys
sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")
import bpy
import bmesh
import mathutils
import math
import os
import time
import json
import random
import numpy as np
from PIL import Image

def generate_juiced_colossus():
    t_start = time.time()
    print("=========================================================================")
    print("=== SOVEREIGN COLOSSUS TITAN: KINETIC MULTI-VOXEL CHUNK ENGINE (THE JUICE) ===")
    print("=========================================================================")
    
    # 1. Reset Scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    
    # 2. Build Armature (Colossus 3.4m)
    arm_data = bpy.data.armatures.new("Armature_Colossus_Data")
    arm_obj = bpy.data.objects.new("Armature_Colossus", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    
    bones = arm_data.edit_bones
    
    hips = bones.new("Hips")
    hips.head = (0.0, 0.0, 1.48)
    hips.tail = (0.0, 0.0, 1.72)
    
    spine = bones.new("Spine")
    spine.head = hips.tail
    spine.tail = (0.0, 0.0, 2.15)
    spine.parent = hips
    
    chest = bones.new("Chest")
    chest.head = spine.tail
    chest.tail = (0.0, 0.0, 2.70)
    chest.parent = spine
    
    neck = bones.new("Neck")
    neck.head = chest.tail
    neck.tail = (0.0, 0.0, 2.90)
    neck.parent = chest
    
    head = bones.new("Head")
    head.head = neck.tail
    head.tail = (0.0, 0.0, 3.35)
    head.parent = neck
    
    for side, sign in [("Left", 1.0), ("Right", -1.0)]:
        sho = bones.new(f"{side}Shoulder")
        sho.head = (sign * 0.16, 0.0, 2.65)
        sho.tail = (sign * 0.62, 0.0, 2.68)
        sho.parent = chest
        
        arm = bones.new(f"{side}Arm")
        arm.head = sho.tail
        arm.tail = (sign * 0.92, -0.05, 2.48)
        arm.parent = sho
        
        forearm = bones.new(f"{side}ForeArm")
        forearm.head = arm.tail
        forearm.tail = (sign * 0.98, -0.10, 1.72)
        forearm.parent = arm
        
        hand = bones.new(f"{side}Hand")
        hand.head = forearm.tail
        hand.tail = (sign * 0.98, -0.16, 0.98)
        hand.parent = forearm
        
        upleg = bones.new(f"{side}UpLeg")
        upleg.head = (sign * 0.38, 0.0, 1.48)
        upleg.tail = (sign * 0.42, 0.0, 0.85)
        upleg.parent = hips
        
        leg = bones.new(f"{side}Leg")
        leg.head = upleg.tail
        leg.tail = (sign * 0.44, 0.0, 0.22)
        leg.parent = upleg
        
        foot = bones.new(f"{side}Foot")
        foot.head = leg.tail
        foot.tail = (sign * 0.44, -0.38, 0.0)
        foot.parent = leg
        
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # 3. Procedural Volumetric Hull
    bm = bmesh.new()
    
    def add_box(center, size):
        sx, sy, sz = size
        cx, cy, cz = center
        bmesh.ops.create_cube(
            bm, size=1.0,
            matrix=mathutils.Matrix.Translation((cx, cy, cz)) @ 
                   mathutils.Matrix.Scale(sx, 4, (1,0,0)) @ 
                   mathutils.Matrix.Scale(sy, 4, (0,1,0)) @ 
                   mathutils.Matrix.Scale(sz, 4, (0,0,1))
        )
        
    def add_cyl(p1, p2, r1, r2=None, segs=12):
        if r2 is None: r2 = r1
        vec = mathutils.Vector(p2) - mathutils.Vector(p1)
        length = vec.length
        if length < 0.001: return
        mid = (mathutils.Vector(p1) + mathutils.Vector(p2)) / 2.0
        rot = mathutils.Vector((0, 0, 1)).rotation_difference(vec.normalized()).to_matrix().to_4x4()
        bmesh.ops.create_cone(
            bm, cap_ends=True, cap_tris=False, segments=segs,
            radius1=r1, radius2=r2, depth=length,
            matrix=mathutils.Matrix.Translation(mid) @ rot
        )
        
    def add_sph(center, radius, segs=10):
        bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=segs, radius=radius, matrix=mathutils.Matrix.Translation(center))

    # Pelvis & Loin Armor
    add_box((0.0, 0.0, 1.48), (0.80, 0.52, 0.36))
    add_box((0.0, -0.19, 1.38), (0.44, 0.20, 0.44))
    
    # Abdomen & 8-Pack Grid
    add_box((0.0, 0.02, 1.92), (0.72, 0.42, 0.56))
    for z_row in [1.68, 1.82, 1.96, 2.10]:
        add_box((-0.16, -0.20, z_row), (0.24, 0.14, 0.10))
        add_box((0.16, -0.20, z_row), (0.24, 0.14, 0.10))
    add_box((-0.35, -0.06, 1.92), (0.18, 0.32, 0.46))
    add_box((0.35, -0.06, 1.92), (0.18, 0.32, 0.46))
    
    # Chest / Pectorals & Trapezius
    add_box((0.0, 0.02, 2.44), (1.16, 0.64, 0.58))
    add_box((-0.33, -0.29, 2.45), (0.50, 0.24, 0.40))
    add_box((0.33, -0.29, 2.45), (0.50, 0.24, 0.40))
    add_box((0.0, -0.18, 2.68), (1.06, 0.26, 0.18))
    add_box((0.0, 0.14, 2.76), (0.86, 0.36, 0.28))
    
    # Neck & Chiseled Titan Head
    add_cyl((0.0, 0.02, 2.68), (0.0, 0.02, 2.92), 0.24, 0.21)
    add_box((0.0, -0.02, 3.10), (0.36, 0.38, 0.38))
    add_box((0.0, -0.21, 3.14), (0.32, 0.10, 0.08))
    add_box((0.0, -0.22, 3.06), (0.09, 0.10, 0.10))
    add_box((0.0, -0.17, 2.96), (0.28, 0.14, 0.10))
    add_box((0.0, -0.02, 3.30), (0.30, 0.32, 0.12))
    add_box((-0.14, 0.02, 3.36), (0.08, 0.10, 0.14))
    add_box((0.14, 0.02, 3.36), (0.08, 0.10, 0.14))
    
    # Arms & Massive Stone Fists
    for sign in [-1.0, 1.0]:
        add_sph((sign * 0.80, 0.0, 2.65), 0.38)
        add_box((sign * 0.80, 0.0, 2.58), (0.42, 0.52, 0.44))
        add_cyl((sign * 0.80, 0.0, 2.58), (sign * 0.90, -0.06, 1.88), 0.27, 0.23)
        add_sph((sign * 0.88, -0.10, 2.22), 0.22)
        add_box((sign * 0.92, 0.02, 1.86), (0.27, 0.28, 0.20))
        add_cyl((sign * 0.92, -0.06, 1.86), (sign * 0.96, -0.12, 1.18), 0.28, 0.23)
        add_box((sign * 1.08, -0.06, 1.50), (0.14, 0.30, 0.56))
        add_box((sign * 0.96, -0.12, 1.15), (0.29, 0.28, 0.18))
        
        # Power Claw / Fist
        add_box((sign * 0.96, -0.15, 0.95), (0.28, 0.32, 0.30))
        add_box((sign * 0.96, -0.29, 0.88), (0.25, 0.18, 0.28))
        add_box((sign * 0.83, -0.25, 1.00), (0.17, 0.19, 0.20))
        
        # Legs & Boots
        add_cyl((sign * 0.38, 0.0, 1.48), (sign * 0.42, 0.0, 0.88), 0.29, 0.25)
        add_sph((sign * 0.40, -0.08, 1.18), 0.25)
        add_box((sign * 0.42, -0.18, 0.88), (0.29, 0.18, 0.26))
        add_cyl((sign * 0.42, 0.0, 0.88), (sign * 0.44, 0.0, 0.24), 0.27, 0.28)
        add_box((sign * 0.44, 0.14, 0.58), (0.27, 0.18, 0.42))
        add_box((sign * 0.44, 0.0, 0.20), (0.31, 0.32, 0.20))
        add_box((sign * 0.44, -0.16, 0.10), (0.35, 0.62, 0.22))
        
    hull_mesh = bpy.data.meshes.new("Colossus_Hull_Mesh")
    bm.to_mesh(hull_mesh)
    bm.free()
    
    hull_obj = bpy.data.objects.new("Colossus_Hull", hull_mesh)
    bpy.context.collection.objects.link(hull_obj)
    
    # 4. Remesh to Microvoxels
    grid_res = 0.042
    voxel_size = grid_res * 1.08
    hull_obj.data.remesh_voxel_size = grid_res
    hull_obj.data.remesh_voxel_adaptivity = 0.0
    bpy.ops.object.select_all(action='DESELECT')
    hull_obj.select_set(True)
    bpy.context.view_layer.objects.active = hull_obj
    bpy.ops.object.voxel_remesh()
    
    sampled_coords = np.array([v.co for v in hull_obj.data.vertices], dtype=np.float32)
    N = len(sampled_coords)
    print(f"[Colossus] Remeshed into {N} microvoxels")
    
    # 5. Vectorized Microvoxel Meshing
    h = voxel_size * 0.5
    unit_v = np.array([
        [-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h],
        [-h, -h,  h], [h, -h,  h], [h, h,  h], [-h, h,  h]
    ], dtype=np.float32)
    
    all_verts = (sampled_coords[:, None, :] + unit_v[None, :, :]).reshape(-1, 3)
    base_faces = np.array([
        [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
        [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]
    ], dtype=np.int32)
    all_faces = (base_faces[None, :, :] + (np.arange(N, dtype=np.int32) * 8)[:, None, None]).reshape(-1, 4)
    
    vox_mesh = bpy.data.meshes.new("Colossus_Voxelmesh_Mesh")
    vox_mesh.from_pydata(all_verts.tolist(), [], all_faces.tolist())
    vox_mesh.update()
    
    vox_obj = bpy.data.objects.new("Colossus_Voxelmesh", vox_mesh)
    bpy.context.collection.objects.link(vox_obj)
    
    # 6. Vibrant Palette & Stepped Strata
    # Warm rich terracotta
    terracotta_bright = np.array([0.94, 0.46, 0.20], dtype=np.float32)
    terracotta_mid    = np.array([0.72, 0.30, 0.11], dtype=np.float32)
    terracotta_dark   = np.array([0.34, 0.12, 0.07], dtype=np.float32)
    
    # Slate basalt armor plates
    basalt_mid    = np.array([0.16, 0.18, 0.26], dtype=np.float32)
    basalt_dark   = np.array([0.08, 0.09, 0.14], dtype=np.float32)
    crevice_black = np.array([0.05, 0.02, 0.03], dtype=np.float32)
    
    cyan_eye   = np.array([0.00, 0.95, 1.00], dtype=np.float32)
    magma_glow = np.array([1.00, 0.60, 0.08], dtype=np.float32)
    
    X = sampled_coords[:, 0]
    Y = sampled_coords[:, 1]
    Z = sampled_coords[:, 2]
    
    # Basalt placement: center chest plate and thigh armor
    is_basalt = ((Z > 1.62) & (Z < 2.65) & (np.abs(X) < 0.40) & (Y < -0.06)) | \
                ((Z >= 0.82) & (Z < 1.45) & (np.abs(X) > 0.22))
                
    strata = (np.sin(Z * 125.0) + 1.0) * 0.5
    
    cube_rgb = np.zeros((N, 3), dtype=np.float32)
    for i in range(N):
        if is_basalt[i]:
            cube_rgb[i] = basalt_mid * (0.80 + 0.35 * strata[i])
        else:
            cube_rgb[i] = terracotta_mid * (0.80 + 0.35 * strata[i])
            
    is_center_seam = (np.abs(X) < 0.038) & (Z > 1.60) & (Z < 2.65) & (Y < -0.14)
    cube_rgb[is_center_seam] = crevice_black
    
    for seam_z in [1.72, 1.86, 2.00, 2.14]:
        is_h_seam = (np.abs(Z - seam_z) < 0.026) & (Y < -0.14) & (np.abs(X) < 0.38)
        cube_rgb[is_h_seam] = crevice_black
        
    is_pec_crease = (np.abs(Z - 2.22) < 0.030) & (Y < -0.20) & (np.abs(X) < 0.56)
    cube_rgb[is_pec_crease] = crevice_black
    
    # Magma core fissures in chest
    is_magma_core = (np.abs(X) < 0.038) & (Z > 2.28) & (Z < 2.60) & (Y > -0.24) & (Y < -0.12)
    cube_rgb[is_magma_core] = magma_glow
    
    # Piercing cyan eyes
    is_eye = (Z > 3.07) & (Z < 3.16) & (Y < -0.15) & (np.abs(X) > 0.04) & (np.abs(X) < 0.13)
    cube_rgb[is_eye] = cyan_eye
    
    # Directional cel shading
    light_dir = np.array([0.55, -0.65, 0.52], dtype=np.float32)
    light_dir /= np.linalg.norm(light_dir)
    norms = sampled_coords.copy()
    norms[:, 2] *= 0.20
    norms_len = np.linalg.norm(norms, axis=1, keepdims=True)
    norms_len[norms_len < 0.001] = 1.0
    norms /= norms_len
    ndotl = np.sum(norms * light_dir, axis=1)
    
    highlight = (ndotl > 0.30) & (~is_eye) & (~is_magma_core)
    shadow = (ndotl < -0.10) & (~is_eye) & (~is_magma_core)
    
    cube_rgb[highlight] = np.clip(cube_rgb[highlight] * 1.30, 0.0, 1.0)
    cube_rgb[shadow] = np.clip(cube_rgb[shadow] * 0.55 + terracotta_dark * 0.45, 0.0, 1.0)
    
    ca = vox_mesh.color_attributes.new(name="VoxelColor", type='FLOAT_COLOR', domain='POINT')
    vert_colors = np.repeat(np.clip(cube_rgb, 0.0, 1.0), 8, axis=0)
    vert_colors_rgba = np.hstack([vert_colors, np.ones((len(vert_colors), 1), dtype=np.float32)])
    ca.data.foreach_set('color', vert_colors_rgba.ravel())
    vox_mesh.update()
    
    mat = bpy.data.materials.new(name="M_Colossus_Strata")
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    attr = nodes.new('ShaderNodeAttribute')
    attr.attribute_name = 'VoxelColor'
    
    emis = nodes.new('ShaderNodeEmission')
    emis.inputs['Strength'].default_value = 1.0
    links.new(attr.outputs['Color'], emis.inputs['Color'])
    
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(emis.outputs['Emission'], out.inputs['Surface'])
    
    vox_obj.data.materials.append(mat)
    
    # 7. Rigid Single-Bone Rig Binding
    arm_mod = vox_obj.modifiers.new("Rig_Bind", 'ARMATURE')
    arm_mod.object = arm_obj
    
    for b in arm_data.bones:
        vox_obj.vertex_groups.new(name=b.name)
        
    def get_bone_name(x, y, z):
        if z >= 2.85:
            return "Head" if abs(x) <= 0.32 else ("LeftShoulder" if x > 0 else "RightShoulder")
        elif z >= 2.60 and abs(x) <= 0.24:
            return "Neck"
        elif z >= 2.12 and abs(x) <= 0.58:
            return "Chest"
        elif z >= 1.62 and abs(x) <= 0.48:
            return "Spine"
        elif z >= 1.35 and abs(x) <= 0.48:
            return "Hips"
        elif abs(x) > 0.48 and z >= 0.90:
            side = "Left" if x > 0 else "Right"
            if z >= 2.45: return f"{side}Shoulder"
            elif z >= 1.85: return f"{side}Arm"
            elif z >= 1.15: return f"{side}ForeArm"
            else: return f"{side}Hand"
        else:
            side = "Left" if x > 0 else "Right"
            if z >= 0.85: return f"{side}UpLeg"
            elif z >= 0.22: return f"{side}Leg"
            else: return f"{side}Foot"

    cubes_by_bone = {}
    voxel_records = []
    
    for c_idx in range(N):
        x, y, z = sampled_coords[c_idx]
        bname = get_bone_name(x, y, z)
        cubes_by_bone.setdefault(bname, []).append(c_idx)
        
        c_col = cube_rgb[c_idx]
        voxel_records.append({
            "id": c_idx,
            "pos": [round(float(x), 4), round(float(y), 4), round(float(z), 4)],
            "color": [round(float(c_col[0]), 3), round(float(c_col[1]), 3), round(float(c_col[2]), 3)],
            "bone": bname,
            "weight": 1.0,
            "is_eye": bool(is_eye[c_idx]),
            "is_magma": bool(is_magma_core[c_idx])
        })
        
    for bname, c_list in cubes_by_bone.items():
        vg = vox_obj.vertex_groups.get(bname)
        if vg:
            v_indices = []
            for c_idx in c_list:
                v_indices.extend(range(c_idx * 8, (c_idx + 1) * 8))
            vg.add(v_indices, 1.0, 'REPLACE')
            
    hull_obj.hide_render = True
    hull_obj.hide_viewport = True
    
    # 8. Camera Setup (Perfect Full-Body Titan Framing)
    cam_rot = bpy.data.objects.new("Cam_Rot_Empty", None)
    cam_rot.location = (0.0, 0.0, 1.70)
    bpy.context.collection.objects.link(cam_rot)
    
    cam_data = bpy.data.cameras.new("RenderCam_Data")
    cam_data.lens = 45
    cam_obj = bpy.data.objects.new("RenderCam", cam_data)
    cam_obj.location = (0.0, -6.80, 0.05)
    cam_obj.rotation_euler = (math.radians(90), 0.0, 0.0)
    cam_obj.parent = cam_rot
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    
    # 9. Direct Procedural Pose Engine (Deterministic & Robust)
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)
    bpy.ops.object.mode_set(mode='POSE')
    pb = arm_obj.pose.bones
    
    def reset_pose():
        for b in pb:
            b.rotation_mode = 'XYZ'
            b.location = (0.0, 0.0, 0.0)
            b.rotation_euler = (0.0, 0.0, 0.0)
            
    # Initialize all bones to XYZ mode
    reset_pose()
            
    def apply_action_pose(action_name, col_idx, total_cols=8):
        reset_pose()
        t = col_idx / float(total_cols) # [0, 1)
        phase = t * 2.0 * math.pi
        
        # Base Heroic Stance
        pb["LeftArm"].rotation_euler = (math.radians(10), math.radians(18), math.radians(-8))
        pb["RightArm"].rotation_euler = (math.radians(10), math.radians(-18), math.radians(8))
        pb["LeftForeArm"].rotation_euler = (math.radians(-22), math.radians(10), 0.0)
        pb["RightForeArm"].rotation_euler = (math.radians(-22), math.radians(-10), 0.0)
        
        if action_name == "idle":
            # Breathing cycle
            breath = math.sin(phase)
            pb["Chest"].location = (0.0, -0.03 * breath, 0.05 * breath)
            pb["Chest"].rotation_euler = (math.radians(-4 * breath), 0.0, 0.0)
            pb["LeftArm"].rotation_euler = (math.radians(10 + 4 * breath), math.radians(18 + 4 * breath), math.radians(-8))
            pb["RightArm"].rotation_euler = (math.radians(10 + 4 * breath), math.radians(-18 - 4 * breath), math.radians(8))
            
        elif action_name == "walk":
            # Earth-shattering stride cycle
            stride = math.sin(phase)
            pb["LeftUpLeg"].rotation_euler = (math.radians(26 * stride), 0.0, 0.0)
            pb["RightUpLeg"].rotation_euler = (math.radians(-26 * stride), 0.0, 0.0)
            pb["LeftArm"].rotation_euler = (math.radians(-28 * stride), math.radians(18), 0.0)
            pb["RightArm"].rotation_euler = (math.radians(28 * stride), math.radians(-18), 0.0)
            pb["Hips"].location = (0.0, 0.0, -0.07 * abs(math.sin(phase)))
            pb["Chest"].rotation_euler = (0.0, 0.0, math.radians(-8 * stride))
            
        elif action_name == "punch":
            # Colossal kinetic punch strike
            if col_idx in [0, 1]:
                # Windup
                w = col_idx / 1.0
                pb["Chest"].rotation_euler = (0.0, 0.0, math.radians(-28 * w))
                pb["RightArm"].rotation_euler = (math.radians(35 * w), math.radians(-35 * w), math.radians(25 * w))
                pb["RightForeArm"].rotation_euler = (math.radians(-22 - 60 * w), 0.0, 0.0)
            elif col_idx in [2, 3, 4]:
                # MAXIMUM EXTENSION IMPACT STRIKE!
                pb["Chest"].rotation_euler = (math.radians(15), 0.0, math.radians(34))
                pb["RightArm"].rotation_euler = (math.radians(-86), math.radians(-12), 0.0)
                pb["RightForeArm"].rotation_euler = (math.radians(-5), 0.0, 0.0)
                pb["LeftArm"].rotation_euler = (math.radians(30), math.radians(25), 0.0) # Guard back
            else:
                # Return
                rec = (col_idx - 5) / 2.0
                pb["Chest"].rotation_euler = (math.radians(15 * (1 - rec)), 0.0, math.radians(34 * (1 - rec)))
                pb["RightArm"].rotation_euler = (math.radians(-86 * (1 - rec) + 10 * rec), math.radians(-18), 0.0)
                pb["RightForeArm"].rotation_euler = (math.radians(-5 * (1 - rec) - 22 * rec), 0.0, 0.0)
                
        elif action_name == "damage":
            # Violent impact recoil
            if col_idx in [0, 1]:
                # Pre-impact
                pass
            elif col_idx in [2, 3]:
                # Violent impact blow to chest/shoulder
                pb["Chest"].location = (0.0, 0.22, 0.0)
                pb["Chest"].rotation_euler = (math.radians(-20), math.radians(16), math.radians(10))
                pb["LeftArm"].rotation_euler = (math.radians(30), math.radians(35), math.radians(20))
                pb["RightArm"].rotation_euler = (math.radians(-15), math.radians(-25), 0.0)
            else:
                # Staggered recovery
                rec = (col_idx - 4) / 3.0
                pb["Chest"].location = (0.0, 0.22 * (1 - rec), 0.0)
                pb["Chest"].rotation_euler = (math.radians(-20 * (1 - rec)), math.radians(16 * (1 - rec)), math.radians(10 * (1 - rec)))
                pb["LeftArm"].rotation_euler = (math.radians(30 * (1 - rec) + 10 * rec), math.radians(35 * (1 - rec) + 18 * rec), 0.0)
                
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Save Blend & JSON Lattice
    actions_dir = os.path.abspath(r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions")
    os.makedirs(actions_dir, exist_ok=True)
    
    out_blend = os.path.abspath(r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\artifacts\flesh_golems\colossus_titan.blend")
    os.makedirs(os.path.dirname(out_blend), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=out_blend)
    print(f"[Colossus] Saved blend file -> {out_blend}")
    
    lattice_json_path = os.path.join(actions_dir, "colossus_titan_voxels.json")
    with open(lattice_json_path, 'w', encoding='utf-8') as f:
        json.dump({
            "charId": "colossus_titan",
            "name": "Colossus Titan",
            "scale": "colossal (3.4m)",
            "voxelCount": N,
            "voxelSize": voxel_size,
            "voxels": voxel_records
        }, f, indent=2)
    print(f"[Colossus] Exported real-time lattice JSON -> {lattice_json_path}")
    
    # Render Preview Still
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    apply_action_pose("idle", 0)
    bpy.context.view_layer.update()
    preview_path = os.path.join(actions_dir, "colossus_titan_preview.png")
    scene.render.filepath = preview_path
    bpy.ops.render.render(write_still=True)
    print(f"[Colossus] Rendered Preview Still -> {preview_path}")
    
    # 10. Filming Engine
    resolution = 256
    num_frames = 8
    angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]
    temp_dir = os.path.abspath(r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\temp_film_titan")
    os.makedirs(temp_dir, exist_ok=True)
    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    
    def film_action(action_name, out_name):
        out_path = os.path.join(actions_dir, out_name)
        atlas = Image.new('RGBA', (resolution * num_frames, resolution * len(angles_deg)), (0, 0, 0, 0))
        print(f"--- Filming {action_name} -> {out_name} ---")
        
        for row_idx, deg in enumerate(angles_deg):
            cam_rot.rotation_euler[2] = math.radians(deg)
            bpy.context.view_layer.update()
            
            for col_idx in range(num_frames):
                apply_action_pose(action_name, col_idx, num_frames)
                bpy.context.view_layer.update()
                
                tmp_tile = os.path.join(temp_dir, f"tile_{row_idx}_{col_idx}.png")
                scene.render.filepath = tmp_tile
                bpy.ops.render.render(write_still=True)
                
                with Image.open(tmp_tile) as im:
                    atlas.paste(im, (col_idx * resolution, row_idx * resolution), im)
                if os.path.exists(tmp_tile):
                    os.remove(tmp_tile)
                    
        atlas.save(out_path)
        print(f"[Done] Saved: {out_path}")
        
    film_action("idle", "colossus_titan_idle_loop.png")
    film_action("walk", "colossus_titan_walk_loop.png")
    film_action("punch", "colossus_titan_punch_loop.png")
    
    # 11. "THE JUICE" — Multi-Voxel Kinetic Chunk Breakaway Engine
    print("=========================================================================")
    print("=== SIMULATING THE JUICE: MULTI-VOXEL CHUNK BREAKAWAY & MAGMA CORE ===")
    print("=========================================================================")
    
    impact_center = mathutils.Vector((-0.26, -0.22, 2.45)) # Left pectoral / shoulder crater
    impact_radius = 0.34
    
    dislodge_indices = []
    inner_magma_indices = []
    
    for c_idx in range(N):
        x, y, z = sampled_coords[c_idx]
        pos = mathutils.Vector((x, y, z))
        dist = (pos - impact_center).length
        if dist <= impact_radius:
            if y < -0.12 or dist > 0.20:
                # Outer crust chunk
                dislodge_indices.append(c_idx)
            else:
                # Deep crater base -> Expose blinding molten core!
                inner_magma_indices.append(c_idx)
                
    # Also grab nearby core voxels to illuminate the entire crater
    for c_idx in range(N):
        x, y, z = sampled_coords[c_idx]
        pos = mathutils.Vector((x, y, z))
        dist = (pos - impact_center).length
        if dist <= impact_radius + 0.08 and y >= -0.18 and y < 0.0:
            if c_idx not in dislodge_indices and c_idx not in inner_magma_indices:
                inner_magma_indices.append(c_idx)
                
    print(f"[The Juice] Dislodging {len(dislodge_indices)} microvoxels into kinetic chunks!")
    print(f"[The Juice] Blazing {len(inner_magma_indices)} internal molten magma core voxels inside crater!")
    
    # Paint crater core voxels with glowing magma emission
    ca_data = vox_mesh.color_attributes["VoxelColor"].data
    for c_idx in inner_magma_indices:
        # Fiery molten gradient
        core_color = (1.0, 0.70, 0.10, 1.0) if random.random() > 0.3 else (1.0, 0.35, 0.02, 1.0)
        for vi in range(c_idx * 8, (c_idx + 1) * 8):
            ca_data[vi].color = core_color
    vox_mesh.update()
    
    # Cohesive chunk clustering (~18 chunks, 10-25 voxels each)
    dislodge_coords = sampled_coords[dislodge_indices]
    num_chunks = max(6, len(dislodge_indices) // 16)
    
    random.seed(1337)
    seed_indices = random.sample(range(len(dislodge_indices)), num_chunks)
    cluster_centers = dislodge_coords[seed_indices].copy()
    
    diffs = dislodge_coords[:, None, :] - cluster_centers[None, :, :]
    dists = np.sum(diffs ** 2, axis=2)
    cluster_assignments = np.argmin(dists, axis=1)
    
    chunks = {}
    for local_idx, c_idx in enumerate(dislodge_indices):
        c_id = cluster_assignments[local_idx]
        chunks.setdefault(c_id, []).append(c_idx)
        
    print(f"[The Juice] Formed {len(chunks)} cohesive multi-voxel fragments!")
    
    # Breakaway object
    breakaway_mesh = vox_mesh.copy()
    breakaway_obj = bpy.data.objects.new("Colossus_Breakaway_Chunks", breakaway_mesh)
    bpy.context.collection.objects.link(breakaway_obj)
    breakaway_obj.matrix_world = vox_obj.matrix_world.copy()
    if vox_obj.data.materials:
        breakaway_obj.data.materials.append(vox_obj.data.materials[0])
        
    for m in list(breakaway_obj.modifiers):
        if m.type == 'ARMATURE':
            breakaway_obj.modifiers.remove(m)
            
    orig_main_coords = {vi: vox_mesh.vertices[vi].co.copy() for vi in range(len(vox_mesh.vertices))}
    orig_breakaway_coords = {vi: breakaway_mesh.vertices[vi].co.copy() for vi in range(len(breakaway_mesh.vertices))}
    
    dislodge_set = set(dislodge_indices)
    for c_idx in range(N):
        if c_idx not in dislodge_set:
            for vi in range(c_idx * 8, (c_idx + 1) * 8):
                breakaway_mesh.vertices[vi].co = mathutils.Vector((0, 0, -100))
    breakaway_mesh.update()
    
    chunk_physics = {}
    for c_id, v_list in chunks.items():
        chunk_vox_centers = [sampled_coords[ci] for ci in v_list]
        com = mathutils.Vector(np.mean(chunk_vox_centers, axis=0))
        radial_dir = (com - impact_center).normalized() if (com - impact_center).length > 0.01 else mathutils.Vector((0, -1, 0))
        blast_speed = random.uniform(2.0, 4.2)
        vel = radial_dir * blast_speed + mathutils.Vector((
            random.uniform(-0.6, 0.6),
            -random.uniform(1.0, 2.5), # blown outward
            random.uniform(0.6, 2.0)   # lofted upward
        ))
        rot_axis = mathutils.Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
        rot_speed = random.uniform(6.0, 16.0)
        chunk_physics[c_id] = {
            "voxels": v_list,
            "com": com,
            "vel": vel,
            "rot_axis": rot_axis,
            "rot_speed": rot_speed
        }
        
    damage_atlas = Image.new('RGBA', (resolution * num_frames, resolution * len(angles_deg)), (0, 0, 0, 0))
    damage_out = os.path.join(actions_dir, "colossus_titan_damage_loop.png")
    
    print(f"--- Filming Deterministic Kinetic Chunk Breakaway -> {damage_out} ---")
    
    for row_idx, deg in enumerate(angles_deg):
        cam_rot.rotation_euler[2] = math.radians(deg)
        bpy.context.view_layer.update()
        
        for col_idx in range(num_frames):
            apply_action_pose("damage", col_idx, num_frames)
            
            if col_idx < 2:
                # Intact before impact
                breakaway_obj.hide_render = True
                for c_idx in dislodge_indices:
                    for vi in range(c_idx * 8, (c_idx + 1) * 8):
                        vox_mesh.vertices[vi].co = orig_main_coords[vi]
                vox_mesh.update()
            else:
                # The Kinetic Chunk Explosion!
                breakaway_obj.hide_render = False
                # Remove dislodged voxels from character mesh to open the crater
                for c_idx in dislodge_indices:
                    for vi in range(c_idx * 8, (c_idx + 1) * 8):
                        vox_mesh.vertices[vi].co = mathutils.Vector((0, 0, -100))
                vox_mesh.update()
                
                dt = (col_idx - 1.4) * 0.12
                gravity_accel = -7.5
                
                for c_id, c_data in chunk_physics.items():
                    vel = c_data["vel"]
                    com0 = c_data["com"]
                    rot_axis = c_data["rot_axis"]
                    rot_speed = c_data["rot_speed"]
                    
                    curr_x = com0.x + vel.x * dt
                    curr_y = com0.y + vel.y * dt
                    curr_z = com0.z + vel.z * dt + 0.5 * gravity_accel * (dt * dt)
                    
                    floor_z = 0.10
                    if curr_z < floor_z:
                        curr_z = floor_z + abs(curr_z - floor_z) * 0.35
                        
                    curr_com = mathutils.Vector((curr_x, curr_y, curr_z))
                    rot_mat = mathutils.Matrix.Rotation(rot_speed * dt, 4, rot_axis)
                    
                    for c_idx in c_data["voxels"]:
                        for vi in range(c_idx * 8, (c_idx + 1) * 8):
                            rel = orig_breakaway_coords[vi] - com0
                            rel_rot = rot_mat @ rel
                            breakaway_mesh.vertices[vi].co = curr_com + rel_rot
                            
                breakaway_mesh.update()
                
            bpy.context.view_layer.update()
            
            tmp_tile = os.path.join(temp_dir, f"dmg_{row_idx}_{col_idx}.png")
            scene.render.filepath = tmp_tile
            bpy.ops.render.render(write_still=True)
            
            with Image.open(tmp_tile) as im:
                damage_atlas.paste(im, (col_idx * resolution, row_idx * resolution), im)
            if os.path.exists(tmp_tile):
                os.remove(tmp_tile)
                
    damage_atlas.save(damage_out)
    print(f"[The Juice Complete] Saved Damage Breakaway Sheet -> {damage_out}")
    
    # Restore mesh
    for vi, co in orig_main_coords.items():
        vox_mesh.vertices[vi].co = co
    vox_mesh.update()
    bpy.data.objects.remove(breakaway_obj, do_unlink=True)
    
    import shutil
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir, ignore_errors=True)
        
    print(f"=== ALL TITAN ACTIONS SYNTHESIZED AND FILMED IN {time.time() - t_start:.2f}s ===")
    return N

if __name__ == '__main__':
    generate_juiced_colossus()
