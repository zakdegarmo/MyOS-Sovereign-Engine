import bpy
import bmesh
import mathutils
import math
import os

SRC_BLEND = os.path.abspath('mannequin_chibi_basic_rigged_30fps.blend')
TARGET_BLEND = os.path.abspath('mannequin_decivoxel_flesh_studio.blend')

REF_FRONT = os.path.abspath('artifacts/lpc_reference/full_south.png')
REF_SIDE  = os.path.abspath('artifacts/lpc_reference/full_west.png')
REF_BACK  = os.path.abspath('artifacts/lpc_reference/full_north.png')
FACE_TEX  = os.path.abspath('assets/textures/lpc/lpc_face_neutral.png')

print(f'Loading pristine rig from {SRC_BLEND}')
bpy.ops.wm.open_mainfile(filepath=SRC_BLEND)

# Hide unnecessary props
for p in ['Modular_1H_Sword', 'Modular_2H_Staff', 'Modular_Knight_Cape', 
          'Modular_Mage_Hat', 'Modular_Round_Shield', 'Chibi_Face_Decal']:
    if p in bpy.data.objects:
        bpy.data.objects[p].hide_viewport = True
        bpy.data.objects[p].hide_render = True

old_man = bpy.data.objects.get('Mannequin')
if old_man:
    old_man.hide_viewport = True
    old_man.hide_render = True

arm = bpy.data.objects['Armature']
arm.location = (0, 0, 0)
arm.rotation_euler = (0, 0, 0)
arm.scale = (1, 1, 1)
arm.animation_data.action = None

# Collection for Decivoxel primitives
coll_name = 'Decivoxel_Flesh'
if coll_name in bpy.data.collections:
    flesh_coll = bpy.data.collections[coll_name]
    for o in list(flesh_coll.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    flesh_coll = bpy.data.collections.new(coll_name)
    bpy.context.scene.collection.children.link(flesh_coll)

pieces = []

def make_sphere(name, loc, rx, ry, rz):
    mesh = bpy.data.meshes.new(name + '_mesh')
    obj = bpy.data.objects.new(name, mesh)
    flesh_coll.objects.link(obj)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=1.0)
    bm.to_mesh(mesh)
    bm.free()
    obj.location = loc
    obj.scale = (rx, ry, rz)
    pieces.append(obj)
    return obj

def make_capsule(name, p1, p2, r1, r2):
    mesh = bpy.data.meshes.new(name + '_mesh')
    obj = bpy.data.objects.new(name, mesh)
    flesh_coll.objects.link(obj)
    bm = bmesh.new()
    delta = p2 - p1
    length = delta.length
    rot = delta.to_track_quat('Z', 'Y').to_euler()
    mid = (p1 + p2) / 2
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=20, radius1=r1, radius2=r2, depth=length)
    bm.to_mesh(mesh)
    bm.free()
    obj.location = mid
    obj.rotation_euler = rot
    pieces.append(obj)
    return obj

def make_box(name, loc, sx, sy, sz):
    mesh = bpy.data.meshes.new(name + '_mesh')
    obj = bpy.data.objects.new(name, mesh)
    flesh_coll.objects.link(obj)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bm.to_mesh(mesh)
    bm.free()
    obj.location = loc
    obj.scale = (sx, sy, sz)
    pieces.append(obj)
    return obj

# -------------------------------------------------------------------------
# CALIBRATED LPC CHIBI ANATOMY (Decivoxels)
# -------------------------------------------------------------------------
# 1. Head & Ears: Wide rounded chibi skull, thick depth
make_sphere('Head', loc=(0.0, 0.01, 1.04), rx=0.29, ry=0.26, rz=0.24)
for side, sign in [('L', 1), ('R', -1)]:
    make_sphere(f'Ear_{side}', loc=(sign * 0.28, 0.01, 1.03), rx=0.045, ry=0.075, rz=0.085)

