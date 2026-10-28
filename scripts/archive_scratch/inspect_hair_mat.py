import bpy

hair = bpy.data.objects.get('Modular_Hair_Adventurer')
if hair and hair.data.materials:
    mat = hair.data.materials[0]
    print("Hair material:", mat.name)
    if mat:
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            print("  Hair base color:", [round(x, 3) for x in bsdf.inputs['Base Color'].default_value])
            print("  Hair roughness:", bsdf.inputs['Roughness'].default_value)
