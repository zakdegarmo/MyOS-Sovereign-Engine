import bpy

decal = bpy.data.objects.get('Chibi_Face_Decal')
if decal:
    print('Decal parent bone:', decal.parent_bone)
    print('Decal location:', decal.location)
    print('Decal matrix_world:\n', decal.matrix_world)
    mat = decal.data.materials[0] if decal.data.materials else None
    if mat:
        print('Decal mat name:', mat.name)
        for n in mat.node_tree.nodes:
            print(f'  Node: {n.name} ({n.type})')
            if n.type == 'TEX_IMAGE' and n.image:
                print(f'    Image: {n.image.name}, filepath={n.image.filepath}')
