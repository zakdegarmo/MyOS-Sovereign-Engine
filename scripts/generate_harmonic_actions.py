import bpy
import math
import numpy as np
from mathutils import Vector, Euler, Quaternion

def clear_existing_actions():
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act)

def create_action(arm_obj, name, num_frames):
    act = bpy.data.actions.new(name=name)
    act.use_fake_user = True
    if not arm_obj.animation_data:
        arm_obj.animation_data_create()
    arm_obj.animation_data.action = act
    return act

def push_to_nla(arm_obj, action):
    track = arm_obj.animation_data.nla_tracks.new()
    track.name = action.name
    strip = track.strips.new(action.name, 1, action)
    strip.action = action

def bake_harmonic_actions(filepath):
    bpy.ops.wm.open_mainfile(filepath=filepath)
    
    arm = bpy.data.objects.get('Armature')
    if not arm:
        raise ValueError("Armature not found!")

    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    pb = arm.pose.bones

    # Clear old NLA tracks and actions
    if arm.animation_data:
        for t in list(arm.animation_data.nla_tracks):
            arm.animation_data.nla_tracks.remove(t)
    clear_existing_actions()

    scene = bpy.context.scene
    scene.render.fps = 30

    # ==========================================
    # 1. IDLE_BREATHING (48 Frames / 1.6s Harmonic)
    # ==========================================
    act_idle = create_action(arm, 'Idle_Breathing', 48)
    for frame in range(1, 49):
        t = (frame - 1) / 48.0 # 0.0 to 1.0
        phase = t * 2 * math.pi
        
        # Reset transforms
        for b in pb:
            b.location = (0, 0, 0)
            b.rotation_euler = (0, 0, 0)
            b.rotation_quaternion = (1, 0, 0, 0)

        # Subtle Dantian rise and fall (sinusoidal)
        dantian_bob = math.sin(phase) * 0.008
        pb['pelvis'].location = (0, dantian_bob, 0) # Bone Y is world Z
        
        # Chest breathing expansion & slight back arch
        chest_pitch = math.sin(phase) * math.radians(2.5)
        pb['chest'].rotation_euler = (chest_pitch, 0, 0)
        
        # Head counter-balance
        head_pitch = -math.sin(phase) * math.radians(1.5)
        pb['head'].rotation_euler = (head_pitch, 0, 0)

        # Arms relaxed at sides with gentle sway
        for side, sign in [('L', 1.0), ('R', -1.0)]:
            sh_rot = math.sin(phase) * math.radians(1.0)
            pb[f'shoulder.{side}'].rotation_euler = (0, 0, -sign * sh_rot)
            # Arm resting downward from T-pose: ~65 deg drop
            arm_drop = math.radians(-65.0) + math.sin(phase) * math.radians(1.5)
            pb[f'upper_arm.{side}'].rotation_euler = (0, 0, sign * arm_drop)
            # Elbow slight 20 deg bend
            pb[f'forearm.{side}'].rotation_euler = (0, math.radians(20.0), 0)

        # Insert keyframes
        for bname in ['pelvis', 'chest', 'head', 'shoulder.L', 'shoulder.R', 'upper_arm.L', 'upper_arm.R', 'forearm.L', 'forearm.R']:
            pb[bname].keyframe_insert(data_path='location', frame=frame)
            pb[bname].keyframe_insert(data_path='rotation_euler', frame=frame)

    push_to_nla(arm, act_idle)

    # ==========================================
    # 2. WALK_CYCLE (24 Frames / 0.8s Fundamental)
    # ==========================================
    act_walk = create_action(arm, 'Walk_Cycle', 24)
    for frame in range(1, 25):
        t = (frame - 1) / 24.0
        phase = t * 2 * math.pi
        
        for b in pb:
            b.location = (0, 0, 0)
            b.rotation_euler = (0, 0, 0)

        # Pelvis double-frequency vertical bob (hits low at passing frame, high at stride apex)
        pelvis_bob = -abs(math.sin(phase)) * 0.025
        # Pelvis slight yaw & roll with stride weight transfer
        pelvis_yaw = math.sin(phase) * math.radians(6.0)
        pelvis_roll = math.cos(phase) * math.radians(3.0)
        pb['pelvis'].location = (0, pelvis_bob, 0)
        pb['pelvis'].rotation_euler = (math.radians(5.0), pelvis_yaw, pelvis_roll)

        # Torso counter-rotates against hips
        pb['chest'].rotation_euler = (0, -pelvis_yaw * 0.75, -pelvis_roll * 0.5)

        # Legs: Opposite phase sinusoidal strides
        # Left Leg (phase)
        thigh_pitch_l = math.sin(phase) * math.radians(28.0)
        shin_bend_l = max(0.0, -math.sin(phase)) * math.radians(45.0)
        foot_pitch_l = -math.sin(phase) * math.radians(15.0)

        # Right Leg (phase + pi)
        thigh_pitch_r = math.sin(phase + math.pi) * math.radians(28.0)
        shin_bend_r = max(0.0, -math.sin(phase + math.pi)) * math.radians(45.0)
        foot_pitch_r = -math.sin(phase + math.pi) * math.radians(15.0)

        pb['thigh.L'].rotation_euler = (thigh_pitch_l, 0, 0)
        pb['shin.L'].rotation_euler = (-shin_bend_l, 0, 0)
        pb['foot.L'].rotation_euler = (foot_pitch_l, 0, 0)

        pb['thigh.R'].rotation_euler = (thigh_pitch_r, 0, 0)
        pb['shin.R'].rotation_euler = (-shin_bend_r, 0, 0)
        pb['foot.R'].rotation_euler = (foot_pitch_r, 0, 0)

        # Arms: Counter-swinging opposite to legs (Left arm swings forward when Right leg steps forward)
        for side, leg_phase in [('L', phase + math.pi), ('R', phase)]:
            sign = 1.0 if side == 'L' else -1.0
            arm_swing = math.sin(leg_phase) * math.radians(25.0)
            arm_drop = math.radians(-65.0)
            pb[f'upper_arm.{side}'].rotation_euler = (arm_swing, 0, sign * arm_drop)
            # Forearm flexes on forward swing
            elbow_bend = math.radians(20.0) + max(0.0, math.sin(leg_phase)) * math.radians(25.0)
            pb[f'forearm.{side}'].rotation_euler = (0, elbow_bend, 0)

        # Keyframe all bones
        for b in pb:
            b.keyframe_insert(data_path='location', frame=frame)
            b.keyframe_insert(data_path='rotation_euler', frame=frame)

    push_to_nla(arm, act_walk)

    # ==========================================
    # 3. RUN_CYCLE (16 Frames / 0.53s Octave)
    # ==========================================
    act_run = create_action(arm, 'Run_Cycle', 16)
    for frame in range(1, 17):
        t = (frame - 1) / 16.0
        phase = t * 2 * math.pi
        
        for b in pb:
            b.location = (0, 0, 0)
            b.rotation_euler = (0, 0, 0)

        # Strong forward torso lean
        run_bob = math.sin(phase * 2) * 0.04 - 0.03
        pb['pelvis'].location = (0, run_bob, 0)
        pb['pelvis'].rotation_euler = (math.radians(18.0), math.sin(phase) * math.radians(10.0), 0)
        pb['chest'].rotation_euler = (math.radians(10.0), -math.sin(phase) * math.radians(8.0), 0)

        # Dynamic high-knee leg drive
        thigh_l = math.sin(phase) * math.radians(48.0)
        shin_l = max(0.0, -math.sin(phase)) * math.radians(75.0)
        thigh_r = math.sin(phase + math.pi) * math.radians(48.0)
        shin_r = max(0.0, -math.sin(phase + math.pi)) * math.radians(75.0)

        pb['thigh.L'].rotation_euler = (thigh_l, 0, 0)
        pb['shin.L'].rotation_euler = (-shin_l, 0, 0)
        pb['thigh.R'].rotation_euler = (thigh_r, 0, 0)
        pb['shin.R'].rotation_euler = (-shin_r, 0, 0)

        # Compact 90-deg bent pumping arms
        for side, leg_phase in [('L', phase + math.pi), ('R', phase)]:
            sign = 1.0 if side == 'L' else -1.0
            arm_pump = math.sin(leg_phase) * math.radians(45.0)
            pb[f'upper_arm.{side}'].rotation_euler = (arm_pump, 0, sign * math.radians(-45.0))
            pb[f'forearm.{side}'].rotation_euler = (0, math.radians(85.0), 0)

        for b in pb:
            b.keyframe_insert(data_path='location', frame=frame)
            b.keyframe_insert(data_path='rotation_euler', frame=frame)

    push_to_nla(arm, act_run)

    # ==========================================
    # 4. ATTACK_SLASH_1H (24 Frames / 4-Phase Strike)
    # ==========================================
    # Phase 1: Anticipation / Windup (F1-F8)
    # Phase 2: Snap Cleave (F9-F12)
    # Phase 3: Impact / Overshoot (F13-F16)
    # Phase 4: Recovery back to ready stance (F17-F24)
    act_slash = create_action(arm, 'Attack_Slash_1H', 24)
    for frame in range(1, 25):
        for b in pb:
            b.location = (0, 0, 0)
            b.rotation_euler = (0, 0, 0)

        if frame <= 8:
            # Windup
            p = frame / 8.0
            pb['pelvis'].rotation_euler = (0, math.radians(20.0 * p), 0)
            pb['chest'].rotation_euler = (math.radians(-5.0 * p), math.radians(25.0 * p), 0)
            # Right arm drawn high and back
            pb['upper_arm.R'].rotation_euler = (math.radians(-45.0 * p), math.radians(-30.0 * p), math.radians(30.0 * p))
            pb['forearm.R'].rotation_euler = (0, math.radians(90.0 * p), 0)
            # Left arm forward for balance
            pb['upper_arm.L'].rotation_euler = (math.radians(30.0 * p), 0, math.radians(-45.0))
            pb['forearm.L'].rotation_euler = (0, math.radians(45.0), 0)
        elif frame <= 12:
            # Snap Cleave (diagonal slash through center)
            p = (frame - 8) / 4.0
            pb['pelvis'].rotation_euler = (0, math.radians(20.0 - 45.0 * p), 0)
            pb['chest'].rotation_euler = (math.radians(12.0 * p), math.radians(25.0 - 55.0 * p), 0)
            # Right arm cleaves across body
            pb['upper_arm.R'].rotation_euler = (math.radians(-45.0 + 95.0 * p), math.radians(-30.0 + 40.0 * p), math.radians(30.0 - 75.0 * p))
            pb['forearm.R'].rotation_euler = (0, math.radians(90.0 - 60.0 * p), 0)
        elif frame <= 16:
            # Overshoot / Follow-through hold
            p = (frame - 12) / 4.0
            pb['pelvis'].rotation_euler = (0, math.radians(-25.0 + 5.0 * p), 0)
            pb['chest'].rotation_euler = (math.radians(12.0 - 4.0 * p), math.radians(-30.0 + 10.0 * p), 0)
            pb['upper_arm.R'].rotation_euler = (math.radians(50.0 - 15.0 * p), math.radians(10.0), math.radians(-45.0 + 10.0 * p))
            pb['forearm.R'].rotation_euler = (0, math.radians(30.0 + 10.0 * p), 0)
        else:
            # Recovery
            p = (frame - 16) / 8.0
            pb['pelvis'].rotation_euler = (0, math.radians(-20.0 * (1 - p)), 0)
            pb['chest'].rotation_euler = (math.radians(8.0 * (1 - p)), math.radians(-20.0 * (1 - p)), 0)
            pb['upper_arm.R'].rotation_euler = (math.radians(35.0 * (1 - p)), 0, math.radians(-35.0 - 30.0 * p))
            pb['forearm.R'].rotation_euler = (0, math.radians(40.0 - 20.0 * p), 0)
            pb['upper_arm.L'].rotation_euler = (0, 0, math.radians(-65.0))
            pb['forearm.L'].rotation_euler = (0, math.radians(20.0), 0)

        # Stance legs (braced combat base)
        pb['thigh.L'].rotation_euler = (math.radians(15.0), 0, math.radians(5.0))
        pb['shin.L'].rotation_euler = (math.radians(-20.0), 0, 0)
        pb['thigh.R'].rotation_euler = (math.radians(-15.0), 0, math.radians(-5.0))
        pb['shin.R'].rotation_euler = (math.radians(-10.0), 0, 0)

        for b in pb:
            b.keyframe_insert(data_path='location', frame=frame)
            b.keyframe_insert(data_path='rotation_euler', frame=frame)

    push_to_nla(arm, act_slash)

    # Set default active action to Idle_Breathing
    arm.animation_data.action = act_idle

    # Save blend file
    bpy.ops.wm.save_mainfile(filepath=filepath)
    print("Successfully baked 4 Harmonically Quantized Actions into NLA tracks!")

if __name__ == '__main__':
    bake_harmonic_actions('mannequin_chibi_basic_rigTest1.blend')
