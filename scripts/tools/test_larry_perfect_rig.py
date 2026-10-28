import bpy, bmesh, os, math, mathutils

blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_base_comic.blend"
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.film_transparent = True
scene.render.resolution_x = 256
scene.render.resolution_y = 256

body = bpy.data.objects['LPC_Decivoxel_Flesh_Fused']
arm = bpy.data.objects['Armature']
face = bpy.data.objects.get('LPC_Face_Decal')
if face:
    face.hide_render = False

arm.data.pose_position = 'REST'
bpy.context.view_layer.update()

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

mat_skin = bpy.data.materials.get('LPC_Skin_Cel')

mat_shirt = make_cel_mat('Larry_Shirt_Cel', [
    (0.00, (0.75, 0.78, 0.86)),
    (0.32, (0.86, 0.89, 0.95)),
    (0.48, (0.97, 0.98, 1.00)),
    (0.85, (1.00, 1.00, 1.00))
])

mat_slacks = make_cel_mat('Larry_Slacks_Cel', [
    (0.00, (0.12, 0.18, 0.28)),
    (0.32, (0.20, 0.30, 0.44)),
    (0.48, (0.34, 0.46, 0.62)),
    (0.85, (0.50, 0.64, 0.80))
])

mat_belt = make_cel_mat('Larry_Belt_Cel', [
    (0.00, (0.05, 0.04, 0.03)),
    (0.35, (0.12, 0.09, 0.07)),
    (0.50, (0.22, 0.16, 0.12))
])

mat_buckle = make_cel_mat('Larry_Buckle_Cel', [
    (0.00, (0.35, 0.25, 0.05)),
    (0.35, (0.65, 0.50, 0.12)),
    (0.50, (0.95, 0.80, 0.22)),
    (0.85, (1.00, 0.92, 0.50))
])

mat_tie = make_cel_mat('Larry_Tie_Cel', [
    (0.00, (0.45, 0.02, 0.04)),
    (0.32, (0.72, 0.04, 0.06)),
    (0.48, (0.95, 0.08, 0.10)),
    (0.85, (1.00, 0.25, 0.28))
])

mat_shoes = make_cel_mat('Larry_Shoes_Cel', [
    (0.00, (0.04, 0.03, 0.02)),
    (0.35, (0.10, 0.08, 0.06)),
    (0.50, (0.18, 0.14, 0.11))
])

mat_hair = make_cel_mat('Larry_Hair_Cel', [
    (0.00, (0.12, 0.07, 0.04)),
    (0.32, (0.24, 0.15, 0.09)),
    (0.48, (0.38, 0.25, 0.16)),
    (0.85, (0.55, 0.38, 0.26))
])

def apply_solidify_outline(obj, outline_mat, thickness=0.006):
    if outline_mat.name not in [s.material.name for s in obj.material_slots if s.material]:
        obj.data.materials.append(outline_mat)
    slot_idx = [s.material.name for s in obj.material_slots if s.material].index(outline_mat.name)
    mod = obj.modifiers.get('LPC_Ink_Outline') or obj.modifiers.new(name='LPC_Ink_Outline', type='SOLIDIFY')
    mod.thickness = -abs(thickness)
    mod.offset = 0.0
    mod.material_offset = slot_idx
    mod.use_flip_normals = True
    return mod

# -------------------------------------------------------------------------
# 1. BODY MASK (Prevent naked body skin from poking through clothing or hair)
# -------------------------------------------------------------------------
vg_vis = body.vertex_groups.get('Body_Visible') or body.vertex_groups.new(name='Body_Visible')
for v in body.data.vertices:
    z = v.co.z
    x = abs(v.co.x)
    y = v.co.y
    is_scalp = (z > 1.15) or (y > 0.02 and z > 1.05)
    is_head_front = (z >= 0.88 and not is_scalp)
    is_hand = (x >= 0.47 and z < 0.85)
    
    if is_head_front or is_hand:
        vg_vis.add([v.index], 1.0, 'REPLACE')
    else:
        vg_vis.add([v.index], 0.0, 'REPLACE')

mask_mod = body.modifiers.get('Body_Mask') or body.modifiers.new('Body_Mask', 'MASK')
mask_mod.vertex_group = 'Body_Visible'
mask_mod.invert_vertex_group = False
bpy.context.view_layer.objects.active = body
while body.modifiers[0].name != 'Body_Mask':
    bpy.ops.object.modifier_move_up(modifier='Body_Mask')

