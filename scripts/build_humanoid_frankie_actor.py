import bpy
import math
import os

print("=== REFINING HUMANOID FRANKIE ACTOR WITH DETAILED WARDROBE & RIG ===")

template_blend = os.path.abspath("chibi_adventurer_production.blend")
bpy.ops.wm.open_mainfile(filepath=template_blend)

# 1. REMOVE OLD UNWANTED MESHES
unwanted = [
    'Mannequin', 'Modular_1H_Sword', 'Modular_2H_Staff', 'Modular_Adventurer_Boots', 
    'Modular_Adventurer_Pants', 'Modular_Adventurer_Tunic', 'Modular_Combat_Skirt', 
    'Modular_Hair_Fighter', 'Modular_Knight_Cape', 'Modular_Mage_Hat', 
    'Modular_Round_Shield', 'Chibi_Face_Decal', 'Armature.001', 'Armature.002', 'Armature.003'
]
for name in unwanted:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

arm_obj = bpy.data.objects.get('Armature')
arm_obj.data.pose_position = 'REST'
bpy.context.view_layer.update()

CX = 0.007
CY = 1.241

# 2. EXTEND ARMATURE: JAW & ELEGANT BUSHY TAIL
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_obj.data.edit_bones

b_head = eb.get('Head')
b_hips = eb.get('Hips')

# Jaw bone (hinged at back of jaw, pointing forward-down)
if not eb.get('Jaw'):
    b_jaw = eb.new('Jaw')
    b_jaw.head = (CX, CY - 0.06, 1.08)
    b_jaw.tail = (CX, CY - 0.28, 0.98)
    b_jaw.parent = b_head

# Bushy Squirrel Tail with S-curve arcing up and over back
t_coords = [
    ('Tail.1',   (CX, CY + 0.16, 0.60), (CX, CY + 0.38, 0.76)),
    ('Tail.2',   (CX, CY + 0.38, 0.76), (CX, CY + 0.58, 1.06)),
    ('Tail.3',   (CX, CY + 0.58, 1.06), (CX, CY + 0.55, 1.45)),
    ('Tail.4',   (CX, CY + 0.55, 1.45), (CX, CY + 0.38, 1.76)),
    ('Tail.Tip', (CX, CY + 0.38, 1.76), (CX, CY + 0.18, 1.95)),
]
prev_b = b_hips
for bname, h_pos, t_pos in t_coords:
    if not eb.get(bname):
        b = eb.new(bname)
        b.head = h_pos
        b.tail = t_pos
        b.parent = prev_b
        prev_b = b
    else:
        b = eb.get(bname)
        b.head = h_pos
        b.tail = t_pos
        prev_b = b

bpy.ops.object.mode_set(mode='OBJECT')

# 3. COMIC BOOK CEL SHADING MATERIALS (100% Matte Diffuse, Zero Specular Shine)
def make_cel_material(name, color_base, color_shadow=None):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfDiffuse")
    bsdf.inputs["Color"].default_value = (color_base[0], color_base[1], color_base[2], 1.0)
    bsdf.inputs["Roughness"].default_value = 1.0

    s2rgb = nodes.new("ShaderNodeShaderToRGB")
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"

    if color_shadow is None:
        color_shadow = (color_base[0] * 0.40, color_base[1] * 0.40, color_base[2] * 0.40, 1.0)

    # Pure 2-tone comic book shading (Shadow & Base, NO glossy specular highlights)
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = color_shadow
    ramp.color_ramp.elements[1].position = 0.38
    ramp.color_ramp.elements[1].color = color_base

    links.new(bsdf.outputs["BSDF"], s2rgb.inputs["Shader"])
    links.new(s2rgb.outputs["Color"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], out.inputs["Surface"])
    return mat

def make_emission_material(name, color, strength=15.0):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = color
    emit.inputs["Strength"].default_value = strength
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat

