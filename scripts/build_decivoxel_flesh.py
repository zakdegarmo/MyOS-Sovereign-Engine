import bpy
import bmesh
import mathutils
import os
import math

SRC_BLEND = os.path.abspath("mannequin_chibi_basic_rigged_30fps.blend")
TARGET_BLEND = os.path.abspath("mannequin_decivoxel_flesh_studio.blend")

REF_FRONT = os.path.abspath("artifacts/lpc_reference/full_south.png")
REF_SIDE  = os.path.abspath("artifacts/lpc_reference/full_west.png")
REF_BACK  = os.path.abspath("artifacts/lpc_reference/full_north.png")

print(f"Loading Base Rig from: {SRC_BLEND}")
bpy.ops.wm.open_mainfile(filepath=SRC_BLEND)

# Hide optional gear props
props_to_hide = [
    'Modular_1H_Sword', 'Modular_2H_Staff', 'Modular_Knight_Cape', 
    'Modular_Mage_Hat', 'Modular_Round_Shield', 'Chibi_Face_Decal'
]
for p_name in props_to_hide:
    if p_name in bpy.data.objects:
        obj = bpy.data.objects[p_name]
        obj.hide_viewport = True
        obj.hide_render = True

# Hide the old poly-mannequin
old_man = bpy.data.objects.get('Mannequin')
if old_man:
    old_man.hide_viewport = True
    old_man.hide_render = True

arm = bpy.data.objects['Armature']
arm.location = (0.0, 0.0, 0.0)
arm.rotation_euler = (0.0, 0.0, 0.0)
arm.scale = (1.0, 1.0, 1.0)

# Switch to A_TPose to initialize clean symmetric rest transforms
if arm.animation_data and 'A_TPose' in bpy.data.actions:
    arm.animation_data.action = bpy.data.actions['A_TPose']
bpy.context.view_layer.update()

# Pose Armature into the Classic LPC Idle Stance
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')

# Ensure spine is upright and centered
for b_name in ['Hips', 'Spine', 'Spine01', 'neck', 'Head']:
    if b_name in arm.pose.bones:
        arm.pose.bones[b_name].rotation_quaternion = (1.0, 0.0, 0.0, 0.0)

# Classic LPC Arms: angled out ~25 degrees, forearms slightly forward (~12 deg)
if 'LeftArm' in arm.pose.bones:
    arm.pose.bones['LeftArm'].rotation_quaternion = (0.9659, 0.0, 0.0, -0.2588)
if 'RightArm' in arm.pose.bones:
    arm.pose.bones['RightArm'].rotation_quaternion = (0.9659, 0.0, 0.0, 0.2588)
if 'LeftForeArm' in arm.pose.bones:
    arm.pose.bones['LeftForeArm'].rotation_quaternion = (0.9848, 0.1736, 0.0, 0.0)
if 'RightForeArm' in arm.pose.bones:
    arm.pose.bones['RightForeArm'].rotation_quaternion = (0.9848, 0.1736, 0.0, 0.0)

# Classic LPC Legs: Sturdy A-stance, shoulder width
if 'LeftUpLeg' in arm.pose.bones:
    arm.pose.bones['LeftUpLeg'].rotation_quaternion = (0.9962, 0.0, 0.0, -0.0872)
if 'RightUpLeg' in arm.pose.bones:
    arm.pose.bones['RightUpLeg'].rotation_quaternion = (0.9962, 0.0, 0.0, 0.0872)
if 'LeftLeg' in arm.pose.bones:
    arm.pose.bones['LeftLeg'].rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
if 'RightLeg' in arm.pose.bones:
    arm.pose.bones['RightLeg'].rotation_quaternion = (1.0, 0.0, 0.0, 0.0)

bpy.ops.object.mode_set(mode='OBJECT')
bpy.context.view_layer.update()

