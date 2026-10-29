import bpy

for o in bpy.data.objects:
    if o.type == 'MESH':
        zs = [(o.matrix_world @ v.co).z for v in o.data.vertices]
        if max(zs) > 1.05 and min(zs) < 1.30:
            print(f"Mesh over head: {o.name}, visible_render={not o.hide_render}, visible_viewport={not o.hide_viewport}")
            print(f"  mats: {[m.name if m else None for m in o.data.materials]}")