# Matte Comic Book Palette
mat_black_fur   = make_cel_material("Black_Fur",   (0.14, 0.13, 0.16, 1.0), (0.04, 0.04, 0.05, 1.0))
mat_tail_fur    = make_cel_material("Tail_Fur",    (0.32, 0.32, 0.36, 1.0), (0.15, 0.15, 0.18, 1.0)) # Differentiated from head fur for inking
mat_ear_inner   = make_cel_material("Ear_Inner",   (0.85, 0.52, 0.38, 1.0), (0.50, 0.28, 0.16, 1.0)) # Warm peach/orange-pink inner ear
mat_eyelid_drunk= make_cel_material("Eyelid_Drunk",(0.82, 0.52, 0.38, 1.0), (0.48, 0.28, 0.18, 1.0)) # Warm droopy hungover eyelids
mat_muzzle_tan  = make_cel_material("Muzzle_Tan",  (0.82, 0.62, 0.44, 1.0), (0.50, 0.34, 0.20, 1.0))
mat_suit_char   = make_cel_material("Suit_Grey",   (0.36, 0.37, 0.40, 1.0), (0.18, 0.19, 0.22, 1.0))
mat_shirt_off   = make_cel_material("Shirt_Off",   (0.96, 0.94, 0.90, 1.0), (0.68, 0.66, 0.60, 1.0))
mat_tie_black   = make_cel_material("Tie_Black",   (0.06, 0.05, 0.07, 1.0), (0.02, 0.02, 0.02, 1.0))
mat_belt_gold   = make_cel_material("Belt_Gold",   (0.92, 0.72, 0.18, 1.0), (0.48, 0.32, 0.08, 1.0))
mat_belt_strap  = make_cel_material("Belt_Strap",  (0.08, 0.08, 0.08, 1.0), (0.03, 0.03, 0.03, 1.0))
mat_eye_white   = make_cel_material("Eye_White",   (0.98, 0.98, 0.96, 1.0), (0.82, 0.80, 0.75, 1.0))
mat_eye_bag     = make_cel_material("Eye_Bags",    (0.55, 0.28, 0.26, 1.0), (0.32, 0.14, 0.12, 1.0))
mat_pupil_blk   = make_cel_material("Eye_Pupil",   (0.01, 0.01, 0.01, 1.0), (0.00, 0.00, 0.00, 1.0))
mat_specular    = make_emission_material("Eye_Spec", (1.0, 1.0, 1.0, 1.0), strength=2.0)
mat_nose_reddish= make_cel_material("Nose_Reddish",(0.78, 0.34, 0.30, 1.0), (0.44, 0.16, 0.12, 1.0)) # Reddish-brown cartoon nose
mat_mouth_dark  = make_cel_material("Mouth_Dark",  (0.04, 0.01, 0.02, 1.0), (0.02, 0.00, 0.01, 1.0))
mat_teeth_corn  = make_cel_material("Teeth_Corn",  (0.97, 0.95, 0.86, 1.0), (0.72, 0.68, 0.54, 1.0))
mat_paw_pad     = make_cel_material("Paw_Pad",     (0.24, 0.20, 0.22, 1.0), (0.12, 0.10, 0.11, 1.0))
mat_joint_pap   = make_cel_material("Joint_Pap",   (0.95, 0.92, 0.85, 1.0), (0.64, 0.62, 0.56, 1.0))
mat_cherry_lit  = make_emission_material("Cherry_Lit", (1.0, 0.30, 0.01, 1.0), strength=20.0)
mat_smoke_puff  = make_cel_material("Smoke_Puff",  (0.88, 0.88, 0.92, 1.0), (0.52, 0.54, 0.60, 1.0))

col = bpy.context.collection

def make_bone_mesh(create_fn, name, bone_name, world_loc, scale=(1,1,1), rot=(0,0,0), mat=None, smooth=False):
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
        for p in obj.data.polygons:
            p.use_smooth = True

    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.data.bones.active = arm_obj.data.bones[bone_name]
    bpy.ops.object.parent_set(type='BONE')
    bpy.ops.object.select_all(action='DESELECT')
    return obj

