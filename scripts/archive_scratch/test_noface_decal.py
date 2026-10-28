import bpy, os

face = bpy.data.objects.get('Chibi_Face_Decal')
if face:
    face.hide_render = True

scene = bpy.context.scene
scene.render.resolution_x = 256
scene.render.resolution_y = 256
scene.render.film_transparent = True
out_path = os.path.abspath('temp_tiles/test_noface_decal.png')
scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print("Rendered test_noface_decal.png!")
