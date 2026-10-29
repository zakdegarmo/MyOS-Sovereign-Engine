import bpy
import bmesh
import mathutils
import math
import os

print("=== Rebuilding Canonical T-Pose LPC Decivoxel Mannequin with Natural Arm Kinematics ===")

BLEND_PATH = os.path.abspath('mannequin_decivoxel_flesh_studio.blend')
bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

arm = bpy.data.objects['Armature']

# Remove existing decivoxel fused mesh if present
old_mesh = bpy.data.objects.get('LPC_Decivoxel_Flesh_Fused')
if old_mesh:
    bpy.data.objects.remove(old_mesh, do_unlink=True)

for o in list(bpy.data.objects):
    if any(k in o.name for k in ['Body_Fused', 'Arm_L_Fused', 'Arm_R_Fused', 'Cranium', 'Torso_', 'Bicep_', 'Thigh_']):
        bpy.data.objects.remove(o, do_unlink=True)

def make_sphere(name, loc=(0,0,0), rx=0.1, ry=0.1, rz=0.1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=1.0, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (rx, ry, rz)
    return obj

def make_capsule(name, p1, p2, r1, r2):
    mesh = bpy.data.meshes.new(name + '_mesh')
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
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
    return obj

# -----------------------------------------------------------------------------
# 1. ASSEMBLE BODY PIECES (Head, Torso, Hips, Legs)
# -----------------------------------------------------------------------------
body_pieces = []

# Head & Face
body_pieces.append(make_sphere('Cranium', loc=(0.0, 0.00, 1.04), rx=0.25, ry=0.23, rz=0.22))
body_pieces.append(make_sphere('LowerFace', loc=(0.0, -0.02, 0.95), rx=0.215, ry=0.205, rz=0.16))
body_pieces.append(make_sphere('Chin', loc=(0.0, -0.05, 0.865), rx=0.13, ry=0.13, rz=0.08))
for side, sign in [('L', 1), ('R', -1)]:
    body_pieces.append(make_sphere(f'Ear_{side}', loc=(sign * 0.235, 0.00, 0.965), rx=0.02, ry=0.042, rz=0.052))

body_pieces.append(make_capsule('Neck', mathutils.Vector((0.0, 0.00, 0.86)), mathutils.Vector((0.0, 0.00, 0.77)), 0.12, 0.13))

# Torso & Pelvis
body_pieces.append(make_capsule('Torso_Core', mathutils.Vector((0.0, 0.0, 0.48)), mathutils.Vector((0.0, 0.0, 0.76)), 0.15, 0.16))
body_pieces.append(make_sphere('Chest_Mass', loc=(0.0, -0.05, 0.70), rx=0.17, ry=0.13, rz=0.10))
body_pieces.append(make_sphere('Back_Mass', loc=(0.0, 0.05, 0.68), rx=0.15, ry=0.12, rz=0.10))
body_pieces.append(make_sphere('Waist_Mass', loc=(0.0, -0.02, 0.59), rx=0.15, ry=0.14, rz=0.09))
body_pieces.append(make_sphere('Pelvis_Mass', loc=(0.0, 0.00, 0.49), rx=0.15, ry=0.15, rz=0.10))
body_pieces.append(make_sphere('Glutes_Mass', loc=(0.0, 0.05, 0.49), rx=0.14, ry=0.12, rz=0.09))

# Legs & Feet
for side, sign in [('L', 1), ('R', -1)]:
    hip_loc = mathutils.Vector((sign * 0.080, 0.00, 0.48))
    kn_loc  = mathutils.Vector((sign * 0.085, -0.025, 0.28))
    ank_loc = mathutils.Vector((sign * 0.090, 0.010, 0.11))
    
    body_pieces.append(make_sphere(f'Hip_{side}', hip_loc, 0.068, 0.068, 0.068))
    body_pieces.append(make_capsule(f'Thigh_{side}', hip_loc, kn_loc, 0.065, 0.058))
    body_pieces.append(make_sphere(f'Knee_{side}', kn_loc, 0.056, 0.056, 0.056))
    body_pieces.append(make_capsule(f'Calf_{side}', kn_loc, ank_loc, 0.056, 0.048))
    body_pieces.append(make_sphere(f'Ankle_{side}', ank_loc, 0.048, 0.048, 0.048))
    body_pieces.append(make_sphere(f'Heel_{side}', loc=(sign * 0.090, 0.035, 0.045), rx=0.045, ry=0.045, rz=0.045))
    body_pieces.append(make_capsule(f'FootSole_{side}', mathutils.Vector((sign * 0.090, 0.035, 0.040)), 
                                   mathutils.Vector((sign * 0.090, -0.090, 0.035)), 0.045, 0.040))

# -----------------------------------------------------------------------------
# 2. ASSEMBLE ARM PIECES IN CANONICAL HORIZONTAL T-POSE
# -----------------------------------------------------------------------------
# In canonical T-Pose, arms extend horizontally along X at Z = 0.81.
# This aligns 100% with the animation fcurves for natural forward/backward swing!
arm_pieces = []
for side, sign in [('L', 1), ('R', -1)]:
    sh_loc   = mathutils.Vector((sign * 0.14, 0.00, 0.81))
    el_loc   = mathutils.Vector((sign * 0.34, 0.00, 0.81))
    wr_loc   = mathutils.Vector((sign * 0.50, 0.00, 0.81))
    fist_loc = mathutils.Vector((sign * 0.56, 0.00, 0.81))
    
    arm_pieces.append(make_sphere(f'Shoulder_{side}', sh_loc, 0.065, 0.065, 0.065))
    arm_pieces.append(make_capsule(f'Bicep_{side}', sh_loc, el_loc, 0.058, 0.050))
    arm_pieces.append(make_sphere(f'Elbow_{side}', el_loc, 0.050, 0.050, 0.050))
    arm_pieces.append(make_capsule(f'Forearm_{side}', el_loc, wr_loc, 0.050, 0.045))
    arm_pieces.append(make_sphere(f'Wrist_{side}', wr_loc, 0.045, 0.045, 0.045))
    arm_pieces.append(make_sphere(f'Fist_{side}', fist_loc, rx=0.055, ry=0.055, rz=0.055))

# -----------------------------------------------------------------------------
# 3. JOIN AND REMESH ALL PRIMITIVES
# -----------------------------------------------------------------------------
all_pieces = body_pieces + arm_pieces
bpy.ops.object.select_all(action='DESELECT')
for p in all_pieces: 
    p.select_set(True)
bpy.context.view_layer.objects.active = all_pieces[0]
bpy.ops.object.join()

fused = bpy.context.view_layer.objects.active
fused.name = 'LPC_Decivoxel_Flesh_Fused'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Voxel remesh at 0.010m resolution
fused.data.remesh_voxel_size = 0.010
bpy.ops.object.voxel_remesh()

# Decimate & Smooth
dec_mod = fused.modifiers.new(name='Decimate', type='DECIMATE')
dec_mod.ratio = 0.35
bpy.ops.object.modifier_apply(modifier='Decimate')

for f in fused.data.polygons: 
    f.use_smooth = True

smooth_mod = fused.modifiers.new(name='Flesh_Smooth', type='SMOOTH')
smooth_mod.factor = 0.40
smooth_mod.iterations = 2
bpy.ops.object.modifier_apply(modifier='Flesh_Smooth')

# Generate clean UVs
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

print(f"Final clean fused mesh has {len(fused.data.vertices)} vertices and {len(fused.data.polygons)} faces.")

# -----------------------------------------------------------------------------
# 4. CEL SHADER & OUTLINE MATERIALS
# -----------------------------------------------------------------------------
fused.data.materials.clear()

mat_skin = bpy.data.materials.get('LPC_Skin_Cel')
if not mat_skin:
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
    r_elems = ramp.color_ramp.elements
    r_elems[0].position = 0.0
    r_elems[0].color = (0.768, 0.443, 0.318, 1.0)
    r_elems[1].position = 0.35
    r_elems[1].color = (0.976, 0.835, 0.729, 1.0)
    e2 = r_elems.new(0.88)
    e2.color = (0.980, 0.925, 0.906, 1.0)
    mix_node = nodes.new('ShaderNodeMixRGB')
    mix_node.blend_type = 'ADD'
    mix_node.inputs['Fac'].default_value = 0.08
    mix_node.inputs['Color2'].default_value = (0.768, 0.443, 0.318, 1.0)
    links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], mix_node.inputs['Color1'])
    links.new(mix_node.outputs['Color'], out.inputs['Surface'])

