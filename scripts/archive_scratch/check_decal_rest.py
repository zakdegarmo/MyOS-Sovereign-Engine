import bpy

arm = bpy.data.objects['Armature']
decal = bpy.data.objects.get('Chibi_Face_Decal')

arm.data.pose_position = 'REST'
bpy.context.view_layer.update()

depsgraph = bpy.context.evaluated_depsgraph_get()
decal_eval = decal.evaluated_get(depsgraph)

print('Decal matrix_world in REST pose:\n', decal_eval.matrix_world)
mw = decal_eval.matrix_world
zs = [(mw @ v.co).z for v in decal.data.vertices]
ys = [(mw @ v.co).y for v in decal.data.vertices]
xs = [(mw @ v.co).x for v in decal.data.vertices]
print(f'Decal evaluated X: [{min(xs):.3f}, {max(xs):.3f}], Y: [{min(ys):.3f}, {max(ys):.3f}], Z: [{min(zs):.3f}, {max(zs):.3f}]')
