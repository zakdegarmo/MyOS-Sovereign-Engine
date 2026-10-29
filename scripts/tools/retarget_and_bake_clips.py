"""
retarget_and_bake_clips.py
Headless Blender script to retarget Mixamo FBX motion clips to ChibiArmature
and export modular .glb and/or .blend animation clips to assets/motion_library/baked/
"""

import sys
# Enable user site-packages for PIL/numpy in Blender if needed
sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")

import bpy
import os
import argparse

BONE_MAP = {
    "mixamorig:Hips": "Hips",
    "mixamorig:Spine": "Spine",
    "mixamorig:Spine1": "Spine01",
    "mixamorig:Neck": "neck",
    "mixamorig:Head": "Head",
    "mixamorig:LeftShoulder": "LeftShoulder",
    "mixamorig:LeftArm": "LeftArm",
    "mixamorig:LeftForeArm": "LeftForeArm",
    "mixamorig:LeftHand": "LeftHand",
    "mixamorig:RightShoulder": "RightShoulder",
    "mixamorig:RightArm": "RightArm",
    "mixamorig:RightForeArm": "RightForeArm",
    "mixamorig:RightHand": "RightHand",
    "mixamorig:LeftUpLeg": "LeftUpLeg",
    "mixamorig:LeftLeg": "LeftLeg",
    "mixamorig:LeftFoot": "LeftFoot",
    "mixamorig:LeftToeBase": "LeftToeBase",
    "mixamorig:RightUpLeg": "RightUpLeg",
    "mixamorig:RightLeg": "RightLeg",
    "mixamorig:RightFoot": "RightFoot",
    "mixamorig:RightToeBase": "RightToeBase"
}

def retarget_and_export_clip(fbx_path, out_path, clip_name=None):
    if not os.path.exists(fbx_path):
        print(f"[ERROR] FBX not found: {fbx_path}", file=sys.stderr)
        return False
        
    target_arm = bpy.data.objects.get("Armature")
    if not target_arm:
        print("[ERROR] Armature not found in current blend file.", file=sys.stderr)
        return False

    # Import the FBX motion
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    
    source_arm = None
    for obj in bpy.context.selected_objects:
        if obj.type == 'ARMATURE' and obj != target_arm:
            source_arm = obj
            break
            
    if not source_arm:
        for obj in bpy.data.objects:
            if obj.type == 'ARMATURE' and obj != target_arm and 'mixamorig:Hips' in obj.data.bones:
                source_arm = obj
                break
                
    if not source_arm:
        print("[ERROR] Failed to find imported source armature.", file=sys.stderr)
        return False

    # Add constraints
    for src_bone, tgt_bone in BONE_MAP.items():
        if src_bone in source_arm.pose.bones and tgt_bone in target_arm.pose.bones:
            pbone = target_arm.pose.bones[tgt_bone]
            c_rot = pbone.constraints.new('COPY_ROTATION')
            c_rot.target = source_arm
            c_rot.subtarget = src_bone
            c_rot.target_space = 'WORLD'
            c_rot.owner_space = 'WORLD'
            if tgt_bone == "Hips":
                c_loc = pbone.constraints.new('COPY_LOCATION')
                c_loc.target = source_arm
                c_loc.subtarget = src_bone
                c_loc.target_space = 'WORLD'
                c_loc.owner_space = 'WORLD'

    src_action = source_arm.animation_data.action if source_arm.animation_data else None
    start_frame = int(src_action.frame_range[0]) if src_action else 1
    end_frame = int(src_action.frame_range[1]) if src_action else 60

    # Bake
    bpy.ops.object.select_all(action='DESELECT')
    target_arm.select_set(True)
    bpy.context.view_layer.objects.active = target_arm

    bpy.ops.nla.bake(
        frame_start=start_frame,
        frame_end=end_frame,
        step=1,
        only_selected=False,
        visual_keying=True,
        clear_constraints=True,
        bake_types={'POSE'}
    )

    baked_action = target_arm.animation_data.action
    action_id = clip_name or os.path.splitext(os.path.basename(fbx_path))[0]
    baked_action.name = action_id
    baked_action.use_fake_user = True

    # Bind Blender 5.2 action slot
    if hasattr(baked_action, 'slots') and len(baked_action.slots) > 0:
        target_arm.animation_data.action_slot = baked_action.slots[0]

    # Delete source armature
    bpy.data.objects.remove(source_arm, do_unlink=True)

    # Clean up all other actions so only the single baked modular clip is exported
    for act in list(bpy.data.actions):
        if act != baked_action:
            bpy.data.actions.remove(act)

    out_path = os.path.abspath(out_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    
    # If the user requested a .blend file (for Sprite-inator / 2D filming)
    if out_path.endswith(".blend"):
        bpy.ops.wm.save_as_mainfile(filepath=out_path)
        print(f"[OK] Saved modular .blend file {action_id} to {out_path}")
        
        # Also auto-export .glb sibling if desired
        glb_sibling = os.path.splitext(out_path)[0] + ".glb"
        bpy.ops.object.select_all(action='DESELECT')
        target_arm.select_set(True)
        bpy.context.view_layer.objects.active = target_arm
        bpy.ops.export_scene.gltf(
            filepath=glb_sibling,
            export_format='GLB',
            use_selection=True,
            export_animations=True,
            export_def_bones=False,
            export_anim_single_armature=True
        )
        print(f"[OK] Also exported modular .glb sibling to {glb_sibling}")
    else:
        # Export modular GLB clip
        bpy.ops.object.select_all(action='DESELECT')
        target_arm.select_set(True)
        bpy.context.view_layer.objects.active = target_arm
        bpy.ops.export_scene.gltf(
            filepath=out_path,
            export_format='GLB',
            use_selection=True,
            export_animations=True,
            export_def_bones=False,
            export_anim_single_armature=True
        )
        print(f"[OK] Exported modular clip {action_id} to {out_path}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Retarget and bake motion clip to modular .blend / .glb")
    parser.add_argument("--base", default="flesh_base_mannequin.blend", help="Optional path to base mannequin blend file")
    parser.add_argument("--fbx", required=True, help="Path to raw FBX motion file")
    parser.add_argument("--out", required=True, help="Output .blend or .glb filepath")
    parser.add_argument("--name", default=None, help="Optional clip name")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
    
    retarget_and_export_clip(args.fbx, args.out, args.name)
