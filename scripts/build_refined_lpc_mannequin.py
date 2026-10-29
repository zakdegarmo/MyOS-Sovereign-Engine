import bpy
import bmesh
import mathutils
import math
import os

TARGET_BLEND = os.path.abspath('mannequin_decivoxel_flesh_studio.blend')
FACE_TEX_PATH = os.path.abspath('assets/textures/lpc/lpc_face_authentic_pixel.png')
REF_FRONT = os.path.abspath('artifacts/lpc_reference/full_south.png')
REF_SIDE  = os.path.abspath('artifacts/lpc_reference/full_west.png')

# -----------------------------------------------------------------------------
# 1. OPEN STUDIO AND PREPARE SCENE
# -----------------------------------------------------------------------------
SRC_BLEND = os.path.abspath('mannequin_chibi_basic_rigged_30fps.blend')
bpy.ops.wm.open_mainfile(filepath=SRC_BLEND)

for p in ['Modular_1H_Sword', 'Modular_2H_Staff', 'Modular_Knight_Cape', 
          'Modular_Mage_Hat', 'Modular_Round_Shield', 'Chibi_Face_Decal', 'Mannequin']:
    if p in bpy.data.objects:
        bpy.data.objects[p].hide_viewport = True
        bpy.data.objects[p].hide_render = True

arm = bpy.data.objects['Armature']
arm.location = (0, 0, 0)
arm.rotation_euler = (0, 0, 0)
arm.scale = (1, 1, 1)
arm.animation_data.action = None

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
    bmesh.ops.create_uvsphere(bm, u_segments=28, v_segments=20, radius=1.0)
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
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=24, radius1=r1, radius2=r2, depth=length)
    bm.to_mesh(mesh)
    bm.free()
    obj.location = mid
    obj.rotation_euler = rot
    pieces.append(obj)
    return obj

# -----------------------------------------------------------------------------
# 2. CALIBRATED ORGANIC DECIVOXELS (Facing FORWARD towards -Y)
# -----------------------------------------------------------------------------
# HEAD:
# Upper Cranium
make_sphere('Cranium', loc=(0.0, 0.00, 1.04), rx=0.25, ry=0.23, rz=0.22)
# Lower Face & Jaw (front taper towards -Y)
make_sphere('LowerFace', loc=(0.0, -0.02, 0.95), rx=0.215, ry=0.205, rz=0.16)
# Rounded Chin (forward at -Y)
make_sphere('Chin', loc=(0.0, -0.05, 0.865), rx=0.13, ry=0.13, rz=0.08)
# Ears flush at eye line
for side, sign in [('L', 1), ('R', -1)]:
    make_sphere(f'Ear_{side}', loc=(sign * 0.235, 0.00, 0.965), rx=0.02, ry=0.042, rz=0.052)

# NECK: Stout connector
make_capsule('Neck', mathutils.Vector((0.0, 0.00, 0.72)), mathutils.Vector((0.0, 0.00, 0.90)), 0.09, 0.09)

# TORSO:
# Central Core
make_capsule('Torso_Core', mathutils.Vector((0.0, 0.0, 0.48)), mathutils.Vector((0.0, 0.0, 0.76)), 0.16, 0.17)
# Pectorals: Forward on FRONT (-Y)
make_sphere('Chest_Mass', loc=(0.0, -0.06, 0.70), rx=0.18, ry=0.14, rz=0.10)
# Spine / Back: BACK (+Y)
make_sphere('Back_Mass', loc=(0.0, 0.05, 0.68), rx=0.16, ry=0.12, rz=0.10)
# Abdomen & Waist
make_sphere('Waist_Mass', loc=(0.0, -0.02, 0.59), rx=0.16, ry=0.15, rz=0.09)
# Solid Pelvis & Glutes (glutes bulge back towards +Y)
make_sphere('Pelvis_Mass', loc=(0.0, 0.00, 0.49), rx=0.17, ry=0.16, rz=0.10)
make_sphere('Glutes_Mass', loc=(0.0, 0.06, 0.49), rx=0.16, ry=0.12, rz=0.09)