# -------------------------------------------------------------
# PARAMETRIC DECIVOXEL SIZES (Calibrated for Classic LPC 2.35-Head Chibi)
# -------------------------------------------------------------
PARAMS = {
    # Head & Neck (Broad chibi skull, full cheeks, deep volume)
    "head_radius_x": 0.29,  # 0.58m wide
    "head_radius_y": 0.26,  # 0.52m deep (thick in depth)
    "head_radius_z": 0.27,  # 0.54m tall
    "neck_radius": 0.10,
    "neck_height": 0.08,
    
    # Torso & Pelvis (Solid, barrel-chested, thick profile)
    "chest_width": 0.42,
    "chest_depth": 0.32,
    "chest_height": 0.24,
    "waist_width": 0.36,
    "waist_depth": 0.28,
    "hips_width": 0.38,
    "hips_depth": 0.28,
    
    # Arms & Hands (Chunky stylized limbs)
    "shoulder_r": 0.115,
    "arm_r": 0.100,
    "forearm_r": 0.095,
    "fist_r": 0.110,
    
    # Legs & Feet (Sturdy planted boots)
    "thigh_r": 0.130,
    "calf_r": 0.120,
    "foot_width": 0.160,
    "foot_length": 0.280,
    "foot_height": 0.100,
}

# Collection for volumetric decivoxels
coll_name = "Decivoxel_Flesh"
if coll_name in bpy.data.collections:
    flesh_coll = bpy.data.collections[coll_name]
else:
    flesh_coll = bpy.data.collections.new(coll_name)
    bpy.context.scene.collection.children.link(flesh_coll)

for obj in list(flesh_coll.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

created_flesh_pieces = []

def create_primitive(name, mesh_func, location=(0,0,0), scale=(1,1,1), rotation=(0,0,0)):
    mesh = bpy.data.meshes.new(name + "_mesh")
    obj = bpy.data.objects.new(name, mesh)
    flesh_coll.objects.link(obj)
    
    bm = bmesh.new()
    mesh_func(bm)
    bm.to_mesh(mesh)
    bm.free()
    
    obj.location = location
    obj.scale = scale
    obj.rotation_euler = rotation
    created_flesh_pieces.append(obj)
    return obj

def get_bone_pos(bone_name, head_tail_factor=0.5):
    if bone_name in arm.pose.bones:
        pb = arm.pose.bones[bone_name]
        h = arm.matrix_world @ pb.head
        t = arm.matrix_world @ pb.tail
        return h.lerp(t, head_tail_factor)
    return mathutils.Vector((0,0,0))

def create_bone_capsule(name, bone_name, radius, start_f=0.08, end_f=0.92):
    if bone_name not in arm.pose.bones:
        return
    pb = arm.pose.bones[bone_name]
    p1 = arm.matrix_world @ pb.head.lerp(pb.tail, start_f)
    p2 = arm.matrix_world @ pb.head.lerp(pb.tail, end_f)
    mid = (p1 + p2) / 2
    delta = p2 - p1
    length = delta.length
    if length < 0.001:
        return
    
    rot = delta.to_track_quat('Z', 'Y').to_euler()
    create_primitive(
        name,
        lambda bm: bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=20, radius1=radius, radius2=radius * 0.92, depth=length),
        location=mid,
        scale=(1, 1, 1),
        rotation=rot
    )

# 1. HEAD (Spherical/Ellipsoid LPC chibi skull)
head_pos = get_bone_pos('Head', head_tail_factor=0.52)
create_primitive(
    "Flesh_Head",
    lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=1.0),
    location=head_pos,
    scale=(PARAMS["head_radius_x"], PARAMS["head_radius_y"], PARAMS["head_radius_z"])
)

# 2. NECK
neck_pos = get_bone_pos('neck', head_tail_factor=0.5)
create_primitive(
    "Flesh_Neck",
    lambda bm: bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=16, radius1=1.0, radius2=1.0, depth=PARAMS["neck_height"]),
    location=neck_pos,
    scale=(PARAMS["neck_radius"], PARAMS["neck_radius"], 1.0)
)

# 3. CHEST / UPPER TORSO
chest_pos = get_bone_pos('Spine01', head_tail_factor=0.5)
create_primitive(
    "Flesh_Chest",
    lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=1.0),
    location=chest_pos,
    scale=(PARAMS["chest_width"]/2, PARAMS["chest_depth"]/2, PARAMS["chest_height"]/2)
)

# 4. WAIST
waist_pos = get_bone_pos('Spine', head_tail_factor=0.5)
create_primitive(
    "Flesh_Waist",
    lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=14, radius=1.0),
    location=waist_pos,
    scale=(PARAMS["waist_width"]/2, PARAMS["waist_depth"]/2, 0.12)
)

