import bpy
import math
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

# ─── 1. CEL SHADING MATERIALS ────────────────────────────────────────────────
def make_cel_material(name, color_base, color_shadow=None, color_hi=None, roughness=0.5):
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = color_base
    bsdf.inputs["Roughness"].default_value = roughness

    s2rgb = nodes.new("ShaderNodeShaderToRGB")
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"

    if color_shadow is None:
        color_shadow = (color_base[0] * 0.42, color_base[1] * 0.42, color_base[2] * 0.42, 1.0)
    if color_hi is None:
        color_hi = color_base

    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = color_shadow
    ramp.color_ramp.elements[1].position = 0.40
    ramp.color_ramp.elements[1].color = color_base

    elem_hi = ramp.color_ramp.elements.new(0.85)
    elem_hi.color = color_hi

    links.new(bsdf.outputs["BSDF"], s2rgb.inputs["Shader"])
    links.new(s2rgb.outputs["Color"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], out.inputs["Surface"])
    return mat

def make_emission_material(name, color, strength=15.0):
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = color
    emit.inputs["Strength"].default_value = strength
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat

mat_black_fur  = make_cel_material("Black_Fur",  (0.20, 0.19, 0.22, 1.0), (0.08, 0.07, 0.09, 1.0), (0.34, 0.32, 0.36, 1.0))
mat_muzzle_tan = make_cel_material("Muzzle_Tan", (0.72, 0.52, 0.38, 1.0), (0.45, 0.30, 0.18, 1.0), (0.88, 0.70, 0.54, 1.0))
mat_suit_char  = make_cel_material("Suit_Grey",  (0.44, 0.45, 0.48, 1.0), (0.22, 0.23, 0.26, 1.0), (0.62, 0.63, 0.66, 1.0))
mat_shirt_off  = make_cel_material("Shirt_Off",  (0.95, 0.93, 0.88, 1.0), (0.68, 0.65, 0.58, 1.0), (1.00, 1.00, 1.00, 1.0))
mat_tie_black  = make_cel_material("Tie_Black",  (0.08, 0.07, 0.09, 1.0), (0.03, 0.02, 0.04, 1.0), (0.22, 0.20, 0.24, 1.0))
mat_belt_gold  = make_cel_material("Belt_Gold",  (0.92, 0.72, 0.18, 1.0), (0.50, 0.35, 0.08, 1.0), (1.00, 0.90, 0.45, 1.0))
mat_belt_strap = make_cel_material("Belt_Strap", (0.10, 0.09, 0.10, 1.0), (0.04, 0.04, 0.04, 1.0))
mat_eye_white  = make_cel_material("Eye_White",  (0.98, 0.97, 0.94, 1.0), (0.85, 0.82, 0.76, 1.0), (1.00, 1.00, 1.00, 1.0))
mat_eye_bag    = make_cel_material("Eye_Bags",   (0.52, 0.32, 0.28, 1.0), (0.30, 0.18, 0.14, 1.0))
mat_pupil_blk  = make_cel_material("Eye_Pupil",  (0.01, 0.01, 0.01, 1.0), (0.00, 0.00, 0.00, 1.0))
mat_specular   = make_emission_material("Eye_Spec", (1.0, 1.0, 1.0, 1.0), strength=2.0)
mat_nose_pink  = make_cel_material("Nose_Pink",  (0.85, 0.38, 0.40, 1.0), (0.50, 0.20, 0.22, 1.0), (0.98, 0.60, 0.62, 1.0))
mat_mouth_dark = make_cel_material("Mouth_Dark", (0.05, 0.01, 0.02, 1.0), (0.02, 0.00, 0.01, 1.0))
mat_teeth_corn = make_cel_material("Teeth_Corn", (0.94, 0.92, 0.82, 1.0), (0.72, 0.68, 0.54, 1.0), (0.98, 0.97, 0.92, 1.0))
mat_paw_pad    = make_cel_material("Paw_Pad",    (0.28, 0.24, 0.26, 1.0), (0.15, 0.12, 0.13, 1.0))
mat_joint_pap  = make_cel_material("Joint_Pap",  (0.94, 0.91, 0.84, 1.0), (0.64, 0.62, 0.56, 1.0))
mat_cherry_lit = make_emission_material("Cherry_Lit", (1.0, 0.30, 0.01, 1.0), strength=20.0)
mat_smoke_puff = make_cel_material("Smoke_Puff", (0.88, 0.88, 0.92, 1.0), (0.55, 0.56, 0.62, 1.0))

