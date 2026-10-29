import bpy

print('--- OBJECTS IN SCENE ---')
for o in bpy.data.objects:
    print(f'{o.name} ({o.type}), parent={o.parent.name if o.parent else "None"}, hide_render={o.hide_render}')
    if o.type == 'MESH':
        for m in o.data.materials:
            print(f'   mat: {m.name if m else "None"}')
