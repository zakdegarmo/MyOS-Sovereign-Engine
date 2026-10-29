import bpy

face = bpy.data.objects.get('Chibi_Face_Decal')
if face:
    print("Face Decal found:", face.name, face.location)
    for m in face.data.materials:
        print("  Face mat:", m.name if m else None)
        if m and m.use_nodes:
            for n in m.node_tree.nodes:
                print(f"    node: {n.name} ({n.type})")

man = bpy.data.objects['Mannequin']
skin_mat = man.data.materials[0]
print("Skin mat:", skin_mat.name)
if skin_mat.use_nodes:
    for n in skin_mat.node_tree.nodes:
        print(f"  node: {n.name} ({n.type})")
        if n.type == 'BSDF_PRINCIPLED':
            print("    Base Color:", [round(x, 3) for x in n.inputs['Base Color'].default_value])
            print("    Roughness:", n.inputs['Roughness'].default_value)
