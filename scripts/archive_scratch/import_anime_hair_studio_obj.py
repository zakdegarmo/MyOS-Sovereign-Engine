import bpy, mathutils, sys, os

def import_anime_hair(obj_filepath, hair_name='Modular_Hair_Imported', scale_mult=1.0, color=(0.80, 0.50, 0.18, 1.0)):
    arm = bpy.data.objects.get('Armature')
    if not arm:
        print('Error: Armature not found.')
        return
        
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    # 1. Import OBJ
    if not os.path.exists(obj_filepath):
        print(f'Error: File not found: {obj_filepath}')
        return
        
    before_objs = set(bpy.data.objects)
    bpy.ops.wm.obj_import(filepath=obj_filepath)
    new_objs = list(set(bpy.data.objects) - before_objs)
    
    if not new_objs:
        print('No new objects imported from OBJ.')
        return
        
    hair_obj = new_objs[0]
    hair_obj.name = hair_name
    print(f'Imported hair OBJ: {hair_obj.name} with {len(hair_obj.data.vertices)} vertices.')
    
    # 2. Add to Modular_Hair collection
    col_hair = bpy.data.collections.get('Modular_Hair')
    if not col_hair:
        col_hair = bpy.data.collections.new('Modular_Hair')
        bpy.context.scene.collection.children.link(col_hair)
        
    # Unlink from scene root, link to collection
    for c in hair_obj.users_collection:
        c.objects.unlink(hair_obj)
    col_hair.objects.link(hair_obj)
    
    # 3. Position and Align to Head_Socket
    hs = arm.pose.bones.get('Head_Socket')
    head_pos = arm.matrix_world @ hs.head
    
    # Calculate bounding box & center
    bb = [hair_obj.matrix_world @ mathutils.Vector(c) for c in hair_obj.bound_box]
    hair_min_z = min(v.z for v in bb); hair_max_z = max(v.z for v in bb)
    hair_height = hair_max_z - hair_min_z
    hair_center = sum(bb, mathutils.Vector()) / len(bb)
    
    # Auto-scale if the OBJ came in at standard human meter scale (e.g. height ~0.4m vs chibi ~0.2m)
    # Chibi head height is ~0.26m
    target_height = 0.28
    if hair_height > 0.01:
        auto_scale = (target_height / hair_height) * scale_mult
        hair_obj.scale = (auto_scale, auto_scale, auto_scale)
        bpy.ops.object.select_all(action='DESELECT')
        hair_obj.select_set(True)
        bpy.context.view_layer.objects.active = hair_obj
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # Center hair to head crown (Head_Socket)
    hair_obj.location = (head_pos.x, head_pos.y, head_pos.z - 0.12)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    
    # 4. Parent to Head_Socket
    hair_obj.parent = arm
    hair_obj.parent_type = 'BONE'
    hair_obj.parent_bone = 'Head_Socket'
    hair_obj.matrix_parent_inverse = (arm.matrix_world @ hs.matrix).inverted()
    
    # 5. Assign material
    mat_hair = bpy.data.materials.get('M_Hair_Adventurer')
    if not mat_hair:
        mat_hair = bpy.data.materials.new('M_Hair_Adventurer')
        mat_hair.use_nodes = True
        bsdf = mat_hair.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = color
    hair_obj.data.materials.clear()
    hair_obj.data.materials.append(mat_hair)
    
    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()
    print(f'Successfully bound {hair_obj.name} to Head_Socket!')

if __name__ == '__main__':
    # Can be run with args: blender -b file.blend -P import_anime_hair_studio_obj.py -- path_to_hair.obj
    if '--' in sys.argv:
        obj_path = sys.argv[sys.argv.index('--') + 1]
        import_anime_hair(obj_path)