# SHOULDERS & ARMS: Elbows bend back (+Y), fists at front/sides (-Y)
for side, sign in [('L', 1), ('R', -1)]:
    sh_loc = mathutils.Vector((sign * 0.16, 0.00, 0.72))
    el_loc = mathutils.Vector((sign * 0.18, 0.03, 0.56))  # Elbow slightly back (+Y)
    wr_loc = mathutils.Vector((sign * 0.19, 0.00, 0.40))
    fist_loc = mathutils.Vector((sign * 0.19, -0.02, 0.33)) # Fist slightly forward (-Y)
    
    make_sphere(f'Shoulder_{side}', sh_loc, 0.065, 0.065, 0.065)
    make_capsule(f'Bicep_{side}', sh_loc, el_loc, 0.058, 0.050)
    make_sphere(f'Elbow_{side}', el_loc, 0.050, 0.050, 0.050)
    make_capsule(f'Forearm_{side}', el_loc, wr_loc, 0.050, 0.046)
    make_sphere(f'Wrist_{side}', wr_loc, 0.046, 0.046, 0.046)
    make_sphere(f'Fist_{side}', fist_loc, rx=0.055, ry=0.065, rz=0.060)

# LEGS: Knees forward (-Y), calf back (+Y), heels back (+Y), TOES FORWARD (-Y)!
for side, sign in [('L', 1), ('R', -1)]:
    hip_loc = mathutils.Vector((sign * 0.085, 0.00, 0.48))
    kn_loc  = mathutils.Vector((sign * 0.095, -0.025, 0.28)) # Knee points FORWARD (-Y)
    ank_loc = mathutils.Vector((sign * 0.100, 0.010, 0.11))  # Ankle slightly back (+Y)
    
    make_sphere(f'Hip_{side}', hip_loc, 0.072, 0.072, 0.072)
    make_capsule(f'Thigh_{side}', hip_loc, kn_loc, 0.070, 0.060)
    make_sphere(f'Knee_{side}', kn_loc, 0.058, 0.058, 0.058)
    make_capsule(f'Calf_{side}', kn_loc, ank_loc, 0.058, 0.050)
    make_sphere(f'Ankle_{side}', ank_loc, 0.050, 0.050, 0.050)
    
    # Grounded foot: Heel at BACK (+Y), Toes extending FORWARD (-Y)!
    make_sphere(f'Heel_{side}', loc=(sign * 0.100, 0.035, 0.045), rx=0.046, ry=0.046, rz=0.046)
    make_capsule(f'FootSole_{side}', mathutils.Vector((sign * 0.100, 0.035, 0.040)), 
                 mathutils.Vector((sign * 0.100, -0.090, 0.035)), 0.046, 0.040)

print(f'Constructed {len(pieces)} calibrated decivoxels!')

# -----------------------------------------------------------------------------
# 3. FUSION, REMESH & SMOOTHING
# -----------------------------------------------------------------------------
bpy.ops.object.select_all(action='DESELECT')
for p in pieces:
    p.select_set(True)
bpy.context.view_layer.objects.active = pieces[0]
bpy.ops.object.join()

fused = bpy.context.view_layer.objects.active
fused.name = 'LPC_Decivoxel_Flesh_Fused'

# Voxel remesh at 0.010m (1 cm) for smooth curvature
fused.data.remesh_voxel_size = 0.010
fused.data.remesh_voxel_adaptivity = 0.0
bpy.ops.object.voxel_remesh()

# Gentle decimate to ~45k faces
dec_mod = fused.modifiers.new(name='Decimate', type='DECIMATE')
dec_mod.ratio = 0.32
bpy.ops.object.modifier_apply(modifier='Decimate')

for f in fused.data.polygons:
    f.use_smooth = True

smooth_mod = fused.modifiers.new(name='Flesh_Smooth', type='SMOOTH')
smooth_mod.factor = 0.45
smooth_mod.iterations = 2
bpy.ops.object.modifier_apply(modifier='Flesh_Smooth')

# Generate UVMap
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

# -----------------------------------------------------------------------------
# 4. AUTHENTIC LPC CEL SHADER & INVERTED HULL OUTLINE
# -----------------------------------------------------------------------------
fused.data.materials.clear()