# 2. Neck: Stout cylinder penetrating into chin and chest
make_capsule('Neck', mathutils.Vector((0.0, 0.01, 0.78)), mathutils.Vector((0.0, 0.01, 0.90)), 0.11, 0.11)

# 3. Torso: Chest, Waist, Hips
make_sphere('Chest', loc=(0.0, 0.01, 0.77), rx=0.21, ry=0.17, rz=0.13)
make_sphere('Waist', loc=(0.0, 0.00, 0.67), rx=0.19, ry=0.15, rz=0.11)
make_sphere('Hips',  loc=(0.0, 0.00, 0.57), rx=0.20, ry=0.15, rz=0.12)

# 4. Arms & Fists
for side, sign in [('L', 1), ('R', -1)]:
    sh_loc = mathutils.Vector((sign * 0.22, 0.01, 0.81))
    el_loc = mathutils.Vector((sign * 0.28, 0.03, 0.65))
    wr_loc = mathutils.Vector((sign * 0.30, 0.02, 0.50))
    
    make_sphere(f'Shoulder_{side}', sh_loc, 0.115, 0.115, 0.115)
    make_capsule(f'Bicep_{side}', sh_loc, el_loc, 0.100, 0.092)
    make_sphere(f'Elbow_{side}', el_loc, 0.095, 0.095, 0.095)
    make_capsule(f'Forearm_{side}', el_loc, wr_loc, 0.092, 0.088)
    make_sphere(f'Fist_{side}', wr_loc, 0.105, 0.110, 0.100)

# 5. Legs & Boots
for side, sign in [('L', 1), ('R', -1)]:
    hip_loc = mathutils.Vector((sign * 0.13, 0.00, 0.57))
    kn_loc  = mathutils.Vector((sign * 0.16, 0.04, 0.36))
    ank_loc = mathutils.Vector((sign * 0.17, -0.01, 0.14))
    
    make_sphere(f'HipJoint_{side}', hip_loc, 0.125, 0.125, 0.125)
    make_capsule(f'Thigh_{side}', hip_loc, kn_loc, 0.130, 0.120)
    make_sphere(f'Knee_{side}', kn_loc, 0.118, 0.118, 0.118)
    make_capsule(f'Calf_{side}', kn_loc, ank_loc, 0.118, 0.108)
    make_sphere(f'Ankle_{side}', ank_loc, 0.108, 0.108, 0.108)
    
    # Boots resting flat on the ground
    make_box(f'Boot_{side}', loc=(sign * 0.17, 0.05, 0.055), sx=0.16, sy=0.32, sz=0.11)

print(f'Constructed {len(pieces)} overlapping decivoxels!')

# Fuse all pieces
bpy.ops.object.select_all(action='DESELECT')
for p in pieces:
    p.select_set(True)
bpy.context.view_layer.objects.active = pieces[0]
bpy.ops.object.join()

fused = bpy.context.view_layer.objects.active
fused.name = 'LPC_Decivoxel_Flesh_Fused'

# Voxel remesh at 0.016m (1.6cm) grid
fused.data.remesh_voxel_size = 0.016
fused.data.remesh_voxel_adaptivity = 0.0
bpy.ops.object.voxel_remesh()

# Gentle decimate to ~35k faces
dec_mod = fused.modifiers.new(name='Decimate', type='DECIMATE')
dec_mod.ratio = 0.18
bpy.ops.object.modifier_apply(modifier='Decimate')

for f in fused.data.polygons:
    f.use_smooth = True

smooth_mod = fused.modifiers.new(name='Flesh_Smooth', type='SMOOTH')
smooth_mod.factor = 0.4
smooth_mod.iterations = 2

