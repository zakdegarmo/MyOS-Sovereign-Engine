import bpy

man = bpy.data.objects['Mannequin']
for m in man.modifiers:
    print(f'Modifier {m.name} ({m.type}):')
    for prop in ['object', 'use_vertex_groups', 'use_bone_envelopes', 'use_deform_preserve_volume']:
        if hasattr(m, prop):
            print(f'  {prop}: {getattr(m, prop)}')
