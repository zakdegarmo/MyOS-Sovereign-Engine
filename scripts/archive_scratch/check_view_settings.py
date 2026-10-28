import bpy

vs = bpy.context.scene.view_settings
print('view_transform:', vs.view_transform)
print('look:', vs.look)
print('exposure:', vs.exposure)
print('gamma:', vs.gamma)
