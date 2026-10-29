import bpy

mat = bpy.data.materials.get('Native_Anime_Skin_Base')
if mat and mat.use_nodes:
    print('Native_Anime_Skin_Base nodes:')
    for n in mat.node_tree.nodes:
        print(f'Node: {n.name} ({n.type})')
        if n.type == 'BSDF_PRINCIPLED':
            base_col = n.inputs['Base Color'].default_value
            rough = n.inputs['Roughness'].default_value
            print(f'  Base Color: {list(base_col)}')
            print(f'  Roughness: {rough}')
else:
    print('No Native_Anime_Skin_Base or nodes not used')
