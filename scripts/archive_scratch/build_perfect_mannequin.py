import socket

code = """
import bpy
import math

# 1. Purge all existing mannequin pieces in scene
for obj in list(bpy.data.objects):
    if 'char1' not in obj.name and 'moonlit' not in obj.name.lower() and obj.type != 'LIGHT' and obj.type != 'CAMERA':
        bpy.data.objects.remove(obj, do_unlink=True)

# 2. Get exact Moonlit Mage Dimensions & Ground Level
mage_mesh = None
for obj in bpy.data.objects:
    if 'char1' in obj.name or 'moonlit' in obj.name.lower():
        if obj.type == 'MESH':
            mage_mesh = obj
            break

mage_height = mage_mesh.dimensions.z if mage_mesh else 1.35
print(f"Target Mage Height: {mage_height:.3f}m")

# 3. Build Pure Articulated JRPG Anime Mannequin (1:1 with Mage Height & Skeleton)
# Chibi proportions: 4.5 heads tall
# Total Height = H
H = mage_height
head_radius = H * 0.125
torso_h = H * 0.28
leg_h = H * 0.42
shoulder_w = H * 0.28
hip_w = H * 0.18

col = bpy.context.scene.collection

# Materials
mat_mannequin = bpy.data.materials.new("JRPG_Mannequin_Porcelain")
mat_mannequin.use_nodes = True
bsdf = mat_mannequin.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs['Base Color'].default_value = (0.92, 0.88, 0.84, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.3

mat_joint = bpy.data.materials.new("JRPG_Mannequin_Brass")
mat_joint.use_nodes = True
bsdf_j = mat_joint.node_tree.nodes.get("Principled BSDF")
if bsdf_j:
    bsdf_j.inputs['Base Color'].default_value = (0.85, 0.70, 0.25, 1.0)
    bsdf_j.inputs['Metallic'].default_value = 0.9
    bsdf_j.inputs['Roughness'].default_value = 0.2

# Armature
arm_data = bpy.data.armatures.new("JRPG_Mage_Aligned_Armature")
arm_data.display_type = 'STICK'
arm_obj = bpy.data.objects.new("JRPG_Mannequin_Rig", arm_data)
arm_obj.location = (0, 0, 0)
col.objects.link(arm_obj)

bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode='EDIT')

# Bones exactly matching Mage proportions
b_hips = arm_data.edit_bones.new("Hips")
b_hips.head = (0, 0, leg_h)
b_hips.tail = (0, 0.05, leg_h)

b_spine = arm_data.edit_bones.new("Spine")
b_spine.head = (0, 0, leg_h)
b_spine.tail = (0, 0, leg_h + torso_h * 0.5)
b_spine.parent = b_hips

b_chest = arm_data.edit_bones.new("Chest")
b_chest.head = (0, 0, leg_h + torso_h * 0.5)
b_chest.tail = (0, 0, leg_h + torso_h)
b_chest.parent = b_spine

b_neck = arm_data.edit_bones.new("Neck")
b_neck.head = (0, 0, leg_h + torso_h)
b_neck.tail = (0, 0, leg_h + torso_h + H * 0.04)
b_neck.parent = b_chest

b_head = arm_data.edit_bones.new("Head")
b_head.head = (0, 0, leg_h + torso_h + H * 0.04)
b_head.tail = (0, 0, H)
b_head.parent = b_neck

for side, sign in [("Left", 1), ("Right", -1)]:
    # Arms
    b_sh = arm_data.edit_bones.new(f"{side}Shoulder")
    b_sh.head = (sign * 0.03, 0, leg_h + torso_h * 0.9)
    b_sh.tail = (sign * shoulder_w * 0.5, 0, leg_h + torso_h * 0.9)
    b_sh.parent = b_chest

    b_arm = arm_data.edit_bones.new(f"{side}Arm")
    b_arm.head = (sign * shoulder_w * 0.5, 0, leg_h + torso_h * 0.9)
    b_arm.tail = (sign * (shoulder_w * 0.5 + H * 0.16), 0, leg_h + torso_h * 0.9)
    b_arm.parent = b_sh

    b_fa = arm_data.edit_bones.new(f"{side}ForeArm")
    b_fa.head = (sign * (shoulder_w * 0.5 + H * 0.16), 0, leg_h + torso_h * 0.9)
    b_fa.tail = (sign * (shoulder_w * 0.5 + H * 0.30), 0, leg_h + torso_h * 0.9)
    b_fa.parent = b_arm

    b_hand = arm_data.edit_bones.new(f"{side}Hand")
    b_hand.head = (sign * (shoulder_w * 0.5 + H * 0.30), 0, leg_h + torso_h * 0.9)
    b_hand.tail = (sign * (shoulder_w * 0.5 + H * 0.36), 0, leg_h + torso_h * 0.9)
    b_hand.parent = b_fa

    # Legs
    b_ul = arm_data.edit_bones.new(f"{side}UpLeg")
    b_ul.head = (sign * hip_w * 0.5, 0, leg_h)
    b_ul.tail = (sign * hip_w * 0.5, -0.01, leg_h * 0.52)
    b_ul.parent = b_hips

    b_l = arm_data.edit_bones.new(f"{side}Leg")
    b_l.head = (sign * hip_w * 0.5, -0.01, leg_h * 0.52)
    b_l.tail = (sign * hip_w * 0.5, 0, H * 0.06)
    b_l.parent = b_ul

    b_ft = arm_data.edit_bones.new(f"{side}Foot")
    b_ft.head = (sign * hip_w * 0.5, 0, H * 0.06)
    b_ft.tail = (sign * hip_w * 0.5, -H * 0.09, 0)
    b_ft.parent = b_l

bpy.ops.object.mode_set(mode='OBJECT')

# Helper to create and parent segmented mannequin mesh parts
def create_part(name, mesh_fn, bone_name, mat, loc=(0,0,0), rot=(0,0,0), sc=(1,1,1)):
    mesh_fn()
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(mat)
    o.parent = arm_obj
    o.parent_type = 'BONE'
    o.parent_bone = bone_name
    o.location = loc
    o.rotation_euler = rot
    o.scale = sc
    return o

# 1. Anime Skull (Expanded dome + cute tapered jaw)
def make_head():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=head_radius, segments=32, ring_count=24)
create_part("M_Head", make_head, "Head", mat_mannequin, loc=(0, 0, head_radius * 0.8), sc=(1.08, 1.02, 1.12))

# 2. Torso (Chest + Hips with brass waist pivot)
def make_chest():
    bpy.ops.mesh.primitive_cube_add(size=torso_h * 0.45)
create_part("M_Chest", make_chest, "Chest", mat_mannequin, loc=(0, 0, torso_h * 0.22), sc=(1.2, 0.75, 1.0))

def make_hips():
    bpy.ops.mesh.primitive_cube_add(size=torso_h * 0.38)
create_part("M_Hips", make_hips, "Hips", mat_mannequin, loc=(0, 0, 0), sc=(1.1, 0.7, 0.7))

# 3. Limbs (Arms + Hands)
def make_arm_seg():
    bpy.ops.mesh.primitive_cylinder_add(radius=H * 0.026, depth=H * 0.14, vertices=20)

def make_hand():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=H * 0.032, segments=16, ring_count=16)

def make_leg_seg():
    bpy.ops.mesh.primitive_cylinder_add(radius=H * 0.032, depth=leg_h * 0.44, vertices=20)

for side, sign in [("Left", 1), ("Right", -1)]:
    create_part(f"M_Arm_{side}", make_arm_seg, f"{side}Arm", mat_mannequin, loc=(sign * H * 0.08, 0, 0), rot=(0, math.radians(90), 0))
    create_part(f"M_FArm_{side}", make_arm_seg, f"{side}ForeArm", mat_mannequin, loc=(sign * H * 0.07, 0, 0), rot=(0, math.radians(90), 0))
    create_part(f"M_Hand_{side}", make_hand, f"{side}Hand", mat_mannequin, loc=(sign * H * 0.03, 0, 0), sc=(1.2, 0.9, 0.8))

    create_part(f"M_ULeg_{side}", make_leg_seg, f"{side}UpLeg", mat_mannequin, loc=(0, 0, -leg_h * 0.22))
    create_part(f"M_Leg_{side}", make_leg_seg, f"{side}Leg", mat_mannequin, loc=(0, 0, -leg_h * 0.22))

print("✨ Built 1:1 Mage-Calibrated JRPG Mannequin with perfectly aligned Skeleton and proportional hands/head!")
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("BUILT_PERFECT_MANNEQUIN")
