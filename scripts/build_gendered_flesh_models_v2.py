import bpy
import bmesh
import mathutils
import math
import os

print("=== Building Gendered FLESH Mannequins (Male & Female) v2 ===")

BASE_BLEND = os.path.abspath('flesh_base_mannequin.blend')
HERO_HAIR_SRC = os.path.abspath('apps/web/dist/models/outfitted_jrpg_hero_1.blend')
HEROINE_HAIR_SRC = os.path.abspath('apps/web/dist/models/characters/sylas_elf_ranger_production.blend')

OUT_MALE_BLEND = os.path.abspath('flesh_male_mannequin.blend')
OUT_FEMALE_BLEND = os.path.abspath('flesh_female_mannequin.blend')

DIR_VERIFY = os.path.abspath('artifacts/verification')
os.makedirs(DIR_VERIFY, exist_ok=True)

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

def setup_cel_shader(mat_name, shadow_color, highlight_color):
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Roughness'].default_value = 0.0
    s2rgb = nodes.new('ShaderNodeShaderToRGB')
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    r_elems = ramp.color_ramp.elements
    r_elems[0].position = 0.0
    r_elems[0].color = shadow_color
    r_elems[1].position = 0.35
    r_elems[1].color = highlight_color
    links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], out.inputs['Surface'])
    return mat

def apply_ink_outline(obj, thickness=-0.007):
    solid_mod = obj.modifiers.get('LPC_Ink_Outline')
    if not solid_mod:
        solid_mod = obj.modifiers.new(name='LPC_Ink_Outline', type='SOLIDIFY')
    solid_mod.thickness = thickness
    solid_mod.offset = 0.0
    solid_mod.use_flip_normals = True
    solid_mod.material_offset = 1
    solid_mod.material_offset_rim = 1

def bind_and_prune_weights(mesh_obj, arm_obj):
    bpy.ops.object.select_all(action='DESELECT')
    mesh_obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    
    vg_map = {vg.name: vg.index for vg in mesh_obj.vertex_groups}
    arm_bones_L = ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand']
    arm_bones_R = ['RightShoulder', 'RightArm', 'RightForeArm', 'RightHand']
    leg_bones = ['LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot']
    
    for v in mesh_obj.data.vertices:
        x, z = v.co.x, v.co.z
        if x > 0.16 and z > 0.65:
            for b in arm_bones_R + leg_bones:
                if b in vg_map: mesh_obj.vertex_groups[b].remove([v.index])
        elif x < -0.16 and z > 0.65:
            for b in arm_bones_L + leg_bones:
                if b in vg_map: mesh_obj.vertex_groups[b].remove([v.index])
        if z < 0.52:
            for b in arm_bones_L + arm_bones_R:
                if b in vg_map: mesh_obj.vertex_groups[b].remove([v.index])
                
    for v in mesh_obj.data.vertices:
        total_w = sum(g.weight for g in v.groups)
        if total_w > 1e-4:
            for g in v.groups:
                mesh_obj.vertex_groups[g.group].add([v.index], g.weight / total_w, 'REPLACE')

# =============================================================================
# 1. BUILD MALE MANNEQUIN
# =============================================================================
print("\n--- 1. Assembling MALE FLESH Mannequin ---")
bpy.ops.wm.open_mainfile(filepath=BASE_BLEND)
arm = bpy.data.objects['Armature']
fused_male = bpy.data.objects['LPC_Decivoxel_Flesh_Fused']
fused_male.name = 'LPC_Decivoxel_Flesh_Male'

# Load JRPG Hero Spikes Hair
with bpy.data.libraries.load(HERO_HAIR_SRC) as (df, dt):
    dt.objects = ['Hero_Meshy_Chunky_Hair']