col = bpy.context.collection

# ─── 2. ARMATURE SKELETON ───────────────────────────────────────────────────
arm_data = bpy.data.armatures.new("Frankie_Armature_Data")
arm_obj  = bpy.data.objects.new("Frankie_Armature", arm_data)
col.objects.link(arm_obj)
bpy.context.view_layer.objects.active = arm_obj

bpy.ops.object.mode_set(mode='EDIT')
eb = arm_data.edit_bones

b_root = eb.new("Root")
b_root.head = (0, 0, 0)
b_root.tail = (0, 0, 0.28)

b_spine = eb.new("Spine")
b_spine.head = (0, 0, 0.28)
b_spine.tail = (0, 0, 0.58)
b_spine.parent = b_root

b_chest = eb.new("Chest")
b_chest.head = (0, 0, 0.58)
b_chest.tail = (0, 0, 1.08)
b_chest.parent = b_spine

b_head = eb.new("Head")
b_head.head = (0, 0, 1.08)
b_head.tail = (0, 0, 1.58)
b_head.parent = b_chest

# Dynamic Jaw bone for speech/shouting/cackling
b_jaw = eb.new("Jaw")
b_jaw.head = (0, -0.20, 1.12)
b_jaw.tail = (0, -0.46, 0.96)
b_jaw.parent = b_head

# Left Arm (Joint gesticulation)
b_uarm_l = eb.new("UpperArm.L")
b_uarm_l.head = (-0.35, 0, 0.92)
b_uarm_l.tail = (-0.52, -0.16, 0.72)
b_uarm_l.parent = b_chest

b_farm_l = eb.new("Forearm.L")
b_farm_l.head = (-0.52, -0.16, 0.72)
b_farm_l.tail = (-0.58, -0.32, 0.94)
b_farm_l.parent = b_uarm_l

b_hand_l = eb.new("Hand.L")
b_hand_l.head = (-0.58, -0.32, 0.94)
b_hand_l.tail = (-0.60, -0.38, 1.02)
b_hand_l.parent = b_farm_l

# Right Arm (Floor / slouch rest)
b_uarm_r = eb.new("UpperArm.R")
b_uarm_r.head = (0.35, 0, 0.92)
b_uarm_r.tail = (0.50, 0.05, 0.55)
b_uarm_r.parent = b_chest

b_farm_r = eb.new("Forearm.R")
b_farm_r.head = (0.50, 0.05, 0.55)
b_farm_r.tail = (0.62, 0.08, 0.28)
b_farm_r.parent = b_uarm_r

b_hand_r = eb.new("Hand.R")
b_hand_r.head = (0.62, 0.08, 0.28)
b_hand_r.tail = (0.68, 0.12, 0.18)
b_hand_r.parent = b_farm_r

# Giant Tail Chain
t_joints = [
    ("Tail.1", (0.00, 0.18, 0.22), (0.00, 0.35, 0.42)),
    ("Tail.2", (0.00, 0.35, 0.42), (0.14, 0.58, 0.72)),
    ("Tail.3", (0.14, 0.58, 0.72), (0.32, 0.78, 1.15)),
    ("Tail.4", (0.32, 0.78, 1.15), (0.38, 0.75, 1.58)),
    ("Tail.Tip", (0.38, 0.75, 1.58), (0.10, 0.38, 2.02)),
]
prev_b = b_root
for bname, head_pos, tail_pos in t_joints:
    b = eb.new(bname)
    b.head = head_pos
    b.tail = tail_pos
    b.parent = prev_b
    prev_b = b

bpy.ops.object.mode_set(mode='OBJECT')

def attach_mesh(create_fn, name, bone_name, world_loc, scale=(1,1,1), rot=(0,0,0), mat=None, smooth=True):
    create_fn()
    obj = bpy.context.active_object
    obj.name = name
    obj.location = world_loc
    obj.scale = scale
    obj.rotation_euler = rot
    if mat:
        obj.data.materials.clear()
        obj.data.materials.append(mat)
    if smooth:
        for poly in obj.data.polygons:
            poly.use_smooth = True
    
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.data.bones.active = arm_obj.data.bones[bone_name]
    bpy.ops.object.parent_set(type='BONE')
    bpy.ops.object.select_all(action='DESELECT')
    return obj

