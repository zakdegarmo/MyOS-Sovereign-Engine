import bpy

face = bpy.data.objects.get('Chibi_Face_Decal')
if face:
    mat = face.data.materials[0]
    print("Face material shadow method:", getattr(mat, 'shadow_method', 'N/A'))
    print("Face object visible_shadow:", getattr(face, 'visible_shadow', 'N/A'))
    print("Face mat blend_method:", getattr(mat, 'blend_method', 'N/A'))
