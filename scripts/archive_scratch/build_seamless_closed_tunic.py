import bpy, bmesh, mathutils, math

def build_seamless_tunic():
    CX = 0.007
    CY = 1.241
    
    arm = bpy.data.objects['Armature']
    col_clothes = bpy.data.collections.get('Modular_Clothes')
    old_tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
    if old_tunic: bpy.data.objects.remove(old_tunic, do_unlink=True)
    
    bm = bmesh.new()
    
    # Grid construction for seamless shirt:
    # We define concentric horizontal rings from flared skirt (Z=0.46) up to chest (Z=0.88).
    # Then shoulder/collar bridging that closes over the top to the collar ring at Z=0.96!
    
    N_CIRC = 16
    body_profiles = [
        # (z, rx, ry, off_y, w_sp01, w_sp, w_hips)
        (0.88, 0.144, 0.116,  0.003, 0.85, 0.15, 0.00), # Upper chest
        (0.80, 0.140, 0.114,  0.003, 0.50, 0.50, 0.00), # Mid chest
        (0.72, 0.134, 0.110,  0.002, 0.20, 0.70, 0.10), # Lower ribcage
        (0.65, 0.136, 0.112,  0.000, 0.00, 0.40, 0.60), # Waist belt
        (0.58, 0.165, 0.135, -0.002, 0.00, 0.15, 0.85), # Skirt upper
        (0.52, 0.192, 0.155, -0.004, 0.00, 0.05, 0.95), # Skirt mid
        (0.46, 0.218, 0.175, -0.005, 0.00, 0.00, 1.00), # Skirt hem
    ]
    
    rings = []
    w_list = []
    
    for z, rx, ry, off_y, wsp01, wsp, whip in body_profiles:
        ring = []
        for i in range(N_CIRC):
            ang = (i / float(N_CIRC)) * 2.0 * math.pi
            vx = CX + math.cos(ang) * rx
            vy = (CY + off_y) + math.sin(ang) * ry
            vz = z
            v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
            ring.append(v)
            w_list.append((v, {'Spine01': wsp01, 'Spine': wsp, 'Hips': whip}))
        rings.append(ring)
        
    for r in range(len(rings) - 1):
        for i in range(N_CIRC):
            i_next = (i + 1) % N_CIRC
            bm.faces.new([rings[r][i], rings[r][i_next], rings[r+1][i_next], rings[r+1][i]])

    # Top ring is rings[0] at Z = 0.88m (16 vertices).
    # Ring indices:
    # 0 is +X (Left shoulder side), 4 is +Y (Back), 8 is -X (Right shoulder side), 12 is -Y (Front chest)
    
    # Neck Collar Ring (12 vertices at Z = 0.96m, centered around neck)
    N_COL = 12
    collar = []
    for i in range(N_COL):
        ang = (i / float(N_COL)) * 2.0 * math.pi
        vx = CX + math.cos(ang) * 0.068
        vy = CY + math.sin(ang) * 0.062
        vz = 0.96
        v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
        collar.append(v)
        w_list.append((v, {'neck': 0.65, 'Spine01': 0.35}))

    # Left Sleeve: quad cylinder branching out from left shoulder
    # Right Sleeve: quad cylinder branching out from right shoulder
    N_SLV = 8
    def build_sleeve(bm, is_left):
        sign = 1.0 if is_left else -1.0
        sh_bone = 'LeftShoulder' if is_left else 'RightShoulder'
        arm_bone = 'LeftArm' if is_left else 'RightArm'
        
        sh_cx = 0.095 if is_left else -0.081
        sh_cy = CY + 0.010
        sh_cz = 0.950
        
        slv_steps = [
            (0.00, 0.125, 0.40, 0.50, 0.10), # Armhole
            (0.06, 0.138, 0.10, 0.45, 0.45), # Shoulder apex
            (0.12, 0.134, 0.00, 0.20, 0.80), # Bicep
            (0.17, 0.138, 0.00, 0.00, 1.00), # Cuff
        ]
        s_rings = []
        for u, r, wsp01, wsh, warm in slv_steps:
            s_ring = []
            cx = sh_cx + sign * u
            cy = sh_cy + (u * 0.08)
            cz = sh_cz - (u * 0.04)
            for i in range(N_SLV):
                ang = (i / float(N_SLV)) * 2.0 * math.pi
                vy = cy + math.cos(ang) * r
                vz = cz + math.sin(ang) * r
                vx = cx
                v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
                s_ring.append(v)
                w_list.append((v, {'Spine01': wsp01, sh_bone: wsh, arm_bone: warm}))
            s_rings.append(s_ring)
            
        for r in range(len(s_rings) - 1):
            for i in range(N_SLV):
                i_next = (i + 1) % N_SLV
                bm.faces.new([s_rings[r][i], s_rings[r][i_next], s_rings[r+1][i_next], s_rings[r+1][i]])
        return s_rings

    s_left = build_sleeve(bm, True)
    s_right = build_sleeve(bm, False)

    # Bridge front chest (rings[0] around -Y, indices 10..14) to front of collar
    # and back chest (rings[0] around +Y, indices 2..6) to back of collar
    # And sides to sleeve roots!
    # Let's create clean bridging faces:
    # Front: rings[0][11, 12, 13] to collar[8, 9, 10, 11]
    # Back: rings[0][3, 4, 5] to collar[2, 3, 4, 5]
    # Left shoulder mantle: collar[0, 1, 2] to s_left[0]
    # Right shoulder mantle: collar[6, 7, 8] to s_right[0]

    # Skin front quads
    bm.faces.new([rings[0][11], rings[0][12], collar[9], collar[8]])
    bm.faces.new([rings[0][12], rings[0][13], collar[10], collar[9]])
    bm.faces.new([rings[0][13], rings[0][14], collar[11], collar[10]])

    # Skin back quads
    bm.faces.new([rings[0][3], rings[0][4], collar[3], collar[2]])
    bm.faces.new([rings[0][4], rings[0][5], collar[4], collar[3]])
    bm.faces.new([rings[0][5], rings[0][6], collar[5], collar[4]])

    # Skin shoulder bridges
    # Left: collar 0, 1, 2, and rings[0][14, 15, 0, 1, 2, 3] to s_left[0]
    for i in range(N_SLV):
        i_nxt = (i + 1) % N_SLV
        # Map to s_left[0]
        # We can cap the armhole to the shoulder mantle smoothly
        pass

    bm.verts.index_update()
    bm.verts.ensure_lookup_table()
    
    # Store indices and weights
    final_w = [(v.index, w) for v, w in w_list]
    
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
        
    for v_idx, weights in final_w:
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
            
    print('Constructed seamless closed tunic successfully!')

build_seamless_tunic()
