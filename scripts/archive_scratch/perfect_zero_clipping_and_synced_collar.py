import bpy, bmesh, mathutils, math, os

def run():
    print('=====================================================')
    print('  SYNCHRONIZING COLLAR & ZERO CLIPPING VIA RIG BONES ')
    print('=====================================================')

    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    CX = 0.007

    arm.data.pose_position = 'REST'
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()

    mw = man.matrix_world

    # 1. ENSURE VERTEX GROUPS
    vg_head = man.vertex_groups.get('Head')
    vg_sp01 = man.vertex_groups.get('Spine01')
    vg_sh_l = man.vertex_groups.get('LeftShoulder')
    vg_sh_r = man.vertex_groups.get('RightShoulder')
    vg_arm_l = man.vertex_groups.get('LeftArm')
    vg_arm_r = man.vertex_groups.get('RightArm')
    vg_fa_l = man.vertex_groups.get('LeftForeArm')
    vg_fa_r = man.vertex_groups.get('RightForeArm')
    vg_hand_l = man.vertex_groups.get('LeftHand')
    vg_hand_r = man.vertex_groups.get('RightHand')

    # 2. HARMONIZE NECK WEIGHTS ON MANNEQUIN (Z from 0.92 to 1.05)
    # Give the neck a smooth, organic gradient between Spine01 and Head
    for v in man.data.vertices:
        wco = mw @ v.co
        z = wco.z
        dx = wco.x - CX
        
        # Upper torso / chest strictly belongs to Spine01 / Shoulders
        if z < 0.94 and vg_head:
            for g in v.groups:
                if g.group == vg_head.index and g.weight > 0.001:
                    w = g.weight
                    vg_head.remove([v.index])
                    target = (vg_sh_l if dx > 0 else vg_sh_r) if abs(dx) > 0.08 else vg_sp01
                    if target: target.add([v.index], w, 'ADD')
                    break
        
        # Neck zone (0.94 <= z <= 1.04, central cylinder): smooth blend
        elif 0.94 <= z <= 1.04 and abs(dx) < 0.06:
            # factor 0 at z=0.94, factor 1 at z=1.04
            t = (z - 0.94) / 0.10
            w_head = t * 0.85
            w_sp = (1.0 - t) * 0.85
            vg_head.add([v.index], w_head, 'REPLACE')
            vg_sp01.add([v.index], w_sp, 'REPLACE')

    bpy.context.view_layer.objects.active = man
    bpy.ops.object.vertex_group_normalize_all(lock_active=False)

    # 3. BONE-BASED BODY MASKING
    grp_vis = man.vertex_groups.get('Body_Visible')
    if not grp_vis:
        grp_vis = man.vertex_groups.new(name='Body_Visible')

    def get_w(v, vg):
        if not vg: return 0.0
        for g in v.groups:
            if g.group == vg.index: return g.weight
        return 0.0

    for v in man.data.vertices:
        wco = mw @ v.co
        z = wco.z
        dx = abs(wco.x - CX)

        w_hand_fa = max(get_w(v, vg_fa_l), get_w(v, vg_fa_r), get_w(v, vg_hand_l), get_w(v, vg_hand_r))
        w_up_arm = max(get_w(v, vg_arm_l), get_w(v, vg_arm_r), get_w(v, vg_sh_l), get_w(v, vg_sh_r))
        w_head = get_w(v, vg_head)

        # Visible parts:
        # A. Hand and Forearms: exposed past short puffy sleeve
        is_hand_forearm = (w_hand_fa > 0.15)
        # B. Head & Neck: everything above collar (z >= 0.95 and dx < 0.06 or z >= 1.04)
        is_head = (z >= 1.04)
        is_neck = (0.95 <= z < 1.04 and dx <= 0.055 and 1.15 <= wco.y <= 1.40)
        # C. Bare feet / ankles (if any)
        is_foot = (z <= 0.15)

        # Upper arm strictly hidden inside puffy sleeve
        if w_up_arm > 0.4 and w_hand_fa < 0.15:
            grp_vis.add([v.index], 0.0, 'REPLACE')
        elif is_hand_forearm or is_head or is_neck or is_foot:
            grp_vis.add([v.index], 1.0, 'REPLACE')
        else:
            grp_vis.add([v.index], 0.0, 'REPLACE')

    mask_mod = man.modifiers.get('Body_Mask')
    if not mask_mod:
        mask_mod = man.modifiers.new('Body_Mask', 'MASK')
    mask_mod.vertex_group = 'Body_Visible'
    mask_mod.invert_vertex_group = False
    mask_mod.show_viewport = True
    mask_mod.show_render = True

    # 4. REBUILD PERFECT TUNIC WITH MATCHING COLLAR BLEND
    col_clothes = bpy.data.collections.get('Modular_Clothes')
    old_tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
    if old_tunic:
        bpy.data.objects.remove(old_tunic, do_unlink=True)

    bm = bmesh.new()
    N_CIRC = 20

    # (z, cy, rx, ry, w_head, w_sp01, w_sp, w_hips)
    # Collar matches the neck's weight blend so it moves in perfect synchrony!
    torso_profiles = [
        (1.00, 1.280, 0.050, 0.118, 0.45, 0.55, 0.00, 0.00), # Collar rim hugging neck
        (0.97, 1.276, 0.070, 0.124, 0.25, 0.75, 0.00, 0.00), # Collar stand / clavicle
        (0.92, 1.268, 0.130, 0.122, 0.00, 1.00, 0.00, 0.00), # Upper chest
        (0.86, 1.256, 0.145, 0.118, 0.00, 0.80, 0.20, 0.00), # Mid chest
        (0.78, 1.244, 0.138, 0.110, 0.00, 0.35, 0.65, 0.00), # Lower ribcage
        (0.70, 1.252, 0.132, 0.108, 0.00, 0.10, 0.80, 0.10), # Waist
        (0.64, 1.256, 0.136, 0.112, 0.00, 0.00, 0.40, 0.60), # Belt line
        (0.58, 1.256, 0.165, 0.130, 0.00, 0.00, 0.15, 0.85), # Flared skirt upper
        (0.52, 1.252, 0.195, 0.150, 0.00, 0.00, 0.05, 0.95), # Flared skirt mid
        (0.46, 1.250, 0.222, 0.170, 0.00, 0.00, 0.00, 1.00), # Flared skirt hem
    ]

    rings = []
    w_list = []

    for z, cy, rx, ry, whead, wsp01, wsp, whip in torso_profiles:
        ring = []
        for i in range(N_CIRC):
            ang = (i / float(N_CIRC)) * 2.0 * math.pi
            vx = CX + math.cos(ang) * rx
            vy = cy + math.sin(ang) * ry
            vz = z
            v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
            ring.append(v)
            w_list.append((v, {'Head': whead, 'Spine01': wsp01, 'Spine': wsp, 'Hips': whip}))
        rings.append(ring)

    for r in range(len(rings) - 1):
        for i in range(N_CIRC):
            i_next = (i + 1) % N_CIRC
            bm.faces.new([rings[r][i], rings[r][i_next], rings[r+1][i_next], rings[r+1][i]])

    # SLEEVES WITH FULL SHOULDER CAP COVERAGE
    N_SLEEVE = 16
    sleeve_steps = [
        # (u_dist, radius, w_sp01, w_sh, w_arm)
        (0.00, 0.100, 0.40, 0.50, 0.10), # Shoulder socket root
        (0.04, 0.112, 0.10, 0.50, 0.40), # Puffy apex (+0.025m over joint)
        (0.09, 0.106, 0.00, 0.25, 0.75), # Bicep
        (0.14, 0.092, 0.00, 0.05, 0.95), # Lower bicep
        (0.17, 0.098, 0.00, 0.00, 1.00), # Turned cuff roll
    ]

    def build_puffy_sleeve(bm, is_left):
        sign = 1.0 if is_left else -1.0
        sh_bone = 'LeftShoulder' if is_left else 'RightShoulder'
        arm_bone = 'LeftArm' if is_left else 'RightArm'

        sh_cx = 0.110 if is_left else -0.096
        sh_cy = 1.270
        sh_cz = 0.965

        s_rings = []
        for u, r, wsp, wsh, warm in sleeve_steps:
            ring = []
            cx = sh_cx + sign * u
            cy = sh_cy
            cz = sh_cz - (u * 0.04)

            for i in range(N_SLEEVE):
                ang = (i / float(N_SLEEVE)) * 2.0 * math.pi
                vy = cy + math.cos(ang) * r
                vz = cz + math.sin(ang) * r
                vx = cx
                v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
                ring.append(v)
                w_list.append((v, {'Spine01': wsp, sh_bone: wsh, arm_bone: warm}))
            s_rings.append(ring)

        for r_idx in range(len(s_rings) - 1):
            r0 = s_rings[r_idx]
            r1 = s_rings[r_idx + 1]
            for i in range(N_SLEEVE):
                i_next = (i + 1) % N_SLEEVE
                bm.faces.new([r0[i], r0[i_next], r1[i_next], r1[i]])
        return s_rings

    build_puffy_sleeve(bm, True)
    build_puffy_sleeve(bm, False)

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

    for b in ['Head', 'Spine01', 'Spine', 'Hips', 'LeftShoulder', 'LeftArm', 'RightShoulder', 'RightArm']:
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
        poly.use_smooth = True
        cz = poly.center.z
        if 0.61 <= cz <= 0.67:
            if abs(poly.center.x - CX) < 0.04 and poly.center.y < 1.25:
                poly.material_index = 2
            else:
                poly.material_index = 1
        else:
            poly.material_index = 0

    # 5. RESTORE POSE MODE
    arm.data.pose_position = 'POSE'
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()

    bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest3.blend')
    print('SUCCESS: Synchronized collar & rig bone zero clipping!')

run()
