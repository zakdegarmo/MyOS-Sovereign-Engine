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
    ramp.color_ramp.elements[1].position = 0.36
    ramp.color_ramp.elements[1].color = color_base

    elem_hi = ramp.color_ramp.elements.new(0.85)
    elem_hi.color = color_hi

    links.new(bsdf.outputs["BSDF"], s2rgb.inputs["Shader"])
    links.new(s2rgb.outputs["Color"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], out.inputs["Surface"])
    return mat

def make_emission_material(name, color, strength=12.0):
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
mat_muzzle_tan = make_cel_material("Muzzle_Tan", (0.70, 0.50, 0.36, 1.0), (0.45, 0.28, 0.18, 1.0), (0.88, 0.68, 0.52, 1.0))
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
mat_mouth_dark = make_cel_material("Mouth_Dark", (0.08, 0.02, 0.03, 1.0), (0.03, 0.01, 0.01, 1.0))
mat_teeth_corn = make_cel_material("Teeth_Corn", (0.96, 0.95, 0.86, 1.0), (0.75, 0.72, 0.60, 1.0), (1.00, 1.00, 0.96, 1.0))
mat_paw_pad    = make_cel_material("Paw_Pad",    (0.28, 0.24, 0.26, 1.0), (0.15, 0.12, 0.13, 1.0))
mat_joint_pap  = make_cel_material("Joint_Pap",  (0.94, 0.91, 0.84, 1.0), (0.64, 0.62, 0.56, 1.0))
mat_cherry_lit = make_emission_material("Cherry_Lit", (1.0, 0.30, 0.01, 1.0), strength=18.0)
mat_smoke_puff = make_cel_material("Smoke_Puff", (0.88, 0.88, 0.92, 1.0), (0.55, 0.56, 0.62, 1.0))

col = bpy.context.collection
root = bpy.data.objects.new("Frankie_Root", None)
col.objects.link(root)

def create_child_mesh(primitive_func, name, parent, loc, scale=(1,1,1), rot=(0,0,0), mat=None, smooth=False):
    primitive_func()
    obj = bpy.context.active_object
    obj.name = name
    obj.parent = parent
    obj.location = loc
    obj.rotation_euler = rot
    obj.scale = scale
    if mat:
        obj.data.materials.append(mat)
    if smooth:
        bpy.ops.object.shade_smooth()
    return obj

# ─── 2. TORSO & DRESS SUIT ──────────────────────────────────────────────────
torso_root = bpy.data.objects.new("Torso_Root", None)
torso_root.location = (0, 0, 0.52)
col.objects.link(torso_root)
torso_root.parent = root

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.45, segments=24, ring_count=16),
    "Suit_Jacket", torso_root, (0, 0.04, 0), scale=(1.05, 0.82, 1.15), mat=mat_suit_char, smooth=True
)

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.52, vertices=16),
    "Dress_Shirt", torso_root, (0, -0.22, 0.10), scale=(0.72, 0.38, 0.92), mat=mat_shirt_off, smooth=True
)

for side, x, rot_y in [("L", -0.18, math.radians(-16)), ("R", 0.18, math.radians(16))]:
    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.1),
        f"Lapel_{side}", torso_root, (x, -0.30, 0.12),
        scale=(0.85, 0.25, 3.2),
        rot=(math.radians(-10), rot_y, math.radians(-6 if side == "L" else 6)),
        mat=mat_suit_char
    )

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=0.1),
    "Necktie", torso_root, (0.0, -0.34, 0.04),
    scale=(0.65, 0.12, 3.4), rot=(math.radians(-6), 0, math.radians(2)),
    mat=mat_tie_black
)

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.065, depth=0.08, vertices=12),
    "Tie_Knot", torso_root, (0.0, -0.33, 0.23),
    rot=(math.radians(180), 0, 0), mat=mat_tie_black
)

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_torus_add(major_radius=0.40, minor_radius=0.035, major_segments=24, minor_segments=8),
    "Belt", torso_root, (0, 0, -0.24), scale=(1.05, 0.88, 0.90), mat=mat_belt_strap
)

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=0.08),
    "Belt_Buckle_Gold", torso_root, (0, -0.36, -0.24), scale=(1.3, 0.25, 0.85), mat=mat_belt_gold
)

