import bpy

print("=== MATERIAL DETAILS ===")
for mat_name in ['LPC_Skin_Cel', 'Comic_Tunic_Emerald', 'Comic_Pants_Indigo', 'Comic_Boots_Leather', 'Comic_Belt_Gold']:
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        print(f"Mat {mat_name} not found")
        continue
    print(f"\n--- {mat_name} ---")
    if mat.use_nodes:
        for node in mat.node_tree.nodes:
            print(f"  Node: {node.name} ({node.type})")
            for inp in node.inputs:
                if inp.is_linked:
                    for l in inp.links:
                        print(f"    <- {inp.name} from {l.from_node.name}.{l.from_socket.name}")
                elif hasattr(inp, 'default_value'):
                    val = inp.default_value
                    if hasattr(val, '__iter__'):
                        val_str = f"({', '.join(f'{x:.3f}' if isinstance(x, float) else str(x) for x in val)})"
                    elif isinstance(val, float):
                        val_str = f"{val:.3f}"
                    else:
                        val_str = str(val)
                    if node.type in ['BSDF_DIFFUSE', 'BSDF_PRINCIPLED', 'EMISSION', 'VALTORGB']:
                        print(f"    inp {inp.name}: {val_str}")
            if node.type == 'VALTORGB':
                print(f"    Ramp interpolation: {node.color_ramp.interpolation}")
                for i, el in enumerate(node.color_ramp.elements):
                    print(f"      el {i}: pos={el.position:.3f}, color={tuple(round(c, 3) for c in el.color)}")
