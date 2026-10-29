import bpy, bmesh, mathutils, math

def execute_build():
    print('=== BUILDING VOLUMETRIC CLOTH & ANIME HAIR ===')
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    
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
    # 1. VOLUMETRIC BAGGY PANTS (Harem / Traveler Breeches)
    # ----------------------------------------------------
    print('Generating Baggy Pants...')
    old_pants = bpy.data.objects.get('Modular_Adventurer_Pants')
    if old_pants: bpy.data.objects.remove(old_pants, do_unlink=True)
    
    bm_src = bmesh.new()
    bm_src.from_mesh(man.data)
    bm_src.faces.ensure_lookup_table()
    
    # Filter pants polygons: pelvis to mid-shin (Z 0.18 to 0.60)
    bm_dst = bmesh.new()
    src_to_dst = {}
    
    for f in bm_src.faces:
        c = mw @ f.calc_center_median()
        dx = abs(c.x - 0.007)
        if 0.17 <= c.z <= 0.60 and dx <= 0.24:
            dst_verts = []
            for v in f.verts:
                if v.index not in src_to_dst:
                    wco = mw @ v.co
                    norm = (mw.to_3x3() @ v.normal).normalized()
                    
                    # Generous volumetric puffing (+0.022m to +0.032m!)
                    # Maximum baggy puff around thighs and knees (Z 0.28 to 0.48)
                    z = wco.z
                    if 0.25 <= z <= 0.50:
                        puff = 0.026 + 0.008 * math.sin((z - 0.25) / 0.25 * math.pi)
                    elif z > 0.50:
                        puff = 0.016 + 0.010 * ((0.60 - z) / 0.10)
                    else:
                        # Taper towards boot cuff
                        puff = 0.012 + 0.014 * ((z - 0.17) / 0.08)
                        
                    # Lateral cloth fullness (pushing out slightly from leg center)
                    is_left = (wco.x > 0.007)
                    leg_cx = 0.095 if is_left else -0.081
                    radial_vec = mathutils.Vector((wco.x - leg_cx, wco.y - 1.241, 0)).normalized()
                    
                    new_wco = wco + norm * (puff * 0.6) + radial_vec * (puff * 0.4)
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
    
    mesh_pants = bpy.data.meshes.new('Modular_Adventurer_Pants_Mesh')
    bm_dst.to_mesh(mesh_pants)
    bm_dst.free()
    
    obj_pants = bpy.data.objects.new('Modular_Adventurer_Pants', mesh_pants)
    col_clothes.objects.link(obj_pants)
    obj_pants.parent = man.parent
    obj_pants.parent_type = man.parent_type
    obj_pants.matrix_parent_inverse = man.matrix_parent_inverse.copy()
    obj_pants.location = man.location.copy()
    obj_pants.rotation_euler = man.rotation_euler.copy()
    obj_pants.scale = man.scale.copy()
    
    mod = obj_pants.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm
    
    # Weight mapping
    vgroups_pants = {}
    for g_name in man_groups.values():
        vgroups_pants[g_name] = obj_pants.vertex_groups.new(name=g_name)
    for dst_idx, src_idx in dst_to_src.items():
        src_v = man.data.vertices[src_idx]
        for g in src_v.groups:
            vgroups_pants[man_groups[g.group]].add([dst_idx], g.weight, 'REPLACE')
            
    mat_pants = bpy.data.materials.get('M_Adventurer_Pants')
    if mat_pants: obj_pants.data.materials.append(mat_pants)

    # ----------------------------------------------------
    # 2. VOLUMETRIC BELTED TUNIC (With Puffy Sleeves & Flared Skirt)
    # ----------------------------------------------------
    print('Generating Volumetric Tunic...')
    old_tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
    if old_tunic: bpy.data.objects.remove(old_tunic, do_unlink=True)
    
    bm_dst = bmesh.new()
    src_to_dst = {}
    
    for f in bm_src.faces:
        c = mw @ f.calc_center_median()
        dx = abs(c.x - 0.007)
        # Torso + sleeves + shoulders
        is_torso = (0.50 <= c.z <= 0.98 and dx <= 0.18)
        is_sleeve = (0.80 <= c.z <= 1.02 and 0.14 <= dx <= 0.42)
        is_chest = (0.68 <= c.z <= 0.98 and dx <= 0.24)
        if is_torso or is_sleeve or is_chest:
            dst_verts = []
            for v in f.verts:
                if v.index not in src_to_dst:
                    wco = mw @ v.co
                    norm = (mw.to_3x3() @ v.normal).normalized()
                    dx = abs(wco.x - 0.007)
                    
                    # Generous sleeve volume over shoulder ball joint (+0.020m)
                    if dx > 0.14:
                        sleeve_puff = 0.018 + 0.008 * ((dx - 0.14) / 0.20)
                        # Slightly puffy cuff roll at sleeve end
                        if dx > 0.32: sleeve_puff += 0.006
                        new_wco = wco + norm * sleeve_puff
                    elif wco.z < 0.64:
                        # Flared A-line skirt hanging free from waist belt
                        flare = 0.012 + 0.025 * ((0.64 - wco.z) / 0.14)
                        radial_torso = mathutils.Vector((wco.x - 0.007, wco.y - 1.241, 0)).normalized()
                        new_wco = wco + norm * 0.008 + radial_torso * flare
                    else:
                        # Chest & back cloth thickness (+0.012m)
                        new_wco = wco + norm * 0.012
                        
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
    
    mesh_tunic = bpy.data.meshes.new('Modular_Adventurer_Tunic_Mesh')
    bm_dst.to_mesh(mesh_tunic)
    bm_dst.free()
    bm_src.free()
    
    obj_tunic = bpy.data.objects.new('Modular_Adventurer_Tunic', mesh_tunic)
    col_clothes.objects.link(obj_tunic)
    obj_tunic.parent = man.parent
    obj_tunic.parent_type = man.parent_type
    obj_tunic.matrix_parent_inverse = man.matrix_parent_inverse.copy()
    obj_tunic.location = man.location.copy()
    obj_tunic.rotation_euler = man.rotation_euler.copy()
    obj_tunic.scale = man.scale.copy()
    
    mod = obj_tunic.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm
    
    vgroups_tunic = {}
    for g_name in man_groups.values():
        vgroups_tunic[g_name] = obj_tunic.vertex_groups.new(name=g_name)
    for dst_idx, src_idx in dst_to_src.items():
        src_v = man.data.vertices[src_idx]
        for g in src_v.groups:
            vgroups_tunic[man_groups[g.group]].add([dst_idx], g.weight, 'REPLACE')
            
    # Materials
    mat_tunic = bpy.data.materials.get('M_Adventurer_Tunic')
    mat_belt = bpy.data.materials.get('M_Adventurer_Belt')
    mat_buckle = bpy.data.materials.get('M_Adventurer_Buckle')
    obj_tunic.data.materials.append(mat_tunic)
    obj_tunic.data.materials.append(mat_belt)
    obj_tunic.data.materials.append(mat_buckle)
    
    for poly in obj_tunic.data.polygons:
        pz = (obj_tunic.matrix_world @ poly.center).z
        dx = abs((obj_tunic.matrix_world @ poly.center).x - 0.007)
        if 0.58 <= pz <= 0.65 and dx <= 0.17:
            poly.material_index = 1 # Belt
            
    # ----------------------------------------------------
    # 3. VOLUMETRIC MULTI-SEGMENT ANIME HAIR STRANDS
    # ----------------------------------------------------
    print('Generating Multi-Segment Curved Anime Hair...')
    # Clean up old hair objects in collection
    for o in list(col_hair.objects):
        bpy.data.objects.remove(o, do_unlink=True)
        
    hs = arm.pose.bones.get('Head_Socket')
    hs_matrix_inv = (arm.matrix_world @ hs.matrix).inverted()
    head_center = mathutils.Vector((0.0070, 1.2550, 1.1650))
    
    bm_hair = bmesh.new()
    
    # A. Snug Scalp Cap
    bmesh.ops.create_uvsphere(
        bm_hair, 
        u_segments=16, 
        v_segments=12, 
        radius=0.144, 
        matrix=mathutils.Matrix.Translation(head_center)
    )
    # Delete bottom opening
    del_verts = [v for v in bm_hair.verts if v.co.z < 1.13 or (v.co.y < 1.19 and v.co.z < 1.19)]
    bmesh.ops.delete(bm_hair, geom=del_verts, context='VERTS')
    
    # B. Helper to create smooth 8-segment curved diamond strand
    def add_curved_strand(control_pts, width_profile):
        # Generate 8 spline points via Catmull-Rom or Bezier interpolation
        # control_pts: list of 4-5 Vector points [root, control1, control2, tip]
        n_segs = 8
        curve_pts = []
        for s in range(n_segs):
            t = s / float(n_segs - 1)
            # Cubic Bezier interpolation between pts[0], pts[1], pts[2], pts[3]
            p0, p1, p2, p3 = control_pts[0], control_pts[1], control_pts[2], control_pts[3]
            pt = ((1-t)**3)*p0 + 3*((1-t)**2)*t*p1 + 3*(1-t)*(t**2)*p2 + (t**3)*p3
            curve_pts.append(pt)
            
        prev_ring = None
        for i, (pt, w) in enumerate(zip(curve_pts, width_profile)):
            # Tangent direction
            if i < n_segs - 1:
                tangent = (curve_pts[i+1] - pt).normalized()
            else:
                tangent = (pt - curve_pts[i-1]).normalized()
                
            # Normal perpendicular (cross with global up or outward)
            outward = (pt - head_center).normalized()
            binorm = tangent.cross(outward).normalized()
            norm = binorm.cross(tangent).normalized()
            
            # Diamond cross-section (4 vertices: Left, Ridge/Top, Right, Bottom)
            v_l = bm_hair.verts.new(pt - binorm * w)
            v_t = bm_hair.verts.new(pt + norm * (w * 0.55)) # Sharp anime highlight ridge
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

    widths_bang = [0.008, 0.022, 0.034, 0.038, 0.032, 0.022, 0.012, 0.002]
    widths_side = [0.010, 0.024, 0.036, 0.040, 0.036, 0.028, 0.016, 0.002]
    widths_crown= [0.012, 0.028, 0.042, 0.045, 0.038, 0.028, 0.015, 0.002]

    # 1. Tier 1: Swept Forehead Bangs (Framing eyes with beautiful JRPG curvature)
    bang_curves = [
        # Center-left swept bang
        [mathutils.Vector((-0.02, 1.18, 1.27)), mathutils.Vector((-0.025, 1.14, 1.25)), mathutils.Vector((-0.035, 1.11, 1.20)), mathutils.Vector((-0.040, 1.10, 1.155))],
        # Center-right swept bang
        [mathutils.Vector(( 0.02, 1.18, 1.27)), mathutils.Vector(( 0.025, 1.14, 1.25)), mathutils.Vector(( 0.035, 1.11, 1.20)), mathutils.Vector(( 0.040, 1.10, 1.155))],
        # Outer left brow bang
        [mathutils.Vector((-0.06, 1.19, 1.26)), mathutils.Vector((-0.075, 1.14, 1.24)), mathutils.Vector((-0.085, 1.11, 1.19)), mathutils.Vector((-0.090, 1.11, 1.150))],
        # Outer right brow bang
        [mathutils.Vector(( 0.06, 1.19, 1.26)), mathutils.Vector(( 0.075, 1.14, 1.24)), mathutils.Vector(( 0.085, 1.11, 1.19)), mathutils.Vector(( 0.090, 1.11, 1.150))],
        # Tiny center fringe
        [mathutils.Vector(( 0.00, 1.17, 1.27)), mathutils.Vector(( 0.000, 1.13, 1.24)), mathutils.Vector(( 0.005, 1.11, 1.21)), mathutils.Vector(( 0.005, 1.10, 1.180))],
    ]
    for c_pts in bang_curves:
        add_curved_strand(c_pts, widths_bang)

    # 2. Tier 2: Side Locks (Framing cheeks and jawline with dynamic inward curl)
    side_curves = [
        # Left cheek lock
        [mathutils.Vector((-0.12, 1.21, 1.25)), mathutils.Vector((-0.145, 1.19, 1.21)), mathutils.Vector((-0.155, 1.17, 1.14)), mathutils.Vector((-0.145, 1.16, 1.070))],
        # Left temple tuft
        [mathutils.Vector((-0.13, 1.25, 1.23)), mathutils.Vector((-0.155, 1.23, 1.18)), mathutils.Vector((-0.160, 1.21, 1.11)), mathutils.Vector((-0.150, 1.20, 1.050))],
        # Right cheek lock
        [mathutils.Vector(( 0.12, 1.21, 1.25)), mathutils.Vector(( 0.145, 1.19, 1.21)), mathutils.Vector(( 0.155, 1.17, 1.14)), mathutils.Vector(( 0.145, 1.16, 1.070))],
        # Right temple tuft
        [mathutils.Vector(( 0.13, 1.25, 1.23)), mathutils.Vector(( 0.155, 1.23, 1.18)), mathutils.Vector(( 0.160, 1.21, 1.11)), mathutils.Vector(( 0.150, 1.20, 1.050))],
    ]
    for c_pts in side_curves:
        add_curved_strand(c_pts, widths_side)

    # 3. Tier 3: Crown & Flowing Back Locks (Layered arched locks cascading down neck)
    back_curves = [
        # Crown left spike
        [mathutils.Vector((-0.03, 1.25, 1.28)), mathutils.Vector((-0.07, 1.27, 1.35)), mathutils.Vector((-0.10, 1.30, 1.37)), mathutils.Vector((-0.12, 1.33, 1.340))],
        # Crown right spike
        [mathutils.Vector(( 0.03, 1.25, 1.28)), mathutils.Vector(( 0.07, 1.27, 1.35)), mathutils.Vector(( 0.10, 1.30, 1.37)), mathutils.Vector(( 0.12, 1.33, 1.340))],
        # Crown center top spike
        [mathutils.Vector(( 0.00, 1.26, 1.29)), mathutils.Vector(( 0.00, 1.29, 1.38)), mathutils.Vector(( 0.00, 1.33, 1.41)), mathutils.Vector(( 0.00, 1.37, 1.380))],
        # Nape left cascading lock
        [mathutils.Vector((-0.07, 1.34, 1.23)), mathutils.Vector((-0.09, 1.37, 1.18)), mathutils.Vector((-0.10, 1.40, 1.10)), mathutils.Vector((-0.09, 1.41, 1.030))],
        # Nape right cascading lock
        [mathutils.Vector(( 0.07, 1.34, 1.23)), mathutils.Vector(( 0.09, 1.37, 1.18)), mathutils.Vector(( 0.10, 1.40, 1.10)), mathutils.Vector(( 0.09, 1.41, 1.030))],
        # Nape center cascading lock
        [mathutils.Vector(( 0.00, 1.36, 1.22)), mathutils.Vector(( 0.00, 1.39, 1.16)), mathutils.Vector(( 0.00, 1.42, 1.08)), mathutils.Vector(( 0.00, 1.43, 1.010))],
    ]
    for c_pts in back_curves:
        add_curved_strand(c_pts, widths_crown)

    mesh_hair = bpy.data.meshes.new('Modular_Hair_Adventurer_Mesh')
    bm_hair.to_mesh(mesh_hair)
    bm_hair.free()
    
    obj_hair = bpy.data.objects.new('Modular_Hair_Adventurer', mesh_hair)
    col_hair.objects.link(obj_hair)
    mat_hair = bpy.data.materials.get('M_Hair_Adventurer')
    if mat_hair: obj_hair.data.materials.append(mat_hair)
    
    obj_hair.parent = arm
    obj_hair.parent_type = 'BONE'
    obj_hair.parent_bone = 'Head_Socket'
    obj_hair.matrix_parent_inverse = hs_matrix_inv.copy()
    
    # Pinning vertex group for secondary physics (weight 1.0 at skull roots, 0.0 at tips)
    pin_grp = obj_hair.vertex_groups.new(name='Pin_Roots')
    for v in obj_hair.data.vertices:
        # Distance from skull center
        dist = (v.co - head_center).length
        # Roots are close to 0.144m, tips extend past 0.20m
        weight = max(0.0, min(1.0, (0.22 - dist) / 0.07))
        pin_grp.add([v.index], weight, 'REPLACE')
        
    obj_hair.hide_viewport = False
    obj_hair.hide_render = False

    # Restore pose position
    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()
    
    bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest3.blend')
    print('SUCCESS: Built volumetric clothes and 8-segment curved anime hair in rigTest3.blend!')

execute_build()
