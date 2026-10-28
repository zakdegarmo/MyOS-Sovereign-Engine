import bpy, mathutils, math, os

man = bpy.data.objects['Mannequin']
mask_mod = man.modifiers.get('Body_Mask')
if mask_mod:
    mask_mod.show_viewport = False
    mask_mod.show_render = False

cam = bpy.data.objects['RenderCam']
scene = bpy.context.scene
arm = bpy.data.objects['Armature']

# 1. Back rest
arm.data.pose_position = 'REST'
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()
cam.location = (0.007, 2.40, 0.70)
cam.rotation_euler = (math.radians(93), 0, math.radians(180))
scene.render.resolution_x = 512
scene.render.resolution_y = 680
scene.render.filepath = os.path.abspath('artifacts/verification/nomask_back_rest.png')
bpy.ops.render.render(write_still=True)

# 2. Front rest
cam.location = (0.007, -2.30, 0.65)
cam.rotation_euler = (math.radians(88), 0, 0)
scene.render.filepath = os.path.abspath('artifacts/verification/nomask_front_rest.png')
bpy.ops.render.render(write_still=True)

# 3. Jog frame 12 front
arm.data.pose_position = 'POSE'
bpy.context.scene.frame_set(12)
bpy.context.view_layer.update()
cam.location = (-1.50, -1.90, 0.75)
cam.rotation_euler = (math.radians(84), 0, math.radians(-38))
scene.render.filepath = os.path.abspath('artifacts/verification/nomask_jog12.png')
bpy.ops.render.render(write_still=True)

# 4. Jog frame 12 back
cam.location = (1.50, 1.90, 0.75)
cam.rotation_euler = (math.radians(96), 0, math.radians(142))
scene.render.filepath = os.path.abspath('artifacts/verification/nomask_jog12_back.png')
bpy.ops.render.render(write_still=True)

print("Rendered nomask tests!")
