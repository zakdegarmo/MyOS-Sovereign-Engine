import bpy, mathutils, math, os

# Ensure all character meshes are visible
for name in ['Mannequin', 'Modular_Adventurer_Tunic', 'Modular_Adventurer_Pants', 'Modular_Adventurer_Boots', 
             'Modular_Hair_Adventurer', 'Sword', 'Shield']:
    obj = bpy.data.objects.get(name)
    if obj:
        obj.hide_viewport = False
        obj.hide_render = False

# Ensure hat is hidden
hat = bpy.data.objects.get('Modular_Mage_Hat')
if hat:
    hat.hide_viewport = True
    hat.hide_render = True

cam = bpy.data.objects['RenderCam']
scene = bpy.context.scene
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
arm = bpy.data.objects['Armature']

# 1. Back Neck Rest View
arm.data.pose_position = 'REST'
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()

cam.location = (0.007, 2.30, 0.85)
cam.rotation_euler = (math.radians(93), 0, math.radians(180))
scene.render.resolution_x = 512
scene.render.resolution_y = 680
scene.render.filepath = os.path.abspath('artifacts/verification/perfect_back_rest.png')
bpy.ops.render.render(write_still=True)

# 2. Front Rest View
cam.location = (0.007, -2.30, 0.65)
cam.rotation_euler = (math.radians(88), 0, 0)
scene.render.filepath = os.path.abspath('artifacts/verification/perfect_front_rest.png')
bpy.ops.render.render(write_still=True)

# 3. Jog Frame 12 View (3/4 Front)
arm.data.pose_position = 'POSE'
bpy.context.scene.frame_set(12)
bpy.context.view_layer.update()

cam.location = (-1.50, -1.90, 0.75)
cam.rotation_euler = (math.radians(84), 0, math.radians(-38))
scene.render.filepath = os.path.abspath('artifacts/verification/perfect_jog12_front.png')
bpy.ops.render.render(write_still=True)

# 4. Jog Frame 12 View (3/4 Back)
cam.location = (1.50, 1.90, 0.75)
cam.rotation_euler = (math.radians(96), 0, math.radians(142))
scene.render.filepath = os.path.abspath('artifacts/verification/perfect_jog12_back.png')
bpy.ops.render.render(write_still=True)

print("Rendered perfect mask verification views!")