hair_male = bpy.data.objects.get('Hero_Meshy_Chunky_Hair')
if hair_male:
    hair_male.name = 'Modular_Hair_JRPG_Hero_Spikes'
    bpy.context.scene.collection.objects.link(hair_male)
    hair_male.hide_render = False
    hair_male.hide_viewport = False
    
    min_z = min(v.co.z for v in hair_male.data.vertices)
    mid_y = sum(v.co.y for v in hair_male.data.vertices) / len(hair_male.data.vertices)
    mid_x = sum(v.co.x for v in hair_male.data.vertices) / len(hair_male.data.vertices)
    for v in hair_male.data.vertices:
        v.co.x -= mid_x
        v.co.y -= mid_y
        v.co.z -= min_z
        
    hair_male.location = (0.0, -0.06, 0.93)
    hair_male.scale = (1.20, 1.25, 1.10)
    bpy.context.view_layer.update()
    
    # Parent properly to Head bone keeping world transform!
    bpy.ops.object.select_all(action='DESELECT')
    hair_male.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    arm.data.bones.active = arm.data.bones['Head']
    bpy.ops.object.parent_set(type='BONE')
    
    # Material: Golden anime hair (Bartz / Cloud style)
    mat_hair_m = setup_cel_shader('M_Hair_Hero_Gold', (0.55, 0.28, 0.08, 1.0), (0.98, 0.76, 0.25, 1.0))
    hair_male.data.materials.clear()
    hair_male.data.materials.append(mat_hair_m)
    
    mat_outline = bpy.data.materials.get('LPC_Outline_Mat')
    if mat_outline:
        hair_male.data.materials.append(mat_outline)
        apply_ink_outline(hair_male, -0.007)

# Face decal shrinkwrap target
face_decal = bpy.data.objects.get('LPC_Face_Decal')
if face_decal:
    face_decal.name = 'LPC_Face_Decal_Male'
    sw = face_decal.modifiers.get('Face_Shrinkwrap')
    if sw: sw.target = fused_male

# Save Male blend file
bpy.ops.wm.save_as_mainfile(filepath=OUT_MALE_BLEND)
print(f"Saved Male FLESH Mannequin -> {OUT_MALE_BLEND}")

# Render Male Preview (Front)
scene = bpy.context.scene
scene.render.filepath = os.path.join(DIR_VERIFY, 'flesh_male_mannequin_preview.png')
bpy.ops.render.render(write_still=True)
print(f"Rendered Male Front preview -> {scene.render.filepath}")

# =============================================================================
# 2. BUILD FEMALE MANNEQUIN
# =============================================================================
print("\n--- 2. Assembling FEMALE FLESH Mannequin ---")
bpy.ops.wm.open_mainfile(filepath=BASE_BLEND)
arm = bpy.data.objects['Armature']

# Remove default fused mesh
old_mesh = bpy.data.objects.get('LPC_Decivoxel_Flesh_Fused')
if old_mesh:
    bpy.data.objects.remove(old_mesh, do_unlink=True)

female_body_pieces = []

# Head & Face
female_body_pieces.append(make_sphere('Cranium', loc=(0.0, 0.00, 1.04), rx=0.245, ry=0.225, rz=0.215))
female_body_pieces.append(make_sphere('LowerFace', loc=(0.0, -0.02, 0.95), rx=0.210, ry=0.200, rz=0.155))
female_body_pieces.append(make_sphere('Chin', loc=(0.0, -0.05, 0.865), rx=0.118, ry=0.118, rz=0.075))
for side, sign in [('L', 1), ('R', -1)]:
    female_body_pieces.append(make_sphere(f'Ear_{side}', loc=(sign * 0.230, 0.00, 0.965), rx=0.02, ry=0.040, rz=0.050))

female_body_pieces.append(make_capsule('Neck', mathutils.Vector((0.0, 0.00, 0.86)), mathutils.Vector((0.0, 0.00, 0.77)), 0.110, 0.120))

# Torso & Pelvis (Hourglass silhouette: slender waist, flared hips, subtle bust)
female_body_pieces.append(make_capsule('Torso_Core', mathutils.Vector((0.0, 0.0, 0.48)), mathutils.Vector((0.0, 0.0, 0.76)), 0.130, 0.145))
female_body_pieces.append(make_sphere('Chest_Mass', loc=(0.0, -0.03, 0.70), rx=0.150, ry=0.120, rz=0.095))

# Authentic LPC Bust Masses
female_body_pieces.append(make_sphere('Bust_L', loc=(0.058, -0.075, 0.695), rx=0.062, ry=0.060, rz=0.055))
female_body_pieces.append(make_sphere('Bust_R', loc=(-0.058, -0.075, 0.695), rx=0.062, ry=0.060, rz=0.055))

female_body_pieces.append(make_sphere('Back_Mass', loc=(0.0, 0.045, 0.68), rx=0.135, ry=0.110, rz=0.095))
female_body_pieces.append(make_sphere('Waist_Mass', loc=(0.0, -0.015, 0.585), rx=0.128, ry=0.122, rz=0.085))
female_body_pieces.append(make_sphere('Pelvis_Mass', loc=(0.0, 0.00, 0.49), rx=0.165, ry=0.158, rz=0.105))
female_body_pieces.append(make_sphere('Glutes_Mass', loc=(0.0, 0.050, 0.49), rx=0.150, ry=0.135, rz=0.095))

