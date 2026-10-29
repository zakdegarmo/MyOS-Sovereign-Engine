import bpy

tunic = bpy.data.objects['Modular_Adventurer_Tunic']
arm = bpy.data.objects['Armature']

bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()
deps = bpy.context.evaluated_depsgraph_get()
te = tunic.evaluated_get(deps)
me = te.to_mesh()

print('Evaluated vertices with world Y < 0.5:')
for i, v in enumerate(me.vertices):
    wco = te.matrix_world @ v.co
    if wco.y < 0.5:
        orig_v = tunic.data.vertices[i]
        groups = {tunic.vertex_groups[g.group].name: round(g.weight, 3) for g in orig_v.groups}
        print(f'Vert {i}: eval_wco=({wco.x:.3f}, {wco.y:.3f}, {wco.z:.3f}), orig_co=({orig_v.co.x:.3f}, {orig_v.co.y:.3f}, {orig_v.co.z:.3f}), groups={groups}')

te.to_mesh_clear()
