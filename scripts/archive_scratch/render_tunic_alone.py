import bpy, mathutils, math, os

for obj in bpy.data.objects:
    obj.hide_viewport = True
    obj.hide_render = True

tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
tunic.hide_viewport = False
tunic.hide_render = False

cam = bpy.data.objects['RenderCam']
scene = bpy.context.scene
arm = bpy.data.objects['Armature']
arm.data.pose_position = 'REST'
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()

# Back view
cam.location = (0.007, 2.40, 0.70)
cam.rotation_euler = (math.radians(93), 0, math.radians(180))
scene.render.resolution_x = 512
scene.render.resolution_y = 680
scene.render.filepath = os.path.abspath('artifacts/verification/tunic_alone_back.png')
bpy.ops.render.render(write_still=True)

# Front view
cam.location = (0.007, -2.30, 0.65)
cam.rotation_euler = (math.radians(88), 0, 0)
scene.render.filepath = os.path.abspath('artifacts/verification/tunic_alone_front.png')
bpy.ops.render.render(write_still=True)

print("Rendered tunic alone!")
