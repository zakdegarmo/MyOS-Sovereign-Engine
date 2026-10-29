import bpy, os

arm = bpy.data.objects['Armature']
arm.data.pose_position = 'REST'
bpy.context.scene.frame_set(0)

# Unparent camera so its world coordinates are absolute
cam = bpy.data.objects['RenderCam']
cam.parent = None
cam.data.type = 'PERSP'
cam.location = (0.007, -1.15, 1.20)
cam.rotation_euler = (1.5708, 0.0, 0.0)

# Hide Mage Hat completely for the hair showcase
hat = bpy.data.objects.get('Modular_Mage_Hat')
if hat:
    hat.hide_viewport = True
    hat.hide_render = True

bpy.context.scene.render.resolution_x = 420
bpy.context.scene.render.resolution_y = 520

hair_names = [
    ('Modular_Hair_Spiky_Hero', '1. Spiky Hero'),
    ('Modular_Hair_Rogue_Ponytail', '2. Rogue Ponytail'),
    ('Modular_Hair_Mage_Bob', '3. Mage Bob'),
    ('Modular_Hair_Barbarian_Mane', '4. Barbarian Mane'),
    ('Modular_Hair_Elf_TwinTails', '5. Elf Twin-Tails')
]

for h_name, label in hair_names:
    for name, _ in hair_names:
        o = bpy.data.objects.get(name)
        if o:
            o.hide_viewport = True
            o.hide_render = True
            
    active_obj = bpy.data.objects.get(h_name)
    if active_obj:
        active_obj.hide_viewport = False
        active_obj.hide_render = False
        
    out_img = os.path.abspath(f'artifacts/hair_previews/{h_name}.png')
    bpy.context.scene.render.filepath = out_img
    bpy.ops.render.render(write_still=True)
    print(f'Rendered portrait for {label}')

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest3.blend')
