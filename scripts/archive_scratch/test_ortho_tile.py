import bpy, mathutils, math, os

arm = bpy.data.objects['Armature']
cam = bpy.data.objects['RenderCam']
scene = bpy.context.scene

scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.resolution_x = 256
scene.render.resolution_y = 256

# Orthographic camera
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.65
cam.location = (0.007, -2.50, 0.95)
# Pitch looking down ~12 degrees
pitch = math.radians(78)
cam.rotation_euler = (pitch, 0, 0)

arm.data.pose_position = 'POSE'
act = bpy.data.actions.get('Walk_Loop')
arm.animation_data.action = act
bpy.context.scene.frame_set(10)
bpy.context.view_layer.update()

os.makedirs('artifacts/verification', exist_ok=True)
scene.render.filepath = os.path.abspath('artifacts/verification/test_tile_ortho.png')
bpy.ops.render.render(write_still=True)
print("Rendered test_tile_ortho.png")