# 4. LOWER BODY & LEGS
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, segments=20, ring_count=14),
    "Pelvis_Suit", "Hips", (CX, CY, 0.58),
    scale=(1.20, 0.95, 0.85), mat=mat_suit_char, smooth=True
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_torus_add(major_radius=0.17, minor_radius=0.022, major_segments=20, minor_segments=8),
    "Belt_Strap", "Hips", (CX, CY, 0.61),
    scale=(1.22, 0.95, 0.65), mat=mat_belt_strap
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=0.045),
    "Belt_Buckle", "Hips", (CX, CY - 0.17, 0.61),
    scale=(1.25, 0.35, 0.85), mat=mat_belt_gold
)

# Legs: Left and Right Trousers + Feet Paws
for side, sign, b_up, b_leg, b_foot in [
    ("L",  1, "LeftUpLeg",  "LeftLeg",  "LeftFoot"),
    ("R", -1, "RightUpLeg", "RightLeg", "RightFoot")
]:
    lx = CX + sign * 0.11
    # Thigh Trousers
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.085, depth=0.25, vertices=16),
        f"Trouser_Thigh_{side}", b_up, (lx, CY + 0.005, 0.46),
        scale=(1.05, 1.05, 1.0), mat=mat_suit_char, smooth=True
    )
    # Shin / Calf Trousers
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.078, depth=0.28, vertices=16),
        f"Trouser_Shin_{side}", b_leg, (lx, CY + 0.010, 0.21),
        scale=(1.02, 1.02, 1.0), mat=mat_suit_char, smooth=True
    )
    # Black Furry Feet with Pads
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, segments=16, ring_count=10),
        f"Foot_Paw_{side}", b_foot, (lx, CY - 0.06, 0.05),
        scale=(0.95, 1.65, 0.60), mat=mat_black_fur, smooth=True
    )
    for toe_i in range(3):
        tx = lx + (toe_i - 1) * 0.035
        make_bone_mesh(
            lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.024, segments=10, ring_count=8),
            f"Toe_{side}_{toe_i}", b_foot, (tx, CY - 0.16, 0.03),
            mat=mat_paw_pad
        )

# 5. TORSO, JACKET, OPEN SHIRT & TIE (Spine, Spine01)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.21, segments=22, ring_count=16),
    "Torso_Belly", "Spine", (CX, CY - 0.01, 0.72),
    scale=(1.12, 1.05, 0.95), mat=mat_suit_char, smooth=True
)

# Jacket Body (Spine01) - flattened front-to-back so shirt & lapels pop out
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.21, depth=0.26, vertices=20),
    "Jacket_Chest", "Spine01", (CX, CY + 0.02, 0.84),
    scale=(1.18, 0.82, 1.0), mat=mat_suit_char, smooth=True
)

# Open Wrinkled White Shirt - positioned proudly on chest front
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, segments=16, ring_count=12),
    "Shirt_Front", "Spine01", (CX, CY - 0.14, 0.86),
    scale=(0.80, 0.45, 1.10), mat=mat_shirt_off, smooth=True
)

# Prominent Suit Lapels framing the shirt
for side, sign in [("L", 1), ("R", -1)]:
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.08),
        f"Lapel_{side}", "Spine01", (CX + sign * 0.09, CY - 0.17, 0.86),
        scale=(0.55, 0.22, 2.0), rot=(math.radians(10), math.radians(sign * 16), math.radians(sign * -20)),
        mat=mat_suit_char
    )

# Disheveled Black Necktie draped over shirt
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=0.05),
    "Tie_Knot", "Spine01", (CX + 0.01, CY - 0.19, 0.91),
    scale=(0.85, 0.40, 0.70), rot=(0, 0, math.radians(-14)),
    mat=mat_tie_black
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=0.04),
    "Tie_Drape", "Spine01", (CX + 0.018, CY - 0.20, 0.77),
    scale=(0.60, 0.25, 3.8), rot=(math.radians(6), 0, math.radians(-10)),
    mat=mat_tie_black
)

