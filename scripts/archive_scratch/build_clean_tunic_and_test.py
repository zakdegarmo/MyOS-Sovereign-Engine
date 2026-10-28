import bpy, bmesh, mathutils, math, os

def execute():
    CX = 0.007
    CY = 1.241
    
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    col_clothes = bpy.data.collections.get('Modular_Clothes')
    old_tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
    if old_tunic: bpy.data.objects.remove(old_tunic, do_unlink=True)
    
    bm = bmesh.new()
    N_CIRC = 16
    
    # 1. CONTINUOUS LOFT FROM FLIGHT SKIRT TO COLLAR OPENING
    # 10 continuous rings of 16 vertices each = 100% closed quad manifold!
    torso_profiles = [
        # (z, rx, ry, off_y, w_neck, w_sp01, w_sp, w_hips)
        (0.95, 0.074, 0.066,  0.000, 0.40, 0.60, 0.00, 0.00), # Collar rim around neck base
        (0.93, 0.098, 0.086,  0.001, 0.15, 0.85, 0.00, 0.00), # Base of neck / clavicle slope
        (0.90, 0.128, 0.106,  0.002, 0.00, 0.95, 0.05, 0.00), # Shoulder slope & upper chest
        (0.85, 0.145, 0.118,  0.004, 0.00, 0.70, 0.30, 0.00), # Mid chest
        (0.78, 0.140, 0.114,  0.003, 0.00, 0.35, 0.65, 0.00), # Lower ribcage
        (0.70, 0.134, 0.110,  0.001, 0.00, 0.10, 0.80, 0.10), # Waist
        (0.64, 0.138, 0.114,  0.000, 0.00, 0.00, 0.40, 0.60), # Belt line
        (0.58, 0.165, 0.135, -0.002, 0.00, 0.00, 0.15, 0.85), # Flared skirt upper
        (0.52, 0.192, 0.155, -0.004, 0.00, 0.00, 0.05, 0.95), # Flared skirt mid
        (0.46, 0.218, 0.175, -0.005, 0.00, 0.00, 0.00, 1.00), # Flared A-line hem draping over hips!
    ]
    
    rings = []
    w_list = []
    
    for z, rx, ry, off_y, wneck, wsp01, wsp, whip in torso_profiles:
        ring = []
        for i in range(N_CIRC):
            ang = (i / float(N_CIRC)) * 2.0 * math.pi
            vx = CX + math.cos(ang) * rx
            vy = (CY + off_y) + math.sin(ang) * ry
            vz = z
            v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
            ring.append(v)
            w_list.append((v, {'neck': wneck, 'Spine01': wsp01, 'Spine': wsp, 'Hips': whip}))
        rings.append(ring)
        
    for r in range(len(rings) - 1):
        for i in range(N_CIRC):
            i_next = (i + 1) % N_CIRC
            bm.faces.new([rings[r][i], rings[r][i_next], rings[r+1][i_next], rings[r+1][i]])

    # 2. VOLUMETRIC PUFFY SLEEVES
    N_SLEEVE = 12
    sleeve_steps = [
        # (u_dist, radius, w_sp01, w_sh, w_arm)
        (0.00, 0.126, 0.40, 0.50, 0.10), # Shoulder root
        (0.05, 0.140, 0.10, 0.50, 0.40), # Over shoulder ball apex (+0.027m clearance!)
        (0.10, 0.136, 0.00, 0.25, 0.75), # Upper bicep
        (0.15, 0.128, 0.00, 0.05, 0.95), # Mid bicep
        (0.18, 0.134, 0.00, 0.00, 1.00), # Turned cuff roll
    ]

    def build_puffy_sleeve(bm, is_left):
        sign = 1.0 if is_left else -1.0
        sh_bone = 'LeftShoulder' if is_left else 'RightShoulder'
        arm_bone = 'LeftArm' if is_left else 'RightArm'
        
        sh_cx = 0.098 if is_left else -0.084
        sh_cy = 1.255
        sh_cz = 0.955
        
        rings = []
        for u, r, wsp, wsh, warm in sleeve_steps:
            ring = []
            cx = sh_cx + sign * u
            cy = sh_cy + (u * 0.10)
            cz = sh_cz - (u * 0.05)
            
            for i in range(N_SLEEVE):
                ang = (i / float(N_SLEEVE)) * 2.0 * math.pi
                vy = cy + math.cos(ang) * r
                vz = cz + math.sin(ang) * r
                vx = cx
                v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
                ring.append(v)
                w_list.append((v, {'Spine01': wsp, sh_bone: wsh, arm_bone: warm}))
            rings.append(ring)
            
        for r_idx in range(len(rings) - 1):
            r0 = rings[r_idx]
            r1 = rings[r_idx + 1]
            for i in range(N_SLEEVE):
                i_next = (i + 1) % N_SLEEVE
                bm.faces.new([r0[i], r0[i_next], r1[i_next], r1[i]])
        return rings

    s_l = build_puffy_sleeve(bm, True)
    s_r = build_puffy_sleeve(bm, False)

    bm.verts.index_update()
    bm.verts.ensure_lookup_table()
    tunic_weights = [(v.index, w) for v, w in w_list]

    mesh_tunic = bpy.data.meshes.new('Modular_Adventurer_Tunic_Mesh')
    bm.to_mesh(mesh_tunic)
    bm.free()

    obj_tunic = bpy.data.objects.new('Modular_Adventurer_Tunic', mesh_tunic)
    col_clothes.objects.link(obj_tunic)
    obj_tunic.parent = arm
    obj_tunic.parent_type = 'OBJECT'
    obj_tunic.matrix_world = mathutils.Matrix.Identity(4)

    mod = obj_tunic.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm

    for b in ['neck', 'Spine01', 'Spine', 'Hips', 'LeftShoulder', 'LeftArm', 'RightShoulder', 'RightArm']:
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

    # 3. BODY MASKING TO PREVENT CLIPPING
    mw = man.matrix_world
    grp = man.vertex_groups.get('Body_Visible')
    if not grp:
        grp = man.vertex_groups.new(name='Body_Visible')

    for v in man.data.vertices:
        wco = mw @ v.co
        dx = abs(wco.x - CX)
        z = wco.z
        
        is_head_neck = (z >= 0.94 and dx < 0.08)
        is_hand_arm  = (dx >= 0.28 and z >= 0.70)
        is_foot_shin = (z <= 0.20)
        
        if is_head_neck or is_hand_arm or is_foot_shin:
            grp.add([v.index], 1.0, 'REPLACE')
        else:
            grp.add([v.index], 0.0, 'REPLACE')

    mask_mod = man.modifiers.get('Body_Mask')
    if not mask_mod:
        mask_mod = man.modifiers.new('Body_Mask', 'MASK')
    mask_mod.vertex_group = 'Body_Visible'
    mask_mod.invert_vertex_group = False

    # Collision modifier on Mannequin
    col_mod = man.modifiers.get('Collision')
    if not col_mod:
        col_mod = man.modifiers.new('Collision', 'COLLISION')

    bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest3.blend')
    print('SUCCESS: Built clean closed tunic with natural collar and body masking!')

execute()
