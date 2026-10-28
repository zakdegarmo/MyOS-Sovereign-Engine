import bpy
import math
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

# ─── 1. SHADING & MATERIALS ──────────────────────────────────────────────────
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
        color_shadow = (color_base[0] * 0.40, color_base[1] * 0.40, color_base[2] * 0.40, 1.0)
    if color_hi is None:
        color_hi = color_base

    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = color_shadow
    ramp.color_ramp.elements[1].position = 0.32
    ramp.color_ramp.elements[1].color = color_base

    elem_hi = ramp.color_ramp.elements.new(0.85)
    elem_hi.color = color_hi

    links.new(bsdf.outputs["BSDF"], s2rgb.inputs["Shader"])
    links.new(s2rgb.outputs["Color"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], out.inputs["Surface"])
    return mat

def make_emission_material(name, color, strength=8.0):
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

# Palettes tuned exactly to 2D Frank reference
mat_black_fur  = make_cel_material("Black_Fur",  (0.18, 0.17, 0.20, 1.0), (0.08, 0.07, 0.09, 1.0), (0.32, 0.30, 0.34, 1.0))
mat_muzzle_tan = make_cel_material("Muzzle_Tan", (0.68, 0.48, 0.34, 1.0), (0.42, 0.26, 0.16, 1.0), (0.85, 0.65, 0.48, 1.0))
mat_suit_char  = make_cel_material("Suit_Grey",  (0.42, 0.43, 0.46, 1.0), (0.20, 0.21, 0.24, 1.0), (0.60, 0.61, 0.64, 1.0))
mat_shirt_off  = make_cel_material("Shirt_Off",  (0.94, 0.92, 0.86, 1.0), (0.65, 0.62, 0.55, 1.0), (1.00, 1.00, 0.98, 1.0))
mat_tie_black  = make_cel_material("Tie_Black",  (0.08, 0.07, 0.09, 1.0), (0.03, 0.02, 0.04, 1.0), (0.20, 0.18, 0.22, 1.0))
mat_belt_gold  = make_cel_material("Belt_Gold",  (0.92, 0.72, 0.18, 1.0), (0.50, 0.35, 0.08, 1.0), (1.00, 0.90, 0.45, 1.0))
mat_belt_strap = make_cel_material("Belt_Strap", (0.10, 0.09, 0.10, 1.0), (0.04, 0.04, 0.04, 1.0))
mat_eye_white  = make_cel_material("Eye_White",  (0.98, 0.97, 0.94, 1.0), (0.82, 0.78, 0.72, 1.0), (1.00, 1.00, 1.00, 1.0))
mat_eye_bag    = make_cel_material("Eye_Bags",   (0.58, 0.38, 0.32, 1.0), (0.36, 0.22, 0.18, 1.0))
mat_pupil_blk  = make_cel_material("Eye_Pupil",  (0.02, 0.02, 0.02, 1.0), (0.00, 0.00, 0.00, 1.0))
mat_specular   = make_cel_material("Eye_Spec",   (1.0, 1.0, 1.0, 1.0))
mat_nose_pink  = make_cel_material("Nose_Pink",  (0.85, 0.40, 0.42, 1.0), (0.52, 0.22, 0.24, 1.0), (0.98, 0.62, 0.64, 1.0))
mat_mouth_dark = make_cel_material("Mouth_Dark", (0.12, 0.03, 0.04, 1.0), (0.05, 0.01, 0.01, 1.0))
mat_teeth_corn = make_cel_material("Teeth_Corn", (0.96, 0.94, 0.82, 1.0), (0.72, 0.68, 0.52, 1.0), (1.00, 0.99, 0.90, 1.0))
mat_paw_pad    = make_cel_material("Paw_Pad",    (0.26, 0.22, 0.24, 1.0), (0.14, 0.11, 0.12, 1.0))
mat_joint_pap  = make_cel_material("Joint_Pap",  (0.94, 0.91, 0.84, 1.0), (0.64, 0.62, 0.56, 1.0))
mat_cherry_lit = make_emission_material("Cherry_Lit", (1.0, 0.35, 0.02, 1.0), strength=12.0)
mat_smoke_puff = make_cel_material("Smoke_Puff", (0.88, 0.88, 0.92, 1.0), (0.55, 0.56, 0.62, 1.0))

