import bpy, bmesh, mathutils, math, os

def run():
    print('=====================================================')
    print('  APPLYING RIGTEST4: MASK DIAL-BACK, UV DETAILS,     ')
    print('  & KINEMATIC SKIRT/PANTS SWAY                       ')
    print('=====================================================')

    blend_file = 'mannequin_chibi_basic_rigTest4.blend'
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    CX = 0.007
    CY = 1.241

    arm.data.pose_position = 'REST'
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()

    mw = man.matrix_world

    # -------------------------------------------------------------
    # 1. DIAL BACK BODY MASK ON MANNEQUIN (NO HOLLOW GAPS)
    # -------------------------------------------------------------
    vg_head = man.vertex_groups.get('Head')
    vg_sp01 = man.vertex_groups.get('Spine01')
    vg_sh_l = man.vertex_groups.get('LeftShoulder')
    vg_sh_r = man.vertex_groups.get('RightShoulder')
    vg_arm_l = man.vertex_groups.get('LeftArm')
    vg_arm_r = man.vertex_groups.get('RightArm')

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
        x, y, z = wco.x, wco.y, wco.z
        dx = abs(x - CX)

        # A. Head & Deep Neck: Visible down to z=0.91 (well inside collar rim at z=1.00)
        # Symmetrical neck cylinder around (CX, 1.278)
        dy_neck = abs(y - 1.278)
        is_head = (z >= 1.04)
        is_neck = (z >= 0.91 and dx <= 0.065 and dy_neck <= 0.13)

        # B. Arms: Bicep is visible starting from mid-deltoid (dx >= 0.16)
        # Only the deep internal shoulder pivot (dx < 0.16 and z in [0.86, 0.98]) is culled
        is_arm_visible = (dx >= 0.16 and z >= 0.65)

        # C. Legs: 100% visible (breeches are voluminous, no culling needed!)
        is_leg = (z <= 0.58)

        if is_head or is_neck or is_arm_visible or is_leg:
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

    # -------------------------------------------------------------
    # 2. REBUILD PANTS: TAPERED UPPER THIGH (UNDER SKIRT) + UV MAP
    # -------------------------------------------------------------
    col_clothes = bpy.data.collections.get('Modular_Clothes')
    old_pants = bpy.data.objects.get('Modular_Adventurer_Pants')
    if old_pants:
        bpy.data.objects.remove(old_pants, do_unlink=True)

    bm_p = bmesh.new()
    N_RAD = 16

    # Profiles: fitted under skirt (z >= 0.46), then voluminous harem puff below
    leg_steps = [
        # (z, rx, ry, off_y)
        (0.58, 0.064, 0.060,  0.000), # Pelvis tuck (under belt)
        (0.52, 0.072, 0.068,  0.002), # Upper thigh under skirt (ample clearance inside skirt!)
        (0.46, 0.084, 0.078,  0.004), # Skirt hem level
        (0.40, 0.114, 0.108,  0.006), # Billowing harem puff begins immediately below skirt!
        (0.35, 0.118, 0.112,  0.008), # Knee enclosure
        (0.30, 0.108, 0.104,  0.006), # Below knee
        (0.24, 0.096, 0.090,  0.002), # Mid calf
        (0.18, 0.074, 0.070, -0.002), # Ankle cuff
    ]

    def build_pants_leg(bm, is_left):
        leg_cx = 0.117 if is_left else -0.103
        leg_name = 'Left' if is_left else 'Right'
        up_bone = f'{leg_name}UpLeg'
        lo_bone = f'{leg_name}Leg'
        
        rings = []
        vert_weights = []
        u_base = 0.02 if is_left else 0.52
        u_span = 0.46

        for s_idx, (z, rx, ry, off_y) in enumerate(leg_steps):
            ring = []
            if z >= 0.42:
                w_up = 1.0; w_lo = 0.0
                w_hip = max(0.0, (z - 0.48) / 0.10) * 0.40
                w_up -= w_hip
            elif z <= 0.28:
                w_up = 0.0; w_lo = 1.0; w_hip = 0.0
            else:
                t = (z - 0.28) / (0.42 - 0.28)
                blend = 0.5 - 0.5 * math.cos(t * math.pi)
                w_up = blend; w_lo = 1.0 - blend; w_hip = 0.0
                
            v_coord = (z - 0.18) / (0.58 - 0.18) # 0 at ankle, 1 at waist

            for i in range(N_RAD):
                ang = (i / float(N_RAD)) * 2.0 * math.pi
                cos_a = math.cos(ang)
                factor = 0.88 if ((is_left and cos_a < -0.2) or ((not is_left) and cos_a > 0.2)) else 1.0
                vx = leg_cx + cos_a * (rx * factor)
                vy = (1.254 + off_y) + math.sin(ang) * ry
                vz = z
                v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
                
                # Seam at inside of leg (cos_a < 0 for left)
                # Outer seam at outer edge
                u_frac = (ang / (2.0 * math.pi))
                u_coord = u_base + u_frac * u_span
                v_uv = (u_coord, v_coord)

                ring.append((v, v_uv))
                weights = {up_bone: w_up, lo_bone: w_lo}
                if w_hip > 0.0: weights['Hips'] = w_hip
                vert_weights.append((v, weights))
            rings.append(ring)

        faces = []
        for r_idx in range(len(rings) - 1):
            r0 = rings[r_idx]
            r1 = rings[r_idx + 1]
            for i in range(N_RAD):
                i_next = (i + 1) % N_RAD
                f = bm.faces.new([r0[i][0], r0[i_next][0], r1[i_next][0], r1[i][0]])
                uvs = [r0[i][1], r0[i_next][1], r1[i_next][1], r1[i][1]]
                faces.append((f, uvs))
        return rings, vert_weights, faces

    rings_l, w_l, f_l = build_pants_leg(bm_p, True)
    rings_r, w_r, f_r = build_pants_leg(bm_p, False)

    bm_p.verts.index_update()
    bm_p.verts.ensure_lookup_table()
    pants_weights = [(v.index, w) for v, w in (w_l + w_r)]

    # UV Layer for Pants
    uv_layer_p = bm_p.loops.layers.uv.new('UVMap')
    for f, uvs in (f_l + f_r):
        for loop, uv in zip(f.loops, uvs):
            loop[uv_layer_p].uv = uv

    mesh_pants = bpy.data.meshes.new('Modular_Adventurer_Pants_Mesh')
    bm_p.to_mesh(mesh_pants)
    bm_p.free()

    obj_pants = bpy.data.objects.new('Modular_Adventurer_Pants', mesh_pants)
    col_clothes.objects.link(obj_pants)
    obj_pants.parent = arm
    obj_pants.parent_type = 'OBJECT'
    obj_pants.matrix_world = mathutils.Matrix.Identity(4)

    mod_p = obj_pants.modifiers.new('Armature', 'ARMATURE')
    mod_p.object = arm

    for b in ['Hips', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg']:
        obj_pants.vertex_groups.new(name=b)
    for v_idx, weights in pants_weights:
        for b_name, weight in weights.items():
            if weight > 0.001:
                obj_pants.vertex_groups[b_name].add([v_idx], weight, 'REPLACE')

    # Pants Material with Image Texture
    mat_pants = bpy.data.materials.get('M_Adventurer_Pants')
    if not mat_pants:
        mat_pants = bpy.data.materials.new('M_Adventurer_Pants')
    mat_pants.use_nodes = True
    nt_p = mat_pants.node_tree
    bsdf_p = nt_p.nodes.get('Principled BSDF')
    tex_path_p = os.path.abspath('assets/textures/pants_stylized_diffuse.png')
    img_p = bpy.data.images.load(tex_path_p, check_existing=True)
    tex_node_p = nt_p.nodes.new('ShaderNodeTexImage')
    tex_node_p.image = img_p
    nt_p.links.new(tex_node_p.outputs['Color'], bsdf_p.inputs['Base Color'])
    bsdf_p.inputs['Roughness'].default_value = 0.55
    obj_pants.data.materials.append(mat_pants)

    for p in obj_pants.data.polygons: p.use_smooth = True

    # -------------------------------------------------------------
    # 3. REBUILD TUNIC: KINEMATIC SKIRT SWAY + UV DETAIL TEXTURE
    # -------------------------------------------------------------
    old_tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
    if old_tunic:
        bpy.data.objects.remove(old_tunic, do_unlink=True)

    bm_t = bmesh.new()
    N_CIRC = 20

    torso_profiles = [
        # (z, cy, rx, ry, w_head, w_sp01, w_sp, w_hips)
        (1.00, 1.280, 0.050, 0.118, 0.45, 0.55, 0.00, 0.00), # Collar rim
        (0.97, 1.276, 0.070, 0.124, 0.25, 0.75, 0.00, 0.00), # Collar stand
        (0.92, 1.268, 0.130, 0.122, 0.00, 1.00, 0.00, 0.00), # Upper chest
        (0.86, 1.256, 0.145, 0.118, 0.00, 0.80, 0.20, 0.00), # Mid chest
        (0.78, 1.244, 0.138, 0.110, 0.00, 0.35, 0.65, 0.00), # Lower ribcage
        (0.70, 1.252, 0.132, 0.108, 0.00, 0.10, 0.80, 0.10), # Waist
        (0.64, 1.256, 0.136, 0.112, 0.00, 0.00, 0.40, 0.60), # Belt line
        (0.58, 1.256, 0.165, 0.130, 0.00, 0.00, 0.15, 0.85), # Flared skirt upper
        (0.52, 1.252, 0.195, 0.150, 0.00, 0.00, 0.05, 0.95), # Flared skirt mid
        (0.46, 1.250, 0.225, 0.175, 0.00, 0.00, 0.00, 1.00), # Flared skirt hem
    ]

    t_rings = []
    t_weights = []
    t_faces = []

    for z, cy, rx, ry, whead, wsp01, wsp, whip in torso_profiles:
        ring = []
        v_coord = (z - 0.46) / (1.00 - 0.46) # 0 at hem, 1 at collar

        for i in range(N_CIRC):
            ang = (i / float(N_CIRC)) * 2.0 * math.pi
            vx = CX + math.cos(ang) * rx
            vy = cy + math.sin(ang) * ry
            vz = z
            v = bm_t.verts.new(mathutils.Vector((vx, vy, vz)))

            # UV coordinates: front center is at ang = -pi/2 (towards -Y)
            # Center front (ang = -pi/2) -> u = 0.325
            # Shift angle so -pi/2 maps to 0.5 of [0, 0.65]
            ang_norm = (ang + math.pi / 2.0) % (2.0 * math.pi)
            u_coord = (ang_norm / (2.0 * math.pi)) * 0.65
            v_uv = (u_coord, v_coord)

            # Kinematic Skirt Sway: on hem (z <= 0.52), blend front vertices with LeftUpLeg / RightUpLeg!
            w_left_leg = 0.0
            w_right_leg = 0.0
            cur_whip = whip
            if z <= 0.52 and vy < cy: # Front of skirt
                if vx > CX + 0.02:
                    w_left_leg = 0.28 * (1.0 - (z - 0.46) / 0.08)
                    cur_whip -= w_left_leg
                elif vx < CX - 0.02:
                    w_right_leg = 0.28 * (1.0 - (z - 0.46) / 0.08)
                    cur_whip -= w_right_leg

            weights = {
                'Head': whead,
                'Spine01': wsp01,
                'Spine': wsp,
                'Hips': cur_whip,
                'LeftUpLeg': w_left_leg,
                'RightUpLeg': w_right_leg
            }
            ring.append((v, v_uv))
            t_weights.append((v, weights))
        t_rings.append(ring)

    for r in range(len(t_rings) - 1):
        r0 = t_rings[r]
        r1 = t_rings[r + 1]
        for i in range(N_CIRC):
            i_next = (i + 1) % N_CIRC
            f = bm_t.faces.new([r0[i][0], r0[i_next][0], r1[i_next][0], r1[i][0]])
            uvs = [r0[i][1], r0[i_next][1], r1[i_next][1], r1[i][1]]
            t_faces.append((f, uvs))

    # SLEEVES WITH UVs
    N_SLEEVE = 16
    sleeve_steps = [
        (0.00, 0.100, 0.40, 0.50, 0.10),
        (0.04, 0.112, 0.10, 0.50, 0.40),
        (0.09, 0.106, 0.00, 0.25, 0.75),
        (0.14, 0.092, 0.00, 0.05, 0.95),
        (0.17, 0.098, 0.00, 0.00, 1.00),
    ]

    def build_puffy_sleeve_uv(bm, is_left):
        sign = 1.0 if is_left else -1.0
        sh_bone = 'LeftShoulder' if is_left else 'RightShoulder'
        arm_bone = 'LeftArm' if is_left else 'RightArm'
        sh_cx = 0.110 if is_left else -0.096
        sh_cy = 1.270
        sh_cz = 0.965

        v_base = 0.52 if is_left else 0.04
        v_span = 0.44

        s_rings = []
        for s_idx, (u, r, wsp, wsh, warm) in enumerate(sleeve_steps):
            ring = []
            cx = sh_cx + sign * u
            cy = sh_cy
            cz = sh_cz - (u * 0.04)
            v_coord = v_base + (s_idx / float(len(sleeve_steps) - 1)) * v_span

            for i in range(N_SLEEVE):
                ang = (i / float(N_SLEEVE)) * 2.0 * math.pi
                vy = cy + math.cos(ang) * r
                vz = cz + math.sin(ang) * r
                vx = cx
                v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
                u_coord = 0.69 + (i / float(N_SLEEVE)) * 0.29
                ring.append((v, (u_coord, v_coord)))
                t_weights.append((v, {'Spine01': wsp, sh_bone: wsh, arm_bone: warm}))
            s_rings.append(ring)

        s_faces = []
        for r_idx in range(len(s_rings) - 1):
            r0 = s_rings[r_idx]
            r1 = s_rings[r_idx + 1]
            for i in range(N_SLEEVE):
                i_next = (i + 1) % N_SLEEVE
                f = bm.faces.new([r0[i][0], r0[i_next][0], r1[i_next][0], r1[i][0]])
                uvs = [r0[i][1], r0[i_next][1], r1[i_next][1], r1[i][1]]
                s_faces.append((f, uvs))
        return s_rings, s_faces

    s_l_rings, s_l_faces = build_puffy_sleeve_uv(bm_t, True)
    s_r_rings, s_r_faces = build_puffy_sleeve_uv(bm_t, False)

    bm_t.verts.index_update()
    bm_t.verts.ensure_lookup_table()
    tunic_v_weights = [(v.index, w) for v, w in t_weights]

    uv_layer_t = bm_t.loops.layers.uv.new('UVMap')
    for f, uvs in (t_faces + s_l_faces + s_r_faces):
        for loop, uv in zip(f.loops, uvs):
            loop[uv_layer_t].uv = uv

    mesh_tunic = bpy.data.meshes.new('Modular_Adventurer_Tunic_Mesh')
    bm_t.to_mesh(mesh_tunic)
    bm_t.free()

    obj_tunic = bpy.data.objects.new('Modular_Adventurer_Tunic', mesh_tunic)
    col_clothes.objects.link(obj_tunic)
    obj_tunic.parent = arm
    obj_tunic.parent_type = 'OBJECT'
    obj_tunic.matrix_world = mathutils.Matrix.Identity(4)

    mod_t = obj_tunic.modifiers.new('Armature', 'ARMATURE')
    mod_t.object = arm

    for b in ['Head', 'Spine01', 'Spine', 'Hips', 'LeftUpLeg', 'RightUpLeg', 'LeftShoulder', 'LeftArm', 'RightShoulder', 'RightArm']:
        obj_tunic.vertex_groups.new(name=b)
    for v_idx, weights in tunic_v_weights:
        for b_name, weight in weights.items():
            if weight > 0.001:
                obj_tunic.vertex_groups[b_name].add([v_idx], weight, 'REPLACE')

    # Tunic Material with Image Texture
    mat_tunic = bpy.data.materials.get('M_Adventurer_Tunic')
    if not mat_tunic:
        mat_tunic = bpy.data.materials.new('M_Adventurer_Tunic')
    mat_tunic.use_nodes = True
    nt_t = mat_tunic.node_tree
    bsdf_t = nt_t.nodes.get('Principled BSDF')
    tex_path_t = os.path.abspath('assets/textures/tunic_stylized_diffuse.png')
    img_t = bpy.data.images.load(tex_path_t, check_existing=True)
    tex_node_t = nt_t.nodes.new('ShaderNodeTexImage')
    tex_node_t.image = img_t
    nt_t.links.new(tex_node_t.outputs['Color'], bsdf_t.inputs['Base Color'])
    bsdf_t.inputs['Roughness'].default_value = 0.50
    obj_tunic.data.materials.append(mat_tunic)

    for p in obj_tunic.data.polygons: p.use_smooth = True

    # -------------------------------------------------------------
    # 4. RESTORE POSE MODE & SAVE
    # -------------------------------------------------------------
    arm.data.pose_position = 'POSE'
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()

    bpy.ops.wm.save_as_mainfile(filepath=blend_file)
    print(f'SUCCESS: Upgraded {blend_file} with dialed-back mask, UVs, and kinematic skirt sway!')

run()
