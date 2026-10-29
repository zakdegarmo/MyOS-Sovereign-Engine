import bpy, os, math

blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_base_comic.blend"
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))

hair_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\hair"

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.film_transparent = True
scene.render.resolution_x = 256
scene.render.resolution_y = 256

mat_outline = bpy.data.materials.get('LPC_Outline_Mat')

def make_cel_mat(name, stops):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (1.0, 1.0, 1.0, 1.0)
    diff.inputs['Roughness'].default_value = 0.0
    s2rgb = nodes.new('ShaderNodeShaderToRGB')
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    while len(ramp.color_ramp.elements) > 1:
        ramp.color_ramp.elements.remove(ramp.color_ramp.elements[-1])
    for i, (pos, col) in enumerate(stops):
        if i == 0:
            el = ramp.color_ramp.elements[0]
            el.position = pos
            el.color = (*col, 1.0)
        else:
            el = ramp.color_ramp.elements.new(pos)
            el.color = (*col, 1.0)
    emit = nodes.new('ShaderNodeEmission')
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], emit.inputs['Color'])
    links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat

mat_hair = make_cel_mat('Larry_Hair_Cel', [
    (0.00, (0.12, 0.07, 0.04)),
    (0.32, (0.24, 0.15, 0.09)),
    (0.48, (0.38, 0.25, 0.16)),
    (0.85, (0.55, 0.38, 0.26))
])

cam = bpy.data.objects['RenderCam']
rot = bpy.data.objects['Cam_Rot_Empty']
tgt = bpy.data.objects['CamTarget']
rot.location = (0.0, 0.0, 1.05)
tgt.location = (0.0, 0.0, 1.05)
cam.location = (0.0, -1.20, 0.05)
cam.data.lens = 50.0

hair_path = os.path.join(hair_dir, "short03", "short03.obj")
bpy.ops.wm.obj_import(filepath=hair_path)
h_obj = bpy.context.selected_objects[0]
h_obj.name = "Test_short03"
h_obj.rotation_euler[0] = math.radians(90)
bpy.ops.object.transform_apply(rotation=True)

zs = [v.co.z for v in h_obj.data.vertices]
ys = [v.co.y for v in h_obj.data.vertices]
xs = [v.co.x for v in h_obj.data.vertices]
w_orig = max(xs) - min(xs)
scale_factor = 0.525 / w_orig
cx_orig = (max(xs) + min(xs)) / 2.0
cy_orig = (max(ys) + min(ys)) / 2.0
z_max_orig = max(zs)

for v in h_obj.data.vertices:
    v.co.x = (v.co.x - cx_orig) * scale_factor
    v.co.y = (v.co.y - cy_orig) * scale_factor * 1.05 - 0.015
    v.co.z = 1.285 + (v.co.z - z_max_orig) * scale_factor * 0.95
h_obj.data.update()

h_obj.data.materials.clear()
h_obj.data.materials.append(mat_hair)
if mat_outline:
    h_obj.data.materials.append(mat_outline)
    mod_solid = h_obj.modifiers.new('Outline', 'SOLIDIFY')
    mod_solid.thickness = -0.005
    mod_solid.material_offset = 1
    mod_solid.use_flip_normals = True

rot.rotation_euler[2] = math.radians(0)
bpy.context.view_layer.update()
scene.render.filepath = os.path.abspath('artifacts/verification/portrait_short03_0.png')
bpy.ops.render.render(write_still=True)

rot.rotation_euler[2] = math.radians(45)
bpy.context.view_layer.update()
scene.render.filepath = os.path.abspath('artifacts/verification/portrait_short03_45.png')
bpy.ops.render.render(write_still=True)
print("Rendered short03!")
