import bpy, os

arm = bpy.data.objects['Armature']
arm.data.pose_position = 'REST'
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()

cam = bpy.data.objects['RenderCam']
cam.location = (0.007, -1.05, 1.20)
cam.rotation_euler = (1.5708, 0, 0)
bpy.context.scene.render.resolution_x = 400
bpy.context.scene.render.resolution_y = 400
bpy.context.scene.render.filepath = os.path.abspath('artifacts/volumetric_review/test_skin_rest.png')
bpy.ops.render.render(write_still=True)
print('Rendered test_skin_rest.png')
