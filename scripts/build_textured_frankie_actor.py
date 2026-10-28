import bpy
import math
import os

print("=== REBUILDING FRANKIE GALLAGHER TO MATCH REFERENCE ART ===")

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

# 2. EXTEND ARMATURE: JAW & SIDE-BILLOWING BUSHY TAIL
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_obj.data.edit_bones

b_head = eb.get('Head')
b_hips = eb.get('Hips')

# Jaw bone
if not eb.get('Jaw'):
    b_jaw = eb.new('Jaw')
    b_jaw.head = (CX, CY - 0.06, 1.08)
    b_jaw.tail = (CX, CY - 0.28, 0.98)
    b_jaw.parent = b_head

# Bushy Squirrel Tail: Billowing out to character's right (viewer's left, X < CX)
# Arches over the side/shoulder, max Z = 1.38, COMPLETELY clearing the head!
t_coords = [
    ('Tail.1',   (CX - 0.08, CY + 0.16, 0.60), (CX - 0.22, CY + 0.22, 0.74)),
    ('Tail.2',   (CX - 0.22, CY + 0.22, 0.74), (CX - 0.44, CY + 0.26, 0.96)),
    ('Tail.3',   (CX - 0.44, CY + 0.26, 0.96), (CX - 0.52, CY + 0.24, 1.20)),
    ('Tail.4',   (CX - 0.52, CY + 0.24, 1.20), (CX - 0.42, CY + 0.18, 1.38)),
    ('Tail.Tip', (CX - 0.42, CY + 0.18, 1.38), (CX - 0.25, CY + 0.12, 1.44)),
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

# 3. CLEAN 100% MATTE COMIC CEL SHADERS (Zero specular shine, no noisy TV static)
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
        color_shadow = (color_base[0] * 0.42, color_base[1] * 0.42, color_base[2] * 0.45, 1.0)

    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = color_shadow
    ramp.color_ramp.elements[1].position = 0.36
    ramp.color_ramp.elements[1].color = (color_base[0], color_base[1], color_base[2], 1.0)

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

# Comic Palette
mat_black_fur   = make_cel_material("Black_Fur",   (0.14, 0.13, 0.16), (0.04, 0.04, 0.05, 1.0))
mat_tail_fur    = make_cel_material("Tail_Fur",    (0.32, 0.32, 0.36), (0.15, 0.15, 0.18, 1.0)) # Smoky ash-slate
mat_ear_inner   = make_cel_material("Ear_Inner",   (0.85, 0.52, 0.38), (0.50, 0.28, 0.16, 1.0)) # Warm orange-pink
mat_muzzle_tan  = make_cel_material("Muzzle_Tan",  (0.82, 0.62, 0.44), (0.50, 0.34, 0.20, 1.0))
mat_suit_char   = make_cel_material("Suit_Grey",   (0.36, 0.37, 0.40), (0.18, 0.19, 0.22, 1.0))
mat_shirt_off   = make_cel_material("Shirt_Off",   (0.96, 0.94, 0.90), (0.68, 0.66, 0.60, 1.0))
mat_tie_black   = make_cel_material("Tie_Black",   (0.06, 0.05, 0.07), (0.02, 0.02, 0.02, 1.0))
mat_belt_gold   = make_cel_material("Belt_Gold",   (0.92, 0.72, 0.18), (0.48, 0.32, 0.08, 1.0))
mat_belt_strap  = make_cel_material("Belt_Strap",  (0.08, 0.08, 0.08), (0.03, 0.03, 0.03, 1.0))
mat_eye_white   = make_cel_material("Eye_White",   (0.98, 0.98, 0.96), (0.82, 0.80, 0.75, 1.0))
mat_eye_bag     = make_cel_material("Eye_Bags",    (0.55, 0.28, 0.26), (0.32, 0.14, 0.12, 1.0))
mat_pupil_blk   = make_cel_material("Eye_Pupil",   (0.01, 0.01, 0.01), (0.00, 0.00, 0.00, 1.0))
mat_specular    = make_emission_material("Eye_Spec", (1.0, 1.0, 1.0, 1.0), strength=2.0)
mat_nose_reddish= make_cel_material("Nose_Reddish",(0.78, 0.34, 0.30), (0.44, 0.16, 0.12, 1.0))
mat_mouth_dark  = make_cel_material("Mouth_Dark",  (0.04, 0.01, 0.02), (0.02, 0.00, 0.01, 1.0))
mat_teeth_corn  = make_cel_material("Teeth_Corn",  (0.97, 0.95, 0.86), (0.72, 0.68, 0.54, 1.0))
mat_paw_pad     = make_cel_material("Paw_Pad",     (0.24, 0.20, 0.22), (0.12, 0.10, 0.11, 1.0))
mat_joint_pap   = make_cel_material("Joint_Pap",   (0.95, 0.92, 0.85), (0.64, 0.62, 0.56, 1.0))
mat_cherry_lit  = make_emission_material("Cherry_Lit", (1.0, 0.30, 0.01, 1.0), strength=20.0)
mat_smoke_puff  = make_cel_material("Smoke_Puff",  (0.88, 0.88, 0.92), (0.52, 0.54, 0.60, 1.0))

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
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.085, depth=0.25, vertices=16),
        f"Trouser_Thigh_{side}", b_up, (lx, CY + 0.005, 0.46),
        scale=(1.05, 1.05, 1.0), mat=mat_suit_char, smooth=True
    )
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.078, depth=0.28, vertices=16),
        f"Trouser_Shin_{side}", b_leg, (lx, CY + 0.010, 0.21),
        scale=(1.02, 1.02, 1.0), mat=mat_suit_char, smooth=True
    )
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