# 6. ARMS, SLEEVES & JOINT IN HAND
for side, sign, b_sh, b_arm, b_fa, b_hd in [
    ("L",  1, "LeftShoulder",  "LeftArm",  "LeftForeArm",  "LeftHand"),
    ("R", -1, "RightShoulder", "RightArm", "RightForeArm", "RightHand")
]:
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, segments=16, ring_count=12),
        f"Shoulder_Pad_{side}", b_sh, (CX + sign * 0.10, CY, 0.96),
        scale=(1.1, 1.1, 1.0), mat=mat_suit_char, smooth=True
    )
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.072, depth=0.20, vertices=16),
        f"Sleeve_Upper_{side}", b_arm, (CX + sign * 0.24, CY + 0.02, 0.98),
        rot=(0, math.radians(90), 0),
        mat=mat_suit_char, smooth=True
    )
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.068, depth=0.18, vertices=16),
        f"Sleeve_Lower_{side}", b_fa, (CX + sign * 0.42, CY + 0.02, 0.98),
        rot=(0, math.radians(90), 0),
        mat=mat_suit_char, smooth=True
    )
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.075, segments=16, ring_count=12),
        f"Hand_Paw_{side}", b_hd, (CX + sign * 0.58, CY + 0.02, 0.98),
        scale=(1.2, 1.0, 0.8), mat=mat_black_fur, smooth=True
    )

# Fat Rolled Joint snugly nestled in LeftHand
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=0.18, vertices=12),
    "Joint_Body", "LeftHand", (CX + 0.64, CY - 0.03, 1.02),
    rot=(math.radians(25), math.radians(-35), math.radians(50)),
    mat=mat_joint_pap
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.018, segments=10, ring_count=8),
    "Joint_Cherry", "LeftHand", (CX + 0.70, CY - 0.07, 1.06),
    mat=mat_cherry_lit
)
# Amber Glow Light
glow_lamp = bpy.data.lights.new("Cherry_Glow", "POINT")
glow_lamp.energy = 8.0
glow_lamp.color = (1.0, 0.35, 0.05)
glow_lamp_obj = bpy.data.objects.new("Cherry_Glow_Light", glow_lamp)
glow_lamp_obj.location = (CX + 0.70, CY - 0.07, 1.06)
col.objects.link(glow_lamp_obj)
glow_lamp_obj.parent = arm_obj
glow_lamp_obj.parent_type = 'BONE'
glow_lamp_obj.parent_bone = "LeftHand"

# Smoke Puffs
for s_i, (spos, srad) in enumerate([
    ((CX + 0.72, CY - 0.08, 1.10), 0.022),
    ((CX + 0.75, CY - 0.07, 1.16), 0.034),
    ((CX + 0.78, CY - 0.05, 1.23), 0.046),
]):
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=srad, segments=10, ring_count=8),
        f"Smoke_{s_i}", "LeftHand", spos, mat=mat_smoke_puff, smooth=True
    )

# 7. HEAD, EYES & ALIGNED DENTAL ARCH (neck, Head, Jaw)
# Distinct Neck with shirt collar
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=0.10, vertices=16),
    "Neck_Fur", "neck", (CX, CY - 0.02, 0.95),
    mat=mat_black_fur, smooth=True
)

# 7. HEAD, EARS & REFERENCE COMIC FACE (matching user reference photo)
# Head Base (Head)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.28, segments=32, ring_count=22),
    "Head_Base", "Head", (CX, CY - 0.06, 1.20),
    scale=(1.06, 0.94, 1.00), mat=mat_black_fur, smooth=True
)

# Shaggy Cheek Tufts (flaring horizontally from the cheeks as seen in reference)
for side, sign in [("L", 1), ("R", -1)]:
    for t_i, (z_off, rad, l_scale, yaw, pitch) in enumerate([
        ( 0.04, 0.075, (1.8, 0.7, 0.6), sign * 28,  8),
        (-0.02, 0.090, (2.2, 0.8, 0.7), sign * 35, -4),
        (-0.08, 0.070, (1.6, 0.6, 0.5), sign * 22, -16),
    ]):
        make_bone_mesh(
            lambda: bpy.ops.mesh.primitive_cone_add(radius1=rad, depth=0.28, vertices=8),
            f"Cheek_Tuft_{side}_{t_i}", "Head", (CX + sign * 0.26, CY - 0.16, 1.14 + z_off),
            scale=l_scale, rot=(math.radians(pitch), math.radians(sign * -75), math.radians(yaw)),
            mat=mat_black_fur
        )

