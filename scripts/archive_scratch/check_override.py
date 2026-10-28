import bpy

vl = bpy.context.view_layer
print('view_layer.material_override:', vl.material_override)
for scene in bpy.data.scenes:
    print('scene.view_layers:')
    for v in scene.view_layers:
        print(f'  {v.name}: material_override = {v.material_override}')