fused.data.materials.append(mat_skin)

mat_outline = bpy.data.materials.get('LPC_Outline_Mat')
if not mat_outline:
    mat_outline = bpy.data.materials.new(name='LPC_Outline_Mat')
    mat_outline.use_nodes = True
    mat_outline.use_backface_culling = True
    nodes = mat_outline.node_tree.nodes
    links = mat_outline.node_tree.links
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeEmission')
    bsdf.inputs['Color'].default_value = (0.439, 0.220, 0.157, 1.0)
    links.new(bsdf.outputs['Emission'], out.inputs['Surface'])

fused.data.materials.append(mat_outline)

# -----------------------------------------------------------------------------
# 5. ARMATURE EDIT BONES UPDATE (Canonical T-Pose Skeleton)
# -----------------------------------------------------------------------------
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones

# Spine / Head
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

# Limbs in canonical T-pose:
for side, sign in [('Left', 1), ('Right', -1)]:
    eb[f'{side}Shoulder'].head = (sign * 0.04, 0.00, 0.77)
    eb[f'{side}Shoulder'].tail = (sign * 0.14, 0.00, 0.81)
    eb[f'{side}Shoulder'].roll = 0.0
    
    eb[f'{side}Arm'].head = (sign * 0.14, 0.00, 0.81)
    eb[f'{side}Arm'].tail = (sign * 0.34, 0.00, 0.81)
    eb[f'{side}Arm'].roll = 0.0
    
    eb[f'{side}ForeArm'].head = (sign * 0.34, 0.00, 0.81)
    eb[f'{side}ForeArm'].tail = (sign * 0.50, 0.00, 0.81)
    eb[f'{side}ForeArm'].roll = 0.0
    
    eb[f'{side}Hand'].head = (sign * 0.50, 0.00, 0.81)
    eb[f'{side}Hand'].tail = (sign * 0.65, 0.00, 0.81)
    eb[f'{side}Hand'].roll = 0.0
    
    # Legs
    eb[f'{side}UpLeg'].head = (sign * 0.080, 0.0, 0.48)
    eb[f'{side}UpLeg'].tail = (sign * 0.085, -0.025, 0.28)
    eb[f'{side}Leg'].head = (sign * 0.085, -0.025, 0.28)
    eb[f'{side}Leg'].tail = (sign * 0.090, 0.010, 0.11)
    eb[f'{side}Foot'].head = (sign * 0.090, 0.010, 0.11)
    eb[f'{side}Foot'].tail = (sign * 0.090, -0.090, 0.02)

bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.select_all(action='SELECT')
bpy.ops.pose.transforms_clear()
bpy.ops.object.mode_set(mode='OBJECT')

# -----------------------------------------------------------------------------
# 6. BIND ARMATURE WITH AUTOMATIC WEIGHTS (Perfect in T-Pose!)
# -----------------------------------------------------------------------------
bpy.ops.object.select_all(action='DESELECT')
fused.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print("Applied initial Armature Auto weights in canonical T-Pose.")

# Prune any accidental cross-body weights:
vg_map = {vg.name: vg.index for vg in fused.vertex_groups}
arm_bones_L = ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand']
arm_bones_R = ['RightShoulder', 'RightArm', 'RightForeArm', 'RightHand']
leg_bones = ['LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot']

pruned = 0
for v in fused.data.vertices:
    x, z = v.co.x, v.co.z
    # Left Arm mesh (x > 0.16, z > 0.65): strip Right Arm and Legs
    if x > 0.16 and z > 0.65:
        for b in arm_bones_R + leg_bones:
            if b in vg_map:
                fused.vertex_groups[b].remove([v.index])
                pruned += 1
    # Right Arm mesh (x < -0.16, z > 0.65): strip Left Arm and Legs
    elif x < -0.16 and z > 0.65:
        for b in arm_bones_L + leg_bones:
            if b in vg_map:
                fused.vertex_groups[b].remove([v.index])
                pruned += 1
    # Legs (z < 0.52): strip all arms
    if z < 0.52:
        for b in arm_bones_L + arm_bones_R:
            if b in vg_map:
                fused.vertex_groups[b].remove([v.index])
                pruned += 1

# Normalize weights
for v in fused.data.vertices:
    total_w = sum(g.weight for g in v.groups)
    if total_w > 1e-4:
        for g in v.groups:
            g.weight = g.weight / total_w

print(f"Weight pruning complete! Removed {pruned} cross-assignments and normalized all vertices.")

# -----------------------------------------------------------------------------
# 7. ADD SOLIDIFY MODIFIER AFTER ARMATURE
# -----------------------------------------------------------------------------
solid_mod = fused.modifiers.new(name='LPC_Ink_Outline', type='SOLIDIFY')
solid_mod.thickness = -0.007
solid_mod.offset = 0.0
solid_mod.use_flip_normals = True
solid_mod.material_offset = 1
solid_mod.material_offset_rim = 1

for mod in fused.modifiers:
    if mod.type == 'ARMATURE':
        bpy.ops.object.modifier_move_to_index(modifier=mod.name, index=0)

face_decal = bpy.data.objects.get('LPC_Face_Decal')
if face_decal:
    sw = face_decal.modifiers.get('Face_Shrinkwrap')
    if sw:
        sw.target = fused

bpy.ops.wm.save_mainfile()
print("Saved clean blend file to:", BLEND_PATH)
print("=== CANONICAL T-POSE REBUILD COMPLETE! ===")
