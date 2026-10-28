import bpy, bmesh, mathutils, math

def create_anime_hair_suite():
    print('=== GENERATING ANIME HAIRSTYLE COLLECTION ===')
    arm = bpy.data.objects['Armature']
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    col_hair = bpy.data.collections.get('Modular_Hair')
    if not col_hair:
        col_hair = bpy.data.collections.new('Modular_Hair')
        bpy.context.scene.collection.children.link(col_hair)
        
    head_center = mathutils.Vector((0.0070, 1.2550, 1.1650))
    hs = arm.pose.bones.get('Head_Socket')
    hs_matrix_inv = (arm.matrix_world @ hs.matrix).inverted()

    # Materials
    def make_hair_mat(name, color, roughness=0.40):
        mat = bpy.data.materials.get(name)
        if not mat:
            mat = bpy.data.materials.new(name)
            mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = color
            bsdf.inputs['Roughness'].default_value = roughness
        return mat

    mat_hero = make_hair_mat('M_Hair_Hero_Chestnut', (0.82, 0.52, 0.20, 1.0))
    mat_rogue = make_hair_mat('M_Hair_Rogue_Midnight', (0.10, 0.12, 0.18, 1.0))
    mat_mage = make_hair_mat('M_Hair_Mage_Silver', (0.88, 0.90, 0.96, 1.0))
    mat_barbarian = make_hair_mat('M_Hair_Barbarian_Crimson', (0.75, 0.22, 0.12, 1.0))
    mat_elf = make_hair_mat('M_Hair_Elf_Gold', (0.92, 0.78, 0.35, 1.0))

    # Helper to add conical tapered anime strand
    def add_strand(bm, start_pt, end_pt, start_radius, end_radius=0.002, segments=6):
        vec = end_pt - start_pt
        length = vec.length
        if length < 0.001: return
        rot = vec.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        mid = (start_pt + end_pt) * 0.5
        bmesh.ops.create_cone(
            bm,
            cap_ends=True,
            cap_tris=False,
            segments=segments,
            radius1=start_radius,
            radius2=end_radius,
            depth=length,
            matrix=mathutils.Matrix.Translation(mid) @ rot
        )

    # Helper to finalize hair object
    def finalize_hair_obj(name, bm, material, hide=True):
        old = bpy.data.objects.get(name)
        if old: bpy.data.objects.remove(old, do_unlink=True)
        
        mesh = bpy.data.meshes.new(name + '_Mesh')
        bm.to_mesh(mesh)
        bm.free()
        
        obj = bpy.data.objects.new(name, mesh)
        col_hair.objects.link(obj)
        obj.data.materials.append(material)
        
        obj.parent = arm
        obj.parent_type = 'BONE'
        obj.parent_bone = 'Head_Socket'
        obj.matrix_parent_inverse = hs_matrix_inv.copy()
        
        obj.hide_viewport = hide
        obj.hide_render = hide
        print(f'Created {name} with {len(mesh.vertices)} vertices.')
        return obj

    # ----------------------------------------------------
    # 1. SPIKY JRPG HERO (Adventurer / Fighter)
    # ----------------------------------------------------
    bm = bmesh.new()
    # Skull cap
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=0.146, matrix=mathutils.Matrix.Translation(head_center))
    del_verts = [v for v in bm.verts if v.co.z < 1.12 or (v.co.y < 1.20 and v.co.z < 1.19)]
    bmesh.ops.delete(bm, geom=del_verts, context='VERTS')
    
    # Bangs framing brow
    add_strand(bm, mathutils.Vector((-0.07, 1.18, 1.25)), mathutils.Vector((-0.07, 1.13, 1.18)), 0.026)
    add_strand(bm, mathutils.Vector((-0.025, 1.17, 1.25)), mathutils.Vector((-0.025, 1.12, 1.17)), 0.028)
    add_strand(bm, mathutils.Vector(( 0.025, 1.17, 1.25)), mathutils.Vector(( 0.025, 1.12, 1.17)), 0.028)
    add_strand(bm, mathutils.Vector(( 0.07, 1.18, 1.25)), mathutils.Vector(( 0.07, 1.13, 1.18)), 0.026)
    # Side tufts
    add_strand(bm, mathutils.Vector((-0.13, 1.22, 1.23)), mathutils.Vector((-0.14, 1.18, 1.11)), 0.028)
    add_strand(bm, mathutils.Vector(( 0.13, 1.22, 1.23)), mathutils.Vector(( 0.14, 1.18, 1.11)), 0.028)
    # Crown spikes (classic anime hero)
    add_strand(bm, mathutils.Vector(( 0.00, 1.24, 1.28)), mathutils.Vector(( 0.00, 1.28, 1.39)), 0.038)
    add_strand(bm, mathutils.Vector((-0.05, 1.25, 1.27)), mathutils.Vector((-0.10, 1.30, 1.36)), 0.034)
    add_strand(bm, mathutils.Vector(( 0.05, 1.25, 1.27)), mathutils.Vector(( 0.10, 1.30, 1.36)), 0.034)
    add_strand(bm, mathutils.Vector((-0.03, 1.31, 1.24)), mathutils.Vector((-0.06, 1.39, 1.28)), 0.032)
    add_strand(bm, mathutils.Vector(( 0.03, 1.31, 1.24)), mathutils.Vector(( 0.06, 1.39, 1.28)), 0.032)
    finalize_hair_obj('Modular_Hair_Spiky_Hero', bm, mat_hero, hide=False)

    # ----------------------------------------------------
    # 2. ROGUE PONYTAIL (Scout / Assassin)
    # ----------------------------------------------------
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=0.145, matrix=mathutils.Matrix.Translation(head_center))
    del_verts = [v for v in bm.verts if v.co.z < 1.13 or (v.co.y < 1.20 and v.co.z < 1.19)]
    bmesh.ops.delete(bm, geom=del_verts, context='VERTS')
    # Swept side bangs
    add_strand(bm, mathutils.Vector((-0.04, 1.17, 1.25)), mathutils.Vector((-0.06, 1.13, 1.16)), 0.025)
    add_strand(bm, mathutils.Vector(( 0.03, 1.17, 1.25)), mathutils.Vector(( 0.05, 1.13, 1.16)), 0.025)
    add_strand(bm, mathutils.Vector((-0.13, 1.21, 1.22)), mathutils.Vector((-0.13, 1.17, 1.10)), 0.026)
    add_strand(bm, mathutils.Vector(( 0.13, 1.21, 1.22)), mathutils.Vector(( 0.13, 1.17, 1.10)), 0.026)
    # Hair tie ring at back crown
    tie_pos = mathutils.Vector((0.007, 1.37, 1.25))
    bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=8, radius=0.032, matrix=mathutils.Matrix.Translation(tie_pos))
    # Long flowing high ponytail cascading down
    add_strand(bm, tie_pos, mathutils.Vector((0.02, 1.44, 1.15)), 0.042, 0.035)
    add_strand(bm, mathutils.Vector((0.02, 1.44, 1.15)), mathutils.Vector((0.03, 1.46, 0.98)), 0.035, 0.020)
    add_strand(bm, mathutils.Vector((0.03, 1.46, 0.98)), mathutils.Vector((0.04, 1.44, 0.85)), 0.020, 0.003)
    finalize_hair_obj('Modular_Hair_Rogue_Ponytail', bm, mat_rogue, hide=True)

    # ----------------------------------------------------
    # 3. ELEGANT MAGE BOB (Scholar / Cleric)
    # ----------------------------------------------------
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=0.148, matrix=mathutils.Matrix.Translation(head_center))
    del_verts = [v for v in bm.verts if v.co.z < 1.13 or (v.co.y < 1.21 and v.co.z < 1.19)]
    bmesh.ops.delete(bm, geom=del_verts, context='VERTS')
    # Clean anime fringe bangs across forehead
    for x_off in [-0.075, -0.045, -0.015, 0.015, 0.045, 0.075]:
        add_strand(bm, mathutils.Vector((x_off, 1.18, 1.24)), mathutils.Vector((x_off, 1.14, 1.175)), 0.022)
    # Curved bob locks framing jawline
    for (x, y, z, ex, ey, ez) in [
        (-0.13, 1.20, 1.22, -0.125, 1.21, 1.08),
        (-0.14, 1.25, 1.22, -0.135, 1.26, 1.07),
        (-0.12, 1.30, 1.22, -0.115, 1.32, 1.09),
        ( 0.13, 1.20, 1.22,  0.125, 1.21, 1.08),
        ( 0.14, 1.25, 1.22,  0.135, 1.26, 1.07),
        ( 0.12, 1.30, 1.22,  0.115, 1.32, 1.09),
    ]:
        add_strand(bm, mathutils.Vector((x, y, z)), mathutils.Vector((ex, ey, ez)), 0.028)
    # Back bob drape
    for x_off in [-0.06, -0.02, 0.02, 0.06]:
        add_strand(bm, mathutils.Vector((x_off, 1.36, 1.21)), mathutils.Vector((x_off, 1.37, 1.07)), 0.032)
    finalize_hair_obj('Modular_Hair_Mage_Bob', bm, mat_mage, hide=True)

    # ----------------------------------------------------
    # 4. BARBARIAN WILD MANE (Berserker / Druid)
    # ----------------------------------------------------
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=0.150, matrix=mathutils.Matrix.Translation(head_center))
    del_verts = [v for v in bm.verts if v.co.z < 1.12 or (v.co.y < 1.20 and v.co.z < 1.19)]
    bmesh.ops.delete(bm, geom=del_verts, context='VERTS')
    # Aggressive jagged brow bangs
    add_strand(bm, mathutils.Vector((-0.06, 1.17, 1.25)), mathutils.Vector((-0.08, 1.12, 1.16)), 0.030)
    add_strand(bm, mathutils.Vector(( 0.00, 1.16, 1.25)), mathutils.Vector(( 0.00, 1.11, 1.15)), 0.034)
    add_strand(bm, mathutils.Vector(( 0.06, 1.17, 1.25)), mathutils.Vector(( 0.08, 1.12, 1.16)), 0.030)
    # Flared jagged side manes
    add_strand(bm, mathutils.Vector((-0.14, 1.22, 1.24)), mathutils.Vector((-0.20, 1.24, 1.14)), 0.040)
    add_strand(bm, mathutils.Vector((-0.15, 1.27, 1.22)), mathutils.Vector((-0.22, 1.29, 1.06)), 0.042)
    add_strand(bm, mathutils.Vector(( 0.14, 1.22, 1.24)), mathutils.Vector(( 0.20, 1.24, 1.14)), 0.040)
    add_strand(bm, mathutils.Vector(( 0.15, 1.27, 1.22)), mathutils.Vector(( 0.22, 1.29, 1.06)), 0.042)
    # Heavy spiky mane cascading down past shoulders
    add_strand(bm, mathutils.Vector(( 0.00, 1.25, 1.28)), mathutils.Vector(( 0.00, 1.29, 1.41)), 0.045)
    add_strand(bm, mathutils.Vector((-0.07, 1.34, 1.24)), mathutils.Vector((-0.12, 1.42, 1.02)), 0.046)
    add_strand(bm, mathutils.Vector(( 0.07, 1.34, 1.24)), mathutils.Vector(( 0.12, 1.42, 1.02)), 0.046)
    add_strand(bm, mathutils.Vector(( 0.00, 1.37, 1.22)), mathutils.Vector(( 0.00, 1.44, 0.96)), 0.050)
    finalize_hair_obj('Modular_Hair_Barbarian_Mane', bm, mat_barbarian, hide=True)

    # ----------------------------------------------------
    # 5. ELF TWIN-TAILS (Elven Bard / Sorcerer)
    # ----------------------------------------------------
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=0.145, matrix=mathutils.Matrix.Translation(head_center))
    del_verts = [v for v in bm.verts if v.co.z < 1.13 or (v.co.y < 1.20 and v.co.z < 1.19)]
    bmesh.ops.delete(bm, geom=del_verts, context='VERTS')
    # Soft arched bangs
    add_strand(bm, mathutils.Vector((-0.05, 1.17, 1.24)), mathutils.Vector((-0.06, 1.13, 1.17)), 0.024)
    add_strand(bm, mathutils.Vector((-0.015, 1.16, 1.24)), mathutils.Vector((-0.015, 1.12, 1.18)), 0.022)
    add_strand(bm, mathutils.Vector(( 0.015, 1.16, 1.24)), mathutils.Vector(( 0.015, 1.12, 1.18)), 0.022)
    add_strand(bm, mathutils.Vector(( 0.05, 1.17, 1.24)), mathutils.Vector(( 0.06, 1.13, 1.17)), 0.024)
    # Dual hair ties (left and right)
    tie_l = mathutils.Vector((-0.14, 1.26, 1.23))
    tie_r = mathutils.Vector(( 0.14, 1.26, 1.23))
    bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=0.022, matrix=mathutils.Matrix.Translation(tie_l))
    bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=0.022, matrix=mathutils.Matrix.Translation(tie_r))
    # Cascading twin-tails
    add_strand(bm, tie_l, mathutils.Vector((-0.18, 1.28, 1.10)), 0.035, 0.025)
    add_strand(bm, mathutils.Vector((-0.18, 1.28, 1.10)), mathutils.Vector((-0.19, 1.29, 0.95)), 0.025, 0.005)
    add_strand(bm, tie_r, mathutils.Vector(( 0.18, 1.28, 1.10)), 0.035, 0.025)
    add_strand(bm, mathutils.Vector(( 0.18, 1.28, 1.10)), mathutils.Vector(( 0.19, 1.29, 0.95)), 0.025, 0.005)
    finalize_hair_obj('Modular_Hair_Elf_TwinTails', bm, mat_elf, hide=True)

    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()
    
    bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest3.blend')
    print('SUCCESS: Generated 5 distinct anime hairstyles in rigTest3.blend!')

create_anime_hair_suite()