# -------------------------------------------------------------------------
# SHADERS: 100% MATTE 3-TIER CEL SHADER PALETTE
# -------------------------------------------------------------------------
def make_cel_mat(name, col_highlight, col_base, col_shadow):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfDiffuse')
    bsdf.inputs['Color'].default_value = (col_base[0], col_base[1], col_base[2], 1.0)
    bsdf.inputs['Roughness'].default_value = 1.0

    s2rgb = nodes.new('ShaderNodeShaderToRGB')
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'

    # 3-tier stepped cel lighting
    r_elems = ramp.color_ramp.elements
    r_elems[0].position = 0.0
    r_elems[0].color = (col_shadow[0], col_shadow[1], col_shadow[2], 1.0)
    r_elems[1].position = 0.32
    r_elems[1].color = (col_base[0], col_base[1], col_base[2], 1.0)
    
    e2 = r_elems.new(0.68)
    e2.color = (col_highlight[0], col_highlight[1], col_highlight[2], 1.0)

    links.new(bsdf.outputs['BSDF'], s2rgb.inputs['Shader'])
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], out.inputs['Surface'])
    return mat

# 1. Skin: Authentic LPC Peach Palette
mat_skin = make_cel_mat(
    'LPC_Skin_Cel',
    col_highlight=(0.98, 0.92, 0.88),  # #faece7
    col_base=(0.95, 0.80, 0.68),       # #f9d5ba
    col_shadow=(0.78, 0.50, 0.38)      # #cc8665 / #e4a47c
)

# 2. Underwear: Sporty Dark Slate Briefs
mat_underwear = make_cel_mat(
    'LPC_Underwear_Cel',
    col_highlight=(0.35, 0.36, 0.42),
    col_base=(0.22, 0.23, 0.28),
    col_shadow=(0.12, 0.13, 0.16)
)

# 3. Boots: Classic Adventurer Leather Brown
mat_boots = make_cel_mat(
    'LPC_Boots_Cel',
    col_highlight=(0.58, 0.38, 0.24),
    col_base=(0.42, 0.25, 0.15),
    col_shadow=(0.25, 0.14, 0.08)
)

fused.data.materials.append(mat_skin)       # Slot 0
fused.data.materials.append(mat_underwear)  # Slot 1
fused.data.materials.append(mat_boots)      # Slot 2

# Assign material slots by Z-height and position
for poly in fused.data.polygons:
    # Compute polygon center Z
    center = mathutils.Vector((0,0,0))
    for v_idx in poly.vertices:
        center += fused.data.vertices[v_idx].co
    center /= len(poly.vertices)
    
    # Boots: Z < 0.12m
    if center.z < 0.12:
        poly.material_index = 2
    # Underwear: Z in [0.50, 0.63] and within hip spread (|X| < 0.22, |Y| < 0.18)
    elif 0.50 <= center.z <= 0.63 and abs(center.x) < 0.22 and abs(center.y) < 0.18:
        poly.material_index = 1
    else:
        poly.material_index = 0

print('Assigned materials: Skin, Underwear, Boots!')

# -------------------------------------------------------------------------
# UPDATE ARMATURE SKELETON & ZERO POSE TRANSFORMS
# -------------------------------------------------------------------------
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones

eb['Hips'].head = (0.0, 0.0, 0.57)
eb['Hips'].tail = (0.0, 0.0, 0.67)
eb['Spine'].head = (0.0, 0.0, 0.67)
eb['Spine'].tail = (0.0, 0.01, 0.77)
eb['Spine01'].head = (0.0, 0.01, 0.77)
eb['Spine01'].tail = (0.0, 0.01, 0.84)
eb['neck'].head = (0.0, 0.01, 0.84)
eb['neck'].tail = (0.0, 0.01, 0.90)
eb['Head'].head = (0.0, 0.01, 0.90)
eb['Head'].tail = (0.0, 0.01, 1.28)

