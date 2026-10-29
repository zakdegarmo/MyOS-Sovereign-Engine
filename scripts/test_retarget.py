import bpy
import math

# 1. Restore pristine mannequin_chibi_basic.blend to target
bpy.ops.wm.open_mainfile(filepath=r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic.blend')

# 2. Build our clean chibi rig (from build_master_rig.py)
# First save as rigTest1
bpy.ops.wm.save_mainfile(filepath=r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic_rigTest1.blend')
import sys
sys.path.append(r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\scripts')
import build_master_rig
build_master_rig.build_rig(r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic_rigTest1.blend')

# 3. Now open rigTest1 and test retargeting Walk_Loop from UAL1
bpy.ops.wm.open_mainfile(filepath=r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic_rigTest1.blend')
chibi_arm = bpy.data.objects['Armature']

# Import UAL1 in background to extract actions
bpy.ops.import_scene.gltf(filepath=r'apps/web/dist/models/Universal Animation Library[Standard]/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb')
ual_arm = [o for o in bpy.data.objects if o.type == 'ARMATURE' and o != chibi_arm][0]

# Mapping table from UAL1 bones to Chibi Master Rig bones
bone_map = {
    'pelvis': 'pelvis',
    'spine_01': 'spine',
    'spine_02': 'chest',
    'neck_01': 'neck',
    'Head': 'head',
    'clavicle_l': 'shoulder.L',
    'upperarm_l': 'upper_arm.L',
    'lowerarm_l': 'forearm.L',
    'hand_l': 'hand.L',
    'clavicle_r': 'shoulder.R',
    'upperarm_r': 'upper_arm.R',
    'lowerarm_r': 'forearm.R',
    'hand_r': 'hand.R',
    'thigh_l': 'thigh.L',
    'calf_l': 'shin.L',
    'foot_l': 'foot.L',
    'ball_l': 'toe.L',
    'thigh_r': 'thigh.R',
    'calf_r': 'shin.R',
    'foot_r': 'foot.R',
    'ball_r': 'toe.R',
}

# Retarget Walk_Loop
walk_act = bpy.data.actions.get('Walk_Loop')
ual_arm.animation_data.action = walk_act

new_act = bpy.data.actions.new(name='Walk_Loop')
new_act.use_fake_user = True
chibi_arm.animation_data_create()
chibi_arm.animation_data.action = new_act

scale_factor = 1.282 / 1.6804

start_f = int(walk_act.frame_range[0])
end_f = int(walk_act.frame_range[1])
scene = bpy.context.scene

for f in range(start_f, end_f + 1):
    scene.frame_set(f)
    bpy.context.view_layer.update()
    
    for src_name, dst_name in bone_map.items():
        src_pb = ual_arm.pose.bones.get(src_name)
        dst_pb = chibi_arm.pose.bones.get(dst_name)
        if not src_pb or not dst_pb: continue
        
        # Copy rotation
        dst_pb.rotation_mode = 'QUATERNION'
        dst_pb.rotation_quaternion = src_pb.rotation_quaternion.copy()
        dst_pb.keyframe_insert(data_path='rotation_quaternion', frame=f)
        
        # For pelvis, copy location scaled
        if dst_name == 'pelvis':
            dst_pb.location = src_pb.location * scale_factor
            dst_pb.keyframe_insert(data_path='location', frame=f)

# Delete UAL arm after transfer
bpy.data.objects.remove(ual_arm, do_unlink=True)

# Render frame 16 of retargeted Walk_Loop
scene.frame_set(16)
scene.render.filepath = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\retargeted_chibi_walk.png'
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_mainfile(filepath=r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic_rigTest1.blend')
print('Retargeted Walk_Loop rendered and saved!')