# Female Legs & Feet
for side, sign in [('L', 1), ('R', -1)]:
    hip_loc = mathutils.Vector((sign * 0.090, 0.00, 0.48))
    kn_loc  = mathutils.Vector((sign * 0.082, -0.025, 0.28))
    ank_loc = mathutils.Vector((sign * 0.085, 0.010, 0.11))
    
    female_body_pieces.append(make_sphere(f'Hip_{side}', hip_loc, 0.072, 0.072, 0.070))
    female_body_pieces.append(make_capsule(f'Thigh_{side}', hip_loc, kn_loc, 0.068, 0.052))
    female_body_pieces.append(make_sphere(f'Knee_{side}', kn_loc, 0.052, 0.052, 0.052))
    female_body_pieces.append(make_capsule(f'Calf_{side}', kn_loc, ank_loc, 0.052, 0.044))
    female_body_pieces.append(make_sphere(f'Ankle_{side}', ank_loc, 0.044, 0.044, 0.044))
    female_body_pieces.append(make_sphere(f'Heel_{side}', loc=(sign * 0.085, 0.035, 0.045), rx=0.042, ry=0.042, rz=0.042))
    female_body_pieces.append(make_capsule(f'FootSole_{side}', mathutils.Vector((sign * 0.085, 0.035, 0.040)), 
                                          mathutils.Vector((sign * 0.085, -0.085, 0.035)), 0.042, 0.038))

# Female Arms in Canonical Horizontal T-Pose
female_arm_pieces = []
for side, sign in [('L', 1), ('R', -1)]:
    sh_loc   = mathutils.Vector((sign * 0.128, 0.00, 0.81))
    el_loc   = mathutils.Vector((sign * 0.325, 0.00, 0.81))
    wr_loc   = mathutils.Vector((sign * 0.485, 0.00, 0.81))
    fist_loc = mathutils.Vector((sign * 0.540, 0.00, 0.81))
    
    female_arm_pieces.append(make_sphere(f'Shoulder_{side}', sh_loc, 0.058, 0.058, 0.058))
    female_arm_pieces.append(make_capsule(f'Bicep_{side}', sh_loc, el_loc, 0.050, 0.044))
    female_arm_pieces.append(make_sphere(f'Elbow_{side}', el_loc, 0.044, 0.044, 0.044))
    female_arm_pieces.append(make_capsule(f'Forearm_{side}', el_loc, wr_loc, 0.044, 0.038))
    female_arm_pieces.append(make_sphere(f'Wrist_{side}', wr_loc, 0.038, 0.038, 0.038))
    female_arm_pieces.append(make_sphere(f'Fist_{side}', fist_loc, rx=0.048, ry=0.048, rz=0.048))

all_female_pieces = female_body_pieces + female_arm_pieces
bpy.ops.object.select_all(action='DESELECT')
for p in all_female_pieces: p.select_set(True)
bpy.context.view_layer.objects.active = all_female_pieces[0]
bpy.ops.object.join()

fused_female = bpy.context.view_layer.objects.active
fused_female.name = 'LPC_Decivoxel_Flesh_Female'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Voxel remesh at 0.010m resolution
fused_female.data.remesh_voxel_size = 0.010
bpy.ops.object.voxel_remesh()

# Decimate & Smooth
dec_mod = fused_female.modifiers.new(name='Decimate', type='DECIMATE')
dec_mod.ratio = 0.35
bpy.ops.object.modifier_apply(modifier='Decimate')

for f in fused_female.data.polygons: f.use_smooth = True

smooth_mod = fused_female.modifiers.new(name='Flesh_Smooth', type='SMOOTH')
smooth_mod.factor = 0.40
smooth_mod.iterations = 2
bpy.ops.object.modifier_apply(modifier='Flesh_Smooth')

# Clean UV unwrapping
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

# Materials: Skin cel shader + Ink outline
mat_skin = bpy.data.materials.get('LPC_Skin_Cel')
fused_female.data.materials.clear()
fused_female.data.materials.append(mat_skin)
mat_outline = bpy.data.materials.get('LPC_Outline_Mat')
if mat_outline:
    fused_female.data.materials.append(mat_outline)