# 5. TORSO, JACKET, OPEN SHIRT & TIE
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.21, segments=22, ring_count=16),
    "Torso_Belly", "Spine", (CX, CY - 0.01, 0.72),
    scale=(1.12, 1.05, 0.95), mat=mat_suit_char, smooth=True
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.21, depth=0.26, vertices=20),
    "Jacket_Chest", "Spine01", (CX, CY + 0.02, 0.84),
    scale=(1.18, 0.82, 1.0), mat=mat_suit_char, smooth=True
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, segments=16, ring_count=12),
    "Shirt_Front", "Spine01", (CX, CY - 0.14, 0.86),
    scale=(0.80, 0.45, 1.10), mat=mat_shirt_off, smooth=True
)
for side, sign in [("L", 1), ("R", -1)]:
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.08),
        f"Lapel_{side}", "Spine01", (CX + sign * 0.09, CY - 0.17, 0.86),
        scale=(0.55, 0.22, 2.0), rot=(math.radians(10), math.radians(sign * 16), math.radians(sign * -20)),
        mat=mat_suit_char
    )
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

# 6. ARMS, SLEEVES & JOINT
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

# Fat Rolled Joint in Left Hand
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

# 7. HEAD, EARS & REFERENCE ANATOMY FACE (Matching user reference art on left)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=0.10, vertices=16),
    "Neck_Fur", "neck", (CX, CY - 0.02, 0.95),
    mat=mat_black_fur, smooth=True
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.28, segments=32, ring_count=22),
    "Head_Base", "Head", (CX, CY - 0.06, 1.20),
    scale=(1.06, 0.94, 1.00), mat=mat_black_fur, smooth=True
)

# Shaggy Cheek Tufts
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

# Messy Crown Hair Spikes
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

# Floppy Asymmetrical Ears (Left ear sweeps up/back, Right ear bent forward-down)
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