col = bpy.context.collection
root = bpy.data.objects.new("Frankie_Root", None)
col.objects.link(root)

# ─── 2. TORSO & DRESS SUIT ──────────────────────────────────────────────────
# Main jacket body
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.45, segments=24, ring_count=16, location=(0, 0.04, 0.52))
jacket = bpy.context.active_object
jacket.name = "Suit_Jacket"
jacket.scale = (1.05, 0.82, 1.15)
bpy.ops.object.transform_apply(scale=True)
jacket.data.materials.append(mat_suit_char)
bpy.ops.object.shade_smooth()
jacket.parent = root

# White Dress Shirt (Positioned prominently forward so it shows)
bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.52, vertices=16, location=(0, -0.22, 0.64))
shirt = bpy.context.active_object
shirt.name = "Dress_Shirt"
shirt.scale = (0.72, 0.38, 0.92)
bpy.ops.object.transform_apply(scale=True)
shirt.data.materials.append(mat_shirt_off)
bpy.ops.object.shade_smooth()
shirt.parent = root

# Left & Right Suit Lapels (Framing the white shirt)
for side, x, rot_y in [("L", -0.18, math.radians(-16)), ("R", 0.18, math.radians(16))]:
    bpy.ops.mesh.primitive_cube_add(size=0.1, location=(x, -0.30, 0.66))
    lapel = bpy.context.active_object
    lapel.name = f"Lapel_{side}"
    lapel.scale = (0.85, 0.25, 3.2)
    lapel.rotation_euler = (math.radians(-10), rot_y, math.radians(-6 if side == "L" else 6))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    lapel.data.materials.append(mat_suit_char)
    lapel.parent = root

# Black Tie (Hanging down over the shirt)
bpy.ops.mesh.primitive_cube_add(size=0.1, location=(0.0, -0.34, 0.58))
tie = bpy.context.active_object
tie.name = "Necktie"
tie.scale = (0.65, 0.12, 3.4)
tie.rotation_euler = (math.radians(-6), 0, math.radians(2))
bpy.ops.object.transform_apply(scale=True, rotation=True)
tie.data.materials.append(mat_tie_black)
tie.parent = root

# Tie Knot
bpy.ops.mesh.primitive_cone_add(radius1=0.065, depth=0.08, vertices=12, location=(0.0, -0.33, 0.77))
knot = bpy.context.active_object
knot.name = "Tie_Knot"
knot.rotation_euler = (math.radians(180), 0, 0)
bpy.ops.object.transform_apply(rotation=True)
knot.data.materials.append(mat_tie_black)
knot.parent = root

# Belt & Gold Buckle
bpy.ops.mesh.primitive_torus_add(major_radius=0.40, minor_radius=0.035, major_segments=24, minor_segments=8, location=(0, 0, 0.28))
belt = bpy.context.active_object
belt.name = "Belt"
belt.scale = (1.05, 0.88, 0.90)
bpy.ops.object.transform_apply(scale=True)
belt.data.materials.append(mat_belt_strap)
belt.parent = root

bpy.ops.mesh.primitive_cube_add(size=0.08, location=(0, -0.36, 0.28))
buckle = bpy.context.active_object
buckle.name = "Belt_Buckle_Gold"
buckle.scale = (1.3, 0.25, 0.85)
bpy.ops.object.transform_apply(scale=True)
buckle.data.materials.append(mat_belt_gold)
buckle.parent = root

# ─── 3. HEAD, FLARED JOWLS & CRAZED FRANK GALLAGHER EXPRESSION ───────────────
head_root = bpy.data.objects.new("Frankie_Head_Root", None)
head_root.location = (0, 0, 1.25)
col.objects.link(head_root)
head_root.parent = root