# -------------------------------------------------------------------------
# 2. WHITE COLLARED BUTTON-UP DRESS SHIRT (True T-Pose Alignment)
# -------------------------------------------------------------------------
print("Constructing 3D Dress Shirt...")
bm_s = bmesh.new()

N_CIRC = 16
# (z, rx, ry, off_y, w_neck, w_sp01, w_sp)
shirt_profiles = [
    (0.91, 0.078, 0.070, -0.010, 0.70, 0.30, 0.00), # Collar band
    (0.86, 0.144, 0.118, -0.012, 0.15, 0.80, 0.05), # Clavicle / shoulder root
    (0.78, 0.158, 0.125, -0.012, 0.00, 0.70, 0.30), # Mid chest
    (0.70, 0.148, 0.118, -0.010, 0.00, 0.35, 0.65), # Lower chest / ribcage
    (0.62, 0.142, 0.115, -0.005, 0.00, 0.10, 0.90), # Waist
    (0.53, 0.142, 0.116,  0.000, 0.00, 0.00, 1.00), # Tucked into slacks waistline
]

shirt_rings = []
shirt_weights = []
for z, rx, ry, off_y, w_nk, w_sp1, w_sp in shirt_profiles:
    ring = []
    for i in range(N_CIRC):
        ang = (i / float(N_CIRC)) * 2.0 * math.pi
        vx = math.cos(ang) * rx
        vy = off_y + math.sin(ang) * ry
        vz = z
        v = bm_s.verts.new(mathutils.Vector((vx, vy, vz)))
        ring.append(v)
        shirt_weights.append((v, {'neck': w_nk, 'Spine01': w_sp1, 'Spine': w_sp}))
    shirt_rings.append(ring)

for r in range(len(shirt_rings) - 1):
    for i in range(N_CIRC):
        i_next = (i + 1) % N_CIRC
        bm_s.faces.new([shirt_rings[r][i], shirt_rings[r][i_next], shirt_rings[r+1][i_next], shirt_rings[r+1][i]])

# Long Sleeves extending along X-axis (matching T-pose bones: Z=0.810, Y=0.000)
N_SLV = 10
# (x_pos, radius, w_sh, w_arm, w_forearm)
sleeve_steps = [
    (0.140, 0.085, 0.50, 0.50, 0.00), # Shoulder / armhole
    (0.220, 0.082, 0.10, 0.90, 0.00), # Bicep
    (0.320, 0.078, 0.00, 0.70, 0.30), # Upper elbow
    (0.360, 0.076, 0.00, 0.30, 0.70), # Lower elbow
    (0.430, 0.074, 0.00, 0.00, 1.00), # Forearm
    (0.485, 0.078, 0.00, 0.00, 1.00), # Buttoned cuff at wrist
]

def build_sleeve_tpose(bm, is_left):
    sign = 1.0 if is_left else -1.0
    sh_bone = 'LeftShoulder' if is_left else 'RightShoulder'
    arm_bone = 'LeftArm' if is_left else 'RightArm'
    fore_bone = 'LeftForeArm' if is_left else 'RightForeArm'
    
    rings = []
    w_list = []
    for x_val, r, w_sh, w_arm, w_fa in sleeve_steps:
        ring = []
        cx = sign * x_val
        cy = 0.000
        cz = 0.810
        for i in range(N_SLV):
            ang = (i / float(N_SLV)) * 2.0 * math.pi
            vy = cy + math.cos(ang) * r
            vz = cz + math.sin(ang) * r
            vx = cx
            v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
            ring.append(v)
            w_list.append((v, {sh_bone: w_sh, arm_bone: w_arm, fore_bone: w_fa}))
        rings.append(ring)
        
    for r in range(len(rings) - 1):
        for i in range(N_SLV):
            i_next = (i + 1) % N_SLV
            bm.faces.new([rings[r][i], rings[r][i_next], rings[r+1][i_next], rings[r+1][i]])
    return w_list

w_s_l = build_sleeve_tpose(bm_s, True)
w_s_r = build_sleeve_tpose(bm_s, False)