apply_ink_outline(fused_female, -0.007)

# Adjust Armature Edit Bones to match female shoulder span
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones
for side, sign in [('Left', 1), ('Right', -1)]:
    eb[f'{side}Shoulder'].head = (sign * 0.035, 0.00, 0.77)
    eb[f'{side}Shoulder'].tail = (sign * 0.128, 0.00, 0.81)
    eb[f'{side}Arm'].head = (sign * 0.128, 0.00, 0.81)
    eb[f'{side}Arm'].tail = (sign * 0.325, 0.00, 0.81)
    eb[f'{side}ForeArm'].head = (sign * 0.325, 0.00, 0.81)
    eb[f'{side}ForeArm'].tail = (sign * 0.485, 0.00, 0.81)
    eb[f'{side}Hand'].head = (sign * 0.485, 0.00, 0.81)
    eb[f'{side}Hand'].tail = (sign * 0.620, 0.00, 0.81)
bpy.ops.object.mode_set(mode='OBJECT')

bind_and_prune_weights(fused_female, arm)

for mod in fused_female.modifiers:
    if mod.type == 'ARMATURE':
        bpy.ops.object.modifier_move_to_index(modifier=mod.name, index=0)

# Load Female Face Decal
face_decal = bpy.data.objects.get('LPC_Face_Decal')
if face_decal:
    face_decal.name = 'LPC_Face_Decal_Female'
    sw = face_decal.modifiers.get('Face_Shrinkwrap')
    if sw: sw.target = fused_female
    
    mat_face = face_decal.data.materials[0]
    fem_img_path = os.path.abspath('assets/textures/lpc/lpc_face_female_authentic_pixel.png')
    if os.path.exists(fem_img_path):
        img_fem = bpy.data.images.load(fem_img_path)
        for node in mat_face.node_tree.nodes:
            if node.type == 'TEX_IMAGE':
                node.image = img_fem

# Add JRPG Heroine Hair (Terra / Celes style)
with bpy.data.libraries.load(HEROINE_HAIR_SRC) as (df, dt):
    dt.objects = ['Hair_Long']

hair_female = bpy.data.objects.get('Hair_Long')
if hair_female:
    hair_female.name = 'Modular_Hair_JRPG_Heroine_Locks'
    bpy.context.scene.collection.objects.link(hair_female)
    hair_female.hide_render = False
    hair_female.hide_viewport = False
    
    min_z = min(v.co.z for v in hair_female.data.vertices)
    mid_y = sum(v.co.y for v in hair_female.data.vertices) / len(hair_female.data.vertices)
    mid_x = sum(v.co.x for v in hair_female.data.vertices) / len(hair_female.data.vertices)
    for v in hair_female.data.vertices:
        v.co.x -= mid_x
        v.co.y -= mid_y
        v.co.z -= min_z
        
    hair_female.rotation_euler = (0, 0, math.radians(180))
    hair_female.location = (0.0, 0.015, 0.85)
    hair_female.scale = (2.15, 2.15, 2.05)
    bpy.context.view_layer.update()
    
    # Parent properly to Head bone
    bpy.ops.object.select_all(action='DESELECT')
    hair_female.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    arm.data.bones.active = arm.data.bones['Head']
    bpy.ops.object.parent_set(type='BONE')
    
    # Material: Iconic anime emerald/mint (Terra Branford style!)
    mat_hair_f = setup_cel_shader('M_Hair_Heroine_Mint', (0.12, 0.40, 0.35, 1.0), (0.35, 0.88, 0.68, 1.0))
    hair_female.data.materials.clear()
    hair_female.data.materials.append(mat_hair_f)
    if mat_outline:
        hair_female.data.materials.append(mat_outline)
        apply_ink_outline(hair_female, -0.007)

# Save Female blend
bpy.ops.wm.save_as_mainfile(filepath=OUT_FEMALE_BLEND)
print(f"Saved Female FLESH Mannequin -> {OUT_FEMALE_BLEND}")

# Render Female Preview (Front)
scene = bpy.context.scene
scene.render.filepath = os.path.join(DIR_VERIFY, 'flesh_female_mannequin_preview.png')
bpy.ops.render.render(write_still=True)
print(f"Rendered Female Front preview -> {scene.render.filepath}")

print("=== ALL GENDERED FLESH MANNEQUINS SUCCESSFULLY CREATED ===")
