import bpy, os

man = bpy.data.objects['Mannequin']
mat = man.data.materials[0]
bsdf = mat.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (1.0, 0.86, 0.78, 1.0)
bsdf.inputs['Roughness'].default_value = 0.30

# Set view transform to Standard
scene = bpy.context.scene
scene.view_settings.view_transform = 'Standard'
scene.view_settings.exposure = 0.20

# Hide everything except Mannequin and lights/cam
for o in bpy.data.objects:
    if o.type == 'MESH':
        o.hide_render = (o.name != 'Mannequin')

cam = bpy.data.objects['RenderCam']
cam.location = (0.007, -1.05, 1.20)
cam.rotation_euler = (1.5708, 0, 0)
scene.render.resolution_x = 400
scene.render.resolution_y = 400
scene.render.filepath = os.path.abspath('artifacts/volumetric_review/test_skin_standard.png')
bpy.ops.render.render(write_still=True)
print('Rendered test_skin_standard.png')
