import bpy

decal = bpy.data.objects.get('Chibi_Face_Decal')
if decal:
    print('visible_shadow:', decal.visible_shadow)
    print('visible_diffuse:', decal.visible_diffuse)
    print('visible_glossy:', decal.visible_glossy)
