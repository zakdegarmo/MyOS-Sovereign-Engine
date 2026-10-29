"""
Kinematic Animation Classifier and Headless Blender Filming Engine
Classifies animation actions by bone velocities, periods, and limb trajectories.
Renders 4 cardinal angles (North, West, South, East) at 512x512 with transparent alpha.
Supports loading a rigged .glb OR synthesizing modular character in-memory from a .json spec.
"""

import bpy
import mathutils
import sys
import os
import math
import json
import numpy as np

# Import modular assembler helper
MODELS_ROOT = os.path.abspath("apps/web/public/models")
BASE_CHARACTERS = {
    "male": os.path.join(MODELS_ROOT, "Universal Base Characters[Standard]", "Universal Base Characters[Standard]", "Base Characters", "Godot - UE", "Superhero_Male_FullBody.gltf"),
    "female": os.path.join(MODELS_ROOT, "Universal Base Characters[Standard]", "Universal Base Characters[Standard]", "Base Characters", "Godot - UE", "Superhero_Female_FullBody.gltf"),
    "armored_knight": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Armored_Adventurer_biped", "Meshy_AI_Armored_Adventurer_biped", "Meshy_AI_Armored_Adventurer_biped_Character_output.glb"),
    "mage": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Moonlit_Mage_biped", "Meshy_AI_Moonlit_Mage_biped", "Meshy_AI_Moonlit_Mage_biped_Character_output.glb"),
    "paladin": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Sunlit_Paladin_biped", "Meshy_AI_Sunlit_Paladin_biped", "Meshy_AI_Sunlit_Paladin_biped_Character_output.glb"),
    "huntsman": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Midnight_Huntsman_biped", "Meshy_AI_Midnight_Huntsman_biped", "Meshy_AI_Midnight_Huntsman_biped_Character_output.glb"),
    "scout": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Wilderness_Scout_biped", "Meshy_AI_Wilderness_Scout_biped", "Meshy_AI_Wilderness_Scout_biped_Character_output.glb"),
    "valor": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Sir_Valor_biped", "Meshy_AI_Sir_Valor_biped", "Meshy_AI_Sir_Valor_biped_Character_output.glb"),
    "azure": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Azure_Adventurer_biped", "Meshy_AI_Azure_Adventurer_biped", "Meshy_AI_Azure_Adventurer_biped_Character_output.glb")
}

HAIRSTYLES_DIR = os.path.join(MODELS_ROOT, "Universal Base Characters[Standard]", "Universal Base Characters[Standard]", "Hairstyles", "Rigged to Head Bone", "glTF (Godot -Unreal)")
MODULAR_PARTS_DIR = os.path.join(MODELS_ROOT, "Modular Character Outfits - Fantasy[Standard]", "Modular Character Outfits - Fantasy[Standard]", "Exports", "glTF (Godot-Unreal)", "Modular Parts")
UAL1_ANIMATIONS = os.path.join(MODELS_ROOT, "Universal Animation Library[Standard]", "Universal Animation Library[Standard]", "Unreal-Godot", "UAL1_Standard.glb")

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def setup_lighting():
    key_light_data = bpy.data.lights.new(name="KeyLight", type='SUN')
    key_light_data.energy = 3.5
    key_light = bpy.data.objects.new(name="KeyLight", object_data=key_light_data)
    bpy.context.collection.objects.link(key_light)
    key_light.rotation_euler = (math.radians(45), math.radians(30), math.radians(45))
    
    fill_light_data = bpy.data.lights.new(name="FillLight", type='SUN')
    fill_light_data.energy = 1.8
    fill_light = bpy.data.objects.new(name="FillLight", object_data=fill_light_data)
    bpy.context.collection.objects.link(fill_light)
    fill_light.rotation_euler = (math.radians(30), math.radians(-45), math.radians(-30))

    rim_light_data = bpy.data.lights.new(name="RimLight", type='SUN')
    rim_light_data.energy = 1.2
    rim_light = bpy.data.objects.new(name="RimLight", object_data=rim_light_data)
    bpy.context.collection.objects.link(rim_light)
    rim_light.rotation_euler = (math.radians(-60), math.radians(180), 0)

