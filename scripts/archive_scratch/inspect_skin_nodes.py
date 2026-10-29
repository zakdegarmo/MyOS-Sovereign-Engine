import bpy

mat = bpy.data.materials.get('Native_Anime_Skin_Base')
if mat:
    print("Native_Anime_Skin_Base nodes:")
    for n in mat.node_tree.nodes:
        print(f"  Node: {n.name} ({n.type})")
        for inp in n.inputs:
            if inp.is_linked:
                for l in inp.links:
                    print(f"    <- {l.from_node.name}.{l.from_socket.name} to {inp.name}")
            elif hasattr(inp, 'default_value'):
                if 'color' in inp.name.lower() or 'base' in inp.name.lower():
                    print(f"    {inp.name} = {getattr(inp, 'default_value', None)}")