# Messy Crown Hair Spike (center tuft on top of head between ears)
for i, (dx, dy, dz, s_scale, rot_y) in enumerate([
    (-0.05, -0.02, 1.54, (0.07, 0.07, 0.26), -18),
    ( 0.00, -0.03, 1.59, (0.09, 0.09, 0.32),   0),
    ( 0.06, -0.01, 1.53, (0.07, 0.07, 0.24),  16),
]):
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.08, depth=0.30, vertices=8),
        f"Crown_Spike_{i}", "Head", (CX + dx, CY + dy, dz),
        scale=s_scale, rot=(math.radians(-14), math.radians(rot_y), 0),
        mat=mat_black_fur
    )

# Floppy Asymmetrical Ears (Left ear arches up/back, Right ear flops forward-down like reference)
# Left Ear (Arched up and folded back)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, segments=18, ring_count=12),
    "Ear_L_Base", "Head", (CX - 0.22, CY + 0.04, 1.48),
    scale=(0.42, 0.28, 1.30),
    rot=(math.radians(24), math.radians(-32), math.radians(16)),
    mat=mat_black_fur, smooth=True
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.10, segments=16, ring_count=10),
    "Ear_L_Inner", "Head", (CX - 0.21, CY - 0.01, 1.49),
    scale=(0.35, 0.18, 1.05),
    rot=(math.radians(24), math.radians(-32), math.radians(16)),
    mat=mat_ear_inner, smooth=True
)

# Right Ear (Bends and flops forward-down over the temple)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, segments=18, ring_count=12),
    "Ear_R_Base", "Head", (CX + 0.24, CY - 0.04, 1.42),
    scale=(0.44, 0.30, 1.20),
    rot=(math.radians(-35), math.radians(45), math.radians(-30)),
    mat=mat_black_fur, smooth=True
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.10, segments=16, ring_count=10),
    "Ear_R_Inner", "Head", (CX + 0.23, CY - 0.09, 1.40),
    scale=(0.36, 0.18, 0.95),
    rot=(math.radians(-35), math.radians(45), math.radians(-30)),
    mat=mat_ear_inner, smooth=True
)

# Bulging Crazed Eyes with Droopy Drunk Heavy Upper Eyelids
for side, sign in [("L", 1), ("R", -1)]:
    ex = CX + sign * 0.15
    # White Eyeball
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.135, segments=28, ring_count=18),
        f"Eyeball_{side}", "Head", (ex, CY - 0.285, 1.27),
        scale=(0.95, 0.65, 1.10), mat=mat_eye_white, smooth=True
    )
    # Heavy Droopy Upper Eyelid (covers top 35% of eyeball with warm-tan drunk eyelid)
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.142, segments=22, ring_count=14),
        f"Eyelid_Top_{side}", "Head", (ex, CY - 0.292, 1.305),
        scale=(0.98, 0.66, 0.72),
        rot=(math.radians(16), math.radians(sign * -8), 0),
        mat=mat_eyelid_drunk, smooth=True
    )
    # Reddish-Purple Under-Eye Bag
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.085, segments=18, ring_count=12),
        f"Eye_Bag_{side}", "Head", (ex, CY - 0.295, 1.175),
        scale=(1.12, 0.38, 0.42), rot=(math.radians(-8), 0, 0),
        mat=mat_eye_bag, smooth=True
    )
    # Crazed Pinprick Pupils (slightly deranged / misaligned)
    pupil_x = ex * 0.94 if side == "L" else ex * 0.98
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.038, segments=16, ring_count=12),
        f"Pupil_{side}", "Head", (pupil_x, CY - 0.370, 1.265),
        mat=mat_pupil_blk
    )
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.012, segments=10, ring_count=8),
        f"Eye_Spec_{side}", "Head", (pupil_x - 0.012, CY - 0.388, 1.285),
        mat=mat_specular
    )
    # Thick Wild Cartoon Eyebrow
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.042),
        f"Eyebrow_{side}", "Head", (ex, CY - 0.315, 1.415),
        scale=(1.9, 0.35, 0.55),
        rot=(math.radians(4), math.radians(sign * 26), math.radians(sign * -14)),
        mat=mat_black_fur
    )

