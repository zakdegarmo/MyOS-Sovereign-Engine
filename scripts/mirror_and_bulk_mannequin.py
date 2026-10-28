import bpy
import os
import math

SRC_BLEND = os.path.abspath("mannequin_lpc_tuning_studio0.blend")
TARGET_BLEND = os.path.abspath("mannequin_lpc_tuning_studio1.blend")

print(f"Loading from: {SRC_BLEND}")
bpy.ops.wm.open_mainfile(filepath=SRC_BLEND)

arm = bpy.data.objects['Armature']
man = bpy.data.objects['Mannequin']

bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')

# Select all left side bones
bpy.ops.pose.select_all(action='DESELECT')
for pb in arm.pose.bones:
    if pb.name.startswith('Left') or 'left' in pb.name.lower():
        pb.select = True

# Copy pose and paste flipped to right side
bpy.ops.pose.copy()
bpy.ops.pose.paste(flipped=True)

# Boost depth on Armature and individual limbs
# Increase Armature Y-scale slightly to give the torso and ribcage solid depth
arm.scale.y = 1.35  # Thicker front-to-back depth!

# Also bulk up the limbs (arms and legs) cross-sectionally
limb_bones = [
    'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm',
    'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg'
]
for b_name in limb_bones:
    if b_name in arm.pose.bones:
        pb = arm.pose.bones[b_name]
        # Thicken bone cross section (X and Z in bone local space)
        pb.scale.x = 1.25
        pb.scale.z = 1.25

bpy.ops.object.mode_set(mode='OBJECT')

# Save as studio1
bpy.ops.wm.save_as_mainfile(filepath=TARGET_BLEND)
print(f"Saved mirrored and bulked studio -> {TARGET_BLEND}")

# Render a 3/4 perspective snapshot to show depth and symmetry
cam = bpy.data.objects['RenderCam']
cam.data.type = 'PERSP'
cam.location = (2.2, -2.8, 1.4)
cam.rotation_euler = (math.radians(65), 0, math.radians(35))

bpy.context.scene.render.image_settings.file_format = 'PNG'
bpy.context.scene.render.filepath = os.path.abspath('artifacts/verification/lpc_mannequin_persp_preview.png')
bpy.ops.render.render(write_still=True)
print("Rendered 3/4 perspective preview!")

# Render side profile snapshot
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.0
cam.location = (3.5, 0.0, 0.7)
cam.rotation_euler = (math.radians(90), 0, math.radians(90))
bpy.context.scene.render.filepath = os.path.abspath('artifacts/verification/lpc_mannequin_side_preview.png')
bpy.ops.render.render(write_still=True)
print("Rendered side profile preview!")