# 3D Collar Wings (Crisp white folded collar lapels)
for sign in [-1.0, 1.0]:
    bmesh.ops.create_cube(
        bm_s, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((sign * 0.048, -0.090, 0.905)) @
            mathutils.Euler((math.radians(24), math.radians(sign * 14), math.radians(-sign * 30))).to_matrix().to_4x4() @
            mathutils.Matrix.Diagonal((0.048, 0.016, 0.060, 1.0))
        )
    )

# Vertical Front Placket
bmesh.ops.create_cube(
    bm_s, size=1.0,
    matrix=(
        mathutils.Matrix.Translation((0.0, -0.138, 0.705)) @
        mathutils.Euler((math.radians(4), 0, 0)).to_matrix().to_4x4() @
        mathutils.Matrix.Diagonal((0.030, 0.014, 0.350, 1.0))
    )
)

bm_s.verts.index_update()
bm_s.verts.ensure_lookup_table()
final_shirt_weights = [(v.index, w) for v, w in shirt_weights + w_s_l + w_s_r]

mesh_shirt = bpy.data.meshes.new('Larry_Shirt_Mesh')
bm_s.to_mesh(mesh_shirt)
bm_s.free()

obj_shirt = bpy.data.objects.new('Larry_Shirt', mesh_shirt)
bpy.context.collection.objects.link(obj_shirt)
obj_shirt.parent = arm
mod_arm_s = obj_shirt.modifiers.new('Armature', 'ARMATURE')
mod_arm_s.object = arm

for b in ['neck', 'Spine01', 'Spine', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'RightShoulder', 'RightArm', 'RightForeArm']:
    obj_shirt.vertex_groups.new(name=b)

for v_idx, weights in final_shirt_weights:
    for b_name, weight in weights.items():
        if weight > 0.001:
            obj_shirt.vertex_groups[b_name].add([v_idx], weight, 'REPLACE')

for v in mesh_shirt.vertices:
    if v.index >= len(final_shirt_weights):
        if v.co.z > 0.86:
            obj_shirt.vertex_groups['neck'].add([v.index], 0.75, 'REPLACE')
            obj_shirt.vertex_groups['Spine01'].add([v.index], 0.25, 'REPLACE')
        elif v.co.z > 0.65:
            obj_shirt.vertex_groups['Spine01'].add([v.index], 0.85, 'REPLACE')
            obj_shirt.vertex_groups['Spine'].add([v.index], 0.15, 'REPLACE')
        else:
            obj_shirt.vertex_groups['Spine'].add([v.index], 0.90, 'REPLACE')

obj_shirt.data.materials.append(mat_shirt)
apply_solidify_outline(obj_shirt, mat_outline, thickness=0.006)
print("Dress shirt created.")

# -------------------------------------------------------------------------
# 3. RADIANT RED 3D NECKTIE
# -------------------------------------------------------------------------
print("Constructing 3D Radiant Red Necktie...")
bm_t = bmesh.new()

# Windsor Knot at throat opening
bmesh.ops.create_cube(
    bm_t, size=1.0,
    matrix=(
        mathutils.Matrix.Translation((0.0, -0.115, 0.880)) @
        mathutils.Euler((math.radians(14), 0, 0)).to_matrix().to_4x4() @
        mathutils.Matrix.Diagonal((0.046, 0.028, 0.040, 1.0))
    )
)
# Upper Blade
bmesh.ops.create_cube(
    bm_t, size=1.0,
    matrix=(
        mathutils.Matrix.Translation((0.0, -0.148, 0.755)) @
        mathutils.Euler((math.radians(6), 0, 0)).to_matrix().to_4x4() @
        mathutils.Matrix.Diagonal((0.038, 0.016, 0.210, 1.0))
    )
)
# Lower Blade widening to belt
bmesh.ops.create_cube(
    bm_t, size=1.0,
    matrix=(
        mathutils.Matrix.Translation((0.0, -0.138, 0.630)) @
        mathutils.Euler((math.radians(2), 0, 0)).to_matrix().to_4x4() @
        mathutils.Matrix.Diagonal((0.048, 0.016, 0.125, 1.0))
    )
)
# Diamond Pointed Tip at belt buckle
bmesh.ops.create_cube(
    bm_t, size=1.0,
    matrix=(
        mathutils.Matrix.Translation((0.0, -0.136, 0.555)) @
        mathutils.Euler((0, 0, math.radians(45))).to_matrix().to_4x4() @
        mathutils.Matrix.Diagonal((0.034, 0.034, 0.014, 1.0))
    )
)

