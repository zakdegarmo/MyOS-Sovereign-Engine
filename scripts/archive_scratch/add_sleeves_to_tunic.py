import bpy, bmesh, mathutils

def add_sleeves_to_tunic():
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    mw = man.matrix_world
    man_groups = {g.index: g.name for g in man.vertex_groups}
    
    # Filter function for tunic with sleeves
    def is_tunic_with_sleeves(f):
        c = mw @ f.calc_center_median()
        dx = abs(c.x - 0.007)
        # Torso
        if 0.52 <= c.z <= 0.96 and dx <= 0.16:
            return True
        # Shoulders and upper arm sleeves (hiding shoulder ball joint)
        if 0.82 <= c.z <= 1.02 and 0.14 <= dx <= 0.38:
            return True
        # Chest / upper back
        if 0.70 <= c.z <= 0.98 and dx <= 0.22:
            return True
        return False

    old_tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
    if old_tunic:
        bpy.data.objects.remove(old_tunic, do_unlink=True)
        
    bm_src = bmesh.new()
    bm_src.from_mesh(man.data)
    bm_src.faces.ensure_lookup_table()
    
    bm_dst = bmesh.new()
    src_to_dst = {}
    
    poly_indices = [f.index for f in bm_src.faces if is_tunic_with_sleeves(f)]
    for f_idx in poly_indices:
        f = bm_src.faces[f_idx]
        dst_verts = []
        for v in f.verts:
            if v.index not in src_to_dst:
                norm = v.normal.normalized() if v.normal.length > 0 else mathutils.Vector((0,0,1))
                wco = mw @ v.co
                dx = abs(wco.x - 0.007)
                
                # Extra offset on sleeves to hide shoulder ball joint
                extra_offset = 0.008 if dx > 0.13 else 0.005
                # Extra flare at bottom hem
                if wco.z < 0.62:
                    extra_offset += (0.62 - wco.z) * 0.15
                    
                new_co = v.co + norm * extra_offset
                new_v = bm_dst.verts.new(new_co)
                src_to_dst[v.index] = new_v
            dst_verts.append(src_to_dst[v.index])
        try:
            bm_dst.faces.new(dst_verts)
        except ValueError:
            pass

    bm_dst.verts.index_update()
    bm_dst.verts.ensure_lookup_table()
    dst_idx_to_src_idx = {dst_v.index: src_idx for src_idx, dst_v in src_to_dst.items()}
    
    mesh_dst = bpy.data.meshes.new('Modular_Adventurer_Tunic_Mesh')
    bm_dst.to_mesh(mesh_dst)
    bm_dst.free()
    bm_src.free()
    
    obj_tunic = bpy.data.objects.new('Modular_Adventurer_Tunic', mesh_dst)
    col = bpy.data.collections.get('Modular_Clothes')
    if not col:
        col = bpy.data.collections.new('Modular_Clothes')
        bpy.context.scene.collection.children.link(col)
    col.objects.link(obj_tunic)
    
    obj_tunic.parent = man.parent
    obj_tunic.parent_type = man.parent_type
    obj_tunic.matrix_parent_inverse = man.matrix_parent_inverse.copy()
    obj_tunic.location = man.location.copy()
    obj_tunic.rotation_euler = man.rotation_euler.copy()
    obj_tunic.scale = man.scale.copy()
    
    mod = obj_tunic.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm
    
    # Weight mapping
    vgroup_lookup = {}
    for g_name in man_groups.values():
        vgroup_lookup[g_name] = obj_tunic.vertex_groups.new(name=g_name)
        
    for dst_idx, src_idx in dst_idx_to_src_idx.items():
        src_v = man.data.vertices[src_idx]
        for g in src_v.groups:
            g_name = man_groups[g.group]
            vgroup_lookup[g_name].add([dst_idx], g.weight, 'REPLACE')

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
        if 0.58 <= pz <= 0.65 and dx <= 0.15:
            poly.material_index = 1 # Belt
            
    print(f'Created Modular_Adventurer_Tunic with sleeves: {len(obj_tunic.data.vertices)} verts, {len(obj_tunic.data.polygons)} faces.')
    
    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()
    
    bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest3.blend')
    print('SUCCESS: Saved sleeved tunic to rigTest3.blend!')

add_sleeves_to_tunic()
