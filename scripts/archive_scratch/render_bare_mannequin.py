import bpy, mathutils, math, os

# Hide all accessories and clothes
for name in ['Modular_Adventurer_Tunic', 'Modular_Adventurer_Pants', 'Modular_Adventurer_Boots', 
             'Modular_Hair_Adventurer', 'Modular_Mage_Hat', 'Sword', 'Shield']:
    obj = bpy.data.objects.get(name)
    if obj:
        obj.hide_viewport = True
        obj.hide_render = True

man = bpy.data.objects['Mannequin']
man.hide_viewport = False
man.hide_render = False

mask = man.modifiers.get('Body_Mask')
if mask:
    mask.show_render = False
    mask.show_viewport = False

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
scene.render.filepath = os.path.abspath('artifacts/verification/mannequin_bare_back.png')
bpy.ops.render.render(write_still=True)

# Front view
cam.location = (0.007, -2.30, 0.65)
cam.rotation_euler = (math.radians(88), 0, 0)
scene.render.filepath = os.path.abspath('artifacts/verification/mannequin_bare_front.png')
bpy.ops.render.render(write_still=True)

print("Rendered bare mannequin!")