# 8. BIG BULGING CRAZED EYES (Fully Open, Manic Stare, Dark Under-Eye Bags)
for side, sign in [("L", 1), ("R", -1)]:
    ex = CX + sign * 0.14
    # Large, spherical, forward-bulging white sclera
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.145, segments=28, ring_count=20),
        f"Eyeball_{side}", "Head", (ex, CY - 0.28, 1.28),
        scale=(1.05, 0.70, 1.15), mat=mat_eye_white, smooth=True
    )
    # Eyebags underneath the lower rim
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, segments=16, ring_count=10),
        f"Eye_Bag_{side}", "Head", (ex, CY - 0.30, 1.17),
        scale=(1.25, 0.40, 0.40), rot=(math.radians(-8), 0, 0),
        mat=mat_eye_bag, smooth=True
    )
    # Crazy dilated cartoon pupil (front-centered)
    pupil_x = ex + sign * 0.01
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.052, segments=16, ring_count=12),
        f"Pupil_{side}", "Head", (pupil_x, CY - 0.380, 1.275),
        mat=mat_pupil_blk
    )
    # Specular shine glint
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.016, segments=10, ring_count=8),
        f"Eye_Spec_{side}", "Head", (pupil_x - 0.016, CY - 0.395, 1.300),
        mat=mat_specular
    )
    # Wild cartoon eyebrow (high and arched, leaving eye fully visible!)
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=0.042),
        f"Eyebrow_{side}", "Head", (ex, CY - 0.30, 1.44),
        scale=(1.9, 0.35, 0.55),
        rot=(math.radians(6), math.radians(sign * 24), math.radians(sign * -12)),
        mat=mat_black_fur
    )

# Reddish-Brown Cartoon Nose with Central Cleft
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.065, segments=20, ring_count=14),
    "Nose_Bulb", "Head", (CX, CY - 0.380, 1.20),
    scale=(1.25, 0.80, 0.72), mat=mat_nose_reddish, smooth=True
)

# Smooth Tan Muzzle Base
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.25, segments=32, ring_count=22),
    "Muzzle_Tan_Base", "Head", (CX, CY - 0.22, 1.14),
    scale=(1.25, 0.70, 0.76), mat=mat_muzzle_tan, smooth=True
)

# 9. WIDE CRAZED CLENCHED-TEETH GRIMACE (Full row of teeth matching reference)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.26, depth=0.08, vertices=28),
    "Mouth_Dark_Cavity", "Head", (CX, CY - 0.34, 1.075),
    scale=(1.35, 0.24, 0.40), rot=(math.radians(90), 0, 0),
    mat=mat_mouth_dark, smooth=True
)

# Two Big Dumb Central Buck Teeth
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
    "Upper_Buck_L", "Head", (CX - 0.030, CY - 0.388, 1.080),
    scale=(0.052, 0.034, 0.105),
    rot=(math.radians(-5), math.radians(2), math.radians(-1)),
    mat=mat_teeth_corn
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
    "Upper_Buck_R", "Head", (CX + 0.030, CY - 0.388, 1.080),
    scale=(0.052, 0.034, 0.105),
    rot=(math.radians(-5), math.radians(-2), math.radians(1)),
    mat=mat_teeth_corn
)

# Flanking Lateral Upper Teeth completing the manic wide grin
for t_idx, (t_name, dx, rot_z) in enumerate([
    ("Upper_Lat_L1", CX - 0.085,  12),
    ("Upper_Lat_L2", CX - 0.140,  24),
    ("Upper_Lat_R1", CX + 0.085, -12),
    ("Upper_Lat_R2", CX + 0.140, -24),
]):
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
        t_name, "Head", (dx, CY - 0.370, 1.082),
        scale=(0.040, 0.030, 0.080),
        rot=(math.radians(-4), 0, math.radians(rot_z)),
        mat=mat_teeth_corn
    )

