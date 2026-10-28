"""
film_all_flesh_base_actions.py
Batch headless Blender filmer for all 45 actions in flesh_base_mannequin.blend.
Renders 8 compass headings x 8 frames into true 2048x2048 RGBA master sheets.
"""

import sys
sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")

import bpy
import os
import math
import argparse
import tempfile
import time
from PIL import Image

ACTION_MAPPING = {
    "A_TPose": "tpose",
    "Crouch_Fwd_Loop": "crouch_walk",
    "Crouch_Idle_Loop": "crouch_idle",
    "Dance_Loop": "dance",
    "Death01": "death",
    "Driving_Loop": "drive",
    "Fixing_Kneeling": "repair",
    "Hit_Chest": "damage",
    "Hit_Head": "hit_head",
    "Idle_Loop": "idle",
    "Idle_Talking_Loop": "talk",
    "Idle_Torch_Loop": "idle_torch",
    "Interact": "interact",
    "Jog_Fwd_Loop": "run",
    "Jump_Land": "jump_land",
    "Jump_Loop": "jump",
    "Jump_Start": "jump_start",
    "Melee_Weapon_Attack": "slash",
    "Melee_Weapon_Attack_RM": "melee_attack_rm",
    "Melee_Weapon_Idle": "combat_idle",
    "PickUp_Table": "pickup",
    "Pistol_Aim_Down": "aim_down",
    "Pistol_Aim_Neutral": "aim_neutral",
    "Pistol_Aim_Up": "aim_up",
    "Pistol_Idle_Loop": "gun_idle",
    "Pistol_Reload": "reload",
    "Pistol_Shoot": "shoot",
    "Punch_Cross": "punch_cross",
    "Punch_Jab": "punch_jab",
    "Push_Loop": "push",
    "Roll": "roll",
    "Roll_RM": "roll_rm",
    "Sitting_Enter": "sit_down",
    "Sitting_Exit": "stand_up",
    "Sitting_Idle_Loop": "sitting_idle",
    "Sitting_Talking_Loop": "sitting_talk",
    "Spell_Simple_Enter": "spell_charge",
    "Spell_Simple_Exit": "spell_release",
    "Spell_Simple_Idle_Loop": "spell_idle",
    "Spell_Simple_Shoot": "spellcast",
    "Sprint_Loop": "sprint",
    "Swim_Fwd_Loop": "swim_fwd",
    "Swim_Idle_Loop": "swim_idle",
    "Walk_Formal_Loop": "walk_formal",
    "Walk_Loop": "walk"
}

def film_all(blend_path, out_dir, selected_actions=None, force=False, resolution=256, num_frames=8):
    if not os.path.exists(blend_path):
        print(f"[ERROR] Blend file not found: {blend_path}", file=sys.stderr)
        return False

    out_dir = os.path.abspath(out_dir)
    os.makedirs(out_dir, exist_ok=True)

    current_filepath = bpy.data.filepath
    if not current_filepath or os.path.abspath(current_filepath) != os.path.abspath(blend_path):
        bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))

    arm = bpy.data.objects.get('Armature')
    if not arm:
        print("[ERROR] No Armature object found in blend file!", file=sys.stderr)
        return False

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    
    if hasattr(scene.eevee, 'taa_render_samples'):
        scene.eevee.taa_render_samples = 4

    for o in bpy.data.objects:
        if o.type == 'LIGHT':
            o.hide_render = False

    cam_rot = bpy.data.objects.get('Cam_Rot_Empty')
    if not cam_rot:
        cam_rot_data = bpy.data.objects.new('Cam_Rot_Empty', None)
        bpy.context.collection.objects.link(cam_rot_data)
        cam_rot = cam_rot_data

    cam_tgt = bpy.data.objects.get('CamTarget')
    if not cam_tgt:
        cam_tgt_data = bpy.data.objects.new('CamTarget', None)
        bpy.context.collection.objects.link(cam_tgt_data)
        cam_tgt = cam_tgt_data

    cam_rot.location = (0.0, -1.20, 0.60)
    cam_tgt.location = (0.0, -1.20, 0.60)

    cam = bpy.data.objects.get('RenderCam')
    if not cam:
        cam_data = bpy.data.cameras.new('RenderCam')
        cam = bpy.data.objects.new('RenderCam', cam_data)
        bpy.context.collection.objects.link(cam)

    scene.camera = cam
    cam.parent = cam_rot
    cam.location = (0.0, -2.40, 0.25)
    cam.data.type = 'PERSP'
    cam.data.lens = 45.0

    track = next((c for c in cam.constraints if c.type == 'TRACK_TO'), None)
    if not track:
        track = cam.constraints.new('TRACK_TO')
    track.target = cam_tgt
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'

    angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]
    atlas_w = resolution * num_frames
    atlas_h = resolution * len(angles_deg)

    all_actions = bpy.data.actions
    actions_to_film = []
    for act in all_actions:
        key = ACTION_MAPPING.get(act.name, act.name.lower())
        if selected_actions and act.name not in selected_actions and key not in selected_actions:
            continue
        out_filename = f"flesh_base_mannequin_{key}_loop.png"
        out_path = os.path.join(out_dir, out_filename)
        if not force and os.path.exists(out_path):
            print(f"[SKIP] {act.name} -> {out_filename} already exists.")
            continue
        actions_to_film.append((act, key, out_path))

    print(f"=== Filming {len(actions_to_film)} actions from {blend_path} ===")
    total_start = time.time()

    for idx, (act, key, out_path) in enumerate(actions_to_film):
        t0 = time.time()
        arm.animation_data.action = act
        if hasattr(act, 'slots') and len(act.slots) > 0:
            arm.animation_data.action_slot = act.slots[0]

        f_start = int(act.frame_range[0])
        f_end = int(act.frame_range[1])
        step = (f_end - f_start) / float(num_frames)
        frame_indices = [int(round(f_start + i * step)) for i in range(num_frames)]

        master_atlas = Image.new('RGBA', (atlas_w, atlas_h), (0, 0, 0, 0))
        temp_dir = tempfile.mkdtemp(prefix="myos_batch_")

        for row_idx, deg in enumerate(angles_deg):
            cam_rot.rotation_euler[2] = math.radians(deg)
            bpy.context.view_layer.update()

            for col_idx, f_num in enumerate(frame_indices):
                scene.frame_set(f_num)
                bpy.context.view_layer.update()

                tmp_path = os.path.join(temp_dir, f"r{row_idx}_c{col_idx}.png")
                scene.render.filepath = tmp_path
                bpy.ops.render.render(write_still=True)

                if os.path.exists(tmp_path):
                    with Image.open(tmp_path) as im:
                        tile = im.convert('RGBA')
                        master_atlas.paste(tile, (col_idx * resolution, row_idx * resolution), tile)
                    os.remove(tmp_path)

        try:
            os.rmdir(temp_dir)
        except Exception:
            pass

        master_atlas.save(out_path)
        t1 = time.time()
        print(f"[{idx + 1}/{len(actions_to_film)}] Filmed {act.name} -> {os.path.basename(out_path)} ({t1 - t0:.1f}s)")

    print(f"=== Completed all in {time.time() - total_start:.1f}s ===")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--blend", default=r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_base_mannequin.blend")
    parser.add_argument("--out_dir", default=r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions")
    parser.add_argument("--actions", nargs="*", default=None, help="Specific action names to film")
    parser.add_argument("--force", action="store_true", help="Force overwrite existing")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
    film_all(args.blend, args.out_dir, args.actions, args.force)