# ─── 3. BODY & OUTFIT MESHES ────────────────────────────────────────────────
# Plump Paunch Belly (Spine)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.48, segments=24, ring_count=16),
    "Belly_Paunch", "Spine", (0, -0.12, 0.44),
    scale=(1.05, 1.18, 0.95), mat=mat_suit_char, smooth=True
)

# Slouched Torso (Chest)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.38, depth=0.55, vertices=20),
    "Torso_Suit", "Chest", (0, -0.04, 0.82),
    scale=(1.05, 0.88, 1.00), rot=(math.radians(8), 0, 0),
    mat=mat_suit_char, smooth=True
)

# Open Collar & Wrinkled Shirt (Chest)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.26, segments=18, ring_count=12),
    "Shirt_Front", "Chest", (0, -0.22, 0.88),
    scale=(0.75, 0.45, 1.05), mat=mat_shirt_off, smooth=True
)

# Lapels
for side, sign in [("L", -1), ("R", 1)]:
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.12),
        f"Lapel_{side}", "Chest", (sign * 0.18, -0.26, 0.88),
        scale=(0.55, 0.22, 2.2), rot=(math.radians(12), math.radians(sign * -16), math.radians(sign * 20)),
        mat=mat_suit_char
    )

# Disheveled Necktie
attach_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=0.08),
    "Tie_Knot", "Chest", (0.015, -0.28, 0.96),
    scale=(0.85, 0.40, 0.70), rot=(0, 0, math.radians(-14)),
    mat=mat_tie_black
)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=0.06),
    "Tie_Drape", "Chest", (0.025, -0.30, 0.76),
    scale=(0.60, 0.25, 3.8), rot=(math.radians(6), 0, math.radians(-10)),
    mat=mat_tie_black
)

# Belt & Gold Buckle
attach_mesh(
    lambda: bpy.ops.mesh.primitive_torus_add(major_radius=0.42, minor_radius=0.038, major_segments=24, minor_segments=8),
    "Belt_Strap", "Spine", (0, -0.06, 0.38),
    scale=(1.04, 1.12, 0.75), mat=mat_belt_strap
)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=0.075),
    "Belt_Buckle", "Spine", (0, -0.48, 0.38),
    scale=(1.25, 0.35, 0.85), mat=mat_belt_gold
)

# ─── 4. HEAD, EYES & PERFECTLY ALIGNED MOUTH ────────────────────────────────
# Head Base (Head)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.42, segments=28, ring_count=20),
    "Head_Base", "Head", (0, -0.02, 1.25),
    scale=(1.05, 0.90, 1.02), mat=mat_black_fur, smooth=True
)

# Frank Gallagher Scruffy Crown Hair
for i, (cx, cy, cz, cscale, crot) in enumerate([
    (-0.20, 0.04, 1.68, (0.09, 0.09, 0.32), -26),
    (-0.10, 0.02, 1.76, (0.11, 0.11, 0.38), -16),
    ( 0.00, 0.05, 1.82, (0.13, 0.13, 0.44),   0),
    ( 0.10, 0.02, 1.76, (0.11, 0.11, 0.38),  16),
    ( 0.20, 0.04, 1.68, (0.09, 0.09, 0.32),  26),
]):
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.15, depth=0.45, vertices=8),
        f"Hair_Spike_{i}", "Head", (cx, cy, cz),
        scale=cscale, rot=(math.radians(-12), math.radians(crot), 0),
        mat=mat_black_fur
    )

# Floppy Ears
for side, x in [("L", -0.44), ("R", 0.44)]:
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, segments=16, ring_count=12),
        f"Ear_{side}", "Head", (x, 0.06, 1.63),
        scale=(0.48, 0.30, 1.40),
        rot=(math.radians(22), math.radians(-38 if side == "L" else 38), math.radians(-18 if side == "L" else 18)),
        mat=mat_black_fur, smooth=True
    )