mesh_tie = bpy.data.meshes.new('Larry_Tie_Mesh')
bm_t.to_mesh(mesh_tie)
bm_t.free()

obj_tie = bpy.data.objects.new('Larry_Tie', mesh_tie)
bpy.context.collection.objects.link(obj_tie)
obj_tie.parent = arm
mod_arm_t = obj_tie.modifiers.new('Armature', 'ARMATURE')
mod_arm_t.object = arm

vg_t_nk = obj_tie.vertex_groups.new(name='neck')
vg_t_sp1 = obj_tie.vertex_groups.new(name='Spine01')
vg_t_sp = obj_tie.vertex_groups.new(name='Spine')

for vi, v in enumerate(mesh_tie.vertices):
    z = v.co.z
    if z > 0.84:
        vg_t_nk.add([vi], 0.75, 'REPLACE')
        vg_t_sp1.add([vi], 0.25, 'REPLACE')
    elif z > 0.66:
        vg_t_sp1.add([vi], 0.90, 'REPLACE')
        vg_t_sp.add([vi], 0.10, 'REPLACE')
    else:
        vg_t_sp1.add([vi], 0.20, 'REPLACE')
        vg_t_sp.add([vi], 0.80, 'REPLACE')

obj_tie.data.materials.append(mat_tie)
apply_solidify_outline(obj_tie, mat_outline, thickness=0.003)
print("Red tie created.")

# -------------------------------------------------------------------------
# 4. TAILORED SLACKS & BELT
# -------------------------------------------------------------------------
print("Constructing Tailored Slacks & Belt...")
bm_p = bmesh.new()

N_PELV = 16
pelvis_profiles = [
    # (z, rx, ry, off_y, w_hp, w_sp)
    (0.555, 0.146, 0.120, -0.005, 0.80, 0.20),
    (0.525, 0.150, 0.124, -0.005, 0.95, 0.05),
    (0.470, 0.156, 0.130, -0.005, 1.00, 0.00),
]

pelv_rings = []
pelv_w = []
for z, rx, ry, off_y, w_hp, w_sp in pelvis_profiles:
    ring = []
    for i in range(N_PELV):
        ang = (i / float(N_PELV)) * 2.0 * math.pi
        vx = math.cos(ang) * rx
        vy = off_y + math.sin(ang) * ry
        vz = z
        v = bm_p.verts.new(mathutils.Vector((vx, vy, vz)))
        ring.append(v)
        pelv_w.append((v, {'Hips': w_hp, 'Spine': w_sp}))
    pelv_rings.append(ring)

for r in range(len(pelv_rings) - 1):
    for i in range(N_PELV):
        i_next = (i + 1) % N_PELV
        bm_p.faces.new([pelv_rings[r][i], pelv_rings[r][i_next], pelv_rings[r+1][i_next], pelv_rings[r+1][i]])

N_PL = 12
leg_steps = [
    # (z, rx, ry, off_y, w_hips, w_upleg, w_leg)
    (0.460, 0.086, 0.080, -0.005, 0.40, 0.60, 0.00),
    (0.380, 0.092, 0.086, -0.005, 0.00, 0.90, 0.10),
    (0.280, 0.094, 0.088, -0.010, 0.00, 0.50, 0.50), # Exact knee joint (Z=0.280, Y=-0.010)
    (0.180, 0.088, 0.082,  0.000, 0.00, 0.10, 0.90), # Shin
    (0.080, 0.080, 0.076,  0.000, 0.00, 0.00, 1.00), # Ankle cuff
]

def build_leg(bm, is_left):
    sign = 1.0 if is_left else -1.0
    up_bone = 'LeftUpLeg' if is_left else 'RightUpLeg'
    lo_bone = 'LeftLeg' if is_left else 'RightLeg'
    leg_cx = sign * 0.085
    
    rings = []
    w_list = []
    for z, rx, ry, off_y, w_hp, w_up, w_lo in leg_steps:
        ring = []
        for i in range(N_PL):
            ang = (i / float(N_PL)) * 2.0 * math.pi
            vx = leg_cx + math.cos(ang) * rx
            vy = off_y + math.sin(ang) * ry
            vz = z
            v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
            ring.append(v)
            w_list.append((v, {'Hips': w_hp, up_bone: w_up, lo_bone: w_lo}))
        rings.append(ring)
        
    for r in range(len(rings) - 1):
        for i in range(N_PL):
            i_next = (i + 1) % N_PL
            bm.faces.new([rings[r][i], rings[r][i_next], rings[r+1][i_next], rings[r+1][i]])
    return rings, w_list