for side, sign in [('Left', 1), ('Right', -1)]:
    eb[f'{side}Shoulder'].head = (sign * 0.05, 0.01, 0.80)
    eb[f'{side}Shoulder'].tail = (sign * 0.22, 0.01, 0.81)
    eb[f'{side}Arm'].head = (sign * 0.22, 0.01, 0.81)
    eb[f'{side}Arm'].tail = (sign * 0.28, 0.03, 0.65)
    eb[f'{side}ForeArm'].head = (sign * 0.28, 0.03, 0.65)
    eb[f'{side}ForeArm'].tail = (sign * 0.30, 0.02, 0.50)
    eb[f'{side}Hand'].head = (sign * 0.30, 0.02, 0.50)
    eb[f'{side}Hand'].tail = (sign * 0.30, 0.02, 0.38)
    
    eb[f'{side}UpLeg'].head = (sign * 0.13, 0.0, 0.57)
    eb[f'{side}UpLeg'].tail = (sign * 0.16, 0.04, 0.36)
    eb[f'{side}Leg'].head = (sign * 0.16, 0.04, 0.36)
    eb[f'{side}Leg'].tail = (sign * 0.17, -0.01, 0.14)
    eb[f'{side}Foot'].head = (sign * 0.17, -0.01, 0.14)
    eb[f'{side}Foot'].tail = (sign * 0.17, 0.16, 0.02)

bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.select_all(action='SELECT')
bpy.ops.pose.transforms_clear()
bpy.ops.object.mode_set(mode='OBJECT')

# Bind Armature to fused body with Automatic Weights
bpy.ops.object.select_all(action='DESELECT')
fused.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print('Bound Armature to Decivoxel Flesh with automatic weights!')