# Crazed Bulging Eyes
for side, x in [("L", -0.22), ("R", 0.22)]:
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.19, segments=24, ring_count=16),
        f"Eyeball_{side}", "Head", (x, -0.37, 1.37),
        scale=(0.95, 0.65, 1.10), mat=mat_eye_white, smooth=True
    )
    # Purple/brown sunken tired eye bags
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, segments=16, ring_count=10),
        f"Eye_Bag_{side}", "Head", (x, -0.38, 1.25),
        scale=(1.10, 0.38, 0.45),
        rot=(math.radians(-10), 0, 0),
        mat=mat_eye_bag, smooth=True
    )
    # Pupils
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, segments=14, ring_count=10),
        f"Pupil_{side}", "Head", (x * 0.94, -0.49, 1.37),
        mat=mat_pupil_blk
    )
    # Specular glint
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.018, segments=8, ring_count=6),
        f"Eye_Spec_{side}", "Head", (x * 0.94 - 0.018, -0.52, 1.40),
        mat=mat_specular
    )
    # Bushy furrowed brows
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.05),
        f"Eyebrow_{side}", "Head", (x, -0.42, 1.55),
        scale=(2.2, 0.35, 0.6),
        rot=(0, math.radians(-24 if side == "L" else 24), math.radians(12 if side == "L" else -12)),
        mat=mat_black_fur
    )

# Bulbous Mauve Nose
attach_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.085, segments=18, ring_count=12),
    "Nose_Bulb", "Head", (0, -0.50, 1.27),
    scale=(1.28, 0.75, 0.75), mat=mat_nose_pink, smooth=True
)

# ─── 5. MOUTH & TEETH: PROPERLY ALIGNED DENTAL ARCH ─────────────────────────
# Upper Muzzle Pad (Tan Dome above mouth, below nose)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.28, segments=28, ring_count=20),
    "Muzzle_Tan_Upper", "Head", (0, -0.32, 1.22),
    scale=(1.30, 0.65, 0.65), mat=mat_muzzle_tan, smooth=True
)

# Oral Cavity Backing (Dark void inside mouth)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.08, vertices=28),
    "Mouth_Dark_Cavity", "Head", (0, -0.45, 1.10),
    scale=(1.10, 0.25, 0.38), rot=(math.radians(90), 0, 0),
    mat=mat_mouth_dark, smooth=True
)

# Lip Contours framing the mouth
attach_mesh(
    lambda: bpy.ops.mesh.primitive_torus_add(major_radius=0.26, minor_radius=0.018, major_segments=28, minor_segments=8),
    "Upper_Lip_Border", "Head", (0, -0.47, 1.15),
    scale=(1.12, 0.30, 0.30), rot=(math.radians(12), 0, 0),
    mat=mat_black_fur, smooth=True
)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_torus_add(major_radius=0.26, minor_radius=0.018, major_segments=28, minor_segments=8),
    "Lower_Lip_Border", "Jaw", (0, -0.47, 1.05),
    scale=(1.12, 0.30, 0.30), rot=(math.radians(-12), 0, 0),
    mat=mat_black_fur, smooth=True
)

# 10 UPPER TEETH: Hanging from upper jaw inside mouth cavity
# Aligned to a true dental arch: X from -0.24 to +0.24, Y curving back slightly
num_upper = 10
for i in range(num_upper):
    u = (i - (num_upper - 1) / 2.0) / ((num_upper - 1) / 2.0) # -1 to 1
    tx = u * 0.24
    # Curvature of the dental arch
    ty = -0.485 + (tx * tx) * 0.30
    tz = 1.128 + (1.0 - u * u) * 0.010
    
    # Slight size variations: front central incisors slightly larger
    is_center = (i in [4, 5])
    t_width  = 0.038 if is_center else 0.034
    t_height = 0.046 if is_center else 0.040
    t_depth  = 0.018
    rot_z = tx * -35.0
    
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
        f"Tooth_U_{i}", "Head", (tx, ty, tz),
        scale=(t_width, t_depth, t_height),
        rot=(math.radians(-6), 0, math.radians(rot_z)),
        mat=mat_teeth_corn, smooth=False
    )

# 10 LOWER TEETH: Rising from lower jaw inside mouth cavity
# Attached to Jaw bone so when jaw opens, lower teeth move down with chin!
num_lower = 10
for i in range(num_lower):
    u = (i - (num_lower - 1) / 2.0) / ((num_lower - 1) / 2.0)
    tx = u * 0.23
    ty = -0.482 + (tx * tx) * 0.30
    tz = 1.072 + (1.0 - u * u) * 0.008
    
    is_center = (i in [4, 5])
    t_width  = 0.036 if is_center else 0.032
    t_height = 0.042 if is_center else 0.036
    t_depth  = 0.018
    rot_z = tx * -35.0
    
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
        f"Tooth_L_{i}", "Jaw", (tx, ty, tz),
        scale=(t_width, t_depth, t_height),
        rot=(math.radians(6), 0, math.radians(rot_z)),
        mat=mat_teeth_corn, smooth=False
    )

