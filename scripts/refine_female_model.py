import bpy, bmesh, mathutils, math, os

flesh_base = os.path.abspath("flesh_base_mannequin.blend")
bpy.ops.wm.open_mainfile(filepath=flesh_base)

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

# Torso & Pelvis with ENHANCED BUST & Hourglass Silhouette
female_body_pieces.append(make_capsule('Torso_Core', mathutils.Vector((0.0, 0.0, 0.48)), mathutils.Vector((0.0, 0.0, 0.76)), 0.130, 0.145))
female_body_pieces.append(make_sphere('Chest_Mass', loc=(0.0, -0.03, 0.70), rx=0.150, ry=0.120, rz=0.095))

# Enhanced Bust Masses (Bigger, clearly defined curvature)
female_body_pieces.append(make_sphere('Bust_L', loc=(0.064, -0.082, 0.690), rx=0.076, ry=0.074, rz=0.068))
female_body_pieces.append(make_sphere('Bust_R', loc=(-0.064, -0.082, 0.690), rx=0.076, ry=0.074, rz=0.068))

female_body_pieces.append(make_sphere('Back_Mass', loc=(0.0, 0.045, 0.68), rx=0.135, ry=0.110, rz=0.095))
female_body_pieces.append(make_sphere('Waist_Mass', loc=(0.0, -0.015, 0.585), rx=0.128, ry=0.122, rz=0.085))
female_body_pieces.append(make_sphere('Pelvis_Mass', loc=(0.0, 0.00, 0.49), rx=0.168, ry=0.160, rz=0.108))
female_body_pieces.append(make_sphere('Glutes_Mass', loc=(0.0, 0.052, 0.49), rx=0.155, ry=0.140, rz=0.098))

# Female Legs & Feet
for side, sign in [('L', 1), ('R', -1)]:
    hip_loc = mathutils.Vector((sign * 0.090, 0.00, 0.48))
    kn_loc  = mathutils.Vector((sign * 0.082, -0.025, 0.28))
    ank_loc = mathutils.Vector((sign * 0.085, 0.010, 0.11))
    
    female_body_pieces.append(make_sphere(f'Hip_{side}', hip_loc, 0.074, 0.074, 0.072))
    female_body_pieces.append(make_capsule(f'Thigh_{side}', hip_loc, kn_loc, 0.070, 0.052))
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

fused_female.data.remesh_voxel_size = 0.010
bpy.ops.object.voxel_remesh()

dec_mod = fused_female.modifiers.new(name='Decimate', type='DECIMATE')
dec_mod.ratio = 0.35
bpy.ops.object.modifier_apply(modifier='Decimate')

for f in fused_female.data.polygons: f.use_smooth = True

smooth_mod = fused_female.modifiers.new(name='Flesh_Smooth', type='SMOOTH')
smooth_mod.factor = 0.40
smooth_mod.iterations = 2
bpy.ops.object.modifier_apply(modifier='Flesh_Smooth')

bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

mat_skin = bpy.data.materials.get('LPC_Skin_Cel')
fused_female.data.materials.clear()
fused_female.data.materials.append(mat_skin)
mat_outline = bpy.data.materials.get('LPC_Outline_Mat')
if mat_outline:
    fused_female.data.materials.append(mat_outline)
    solid_mod = fused_female.modifiers.new(name='LPC_Ink_Outline', type='SOLIDIFY')
    solid_mod.thickness = -0.007
    solid_mod.offset = 0.0
    solid_mod.use_flip_normals = True
    solid_mod.material_offset = 1
    solid_mod.material_offset_rim = 1

# Bind and prune weights
bpy.ops.object.select_all(action='DESELECT')
fused_female.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

vg_map = {vg.name: vg.index for vg in fused_female.vertex_groups}
arm_bones_L = ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand']
arm_bones_R = ['RightShoulder', 'RightArm', 'RightForeArm', 'RightHand']
leg_bones = ['LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot']

for v in fused_female.data.vertices:
    x, z = v.co.x, v.co.z
    if x > 0.16 and z > 0.65:
        for b in arm_bones_R + leg_bones:
            if b in vg_map: fused_female.vertex_groups[b].remove([v.index])
    elif x < -0.16 and z > 0.65:
        for b in arm_bones_L + leg_bones:
            if b in vg_map: fused_female.vertex_groups[b].remove([v.index])
    if z < 0.52:
        for b in arm_bones_L + arm_bones_R:
            if b in vg_map: fused_female.vertex_groups[b].remove([v.index])
            
for v in fused_female.data.vertices:
    total_w = sum(g.weight for g in v.groups)
    if total_w > 1e-4:
        for g in v.groups:
            fused_female.vertex_groups[g.group].add([v.index], g.weight / total_w, 'REPLACE')

for mod in fused_female.modifiers:
    if mod.type == 'ARMATURE':
        bpy.ops.object.modifier_move_to_index(modifier=mod.name, index=0)

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

# Add adjusted Female Hair (Snug fit to skull)
HEROINE_HAIR_SRC = os.path.abspath('apps/web/dist/models/characters/sylas_elf_ranger_production.blend')
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
    # Snug fit: lower Z to 0.77, slight forward Y to -0.025, scaled to hug skull
    hair_female.location = (0.0, -0.025, 0.77)
    hair_female.scale = (2.20, 2.22, 2.05)
    bpy.context.view_layer.update()
    
    bpy.ops.object.select_all(action='DESELECT')
    hair_female.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    arm.data.bones.active = arm.data.bones['Head']
    bpy.ops.object.parent_set(type='BONE')
    
    mat_hair_f = bpy.data.materials.new(name="M_Hair_Heroine_Mint")
    mat_hair_f.use_nodes = True
    nodes = mat_hair_f.node_tree.nodes
    links = mat_hair_f.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    diff = nodes.new("ShaderNodeBsdfDiffuse")
    diff.inputs["Roughness"].default_value = 0.0
    s2rgb = nodes.new("ShaderNodeShaderToRGB")
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    r_elems = ramp.color_ramp.elements
    r_elems[0].position = 0.0
    r_elems[0].color = (0.12, 0.40, 0.35, 1.0)
    r_elems[1].position = 0.35
    r_elems[1].color = (0.35, 0.88, 0.68, 1.0)
    links.new(diff.outputs["BSDF"], s2rgb.inputs["Shader"])
    links.new(s2rgb.outputs["Color"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], out.inputs["Surface"])
    
    hair_female.data.materials.clear()
    hair_female.data.materials.append(mat_hair_f)
    if mat_outline:
        hair_female.data.materials.append(mat_outline)
        solid_mod = hair_female.modifiers.new(name='Hair_Outline', type='SOLIDIFY')
        solid_mod.thickness = -0.007
        solid_mod.offset = 0.0
        solid_mod.use_flip_normals = True
        solid_mod.material_offset = 1
        solid_mod.material_offset_rim = 1

OUT_FEMALE_BLEND = os.path.abspath('flesh_female_mannequin.blend')
bpy.ops.wm.save_as_mainfile(filepath=OUT_FEMALE_BLEND)
print("Saved refined female blend file!")

scene = bpy.context.scene
scene.render.filepath = os.path.abspath('artifacts/verification/flesh_female_refined_preview.png')
bpy.ops.render.render(write_still=True)
print("Rendered refined female preview!")
