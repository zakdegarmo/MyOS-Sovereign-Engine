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
    ramp.color_ramp.elements[1].position = 0.38
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
mat_eye_bag    = make_cel_material("Eye_Bags",   (0.56, 0.36, 0.30, 1.0), (0.34, 0.20, 0.16, 1.0))
mat_pupil_blk  = make_cel_material("Eye_Pupil",  (0.01, 0.01, 0.01, 1.0), (0.00, 0.00, 0.00, 1.0))
mat_specular   = make_emission_material("Eye_Spec", (1.0, 1.0, 1.0, 1.0), strength=2.0)
mat_nose_pink  = make_cel_material("Nose_Pink",  (0.85, 0.38, 0.40, 1.0), (0.50, 0.20, 0.22, 1.0), (0.98, 0.60, 0.62, 1.0))
mat_mouth_dark = make_cel_material("Mouth_Dark", (0.06, 0.01, 0.02, 1.0), (0.02, 0.00, 0.01, 1.0))
mat_teeth_corn = make_cel_material("Teeth_Corn", (0.96, 0.95, 0.86, 1.0), (0.75, 0.72, 0.60, 1.0), (1.00, 1.00, 0.96, 1.0))
mat_paw_pad    = make_cel_material("Paw_Pad",    (0.28, 0.24, 0.26, 1.0), (0.15, 0.12, 0.13, 1.0))
mat_joint_pap  = make_cel_material("Joint_Pap",  (0.94, 0.91, 0.84, 1.0), (0.64, 0.62, 0.56, 1.0))
mat_cherry_lit = make_emission_material("Cherry_Lit", (1.0, 0.30, 0.01, 1.0), strength=20.0)
mat_smoke_puff = make_cel_material("Smoke_Puff", (0.88, 0.88, 0.92, 1.0), (0.55, 0.56, 0.62, 1.0))

col = bpy.context.collection

# ─── 2. SKELETAL ARMATURE CREATION ──────────────────────────────────────────
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

# Jaw bone (hinged at back of jaw, pointing forward/down to chin)
b_jaw = eb.new("Jaw")
b_jaw.head = (0, -0.22, 1.15)
b_jaw.tail = (0, -0.46, 0.96)
b_jaw.parent = b_head

# Left Arm (Holding joint)
b_uarm_l = eb.new("UpperArm.L")
b_uarm_l.head = (-0.28, -0.05, 0.95)
b_uarm_l.tail = (-0.42, -0.15, 0.72)
b_uarm_l.parent = b_chest

b_farm_l = eb.new("Forearm.L")
b_farm_l.head = (-0.42, -0.15, 0.72)
b_farm_l.tail = (-0.56, -0.32, 0.94)
b_farm_l.parent = b_uarm_l

b_hand_l = eb.new("Hand.L")
b_hand_l.head = (-0.56, -0.32, 0.94)
b_hand_l.tail = (-0.68, -0.42, 1.04)
b_hand_l.parent = b_farm_l

# Right Arm (Floor rest)
b_uarm_r = eb.new("UpperArm.R")
b_uarm_r.head = (0.28, 0.05, 0.95)
b_uarm_r.tail = (0.44, 0.08, 0.65)
b_uarm_r.parent = b_chest

b_farm_r = eb.new("Forearm.R")
b_farm_r.head = (0.44, 0.08, 0.65)
b_farm_r.tail = (0.60, 0.10, 0.38)
b_farm_r.parent = b_uarm_r

b_hand_r = eb.new("Hand.R")
b_hand_r.head = (0.60, 0.10, 0.38)
b_hand_r.tail = (0.68, 0.12, 0.20)
b_hand_r.parent = b_farm_r

# Giant Tail Chain
b_t1 = eb.new("Tail.1")
b_t1.head = (0, 0.28, 0.30)
b_t1.tail = (0.14, 0.50, 0.55)
b_t1.parent = b_spine

b_t2 = eb.new("Tail.2")
b_t2.head = (0.14, 0.50, 0.55)
b_t2.tail = (0.30, 0.70, 0.92)
b_t2.parent = b_t1