# Lower Clenched Teeth (anchored to Jaw)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
    "Lower_Tooth_L", "Jaw", (CX - 0.024, CY - 0.376, 1.032),
    scale=(0.032, 0.025, 0.055),
    rot=(math.radians(4), 0, 0),
    mat=mat_teeth_corn
)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
    "Lower_Tooth_R", "Jaw", (CX + 0.024, CY - 0.376, 1.032),
    scale=(0.032, 0.025, 0.055),
    rot=(math.radians(4), 0, 0),
    mat=mat_teeth_corn
)
for t_idx, (t_name, dx, rot_z) in enumerate([
    ("Lower_Lat_L1", CX - 0.075,  10),
    ("Lower_Lat_R1", CX + 0.075, -10),
]):
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
        t_name, "Jaw", (dx, CY - 0.365, 1.032),
        scale=(0.032, 0.025, 0.050),
        rot=(math.radians(4), 0, math.radians(rot_z)),
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

# Chin & Goatee (Jaw)
make_bone_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, segments=18, ring_count=12),
    "Chin_Goatee", "Jaw", (CX, CY - 0.31, 1.01),
    scale=(1.25, 0.65, 0.55), mat=mat_black_fur, smooth=True
)

# 10. GIANT BUSHY SQUIRREL TAIL (Billowing out to viewer's left, NOT over head!)
tail_curve = [
    ("Tail.1",   (CX - 0.12, CY + 0.20, 0.64), 0.18, (1.0, 1.1, 1.0),  -15),
    ("Tail.2",   (CX - 0.30, CY + 0.26, 0.82), 0.26, (1.1, 1.2, 1.1),  -22),
    ("Tail.3",   (CX - 0.48, CY + 0.28, 1.06), 0.34, (1.2, 1.3, 1.2),  -14),
    ("Tail.4",   (CX - 0.46, CY + 0.22, 1.28), 0.35, (1.2, 1.3, 1.2),   12),
    ("Tail.Tip", (CX - 0.34, CY + 0.16, 1.38), 0.28, (1.15, 1.2, 1.1),  28),
    ("Tail.Tip", (CX - 0.20, CY + 0.10, 1.42), 0.20, (1.1, 1.15, 1.1),  40),
]
for idx, (bname, tpos, trad, tscale, trot_y) in enumerate(tail_curve):
    make_bone_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=trad, segments=22, ring_count=16),
        f"Tail_Part_{idx}", bname, tpos,
        scale=tscale, rot=(0, math.radians(trot_y), math.radians(10)),
        mat=mat_tail_fur, smooth=True
    )
    if idx in [2, 3]:
        make_bone_mesh(
            lambda: bpy.ops.mesh.primitive_cone_add(radius1=0.12, depth=0.30, vertices=8),
            f"Tail_Tuft_{idx}", bname, (tpos[0] - 0.18, tpos[1] + 0.04, tpos[2]),
            rot=(0, math.radians(-35), math.radians(-20)),
            mat=mat_tail_fur
        )

# 11. CAMERA RIG: CALIBRATED ORTHOGRAPHIC FOR SPRITESHEETS
cam = bpy.data.objects.get("RenderCam")
if not cam:
    cam_data = bpy.data.cameras.new("RenderCam")
    cam = bpy.data.objects.new("RenderCam", cam_data)
    col.objects.link(cam)

cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.45
bpy.context.scene.camera = cam

# Save the textured master rig
output_blend = os.path.abspath(r"apps\web\public\actions\hemp_crew\frankie_textured_master.blend")
bpy.ops.wm.save_as_mainfile(filepath=output_blend)
print(f"[OK] Successfully built and saved Frankie to: {output_blend}")

# 12. RENDER TEST STILL (Front View)
ARTIFACT_DIR = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e"
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True

cam.location = (0.0, -3.5, 1.02)
cam.rotation_euler = (math.radians(90), 0, 0)

front_path = os.path.join(ARTIFACT_DIR, "frankie_remodel_front_test.png")
scene.render.filepath = front_path
bpy.ops.render.render(write_still=True)
print(f"Rendered front still to: {front_path}")

print("=== REBUILD COMPLETE ===")
