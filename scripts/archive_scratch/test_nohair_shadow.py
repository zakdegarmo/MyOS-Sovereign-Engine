import bpy, os

hair = bpy.data.objects.get('Modular_Hair_Adventurer')
if hair:
    hair.visible_shadow = False

scene = bpy.context.scene
scene.render.resolution_x = 256
scene.render.resolution_y = 256
scene.render.film_transparent = True
out_path = os.path.abspath('temp_tiles/test_nohair_shadow.png')
scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print("Rendered test_nohair_shadow.png!")