# 1. Skin Material
mat_skin = bpy.data.materials.new(name='LPC_Skin_Cel')
mat_skin.use_nodes = True
nodes = mat_skin.node_tree.nodes
links = mat_skin.node_tree.links
nodes.clear()

out = nodes.new('ShaderNodeOutputMaterial')
diff = nodes.new('ShaderNodeBsdfDiffuse')
diff.inputs['Roughness'].default_value = 0.0

s2rgb = nodes.new('ShaderNodeShaderToRGB')
ramp = nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.interpolation = 'CONSTANT'

# Calibrated 3-tier authentic LPC palette:
# Shadow: #c47151 (rich warm terracotta) from 0.0 to 0.35
r_elems = ramp.color_ramp.elements
r_elems[0].position = 0.0
r_elems[0].color = (0.768, 0.443, 0.318, 1.0)

# Base: #f9d5ba (warm peach skin) from 0.35 to 0.88
r_elems[1].position = 0.35
r_elems[1].color = (0.976, 0.835, 0.729, 1.0)

# Highlight: #faece7 (soft cream highlight) from 0.88 to 1.0
e2 = r_elems.new(0.88)
e2.color = (0.980, 0.925, 0.906, 1.0)

# Subtle ambient lift
mix_node = nodes.new('ShaderNodeMixRGB')
mix_node.blend_type = 'ADD'
mix_node.inputs['Fac'].default_value = 0.08
mix_node.inputs['Color2'].default_value = (0.768, 0.443, 0.318, 1.0)

links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
links.new(ramp.outputs['Color'], mix_node.inputs['Color1'])
links.new(mix_node.outputs['Color'], out.inputs['Surface'])

fused.data.materials.append(mat_skin) # Slot 0

# 2. Inverted Hull Outline Material: #703828 (LPC crevice contour)
mat_outline = bpy.data.materials.new(name='LPC_Outline_Mat')
mat_outline.use_nodes = True
mat_outline.use_backface_culling = True
o_nodes = mat_outline.node_tree.nodes
o_links = mat_outline.node_tree.links
o_nodes.clear()

o_out = o_nodes.new('ShaderNodeOutputMaterial')
o_bsdf = o_nodes.new('ShaderNodeEmission')
o_bsdf.inputs['Color'].default_value = (0.439, 0.220, 0.157, 1.0) # #703828
o_bsdf.inputs['Strength'].default_value = 1.0
o_links.new(o_bsdf.outputs['Emission'], o_out.inputs['Surface'])

fused.data.materials.append(mat_outline) # Slot 1

# Add Inverted Hull Solidify Modifier
solid_mod = fused.modifiers.new(name='LPC_Ink_Outline', type='SOLIDIFY')
solid_mod.thickness = -0.007
solid_mod.offset = 0.0
solid_mod.use_flip_normals = True
solid_mod.material_offset = 1
solid_mod.material_offset_rim = 1

print('Applied authentic LPC 3-tier cel shader and ink outline!')

# -----------------------------------------------------------------------------
# 5. ARMATURE SKELETON ALIGNMENT & BINDING
# -----------------------------------------------------------------------------
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones

eb['Hips'].head = (0.0, 0.0, 0.49)
eb['Hips'].tail = (0.0, 0.0, 0.59)
eb['Spine'].head = (0.0, 0.0, 0.59)
eb['Spine'].tail = (0.0, 0.01, 0.69)
eb['Spine01'].head = (0.0, 0.01, 0.69)
eb['Spine01'].tail = (0.0, 0.01, 0.79)
eb['neck'].head = (0.0, 0.01, 0.79)
eb['neck'].tail = (0.0, 0.01, 0.88)
eb['Head'].head = (0.0, 0.01, 0.88)
eb['Head'].tail = (0.0, 0.01, 1.25)