b_t3 = eb.new("Tail.3")
b_t3.head = (0.30, 0.70, 0.92)
b_t3.tail = (0.38, 0.65, 1.38)
b_t3.parent = b_t2

b_t4 = eb.new("Tail.4")
b_t4.head = (0.38, 0.65, 1.38)
b_t4.tail = (0.20, 0.40, 1.75)
b_t4.parent = b_t3

b_ttip = eb.new("Tail.Tip")
b_ttip.head = (0.20, 0.40, 1.75)
b_ttip.tail = (0.04, 0.25, 1.95)
b_ttip.parent = b_t4

bpy.ops.object.mode_set(mode='OBJECT')

# Safe bone parenting helper that preserves exact world transforms
def make_bone_mesh(primitive_func, name, bone_name, world_loc, scale=(1,1,1), rot=(0,0,0), mat=None, smooth=False):
    primitive_func()
    obj = bpy.context.active_object
    obj.name = name
    obj.location = world_loc
    obj.rotation_euler = rot
    obj.scale = scale
    if mat:
        obj.data.materials.append(mat)
    if smooth:
        bpy.ops.object.shade_smooth()
    
    # Bone parenting preserving world transform
    arm_data.bones.active = arm_data.bones[bone_name]
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.parent_set(type='BONE')
    bpy.context.view_layer.update()
    return obj

# ─── 3. MESH CONSTRUCTION AT PRECISE WORLD POSITIONS ─────────────────────────

# 3A. TORSO & SUIT (Chest & Spine)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.45, segments=24, ring_count=16),
    "Suit_Jacket", "Chest", (0, 0.04, 0.54), scale=(1.05, 0.82, 1.15), mat=mat_suit_char, smooth=True
)

make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.52, vertices=16),
    "Dress_Shirt", "Chest", (0, -0.22, 0.64), scale=(0.72, 0.38, 0.92), mat=mat_shirt_off, smooth=True
)

for side, x, rot_y in [("L", -0.18, math.radians(-16)), ("R", 0.18, math.radians(16))]:
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.1),
        f"Lapel_{side}", "Chest", (x, -0.30, 0.66),
        scale=(0.85, 0.25, 3.2),
        rot=(math.radians(-10), rot_y, math.radians(-6 if side == "L" else 6)),
        mat=mat_suit_char
    )

make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=0.1),
    "Necktie", "Chest", (0.0, -0.34, 0.58),
    scale=(0.65, 0.12, 3.4), rot=(math.radians(-6), 0, math.radians(2)),
    mat=mat_tie_black
)

make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.065, depth=0.08, vertices=12),
    "Tie_Knot", "Chest", (0.0, -0.33, 0.77),
    rot=(math.radians(180), 0, 0), mat=mat_tie_black
)

make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_torus_add(major_radius=0.40, minor_radius=0.035, major_segments=24, minor_segments=8),
    "Belt", "Spine", (0, 0, 0.28), scale=(1.05, 0.88, 0.90), mat=mat_belt_strap
)

make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=0.08),
    "Belt_Buckle_Gold", "Spine", (0, -0.36, 0.28), scale=(1.3, 0.25, 0.85), mat=mat_belt_gold
)

# 3B. HEAD, EARS, EYES & NOSE (Head Bone)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.52, segments=32, ring_count=20),
    "Head_Base", "Head", (0, 0, 1.25), scale=(1.12, 0.95, 0.92), mat=mat_black_fur, smooth=True
)

# Cheek Jowls
cheek_tufts = [
    (-0.02,  0.02, (0.30, 0.22, 0.50),  45, -10),
    (-0.08, -0.12, (0.36, 0.24, 0.56),  60,   5),
    (-0.14, -0.25, (0.32, 0.22, 0.48),  50,  20),
    (-0.10, -0.36, (0.26, 0.18, 0.40),  35,  35),
]
for side, sign in [("L", -1), ("R", 1)]:
    for i, (yo, zo, sc, rz, ry) in enumerate(cheek_tufts):
        make_bone_mesh(
            lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.22, depth=0.60, vertices=10),
            f"Jowl_{side}_{i}", "Head", (sign * (0.44 + sc[0]*0.48), yo, 1.25 + zo),
            scale=sc, rot=(0, math.radians(sign * ry), math.radians(sign * rz + (0 if sign==1 else 180))),
            mat=mat_black_fur
        )

