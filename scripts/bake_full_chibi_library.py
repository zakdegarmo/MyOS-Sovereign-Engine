import bpy

def batch_bake(blend_path):
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    # 1. Set Native MoCap 30 FPS
    bpy.context.scene.render.fps = 30
    bpy.context.scene.render.fps_base = 1.0

    target_arm = bpy.data.objects['Armature']

    # Clear old baked actions on target before importing
    action_pairs = [
        ('A_TPose', 'A_TPose'),
        ('Crouch_Fwd_Loop', 'Crouch_Fwd_Loop'),
        ('Crouch_Idle_Loop', 'Crouch_Idle_Loop'),
        ('Dance_Loop', 'Dance_Loop'),
        ('Death01', 'Death01'),
        ('Driving_Loop', 'Driving_Loop'),
        ('Fixing_Kneeling', 'Fixing_Kneeling'),
        ('Hit_Chest', 'Hit_Chest'),
        ('Hit_Head', 'Hit_Head'),
        ('Idle_Loop', 'Idle_Loop'),
        ('Idle_Talking_Loop', 'Idle_Talking_Loop'),
        ('Idle_Torch_Loop', 'Idle_Torch_Loop'),
        ('Interact', 'Interact'),
        ('Jog_Fwd_Loop', 'Jog_Fwd_Loop'),
        ('Jump_Land', 'Jump_Land'),
        ('Jump_Loop', 'Jump_Loop'),
        ('Jump_Start', 'Jump_Start'),
        ('PickUp_Table', 'PickUp_Table'),
        ('Pistol_Aim_Down', 'Pistol_Aim_Down'),
        ('Pistol_Aim_Neutral', 'Pistol_Aim_Neutral'),
        ('Pistol_Aim_Up', 'Pistol_Aim_Up'),
        ('Pistol_Idle_Loop', 'Pistol_Idle_Loop'),
        ('Pistol_Reload', 'Pistol_Reload'),
        ('Pistol_Shoot', 'Pistol_Shoot'),
        ('Punch_Cross', 'Punch_Cross'),
        ('Punch_Jab', 'Punch_Jab'),
        ('Push_Loop', 'Push_Loop'),
        ('Roll', 'Roll'),
        ('Roll_RM', 'Roll_RM'),
        ('Sitting_Enter', 'Sitting_Enter'),
        ('Sitting_Exit', 'Sitting_Exit'),
        ('Sitting_Idle_Loop', 'Sitting_Idle_Loop'),
        ('Sitting_Talking_Loop', 'Sitting_Talking_Loop'),
        ('Spell_Simple_Enter', 'Spell_Simple_Enter'),
        ('Spell_Simple_Exit', 'Spell_Simple_Exit'),
        ('Spell_Simple_Idle_Loop', 'Spell_Simple_Idle_Loop'),
        ('Spell_Simple_Shoot', 'Spell_Simple_Shoot'),
        ('Sprint_Loop', 'Sprint_Loop'),
        ('Swim_Fwd_Loop', 'Swim_Fwd_Loop'),
        ('Swim_Idle_Loop', 'Swim_Idle_Loop'),
        ('Sword_Attack', 'Melee_Weapon_Attack'),
        ('Sword_Attack_RM', 'Melee_Weapon_Attack_RM'),
        ('Sword_Idle', 'Melee_Weapon_Idle'),
        ('Walk_Formal_Loop', 'Walk_Formal_Loop'),
        ('Walk_Loop', 'Walk_Loop'),
    ]
    old_target_actions = [tgt for _, tgt in action_pairs]
    for act in list(bpy.data.actions):
        if act.name in old_target_actions or act.name.startswith('Sword_'):
            bpy.data.actions.remove(act)

    # Import UAL1 at 30 FPS
    bpy.ops.import_scene.gltf(filepath=r'apps/web/dist/models/Universal Animation Library[Standard]/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb')
    source_arm = [o for o in bpy.data.objects if o.type == 'ARMATURE' and o != target_arm][0]
    
    # Remove any extra meshes from UAL1
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and o.name != 'Mannequin':
            bpy.data.objects.remove(o, do_unlink=True)

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

    # Align source arm scale to chibi height
    source_arm.location = (target_arm.location.x, target_arm.location.y, target_arm.location.z)
    source_arm.scale = (1.282 / 1.68, 1.282 / 1.68, 1.282 / 1.68)

    for src_name, tgt_name in action_pairs:
        src_act = bpy.data.actions.get(src_name)
        if not src_act:
            print(f"Action {src_name} not found, skipping.")
            continue
        
        source_arm.animation_data.action = src_act
        start_f = int(round(src_act.frame_range[0]))
        end_f = int(round(src_act.frame_range[1]))

        # Add constraints to target
        bpy.context.view_layer.objects.active = target_arm
        bpy.ops.object.mode_set(mode='POSE')

        for tgt_bone, src_bone in mapping.items():
            pb = target_arm.pose.bones.get(tgt_bone)
            if not pb: continue
            
            cr = pb.constraints.new('COPY_ROTATION')
            cr.name = 'RETARGET_ROT'
            cr.target = source_arm
            cr.subtarget = src_bone
            cr.target_space = 'WORLD'
            cr.owner_space = 'WORLD'
            
            if tgt_bone == 'Hips':
                cl = pb.constraints.new('COPY_LOCATION')
                cl.name = 'RETARGET_LOC'
                cl.target = source_arm
                cl.subtarget = src_bone
                cl.target_space = 'WORLD'
                cl.owner_space = 'WORLD'

        # Bake action
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
        baked_act.name = tgt_name
        baked_act.use_fake_user = True
        print(f"  [+] Baked {tgt_name} ({start_f}..{end_f})")

    # Clean up source armature
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.data.objects.remove(source_arm, do_unlink=True)

    # Set default action to Walk_Loop
    if 'Walk_Loop' in bpy.data.actions:
        target_arm.animation_data.action = bpy.data.actions['Walk_Loop']
        bpy.context.scene.frame_start = 0
        bpy.context.scene.frame_end = int(round(bpy.data.actions['Walk_Loop'].frame_range[1]))
        bpy.context.scene.frame_set(0)

    # Embed auto-sync timeline UI script in the blend file
    ui_script = '''import bpy
from bpy.app.handlers import persistent

@persistent
def sync_timeline_to_action(scene):
    arm = bpy.data.objects.get("Armature")
    if arm and arm.animation_data and arm.animation_data.action:
        act = arm.animation_data.action
        s = int(round(act.frame_range[0]))
        e = int(round(act.frame_range[1]))
        if scene.frame_start != s or scene.frame_end != e:
            scene.frame_start = s
            scene.frame_end = e

class CHIBI_OT_PlayAction(bpy.types.Operator):
    bl_idname = "chibi.play_action"
    bl_label = "Play Action"
    action_name: bpy.props.StringProperty()

    def execute(self, context):
        arm = bpy.data.objects.get("Armature")
        act = bpy.data.actions.get(self.action_name)
        if arm and act:
            if not arm.animation_data:
                arm.animation_data_create()
            arm.animation_data.action = act
            s = int(round(act.frame_range[0]))
            e = int(round(act.frame_range[1]))
            context.scene.frame_start = s
            context.scene.frame_end = e
            context.scene.frame_set(s)
            if not context.screen.is_animation_playing:
                bpy.ops.screen.animation_play()
        return {'FINISHED'}

class CHIBI_PT_ActionPanel(bpy.types.Panel):
    bl_label = "Chibi Actions"
    bl_idname = "CHIBI_PT_ActionPanel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "Chibi Studio"

    def draw(self, context):
        layout = self.layout
        arm = bpy.data.objects.get("Armature")
        cur_act = arm.animation_data.action.name if (arm and arm.animation_data and arm.animation_data.action) else "None"
        layout.label(text=f"Active: {cur_act}", icon='ACTION')
        
        categories = {
            "Locomotion": [
                ("Walk_Loop", "Walk"),
                ("Jog_Fwd_Loop", "Jog"),
                ("Sprint_Loop", "Sprint"),
                ("Walk_Formal_Loop", "Formal Walk"),
                ("Crouch_Fwd_Loop", "Crouch Walk"),
                ("Crouch_Idle_Loop", "Crouch Idle"),
                ("Jump_Start", "Jump Start"),
                ("Jump_Loop", "Jump Aerial"),
                ("Jump_Land", "Jump Land"),
                ("Swim_Fwd_Loop", "Swim"),
                ("Swim_Idle_Loop", "Swim Idle"),
                ("Roll", "Roll"),
                ("Roll_RM", "Roll (Root Motion)")
            ],
            "Combat & Magic": [
                ("Idle_Loop", "Combat Idle"),
                ("Melee_Weapon_Attack", "Melee Attack"),
                ("Melee_Weapon_Attack_RM", "Melee Attack (RM)"),
                ("Melee_Weapon_Idle", "Melee Ready"),
                ("Spell_Simple_Shoot", "Cast Spell"),
                ("Spell_Simple_Idle_Loop", "Cast Ready"),
                ("Spell_Simple_Enter", "Cast Enter"),
                ("Spell_Simple_Exit", "Cast Exit"),
                ("Punch_Jab", "Punch Jab"),
                ("Punch_Cross", "Punch Cross"),
                ("Pistol_Aim_Neutral", "Aim Ranged"),
                ("Pistol_Aim_Up", "Aim Up"),
                ("Pistol_Aim_Down", "Aim Down"),
                ("Pistol_Shoot", "Shoot"),
                ("Pistol_Reload", "Reload"),
                ("Pistol_Idle_Loop", "Ranged Ready"),
                ("Hit_Chest", "Hit Body"),
                ("Hit_Head", "Hit Head"),
                ("Death01", "Knockdown / Defeat")
            ],
            "World & RP": [
                ("Interact", "Interact (Chest/Door)"),
                ("PickUp_Table", "Pick Up Item"),
                ("Fixing_Kneeling", "Craft / Lockpick"),
                ("Push_Loop", "Push Object"),
                ("Idle_Torch_Loop", "Torch Idle"),
                ("Idle_Talking_Loop", "NPC Talking"),
                ("Sitting_Enter", "Sit Down"),
                ("Sitting_Idle_Loop", "Sitting Idle"),
                ("Sitting_Talking_Loop", "Sitting Talk"),
                ("Sitting_Exit", "Stand Up"),
                ("Driving_Loop", "Drive / Steer"),
                ("Dance_Loop", "Dance Groove"),
                ("A_TPose", "A / T Pose")
            ]
        }
        
        for cat_name, acts in categories.items():
            box = layout.box()
            box.label(text=cat_name, icon='RIGHTARROW')
            col = box.column(align=True)
            for act_name, label in acts:
                if bpy.data.actions.get(act_name):
                    row = col.row(align=True)
                    op = row.operator("chibi.play_action", text=label, icon='PLAY' if cur_act == act_name else 'NONE')
                    op.action_name = act_name

def register():
    bpy.utils.register_class(CHIBI_OT_PlayAction)
    bpy.utils.register_class(CHIBI_PT_ActionPanel)
    if sync_timeline_to_action not in bpy.app.handlers.depsgraph_update_post:
        bpy.app.handlers.depsgraph_update_post.append(sync_timeline_to_action)

register()
'''
    text_block = bpy.data.texts.get('chibi_action_player.py')
    if not text_block:
        text_block = bpy.data.texts.new('chibi_action_player.py')
    text_block.clear()
    text_block.write(ui_script)
    text_block.use_module = True

    bpy.ops.wm.save_mainfile(filepath=blend_path)
    print(f"Successfully baked all core animations at 30 FPS into {blend_path}!")

if __name__ == '__main__':
    batch_bake(r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic_rigTest1.blend')