# Main Head Sphere
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.52, segments=32, ring_count=20, location=(0, 0, 0))
head = bpy.context.active_object
head.name = "Head_Base"
head.scale = (1.12, 0.95, 0.92)
bpy.ops.object.transform_apply(scale=True)
head.data.materials.append(mat_black_fur)
bpy.ops.object.shade_smooth()
head.parent = head_root

# Wide Flared Cheek Jowls (Flaring out like wild mutton chops)
cheek_tufts = [
    ( 0.08,  0.10, (0.24, 0.18, 0.42),  40, -15),
    ( 0.02, -0.05, (0.30, 0.20, 0.50),  55,  -5),
    (-0.06, -0.18, (0.28, 0.18, 0.44),  45,  15),
    (-0.04, -0.30, (0.22, 0.15, 0.36),  30,  30),
]
for side, sign in [("L", -1), ("R", 1)]:
    for i, (yo, zo, sc, rz, ry) in enumerate(cheek_tufts):
        bpy.ops.mesh.primitive_cone_add(radius1=0.20, depth=0.55, vertices=10, location=(sign * (0.44 + sc[0]*0.45), yo, zo))
        tuft = bpy.context.active_object
        tuft.name = f"Jowl_{side}_{i}"
        tuft.scale = sc
        tuft.rotation_euler = (0, math.radians(sign * ry), math.radians(sign * rz + (0 if sign==1 else 180)))
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        tuft.data.materials.append(mat_black_fur)
        tuft.parent = head_root

# Top Hair Spikes
for i, (cx, cy, cz, cscale, crot) in enumerate([
    (-0.12, 0.02, 0.52, (0.09, 0.09, 0.32), -15),
    ( 0.00, 0.05, 0.56, (0.11, 0.11, 0.40),   0),
    ( 0.12, 0.02, 0.52, (0.09, 0.09, 0.32),  15),
]):
    bpy.ops.mesh.primitive_cone_add(radius1=0.14, depth=0.42, vertices=8, location=(cx, cy, cz))
    spike = bpy.context.active_object
    spike.name = f"Crown_Hair_{i}"
    spike.scale = cscale
    spike.rotation_euler = (math.radians(-10), math.radians(crot), 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    spike.data.materials.append(mat_black_fur)
    spike.parent = head_root

# Floppy Squirrel/Hound Ears
for side, x in [("L", -0.44), ("R", 0.44)]:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, segments=16, ring_count=12, location=(x, 0.06, 0.38))
    ear = bpy.context.active_object
    ear.name = f"Ear_{side}"
    ear.scale = (0.48, 0.30, 1.40)
    rot_y = math.radians(-38 if side == "L" else 38)
    ear.rotation_euler = (math.radians(22), rot_y, math.radians(-18 if side == "L" else 18))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    ear.data.materials.append(mat_black_fur)
    bpy.ops.object.shade_smooth()
    ear.parent = head_root

# Tan Muzzle / Snout Pad
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.34, segments=24, ring_count=16, location=(0, -0.32, -0.06))
muzzle = bpy.context.active_object
muzzle.name = "Muzzle_Tan_Base"
muzzle.scale = (1.25, 0.65, 0.80)
bpy.ops.object.transform_apply(scale=True)
muzzle.data.materials.append(mat_muzzle_tan)
bpy.ops.object.shade_smooth()
muzzle.parent = head_root

