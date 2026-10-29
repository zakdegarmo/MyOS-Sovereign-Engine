import bpy

tunic = bpy.data.objects['Modular_Adventurer_Tunic']

# Rename Spine1 to Spine01 if present
grp = tunic.vertex_groups.get('Spine1')
if grp:
    grp.name = 'Spine01'
    print('Renamed Spine1 to Spine01!')

# Ensure neck group exists
if 'neck' not in tunic.vertex_groups:
    tunic.vertex_groups.new(name='neck')

# Check evaluated bounds in frame 0 and 12
for frame in [0, 12]:
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    te = tunic.evaluated_get(deps)
    me = te.to_mesh()
    xs = [(te.matrix_world @ v.co).x for v in me.vertices]
    ys = [(te.matrix_world @ v.co).y for v in me.vertices]
    zs = [(te.matrix_world @ v.co).z for v in me.vertices]
    max_span = max(max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs))
    print(f'Frame {frame}: span={max_span:.3f}')
    print(f'  X: [{min(xs):.3f}, {max(xs):.3f}]')
    print(f'  Y: [{min(ys):.3f}, {max(ys):.3f}]')
    print(f'  Z: [{min(zs):.3f}, {max(zs):.3f}]')
    te.to_mesh_clear()
