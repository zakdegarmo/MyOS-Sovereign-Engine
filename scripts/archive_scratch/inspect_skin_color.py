import bpy

mat = bpy.data.materials.get('Native_Anime_Skin_Base')
bsdf = mat.node_tree.nodes.get('Principled BSDF')
print("Base Color value:", list(bsdf.inputs['Base Color'].default_value))
print("Subsurface:", getattr(bsdf.inputs.get('Subsurface Weight'), 'default_value', None))
