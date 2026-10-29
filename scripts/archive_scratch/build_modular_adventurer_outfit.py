import bpy, bmesh, mathutils, math

def create_outfit():
    print('=== BUILDING MODULAR ADVENTURER OUTFIT ===')
    
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    
    # Store initial animation state
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    mw = man.matrix_world
    
    # Ensure collections exist
    col_clothes = bpy.data.collections.get('Modular_Clothes')
    if not col_clothes:
        col_clothes = bpy.data.collections.new('Modular_Clothes')
        bpy.context.scene.collection.children.link(col_clothes)
        
    col_hair = bpy.data.collections.get('Modular_Hair')
    if not col_hair:
        col_hair = bpy.data.collections.new('Modular_Hair')
        bpy.context.scene.collection.children.link(col_hair)

    # ----------------------------------------------------
    # MATERIALS
    # ----------------------------------------------------
    def get_or_create_mat(name, color, roughness=0.5, metallic=0.0):
        mat = bpy.data.materials.get(name)
        if not mat:
            mat = bpy.data.materials.new(name)
            mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = color
            bsdf.inputs['Roughness'].default_value = roughness
            bsdf.inputs['Metallic'].default_value = metallic
        return mat

    mat_tunic = get_or_create_mat('M_Adventurer_Tunic', (0.10, 0.36, 0.20, 1.0), roughness=0.65) # Forest Green
    mat_belt = get_or_create_mat('M_Adventurer_Belt', (0.24, 0.14, 0.07, 1.0), roughness=0.40) # Rich Leather
    mat_buckle = get_or_create_mat('M_Adventurer_Buckle', (0.90, 0.75, 0.20, 1.0), roughness=0.25, metallic=0.85) # Brass
    mat_pants = get_or_create_mat('M_Adventurer_Pants', (0.20, 0.22, 0.26, 1.0), roughness=0.70) # Slate Grey
    mat_boots = get_or_create_mat('M_Adventurer_Boots', (0.30, 0.17, 0.09, 1.0), roughness=0.50) # Dark Leather
    mat_cuff = get_or_create_mat('M_Adventurer_BootCuff', (0.62, 0.50, 0.35, 1.0), roughness=0.60) # Tan Fold
    mat_hair = get_or_create_mat('M_Hair_Adventurer', (0.75, 0.50, 0.22, 1.0), roughness=0.45) # Golden Chestnut

    # ----------------------------------------------------
    # HELPER: EXTRACT SUB-MESH WITH WEIGHTS
    # ----------------------------------------------------
    def extract_submesh(name, poly_indices, normal_offset=0.004):
        # Remove old if exists
        old = bpy.data.objects.get(name)
        if old:
            bpy.data.objects.remove(old, do_unlink=True)
            
        bm_src = bmesh.new()
        bm_src.from_mesh(man.data)
        bm_src.faces.ensure_lookup_table()
        
        # New bmesh for garment
        bm_dst = bmesh.new()
        
        # Collect faces to duplicate
        faces_to_copy = [bm_src.faces[i] for i in poly_indices if i < len(bm_src.faces)]
        
        # Mapping from src vert to dst vert
        vert_map = {}
        for f in faces_to_copy:
            dst_verts = []
            for v in f.verts:
                if v not in vert_map:
                    # Offset slightly along normal
                    norm = v.normal.normalized() if v.normal.length > 0 else mathutils.Vector((0,0,1))
                    offset_co = v.co + norm * normal_offset
                    new_v = bm_dst.verts.new(offset_co)
                    vert_map[v] = new_v
                dst_verts.append(vert_map[v])
            try:
                bm_dst.faces.new(dst_verts)
            except ValueError:
                pass # Skip duplicate face
                
        # Create new mesh and object
        mesh_dst = bpy.data.meshes.new(name + '_Mesh')
        bm_dst.to_mesh(mesh_dst)
        bm_dst.free()
        bm_src.free()
        
        obj = bpy.data.objects.new(name, mesh_dst)
        col_clothes.objects.link(obj)
        
        # Parent to Armature
        obj.parent = arm
        mod = obj.modifiers.new('Armature', 'ARMATURE')
        mod.object = arm
        
        # Transfer vertex groups & weights from Mannequin
        for g in man.vertex_groups:
            obj.vertex_groups.new(name=g.name)
            
        # Use Data Transfer modifier to copy exact vertex weights
        dt = obj.modifiers.new('WeightTransfer', 'DATA_TRANSFER')
        dt.object = man
        dt.use_vert_data = True
        dt.data_types_verts = {'VGROUP_WEIGHTS'}
        dt.vert_mapping = 'NEAREST'
        
        # Apply data transfer immediately
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=dt.name)
        
        print(f'Created {name} with {len(mesh_dst.vertices)} verts, {len(mesh_dst.polygons)} faces.')
        return obj

    # ----------------------------------------------------
    # 1. ADVENTURER TUNIC
    # ----------------------------------------------------
    tunic_polys = []
    belt_polys = []
    for p in man.data.polygons:
        c = mw @ p.center
        dx = abs(c.x - 0.007)
        if 0.52 <= c.z <= 0.96 and dx <= 0.28:
            tunic_polys.append(p.index)
            if 0.58 <= c.z <= 0.65:
                belt_polys.append(p.index)

    obj_tunic = extract_submesh('Modular_Adventurer_Tunic', tunic_polys, normal_offset=0.005)
    obj_tunic.data.materials.append(mat_tunic)
    obj_tunic.data.materials.append(mat_belt)
    obj_tunic.data.materials.append(mat_buckle)
    
    # Assign belt material to waist faces
    for poly in obj_tunic.data.polygons:
        pz = (obj_tunic.matrix_world @ poly.center).z
        if 0.58 <= pz <= 0.65:
            poly.material_index = 1 # Belt
            
    # Add a brass belt buckle mesh on the front of the tunic
    bm_buckle = bmesh.new()
    # Buckle frame at front center (X~0.007, Y~1.14, Z~0.615)
    b_center = mathutils.Vector((0.007, 1.135, 0.615))
    bmesh.ops.create_cube(bm_buckle, size=0.035, matrix=mathutils.Matrix.Translation(b_center))
    for v in bm_buckle.verts:
        v.co.y *= 0.35 # Flatten along Y
        v.co.z *= 0.8  # Shape into buckle
    bm_tunic = bmesh.new()
    bm_tunic.from_mesh(obj_tunic.data)
    # Append buckle to tunic bmesh
    for f in bm_buckle.faces:
        nv = [bm_tunic.verts.new(v.co) for v in f.verts]
        nf = bm_tunic.faces.new(nv)
        nf.material_index = 2 # Buckle brass
    bm_tunic.to_mesh(obj_tunic.data)
    bm_buckle.free()
    bm_tunic.free()

    # ----------------------------------------------------
    # 2. ADVENTURER PANTS
    # ----------------------------------------------------
    pants_polys = []
    for p in man.data.polygons:
        c = mw @ p.center
        dx = abs(c.x - 0.007)
        if 0.18 <= c.z <= 0.60 and dx <= 0.22:
            pants_polys.append(p.index)

    obj_pants = extract_submesh('Modular_Adventurer_Pants', pants_polys, normal_offset=0.004)
    obj_pants.data.materials.append(mat_pants)

    # ----------------------------------------------------
    # 3. ADVENTURER BOOTS
    # ----------------------------------------------------
    boots_polys = []
    for p in man.data.polygons:
        c = mw @ p.center
        dx = abs(c.x - 0.007)
        if c.z <= 0.22 and dx <= 0.22:
            boots_polys.append(p.index)

    obj_boots = extract_submesh('Modular_Adventurer_Boots', boots_polys, normal_offset=0.007)
    obj_boots.data.materials.append(mat_boots)
    obj_boots.data.materials.append(mat_cuff)
    
    # Assign cuff material and displace top rim
    for poly in obj_boots.data.polygons:
        pz = (obj_boots.matrix_world @ poly.center).z
        if pz >= 0.17:
            poly.material_index = 1 # Cuff
            
    # ----------------------------------------------------
    # 4. ADVENTURER HAIR
    # ----------------------------------------------------
    old_hair = bpy.data.objects.get('Modular_Hair_Adventurer')
    if old_hair:
        bpy.data.objects.remove(old_hair, do_unlink=True)
        
    bm_hair = bmesh.new()
    head_center = mathutils.Vector((0.0070, 1.2410, 1.1700))
    
    # Crown dome cap
    bmesh.ops.create_uvsphere(bm_hair, u_segments=16, v_segments=12, radius=0.155, matrix=mathutils.Matrix.Translation(head_center))
    # Keep only upper half and sides (Z > head_center.z - 0.03)
    del_verts = [v for v in bm_hair.verts if v.co.z < (head_center.z - 0.02) and v.co.y > head_center.y]
    bmesh.ops.delete(bm_hair, geom=del_verts, context='VERTS')
    
    # Add stylish spiky bangs and locks
    bang_offsets = [
        # (offset_x, offset_y, offset_z, scale_x, scale_y, scale_z)
        (-0.06, -0.145, 0.02, 0.035, 0.04, 0.08),  # Left bang
        (0.00,  -0.155, 0.04, 0.040, 0.04, 0.09),  # Center bang
        (0.06,  -0.145, 0.02, 0.035, 0.04, 0.08),  # Right bang
        (-0.11, -0.060, -0.01, 0.035, 0.04, 0.09), # Left side tuft
        (0.12,  -0.060, -0.01, 0.035, 0.04, 0.09), # Right side tuft
        (-0.05, 0.120,  0.06, 0.045, 0.05, 0.10),  # Back crown spike left
        (0.05,  0.120,  0.06, 0.045, 0.05, 0.10),  # Back crown spike right
        (0.00,  0.140,  0.01, 0.045, 0.05, 0.09),  # Back nape spike
    ]
    
    for (ox, oy, oz, sx, sy, sz) in bang_offsets:
        pos = head_center + mathutils.Vector((ox, oy, oz))
        bmesh.ops.create_cone(
            bm_hair, 
            cap_ends=True, 
            cap_tris=False, 
            segments=6, 
            radius1=sx, 
            radius2=0.002, 
            depth=sz*2,
            matrix=mathutils.Matrix.Translation(pos) @ mathutils.Euler((math.radians(15 if oy<0 else -20), math.radians(-10 if ox<0 else 10), 0)).to_matrix().to_4x4()
        )
        
    mesh_hair = bpy.data.meshes.new('Modular_Hair_Adventurer_Mesh')
    bm_hair.to_mesh(mesh_hair)
    bm_hair.free()
    
    obj_hair = bpy.data.objects.new('Modular_Hair_Adventurer', mesh_hair)
    col_hair.objects.link(obj_hair)
    obj_hair.data.materials.append(mat_hair)
    
    # Parent hair to Head bone
    obj_hair.parent = arm
    obj_hair.parent_type = 'BONE'
    obj_hair.parent_bone = 'Head'
    obj_hair.matrix_parent_inverse = arm.matrix_world.inverted() @ arm.pose.bones['Head'].matrix.inverted()
    
    print('Created Modular_Hair_Adventurer.')
    
    # Restore animation pose
    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()
    
    # Save the blend file
    bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest2.blend')
    print('SUCCESS: Saved updated mannequin_chibi_basic_rigTest2.blend!')

create_outfit()