# ─── 3. HEAD & CRAZED FACE ──────────────────────────────────────────────────
head_root = bpy.data.objects.new("Frankie_Head_Root", None)
head_root.location = (0, 0, 1.25)
col.objects.link(head_root)
head_root.parent = root

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.52, segments=32, ring_count=20),
    "Head_Base", head_root, (0, 0, 0), scale=(1.12, 0.95, 0.92), mat=mat_black_fur, smooth=True
)

# Flared Cheek Jowls (mutton-chop tufts flaring down & out)
cheek_tufts = [
    (-0.02,  0.02, (0.30, 0.22, 0.50),  45, -10),
    (-0.08, -0.12, (0.36, 0.24, 0.56),  60,   5),
    (-0.14, -0.25, (0.32, 0.22, 0.48),  50,  20),
    (-0.10, -0.36, (0.26, 0.18, 0.40),  35,  35),
]
for side, sign in [("L", -1), ("R", 1)]:
    for i, (yo, zo, sc, rz, ry) in enumerate(cheek_tufts):
        create_child_mesh(
            lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.22, depth=0.60, vertices=10),
            f"Jowl_{side}_{i}", head_root, (sign * (0.44 + sc[0]*0.48), yo, zo),
            scale=sc, rot=(0, math.radians(sign * ry), math.radians(sign * rz + (0 if sign==1 else 180))),
            mat=mat_black_fur
        )

# Top Hair Cowlick / Spikes
for i, (cx, cy, cz, cscale, crot) in enumerate([
    (-0.10, 0.02, 0.52, (0.10, 0.10, 0.36), -18),
    ( 0.00, 0.05, 0.58, (0.13, 0.13, 0.45),   0),
    ( 0.10, 0.02, 0.52, (0.10, 0.10, 0.36),  18),
    ( 0.04, 0.10, 0.54, (0.09, 0.09, 0.30),  10),
]):
    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.15, depth=0.45, vertices=8),
        f"Crown_Hair_{i}", head_root, (cx, cy, cz),
        scale=cscale, rot=(math.radians(-12), math.radians(crot), 0),
        mat=mat_black_fur
    )

# Floppy Ears
for side, x in [("L", -0.44), ("R", 0.44)]:
    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, segments=16, ring_count=12),
        f"Ear_{side}", head_root, (x, 0.06, 0.38),
        scale=(0.48, 0.30, 1.40),
        rot=(math.radians(22), math.radians(-38 if side == "L" else 38), math.radians(-18 if side == "L" else 18)),
        mat=mat_black_fur, smooth=True
    )

# Tan Muzzle / Snout Pad (Proud, visible warm tan muzzle)
create_child_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.34, segments=24, ring_count=16),
    "Muzzle_Tan_Base", head_root, (0, -0.28, -0.04),
    scale=(1.25, 0.72, 0.82), mat=mat_muzzle_tan, smooth=True
)

# BULGING MANIC EYES
for side, x in [("L", -0.22), ("R", 0.22)]:
    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.19, segments=24, ring_count=16),
        f"Eyeball_{side}", head_root, (x, -0.38, 0.12),
        scale=(0.95, 0.65, 1.10), mat=mat_eye_white, smooth=True
    )

    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_torus_add(major_radius=0.15, minor_radius=0.032, major_segments=16, minor_segments=8),
        f"Eye_Bag_{side}", head_root, (x, -0.40, 0.00),
        scale=(1.05, 0.45, 0.75), mat=mat_eye_bag
    )

    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_torus_add(major_radius=0.17, minor_radius=0.022, major_segments=16, minor_segments=6),
        f"Lid_Fold_{side}", head_root, (x, -0.39, 0.23),
        scale=(1.05, 0.45, 0.55), mat=mat_black_fur
    )

    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, segments=14, ring_count=10),
        f"Pupil_{side}", head_root, (x * 0.94, -0.50, 0.12),
        mat=mat_pupil_blk
    )

    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.018, segments=8, ring_count=6),
        f"Eye_Spec_{side}", head_root, (x * 0.94 - 0.018, -0.53, 0.15),
        mat=mat_specular
    )

    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.05),
        f"Eyebrow_{side}", head_root, (x, -0.42, 0.30),
        scale=(2.2, 0.35, 0.6),
        rot=(0, math.radians(-24 if side == "L" else 24), math.radians(12 if side == "L" else -12)),
        mat=mat_black_fur
    )

