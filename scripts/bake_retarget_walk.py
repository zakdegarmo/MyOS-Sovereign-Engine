import bpy
import math

# Load rigTest1
bpy.ops.wm.open_mainfile(filepath=r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic_rigTest1.blend')
target_arm = bpy.data.objects['Armature']

# Import UAL1 in background
bpy.ops.import_scene.gltf(filepath=r'apps/web/dist/models/Universal Animation Library[Standard]/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb')
source_arm = [o for o in bpy.data.objects if o.type == 'ARMATURE' and o != target_arm][0]
# Remove any mesh imported with UAL1
for o in list(bpy.data.objects):
    if o.type == 'MESH' and o.name != 'Mannequin':
        bpy.data.objects.remove(o, do_unlink=True)

# Set up bone mapping
mapping = {
    'Hips': 'pelvis',
    'Spine': 'spine_01',
    'Spine01': 'spine_02',
    'neck': 'neck_01',
    'Head': 'Head',
    'LeftShoulder': 'clavicle_l',
    'LeftArm': 'upperarm_l',
    'LeftForeArm': 'lowerarm_l',
    'LeftHand': 'hand_l',
    'RightShoulder': 'clavicle_r',
    'RightArm': 'upperarm_r',
    'RightForeArm': 'lowerarm_r',
    'RightHand': 'hand_r',
    'LeftUpLeg': 'thigh_l',
    'LeftLeg': 'calf_l',
    'LeftFoot': 'foot_l',
    'LeftToeBase': 'ball_l',
    'RightUpLeg': 'thigh_r',
    'RightLeg': 'calf_r',
    'RightFoot': 'foot_r',
    'RightToeBase': 'ball_r',
}

# Position source armature to align with target in world space
source_arm.location = (target_arm.location.x, target_arm.location.y, target_arm.location.z)
source_arm.scale = (1.282 / 1.68, 1.282 / 1.68, 1.282 / 1.68)

# Set source action to Walk_Loop
walk_act = bpy.data.actions.get('Walk_Loop')
source_arm.animation_data.action = walk_act

start_f = int(walk_act.frame_range[0])
end_f = int(walk_act.frame_range[1])

# Add Copy Transforms constraints on target pose bones
bpy.context.view_layer.objects.active = target_arm
bpy.ops.object.mode_set(mode='POSE')

for tgt_bone, src_bone in mapping.items():
    pb = target_arm.pose.bones.get(tgt_bone)
    if not pb: continue
    
    # Rotation
    cr = pb.constraints.new('COPY_ROTATION')
    cr.name = 'RETARGET_ROT'
    cr.target = source_arm
    cr.subtarget = src_bone
    cr.target_space = 'WORLD'
    cr.owner_space = 'WORLD'
    
    # For hips, also copy location relative
    if tgt_bone == 'Hips':
        cl = pb.constraints.new('COPY_LOCATION')
        cl.name = 'RETARGET_LOC'
        cl.target = source_arm
        cl.subtarget = src_bone
        cl.target_space = 'WORLD'
        cl.owner_space = 'WORLD'

# Bake animation into a new Action on target_arm
bpy.ops.nla.bake(
    frame_start=start_f,
    frame_end=end_f,
    step=1,
    only_selected=False,
    visual_keying=True,
    clear_constraints=True,
    clear_parents=False,
    use_current_action=False,
    bake_types={'POSE'}
)

baked_act = target_arm.animation_data.action
baked_act.name = 'Walk_Loop'
baked_act.use_fake_user = True

# Delete temporary source arm
bpy.ops.object.mode_set(mode='OBJECT')
bpy.data.objects.remove(source_arm, do_unlink=True)

# Render verification frame 16
scene = bpy.context.scene
scene.frame_set(16)
scene.render.filepath = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\baked_chibi_walk_f16.png'
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_mainfile(filepath=r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic_rigTest1.blend')
print(f'Baked Walk_Loop ({start_f}..{end_f}) to chibi rig and saved!')
