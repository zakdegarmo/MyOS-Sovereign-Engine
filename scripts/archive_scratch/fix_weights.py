import bpy

for name in ['Modular_Adventurer_Tunic', 'Modular_Adventurer_Pants', 'Modular_Adventurer_Boots']:
    obj = bpy.data.objects.get(name)
    man = bpy.data.objects['Mannequin']
    if obj:
        # Clear existing vertex groups
        obj.vertex_groups.clear()
        
        # Add Data Transfer modifier
        dt = obj.modifiers.new('WeightTransfer', 'DATA_TRANSFER')
        dt.object = man
        dt.use_vert_data = True
        dt.data_types_verts = {'VGROUP_WEIGHTS'}
        dt.layers_vgroup_select_src = 'ALL'
        dt.layers_vgroup_select_dst = 'NAME'
        dt.vert_mapping = 'NEAREST'
        
        # Apply data transfer
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.datalayout_transfer(modifier=dt.name)
        bpy.ops.object.modifier_apply(modifier=dt.name)
        
        active_groups = set()
        for v in obj.data.vertices:
            for g in v.groups:
                if g.weight > 0.05:
                    active_groups.add(obj.vertex_groups[g.group].name)
        print(f'{obj.name}: {len(active_groups)} active vertex groups -> {sorted(list(active_groups))}')

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest2.blend')
print('Saved fixed weights!')
