import bpy, bmesh, mathutils, math

def tailor_outfit():
    print('=== TAILORING VOLUMETRIC CLOTHING & HAIR ===')
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()

    # ----------------------------------------------------
    # 1. TAILOR TUNIC: Widen sleeves over shoulders, flare hem
    # ----------------------------------------------------
    tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
    if tunic:
        mw = tunic.matrix_world
        mw_inv = mw.inverted()
        for v in tunic.data.vertices:
            wco = mw @ v.co
            norm = v.normal.normalized()
            
            # A. Shoulder / Sleeve Volume (X beyond ±0.14 and Z > 0.78)
            dx = abs(wco.x - 0.007)
            if dx > 0.13 and wco.z > 0.75:
                # Expand outward along normal to create loose sleeve
                sleeve_factor = (dx - 0.13) / 0.12 # 0 to 1
                v.co += (mw_inv.to_3x3() @ norm) * (0.012 * sleeve_factor)
                
            # B. Flared Hem at bottom (Z < 0.64)
            if wco.z < 0.64:
                flare_factor = (0.64 - wco.z) / 0.12
                # Push outward laterally from body center
                radial = mathutils.Vector((wco.x - 0.007, wco.y - 1.241, 0)).normalized()
                v.co += (mw_inv.to_3x3() @ radial) * (0.016 * flare_factor)
                
        tunic.data.update()
        print('Tailored Tunic with sleeve volume and flared hem.')

    # ----------------------------------------------------
    # 2. TAILOR PANTS: Bridge knee joint, add relaxed cloth slack
    # ----------------------------------------------------
    pants = bpy.data.objects.get('Modular_Adventurer_Pants')
    if pants:
        mw = pants.matrix_world
        mw_inv = mw.inverted()
        for v in pants.data.vertices:
            wco = mw @ v.co
            norm = v.normal.normalized()
            
            # Knee joint bridge (Z between 0.28 and 0.42, knee center ~0.35)
            if 0.26 <= wco.z <= 0.44:
                # Peak expansion at knee center to completely hide the ball joint groove
                dist_from_knee = abs(wco.z - 0.35)
                knee_factor = max(0.0, 1.0 - (dist_from_knee / 0.09))
                v.co += (mw_inv.to_3x3() @ norm) * (0.014 * knee_factor)
            elif wco.z > 0.44: # Thigh slack
                v.co += (mw_inv.to_3x3() @ norm) * 0.008
                
        pants.data.update()
        print('Tailored Pants: knee joint bridged with relaxed cloth slack.')

    # ----------------------------------------------------
    # 3. TAILOR BOOTS: Thick cuffed leather rim, heavy soles
    # ----------------------------------------------------
    boots = bpy.data.objects.get('Modular_Adventurer_Boots')
    if boots:
        mw = boots.matrix_world
        mw_inv = mw.inverted()
        for v in boots.data.vertices:
            wco = mw @ v.co
            norm = v.normal.normalized()
            
            # Ankle joint smoothing (Z between 0.10 and 0.16)
            if 0.10 <= wco.z <= 0.16:
                v.co += (mw_inv.to_3x3() @ norm) * 0.010
            # Flared top cuff (Z > 0.17)
            elif wco.z > 0.17:
                cuff_factor = (wco.z - 0.17) / 0.05
                v.co += (mw_inv.to_3x3() @ norm) * (0.018 * cuff_factor)
            # Chunky sole (Z < 0.035)
            elif wco.z < 0.035:
                # Thicken downward and outward
                v.co.z -= 0.008
                v.co.x += (0.006 if v.co.x > 0 else -0.006)
                
        boots.data.update()
        print('Tailored Boots: thick leather cuffs and heavy soles.')

    # ----------------------------------------------------
    # 4. RE-SCULPT HAIR FOR HAT COEXISTENCE
    # ----------------------------------------------------
    old_hair = bpy.data.objects.get('Modular_Hair_Adventurer')
    if old_hair:
        bpy.data.objects.remove(old_hair, do_unlink=True)
        
    bm_hair = bmesh.new()
    head_bone = arm.pose.bones.get('Head')
    head_len = head_bone.length if head_bone else 0.28
    
    # In Head bone local space:
    # +Y is along the bone axis (upwards).
    # -Z is forward (face direction).
    # +X is character's left, -X is character's right.
    
    # Snug skull cap that fits INSIDE the hat cone
    bmesh.ops.create_uvsphere(
        bm_hair, 
        u_segments=16, 
        v_segments=12, 
        radius=0.146, 
        matrix=mathutils.Matrix.Translation((0, head_len * 0.35, 0))
    )
    # Delete bottom interior
    del_verts = [v for v in bm_hair.verts if v.co.y < (head_len * 0.15)]
    bmesh.ops.delete(bm_hair, geom=del_verts, context='VERTS')
    
    # Helper to add stylized anime hair locks
    def add_lock(pos, length, width, rot_euler):
        bmesh.ops.create_cone(
            bm_hair,
            cap_ends=True,
            cap_tris=False,
            segments=5,
            radius1=width,
            radius2=0.001,
            depth=length,
            matrix=mathutils.Matrix.Translation(pos) @ rot_euler.to_matrix().to_4x4()
        )

    # A. Forehead Bangs (Visible under hat brim! Curving down over brow)
    # Forward is -Z in bone space
    bang_data = [
        # (pos_x, pos_y, pos_z, len, width, rot_x, rot_y, rot_z)
        (-0.06, head_len*0.36, -0.140, 0.09, 0.030, -35, 12, 0),
        (-0.02, head_len*0.38, -0.145, 0.10, 0.032, -30,  5, 0),
        ( 0.02, head_len*0.38, -0.145, 0.10, 0.032, -30, -5, 0),
        ( 0.06, head_len*0.36, -0.140, 0.09, 0.030, -35, -12, 0),
    ]
    for (px, py, pz, l, w, rx, ry, rz) in bang_data:
        add_lock(
            mathutils.Vector((px, py, pz)), 
            l, w, 
            mathutils.Euler((math.radians(rx), math.radians(ry), math.radians(rz)))
        )

    # B. Side Locks (Framing cheeks / in front of ears)
    side_data = [
        (-0.135, head_len*0.28, -0.05, 0.12, 0.035, -20,  25, -15),
        (-0.140, head_len*0.22,  0.02, 0.13, 0.035,  10,  20, -10),
        ( 0.135, head_len*0.28, -0.05, 0.12, 0.035, -20, -25,  15),
        ( 0.140, head_len*0.22,  0.02, 0.13, 0.035,  10, -20,  10),
    ]
    for (px, py, pz, l, w, rx, ry, rz) in side_data:
        add_lock(
            mathutils.Vector((px, py, pz)), 
            l, w, 
            mathutils.Euler((math.radians(rx), math.radians(ry), math.radians(rz)))
        )

    # C. Back Nape Locks (Flowing down onto collar/cape)
    nape_data = [
        (-0.08, head_len*0.18, 0.11, 0.13, 0.038, 45, -15, 0),
        (-0.03, head_len*0.16, 0.13, 0.14, 0.040, 40,  -5, 0),
        ( 0.03, head_len*0.16, 0.13, 0.14, 0.040, 40,   5, 0),
        ( 0.08, head_len*0.18, 0.11, 0.13, 0.038, 45,  15, 0),
    ]
    for (px, py, pz, l, w, rx, ry, rz) in nape_data:
        add_lock(
            mathutils.Vector((px, py, pz)), 
            l, w, 
            mathutils.Euler((math.radians(rx), math.radians(ry), math.radians(rz)))
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
    
    # Make BOTH hair and hat visible simultaneously!
    obj_hair.hide_viewport = False
    obj_hair.hide_render = False
    hat = bpy.data.objects.get('Modular_Mage_Hat')
    if hat:
        hat.hide_viewport = False
        hat.hide_render = False

    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()
    
    bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest3.blend')
    print('SUCCESS: Tailored outfit and created coexisting hair + hat in rigTest3.blend!')

tailor_outfit()
