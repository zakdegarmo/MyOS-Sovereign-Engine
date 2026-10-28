import bpy

mat = bpy.data.materials.get('M_Chibi_Face')
if mat:
    print('blend_method:', getattr(mat, 'blend_method', 'N/A'))
    print('shadow_method:', getattr(mat, 'shadow_method', 'N/A'))