# Reddish-Brown Cartoon Nose with Central Cleft
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.065, segments=20, ring_count=14),
    "Nose_Bulb", "Head", (CX, CY - 0.385, 1.195),
    scale=(1.25, 0.80, 0.72), mat=mat_nose_reddish, smooth=True
)

# Smooth Tan Muzzle Pad
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.25, segments=32, ring_count=22),
    "Muzzle_Tan_Base", "Head", (CX, CY - 0.22, 1.15),
    scale=(1.25, 0.70, 0.76), mat=mat_muzzle_tan, smooth=True
)

# Wide Smiling Dark Oral Cavity (Head)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.25, depth=0.07, vertices=28),
    "Mouth_Dark_Cavity", "Head", (CX, CY - 0.35, 1.075),
    scale=(1.20, 0.24, 0.40), rot=(math.radians(90), 0, 0),
    mat=mat_mouth_dark, smooth=True
)

# Two Big Dumb Cartoon Buck Front Teeth (Upper Incisors)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
    "Upper_Buck_L", "Head", (CX - 0.027, CY - 0.392, 1.082),
    scale=(0.048, 0.036, 0.115),
    rot=(math.radians(-5), math.radians(2), math.radians(-1)),
    mat=mat_teeth_corn
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
    "Upper_Buck_R", "Head", (CX + 0.027, CY - 0.392, 1.080),
    scale=(0.048, 0.036, 0.112),
    rot=(math.radians(-5), math.radians(-2), math.radians(1)),
    mat=mat_teeth_corn
)

# Dark Vertical Crevice between buck teeth
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
    "Buck_Teeth_Cleft", "Head", (CX, CY - 0.394, 1.082),
    scale=(0.007, 0.038, 0.118),
    mat=mat_mouth_dark
)

# Two small lower incisors anchored to Jaw
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
    "Lower_Tooth_L", "Jaw", (CX - 0.018, CY - 0.376, 1.035),
    scale=(0.024, 0.025, 0.048),
    rot=(math.radians(4), 0, 0),
    mat=mat_teeth_corn
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
    "Lower_Tooth_R", "Jaw", (CX + 0.018, CY - 0.376, 1.035),
    scale=(0.024, 0.025, 0.048),
    rot=(math.radians(4), 0, 0),
    mat=mat_teeth_corn
)

# Cartoon Whiskers
for side, sign in [("L", 1), ("R", -1)]:
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.004, depth=0.18, vertices=8),
        f"Whisker_Top_{side}", "Head", (CX + sign * 0.22, CY - 0.31, 1.18),
        scale=(1.0, 1.0, 1.0),
        rot=(math.radians(5), math.radians(sign * 78), math.radians(sign * -10)),
        mat=mat_mouth_dark
    )
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.004, depth=0.17, vertices=8),
        f"Whisker_Bot_{side}", "Head", (CX + sign * 0.21, CY - 0.31, 1.13),
        scale=(1.0, 1.0, 1.0),
        rot=(math.radians(-8), math.radians(sign * 82), math.radians(sign * 12)),
        mat=mat_mouth_dark
    )

# Chin & Scruffy Goatee (Jaw)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, segments=18, ring_count=12),
    "Chin_Goatee", "Jaw", (CX, CY - 0.31, 1.01),
    scale=(1.25, 0.65, 0.55), mat=mat_black_fur, smooth=True
)

