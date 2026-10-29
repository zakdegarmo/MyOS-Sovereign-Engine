import bpy

mat = bpy.data.materials.get('M_Chibi_Face')
if mat:
    print('--- M_Chibi_Face Nodes & Links ---')
    for n in mat.node_tree.nodes:
        print(f'{n.name} ({n.type})')
    for l in mat.node_tree.links:
        print(f'{l.from_node.name}.{l.from_socket.name} -> {l.to_node.name}.{l.to_socket.name}')
