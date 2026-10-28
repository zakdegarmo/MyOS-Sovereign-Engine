import bpy, bmesh, mathutils, math

def align_outfit():
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    # 1. Match transforms for all deformed garments to Mannequin exactly
    for name in ['Modular_Adventurer_Tunic', 'Modular_Adventurer_Pants', 'Modular_Adventurer_Boots']:
        obj = bpy.data.objects.get(name)
        if obj:
            obj.parent = man.parent
            obj.parent_type = man.parent_type
            obj.matrix_parent_inverse = man.matrix_parent_inverse.copy()
            obj.location = man.location.copy()
            obj.rotation_euler = man.rotation_euler.copy()
            obj.scale = man.scale.copy()
            print(f'Aligned {name} with Mannequin.')
            
    # 2. Re-create Hair in Head Bone Local Space
    old_hair = bpy.data.objects.get('Modular_Hair_Adventurer')
    if old_hair:
        bpy.data.objects.remove(old_hair, do_unlink=True)
        
    bm_hair = bmesh.new()
    # In Head bone local space, the head bone goes from (0,0,0) to tail (0, length, 0)
    # Let's inspect Head bone
    pb_head = arm.pose.bones['Head']
    head_len = pb_head.length
    
    # Create hair cap centered slightly above head bone midpoint
    bmesh.ops.create_uvsphere(bm_hair, u_segments=16, v_segments=12, radius=0.155, matrix=mathutils.Matrix.Translation((0, head_len * 0.45, 0)))
    
    # Keep upper half and back
    del_verts = [v for v in bm_hair.verts if v.co.y < 0 and v.co.z < (head_len * 0.4)]
    bmesh.ops.delete(bm_hair, geom=del_verts, context='VERTS')
    
    # Add stylish adventurer bangs and spikes
    bang_specs = [
        # (x, y, z, rx, ry, rz)
        (-0.06, head_len*0.35, 0.13, 0.035, 0.07, 0.035),
        ( 0.00, head_len*0.45, 0.14, 0.040, 0.08, 0.040),
        ( 0.06, head_len*0.35, 0.13, 0.035, 0.07, 0.035),
        (-0.12, head_len*0.25, 0.05, 0.035, 0.08, 0.035),
        ( 0.12, head_len*0.25, 0.05, 0.035, 0.08, 0.035),
        (-0.05, head_len*0.65, -0.08, 0.045, 0.09, 0.045),
        ( 0.05, head_len*0.65, -0.08, 0.045, 0.09, 0.045),
    ]
    for (bx, by, bz, sx, sy, sz) in bang_specs:
        bmesh.ops.create_cone(
            bm_hair,
            cap_ends=True,
            cap_tris=False,
            segments=6,
            radius1=sx,
            radius2=0.002,
            depth=sy*2,
            matrix=mathutils.Matrix.Translation((bx, by, bz)) @ mathutils.Euler((math.radians(-80 if bz>0 else 40), 0, 0)).to_matrix().to_4x4()
        )
        
    mesh_hair = bpy.data.meshes.new('Modular_Hair_Adventurer_Mesh')
    bm_hair.to_mesh(mesh_hair)
    bm_hair.free()
    
    obj_hair = bpy.data.objects.new('Modular_Hair_Adventurer', mesh_hair)
    col_hair = bpy.data.collections.get('Modular_Hair')
    if not col_hair:
        col_hair = bpy.data.collections.new('Modular_Hair')
        bpy.context.scene.collection.children.link(col_hair)
    col_hair.objects.link(obj_hair)
    
    mat_hair = bpy.data.materials.get('M_Hair_Adventurer')
    if mat_hair:
        obj_hair.data.materials.append(mat_hair)
        
    obj_hair.parent = arm
    obj_hair.parent_type = 'BONE'
    obj_hair.parent_bone = 'Head'
    obj_hair.location = (0, 0, 0)
    obj_hair.rotation_euler = (0, 0, 0)
    obj_hair.scale = (1, 1, 1)
    
    # Hide the mage hat so we can see the adventurer hair!
    hat = bpy.data.objects.get('Modular_Mage_Hat')
    if hat:
        hat.hide_viewport = True
        hat.hide_render = True
        
    staff = bpy.data.objects.get('Modular_2H_Staff')
    if staff:
        staff.hide_viewport = True
        staff.hide_render = True
        
    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()
    
    bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest2.blend')
    print('Aligned outfit and hair!')

align_outfit()
