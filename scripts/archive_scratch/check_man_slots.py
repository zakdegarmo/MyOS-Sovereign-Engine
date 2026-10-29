import bpy

man = bpy.data.objects['Mannequin']
print('man.material_slots:')
for s in man.material_slots:
    print('Slot:', s.name, 'mat:', s.material.name if s.material else 'None')
    if s.material:
        bsdf = s.material.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            print('   BSDF Base Color:', list(bsdf.inputs['Base Color'].default_value))
            print('   BSDF inputs links count:', len([i for i in bsdf.inputs if i.is_linked]))
            for l in s.material.node_tree.links:
                print('   Link:', l.from_node.name, '->', l.to_node.name)