# Crown Hair Spikes
for i, (cx, cy, cz, cscale, crot) in enumerate([
    (-0.10, 0.02, 1.77, (0.10, 0.10, 0.36), -18),
    ( 0.00, 0.05, 1.83, (0.13, 0.13, 0.45),   0),
    ( 0.10, 0.02, 1.77, (0.10, 0.10, 0.36),  18),
    ( 0.04, 0.10, 1.79, (0.09, 0.09, 0.30),  10),
]):
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.15, depth=0.45, vertices=8),
        f"Crown_Hair_{i}", "Head", (cx, cy, cz),
        scale=cscale, rot=(math.radians(-12), math.radians(crot), 0),
        mat=mat_black_fur
    )

# Floppy Ears
for side, x in [("L", -0.44), ("R", 0.44)]:
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, segments=16, ring_count=12),
        f"Ear_{side}", "Head", (x, 0.06, 1.63),
        scale=(0.48, 0.30, 1.40),
        rot=(math.radians(22), math.radians(-38 if side == "L" else 38), math.radians(-18 if side == "L" else 18)),
        mat=mat_black_fur, smooth=True
    )

# Bulging Crazed Eyes
for side, x in [("L", -0.22), ("R", 0.22)]:
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.19, segments=32, ring_count=20),
        f"Eyeball_{side}", "Head", (x, -0.37, 1.37),
        scale=(0.95, 0.65, 1.10), mat=mat_eye_white, smooth=True
    )
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, segments=20, ring_count=14),
        f"Eye_Bag_{side}", "Head", (x, -0.39, 1.25),
        scale=(1.10, 0.40, 0.45), rot=(math.radians(-10), 0, 0),
        mat=mat_eye_bag, smooth=True
    )
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, segments=16, ring_count=12),
        f"Pupil_{side}", "Head", (x * 0.94, -0.49, 1.37),
        mat=mat_pupil_blk
    )
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.018, segments=10, ring_count=8),
        f"Eye_Spec_{side}", "Head", (x * 0.94 - 0.018, -0.52, 1.40),
        mat=mat_specular
    )
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.05),
        f"Eyebrow_{side}", "Head", (x, -0.42, 1.55),
        scale=(2.2, 0.35, 0.6),
        rot=(0, math.radians(-24 if side == "L" else 24), math.radians(12 if side == "L" else -12)),
        mat=mat_black_fur
    )

# Bulbous Mauve/Pink Nose
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.085, segments=24, ring_count=16),
    "Nose_Bulb", "Head", (0, -0.50, 1.27),
    scale=(1.30, 0.80, 0.80), mat=mat_nose_pink, smooth=True
)

# 3C. THE MOUTH & ALIGNED TEETH (Head & Jaw Bones)
# Warm Tan Muzzle (Smooth dome below nose, framing the mouth)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.36, segments=32, ring_count=24),
    "Muzzle_Tan_Base", "Head", (0, -0.27, 1.21),
    scale=(1.25, 0.70, 0.78), mat=mat_muzzle_tan, smooth=True
)

# Recessed Dark Oral Cavity (Behind teeth inside the smile)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.34, depth=0.08, vertices=32),
    "Mouth_Dark_Cavity", "Head", (0, -0.46, 1.09),
    scale=(1.18, 0.24, 0.38), rot=(math.radians(90), 0, 0),
    mat=mat_mouth_dark, smooth=True
)

