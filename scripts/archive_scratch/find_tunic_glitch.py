import bpy

tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
if tunic:
    mw = tunic.matrix_world
    print('Tunic vertex count:', len(tunic.data.vertices))
    # Check vertex bounds in rest vs pose
    for frame in [0, 12]:
        bpy.context.scene.frame_set(frame)
        bpy.context.view_layer.update()
        deps = bpy.context.evaluated_depsgraph_get()
        te = tunic.evaluated_get(deps)
        me = te.to_mesh()
        xs = [(te.matrix_world @ v.co).x for v in me.vertices]
        ys = [(te.matrix_world @ v.co).y for v in me.vertices]
        zs = [(te.matrix_world @ v.co).z for v in me.vertices]
        print(f'Frame {frame}:')
        print(f'  X: [{min(xs):.3f}, {max(xs):.3f}]')
        print(f'  Y: [{min(ys):.3f}, {max(ys):.3f}]')
        print(f'  Z: [{min(zs):.3f}, {max(zs):.3f}]')
        
        # Check outliers in Y (far back)
        outliers = [(v.index, (te.matrix_world @ v.co)) for v in me.vertices if (te.matrix_world @ v.co).y > 2.0 or (te.matrix_world @ v.co).y < -1.0]
        if outliers:
            print(f'  Found {len(outliers)} Y outliers on frame {frame}!')
            for idx, p in outliers[:5]:
                print(f'    vert {idx}: loc=({p.x:.3f}, {p.y:.3f}, {p.z:.3f})')
        te.to_mesh_clear()
