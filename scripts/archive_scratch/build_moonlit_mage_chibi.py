import bpy, bmesh, mathutils, math

def build_moonlit_mage():
    print("=== BUILDING NATIVE CHIBI MOONLIT MAGE ===")
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']

    # Set Armature to REST pose for precise geometric alignment
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()

    mw = man.matrix_world
    mw_inv = mw.inverted()
    man_groups = {g.index: g.name for g in man.vertex_groups}

    # Ensure collections
    col_clothes = bpy.data.collections.get('Modular_Clothes')
    if not col_clothes:
        col_clothes = bpy.data.collections.new('Modular_Clothes')
        bpy.context.scene.collection.children.link(col_clothes)

    col_hair = bpy.data.collections.get('Modular_Hair')
    if not col_hair:
        col_hair = bpy.data.collections.new('Modular_Hair')
        bpy.context.scene.collection.children.link(col_hair)

    # ----------------------------------------------------
    # 1. PROCEDURAL MAGE HAIR (Snug under Hat, Long Locks)
    # ----------------------------------------------------
    print("Synthesizing Mage Hair...")
    old_hair = bpy.data.objects.get('Modular_Hair_Adventurer')
    if old_hair:
        # We replace the hair mesh
        bm_hair = bmesh.new()
        head_center = mathutils.Vector((0.0070, 1.2550, 1.1650))
        hs = arm.pose.bones.get('Head_Socket')
        hs_matrix_inv = (arm.matrix_world @ hs.matrix).inverted()

        def add_curved_strand(control_pts, width_profile):
            n_segs = 8
            curve_pts = []
            for s in range(n_segs):
                t = s / float(n_segs - 1)
                p0, p1, p2, p3 = control_pts[0], control_pts[1], control_pts[2], control_pts[3]
                pt = ((1-t)**3)*p0 + 3*((1-t)**2)*t*p1 + 3*(1-t)*(t**2)*p2 + (t**3)*p3
                curve_pts.append(pt)

            prev_ring = None
            for i, (pt, w) in enumerate(zip(curve_pts, width_profile)):
                if i < n_segs - 1:
                    tangent = (curve_pts[i+1] - pt).normalized()
                else:
                    tangent = (pt - curve_pts[i-1]).normalized()

                outward = (pt - head_center).normalized()
                binorm = tangent.cross(outward).normalized()
                norm = binorm.cross(tangent).normalized()

                v_l = bm_hair.verts.new(pt - binorm * w)
                v_t = bm_hair.verts.new(pt + norm * (w * 0.55))
                v_r = bm_hair.verts.new(pt + binorm * w)
                v_b = bm_hair.verts.new(pt - norm * (w * 0.35))
                curr_ring = [v_l, v_t, v_r, v_b]

                if prev_ring:
                    for j in range(4):
                        bm_hair.faces.new([
                            prev_ring[j],
                            curr_ring[j],
                            curr_ring[(j+1)%4],
                            prev_ring[(j+1)%4]
                        ])
                prev_ring = curr_ring

        widths_bang = [0.008, 0.020, 0.030, 0.032, 0.028, 0.018, 0.009, 0.002]
        widths_long_side = [0.012, 0.030, 0.040, 0.042, 0.038, 0.028, 0.016, 0.003]
        widths_long_back = [0.014, 0.034, 0.048, 0.050, 0.045, 0.034, 0.020, 0.003]

        # Bangs framing forehead and eyes
        bangs = [
            [mathutils.Vector((-0.02, 1.16, 1.21)), mathutils.Vector((-0.025, 1.13, 1.19)), mathutils.Vector((-0.035, 1.10, 1.16)), mathutils.Vector((-0.040, 1.09, 1.135))],
            [mathutils.Vector(( 0.02, 1.16, 1.21)), mathutils.Vector(( 0.025, 1.13, 1.19)), mathutils.Vector(( 0.035, 1.10, 1.16)), mathutils.Vector(( 0.040, 1.09, 1.135))],
            [mathutils.Vector((-0.06, 1.17, 1.21)), mathutils.Vector((-0.075, 1.13, 1.18)), mathutils.Vector((-0.085, 1.10, 1.15)), mathutils.Vector((-0.090, 1.09, 1.125))],
            [mathutils.Vector(( 0.06, 1.17, 1.21)), mathutils.Vector(( 0.075, 1.13, 1.18)), mathutils.Vector(( 0.085, 1.10, 1.15)), mathutils.Vector(( 0.090, 1.09, 1.125))],
            [mathutils.Vector(( 0.00, 1.15, 1.21)), mathutils.Vector(( 0.000, 1.12, 1.19)), mathutils.Vector(( 0.005, 1.10, 1.17)), mathutils.Vector(( 0.005, 1.09, 1.145))],
        ]
        for c in bangs: add_curved_strand(c, widths_bang)

        # Long side locks framing cheeks and falling over front of shoulders
        sides = [
            # Left front lock
            [mathutils.Vector((-0.10, 1.19, 1.21)), mathutils.Vector((-0.13, 1.16, 1.12)), mathutils.Vector((-0.14, 1.14, 1.01)), mathutils.Vector((-0.13, 1.15, 0.89))],
            # Left temple lock
            [mathutils.Vector((-0.12, 1.22, 1.21)), mathutils.Vector((-0.15, 1.20, 1.11)), mathutils.Vector((-0.155, 1.19, 0.99)), mathutils.Vector((-0.14, 1.20, 0.87))],
            # Right front lock
            [mathutils.Vector(( 0.10, 1.19, 1.21)), mathutils.Vector(( 0.13, 1.16, 1.12)), mathutils.Vector(( 0.14, 1.14, 1.01)), mathutils.Vector(( 0.13, 1.15, 0.89))],
            # Right temple lock
            [mathutils.Vector(( 0.12, 1.22, 1.21)), mathutils.Vector(( 0.15, 1.20, 1.11)), mathutils.Vector(( 0.155, 1.20, 0.99)), mathutils.Vector(( 0.14, 1.20, 0.87))],
        ]
        for c in sides: add_curved_strand(c, widths_long_side)

        # Cascading back locks
        back = [
            [mathutils.Vector((-0.07, 1.30, 1.21)), mathutils.Vector((-0.09, 1.35, 1.12)), mathutils.Vector((-0.10, 1.37, 1.00)), mathutils.Vector((-0.09, 1.36, 0.87))],
            [mathutils.Vector(( 0.07, 1.30, 1.21)), mathutils.Vector(( 0.09, 1.35, 1.12)), mathutils.Vector(( 0.10, 1.37, 1.00)), mathutils.Vector(( 0.09, 1.36, 0.87))],
            [mathutils.Vector(( 0.00, 1.32, 1.21)), mathutils.Vector(( 0.00, 1.37, 1.11)), mathutils.Vector(( 0.00, 1.39, 0.99)), mathutils.Vector(( 0.00, 1.38, 0.86))],
            [mathutils.Vector((-0.035, 1.31, 1.21)), mathutils.Vector((-0.045, 1.36, 1.11)), mathutils.Vector((-0.05, 1.38, 0.99)), mathutils.Vector((-0.045, 1.37, 0.86))],
            [mathutils.Vector(( 0.035, 1.31, 1.21)), mathutils.Vector(( 0.045, 1.36, 1.11)), mathutils.Vector(( 0.05, 1.38, 0.99)), mathutils.Vector(( 0.045, 1.37, 0.86))],
        ]
        for c in back: add_curved_strand(c, widths_long_back)

        mesh_mage_hair = bpy.data.meshes.new('Modular_Hair_Mage_Mesh')
        bm_hair.to_mesh(mesh_mage_hair)
        bm_hair.free()

        old_hair.data = mesh_mage_hair
        old_hair.matrix_parent_inverse = hs_matrix_inv.copy()

        # Material: Deep Sapphire Navy
        mat_hair = bpy.data.materials.get('M_Hair_Adventurer')
        if not mat_hair:
            mat_hair = bpy.data.materials.new('M_Hair_Adventurer')
            mat_hair.use_nodes = True
        bsdf = mat_hair.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = (0.07, 0.09, 0.20, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.28
        
        old_hair.data.materials.clear()
        old_hair.data.materials.append(mat_hair)
        old_hair.hide_render = False
        old_hair.hide_viewport = False

    # ----------------------------------------------------
    # 2. VOLUMETRIC FLOWING MAGE ROBES
    # ----------------------------------------------------
    print("Synthesizing Volumetric Mage Robes...")
    old_tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
    if old_tunic:
        bpy.data.objects.remove(old_tunic, do_unlink=True)

    bm_src = bmesh.new()
    bm_src.from_mesh(man.data)
    bm_src.faces.ensure_lookup_table()

    bm_dst = bmesh.new()
    src_to_dst = {}

    for f in bm_src.faces:
        c = mw @ f.calc_center_median()
        dx = abs(c.x - 0.007)
        # We capture the full robe silhouette:
        # - Torso & Chest: Z 0.50 to 0.98
        # - Flowing A-line Skirt: Z 0.22 to 0.55 down to ankles/boots!
        # - Wizard Sleeves: Z 0.80 to 1.02, dx out to 0.44
        is_skirt = (0.22 <= c.z <= 0.58 and dx <= 0.24)
        is_torso = (0.50 <= c.z <= 0.98 and dx <= 0.20)
        is_sleeve = (0.80 <= c.z <= 1.02 and 0.13 <= dx <= 0.44)
        is_chest = (0.68 <= c.z <= 0.98 and dx <= 0.24)

        if is_skirt or is_torso or is_sleeve or is_chest:
            dst_verts = []
            for v in f.verts:
                if v.index not in src_to_dst:
                    wco = mw @ v.co
                    norm = (mw.to_3x3() @ v.normal).normalized()
                    vdx = abs(wco.x - 0.007)

                    # Flare & Radial Volume
                    if vdx > 0.14:
                        # Wizard flared cuffs
                        sleeve_puff = 0.022 + 0.012 * ((vdx - 0.14) / 0.20)
                        if vdx > 0.32: sleeve_puff += 0.008
                        new_wco = wco + norm * sleeve_puff
                    elif wco.z < 0.62:
                        # Flowing A-line robe skirt: flare outward as it approaches the floor
                        flare = 0.018 + 0.038 * ((0.62 - wco.z) / 0.40)
                        radial_torso = mathutils.Vector((wco.x - 0.007, wco.y - 1.241, 0)).normalized()
                        new_wco = wco + norm * 0.010 + radial_torso * flare
                    else:
                        # Generous torso and back coverage (+0.018m radial volume)
                        # Covers shoulders, spine, and back fat with zero pinching
                        new_wco = wco + norm * 0.018

                    new_lco = mw_inv @ new_wco
                    new_v = bm_dst.verts.new(new_lco)
                    src_to_dst[v.index] = new_v
                dst_verts.append(src_to_dst[v.index])
            try:
                bm_dst.faces.new(dst_verts)
            except ValueError:
                pass

    bm_dst.verts.index_update()
    bm_dst.verts.ensure_lookup_table()
    dst_to_src = {dst_v.index: src_idx for src_idx, dst_v in src_to_dst.items()}

    mesh_robe = bpy.data.meshes.new('Modular_Mage_Robes_Mesh')
    bm_dst.to_mesh(mesh_robe)
    bm_dst.free()
    bm_src.free()

    obj_robe = bpy.data.objects.new('Modular_Adventurer_Tunic', mesh_robe)
    col_clothes.objects.link(obj_robe)
    obj_robe.parent = man.parent
    obj_robe.parent_type = man.parent_type
    obj_robe.matrix_parent_inverse = man.matrix_parent_inverse.copy()
    obj_robe.location = man.location.copy()
    obj_robe.rotation_euler = man.rotation_euler.copy()
    obj_robe.scale = man.scale.copy()

    # Bind Armature
    mod_arm = obj_robe.modifiers.new('Armature', 'ARMATURE')
    mod_arm.object = arm

    # Direct Vertex Weight Mapping from Mannequin (100% deformation accuracy)
    vgroups_robe = {}
    for g_name in man_groups.values():
        vgroups_robe[g_name] = obj_robe.vertex_groups.new(name=g_name)
    for dst_idx, src_idx in dst_to_src.items():
        src_v = man.data.vertices[src_idx]
        for g in src_v.groups:
            vgroups_robe[man_groups[g.group]].add([dst_idx], g.weight, 'REPLACE')

    # ----------------------------------------------------
    # 3. MOONLIT MAGE COLOR PALETTE & MATERIALS
    # ----------------------------------------------------
    print("Styling Moonlit Mage Materials...")
    
    # 3a. Robe Main Fabric: Deep Midnight Indigo (#24264e)
    mat_robe = bpy.data.materials.get('M_Adventurer_Tunic')
    if not mat_robe:
        mat_robe = bpy.data.materials.new('M_Adventurer_Tunic')
        mat_robe.use_nodes = True
    bsdf_robe = mat_robe.node_tree.nodes.get('Principled BSDF')
    if bsdf_robe:
        for l in list(mat_robe.node_tree.links):
            if l.to_socket == bsdf_robe.inputs['Base Color']:
                mat_robe.node_tree.links.remove(l)
        bsdf_robe.inputs['Base Color'].default_value = (0.13, 0.14, 0.30, 1.0) # Deep midnight indigo
        bsdf_robe.inputs['Roughness'].default_value = 0.50

    # 3b. Belt: Dark Midnight Leather
    mat_belt = bpy.data.materials.get('M_Adventurer_Belt')
    if not mat_belt:
        mat_belt = bpy.data.materials.new('M_Adventurer_Belt')
        mat_belt.use_nodes = True
    bsdf_belt = mat_belt.node_tree.nodes.get('Principled BSDF')
    if bsdf_belt:
        bsdf_belt.inputs['Base Color'].default_value = (0.14, 0.08, 0.04, 1.0)
        bsdf_belt.inputs['Roughness'].default_value = 0.40

    # 3c. Buckle & Gold Trim: Gilded Antique Gold (#f5c542)
    mat_gold = bpy.data.materials.get('M_Adventurer_Buckle')
    if not mat_gold:
        mat_gold = bpy.data.materials.new('M_Adventurer_Buckle')
        mat_gold.use_nodes = True
    bsdf_gold = mat_gold.node_tree.nodes.get('Principled BSDF')
    if bsdf_gold:
        bsdf_gold.inputs['Base Color'].default_value = (0.96, 0.77, 0.26, 1.0)
        bsdf_gold.inputs['Metallic'].default_value = 0.85
        bsdf_gold.inputs['Roughness'].default_value = 0.25

    # 3d. Warm Amber/Gold Accent for Chest Chevron / Inner Trim
    mat_amber = bpy.data.materials.get('M_Mage_Amber_Trim')
    if not mat_amber:
        mat_amber = bpy.data.materials.new('M_Mage_Amber_Trim')
        mat_amber.use_nodes = True
    bsdf_amber = mat_amber.node_tree.nodes.get('Principled BSDF')
    if bsdf_amber:
        bsdf_amber.inputs['Base Color'].default_value = (0.92, 0.55, 0.12, 1.0)
        bsdf_amber.inputs['Roughness'].default_value = 0.40

    obj_robe.data.materials.clear()
    obj_robe.data.materials.append(mat_robe)   # 0: Main Robe Indigo
    obj_robe.data.materials.append(mat_belt)   # 1: Leather Belt
    obj_robe.data.materials.append(mat_gold)   # 2: Gilded Gold
    obj_robe.data.materials.append(mat_amber)  # 3: Amber Trim

    # Assign materials to polygons by anatomical zone
    for poly in obj_robe.data.polygons:
        pz = (obj_robe.matrix_world @ poly.center).z
        dx = abs((obj_robe.matrix_world @ poly.center).x - 0.007)
        dy = (obj_robe.matrix_world @ poly.center).y - 1.241

        # Belt around waist
        if 0.58 <= pz <= 0.65 and dx <= 0.17:
            if dx <= 0.04 and dy < 0: # Front buckle
                poly.material_index = 2 # Gold Buckle
            else:
                poly.material_index = 1 # Leather Belt
        # Gold collar trim & chest chevron
        elif 0.90 <= pz <= 0.98 and dx <= 0.12 and dy < 0:
            poly.material_index = 2 # Gold Collar
        elif 0.74 <= pz <= 0.90 and dx <= 0.06 and dy < 0:
            poly.material_index = 3 # Amber Chest Chevron
        # Gold bottom hem
        elif pz <= 0.27:
            poly.material_index = 2 # Gold Hem
        # Gold sleeve cuffs
        elif dx >= 0.36:
            poly.material_index = 2 # Gold Sleeve Cuff
        else:
            poly.material_index = 0 # Main Robe Indigo

    # 3e. Boots: Dark Violet / Indigo Leather with Tan Gold Cuff
    mat_boots = bpy.data.materials.get('M_Adventurer_Boots')
    if mat_boots:
        bsdf = mat_boots.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = (0.12, 0.13, 0.25, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.40
    mat_cuff = bpy.data.materials.get('M_Adventurer_BootCuff')
    if mat_cuff:
        bsdf = mat_cuff.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = (0.85, 0.68, 0.28, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.35

    # 3f. Leggings / Pants: Dark Slate Indigo
    mat_pants = bpy.data.materials.get('M_Adventurer_Pants')
    if mat_pants:
        bsdf = mat_pants.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            for l in list(mat_pants.node_tree.links):
                if l.to_socket == bsdf.inputs['Base Color']:
                    mat_pants.node_tree.links.remove(l)
            bsdf.inputs['Base Color'].default_value = (0.10, 0.11, 0.20, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.60

    # ----------------------------------------------------
    # 4. ZERO-CLIPPING BODY MASKING
    # ----------------------------------------------------
    print("Applying Zero-Clipping Body Masking...")
    vg_vis = man.vertex_groups.get('Body_Visible')
    if not vg_vis:
        vg_vis = man.vertex_groups.new(name='Body_Visible')

    for i, v in enumerate(man.data.vertices):
        wco = mw @ v.co
        dx = abs(wco.x - 0.007)
        is_head = (wco.z >= 0.98)
        is_hand = (wco.z >= 0.70 and dx >= 0.34)
        is_foot = (wco.z <= 0.24)

        if is_head or is_hand or is_foot:
            vg_vis.add([i], 1.0, 'REPLACE')
        else:
            vg_vis.add([i], 0.0, 'REPLACE')

    # ----------------------------------------------------
    # 5. WEARABLES & WEAPONS SETUP
    # ----------------------------------------------------
    print("Equipping Mage Hat & 2H Staff...")
    hat = bpy.data.objects.get('Modular_Mage_Hat')
    if hat:
        hat.hide_render = False
        hat.hide_viewport = False

    staff = bpy.data.objects.get('Modular_2H_Staff')
    if staff:
        staff.hide_render = False
        staff.hide_viewport = False

    for obj_name in ['Modular_1H_Sword', 'Modular_Round_Shield', 'Modular_Knight_Cape']:
        o = bpy.data.objects.get(obj_name)
        if o:
            o.hide_render = True
            o.hide_viewport = True

    # Restore POSE mode
    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()

    bpy.ops.wm.save_as_mainfile(filepath='moonlit_mage_chibi_master.blend')
    print("SUCCESS: Native Chibi Moonlit Mage fully assembled in moonlit_mage_chibi_master.blend!")

if __name__ == '__main__':
    build_moonlit_mage()