for side, sign in [('Left', 1), ('Right', -1)]:
    eb[f'{side}Shoulder'].head = (sign * 0.05, 0.01, 0.72)
    eb[f'{side}Shoulder'].tail = (sign * 0.16, 0.00, 0.72)
    eb[f'{side}Arm'].head = (sign * 0.16, 0.00, 0.72)
    eb[f'{side}Arm'].tail = (sign * 0.18, 0.01, 0.56)
    eb[f'{side}ForeArm'].head = (sign * 0.18, 0.01, 0.56)
    eb[f'{side}ForeArm'].tail = (sign * 0.19, 0.00, 0.40)
    eb[f'{side}Hand'].head = (sign * 0.19, 0.00, 0.40)
    eb[f'{side}Hand'].tail = (sign * 0.19, -0.01, 0.28)
    
    eb[f'{side}UpLeg'].head = (sign * 0.085, 0.0, 0.48)
    eb[f'{side}UpLeg'].tail = (sign * 0.095, -0.025, 0.28)
    eb[f'{side}Leg'].head = (sign * 0.095, -0.025, 0.28)
    eb[f'{side}Leg'].tail = (sign * 0.100, 0.010, 0.11)
    eb[f'{side}Foot'].head = (sign * 0.100, 0.010, 0.11)
    eb[f'{side}Foot'].tail = (sign * 0.100, -0.10, 0.02)

bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.select_all(action='SELECT')
bpy.ops.pose.transforms_clear()
bpy.ops.object.mode_set(mode='OBJECT')

bpy.ops.object.select_all(action='DESELECT')
fused.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print('Successfully bound Armature to Refined Decivoxel Flesh!')

# -----------------------------------------------------------------------------
# 6. CONFORMING PIXEL-ACCURATE LPC FACE DECAL (Zero-Clipping Flush Placement)
# -----------------------------------------------------------------------------
for obj_name in ['LPC_Face_Decal', 'Face_Decal']:
    old_d = bpy.data.objects.get(obj_name)
    if old_d:
        bpy.data.objects.remove(old_d, do_unlink=True)

def create_lpc_face_decal(width=0.40, height=0.30, y_pos=-0.22, z_pos=0.960):
    mesh = bpy.data.meshes.new('Face_Decal_Mesh')
    obj = bpy.data.objects.new('LPC_Face_Decal', mesh)
    bpy.context.scene.collection.objects.link(obj)
    
    bm = bmesh.new()
    cols = 12
    rows = 8
    verts = []
    for r in range(rows + 1):
        v_coord = r / rows
        z = z_pos - height/2 + v_coord * height
        row_verts = []
        for c in range(cols + 1):
            u_coord = c / cols
            x = -width/2 + u_coord * width
            row_verts.append(bm.verts.new((x, y_pos, z)))
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
    emit = nodes.new('ShaderNodeEmission')
    
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(FACE_TEX_PATH, check_existing=True)
    tex.interpolation = 'Closest'
    
    links.new(tex.outputs['Color'], emit.inputs['Color'])
    links.new(emit.outputs['Emission'], out.inputs['Surface'])
    
    # In EEVEE, alpha blend
    mat.blend_method = 'BLEND'
    # Use Transparent BSDF + Add Shader or Mix Shader with Alpha
    trans = nodes.new('ShaderNodeBsdfTransparent')
    mix = nodes.new('ShaderNodeMixShader')
    links.new(tex.outputs['Alpha'], mix.inputs['Fac'])
    links.new(trans.outputs['BSDF'], mix.inputs[1])
    links.new(emit.outputs['Emission'], mix.inputs[2])
    links.new(mix.outputs['Shader'], out.inputs['Surface'])
    
    mesh.materials.append(mat)
    
    # Shrinkwrap modifier to conform 100% to skull surface with 4mm offset
    sw = obj.modifiers.new(name='Face_Shrinkwrap', type='SHRINKWRAP')
    sw.target = fused
    sw.wrap_method = 'NEAREST_SURFACEPOINT'
    sw.offset = 0.004
    
    # Parent to Armature Head bone
    con = obj.constraints.new(type='CHILD_OF')
    con.target = arm
    con.subtarget = 'Head'
    bpy.context.view_layer.objects.active = obj
    bpy.ops.constraint.childof_set_inverse(constraint=con.name, owner='OBJECT')
    return obj

