import bpy
import os
import math

SRC_BLEND = os.path.abspath("mannequin_chibi_basic_rigged_30fps.blend")
TARGET_BLEND = os.path.abspath("mannequin_lpc_tuning_studio.blend")

REF_FRONT = os.path.abspath("artifacts/lpc_reference/full_south.png")
REF_SIDE  = os.path.abspath("artifacts/lpc_reference/full_west.png")
REF_BACK  = os.path.abspath("artifacts/lpc_reference/full_north.png")
REF_STRIP = os.path.abspath("artifacts/lpc_reference/full_lpc_mannequin_4way.png")

print(f"Loading base mannequin from: {SRC_BLEND}")
bpy.ops.wm.open_mainfile(filepath=SRC_BLEND)

# 1. Hide optional gear
props_to_hide = [
    'Modular_1H_Sword', 'Modular_2H_Staff', 'Modular_Knight_Cape', 
    'Modular_Mage_Hat', 'Modular_Round_Shield'
]
for p_name in props_to_hide:
    if p_name in bpy.data.objects:
        obj = bpy.data.objects[p_name]
        obj.hide_viewport = True
        obj.hide_render = True

# 2. Reference collection
ref_coll_name = "LPC_References"
if ref_coll_name in bpy.data.collections:
    ref_coll = bpy.data.collections[ref_coll_name]
else:
    ref_coll = bpy.data.collections.new(ref_coll_name)
    bpy.context.scene.collection.children.link(ref_coll)

for obj in list(ref_coll.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

TILE_SIZE = 1.784
CENTER_Z = 0.808

def create_vertical_plane(name, image_path, width, height, location, rotation_euler=(0,0,0), opacity=0.75, emission=0.5):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    ref_coll.objects.link(obj)

    hw = width / 2
    hh = height / 2
    verts = [(-hw, 0, -hh), (hw, 0, -hh), (hw, 0, hh), (-hw, 0, hh)]
    faces = [(0, 1, 2, 3)]
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    mesh.uv_layers.new(name="UVMap")
    uv_layer = mesh.uv_layers.active.data
    uvs = [(0, 0), (1, 0), (1, 1), (0, 1)]
    for i, loop in enumerate(mesh.loops):
        uv_layer[i].uv = uvs[i]

    mat = bpy.data.materials.new(name=name + "_Mat")
    mat.use_nodes = True
    mat.blend_method = 'BLEND'
    
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    node_tex = nodes.new(type='ShaderNodeTexImage')
    node_tex.image = bpy.data.images.load(image_path, check_existing=True)
    node_tex.interpolation = 'Closest'

    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.inputs['Roughness'].default_value = 1.0
    node_out = nodes.new(type='ShaderNodeOutputMaterial')

    links.new(node_tex.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_tex.outputs['Color'], node_bsdf.inputs['Emission Color'])
    node_bsdf.inputs['Emission Strength'].default_value = emission
    
    # Connect alpha with opacity multiplier
    if opacity < 1.0:
        math_node = nodes.new(type='ShaderNodeMath')
        math_node.operation = 'MULTIPLY'
        math_node.inputs[1].default_value = opacity
        links.new(node_tex.outputs['Alpha'], math_node.inputs[0])
        links.new(math_node.outputs['Value'], node_bsdf.inputs['Alpha'])
    else:
        links.new(node_tex.outputs['Alpha'], node_bsdf.inputs['Alpha'])

    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    mesh.materials.append(mat)
    obj.location = location
    obj.rotation_euler = rotation_euler
    return obj

# A. Front Reference Billboard (South) directly behind the Mannequin at X=0, Y=0.08m
create_vertical_plane(
    name="LPC_Ref_Front_DirectOverlay",
    image_path=REF_FRONT,
    width=TILE_SIZE,
    height=TILE_SIZE,
    location=(0.0, 0.08, CENTER_Z),
    rotation_euler=(0, 0, 0),
    opacity=0.70
)

# B. Side Reference Billboard (West Profile) at X=0, Y=0, turned 90 deg
create_vertical_plane(
    name="LPC_Ref_Side_Profile",
    image_path=REF_SIDE,
    width=TILE_SIZE,
    height=TILE_SIZE,
    location=(0.0, 0.08, CENTER_Z),
    rotation_euler=(0, 0, math.radians(-90)),
    opacity=0.70
)

# C. Back Reference Billboard (North) at X=0, Y=-0.08m
create_vertical_plane(
    name="LPC_Ref_Back_View",
    image_path=REF_BACK,
    width=TILE_SIZE,
    height=TILE_SIZE,
    location=(0.0, -0.08, CENTER_Z),
    rotation_euler=(0, 0, math.radians(180)),
    opacity=0.70
)

# D. Standalone Side-by-Side Standee to the Left (X = -1.1m) - Clean 1:1 comparison!
create_vertical_plane(
    name="LPC_SideBySide_Front",
    image_path=REF_FRONT,
    width=TILE_SIZE,
    height=TILE_SIZE,
    location=(-1.1, 0.0, CENTER_Z),
    rotation_euler=(0, 0, 0),
    opacity=1.0,
    emission=0.7
)

# E. 4-Way Strip Standee further back/left (X = -2.5m, Y = 0.5m)
create_vertical_plane(
    name="LPC_4Way_Strip_Overview",
    image_path=REF_STRIP,
    width=TILE_SIZE * 4,
    height=TILE_SIZE,
    location=(-3.0, 0.5, CENTER_Z),
    rotation_euler=(0, 0, 0),
    opacity=0.9,
    emission=0.5
)

# Setup RenderCam
if 'RenderCam' in bpy.data.objects:
    cam = bpy.data.objects['RenderCam']
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 2.4
    cam.location = (-0.55, -3.5, 0.75)
    cam.rotation_euler = (math.radians(90), 0, 0)

bpy.ops.wm.save_as_mainfile(filepath=TARGET_BLEND)
print(f"SUCCESS: Saved pristine tuning studio -> {TARGET_BLEND}")
