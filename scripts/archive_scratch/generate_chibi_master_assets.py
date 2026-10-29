import bpy, bmesh, mathutils, math

def execute():
    print('=============================================')
    print('  BUILDING PERFECT VOLUMETRIC CHIBI ASSETS   ')
    print('=============================================')
    
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    # Collections
    col_clothes = bpy.data.collections.get('Modular_Clothes')
    if not col_clothes:
        col_clothes = bpy.data.collections.new('Modular_Clothes')
        bpy.context.scene.collection.children.link(col_clothes)
        
    col_hair = bpy.data.collections.get('Modular_Hair')
    if not col_hair:
        col_hair = bpy.data.collections.new('Modular_Hair')
        bpy.context.scene.collection.children.link(col_hair)

    # Character coordinate frame
    CX = 0.007
    CY = 1.241
    
    # ----------------------------------------------------
    # 1. LIGHTING CALIBRATION
    # ----------------------------------------------------
    print('Calibrating studio lights...')
    key = bpy.data.objects.get('KeyLight')
    if not key:
        k_data = bpy.data.lights.new('KeyLight', 'POINT')
        key = bpy.data.objects.new('KeyLight', k_data)
        bpy.context.scene.collection.objects.link(key)
    key.location = (CX + 0.95, CY - 1.35, 1.45)
    key.data.energy = 55.0
    key.data.color = (1.0, 0.96, 0.92)
    key.data.shadow_soft_size = 0.15

    fill = bpy.data.objects.get('VioletFill') or bpy.data.objects.get('FillLight')
    if not fill:
        f_data = bpy.data.lights.new('FillLight', 'POINT')
        fill = bpy.data.objects.new('FillLight', f_data)
        bpy.context.scene.collection.objects.link(fill)
    fill.name = 'FillLight'
    fill.location = (CX - 1.10, CY - 1.15, 1.10)
    fill.data.energy = 32.0
    fill.data.color = (0.88, 0.90, 1.0)
    fill.data.shadow_soft_size = 0.25

    rim = bpy.data.objects.get('RimLight')
    if not rim:
        r_data = bpy.data.lights.new('RimLight', 'POINT')
        rim = bpy.data.objects.new('RimLight', r_data)
        bpy.context.scene.collection.objects.link(rim)
    rim.location = (CX + 0.20, CY + 1.15, 1.65)
    rim.data.energy = 45.0
    rim.data.color = (1.0, 1.0, 1.0)
    rim.data.shadow_soft_size = 0.10

    # ----------------------------------------------------
    # 2. CONTINUOUS VOLUMETRIC BAGGY PANTS
    # ----------------------------------------------------
    print('Constructing Volumetric Baggy Pants...')
    old_pants = bpy.data.objects.get('Modular_Adventurer_Pants')
    if old_pants: bpy.data.objects.remove(old_pants, do_unlink=True)
    
    bm_p = bmesh.new()
    N_RAD = 12
    leg_profiles = [
        # (z, r_x, r_y, offset_y)
        (0.60, 0.115, 0.105,  0.000), # Pelvis / upper hip
        (0.54, 0.120, 0.112,  0.002), # Upper thigh puff
        (0.48, 0.125, 0.118,  0.005), # Mid thigh maximum puff
        (0.42, 0.122, 0.118,  0.006), # Above knee
        (0.35, 0.118, 0.116,  0.008), # Over knee ball joint (generous bridge!)
        (0.28, 0.112, 0.110,  0.005), # Below knee
        (0.22, 0.104, 0.100,  0.000), # Mid calf
        (0.16, 0.092, 0.088, -0.002), # Ankle cuff gathering into boots
    ]
    
    def build_leg_mesh(bm, is_left):
        leg_cx = 0.117 if is_left else -0.103
        leg_name = 'Left' if is_left else 'Right'
        up_bone = f'{leg_name}UpLeg'
        lo_bone = f'{leg_name}Leg'
        
        rings = []
        vert_weights = [] # list of (v, {bone: weight})
        
        for z, rx, ry, off_y in leg_profiles:
            ring = []
            if z >= 0.44:
                w_up = 1.0; w_lo = 0.0
                w_hip = max(0.0, (z - 0.52) / 0.08) * 0.4
                w_up -= w_hip
            elif z <= 0.26:
                w_up = 0.0; w_lo = 1.0; w_hip = 0.0
            else:
                t = (z - 0.26) / (0.44 - 0.26)
                blend = 0.5 - 0.5 * math.cos(t * math.pi)
                w_up = blend; w_lo = 1.0 - blend; w_hip = 0.0
                
            for i in range(N_RAD):
                ang = (i / float(N_RAD)) * 2.0 * math.pi
                inner_factor = 1.0
                cos_a = math.cos(ang)
                if is_left and cos_a < -0.2:
                    inner_factor = 0.88
                elif (not is_left) and cos_a > 0.2:
                    inner_factor = 0.88
                    
                vx = leg_cx + cos_a * (rx * inner_factor)
                vy = (CY + off_y) + math.sin(ang) * ry
                vz = z
                v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
                ring.append(v)
                
                weights = {up_bone: w_up, lo_bone: w_lo}
                if w_hip > 0.0: weights['Hips'] = w_hip
                vert_weights.append((v, weights))
                
            rings.append(ring)
            
        for r_idx in range(len(rings) - 1):
            r0 = rings[r_idx]
            r1 = rings[r_idx + 1]
            for i in range(N_RAD):
                i_next = (i + 1) % N_RAD
                bm.faces.new([r0[i], r0[i_next], r1[i_next], r1[i]])
                
        return rings, vert_weights

    rings_l, w_l = build_leg_mesh(bm_p, True)
    rings_r, w_r = build_leg_mesh(bm_p, False)
    
    bm_p.verts.index_update()
    bm_p.verts.ensure_lookup_table()
    
    # Store indices before freeing bmesh
    indexed_w_pants = [(v.index, weights) for v, weights in w_l + w_r]
    
    mesh_pants = bpy.data.meshes.new('Modular_Adventurer_Pants_Mesh')
    bm_p.to_mesh(mesh_pants)
    bm_p.free()
    
    obj_pants = bpy.data.objects.new('Modular_Adventurer_Pants', mesh_pants)
    col_clothes.objects.link(obj_pants)
    
    obj_pants.parent = arm
    obj_pants.parent_type = 'OBJECT'
    obj_pants.matrix_world = mathutils.Matrix.Identity(4)
    
    mod = obj_pants.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm
    
    all_bones = ['Hips', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg']
    vgroups = {b: obj_pants.vertex_groups.new(name=b) for b in all_bones}
    
    for v_idx, weights in indexed_w_pants:
        for b_name, weight in weights.items():
            if weight > 0.001:
                vgroups[b_name].add([v_idx], weight, 'REPLACE')
                
    mat_pants = bpy.data.materials.get('M_Adventurer_Pants')
    if not mat_pants:
        mat_pants = bpy.data.materials.new('M_Adventurer_Pants')
        mat_pants.use_nodes = True
        mat_pants.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.16, 0.22, 0.28, 1.0)
    obj_pants.data.materials.append(mat_pants)

    # ----------------------------------------------------
    # 3. CONTINUOUS VOLUMETRIC TUNIC (High Collar, Puffy Sleeves, Flared Hem)
    # ----------------------------------------------------
    print('Constructing Volumetric Tunic...')
    old_tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
    if old_tunic: bpy.data.objects.remove(old_tunic, do_unlink=True)
    
    bm_t = bmesh.new()
    N_TORSO = 14
    torso_profiles = [
        # (z, rx, ry, offset_y, is_skirt)
        (0.96, 0.125, 0.100,  0.000, False), # High neckline/collar encasing neck base
        (0.92, 0.140, 0.115,  0.002, False), # Upper clavicle / chest
        (0.85, 0.155, 0.125,  0.005, False), # Mid chest
        (0.78, 0.150, 0.122,  0.004, False), # Lower ribcage
        (0.70, 0.142, 0.115,  0.002, False), # Waist
        (0.64, 0.146, 0.118,  0.000, False), # Belt line
        (0.58, 0.162, 0.130, -0.002, True),  # Flared skirt upper
        (0.52, 0.180, 0.145, -0.004, True),  # Flared skirt mid
        (0.46, 0.198, 0.160, -0.005, True),  # Flared A-line hem draping over hips!
    ]
    
    torso_rings = []
    torso_w = []
    for z, rx, ry, off_y, is_skirt in torso_profiles:
        ring = []
        if z >= 0.88:
            w_spine1 = 0.8; w_spine = 0.2; w_hip = 0.0
        elif z >= 0.74:
            w_spine1 = 0.4; w_spine = 0.6; w_hip = 0.0
        elif z >= 0.62:
            w_spine1 = 0.0; w_spine = 0.4; w_hip = 0.6
        else:
            w_spine1 = 0.0; w_spine = 0.1; w_hip = 0.9
            
        for i in range(N_TORSO):
            ang = (i / float(N_TORSO)) * 2.0 * math.pi
            vx = CX + math.cos(ang) * rx
            vy = (CY + off_y) + math.sin(ang) * ry
            vz = z
            v = bm_t.verts.new(mathutils.Vector((vx, vy, vz)))
            ring.append(v)
            torso_w.append((v, {'Spine1': w_spine1, 'Spine': w_spine, 'Hips': w_hip}))
        torso_rings.append(ring)
        
    for r_idx in range(len(torso_rings) - 1):
        r0 = torso_rings[r_idx]
        r1 = torso_rings[r_idx + 1]
        for i in range(N_TORSO):
            i_next = (i + 1) % N_TORSO
            bm_t.faces.new([r0[i], r0[i_next], r1[i_next], r1[i]])

    N_SLEEVE = 10
    sleeve_profiles = [
        # (u_dist along arm, radius, bone_weight_arm)
        (0.00, 0.132, 0.20),
        (0.06, 0.145, 0.50),
        (0.12, 0.142, 0.85),
        (0.18, 0.136, 1.00),
        (0.22, 0.142, 1.00),
    ]
    
    def build_sleeve(bm, is_left):
        sign = 1.0 if is_left else -1.0
        sh_x = 0.047 if is_left else -0.033
        sh_y = 1.241
        sh_z = 0.960
        sh_bone = 'LeftShoulder' if is_left else 'RightShoulder'
        arm_bone = 'LeftArm' if is_left else 'RightArm'
        
        rings = []
        w_list = []
        for u, r, w_arm in sleeve_profiles:
            ring = []
            cx = sh_x + sign * (0.04 + u)
            cy = sh_y + (u * 0.12)
            cz = sh_z + (0.02 - u * 0.05)
            
            for i in range(N_SLEEVE):
                ang = (i / float(N_SLEEVE)) * 2.0 * math.pi
                vy = cy + math.cos(ang) * r
                vz = cz + math.sin(ang) * r
                vx = cx
                v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
                ring.append(v)
                w_list.append((v, {sh_bone: 1.0 - w_arm, arm_bone: w_arm}))
            rings.append(ring)
            
        for r_idx in range(len(rings) - 1):
            r0 = rings[r_idx]
            r1 = rings[r_idx + 1]
            for i in range(N_SLEEVE):
                i_next = (i + 1) % N_SLEEVE
                bm.faces.new([r0[i], r0[i_next], r1[i_next], r1[i]])
        return w_list

    w_sl = build_sleeve(bm_t, True)
    w_sr = build_sleeve(bm_t, False)

    bm_t.verts.index_update()
    bm_t.verts.ensure_lookup_table()
    
    indexed_w_tunic = [(v.index, weights) for v, weights in torso_w + w_sl + w_sr]
    
    mesh_tunic = bpy.data.meshes.new('Modular_Adventurer_Tunic_Mesh')
    bm_t.to_mesh(mesh_tunic)
    bm_t.free()
    
    obj_tunic = bpy.data.objects.new('Modular_Adventurer_Tunic', mesh_tunic)
    col_clothes.objects.link(obj_tunic)
    
    obj_tunic.parent = arm
    obj_tunic.parent_type = 'OBJECT'
    obj_tunic.matrix_world = mathutils.Matrix.Identity(4)
    
    mod = obj_tunic.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm
    
    all_tunic_bones = ['Spine1', 'Spine', 'Hips', 'LeftShoulder', 'LeftArm', 'RightShoulder', 'RightArm']
    vgroups_t = {b: obj_tunic.vertex_groups.new(name=b) for b in all_tunic_bones}
    
    for v_idx, weights in indexed_w_tunic:
        for b_name, weight in weights.items():
            if weight > 0.001:
                vgroups_t[b_name].add([v_idx], weight, 'REPLACE')
                
    mat_tunic = bpy.data.materials.get('M_Adventurer_Tunic')
    mat_belt = bpy.data.materials.get('M_Adventurer_Belt')
    mat_buckle = bpy.data.materials.get('M_Adventurer_Buckle')
    if not mat_tunic:
        mat_tunic = bpy.data.materials.new('M_Adventurer_Tunic')
        mat_tunic.use_nodes = True
        mat_tunic.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.12, 0.45, 0.22, 1.0)
    if not mat_belt:
        mat_belt = bpy.data.materials.new('M_Adventurer_Belt')
        mat_belt.use_nodes = True
        mat_belt.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.28, 0.16, 0.08, 1.0)
    if not mat_buckle:
        mat_buckle = bpy.data.materials.new('M_Adventurer_Buckle')
        mat_buckle.use_nodes = True
        mat_buckle.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.92, 0.78, 0.18, 1.0)
        
    obj_tunic.data.materials.append(mat_tunic)
    obj_tunic.data.materials.append(mat_belt)
    obj_tunic.data.materials.append(mat_buckle)
    
    for poly in obj_tunic.data.polygons:
        cz = poly.center.z
        if 0.61 <= cz <= 0.67:
            if abs(poly.center.x - CX) < 0.04 and poly.center.y < CY:
                poly.material_index = 2
            else:
                poly.material_index = 1
        else:
            poly.material_index = 0

    # ----------------------------------------------------
    # 4. VOLUMETRIC MULTI-TIER ANIME HAIR ARCHITECTURE
    # ----------------------------------------------------
    print('Constructing True Stylized Anime Hair Architecture...')
    for o in list(col_hair.objects):
        bpy.data.objects.remove(o, do_unlink=True)
        
    head_bone = arm.pose.bones.get('Head_Socket')
    head_matrix_inv = (arm.matrix_world @ head_bone.matrix).inverted()
    HEAD_CTR = mathutils.Vector((CX, 1.250, 1.150))
    
    bm_h = bmesh.new()
    
    # A. Snug Cranium Base Shell
    bmesh.ops.create_uvsphere(
        bm_h,
        u_segments=20,
        v_segments=16,
        radius=0.152,
        matrix=mathutils.Matrix.Translation(HEAD_CTR)
    )
    del_verts = []
    for v in bm_h.verts:
        if v.co.z < 1.01:
            del_verts.append(v)
        elif v.co.y < 1.24 and v.co.z < 1.17:
            del_verts.append(v)
    bmesh.ops.delete(bm_h, geom=del_verts, context='VERTS')

    def create_anime_strand(control_pts, width_profile):
        n_segs = len(width_profile)
        curve_pts = []
        p0, p1, p2, p3 = control_pts[0], control_pts[1], control_pts[2], control_pts[3]
        for s in range(n_segs):
            t = s / float(n_segs - 1)
            pt = ((1-t)**3)*p0 + 3*((1-t)**2)*t*p1 + 3*(1-t)*(t**2)*p2 + (t**3)*p3
            curve_pts.append(pt)
            
        prev_ring = None
        for i, (pt, w) in enumerate(zip(curve_pts, width_profile)):
            if i < n_segs - 1:
                tangent = (curve_pts[i+1] - pt).normalized()
            else:
                tangent = (pt - curve_pts[i-1]).normalized()
                
            outward = (pt - HEAD_CTR).normalized()
            binorm = tangent.cross(outward).normalized()
            norm = binorm.cross(tangent).normalized()
            
            v_l = bm_h.verts.new(pt - binorm * w)
            v_t = bm_h.verts.new(pt + norm * (w * 0.70))
            v_r = bm_h.verts.new(pt + binorm * w)
            v_b = bm_h.verts.new(pt - norm * (w * 0.35))
            curr_ring = [v_l, v_t, v_r, v_b]
            
            if prev_ring:
                for j in range(4):
                    bm_h.faces.new([
                        prev_ring[j],
                        curr_ring[j],
                        curr_ring[(j+1)%4],
                        prev_ring[(j+1)%4]
                    ])
            prev_ring = curr_ring

    w_bangs = [0.010, 0.024, 0.038, 0.044, 0.042, 0.036, 0.026, 0.016, 0.008, 0.002]
    w_sides = [0.012, 0.026, 0.040, 0.046, 0.044, 0.038, 0.030, 0.020, 0.010, 0.002]
    w_crown = [0.014, 0.030, 0.046, 0.052, 0.048, 0.040, 0.030, 0.018, 0.008, 0.002]
    w_back  = [0.014, 0.032, 0.048, 0.054, 0.050, 0.042, 0.032, 0.020, 0.010, 0.002]

    # Tier 1: Swept Forehead Bangs
    bang_curves = [
        [mathutils.Vector((CX - 0.010, 1.20, 1.24)), mathutils.Vector((CX - 0.015, 1.15, 1.20)), mathutils.Vector((CX - 0.025, 1.12, 1.15)), mathutils.Vector((CX - 0.030, 1.12, 1.105))],
        [mathutils.Vector((CX + 0.015, 1.20, 1.24)), mathutils.Vector((CX + 0.025, 1.15, 1.20)), mathutils.Vector((CX + 0.038, 1.12, 1.15)), mathutils.Vector((CX + 0.045, 1.12, 1.105))],
        [mathutils.Vector((CX - 0.050, 1.21, 1.23)), mathutils.Vector((CX - 0.065, 1.16, 1.19)), mathutils.Vector((CX - 0.080, 1.13, 1.14)), mathutils.Vector((CX - 0.088, 1.13, 1.095))],
        [mathutils.Vector((CX + 0.050, 1.21, 1.23)), mathutils.Vector((CX + 0.065, 1.16, 1.19)), mathutils.Vector((CX + 0.080, 1.13, 1.14)), mathutils.Vector((CX + 0.088, 1.13, 1.095))],
        [mathutils.Vector((CX + 0.000, 1.21, 1.25)), mathutils.Vector((CX + 0.005, 1.16, 1.21)), mathutils.Vector((CX - 0.005, 1.13, 1.16)), mathutils.Vector((CX - 0.008, 1.12, 1.120))],
    ]
    for c_pts in bang_curves:
        create_anime_strand(c_pts, w_bangs)

    # Tier 2: Side Framing Locks
    side_curves = [
        [mathutils.Vector((CX - 0.10, 1.22, 1.22)), mathutils.Vector((CX - 0.13, 1.18, 1.17)), mathutils.Vector((CX - 0.14, 1.15, 1.09)), mathutils.Vector((CX - 0.13, 1.15, 1.020))],
        [mathutils.Vector((CX - 0.12, 1.25, 1.20)), mathutils.Vector((CX - 0.15, 1.22, 1.15)), mathutils.Vector((CX - 0.16, 1.19, 1.07)), mathutils.Vector((CX - 0.15, 1.18, 0.990))],
        [mathutils.Vector((CX + 0.10, 1.22, 1.22)), mathutils.Vector((CX + 0.13, 1.18, 1.17)), mathutils.Vector((CX + 0.14, 1.15, 1.09)), mathutils.Vector((CX + 0.13, 1.15, 1.020))],
        [mathutils.Vector((CX + 0.12, 1.25, 1.20)), mathutils.Vector((CX + 0.15, 1.22, 1.15)), mathutils.Vector((CX + 0.16, 1.19, 1.07)), mathutils.Vector((CX + 0.15, 1.18, 0.990))],
    ]
    for c_pts in side_curves:
        create_anime_strand(c_pts, w_sides)

    # Tier 3: Crown Volume Tufts
    crown_curves = [
        [mathutils.Vector((CX - 0.04, 1.25, 1.28)), mathutils.Vector((CX - 0.07, 1.28, 1.32)), mathutils.Vector((CX - 0.10, 1.31, 1.33)), mathutils.Vector((CX - 0.12, 1.33, 1.300))],
        [mathutils.Vector((CX + 0.04, 1.25, 1.28)), mathutils.Vector((CX + 0.07, 1.28, 1.32)), mathutils.Vector((CX + 0.10, 1.31, 1.33)), mathutils.Vector((CX + 0.12, 1.33, 1.300))],
        [mathutils.Vector((CX + 0.00, 1.27, 1.29)), mathutils.Vector((CX + 0.00, 1.30, 1.34)), mathutils.Vector((CX + 0.00, 1.34, 1.34)), mathutils.Vector((CX + 0.00, 1.37, 1.300))],
    ]
    for c_pts in crown_curves:
        create_anime_strand(c_pts, w_crown)

    # Tier 4: Cascading Nape / Back Locks
    back_curves = [
        [mathutils.Vector((CX + 0.00, 1.35, 1.22)), mathutils.Vector((CX + 0.00, 1.38, 1.16)), mathutils.Vector((CX + 0.00, 1.40, 1.06)), mathutils.Vector((CX + 0.00, 1.40, 0.960))],
        [mathutils.Vector((CX - 0.07, 1.34, 1.22)), mathutils.Vector((CX - 0.09, 1.37, 1.16)), mathutils.Vector((CX - 0.10, 1.38, 1.07)), mathutils.Vector((CX - 0.09, 1.38, 0.980))],
        [mathutils.Vector((CX + 0.07, 1.34, 1.22)), mathutils.Vector((CX + 0.09, 1.37, 1.16)), mathutils.Vector((CX + 0.10, 1.38, 1.07)), mathutils.Vector((CX + 0.09, 1.38, 0.980))],
    ]
    for c_pts in back_curves:
        create_anime_strand(c_pts, w_back)

    bm_h.verts.index_update()
    bm_h.verts.ensure_lookup_table()
    
    mesh_hair = bpy.data.meshes.new('Modular_Hair_Adventurer_Mesh')
    bm_h.to_mesh(mesh_hair)
    bm_h.free()
    
    obj_hair = bpy.data.objects.new('Modular_Hair_Adventurer', mesh_hair)
    col_hair.objects.link(obj_hair)
    
    obj_hair.parent = arm
    obj_hair.parent_type = 'BONE'
    obj_hair.parent_bone = 'Head_Socket'
    obj_hair.matrix_parent_inverse = head_matrix_inv.copy()
    
    mat_hair = bpy.data.materials.get('M_Hair_Adventurer')
    if not mat_hair:
        mat_hair = bpy.data.materials.new('M_Hair_Adventurer')
        mat_hair.use_nodes = True
        bsdf = mat_hair.node_tree.nodes['Principled BSDF']
        bsdf.inputs['Base Color'].default_value = (0.82, 0.48, 0.18, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.35
    obj_hair.data.materials.append(mat_hair)
    
    pin_grp = obj_hair.vertex_groups.new(name='Pin_Roots')
    for v in obj_hair.data.vertices:
        dist = (v.co - HEAD_CTR).length
        w = max(0.0, min(1.0, (0.24 - dist) / 0.09))
        pin_grp.add([v.index], w, 'REPLACE')
        
    obj_hair.hide_viewport = False
    obj_hair.hide_render = False

    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()
    
    bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest3.blend')
    print('SUCCESS: Generated continuous volumetric cloth, 10-segment anime hair, and calibrated lighting!')

execute()