# Bulbous Mauve Nose
create_child_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.085, segments=18, ring_count=12),
    "Nose_Bulb", head_root, (0, -0.50, 0.02),
    scale=(1.30, 0.80, 0.80), mat=mat_nose_pink, smooth=True
)

# ─── 4. SIGNATURE WALL-TO-WALL CLENCHED DENTURE GRIN ────────────────────────
# Slim dark mouth slit background (strictly behind teeth, not oversized)
create_child_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.06, vertices=24),
    "Mouth_Dark_Back", head_root, (0, -0.49, -0.16),
    scale=(1.25, 0.22, 0.32), rot=(math.radians(90), 0, 0),
    mat=mat_mouth_dark
)

# 14 Touching Chiclet Teeth across the smile arc!
num_teeth = 13
for t_i in range(num_teeth):
    frac = (t_i - (num_teeth - 1) / 2.0) / ((num_teeth - 1) / 2.0) # -1.0 to 1.0
    tx = frac * 0.42
    ty = -0.52 + (tx * tx) * 0.20
    tz_smile = (tx * tx) * 0.06

    # Upper tooth (touching neighbor teeth snugly)
    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.038),
        f"Tooth_U_{t_i}", head_root, (tx, ty, -0.130 + tz_smile),
        scale=(1.05, 0.42, 1.40), rot=(0, 0, math.radians(-tx * 25)),
        mat=mat_teeth_corn
    )

    # Lower tooth
    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.038),
        f"Tooth_L_{t_i}", head_root, (tx, ty + 0.005, -0.185 + tz_smile),
        scale=(1.05, 0.42, 1.40), rot=(0, 0, math.radians(-tx * 25)),
        mat=mat_teeth_corn
    )

# Horizontal bite slit
create_child_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=0.01),
    "Bite_Line", head_root, (0, -0.53, -0.158),
    scale=(44.0, 0.8, 0.35), mat=mat_mouth_dark
)

# Chin & Scruffy Goatee
create_child_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, segments=16, ring_count=10),
    "Chin_Goatee", head_root, (0, -0.42, -0.27),
    scale=(1.25, 0.65, 0.55), mat=mat_black_fur, smooth=True
)

# ─── 5. ARMS, PAWS & LIT WEED JOINT (Root space) ────────────────────────────
arm_r_root = bpy.data.objects.new("Arm_R_Root", None)
arm_r_root.location = (0.42, 0.05, 0.50)
col.objects.link(arm_r_root)
arm_r_root.parent = root

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.50, vertices=14),
    "Arm_Sleeve_R", arm_r_root, (0.04, 0.03, -0.02),
    rot=(math.radians(20), math.radians(-32), math.radians(-25)),
    mat=mat_suit_char
)

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, segments=14, ring_count=10),
    "Paw_R", arm_r_root, (0.24, 0.07, -0.28),
    scale=(1.1, 1.3, 0.7), mat=mat_black_fur
)

arm_l_root = bpy.data.objects.new("Arm_L_Root", None)
arm_l_root.location = (-0.38, -0.12, 0.65)
col.objects.link(arm_l_root)
arm_l_root.parent = root

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.48, vertices=14),
    "Arm_Sleeve_L", arm_l_root, (-0.02, -0.02, 0.01),
    rot=(math.radians(-50), math.radians(38), math.radians(30)),
    mat=mat_suit_char
)

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, segments=14, ring_count=10),
    "Paw_L", arm_l_root, (-0.18, -0.22, 0.27),
    mat=mat_black_fur
)

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.12, vertices=8),
    "Finger_Index", arm_l_root, (-0.24, -0.26, 0.32),
    rot=(math.radians(30), math.radians(-25), 0),
    mat=mat_black_fur
)

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.11, vertices=8),
    "Finger_Thumb", arm_l_root, (-0.20, -0.28, 0.29),
    rot=(math.radians(-20), math.radians(-10), 0),
    mat=mat_black_fur
)

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.22, vertices=10),
    "Weed_Joint", arm_l_root, (-0.29, -0.30, 0.36),
    rot=(math.radians(-35), math.radians(45), math.radians(-20)),
    mat=mat_joint_pap
)

create_child_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.032, segments=12, ring_count=8),
    "Cherry_Ember", arm_l_root, (-0.36, -0.36, 0.43),
    mat=mat_cherry_lit
)

