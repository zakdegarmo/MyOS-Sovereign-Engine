import bpy

for o in bpy.data.objects:
    if o.type == 'LIGHT':
        print(f'Light {o.name}: energy={o.data.energy}, color={list(o.data.color)}, loc={o.location}')