# BULGING MANIC EYES (Wide open, staring, crazy)
for side, x in [("L", -0.22), ("R", 0.22)]:
    # Huge White Eyeball
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.19, segments=24, ring_count=16, location=(x, -0.40, 0.12))
    eye = bpy.context.active_object
    eye.name = f"Eyeball_{side}"
    eye.scale = (0.95, 0.65, 1.10)
    bpy.ops.object.transform_apply(scale=True)
    eye.data.materials.append(mat_eye_white)
    bpy.ops.object.shade_smooth()
    eye.parent = head_root

    # Dark Bags under eyes
    bpy.ops.mesh.primitive_torus_add(major_radius=0.15, minor_radius=0.032, major_segments=16, minor_segments=8, location=(x, -0.42, 0.00))
    bag = bpy.context.active_object
    bag.name = f"Eye_Bag_{side}"
    bag.scale = (1.05, 0.45, 0.75)
    bpy.ops.object.transform_apply(scale=True)
    bag.data.materials.append(mat_eye_bag)
    bag.parent = head_root

    # Manic Thin Upper Eyelid Fold (Thin line at top, NOT covering the eye!)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.17, minor_radius=0.024, major_segments=16, minor_segments=6, location=(x, -0.41, 0.23))
    lid_fold = bpy.context.active_object
    lid_fold.name = f"Lid_Fold_{side}"
    lid_fold.scale = (1.05, 0.45, 0.55)
    bpy.ops.object.transform_apply(scale=True)
    lid_fold.data.materials.append(mat_black_fur)
    lid_fold.parent = head_root

    # Tiny Intense Dilated Pupil
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, segments=14, ring_count=10, location=(x * 0.94, -0.52, 0.12))
    pupil = bpy.context.active_object
    pupil.name = f"Pupil_{side}"
    pupil.data.materials.append(mat_pupil_blk)
    pupil.parent = head_root

    # Glossy Specular Highlight dot on pupil
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.016, segments=8, ring_count=6, location=(x * 0.94 - 0.018, -0.55, 0.14))
    spec = bpy.context.active_object
    spec.name = f"Eye_Spec_{side}"
    spec.data.materials.append(mat_specular)
    spec.parent = head_root

    # Crazy Angled Eyebrows
    bpy.ops.mesh.primitive_cube_add(size=0.05, location=(x, -0.44, 0.29))
    brow = bpy.context.active_object
    brow.name = f"Eyebrow_{side}"
    brow.scale = (2.2, 0.35, 0.6)
    brow.rotation_euler = (0, math.radians(-24 if side == "L" else 24), math.radians(12 if side == "L" else -12))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    brow.data.materials.append(mat_black_fur)
    brow.parent = head_root

# Bulbous Mauve Nose
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.085, segments=18, ring_count=12, location=(0, -0.54, 0.02))
nose = bpy.context.active_object
nose.name = "Nose_Bulb"
nose.scale = (1.30, 0.80, 0.80)
bpy.ops.object.transform_apply(scale=True)
nose.data.materials.append(mat_nose_pink)
bpy.ops.object.shade_smooth()
nose.parent = head_root

# ─── ENORMOUS CLENCHED-TEETH GRIN ──────────────────────────────────────────
# Dark mouth opening backdrop
bpy.ops.mesh.primitive_cylinder_add(radius=0.38, depth=0.15, vertices=20, location=(0, -0.48, -0.16))
mouth_bg = bpy.context.active_object
mouth_bg.name = "Mouth_Dark_Backdrop"
mouth_bg.scale = (1.20, 0.40, 0.60)
mouth_bg.rotation_euler = (math.radians(90), 0, 0)
bpy.ops.object.transform_apply(scale=True, rotation=True)
mouth_bg.data.materials.append(mat_mouth_dark)
mouth_bg.parent = head_root

# Individual Chiclet Teeth (Arranged on a curved smile in front of the dark backdrop)
num_teeth = 10
for t_i in range(num_teeth):
    frac = (t_i - (num_teeth - 1) / 2.0) / ((num_teeth - 1) / 2.0) # -1.0 to 1.0
    tx = frac * 0.38
    ty = -0.54 + (tx * tx) * 0.28
    tz_smile = (tx * tx) * 0.08

    # Upper Tooth
    bpy.ops.mesh.primitive_cube_add(size=0.038, location=(tx, ty, -0.12 + tz_smile))
    tu = bpy.context.active_object
    tu.name = f"Tooth_U_{t_i}"
    jitter = (t_i % 2) * 0.04 - 0.02
    tu.scale = (0.95 + jitter, 0.35, 1.25)
    tu.rotation_euler = (0, 0, math.radians(-tx * 25))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    tu.data.materials.append(mat_teeth_corn)
    tu.parent = head_root

    # Lower Tooth
    bpy.ops.mesh.primitive_cube_add(size=0.038, location=(tx, ty + 0.01, -0.18 + tz_smile))
    tl = bpy.context.active_object
    tl.name = f"Tooth_L_{t_i}"
    tl.scale = (0.95 - jitter, 0.35, 1.25)
    tl.rotation_euler = (0, 0, math.radians(-tx * 25))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    tl.data.materials.append(mat_teeth_corn)
    tl.parent = head_root

