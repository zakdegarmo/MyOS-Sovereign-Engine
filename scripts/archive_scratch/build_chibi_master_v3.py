import bpy, bmesh, mathutils, math, os

def run():
    print('=============================================')
    print('  BUILDING CHIBI MASTER V3: CLOTH & HAIR     ')
    print('=============================================')
    
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    col_clothes = bpy.data.collections.get('Modular_Clothes')
    if not col_clothes:
        col_clothes = bpy.data.collections.new('Modular_Clothes')
        bpy.context.scene.collection.children.link(col_clothes)
        
    col_hair = bpy.data.collections.get('Modular_Hair')
    if not col_hair:
        col_hair = bpy.data.collections.new('Modular_Hair')
        bpy.context.scene.collection.children.link(col_hair)

    CX = 0.007
    CY = 1.241

    # ----------------------------------------------------
    # 1. LIGHTING CALIBRATION (Perfect Studio Three-Point)
    # ----------------------------------------------------
    print('Calibrating studio lighting...')
    key = bpy.data.objects.get('KeyLight')
    if key:
        key.location = (CX + 0.90, CY - 1.20, 1.40)
        key.data.energy = 60.0
        key.data.color = (1.0, 0.96, 0.92)
        key.data.shadow_soft_size = 0.15

    fill = bpy.data.objects.get('FillLight') or bpy.data.objects.get('VioletFill')
    if fill:
        fill.name = 'FillLight'
        fill.location = (CX - 1.00, CY - 1.00, 1.10)
        fill.data.energy = 35.0
        fill.data.color = (0.88, 0.90, 1.0)
        fill.data.shadow_soft_size = 0.25

    rim = bpy.data.objects.get('RimLight')
    if rim:
        rim.location = (CX + 0.20, CY + 1.10, 1.60)
        rim.data.energy = 45.0
        rim.data.color = (1.0, 1.0, 1.0)
        rim.data.shadow_soft_size = 0.10

    # ----------------------------------------------------
    # 2. CONTINUOUS UNIFIED BAGGY PANTS
    # ----------------------------------------------------
    print('Constructing Continuous Manifold Baggy Pants...')
    old_pants = bpy.data.objects.get('Modular_Adventurer_Pants')
    if old_pants: bpy.data.objects.remove(old_pants, do_unlink=True)

    bm_p = bmesh.new()

    # Left leg: cx = 0.117, cy = 1.251
    # Right leg: cx = -0.103, cy = 1.251
    # Z profiles for each leg from pelvis to boot gather
    N_RAD = 12
    leg_steps = [
        # (z, rx, ry, off_y)
        (0.56, 0.095, 0.090,  0.000), # Upper thigh / crotch seam
        (0.50, 0.108, 0.102,  0.003), # Thigh fullness
        (0.44, 0.115, 0.110,  0.005), # Mid thigh puff
        (0.38, 0.116, 0.114,  0.006), # Upper knee
        (0.35, 0.115, 0.114,  0.008), # Over knee ball joint (bridges completely!)
        (0.30, 0.110, 0.108,  0.006), # Below knee
        (0.24, 0.100, 0.096,  0.002), # Mid calf
        (0.18, 0.082, 0.078, -0.002), # Ankle cuff gathering tightly into boot!
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
            # Weights: knee is at Z = 0.35
            if z >= 0.42:
                w_up = 1.0; w_lo = 0.0
                w_hip = max(0.0, (z - 0.48) / 0.08) * 0.35
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
                # Inward crotch clearance
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

    # Waistband / Pelvis ring (sitting tucked underneath the tunic skirt at Z = 0.62)
    N_WAIST = 16
    waist_ring = []
    waist_w = []
    for i in range(N_WAIST):
        ang = (i / float(N_WAIST)) * 2.0 * math.pi
        vx = CX + math.cos(ang) * 0.120
        vy = CY + math.sin(ang) * 0.098
        vz = 0.62
        v = bm_p.verts.new(mathutils.Vector((vx, vy, vz)))
        waist_ring.append(v)
        waist_w.append((v, {'Hips': 1.0}))

    # Connect waistband down to top rings of left and right legs
    # Top rings are rings_l[0] and rings_r[0] at Z = 0.56
    # Left leg connects to waist vertices with X > CX, Right leg connects to X < CX
    for i in range(N_RAD):
        i_next = (i + 1) % N_RAD
        # Left leg to right half of waist
        w_idx = int((i / float(N_RAD)) * (N_WAIST // 2))
        w_next = (w_idx + 1) % N_WAIST
        # create bridges
        try:
            bm_p.faces.new([rings_l[0][i], rings_l[0][i_next], waist_ring[w_next], waist_ring[w_idx]])
        except:
            pass
        # Right leg to left half of waist
        w_idx_r = (N_WAIST // 2) + int((i / float(N_RAD)) * (N_WAIST // 2))
        w_next_r = (w_idx_r + 1) % N_WAIST
        try:
            bm_p.faces.new([rings_r[0][i], rings_r[0][i_next], waist_ring[w_next_r], waist_ring[w_idx_r]])
        except:
            pass

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
    # 3. CONTINUOUS VOLUMETRIC TUNIC (Full Collar, Puffy Sleeves, Flared Hem)
    # ----------------------------------------------------
    print('Constructing Continuous Volumetric Tunic...')
    old_tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
    if old_tunic: bpy.data.objects.remove(old_tunic, do_unlink=True)

    bm_t = bmesh.new()

    # Continuous Torso Tube from High Collar (Z=0.96) down to Flared Skirt (Z=0.48)
    N_TORSO = 16
    torso_profiles = [
        # (z, rx, ry, off_y, w_spine1, w_spine, w_hips)
        (0.96, 0.090, 0.080,  0.000, 0.85, 0.15, 0.00), # Snug high collar covering neck base & clavicle!
        (0.92, 0.125, 0.105,  0.002, 0.80, 0.20, 0.00), # Upper chest / shoulder base
        (0.85, 0.142, 0.118,  0.004, 0.60, 0.40, 0.00), # Mid chest
        (0.78, 0.138, 0.115,  0.003, 0.30, 0.70, 0.00), # Lower ribcage
        (0.70, 0.132, 0.110,  0.001, 0.10, 0.80, 0.10), # Waist
        (0.64, 0.136, 0.114,  0.000, 0.00, 0.40, 0.60), # Belt line
        (0.58, 0.152, 0.125, -0.002, 0.00, 0.15, 0.85), # Flared skirt upper
        (0.52, 0.170, 0.140, -0.004, 0.00, 0.05, 0.95), # Flared skirt mid
        (0.46, 0.190, 0.155, -0.005, 0.00, 0.00, 1.00), # Flared A-line hem draping over hips!
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
    # Left shoulder ball at (0.147, 1.271, 0.980), radius 0.113m
    # Right shoulder ball at (-0.133, 1.271, 0.980), radius 0.113m
    N_SLEEVE = 12
    sleeve_steps = [
        # (u_dist, radius, w_sh, w_arm)
        (0.00, 0.120, 0.85, 0.15), # Armpit / shoulder seam merging into torso
        (0.05, 0.135, 0.50, 0.50), # Over shoulder ball apex (+0.022m clearance!)
        (0.10, 0.132, 0.20, 0.80), # Upper bicep
        (0.15, 0.126, 0.05, 0.95), # Mid bicep
        (0.18, 0.132, 0.00, 1.00), # Turned cuff roll
    ]

    def build_puffy_sleeve(bm, is_left):
        sign = 1.0 if is_left else -1.0
        sh_bone = 'LeftShoulder' if is_left else 'RightShoulder'
        arm_bone = 'LeftArm' if is_left else 'RightArm'
        
        # Center trajectory follows arm bone
        sh_cx = 0.097 if is_left else -0.083
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
    # 4. TRUE ANIME HAIR SYSTEM (Multi-Tier, Swept Bangs, Cheek Locks, Crown)
    # ----------------------------------------------------
    print('Constructing Lush Stylized Anime Hair Architecture...')
    for o in list(col_hair.objects):
        bpy.data.objects.remove(o, do_unlink=True)

    head_bone = arm.pose.bones.get('Head_Socket')
    head_matrix_inv = (arm.matrix_world @ head_bone.matrix).inverted()
    HEAD_CTR = mathutils.Vector((CX, 1.250, 1.150))

    bm_h = bmesh.new()

    # A. Snug Cranium Base Shell
    # Fits skull from crown (Z=1.28) down to forehead hairline (Z=1.18), temples (Z=1.10), and nape (Z=1.02)
    bmesh.ops.create_uvsphere(
        bm_h,
        u_segments=24,
        v_segments=18,
        radius=0.150,
        matrix=mathutils.Matrix.Translation(HEAD_CTR)
    )
    # Trim base shell cleanly at the hairline:
    # Front face opening below hairline (Y < 1.22 and Z < 1.185) and neck opening (Z < 1.01)
    del_verts = []
    for v in bm_h.verts:
        if v.co.z < 1.01:
            del_verts.append(v)
        elif v.co.y < 1.22 and v.co.z < 1.185:
            # Keep hairline smooth across brow
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
            
            # Diamond cross-section
            v_l = bm_h.verts.new(pt - binorm * w)
            v_t = bm_h.verts.new(pt + norm * (w * 0.75)) # Sharp anime crest
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

    # 10 smooth segments per strand
    w_bangs = [0.012, 0.028, 0.042, 0.048, 0.044, 0.038, 0.028, 0.018, 0.008, 0.002]
    w_sides = [0.014, 0.030, 0.044, 0.048, 0.045, 0.038, 0.030, 0.020, 0.010, 0.002]
    w_crown = [0.015, 0.032, 0.048, 0.052, 0.046, 0.038, 0.028, 0.018, 0.008, 0.002]
    w_back  = [0.015, 0.034, 0.050, 0.054, 0.048, 0.040, 0.030, 0.020, 0.010, 0.002]

    # Tier 1: Swept Forehead Bangs (Curved dynamic curtain framing brow and eyes!)
    # Eyes are at Z = 1.10 - 1.14, Y = 1.16
    bang_strands = [
        # Center-left swept lock
        [mathutils.Vector((CX - 0.005, 1.20, 1.25)), mathutils.Vector((CX - 0.012, 1.16, 1.21)), mathutils.Vector((CX - 0.022, 1.13, 1.16)), mathutils.Vector((CX - 0.028, 1.13, 1.115))],
        # Center-right swept lock
        [mathutils.Vector((CX + 0.010, 1.20, 1.25)), mathutils.Vector((CX + 0.020, 1.16, 1.21)), mathutils.Vector((CX + 0.032, 1.13, 1.16)), mathutils.Vector((CX + 0.038, 1.13, 1.115))],
        # Inner left diagonal sweep
        [mathutils.Vector((CX - 0.035, 1.21, 1.24)), mathutils.Vector((CX - 0.048, 1.17, 1.20)), mathutils.Vector((CX - 0.062, 1.14, 1.15)), mathutils.Vector((CX - 0.070, 1.14, 1.105))],
        # Inner right diagonal sweep
        [mathutils.Vector((CX + 0.035, 1.21, 1.24)), mathutils.Vector((CX + 0.048, 1.17, 1.20)), mathutils.Vector((CX + 0.062, 1.14, 1.15)), mathutils.Vector((CX + 0.070, 1.14, 1.105))],
        # Outer left temple fringe
        [mathutils.Vector((CX - 0.070, 1.22, 1.23)), mathutils.Vector((CX - 0.088, 1.18, 1.18)), mathutils.Vector((CX - 0.100, 1.15, 1.13)), mathutils.Vector((CX - 0.105, 1.15, 1.085))],
        # Outer right temple fringe
        [mathutils.Vector((CX + 0.070, 1.22, 1.23)), mathutils.Vector((CX + 0.088, 1.18, 1.18)), mathutils.Vector((CX + 0.100, 1.15, 1.13)), mathutils.Vector((CX + 0.105, 1.15, 1.085))],
        # Center accent parting tuft
        [mathutils.Vector((CX + 0.000, 1.21, 1.26)), mathutils.Vector((CX + 0.002, 1.17, 1.22)), mathutils.Vector((CX - 0.005, 1.14, 1.18)), mathutils.Vector((CX - 0.008, 1.13, 1.135))],
    ]
    for c_pts in bang_strands:
        add_anime_strand(c_pts, w_bangs)

    # Tier 2: Side Cheek Framing Locks (Curving along cheekbones down to Z = 1.02m)
    side_strands = [
        # Left cheek front lock
        [mathutils.Vector((CX - 0.11, 1.23, 1.21)), mathutils.Vector((CX - 0.14, 1.19, 1.16)), mathutils.Vector((CX - 0.15, 1.16, 1.08)), mathutils.Vector((CX - 0.14, 1.16, 1.020))],
        # Left cheek outer drape
        [mathutils.Vector((CX - 0.13, 1.26, 1.19)), mathutils.Vector((CX - 0.16, 1.23, 1.14)), mathutils.Vector((CX - 0.17, 1.20, 1.06)), mathutils.Vector((CX - 0.15, 1.19, 0.990))],
        # Right cheek front lock
        [mathutils.Vector((CX + 0.11, 1.23, 1.21)), mathutils.Vector((CX + 0.14, 1.19, 1.16)), mathutils.Vector((CX + 0.15, 1.16, 1.08)), mathutils.Vector((CX + 0.14, 1.16, 1.020))],
        # Right cheek outer drape
        [mathutils.Vector((CX + 0.13, 1.26, 1.19)), mathutils.Vector((CX + 0.16, 1.23, 1.14)), mathutils.Vector((CX + 0.17, 1.20, 1.06)), mathutils.Vector((CX + 0.15, 1.19, 0.990))],
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

    # Tier 4: Cascading Nape / Back Locks (Cascading down over neck to Z = 0.96m)
    back_strands = [
        # Center nape cascade
        [mathutils.Vector((CX + 0.00, 1.35, 1.21)), mathutils.Vector((CX + 0.00, 1.38, 1.15)), mathutils.Vector((CX + 0.00, 1.39, 1.05)), mathutils.Vector((CX + 0.00, 1.38, 0.960))],
        # Left nape cascade
        [mathutils.Vector((CX - 0.07, 1.34, 1.21)), mathutils.Vector((CX - 0.09, 1.37, 1.15)), mathutils.Vector((CX - 0.10, 1.37, 1.06)), mathutils.Vector((CX - 0.09, 1.37, 0.980))],
        # Right nape cascade
        [mathutils.Vector((CX + 0.07, 1.34, 1.21)), mathutils.Vector((CX + 0.09, 1.37, 1.15)), mathutils.Vector((CX + 0.10, 1.37, 1.06)), mathutils.Vector((CX + 0.09, 1.37, 0.980))],
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
    print('SUCCESS: Chibi Master V3 successfully generated and saved!')

run()
