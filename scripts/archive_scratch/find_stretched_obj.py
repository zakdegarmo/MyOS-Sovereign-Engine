import bpy

arm = bpy.data.objects['Armature']
print('Current action:', arm.animation_data.action.name if arm.animation_data and arm.animation_data.action else 'None')
print('Current frame:', bpy.context.scene.frame_current)

deps = bpy.context.evaluated_depsgraph_get()
for o in bpy.data.objects:
    if o.type == 'MESH':
        oe = o.evaluated_get(deps)
        me = oe.to_mesh()
        if len(me.vertices) > 0:
            ys = [(oe.matrix_world @ v.co).y for v in me.vertices]
            xs = [(oe.matrix_world @ v.co).x for v in me.vertices]
            zs = [(oe.matrix_world @ v.co).z for v in me.vertices]
            max_span = max(max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs))
            if max_span > 1.5:
                print(f'STRETCHED OBJECT: {o.name} has span={max_span:.3f}!')
                print(f'  X: [{min(xs):.3f}, {max(xs):.3f}], Y: [{min(ys):.3f}, {max(ys):.3f}], Z: [{min(zs):.3f}, {max(zs):.3f}]')
        oe.to_mesh_clear()