face_decal = create_lpc_face_decal()
print('Attached authentic LPC pixel face decal!')

# -----------------------------------------------------------------------------
# 7. CALIBRATED STUDIO LIGHTING & REFERENCES
# -----------------------------------------------------------------------------
for l_name in ['KeyLight', 'RimLight', 'VioletFill', 'KeySun', 'FillSun', 'RimSun']:
    old_l = bpy.data.objects.get(l_name)
    if old_l:
        bpy.data.objects.remove(old_l, do_unlink=True)

def make_sun(name, energy, rot_euler, color=(1.0, 1.0, 1.0)):
    sun_data = bpy.data.lights.new(name, type='SUN')
    sun_data.energy = energy
    sun_data.color = color
    sun_obj = bpy.data.objects.new(name, sun_data)
    bpy.context.scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = rot_euler
    return sun_obj

key_sun = make_sun('KeySun', 2.0, (math.radians(48), math.radians(25), math.radians(35)), color=(1.0, 0.96, 0.92))
fill_sun = make_sun('FillSun', 1.0, (math.radians(35), math.radians(-35), math.radians(-45)), color=(0.88, 0.92, 1.0))
rim_sun = make_sun('RimSun', 0.8, (math.radians(-60), 0, math.radians(180)), color=(1.0, 0.90, 0.82))

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
    m_links.new(node_tex.outputs['Alpha'], node_b.inputs['Alpha'])
    m_links.new(node_b.outputs['BSDF'], node_o.inputs['Surface'])
    mesh.materials.append(mat)
    obj.location = location
    obj.rotation_euler = rotation_euler
    return obj

bb_side = create_billboard('LPC_SideBySide_Front', REF_FRONT, location=(0.75, 0.0, CENTER_Z), opacity=1.0)
bb_west = create_billboard('LPC_SideBySide_West', REF_SIDE, location=(0.0, 0.75, CENTER_Z), rotation_euler=(0, 0, math.radians(-90)), opacity=1.0)

bpy.ops.wm.save_as_mainfile(filepath=TARGET_BLEND)
print(f'Successfully saved refined mannequin blend -> {TARGET_BLEND}')

# -----------------------------------------------------------------------------
# 8. RENDER VERIFICATION SUITE (Authentic LPC 14-Degree Top-Down Pitch)
# -----------------------------------------------------------------------------
cam = bpy.data.objects['RenderCam']
for c in list(cam.constraints):
    cam.constraints.remove(c)
if cam.parent:
    cam.parent = None

bpy.context.scene.render.image_settings.file_format = 'PNG'

# 1. Front Ortho Side-by-Side with LPC Reference
bb_side.hide_render = False
bb_west.hide_render = True

cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.95
# Looking down at 78 degrees (12-degree tilt)
cam.location = (0.375, -3.9, 1.45)
cam.rotation_euler = (math.radians(78), 0, 0)
bpy.context.scene.render.filepath = os.path.abspath('artifacts/verification/refined_decivoxel_side_by_side.png')
bpy.ops.render.render(write_still=True)
print('Rendered: refined_decivoxel_side_by_side.png')

# 2. Side Profile Ortho Side-by-Side with West Reference
bb_side.hide_render = True
bb_west.hide_render = False

cam.location = (3.9, 0.375, 1.45)
cam.rotation_euler = (math.radians(78), 0, math.radians(90))
bpy.context.scene.render.filepath = os.path.abspath('artifacts/verification/refined_decivoxel_side_profile.png')
bpy.ops.render.render(write_still=True)
print('Rendered: refined_decivoxel_side_profile.png')

# 3. 3/4 Perspective View
bb_side.hide_render = True
bb_west.hide_render = True

cam.data.type = 'PERSP'
cam.location = (1.4, -2.2, 1.35)
cam.rotation_euler = (math.radians(70), 0, math.radians(32))
bpy.context.scene.render.filepath = os.path.abspath('artifacts/verification/refined_decivoxel_persp.png')
bpy.ops.render.render(write_still=True)
print('Rendered: refined_decivoxel_persp.png')
