import bpy, bmesh, mathutils, math, os

def run():
    print('=====================================================')
    print('  BUILDING PERFECT VOLUMETRIC CHIBI MASTER ASSETS    ')
    print('=====================================================')
    
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    scene = bpy.context.scene
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.exposure = 0.15
    
    col_clothes = bpy.data.collections.get('Modular_Clothes')
    if not col_clothes:
        col_clothes = bpy.data.collections.new('Modular_Clothes')
        scene.collection.children.link(col_clothes)
        
    col_hair = bpy.data.collections.get('Modular_Hair')
    if not col_hair:
        col_hair = bpy.data.collections.new('Modular_Hair')
        scene.collection.children.link(col_hair)

    CX = 0.007
    CY = 1.241

    # ----------------------------------------------------
    # 0. SKIN MATERIAL WARMTH & SHADOWS
    # ----------------------------------------------------
    mat_skin = man.data.materials[0]
    if mat_skin and mat_skin.node_tree:
        bsdf = mat_skin.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = (0.98, 0.85, 0.76, 1.0) # Warm rosy anime skin
            bsdf.inputs['Roughness'].default_value = 0.35
            
    decal = bpy.data.objects.get('Chibi_Face_Decal')
    if decal:
        decal.visible_shadow = False

    # ----------------------------------------------------
    # 1. STUDIO LIGHTING SETUP
    # ----------------------------------------------------
    print('Configuring soft studio lighting...')
    key = bpy.data.objects.get('KeyLight')
    if key:
        key.location = (CX + 0.80, CY - 1.25, 1.35)
        key.data.energy = 50.0
        key.data.color = (1.0, 0.97, 0.94)
        key.data.shadow_soft_size = 0.20

    fill = bpy.data.objects.get('FillLight') or bpy.data.objects.get('VioletFill')
    if fill:
        fill.name = 'FillLight'
        fill.location = (CX - 0.85, CY - 1.10, 1.15)
        fill.data.energy = 38.0
        fill.data.color = (0.92, 0.92, 1.0)
        fill.data.shadow_soft_size = 0.30

    rim = bpy.data.objects.get('RimLight')
    if rim:
        rim.location = (CX + 0.10, CY + 1.10, 1.55)
        rim.data.energy = 42.0
        rim.data.color = (1.0, 1.0, 1.0)
        rim.data.shadow_soft_size = 0.15

    # ----------------------------------------------------
    # 2. CONTINUOUS VOLUMETRIC BAGGY PANTS
    # ----------------------------------------------------
    print('Constructing Volumetric Baggy Pants...')
    old_pants = bpy.data.objects.get('Modular_Adventurer_Pants')
    if old_pants: bpy.data.objects.remove(old_pants, do_unlink=True)

    bm_p = bmesh.new()
    N_RAD = 14
    # Profile tuned so upper thighs tuck cleanly inside tunic skirt
    # Left leg cx=0.117, Right leg cx=-0.103
    leg_steps = [
        # (z, rx, ry, off_y)
        (0.56, 0.076, 0.072,  0.000), # Upper thigh / crotch tuck (max outer X = 0.117+0.076 = 0.193m)
        (0.50, 0.098, 0.092,  0.003), # Thigh fullness
        (0.44, 0.110, 0.105,  0.005), # Mid thigh puff
        (0.38, 0.114, 0.110,  0.006), # Upper knee
        (0.35, 0.115, 0.112,  0.008), # Over knee ball joint (completely encloses 0.076m knee!)
        (0.30, 0.106, 0.104,  0.006), # Below knee
        (0.24, 0.095, 0.090,  0.002), # Mid calf
        (0.18, 0.074, 0.070, -0.002), # Ankle cuff gathering tightly inside boot!
    ]

    def build_pants_leg(bm, is_left):
        leg_cx = 0.117 if is_left else -0.103
        leg_name = 'Left' if is_left else 'Right'
        up_bone = f'{leg_name}UpLeg'
        lo_bone = f'{leg_name}Leg'
        
        rings = []
        vert_weights = []
        
        for z, rx, ry, off_y in leg_steps:
            ring = []
            if z >= 0.42:
                w_up = 1.0; w_lo = 0.0
                w_hip = max(0.0, (z - 0.48) / 0.08) * 0.40
                w_up -= w_hip
            elif z <= 0.28:
                w_up = 0.0; w_lo = 1.0; w_hip = 0.0
            else:
                t = (z - 0.28) / (0.42 - 0.28)
                blend = 0.5 - 0.5 * math.cos(t * math.pi)
                w_up = blend; w_lo = 1.0 - blend; w_hip = 0.0
                
            for i in range(N_RAD):
                ang = (i / float(N_RAD)) * 2.0 * math.pi
                cos_a = math.cos(ang)
                factor = 0.88 if ((is_left and cos_a < -0.2) or ((not is_left) and cos_a > 0.2)) else 1.0
                vx = leg_cx + cos_a * (rx * factor)
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

    rings_l, w_l = build_pants_leg(bm_p, True)
    rings_r, w_r = build_pants_leg(bm_p, False)

    # Waistband tucked inside tunic
    N_WAIST = 16
    waist_ring = []
    waist_w = []
    for i in range(N_WAIST):
        ang = (i / float(N_WAIST)) * 2.0 * math.pi
        vx = CX + math.cos(ang) * 0.098
        vy = CY + math.sin(ang) * 0.082
        vz = 0.59
        v = bm_p.verts.new(mathutils.Vector((vx, vy, vz)))
        waist_ring.append(v)
        waist_w.append((v, {'Hips': 1.0}))

    for i in range(N_RAD):
        i_next = (i + 1) % N_RAD
        w_idx = int((i / float(N_RAD)) * (N_WAIST // 2))
        w_next = (w_idx + 1) % N_WAIST
        try:
            bm_p.faces.new([rings_l[0][i], rings_l[0][i_next], waist_ring[w_next], waist_ring[w_idx]])
        except: pass
        w_idx_r = (N_WAIST // 2) + int((i / float(N_RAD)) * (N_WAIST // 2))
        w_next_r = (w_idx_r + 1) % N_WAIST
        try:
            bm_p.faces.new([rings_r[0][i], rings_r[0][i_next], waist_ring[w_next_r], waist_ring[w_idx_r]])
        except: pass

    bm_p.verts.index_update()
    bm_p.verts.ensure_lookup_table()
    pants_weights = [(v.index, w) for v, w in w_l + w_r + waist_w]

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

    for b in ['Hips', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg']:
        obj_pants.vertex_groups.new(name=b)
    for v_idx, weights in pants_weights:
        for b_name, weight in weights.items():
            if weight > 0.001:
                obj_pants.vertex_groups[b_name].add([v_idx], weight, 'REPLACE')

    mat_pants = bpy.data.materials.get('M_Adventurer_Pants')
    if mat_pants: obj_pants.data.materials.append(mat_pants)

    # ----------------------------------------------------
    # 3. VOLUMETRIC TUNIC (With Integrated Shoulders, Flared Skirt, Puffy Sleeves)
    # ----------------------------------------------------
    print('Constructing Continuous Volumetric Tunic...')
    old_tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
    if old_tunic: bpy.data.objects.remove(old_tunic, do_unlink=True)

    bm_t = bmesh.new()

    # Torso tube from high neck collar (Z=1.03) down to wide flared skirt (Z=0.46)
    N_TORSO = 16
    torso_profiles = [
        # (z, rx, ry, off_y, w_spine1, w_spine, w_hips)
        (1.03, 0.070, 0.064,  0.000, 1.00, 0.00, 0.00), # High neck collar
        (0.99, 0.105, 0.088,  0.001, 1.00, 0.00, 0.00), # Clavicle / shoulder slope
        (0.94, 0.142, 0.114,  0.003, 0.85, 0.15, 0.00), # Across shoulders & upper chest
        (0.86, 0.148, 0.120,  0.004, 0.60, 0.40, 0.00), # Mid chest
        (0.78, 0.140, 0.115,  0.003, 0.30, 0.70, 0.00), # Lower ribcage
        (0.70, 0.134, 0.110,  0.001, 0.10, 0.80, 0.10), # Waist
        (0.64, 0.138, 0.114,  0.000, 0.00, 0.40, 0.60), # Belt line
        (0.58, 0.165, 0.135, -0.002, 0.00, 0.15, 0.85), # Flared skirt upper
        (0.52, 0.192, 0.155, -0.004, 0.00, 0.05, 0.95), # Flared skirt mid (covers pants completely!)
        (0.46, 0.218, 0.175, -0.005, 0.00, 0.00, 1.00), # Flared A-line hem draping over hips!
    ]

    torso_rings = []
    torso_weights = []
    for z, rx, ry, off_y, wsp1, wsp, whip in torso_profiles:
        ring = []
        for i in range(N_TORSO):
            ang = (i / float(N_TORSO)) * 2.0 * math.pi
            vx = CX + math.cos(ang) * rx
            vy = (CY + off_y) + math.sin(ang) * ry
            vz = z
            v = bm_t.verts.new(mathutils.Vector((vx, vy, vz)))
            ring.append(v)
            torso_weights.append((v, {'Spine1': wsp1, 'Spine': wsp, 'Hips': whip}))
        torso_rings.append(ring)

    for r_idx in range(len(torso_rings) - 1):
        r0 = torso_rings[r_idx]
        r1 = torso_rings[r_idx + 1]
        for i in range(N_TORSO):
            i_next = (i + 1) % N_TORSO
            bm_t.faces.new([r0[i], r0[i_next], r1[i_next], r1[i]])

    # Volumetric Puffy Sleeves encasing shoulder ball joints
    N_SLEEVE = 12
    sleeve_steps = [
        # (u_dist, radius, w_sh, w_arm)
        (0.00, 0.130, 0.85, 0.15), # Shoulder mantle root
        (0.05, 0.142, 0.50, 0.50), # Over shoulder ball apex (+0.029m clearance!)
        (0.10, 0.138, 0.20, 0.80), # Upper bicep
        (0.15, 0.130, 0.05, 0.95), # Mid bicep
        (0.18, 0.136, 0.00, 1.00), # Turned cuff roll
    ]

    def build_puffy_sleeve(bm, is_left):
        sign = 1.0 if is_left else -1.0
        sh_bone = 'LeftShoulder' if is_left else 'RightShoulder'
        arm_bone = 'LeftArm' if is_left else 'RightArm'
        
        sh_cx = 0.102 if is_left else -0.088
        sh_cy = 1.255
        sh_cz = 0.970
        
        rings = []
        w_list = []
        for u, r, w_sh, w_arm in sleeve_steps:
            ring = []
            cx = sh_cx + sign * u
            cy = sh_cy + (u * 0.10)
            cz = sh_cz - (u * 0.06)
            
            for i in range(N_SLEEVE):
                ang = (i / float(N_SLEEVE)) * 2.0 * math.pi
                vy = cy + math.cos(ang) * r
                vz = cz + math.sin(ang) * r
                vx = cx
                v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
                ring.append(v)
                w_list.append((v, {sh_bone: w_sh, arm_bone: w_arm}))
            rings.append(ring)
            
        for r_idx in range(len(rings) - 1):
            r0 = rings[r_idx]
            r1 = rings[r_idx + 1]
            for i in range(N_SLEEVE):
                i_next = (i + 1) % N_SLEEVE
                bm.faces.new([r0[i], r0[i_next], r1[i_next], r1[i]])
        return w_list

    w_sl = build_puffy_sleeve(bm_t, True)
    w_sr = build_puffy_sleeve(bm_t, False)

    bm_t.verts.index_update()
    bm_t.verts.ensure_lookup_table()
    tunic_weights = [(v.index, w) for v, w in torso_weights + w_sl + w_sr]

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

    for b in ['Spine1', 'Spine', 'Hips', 'LeftShoulder', 'LeftArm', 'RightShoulder', 'RightArm']:
        obj_tunic.vertex_groups.new(name=b)
    for v_idx, weights in tunic_weights:
        for b_name, weight in weights.items():
            if weight > 0.001:
                obj_tunic.vertex_groups[b_name].add([v_idx], weight, 'REPLACE')

    mat_tunic = bpy.data.materials.get('M_Adventurer_Tunic')
    mat_belt = bpy.data.materials.get('M_Adventurer_Belt')
    mat_buckle = bpy.data.materials.get('M_Adventurer_Buckle')
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
    # 4. LUSH MULTI-TIER ANIME HAIR SYSTEM
    # ----------------------------------------------------
    print('Constructing Lush Stylized Anime Hair Architecture...')
    for o in list(col_hair.objects):
        bpy.data.objects.remove(o, do_unlink=True)

    head_bone = arm.pose.bones.get('Head_Socket')
    head_matrix_inv = (arm.matrix_world @ head_bone.matrix).inverted()
    HEAD_CTR = mathutils.Vector((CX, 1.250, 1.150))

    bm_h = bmesh.new()

    # A. Snug Cranium Base Shell
    bmesh.ops.create_uvsphere(
        bm_h,
        u_segments=24,
        v_segments=18,
        radius=0.150,
        matrix=mathutils.Matrix.Translation(HEAD_CTR)
    )
    del_verts = []
    for v in bm_h.verts:
        if v.co.z < 1.01:
            del_verts.append(v)
        elif v.co.y < 1.185 and v.co.z < 1.155:
            del_verts.append(v)
    bmesh.ops.delete(bm_h, geom=del_verts, context='VERTS')

    # B. Bezier Diamond Strand Generator
    def add_anime_strand(control_pts, width_profile):
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
            v_t = bm_h.verts.new(pt + norm * (w * 0.75)) # Sharp anime crest highlight
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

    w_bangs = [0.012, 0.028, 0.042, 0.048, 0.044, 0.038, 0.028, 0.018, 0.008, 0.002]
    w_sides = [0.014, 0.030, 0.044, 0.048, 0.045, 0.038, 0.030, 0.020, 0.010, 0.002]
    w_crown = [0.015, 0.032, 0.048, 0.052, 0.046, 0.038, 0.028, 0.018, 0.008, 0.002]
    w_back  = [0.015, 0.034, 0.050, 0.054, 0.048, 0.040, 0.030, 0.020, 0.010, 0.002]

    # Tier 1: Swept Forehead Bangs (Curved dynamic curtain framing brow and eyes!)
    bang_strands = [
        # Center-left swept lock
        [mathutils.Vector((CX - 0.005, 1.16, 1.24)), mathutils.Vector((CX - 0.012, 1.14, 1.20)), mathutils.Vector((CX - 0.022, 1.12, 1.15)), mathutils.Vector((CX - 0.028, 1.12, 1.110))],
        # Center-right swept lock
        [mathutils.Vector((CX + 0.010, 1.16, 1.24)), mathutils.Vector((CX + 0.020, 1.14, 1.20)), mathutils.Vector((CX + 0.032, 1.12, 1.15)), mathutils.Vector((CX + 0.038, 1.12, 1.110))],
        # Inner left diagonal sweep
        [mathutils.Vector((CX - 0.035, 1.17, 1.23)), mathutils.Vector((CX - 0.048, 1.14, 1.19)), mathutils.Vector((CX - 0.062, 1.12, 1.14)), mathutils.Vector((CX - 0.070, 1.13, 1.100))],
        # Inner right diagonal sweep
        [mathutils.Vector((CX + 0.035, 1.17, 1.23)), mathutils.Vector((CX + 0.048, 1.14, 1.19)), mathutils.Vector((CX + 0.062, 1.12, 1.14)), mathutils.Vector((CX + 0.070, 1.13, 1.100))],
        # Outer left temple fringe
        [mathutils.Vector((CX - 0.070, 1.18, 1.22)), mathutils.Vector((CX - 0.088, 1.15, 1.17)), mathutils.Vector((CX - 0.100, 1.14, 1.12)), mathutils.Vector((CX - 0.105, 1.14, 1.080))],
        # Outer right temple fringe
        [mathutils.Vector((CX + 0.070, 1.18, 1.22)), mathutils.Vector((CX + 0.088, 1.15, 1.17)), mathutils.Vector((CX + 0.100, 1.14, 1.12)), mathutils.Vector((CX + 0.105, 1.14, 1.080))],
        # Center accent parting tuft
        [mathutils.Vector((CX + 0.000, 1.16, 1.25)), mathutils.Vector((CX + 0.002, 1.13, 1.21)), mathutils.Vector((CX - 0.005, 1.12, 1.17)), mathutils.Vector((CX - 0.008, 1.12, 1.125))],
    ]
    for c_pts in bang_strands:
        add_anime_strand(c_pts, w_bangs)

    # Tier 2: Side Cheek Framing Locks (Curving along cheekbones down to Z = 1.00m)
    side_strands = [
        # Left cheek front lock
        [mathutils.Vector((CX - 0.11, 1.21, 1.20)), mathutils.Vector((CX - 0.14, 1.18, 1.15)), mathutils.Vector((CX - 0.15, 1.15, 1.07)), mathutils.Vector((CX - 0.14, 1.15, 1.010))],
        # Left cheek outer drape
        [mathutils.Vector((CX - 0.13, 1.25, 1.18)), mathutils.Vector((CX - 0.16, 1.22, 1.13)), mathutils.Vector((CX - 0.17, 1.19, 1.05)), mathutils.Vector((CX - 0.15, 1.18, 0.980))],
        # Right cheek front lock
        [mathutils.Vector((CX + 0.11, 1.21, 1.20)), mathutils.Vector((CX + 0.14, 1.18, 1.15)), mathutils.Vector((CX + 0.15, 1.15, 1.07)), mathutils.Vector((CX + 0.14, 1.15, 1.010))],
        # Right cheek outer drape
        [mathutils.Vector((CX + 0.13, 1.25, 1.18)), mathutils.Vector((CX + 0.16, 1.22, 1.13)), mathutils.Vector((CX + 0.17, 1.19, 1.05)), mathutils.Vector((CX + 0.15, 1.18, 0.980))],
    ]
    for c_pts in side_strands:
        add_anime_strand(c_pts, w_sides)

    # Tier 3: Crown Volume Tufts (Sculpted anime silhouette within Z <= 1.33m)
    crown_strands = [
        # Crown left spike
        [mathutils.Vector((CX - 0.03, 1.26, 1.28)), mathutils.Vector((CX - 0.06, 1.29, 1.32)), mathutils.Vector((CX - 0.09, 1.31, 1.32)), mathutils.Vector((CX - 0.11, 1.33, 1.290))],
        # Crown right spike
        [mathutils.Vector((CX + 0.03, 1.26, 1.28)), mathutils.Vector((CX + 0.06, 1.29, 1.32)), mathutils.Vector((CX + 0.09, 1.31, 1.32)), mathutils.Vector((CX + 0.11, 1.33, 1.290))],
        # Crown top crest tuft
        [mathutils.Vector((CX + 0.00, 1.28, 1.29)), mathutils.Vector((CX + 0.00, 1.31, 1.33)), mathutils.Vector((CX + 0.00, 1.34, 1.33)), mathutils.Vector((CX + 0.00, 1.36, 1.290))],
    ]
    for c_pts in crown_strands:
        add_anime_strand(c_pts, w_crown)

    # Tier 4: Cascading Nape / Back Locks
    back_strands = [
        # Center nape cascade
        [mathutils.Vector((CX + 0.00, 1.35, 1.21)), mathutils.Vector((CX + 0.00, 1.38, 1.15)), mathutils.Vector((CX + 0.00, 1.39, 1.05)), mathutils.Vector((CX + 0.00, 1.38, 0.950))],
        # Left nape cascade
        [mathutils.Vector((CX - 0.07, 1.34, 1.21)), mathutils.Vector((CX - 0.09, 1.37, 1.15)), mathutils.Vector((CX - 0.10, 1.37, 1.06)), mathutils.Vector((CX - 0.09, 1.37, 0.970))],
        # Right nape cascade
        [mathutils.Vector((CX + 0.07, 1.34, 1.21)), mathutils.Vector((CX + 0.09, 1.37, 1.15)), mathutils.Vector((CX + 0.10, 1.37, 1.06)), mathutils.Vector((CX + 0.09, 1.37, 0.970))],
    ]
    for c_pts in back_strands:
        add_anime_strand(c_pts, w_back)

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
    if mat_hair: obj_hair.data.materials.append(mat_hair)

    pin_grp = obj_hair.vertex_groups.new(name='Pin_Roots')
    for v in obj_hair.data.vertices:
        dist = (v.co - HEAD_CTR).length
        w = max(0.0, min(1.0, (0.23 - dist) / 0.08))
        pin_grp.add([v.index], w, 'REPLACE')

    obj_hair.hide_viewport = False
    obj_hair.hide_render = False

    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()

    bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest3.blend')
    print('SUCCESS: Chibi Master Perfect successfully generated and saved!')

run()