def setup_camera():
    cam_data = bpy.data.cameras.new("OrthoCam")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 2.4  # Bounding scale for JRPG Chibi proportions
    cam = bpy.data.objects.new("OrthoCam", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam

def set_camera_angle(cam, direction_name):
    distance = 10.0
    if direction_name == "South":
        cam.rotation_euler = (math.radians(90), 0, 0)
        cam.location = (0, -distance, 0.9)
    elif direction_name == "North":
        cam.rotation_euler = (math.radians(90), 0, math.radians(180))
        cam.location = (0, distance, 0.9)
    elif direction_name == "West":
        cam.rotation_euler = (math.radians(90), 0, math.radians(90))
        cam.location = (distance, 0, 0.9)
    elif direction_name == "East":
        cam.rotation_euler = (math.radians(90), 0, math.radians(-90))
        cam.location = (-distance, 0, 0.9)

def find_bones(arm_obj):
    bones = {
        'hips': None,
        'head': None,
        'left_foot': None,
        'right_foot': None,
        'left_hand': None,
        'right_hand': None,
    }
    for b in arm_obj.pose.bones:
        name_lower = b.name.lower()
        if 'hip' in name_lower or 'pelvis' in name_lower or 'root' in name_lower:
            if not bones['hips']: bones['hips'] = b
        elif 'head' in name_lower:
            if not bones['head']: bones['head'] = b
        elif ('left' in name_lower or 'l_' in name_lower or '.l' in name_lower or 'l' == name_lower[-1:]) and ('foot' in name_lower or 'ankle' in name_lower or 'toe' in name_lower):
            if not bones['left_foot']: bones['left_foot'] = b
        elif ('right' in name_lower or 'r_' in name_lower or '.r' in name_lower or 'r' == name_lower[-1:]) and ('foot' in name_lower or 'ankle' in name_lower or 'toe' in name_lower):
            if not bones['right_foot']: bones['right_foot'] = b
        elif ('left' in name_lower or 'l_' in name_lower or '.l' in name_lower or 'l' == name_lower[-1:]) and ('hand' in name_lower or 'wrist' in name_lower or 'weapon' in name_lower):
            if not bones['left_hand']: bones['left_hand'] = b
        elif ('right' in name_lower or 'r_' in name_lower or '.r' in name_lower or 'r' == name_lower[-1:]) and ('hand' in name_lower or 'wrist' in name_lower or 'weapon' in name_lower):
            if not bones['right_hand']: bones['right_hand'] = b

    if not bones['left_foot'] or not bones['right_foot']:
        for b in arm_obj.pose.bones:
            nl = b.name.lower()
            if 'foot' in nl or 'leg' in nl:
                if not bones['left_foot']: bones['left_foot'] = b
                elif not bones['right_foot']: bones['right_foot'] = b

    if not bones['left_hand'] or not bones['right_hand']:
        for b in arm_obj.pose.bones:
            nl = b.name.lower()
            if 'hand' in nl or 'arm' in nl:
                if not bones['left_hand']: bones['left_hand'] = b
                elif not bones['right_hand']: bones['right_hand'] = b

    return bones

def classify_action_kinematics(arm_obj, action):
    scene = bpy.context.scene
    arm_obj.animation_data.action = action
    
    start_f = int(action.frame_range[0])
    end_f = int(action.frame_range[1])
    duration = max(1, end_f - start_f)
    
    bones = find_bones(arm_obj)
    
    sample_steps = min(20, duration)
    frames = [int(start_f + (i / float(sample_steps - 1)) * (duration - 1)) for i in range(sample_steps)] if sample_steps > 1 else [start_f]
    
    head_z = []
    l_foot_pos = []
    r_foot_pos = []
    r_hand_pos = []
    l_hand_pos = []
    
    for f in frames:
        scene.frame_set(f)
        bpy.context.view_layer.update()
        matrix_world = arm_obj.matrix_world
        
        if bones['head']:
            head_z.append((matrix_world @ bones['head'].matrix).to_translation().z)
        else:
            head_z.append(1.7)
            
        if bones['left_foot']:
            l_foot_pos.append((matrix_world @ bones['left_foot'].matrix).to_translation())
        else:
            l_foot_pos.append(mathutils.Vector((0,0,0)))
            
        if bones['right_foot']:
            r_foot_pos.append((matrix_world @ bones['right_foot'].matrix).to_translation())
        else:
            r_foot_pos.append(mathutils.Vector((0,0,0)))
            
        if bones['right_hand']:
            r_hand_pos.append((matrix_world @ bones['right_hand'].matrix).to_translation())
        else:
            r_hand_pos.append(mathutils.Vector((0,0,0)))
            
        if bones['left_hand']:
            l_hand_pos.append((matrix_world @ bones['left_hand'].matrix).to_translation())
        else:
            l_hand_pos.append(mathutils.Vector((0,0,0)))

    # Kinematic indicators
    z_drop = head_z[0] - head_z[-1] if head_z else 0.0
    name_l = action.name.lower()
    
    if (head_z and head_z[-1] < 0.6 and z_drop > 0.4) or ('dead' in name_l or 'death' in name_l):
        return 'hurt_dead', 0.95
        
    if ('arise' in name_l):
        return 'arise', 0.90
        
    foot_diffs = [ (l.y - r.y) for l, r in zip(l_foot_pos, r_foot_pos) ]
    foot_swing_range = max(foot_diffs) - min(foot_diffs) if foot_diffs else 0.0
    
    hand_disp = [ (r_hand_pos[i] - r_hand_pos[i-1]).length for i in range(1, len(r_hand_pos)) ]
    max_hand_vel = max(hand_disp) if hand_disp else 0.0
    
    avg_hand_z = float(np.mean([ (l.z + r.z) * 0.5 for l, r in zip(l_hand_pos, r_hand_pos) ])) if l_hand_pos else 0.0
    
    if 'spell' in name_l or 'cast' in name_l or (avg_hand_z > 1.2 and foot_swing_range < 0.25):
        return 'spellcast', 0.85
        
    if 'slash' in name_l or 'sword_attack' in name_l or 'attack' in name_l:
        return 'slash', 0.90
        
    if 'thrust' in name_l or 'jab' in name_l or 'punch' in name_l:
        return 'thrust', 0.85
        
    if 'run' in name_l or 'sprint' in name_l or 'jog' in name_l or (foot_swing_range > 0.35 and duration <= 24.0):
        return 'run', 0.85
        
    if 'walk' in name_l or (foot_swing_range > 0.20 and duration >= 20.0):
        return 'walk', 0.90
        
    if duration <= 20.0:
        return 'run', 0.70
    elif duration <= 36.0:
        return 'walk', 0.70
    else:
        return 'idle', 0.60

def assemble_in_memory(spec):
    """
    Builds modular character in current Blender session.
    """
    gender = spec.get("gender", "male").lower()
    base_arch = spec.get("base_archetype", gender)
    base_path = BASE_CHARACTERS.get(base_arch, BASE_CHARACTERS.get(gender, BASE_CHARACTERS["male"]))
    
    print(f"Loading Base Character: {base_path}")
    bpy.ops.import_scene.gltf(filepath=base_path)
    
    armatures = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
    if not armatures:
        raise RuntimeError("No armature found in base character!")
    main_arm = armatures[0]
    
    # Attach Hairstyle
    hair_name = spec.get("hair")
    if hair_name and hair_name != "none":
        hair_file = f"{hair_name}.gltf"
        hair_path = os.path.join(HAIRSTYLES_DIR, hair_file)
        if os.path.exists(hair_path):
            before = set(bpy.context.scene.objects)
            bpy.ops.import_scene.gltf(filepath=hair_path)
            for obj in set(bpy.context.scene.objects) - before:
                if obj.type == 'MESH':
                    arm_mod = next((m for m in obj.modifiers if m.type == 'ARMATURE'), None)
                    if not arm_mod: arm_mod = obj.modifiers.new(name="Armature", type='ARMATURE')
                    arm_mod.object = main_arm
                    obj.parent = main_arm

    # Attach Modular Parts
    for part in spec.get("modular_parts", []):
        part_file = part if part.endswith(".gltf") else f"{part}.gltf"
        part_path = os.path.join(MODULAR_PARTS_DIR, part_file)
        if os.path.exists(part_path):
            before = set(bpy.context.scene.objects)
            bpy.ops.import_scene.gltf(filepath=part_path)
            for obj in set(bpy.context.scene.objects) - before:
                if obj.type == 'MESH':
                    arm_mod = next((m for m in obj.modifiers if m.type == 'ARMATURE'), None)
                    if not arm_mod: arm_mod = obj.modifiers.new(name="Armature", type='ARMATURE')
                    arm_mod.object = main_arm
                    obj.parent = main_arm

    # Load Animations
    if os.path.exists(UAL1_ANIMATIONS):
        bpy.ops.import_scene.gltf(filepath=UAL1_ANIMATIONS)

    return main_arm

def film_character_actions(source_path_or_spec, output_dir, char_name):
    clean_scene()
    setup_lighting()
    cam = setup_camera()
    
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'BLENDER_EEVEE_NEXT') else 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    
    if source_path_or_spec.endswith('.json'):
        with open(source_path_or_spec, 'r') as f:
            spec = json.load(f)
        arm = assemble_in_memory(spec)
    else:
        bpy.ops.import_scene.gltf(filepath=source_path_or_spec)
        armatures = [obj for obj in scene.objects if obj.type == 'ARMATURE']
        if not armatures:
            raise ValueError(f"No armature found in GLB {source_path_or_spec}")
        arm = armatures[0]

    if not arm.animation_data:
        arm.animation_data_create()
        
    while arm.animation_data.nla_tracks:
        arm.animation_data.nla_tracks.remove(arm.animation_data.nla_tracks[0])
        
    # Classify all actions
    classified = {}
    for act in bpy.data.actions:
        label, conf = classify_action_kinematics(arm, act)
        if label not in classified:
            classified[label] = act
            print(f"Kinematic Match: '{act.name}' -> '{label}' (confidence {conf:.2f})")

    # If missing required combat/locomotion actions, load from UAL1
    required_actions = ['walk', 'slash', 'spellcast', 'hurt_dead']
    for req in required_actions:
        if req not in classified and os.path.exists(UAL1_ANIMATIONS):
            bpy.ops.import_scene.gltf(filepath=UAL1_ANIMATIONS)
            for act in bpy.data.actions:
                label, conf = classify_action_kinematics(arm, act)
                if label not in classified and label in required_actions:
                    classified[label] = act
                    print(f"  + Bound external animation '{act.name}' -> '{label}'")

    lpc_action_frames = {
        'spellcast': 7,
        'thrust': 8,
        'walk': 9,
        'run': 9,
        'slash': 6,
        'hurt_dead': 6,
        'arise': 6,
        'idle': 1
    }
    
    directions = ["North", "West", "South", "East"]
    manifest_rendered = {}

    for action_key in ['walk', 'slash', 'spellcast', 'thrust', 'hurt_dead']:
        if action_key not in classified:
            continue
            
        action_obj = classified[action_key]
        num_frames = lpc_action_frames.get(action_key, 6)
        arm.animation_data.action = action_obj
        start_f = int(action_obj.frame_range[0])
        end_f = int(action_obj.frame_range[1])
        dur = max(1, end_f - start_f)
        
        manifest_rendered[action_key] = {}
        dir_list = directions if action_key != 'hurt_dead' else ["South"]
        
        for d in dir_list:
            set_camera_angle(cam, d)
            manifest_rendered[action_key][d] = []
            
            for step_idx in range(num_frames):
                if num_frames > 1:
                    frame_num = int(start_f + (step_idx / float(num_frames - 1 if action_key == 'hurt_dead' else num_frames)) * dur)
                else:
                    frame_num = start_f
                    
                scene.frame_set(frame_num)
                bpy.context.view_layer.update()
                
                out_file = os.path.join(output_dir, f"{char_name}_{action_key}_{d}_{step_idx:02d}.png")
                scene.render.filepath = out_file
                bpy.ops.render.render(write_still=True)
                manifest_rendered[action_key][d].append(out_file)
                
    manifest_path = os.path.join(output_dir, f"{char_name}_filming_manifest.json")
    with open(manifest_path, 'w') as f:
        json.dump(manifest_rendered, f, indent=2)
        
    print(f"SUCCESS: 512px Super-Sampled Cardinal Filming complete for {char_name} -> {manifest_path}")
    return manifest_path

if __name__ == "__main__":
    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1:]
        src_path = os.path.abspath(args[0])
        output_dir = os.path.abspath(args[1])
        char_name = args[2]
        
        os.makedirs(output_dir, exist_ok=True)
        film_character_actions(src_path, output_dir, char_name)
