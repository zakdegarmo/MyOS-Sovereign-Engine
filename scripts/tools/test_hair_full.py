import bpy, os, math

blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_base_comic.blend"
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))

hair_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\hair"
clothes_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\clothes"

body = bpy.data.objects['LPC_Decivoxel_Flesh_Fused']
arm = bpy.data.objects['Armature']

# Outline mat
mat_outline = bpy.data.materials.get('LPC_Outline_Mat')

def make_cel_mat(name, stops):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
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

# Import short01 with full back of head coverage
hair_path = os.path.join(hair_dir, "short01", "short01.obj")
bpy.ops.wm.obj_import(filepath=hair_path)
h_obj = bpy.context.selected_objects[0]
h_obj.name = "Larry_Hair_Full"
h_obj.rotation_euler[0] = math.radians(90)
bpy.ops.object.transform_apply(rotation=True)

xs = [v.co.x for v in h_obj.data.vertices]
ys = [v.co.y for v in h_obj.data.vertices]
zs = [v.co.z for v in h_obj.data.vertices]
w_orig = max(xs) - min(xs)
d_orig = max(ys) - min(ys)
h_orig = max(zs) - min(zs)

# Head bounds: width 0.508, depth 0.457, top 1.259
scale_x = 0.530 / w_orig
scale_y = 0.490 / d_orig
scale_z = scale_x

cx = (max(xs) + min(xs)) / 2.0
cy = (max(ys) + min(ys)) / 2.0
z_max = max(zs)

for v in h_obj.data.vertices:
    v.co.x = (v.co.x - cx) * scale_x
    v.co.y = (v.co.y - cy) * scale_y - 0.010
    v.co.z = 1.285 + (v.co.z - z_max) * scale_z * 0.96
h_obj.data.update()

h_obj.data.materials.clear()
h_obj.data.materials.append(mat_hair)
if mat_outline:
    h_obj.data.materials.append(mat_outline)
    mod = h_obj.modifiers.new('Outline', 'SOLIDIFY')
    mod.thickness = -0.005
    mod.material_offset = 1
    mod.use_flip_normals = True

h_obj.parent = arm
h_mod = h_obj.modifiers.new('Armature', 'ARMATURE')
h_mod.object = arm
vg_h = h_obj.vertex_groups.new(name='Head')
vg_h.add(list(range(len(h_obj.data.vertices))), 1.0, 'REPLACE')

# Setup camera for front, side, and back view
cam = bpy.data.objects['RenderCam']
rot = bpy.data.objects['Cam_Rot_Empty']
tgt = bpy.data.objects['CamTarget']
rot.location = (0.0, 0.0, 1.05)
tgt.location = (0.0, 0.0, 1.05)
cam.location = (0.0, -1.20, 0.05)
cam.data.lens = 50.0

scene = bpy.context.scene
scene.render.resolution_x = 256
scene.render.resolution_y = 256
scene.render.film_transparent = True

os.makedirs('artifacts/verification', exist_ok=True)
for deg in [0, 90, 180]:
    rot.rotation_euler[2] = math.radians(deg)
    bpy.context.view_layer.update()
    scene.render.filepath = os.path.abspath(f'artifacts/verification/hair_full_{deg}.png')
    bpy.ops.render.render(write_still=True)
    print(f"Rendered hair_full_{deg}.png")
