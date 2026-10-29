import bpy

face = bpy.data.objects.get('Chibi_Face_Decal')
if face and face.data.materials:
    mat = face.data.materials[0]
    for n in mat.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image:
            print("Face texture filepath:", n.image.filepath)
            print("Face texture name:", n.image.name)
            print("Face image size:", n.image.size[:])
