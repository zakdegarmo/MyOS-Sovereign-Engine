import bpy, os

# Hide everything except Mannequin and lights/cam
for o in bpy.data.objects:
    if o.type == 'MESH':
        o.hide_render = (o.name != 'Mannequin')

cam = bpy.data.objects['RenderCam']
cam.location = (0.007, -1.05, 1.20)
cam.rotation_euler = (1.5708, 0, 0)
bpy.context.scene.render.resolution_x = 400
bpy.context.scene.render.resolution_y = 400
bpy.context.scene.render.filepath = os.path.abspath('artifacts/volumetric_review/test_mannequin_only.png')
bpy.ops.render.render(write_still=True)
print('Rendered test_mannequin_only.png')
