import bpy

face = bpy.data.objects.get('Chibi_Face_Decal')
if face:
    print(f"Face decal: parent={face.parent.name if face.parent else None}, type={face.parent_type}, bone={face.parent_bone}")
    print(f"hide_viewport={face.hide_viewport}, hide_render={face.hide_render}")