# Chin & Scruffy Goatee (attached to Jaw bone)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, segments=20, ring_count=14),
    "Chin_Goatee", "Jaw", (0, -0.42, 0.98),
    scale=(1.20, 0.65, 0.55), mat=mat_black_fur, smooth=True
)

# ─── 6. ARMS, HANDS & LIT WEED JOINT ─────────────────────────────────────────
# Right Arm (Floor rest)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.48, vertices=14),
    "Arm_Sleeve_R", "UpperArm.R", (0.46, 0.08, 0.48),
    rot=(math.radians(20), math.radians(-32), math.radians(-25)),
    mat=mat_suit_char
)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, segments=14, ring_count=10),
    "Paw_R", "Hand.R", (0.68, 0.12, 0.20),
    scale=(1.1, 1.3, 0.7), mat=mat_black_fur
)

# Left Arm (Gesticulating / smoking)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.48, vertices=14),
    "Arm_Sleeve_L", "UpperArm.L", (-0.40, -0.14, 0.66),
    rot=(math.radians(-50), math.radians(38), math.radians(30)),
    mat=mat_suit_char
)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, segments=14, ring_count=10),
    "Paw_L", "Hand.L", (-0.60, -0.36, 0.98),
    scale=(1.1, 1.2, 0.75), mat=mat_black_fur
)

# Fat Rolled Weed Joint
attach_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.024, depth=0.22, vertices=12),
    "Joint_Body", "Hand.L", (-0.68, -0.42, 1.05),
    rot=(math.radians(32), math.radians(-42), math.radians(65)),
    mat=mat_joint_pap
)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.025, segments=10, ring_count=8),
    "Joint_Cherry", "Hand.L", (-0.74, -0.46, 1.11),
    mat=mat_cherry_lit
)
# Amber glow light at cherry
glow_lamp = bpy.data.lights.new("Cherry_Glow", "POINT")
glow_lamp.energy = 8.0
glow_lamp.color = (1.0, 0.35, 0.05)
glow_lamp_obj = bpy.data.objects.new("Cherry_Glow_Light", glow_lamp)
glow_lamp_obj.location = (-0.74, -0.46, 1.11)
col.objects.link(glow_lamp_obj)
glow_lamp_obj.parent = arm_obj
glow_lamp_obj.parent_type = 'BONE'
glow_lamp_obj.parent_bone = "Hand.L"

# Stylized Smoke Puffs rising from joint
for s_i, (spos, srad) in enumerate([
    ((-0.76, -0.47, 1.16), 0.026),
    ((-0.79, -0.45, 1.23), 0.040),
    ((-0.83, -0.42, 1.31), 0.054),
    ((-0.80, -0.40, 1.39), 0.044),
]):
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=srad, segments=10, ring_count=8),
        f"Smoke_{s_i}", "Hand.L", spos, mat=mat_smoke_puff, smooth=True
    )

# ─── 7. SITTING LEGS & FEET ──────────────────────────────────────────────────
for side, sign in [("L", -1), ("R", 1)]:
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.50, vertices=14),
        f"Leg_{side}", "Root", (sign * 0.38, -0.20, 0.20),
        rot=(math.radians(68), 0, math.radians(sign * -28)),
        mat=mat_suit_char
    )
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, segments=16, ring_count=12),
        f"Foot_{side}", "Root", (sign * 0.52, -0.48, 0.14),
        scale=(0.90, 1.65, 0.70), rot=(math.radians(-15), 0, math.radians(sign * 18)),
        mat=mat_black_fur
    )
    for toe_i in range(3):
        tx = sign * (0.45 + toe_i * 0.07)
        attach_mesh(
            lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.038, segments=10, ring_count=8),
            f"Toe_{side}_{toe_i}", "Root", (tx, -0.60, 0.10),
            mat=mat_paw_pad
        )