# Chin & Scruffy Goatee
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, segments=16, ring_count=10, location=(0, -0.46, -0.26))
chin = bpy.context.active_object
chin.name = "Chin_Goatee"
chin.scale = (1.20, 0.70, 0.55)
bpy.ops.object.transform_apply(scale=True)
chin.data.materials.append(mat_black_fur)
bpy.ops.object.shade_smooth()
chin.parent = head_root

# ─── 4. ARMS, PAWS & LIT WEED JOINT ─────────────────────────────────────────
# Right Arm resting on ground
bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.50, vertices=14, location=(0.46, 0.08, 0.48))
arm_r = bpy.context.active_object
arm_r.name = "Arm_Sleeve_R"
arm_r.rotation_euler = (math.radians(20), math.radians(-32), math.radians(-25))
bpy.ops.object.transform_apply(rotation=True)
arm_r.data.materials.append(mat_suit_char)
arm_r.parent = root

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, segments=14, ring_count=10, location=(0.68, 0.12, 0.20))
paw_r = bpy.context.active_object
paw_r.name = "Paw_R"
paw_r.scale = (1.1, 1.3, 0.7)
bpy.ops.object.transform_apply(scale=True)
paw_r.data.materials.append(mat_black_fur)
paw_r.parent = root

# Left Arm raised in monologue / joint pinch
bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.48, vertices=14, location=(-0.40, -0.14, 0.66))
arm_l = bpy.context.active_object
arm_l.name = "Arm_Sleeve_L"
arm_l.rotation_euler = (math.radians(-50), math.radians(38), math.radians(30))
bpy.ops.object.transform_apply(rotation=True)
arm_l.data.materials.append(mat_suit_char)
arm_l.parent = root

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, segments=14, ring_count=10, location=(-0.56, -0.34, 0.92))
paw_l = bpy.context.active_object
paw_l.name = "Paw_L"
paw_l.data.materials.append(mat_black_fur)
paw_l.parent = root

# Fingers pinching
bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.12, vertices=8, location=(-0.62, -0.38, 0.97))
finger_idx = bpy.context.active_object
finger_idx.name = "Finger_Index"
finger_idx.rotation_euler = (math.radians(30), math.radians(-25), 0)
bpy.ops.object.transform_apply(rotation=True)
finger_idx.data.materials.append(mat_black_fur)
finger_idx.parent = root

bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.11, vertices=8, location=(-0.58, -0.40, 0.94))
finger_thb = bpy.context.active_object
finger_thb.name = "Finger_Thumb"
finger_thb.rotation_euler = (math.radians(-20), math.radians(-10), 0)
bpy.ops.object.transform_apply(rotation=True)
finger_thb.data.materials.append(mat_black_fur)
finger_thb.parent = root

# LIT JOINT
bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.22, vertices=10, location=(-0.67, -0.42, 1.01))
joint = bpy.context.active_object
joint.name = "Weed_Joint"
joint.rotation_euler = (math.radians(-35), math.radians(45), math.radians(-20))
bpy.ops.object.transform_apply(rotation=True)
joint.data.materials.append(mat_joint_pap)
joint.parent = root

# Glowing Cherry Ember
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.028, segments=10, ring_count=8, location=(-0.74, -0.48, 1.08))
cherry = bpy.context.active_object
cherry.name = "Cherry_Ember"
cherry.data.materials.append(mat_cherry_lit)
cherry.parent = root