r_l, w_l = build_leg(bm_p, True)
r_r, w_r = build_leg(bm_p, False)

for i in range(N_PL):
    i_next = (i + 1) % N_PL
    p_idx_l = int((i / float(N_PL)) * (N_PELV // 2))
    p_next_l = (p_idx_l + 1) % N_PELV
    try:
        bm_p.faces.new([r_l[0][i], r_l[0][i_next], pelv_rings[-1][p_next_l], pelv_rings[-1][p_idx_l]])
    except: pass
    
    p_idx_r = (N_PELV // 2) + int((i / float(N_PL)) * (N_PELV // 2))
    p_next_r = (p_idx_r + 1) % N_PELV
    try:
        bm_p.faces.new([r_r[0][i], r_r[0][i_next], pelv_rings[-1][p_next_r], pelv_rings[-1][p_idx_r]])
    except: pass

# 3D Brass Buckle at front center
bmesh.ops.create_cube(
    bm_p, size=1.0,
    matrix=(
        mathutils.Matrix.Translation((0.0, -0.134, 0.540)) @
        mathutils.Matrix.Diagonal((0.044, 0.016, 0.034, 1.0))
    )
)

bm_p.verts.index_update()
bm_p.verts.ensure_lookup_table()
final_pants_weights = [(v.index, w) for v, w in pelv_w + w_l + w_r]

mesh_pants = bpy.data.meshes.new('Larry_Pants_Mesh')
bm_p.to_mesh(mesh_pants)
bm_p.free()

obj_pants = bpy.data.objects.new('Larry_Slacks', mesh_pants)
bpy.context.collection.objects.link(obj_pants)
obj_pants.parent = arm
mod_arm_p = obj_pants.modifiers.new('Armature', 'ARMATURE')
mod_arm_p.object = arm

for b in ['Hips', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg', 'Spine']:
    obj_pants.vertex_groups.new(name=b)

for v_idx, weights in final_pants_weights:
    for b_name, weight in weights.items():
        if weight > 0.001:
            obj_pants.vertex_groups[b_name].add([v_idx], weight, 'REPLACE')

for v in mesh_pants.vertices:
    if v.index >= len(final_pants_weights):
        obj_pants.vertex_groups['Hips'].add([v.index], 0.7, 'REPLACE')
        obj_pants.vertex_groups['Spine'].add([v.index], 0.3, 'REPLACE')

obj_pants.data.materials.append(mat_slacks)
obj_pants.data.materials.append(mat_belt)
obj_pants.data.materials.append(mat_buckle)

for poly in mesh_pants.polygons:
    cz = poly.center.z
    cy = poly.center.y
    cx = abs(poly.center.x)
    if cz > 0.525 and cy < -0.125 and cx < 0.030:
        poly.material_index = 2 # Brass buckle
    elif cz > 0.515:
        poly.material_index = 1 # Belt
    else:
        poly.material_index = 0 # Slacks

apply_solidify_outline(obj_pants, mat_outline, thickness=0.006)
print("Slacks created.")

# -------------------------------------------------------------------------
# 5. DARK OXFORD SHOES
# -------------------------------------------------------------------------
print("Constructing Oxford Shoes...")
bm_sh = bmesh.new()

for is_left in [True, False]:
    sign = 1.0 if is_left else -1.0
    foot_cx = sign * 0.090
    bmesh.ops.create_cube(
        bm_sh, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((foot_cx, -0.025, 0.045)) @
            mathutils.Matrix.Diagonal((0.082, 0.165, 0.080, 1.0))
        )
    )
    bmesh.ops.create_cube(
        bm_sh, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((foot_cx, -0.095, 0.032)) @
            mathutils.Matrix.Diagonal((0.076, 0.080, 0.055, 1.0))
        )
    )

mesh_shoes = bpy.data.meshes.new('Larry_Shoes_Mesh')
bm_sh.to_mesh(mesh_shoes)
bm_sh.free()

obj_shoes = bpy.data.objects.new('Larry_Shoes', mesh_shoes)
bpy.context.collection.objects.link(obj_shoes)
obj_shoes.parent = arm
mod_arm_sh = obj_shoes.modifiers.new('Armature', 'ARMATURE')
mod_arm_sh.object = arm

vg_lfoot = obj_shoes.vertex_groups.new(name='LeftFoot')
vg_rfoot = obj_shoes.vertex_groups.new(name='RightFoot')

for vi, v in enumerate(mesh_shoes.vertices):
    if v.co.x > 0:
        vg_lfoot.add([vi], 1.0, 'REPLACE')
    else:
        vg_rfoot.add([vi], 1.0, 'REPLACE')

obj_shoes.data.materials.append(mat_shoes)
apply_solidify_outline(obj_shoes, mat_outline, thickness=0.005)
print("Shoes created.")

# -------------------------------------------------------------------------
# 6. NEAT IT HAIRCUT (Full Coverage short01)
# -------------------------------------------------------------------------
print("Fitting Neat IT Haircut...")
hair_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\hair"
bpy.ops.wm.obj_import(filepath=os.path.join(hair_dir, "short01", "short01.obj"))
h_obj = bpy.context.selected_objects[0]
h_obj.name = "Larry_Hair"
h_obj.rotation_euler[0] = math.radians(90)
bpy.ops.object.transform_apply(rotation=True)

xs = [v.co.x for v in h_obj.data.vertices]
ys = [v.co.y for v in h_obj.data.vertices]
zs = [v.co.z for v in h_obj.data.vertices]
w_orig = max(xs) - min(xs)
d_orig = max(ys) - min(ys)

scale_x = 0.535 / w_orig
scale_y = 0.510 / d_orig
scale_z = scale_x

cx = (max(xs) + min(xs)) / 2.0
cy = (max(ys) + min(ys)) / 2.0
z_max = max(zs)

for v in h_obj.data.vertices:
    v.co.x = (v.co.x - cx) * scale_x
    v.co.y = (v.co.y - cy) * scale_y * 1.10 - 0.005
    v.co.z = 1.285 + (v.co.z - z_max) * scale_z * 0.96
h_obj.data.update()

h_obj.parent = arm
h_mod = h_obj.modifiers.new('Armature', 'ARMATURE')
h_mod.object = arm
vg_h = h_obj.vertex_groups.new(name='Head')
vg_h.add(list(range(len(h_obj.data.vertices))), 1.0, 'REPLACE')

h_obj.data.materials.clear()
h_obj.data.materials.append(mat_hair)
apply_solidify_outline(h_obj, mat_outline, thickness=0.005)
print("Hair fitted.")

# -------------------------------------------------------------------------
# 7. SAVE MASTER MODEL & RENDER DYNAMIC ANIMATION VERIFICATION
# -------------------------------------------------------------------------
out_blend = os.path.abspath('flesh_larry_technician.blend')
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
print(f"Saved master Larry model to {out_blend}!")

cam = bpy.data.objects['RenderCam']
rot = bpy.data.objects['Cam_Rot_Empty']
tgt = bpy.data.objects['CamTarget']

rot.location = (0.0, -1.20, 0.62)
tgt.location = (0.0, -1.20, 0.62)
cam.location = (0.0, -2.15, 0.25)
cam.data.lens = 45.0

arm.data.pose_position = 'POSE'

os.makedirs('artifacts/verification', exist_ok=True)

test_actions = [
    ("Walk_Loop", 4, "walk_f4"),
    ("Sprint_Loop", 4, "sprint_f4"),
    ("Fixing_Kneeling", 4, "repair_f4")
]

for act_name, frame, label in test_actions:
    act = bpy.data.actions.get(act_name)
    if not act:
        continue
    arm.animation_data.action = act
    if hasattr(act, 'slots') and len(act.slots) > 0:
        arm.animation_data.action_slot = act.slots[0]
        
    scene.frame_set(frame)
    for deg in [0, 45, 90, 180]:
        rot.rotation_euler[2] = math.radians(deg)
        bpy.context.view_layer.update()
        scene.render.filepath = os.path.abspath(f'artifacts/verification/dynamic_{label}_{deg}.png')
        bpy.ops.render.render(write_still=True)
    print(f"Rendered dynamic verification for {label}")
