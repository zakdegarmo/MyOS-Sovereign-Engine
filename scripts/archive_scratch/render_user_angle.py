import bpy, math, os

cam = bpy.data.objects['RenderCam']
# Perspective matching user's view: slightly high angle, looking down at front-right of character
cam.location = (0.50, -1.10, 1.45)
cam.rotation_euler = (math.radians(68), 0, math.radians(22))
bpy.context.scene.render.resolution_x = 512
bpy.context.scene.render.resolution_y = 512

bpy.context.scene.frame_set(12)
bpy.context.view_layer.update()

out_path = os.path.abspath('artifacts/volumetric_review/user_angle_jog12.png')
bpy.context.scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print('Rendered user angle to:', out_path)