# Smoke puffs
for s_i, (spos, srad) in enumerate([
    ((-0.75, -0.48, 1.14), 0.026),
    ((-0.77, -0.46, 1.21), 0.042),
    ((-0.81, -0.43, 1.29), 0.056),
    ((-0.78, -0.41, 1.37), 0.046),
]):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=srad, segments=10, ring_count=8, location=spos)
    sm = bpy.context.active_object
    sm.name = f"Smoke_{s_i}"
    sm.data.materials.append(mat_smoke_puff)
    bpy.ops.object.shade_smooth()
    sm.parent = root

# ─── 5. LEGS & SPRAWLED SITTING SQUIRREL PAWS ───────────────────────────────
for side, sign in [("L", -1), ("R", 1)]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.50, vertices=14, location=(sign * 0.38, -0.20, 0.20))
    leg = bpy.context.active_object
    leg.name = f"Leg_{side}"
    leg.rotation_euler = (math.radians(68), 0, math.radians(sign * -28))
    bpy.ops.object.transform_apply(rotation=True)
    leg.data.materials.append(mat_suit_char)
    leg.parent = root

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, segments=16, ring_count=12, location=(sign * 0.52, -0.48, 0.14))
    foot = bpy.context.active_object
    foot.name = f"Foot_{side}"
    foot.scale = (0.90, 1.65, 0.70)
    foot.rotation_euler = (math.radians(-15), 0, math.radians(sign * 18))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    foot.data.materials.append(mat_black_fur)
    foot.parent = root

    for toe_i in range(3):
        tx = sign * (0.45 + toe_i * 0.07)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.038, segments=10, ring_count=8, location=(tx, -0.60, 0.10))
        toe = bpy.context.active_object
        toe.name = f"Toe_{side}_{toe_i}"
        toe.data.materials.append(mat_paw_pad)
        toe.parent = root

# ─── 6. GIANT CURVED BUSHY BLACK TAIL ───────────────────────────────────────
tail_curve = [
    (( 0.00,  0.35,  0.30), 0.30, (1.0, 1.1, 1.0),   0),
    (( 0.14,  0.58,  0.52), 0.44, (1.1, 1.2, 1.1),  10),
    (( 0.30,  0.78,  0.88), 0.56, (1.2, 1.3, 1.2),  20),
    (( 0.40,  0.82,  1.30), 0.62, (1.25, 1.35, 1.2), 15),
    (( 0.36,  0.70,  1.70), 0.58, (1.2, 1.25, 1.15), -10),
    (( 0.20,  0.48,  2.00), 0.48, (1.1, 1.15, 1.1), -30),
    (( 0.04,  0.30,  2.12), 0.36, (1.0, 1.0, 1.0),   -45),
]
for idx, (tpos, trad, tscale, trot_y) in enumerate(tail_curve):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=trad, segments=22, ring_count=16, location=tpos)
    tpart = bpy.context.active_object
    tpart.name = f"Tail_Part_{idx}"
    tpart.scale = tscale
    tpart.rotation_euler = (0, math.radians(trot_y), 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    tpart.data.materials.append(mat_black_fur)
    bpy.ops.object.shade_smooth()
    tpart.parent = root

    if idx in [2, 3, 4]:
        bpy.ops.mesh.primitive_cone_add(radius1=0.20, depth=0.45, vertices=8, location=(tpos[0] + 0.32, tpos[1] + 0.12, tpos[2]))
        ttuft = bpy.context.active_object
        ttuft.name = f"Tail_Tuft_{idx}"
        ttuft.rotation_euler = (0, math.radians(35), math.radians(20))
        bpy.ops.object.transform_apply(rotation=True)
        ttuft.data.materials.append(mat_black_fur)
        ttuft.parent = root

# ─── 7. TABLETOP LIGHTING RIG ───────────────────────────────────────────────
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
cam_obj.location = (0.0, -3.5, 1.12)
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