# 10 UPPER TEETH (Snugly lining the upper jaw inside the mouth cavity)
num_teeth = 10
for t_i in range(num_teeth):
    frac = (t_i - (num_teeth - 1) / 2.0) / ((num_teeth - 1) / 2.0) # -1.0 to 1.0
    tx = frac * 0.30
    ty = -0.508 + (tx * tx) * 0.32
    tz_smile = (1.0 - frac * frac) * 0.012
    trot_z = tx * -35.0

    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.046),
        f"Tooth_U_{t_i}", "Head", (tx, ty, 1.116 + tz_smile),
        scale=(1.08, 0.38, 1.25), rot=(math.radians(-6), 0, math.radians(trot_z)),
        mat=mat_teeth_corn
    )

# 10 LOWER TEETH (Snugly lining the lower jaw inside the mouth cavity, parented to Jaw)
for t_i in range(num_teeth):
    frac = (t_i - (num_teeth - 1) / 2.0) / ((num_teeth - 1) / 2.0)
    tx = frac * 0.29
    ty = -0.504 + (tx * tx) * 0.32
    tz_smile = (1.0 - frac * frac) * 0.010
    trot_z = tx * -35.0

    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.044),
        f"Tooth_L_{t_i}", "Jaw", (tx, ty, 1.066 + tz_smile),
        scale=(1.06, 0.38, 1.20), rot=(math.radians(6), 0, math.radians(trot_z)),
        mat=mat_teeth_corn
    )

# Chin & Scruffy Goatee (attached to Jaw bone)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, segments=20, ring_count=14),
    "Chin_Goatee", "Jaw", (0, -0.42, 0.98),
    scale=(1.25, 0.65, 0.55), mat=mat_black_fur, smooth=True
)

# 3D. ARMS, PAWS & WEED JOINT
# Right arm (Floor rest)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.48, vertices=14),
    "Arm_Sleeve_R", "UpperArm.R", (0.46, 0.08, 0.48),
    rot=(math.radians(20), math.radians(-32), math.radians(-25)),
    mat=mat_suit_char
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, segments=14, ring_count=10),
    "Paw_R", "Hand.R", (0.68, 0.12, 0.20),
    scale=(1.1, 1.3, 0.7), mat=mat_black_fur
)

# Left arm (Holding weed joint & gesticulating)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.48, vertices=14),
    "Arm_Sleeve_L", "UpperArm.L", (-0.40, -0.14, 0.66),
    rot=(math.radians(-50), math.radians(38), math.radians(30)),
    mat=mat_suit_char
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, segments=14, ring_count=10),
    "Paw_L", "Hand.L", (-0.56, -0.34, 0.92),
    mat=mat_black_fur
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.12, vertices=8),
    "Finger_Index", "Hand.L", (-0.62, -0.38, 0.97),
    rot=(math.radians(30), math.radians(-25), 0),
    mat=mat_black_fur
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.11, vertices=8),
    "Finger_Thumb", "Hand.L", (-0.58, -0.40, 0.94),
    rot=(math.radians(-20), math.radians(-10), 0),
    mat=mat_black_fur
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.22, vertices=10),
    "Weed_Joint", "Hand.L", (-0.67, -0.42, 1.01),
    rot=(math.radians(-35), math.radians(45), math.radians(-20)),
    mat=mat_joint_pap
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.032, segments=12, ring_count=8),
    "Cherry_Ember", "Hand.L", (-0.74, -0.48, 1.08),
    mat=mat_cherry_lit
)

for s_i, (spos, srad) in enumerate([
    ((-0.75, -0.48, 1.14), 0.026),
    ((-0.77, -0.46, 1.21), 0.042),
    ((-0.81, -0.43, 1.29), 0.056),
    ((-0.78, -0.41, 1.37), 0.046),
]):
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=srad, segments=10, ring_count=8),
        f"Smoke_{s_i}", "Hand.L", spos, mat=mat_smoke_puff, smooth=True
    )

