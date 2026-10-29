import bpy

decal = bpy.data.objects.get('Chibi_Face_Decal')
if decal:
    print('Decal verts count:', len(decal.data.vertices))
    mw = decal.matrix_world
    zs = [(mw @ v.co).z for v in decal.data.vertices]
    ys = [(mw @ v.co).y for v in decal.data.vertices]
    xs = [(mw @ v.co).x for v in decal.data.vertices]
    print(f'Decal X: [{min(xs):.3f}, {max(xs):.3f}], Y: [{min(ys):.3f}, {max(ys):.3f}], Z: [{min(zs):.3f}, {max(zs):.3f}]')
