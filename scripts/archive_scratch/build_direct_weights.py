import bpy, bmesh, mathutils, math

def direct_weight_build():
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    
    # Force rest pose during generation
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    col_clothes = bpy.data.collections.get('Modular_Clothes')
    if not col_clothes:
        col_clothes = bpy.data.collections.new('Modular_Clothes')
        bpy.context.scene.collection.children.link(col_clothes)

    man_groups = {g.index: g.name for g in man.vertex_groups}
    
    # Function to create garment with direct vertex weight mapping
    def make_garment(name, poly_filter_fn, normal_offset=0.004, materials=[]):
        old = bpy.data.objects.get(name)
        if old:
            bpy.data.objects.remove(old, do_unlink=True)
            
        bm_src = bmesh.new()
        bm_src.from_mesh(man.data)
        bm_src.faces.ensure_lookup_table()
        
        bm_dst = bmesh.new()
        
        # Mapping from src vert index to dst vert
        src_to_dst_vert = {}
        poly_indices = [f.index for f in bm_src.faces if poly_filter_fn(f)]
        
        for f_idx in poly_indices:
            f = bm_src.faces[f_idx]
            dst_verts = []
            for v in f.verts:
                if v.index not in src_to_dst_vert:
                    norm = v.normal.normalized() if v.normal.length > 0 else mathutils.Vector((0,0,1))
                    new_co = v.co + norm * normal_offset
                    new_v = bm_dst.verts.new(new_co)
                    src_to_dst_vert[v.index] = new_v
                dst_verts.append(src_to_dst_vert[v.index])
            try:
                bm_dst.faces.new(dst_verts)
            except ValueError:
                pass
                
        bm_dst.verts.index_update()
        bm_dst.verts.ensure_lookup_table()
        dst_idx_to_src_idx = {dst_v.index: src_idx for src_idx, dst_v in src_to_dst_vert.items()}
        
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
        
        # Create all vertex groups
        vgroup_lookup = {}
        for g_name in man_groups.values():
            vgroup_lookup[g_name] = obj.vertex_groups.new(name=g_name)
            
        for dst_idx, src_idx in dst_idx_to_src_idx.items():
            src_v = man.data.vertices[src_idx]
            for g in src_v.groups:
                g_name = man_groups[g.group]
                vgroup_lookup[g_name].add([dst_idx], g.weight, 'REPLACE')
                
        # Assign materials
        for m in materials:
            obj.data.materials.append(m)
            
        active_groups = set()
        for v in obj.data.vertices:
            for g in v.groups:
                if g.weight > 0.05:
                    active_groups.add(obj.vertex_groups[g.group].name)
        print(f'{name}: {len(obj.data.vertices)} verts, {len(obj.data.polygons)} polys, {len(active_groups)} active bone groups: {sorted(list(active_groups))}')
        return obj

    # Filter functions
    mw = man.matrix_world
    def is_tunic(f):
        c = mw @ f.calc_center_median()
        return (0.52 <= c.z <= 0.96) and (abs(c.x - 0.007) <= 0.28)
        
    def is_pants(f):
        c = mw @ f.calc_center_median()
        return (0.18 <= c.z <= 0.60) and (abs(c.x - 0.007) <= 0.22)
        
    def is_boots(f):
        c = mw @ f.calc_center_median()
        return (c.z <= 0.22) and (abs(c.x - 0.007) <= 0.22)

    mat_tunic = bpy.data.materials.get('M_Adventurer_Tunic')
    mat_belt = bpy.data.materials.get('M_Adventurer_Belt')
    mat_buckle = bpy.data.materials.get('M_Adventurer_Buckle')
    mat_pants = bpy.data.materials.get('M_Adventurer_Pants')
    mat_boots = bpy.data.materials.get('M_Adventurer_Boots')
    mat_cuff = bpy.data.materials.get('M_Adventurer_BootCuff')

    obj_tunic = make_garment('Modular_Adventurer_Tunic', is_tunic, normal_offset=0.005, materials=[mat_tunic, mat_belt, mat_buckle])
    # Belt assignment
    for poly in obj_tunic.data.polygons:
        pz = (obj_tunic.matrix_world @ poly.center).z
        if 0.58 <= pz <= 0.65:
            poly.material_index = 1

    obj_pants = make_garment('Modular_Adventurer_Pants', is_pants, normal_offset=0.004, materials=[mat_pants])
    obj_boots = make_garment('Modular_Adventurer_Boots', is_boots, normal_offset=0.007, materials=[mat_boots, mat_cuff])
    for poly in obj_boots.data.polygons:
        pz = (obj_boots.matrix_world @ poly.center).z
        if pz >= 0.17:
            poly.material_index = 1

    # Restore pose
    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()
    
    bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest2.blend')
    print('SUCCESS: Built direct-weighted garments!')

direct_weight_build()