# ─── 8. GIANT BUSHY SQUIRREL TAIL ────────────────────────────────────────────
tail_curve = [
    ("Tail.1",   ( 0.00,  0.35,  0.30), 0.30, (1.0, 1.1, 1.0),   0,   False),
    ("Tail.2",   ( 0.14,  0.58,  0.52), 0.44, (1.1, 1.2, 1.1),  10,   True),
    ("Tail.3",   ( 0.30,  0.78,  0.88), 0.56, (1.2, 1.3, 1.2),  20,   True),
    ("Tail.4",   ( 0.40,  0.82,  1.30), 0.62, (1.25, 1.35, 1.2), 15,  True),
    ("Tail.Tip", ( 0.36,  0.70,  1.70), 0.58, (1.2, 1.25, 1.15), -10, False),
    ("Tail.Tip", ( 0.20,  0.48,  1.92), 0.44, (1.1, 1.15, 1.1), -30,  False),
    ("Tail.Tip", ( 0.04,  0.30,  2.02), 0.34, (1.0, 1.0, 1.0),   -45, False),
]
for idx, (bname, tpos, trad, tscale, trot_y, hastuft) in enumerate(tail_curve):
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=trad, segments=22, ring_count=16),
        f"Tail_Part_{idx}", bname, tpos,
        scale=tscale, rot=(0, math.radians(trot_y), 0),
        mat=mat_black_fur, smooth=True
    )
    if hastuft:
        attach_mesh(
            lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.20, depth=0.45, vertices=8),
            f"Tail_Tuft_{idx}", bname, (tpos[0] + 0.32, tpos[1] + 0.12, tpos[2]),
            rot=(0, math.radians(35), math.radians(20)),
            mat=mat_black_fur
        )

# ─── 9. LIGHTING & CAMERAS ──────────────────────────────────────────────────
world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.75, 0.76, 0.82, 1.0)
    bg.inputs[1].default_value = 0.85

lights = [
    ("Key_Light",   "SUN",   ( 2.2, -3.2, 4.5), 3.8,  (1.00, 0.98, 0.92)),
    ("Fill_Cool",   "SUN",   (-3.5, -2.5, 2.5), 2.2,  (0.75, 0.85, 1.00)),
    ("Rim_Back",    "SUN",   ( 0.0,  3.8, 3.2), 4.2,  (1.00, 0.96, 0.88)),
    ("Bottom_Fill", "POINT", ( 0.0, -1.8, 0.2), 18.0, (0.85, 0.82, 0.78)),
]
for lname, ltype, lpos, lpwr, lcol in lights:
    l_data = bpy.data.lights.new(lname, ltype)
    l_data.energy = lpwr
    l_data.color = lcol
    l_obj = bpy.data.objects.new(lname, l_data)
    l_obj.location = lpos
    col.objects.link(l_obj)

# Camera calibrated to include full vertical span (feet at 0 to tail at 2.05) with 15% margin
cam_data = bpy.data.cameras.new("Main_Camera_Data")
cam_data.lens = 38
cam_data.sensor_fit = 'VERTICAL'
cam_data.sensor_height = 24.0

cam_obj = bpy.data.objects.new("Main_Camera", cam_data)
col.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# Helper function to point camera at Frankie's center (0, 0, 1.05)
def aim_camera_at(cam, target_pos=(0, 0, 1.05)):
    dx = target_pos[0] - cam.location.x
    dy = target_pos[1] - cam.location.y
    dz = target_pos[2] - cam.location.z
    yaw = math.atan2(-dx, -dy)
    pitch = math.atan2(dz, math.sqrt(dx*dx + dy*dy))
    cam.rotation_euler = (math.pi/2 - pitch, 0, yaw)

# Front view test
cam_obj.location = (0, -3.8, 1.05)
aim_camera_at(cam_obj, (0, 0, 1.05))

scene = bpy.context.scene
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True

out_front = os.path.abspath(r"apps\web\public\actions\hemp_crew\frankie_actor_front.png")
scene.render.filepath = out_front
bpy.ops.render.render(write_still=True)
print(f"Rendered Front Still: {out_front}")

# Iso 3/4 view test
cam_obj.location = (2.6, -2.8, 1.8)
aim_camera_at(cam_obj, (0, 0, 1.05))
out_iso = os.path.abspath(r"apps\web\public\actions\hemp_crew\frankie_actor_iso.png")
scene.render.filepath = out_iso
bpy.ops.render.render(write_still=True)
print(f"Rendered Iso Still: {out_iso}")

# Save master rigged blend file
master_blend = os.path.abspath(r"apps\web\public\actions\hemp_crew\frankie_actor_master.blend")
bpy.ops.wm.save_as_mainfile(filepath=master_blend)
print(f"Saved Master Rigged Blend at: {master_blend}")