# 8. GIANT BUSHY SQUIRREL TAIL (Tail.1..Tip) - USES DISTINCT mat_tail_fur
tail_curve = [
    ("Tail.1",   (CX, CY + 0.24, 0.66), 0.18, (1.0, 1.1, 1.0),   0),
    ("Tail.2",   (CX, CY + 0.42, 0.88), 0.28, (1.1, 1.2, 1.1),  12),
    ("Tail.3",   (CX, CY + 0.54, 1.22), 0.36, (1.2, 1.3, 1.2),  20),
    ("Tail.4",   (CX, CY + 0.48, 1.56), 0.40, (1.25, 1.35, 1.2), 12),
    ("Tail.Tip", (CX, CY + 0.36, 1.80), 0.32, (1.2, 1.25, 1.15), -14),
    ("Tail.Tip", (CX, CY + 0.20, 1.94), 0.24, (1.1, 1.15, 1.1), -30),
]
for idx, (bname, tpos, trad, tscale, trot_y) in enumerate(tail_curve):
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=trad, segments=22, ring_count=16),
        f"Tail_Part_{idx}", bname, tpos,
        scale=tscale, rot=(0, math.radians(trot_y), 0),
        mat=mat_tail_fur, smooth=True
    )
    if idx in [2, 3]:
        make_bone_mesh(
            lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.14, depth=0.34, vertices=8),
            f"Tail_Tuft_{idx}", bname, (tpos[0] + 0.22, tpos[1] + 0.08, tpos[2]),
            rot=(0, math.radians(35), math.radians(20)),
            mat=mat_tail_fur
        )

# 9. CAMERA RIG: CALIBRATED ORTHOGRAPHIC FOR SPRITESHEETS
cam_obj = bpy.data.objects.get("RenderCam")
if not cam_obj:
    cam_data = bpy.data.cameras.new("RenderCam")
    cam_obj = bpy.data.objects.new("RenderCam", cam_data)
    col.objects.link(cam_obj)

cam_obj.data.type = 'ORTHO'
cam_obj.data.ortho_scale = 2.45
bpy.context.scene.camera = cam_obj

cam_target = bpy.data.objects.get("CamTarget")
if not cam_target:
    cam_target = bpy.data.objects.new("CamTarget", None)
    col.objects.link(cam_target)
cam_target.location = (CX, CY, 1.02)

cam_obj.constraints.clear()
tt = cam_obj.constraints.new(type='TRACK_TO')
tt.target = cam_target
tt.track_axis = 'TRACK_NEGATIVE_Z'
tt.up_axis = 'UP_Y'

# Studio Lighting: Comic Studio Key + Ambient Fill (Zero RimSun to eliminate specular sheen)
for light_name, ltype, lpos, lpwr, lcol in [
    ("KeySun",   "SUN",   (CX + 2.2, CY - 3.2, 3.6), 4.0,  (1.0, 0.98, 0.92)),
    ("FillSun",  "SUN",   (CX - 2.8, CY - 1.8, 1.8), 0.8,  (0.70, 0.80, 0.95)),
    ("RimSun",   "SUN",   (CX,       CY + 3.4, 3.4), 0.0,  (0.0, 0.0, 0.0)),
]:
    lo = bpy.data.objects.get(light_name)
    if not lo:
        ld = bpy.data.lights.new(light_name, ltype)
        lo = bpy.data.objects.new(light_name, ld)
        col.objects.link(lo)
    lo.data.energy = lpwr
    lo.data.color = lcol
    lo.location = lpos

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

out_dir = os.path.abspath(r"apps\web\public\actions\hemp_crew")
os.makedirs(out_dir, exist_ok=True)

# 10. TEST RENDERS (Rest A-Pose)
cam_obj.location = (CX, CY - 3.8, 1.02)
out_front = os.path.join(out_dir, "frankie_humanoid_front.png")
scene.render.filepath = out_front
bpy.ops.render.render(write_still=True)
print(f"Rendered Humanoid Front View: {out_front}")

cam_obj.location = (CX + 2.6, CY - 2.8, 1.45)
out_iso = os.path.join(out_dir, "frankie_humanoid_iso.png")
scene.render.filepath = out_iso
bpy.ops.render.render(write_still=True)
print(f"Rendered Humanoid Iso View: {out_iso}")

out_blend = os.path.join(out_dir, "frankie_humanoid_master.blend")
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
print(f"Saved Master Humanoid Rigged Blend: {out_blend}")
print("=== HUMANOID FRANKIE ACTOR REBUILT SUCCESSFULLY ===")