# 5. HIPS / PELVIS
hips_pos = get_bone_pos('Hips', head_tail_factor=0.4)
create_primitive(
    "Flesh_Hips",
    lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=14, radius=1.0),
    location=hips_pos,
    scale=(PARAMS["hips_width"]/2, PARAMS["hips_depth"]/2, 0.12)
)

# 6. SHOULDERS (Deltoid spheres)
for side in ['Left', 'Right']:
    sh_pos = get_bone_pos(f'{side}Shoulder', 0.85)
    create_primitive(
        f"Flesh_Deltoid_{side}",
        lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=PARAMS["shoulder_r"]),
        location=sh_pos
    )

# 7. ARMS & FOREARMS & FISTS
for side in ['Left', 'Right']:
    create_bone_capsule(f"Flesh_Arm_{side}", f"{side}Arm", PARAMS["arm_r"])
    create_bone_capsule(f"Flesh_ForeArm_{side}", f"{side}ForeArm", PARAMS["forearm_r"])
    
    # Fists at hand position
    hand_pos = get_bone_pos(f"{side}Hand", 0.65)
    create_primitive(
        f"Flesh_Fist_{side}",
        lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=PARAMS["fist_r"]),
        location=hand_pos,
        scale=(1.0, 1.05, 0.95)
    )

# 8. LEGS & FEET
for side in ['Left', 'Right']:
    create_bone_capsule(f"Flesh_Thigh_{side}", f"{side}UpLeg", PARAMS["thigh_r"])
    create_bone_capsule(f"Flesh_Calf_{side}", f"{side}Leg", PARAMS["calf_r"])
    
    # Boots / Feet placed flat on the ground plane
    foot_pos = get_bone_pos(f"{side}Foot", 0.4)
    foot_pos.z = PARAMS["foot_height"] / 2
    create_primitive(
        f"Flesh_Foot_{side}",
        lambda bm: bmesh.ops.create_cube(bm, size=1.0),
        location=foot_pos,
        scale=(PARAMS["foot_width"], PARAMS["foot_length"], PARAMS["foot_height"])
    )

print(f"Created {len(created_flesh_pieces)} decivoxel primitives!")

# -------------------------------------------------------------
# FUSE DECIVOXELS INTO ORGANIC CENTIVOXEL HULL
# -------------------------------------------------------------
bpy.ops.object.select_all(action='DESELECT')
for p in created_flesh_pieces:
    p.select_set(True)
bpy.context.view_layer.objects.active = created_flesh_pieces[0]

bpy.ops.object.join()
fused_body = bpy.context.view_layer.objects.active
fused_body.name = "LPC_Decivoxel_Flesh_Fused"

# Remesh at 0.016m (1.6cm grid)
fused_body.data.remesh_voxel_size = 0.016
fused_body.data.remesh_voxel_adaptivity = 0.0
bpy.ops.object.voxel_remesh()

for f in fused_body.data.polygons:
    f.use_smooth = True

smooth_mod = fused_body.modifiers.new(name="Flesh_Smooth", type='SMOOTH')
smooth_mod.factor = 0.4
smooth_mod.iterations = 2

# Skin Material
skin_mat = bpy.data.materials.new(name="LPC_Decivoxel_Skin_Mat")
skin_mat.use_nodes = True
nodes = skin_mat.node_tree.nodes
nodes.clear()
node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
node_bsdf.inputs['Base Color'].default_value = (0.95, 0.88, 0.82, 1.0)
node_bsdf.inputs['Roughness'].default_value = 0.55
node_out = nodes.new(type='ShaderNodeOutputMaterial')
skin_mat.node_tree.links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
fused_body.data.materials.append(skin_mat)

# Bind to Armature with modifier
arm_mod = fused_body.modifiers.new(name="Armature", type='ARMATURE')
arm_mod.object = arm

# -------------------------------------------------------------
# SETUP REFERENCE BILLBOARDS IN STUDIO
# -------------------------------------------------------------
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