# 3E. SITTING LEGS & PAWS (Root Bone)
for side, sign in [("L", -1), ("R", 1)]:
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.50, vertices=14),
        f"Leg_{side}", "Root", (sign * 0.38, -0.20, 0.20),
        rot=(math.radians(68), 0, math.radians(sign * -28)),
        mat=mat_suit_char
    )
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, segments=16, ring_count=12),
        f"Foot_{side}", "Root", (sign * 0.52, -0.48, 0.14),
        scale=(0.90, 1.65, 0.70), rot=(math.radians(-15), 0, math.radians(sign * 18)),
        mat=mat_black_fur
    )
    for toe_i in range(3):
        tx = sign * (0.45 + toe_i * 0.07)
        make_bone_mesh(
            lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.038, segments=10, ring_count=8),
            f"Toe_{side}_{toe_i}", "Root", (tx, -0.60, 0.10),
            mat=mat_paw_pad
        )

# 3F. GIANT BUSHY TAIL (Tail Bones 1..Tip)
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
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=trad, segments=22, ring_count=16),
        f"Tail_Part_{idx}", bname, tpos,
        scale=tscale, rot=(0, math.radians(trot_y), 0),
        mat=mat_black_fur, smooth=True
    )
    if hastuft:
        make_bone_mesh(
            lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.20, depth=0.45, vertices=8),
            f"Tail_Tuft_{idx}", bname, (tpos[0] + 0.32, tpos[1] + 0.12, tpos[2]),
            rot=(0, math.radians(35), math.radians(20)),
            mat=mat_black_fur
        )

# ─── 4. LIGHTING RIG & CALIBRATED CAMERA FRAMING ────────────────────────────
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
    ("Rim_Back_L",  "POINT", (-2.2,  2.5, 3.2), 95.0, (1.00, 0.78, 0.50)),
    ("Rim_Back_R",  "POINT", ( 2.2,  2.5, 3.2), 95.0, (0.70, 0.90, 1.00)),
    ("Bounce_Rug",  "POINT", ( 0.0, -1.2, -0.4), 45.0, (0.90, 0.65, 0.50)),
]
for lname, ltype, lpos, lenergy, lcolor in lights:
    ld = bpy.data.lights.new(name=lname, type=ltype)
    ld.energy = lenergy
    ld.color = lcolor
    lo = bpy.data.objects.new(name=lname, object_data=ld)
    lo.location = lpos
    col.objects.link(lo)

# Calibrated Volumetric Target: (0, 0, 1.02)
target = bpy.data.objects.new("Cam_Target", None)
target.location = (0, 0, 1.02)
col.objects.link(target)

# Calibrated Camera: Distance 3.8m, Lens 36mm, Vertical Sensor 24mm
# Gives full vertical range Z = -0.24m to Z = 2.28m, comfortably framing feet (0.0) to tail peak (2.02) with 12% safety margin
cam_data = bpy.data.cameras.new("Main_Camera")
cam_data.type = "PERSP"
cam_data.lens = 36
cam_data.sensor_fit = 'VERTICAL'
cam_data.sensor_height = 24
cam_obj = bpy.data.objects.new("Main_Camera", cam_data)
cam_obj.location = (0.0, -3.8, 1.02)
col.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

tt = cam_obj.constraints.new(type="TRACK_TO")
tt.target = target
tt.track_axis = "TRACK_NEGATIVE_Z"
tt.up_axis = "UP_Y"

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

out_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\hemp_crew"
os.makedirs(out_dir, exist_ok=True)

# 1. Front View Preview
cam_obj.location = (0.0, -3.8, 1.02)
scene.render.filepath = os.path.join(out_dir, "frankie_actor_front.png")
bpy.ops.render.render(write_still=True)
print("Rendered Calibrated Front View:", scene.render.filepath)

# 2. Isometric 3/4 View Preview
cam_obj.location = (2.4, -3.0, 1.45)
scene.render.filepath = os.path.join(out_dir, "frankie_actor_iso.png")
bpy.ops.render.render(write_still=True)
print("Rendered Calibrated Iso View:", scene.render.filepath)

# Save Master Blend
blend_path = os.path.join(out_dir, "frankie_actor_master.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("Saved Master Rigged Blend at:", blend_path)