for s_i, (spos, srad) in enumerate([
    ((-0.37, -0.36, 0.49), 0.026),
    ((-0.39, -0.34, 0.56), 0.042),
    ((-0.43, -0.31, 0.64), 0.056),
    ((-0.40, -0.29, 0.72), 0.046),
]):
    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=srad, segments=10, ring_count=8),
        f"Smoke_{s_i}", arm_l_root, spos, mat=mat_smoke_puff, smooth=True
    )

# ─── 6. LEGS & SITTING PAWS ─────────────────────────────────────────────────
for side, sign in [("L", -1), ("R", 1)]:
    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.50, vertices=14),
        f"Leg_{side}", root, (sign * 0.38, -0.20, 0.20),
        rot=(math.radians(68), 0, math.radians(sign * -28)),
        mat=mat_suit_char
    )

    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, segments=16, ring_count=12),
        f"Foot_{side}", root, (sign * 0.52, -0.48, 0.14),
        scale=(0.90, 1.65, 0.70), rot=(math.radians(-15), 0, math.radians(sign * 18)),
        mat=mat_black_fur
    )

    for toe_i in range(3):
        tx = sign * (0.45 + toe_i * 0.07)
        create_child_mesh(
            lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.038, segments=10, ring_count=8),
            f"Toe_{side}_{toe_i}", root, (tx, -0.60, 0.10),
            mat=mat_paw_pad
        )

# ─── 7. GIANT BUSHY BLACK TAIL ──────────────────────────────────────────────
tail_root = bpy.data.objects.new("Tail_Root", None)
tail_root.location = (0, 0.35, 0.30)
col.objects.link(tail_root)
tail_root.parent = root

tail_curve = [
    (( 0.00,  0.00,  0.00), 0.30, (1.0, 1.1, 1.0),   0),
    (( 0.14,  0.23,  0.22), 0.44, (1.1, 1.2, 1.1),  10),
    (( 0.30,  0.43,  0.58), 0.56, (1.2, 1.3, 1.2),  20),
    (( 0.40,  0.47,  1.00), 0.62, (1.25, 1.35, 1.2), 15),
    (( 0.36,  0.35,  1.40), 0.58, (1.2, 1.25, 1.15), -10),
    (( 0.20,  0.13,  1.70), 0.48, (1.1, 1.15, 1.1), -30),
    (( 0.04, -0.05,  1.82), 0.36, (1.0, 1.0, 1.0),   -45),
]
for idx, (tpos, trad, tscale, trot_y) in enumerate(tail_curve):
    create_child_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=trad, segments=22, ring_count=16),
        f"Tail_Part_{idx}", tail_root, tpos,
        scale=tscale, rot=(0, math.radians(trot_y), 0),
        mat=mat_black_fur, smooth=True
    )

    if idx in [2, 3, 4]:
        create_child_mesh(
            lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.20, depth=0.45, vertices=8),
            f"Tail_Tuft_{idx}", tail_root, (tpos[0] + 0.32, tpos[1] + 0.12, tpos[2]),
            rot=(0, math.radians(35), math.radians(20)),
            mat=mat_black_fur
        )

# ─── 8. LIGHTING RIG & CAMERA ───────────────────────────────────────────────
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

target = bpy.data.objects.new("Cam_Target", None)
target.location = (0, 0, 0.90)
col.objects.link(target)

cam_data = bpy.data.cameras.new("Main_Camera")
cam_data.type = "PERSP"
cam_data.lens = 50
cam_obj = bpy.data.objects.new("Main_Camera", cam_data)
cam_obj.location = (0.0, -3.4, 1.08)
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

# 1. Front View
cam_obj.location = (0.0, -3.4, 1.08)
scene.render.filepath = os.path.join(out_dir, "frankie_3d_front.png")
bpy.ops.render.render(write_still=True)
print("Rendered upgraded Front View:", scene.render.filepath)

# 2. Isometric 3/4 View
cam_obj.location = (2.0, -2.8, 1.35)
scene.render.filepath = os.path.join(out_dir, "frankie_3d_iso.png")
bpy.ops.render.render(write_still=True)
print("Rendered upgraded Iso View:", scene.render.filepath)

blend_path = os.path.join(out_dir, "frankie_squirrel_master.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("Saved Master Blend at:", blend_path)
