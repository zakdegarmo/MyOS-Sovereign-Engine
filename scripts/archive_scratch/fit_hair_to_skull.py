import bpy, bmesh, mathutils, math

def fit_hair_to_skull():
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    old_hair = bpy.data.objects.get('Modular_Hair_Adventurer')
    if old_hair:
        bpy.data.objects.remove(old_hair, do_unlink=True)
        
    bm = bmesh.new()
    head_center = mathutils.Vector((0.0070, 1.2550, 1.1650))
    
    # 1. Base Skull Cap (radius 0.142m - fits snugly beneath the hat brim without poking out of the hat cone)
    bmesh.ops.create_uvsphere(
        bm, 
        u_segments=16, 
        v_segments=12, 
        radius=0.142, 
        matrix=mathutils.Matrix.Translation(head_center)
    )
    # Delete bottom of sphere (below chin/neck)
    del_verts = [v for v in bm.verts if v.co.z < 1.12 or (v.co.y < 1.20 and v.co.z < 1.19)]
    bmesh.ops.delete(bm, geom=del_verts, context='VERTS')
    
    # 2. Stylized Anime Bangs (Forward Y is < 1.20)
    # Sweeping stylishly across the forehead, stopping neatly above the large eyes (eyes are at Z ~ 1.16, Y ~ 1.16)
    def add_hair_clump(pos, length, radius, rot_euler):
        bmesh.ops.create_cone(
            bm,
            cap_ends=True,
            cap_tris=False,
            segments=5,
            radius1=radius,
            radius2=0.002,
            depth=length,
            matrix=mathutils.Matrix.Translation(pos) @ rot_euler.to_matrix().to_4x4()
        )

    # Forehead Bangs (Curving forward/down beneath hat brim)
    bangs = [
        # (x, y, z, len, rad, rx, ry, rz)
        (-0.065, 1.148, 1.220, 0.08, 0.024,  35, -12, 0),
        (-0.025, 1.140, 1.215, 0.09, 0.026,  30,  -4, 0),
        ( 0.025, 1.140, 1.215, 0.09, 0.026,  30,   4, 0),
        ( 0.065, 1.148, 1.220, 0.08, 0.024,  35,  12, 0),
    ]
    for (x, y, z, l, r, rx, ry, rz) in bangs:
        add_hair_clump(
            mathutils.Vector((x, y, z)), 
            l, r, 
            mathutils.Euler((math.radians(rx), math.radians(ry), math.radians(rz)))
        )

    # Side Locks (Framing the cheeks, flowing down past ears)
    sides = [
        (-0.135, 1.200, 1.160, 0.12, 0.028,  15, -25,  15),
        (-0.140, 1.240, 1.130, 0.13, 0.028, -10, -20,  10),
        ( 0.135, 1.200, 1.160, 0.12, 0.028,  15,  25, -15),
        ( 0.140, 1.240, 1.130, 0.13, 0.028, -10,  20, -10),
    ]
    for (x, y, z, l, r, rx, ry, rz) in sides:
        add_hair_clump(
            mathutils.Vector((x, y, z)), 
            l, r, 
            mathutils.Euler((math.radians(rx), math.radians(ry), math.radians(rz)))
        )

    # Back Nape Locks (Flowing down onto collar)
    nape = [
        (-0.080, 1.350, 1.120, 0.13, 0.032, -45,  15, 0),
        (-0.030, 1.365, 1.100, 0.14, 0.035, -40,   5, 0),
        ( 0.030, 1.365, 1.100, 0.14, 0.035, -40,  -5, 0),
        ( 0.080, 1.350, 1.120, 0.13, 0.032, -45, -15, 0),
    ]
    for (x, y, z, l, r, rx, ry, rz) in nape:
        add_hair_clump(
            mathutils.Vector((x, y, z)), 
            l, r, 
            mathutils.Euler((math.radians(rx), math.radians(ry), math.radians(rz)))
        )

    mesh = bpy.data.meshes.new('Modular_Hair_Adventurer_Mesh')
    bm.to_mesh(mesh)
    bm.free()
    
    obj_hair = bpy.data.objects.new('Modular_Hair_Adventurer', mesh)
    col_hair = bpy.data.collections.get('Modular_Hair')
    if not col_hair:
        col_hair = bpy.data.collections.new('Modular_Hair')
        bpy.context.scene.collection.children.link(col_hair)
    col_hair.objects.link(obj_hair)
    
    mat_hair = bpy.data.materials.get('M_Hair_Adventurer')
    if mat_hair:
        obj_hair.data.materials.append(mat_hair)
        
    # Parent to Head_Socket with clean inverse matrix
    obj_hair.parent = arm
    obj_hair.parent_type = 'BONE'
    obj_hair.parent_bone = 'Head_Socket'
    obj_hair.matrix_parent_inverse = (arm.matrix_world @ arm.pose.bones['Head_Socket'].matrix).inverted()
    
    # Ensure visible
    obj_hair.hide_viewport = False
    obj_hair.hide_render = False
    
    hat = bpy.data.objects.get('Modular_Mage_Hat')
    if hat:
        hat.hide_viewport = False
        hat.hide_render = False

    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()
    
    bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest3.blend')
    print('SUCCESS: Perfectly fitted hair to skull and Head_Socket!')

fit_hair_to_skull()