def create_billboard(name, img_path, location, rotation_euler=(0,0,0), opacity=1.0, emission=0.8):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    ref_coll.objects.link(obj)

    hw = TILE_SIZE / 2
    hh = TILE_SIZE / 2
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
    
    m_nodes = mat.node_tree.nodes
    m_links = mat.node_tree.links
    m_nodes.clear()

    node_tex = m_nodes.new(type='ShaderNodeTexImage')
    node_tex.image = bpy.data.images.load(img_path, check_existing=True)
    node_tex.interpolation = 'Closest'

    node_b = m_nodes.new(type='ShaderNodeBsdfPrincipled')
    node_b.inputs['Roughness'].default_value = 1.0
    node_o = m_nodes.new(type='ShaderNodeOutputMaterial')

    m_links.new(node_tex.outputs['Color'], node_b.inputs['Base Color'])
    m_links.new(node_tex.outputs['Color'], node_b.inputs['Emission Color'])
    node_b.inputs['Emission Strength'].default_value = emission

    if opacity < 1.0:
        math_node = m_nodes.new(type='ShaderNodeMath')
        math_node.operation = 'MULTIPLY'
        math_node.inputs[1].default_value = opacity
        m_links.new(node_tex.outputs['Alpha'], math_node.inputs[0])
        m_links.new(math_node.outputs['Value'], node_b.inputs['Alpha'])
    else:
        m_links.new(node_tex.outputs['Alpha'], node_b.inputs['Alpha'])

    m_links.new(node_b.outputs['BSDF'], node_o.inputs['Surface'])
    mesh.materials.append(mat)
    obj.location = location
    obj.rotation_euler = rotation_euler
    return obj

# 1. Side-by-side Standee right next to mannequin (X = 0.95m)
create_billboard("LPC_SideBySide_Front", REF_FRONT, location=(0.95, 0.0, CENTER_Z), opacity=1.0)

# 2. Direct Overlay Standee right on top of mannequin for alignment check (X = 0.0, Y = 0.06m)
create_billboard("LPC_DirectOverlay_Front", REF_FRONT, location=(0.0, 0.06, CENTER_Z), opacity=0.5)

# 3. Side Profile Standee for West view (X = 0.0, Y = 0.95m, rotated -90 deg)
create_billboard("LPC_SideBySide_West", REF_SIDE, location=(0.0, 0.95, CENTER_Z), rotation_euler=(0, 0, math.radians(-90)), opacity=1.0)

# Save the blend file
bpy.ops.wm.save_as_mainfile(filepath=TARGET_BLEND)
print(f"SUCCESS: Saved studio blend to {TARGET_BLEND}")

# -------------------------------------------------------------
# RENDER VERIFICATION PREVIEWS
# -------------------------------------------------------------
cam = bpy.data.objects['RenderCam']
# Ensure camera has no lingering tracking constraints throwing off position
for c in list(cam.constraints):
    cam.constraints.remove(c)

# Unparent camera if parented so its world coordinates are direct
if cam.parent:
    cam.parent = None

bpy.context.scene.render.image_settings.file_format = 'PNG'

# VIEW 1: Side-By-Side Front Orthographic (Mannequin on left, LPC sprite on right)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.4
cam.location = (0.475, -3.5, 0.75)  # Centered between X=0.0 and X=0.95
cam.rotation_euler = (math.radians(90), 0, 0)
bpy.context.scene.render.filepath = os.path.abspath('artifacts/verification/decivoxel_side_by_side.png')
bpy.ops.render.render(write_still=True)
print("Rendered: decivoxel_side_by_side.png")

# VIEW 2: 3/4 Perspective View showing Volume, Depth, and Chibi Silhouettes
cam.data.type = 'PERSP'
cam.location = (1.5, -2.6, 1.3)
cam.rotation_euler = (math.radians(70), 0, math.radians(28))
bpy.context.scene.render.filepath = os.path.abspath('artifacts/verification/decivoxel_persp_3d.png')
bpy.ops.render.render(write_still=True)
print("Rendered: decivoxel_persp_3d.png")

# VIEW 3: Side Profile Orthographic (Showing Depth & Stance)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.4
cam.location = (3.5, 0.475, 0.75)  # Looking from East (+X) toward West (-X)
cam.rotation_euler = (math.radians(90), 0, math.radians(90))
bpy.context.scene.render.filepath = os.path.abspath('artifacts/verification/decivoxel_side_profile.png')
bpy.ops.render.render(write_still=True)
print("Rendered: decivoxel_side_profile.png")