# -------------------------------------------------------------------------
# CURVED LPC FACE DECAL (Big Anime Eyes, Brows, Cheeks, Mouth)
# -------------------------------------------------------------------------
def create_curved_decal(width=0.42, height=0.36, curve_y=0.045, y_pos=-0.252, z_pos=1.04):
    mesh = bpy.data.meshes.new('Face_Decal_Mesh')
    obj = bpy.data.objects.new('LPC_Face_Decal', mesh)
    bpy.context.scene.collection.objects.link(obj)
    
    bm = bmesh.new()
    cols = 8
    rows = 6
    verts = []
    for r in range(rows + 1):
        v_coord = r / rows
        z = z_pos - height/2 + v_coord * height
        row_verts = []
        for c in range(cols + 1):
            u_coord = c / cols
            x = -width/2 + u_coord * width
            nx = (u_coord - 0.5) * 2
            y = y_pos + (nx**2) * curve_y
            row_verts.append(bm.verts.new((x, y, z)))
        verts.append(row_verts)
    
    bm.verts.ensure_lookup_table()
    for r in range(rows):
        for c in range(cols):
            bm.faces.new([verts[r][c], verts[r][c+1], verts[r+1][c+1], verts[r+1][c]])
    
    bm.to_mesh(mesh)
    bm.free()
    
    mesh.uv_layers.new(name='UVMap')
    uv_layer = mesh.uv_layers.active.data
    for poly in mesh.polygons:
        for loop_idx in poly.loop_indices:
            v_idx = mesh.loops[loop_idx].vertex_index
            r = v_idx // (cols + 1)
            c = v_idx % (cols + 1)
            uv_layer[loop_idx].uv = (c / cols, r / rows)
            
    mat = bpy.data.materials.new(name='LPC_Face_Mat')
    mat.use_nodes = True
    mat.blend_method = 'BLEND'
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    out = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 1.0
    
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(FACE_TEX, check_existing=True)
    tex.interpolation = 'Linear'
    
    links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(tex.outputs['Color'], bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = 0.25
    links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    
    mesh.materials.append(mat)
    
    # Parent to Head bone
    obj.parent = arm
    obj.parent_type = 'BONE'
    obj.parent_bone = 'Head'
    return obj

face_decal = create_curved_decal()
print('Attached curved LPC face decal!')

# -------------------------------------------------------------------------
# STUDIO SETUP & REFERENCE BILLBOARDS
# -------------------------------------------------------------------------
ref_coll_name = 'LPC_References'
if ref_coll_name in bpy.data.collections:
    ref_coll = bpy.data.collections[ref_coll_name]
    for o in list(ref_coll.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    ref_coll = bpy.data.collections.new(ref_coll_name)
    bpy.context.scene.collection.children.link(ref_coll)

TILE_SIZE = 1.784
CENTER_Z = 0.808

def create_billboard(name, img_path, location, rotation_euler=(0,0,0), opacity=1.0, emission=0.8):
    mesh = bpy.data.meshes.new(name + '_Mesh')
    obj = bpy.data.objects.new(name, mesh)
    ref_coll.objects.link(obj)

    hw = TILE_SIZE / 2
    hh = TILE_SIZE / 2
    verts = [(-hw, 0, -hh), (hw, 0, -hh), (hw, 0, hh), (-hw, 0, hh)]
    faces = [(0, 1, 2, 3)]
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    mesh.uv_layers.new(name='UVMap')
    uv_layer = mesh.uv_layers.active.data
    uvs = [(0, 0), (1, 0), (1, 1), (0, 1)]
    for i, loop in enumerate(mesh.loops):
        uv_layer[i].uv = uvs[i]

    mat = bpy.data.materials.new(name=name + '_Mat')
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

bb_side = create_billboard('LPC_SideBySide_Front', REF_FRONT, location=(0.85, 0.0, CENTER_Z), opacity=1.0)
bb_over = create_billboard('LPC_DirectOverlay_Front', REF_FRONT, location=(0.0, 0.05, CENTER_Z), opacity=0.45)
bb_west = create_billboard('LPC_SideBySide_West', REF_SIDE, location=(0.0, 0.85, CENTER_Z), rotation_euler=(0, 0, math.radians(-90)), opacity=1.0)

# Save studio blend
bpy.ops.wm.save_as_mainfile(filepath=TARGET_BLEND)
print(f'Saved studio blend -> {TARGET_BLEND}')

# -------------------------------------------------------------------------
# RENDER MULTI-ANGLE VERIFICATION SUITE
# -------------------------------------------------------------------------
cam = bpy.data.objects['RenderCam']
for c in list(cam.constraints):
    cam.constraints.remove(c)
if cam.parent:
    cam.parent = None

bpy.context.scene.render.image_settings.file_format = 'PNG'

# 1. Front Side-by-Side Orthographic
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.1
cam.location = (0.425, -3.5, 0.72)
cam.rotation_euler = (math.radians(90), 0, 0)
bpy.context.scene.render.filepath = os.path.abspath('artifacts/verification/decivoxel_side_by_side.png')
bpy.ops.render.render(write_still=True)
print('Rendered: decivoxel_side_by_side.png')

# 2. 3/4 Perspective View
cam.data.type = 'PERSP'
cam.location = (1.4, -2.4, 1.25)
cam.rotation_euler = (math.radians(72), 0, math.radians(30))
bpy.context.scene.render.filepath = os.path.abspath('artifacts/verification/decivoxel_persp_3d.png')
bpy.ops.render.render(write_still=True)
print('Rendered: decivoxel_persp_3d.png')

# 3. Close-up Face & Torso View
cam.data.type = 'PERSP'
cam.location = (0.6, -1.3, 1.02)
cam.rotation_euler = (math.radians(82), 0, math.radians(24))
bpy.context.scene.render.filepath = os.path.abspath('artifacts/verification/decivoxel_face_closeup.png')
bpy.ops.render.render(write_still=True)
print('Rendered: decivoxel_face_closeup.png')

# 4. Side Profile Orthographic (East to West)
bpy.data.objects['LPC_DirectOverlay_Front'].hide_render = True
bpy.data.objects['LPC_SideBySide_Front'].hide_render = True
bpy.data.objects['LPC_SideBySide_West'].hide_render = False

cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.1
cam.location = (3.5, 0.425, 0.72)
cam.rotation_euler = (math.radians(90), 0, math.radians(90))
bpy.context.scene.render.filepath = os.path.abspath('artifacts/verification/decivoxel_side_profile.png')
bpy.ops.render.render(write_still=True)
print('Rendered: decivoxel_side_profile.png')
