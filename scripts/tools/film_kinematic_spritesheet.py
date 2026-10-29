"""
film_kinematic_spritesheet.py
Headless Blender filmer for MyOS Kinematic Embodiment Engine.
Takes any modular .blend motion studio file (or flesh_base_mannequin.blend with an action),
films all 8 compass directions (0° South to 315° Southeast) across keyframed animation cycles,
and stitches them into a true 8x8 2048x2048 (or 1024x1024) PNG spritesheet with transparent alpha.
"""

import sys
# Ensure user site-packages are visible to Blender's embedded Python (for PIL)
sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")

import bpy
import os
import math
import argparse
import tempfile
from PIL import Image

def film_blend_action(blend_path, out_png_path, action_name=None, resolution=256, num_frames=8):
    if not os.path.exists(blend_path):
        print(f"[ERROR] Blend file not found: {blend_path}", file=sys.stderr)
        return False

    out_png_path = os.path.abspath(out_png_path)
    os.makedirs(os.path.dirname(out_png_path), exist_ok=True)

    # In Blender headless, open the blend file if not already active
    current_filepath = bpy.data.filepath
    if not current_filepath or os.path.abspath(current_filepath) != os.path.abspath(blend_path):
        bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))

    arm = bpy.data.objects.get('Armature')
    if not arm:
        print("[ERROR] No 'Armature' object found in blend file!", file=sys.stderr)
        return False

    # Find the target action
    act = None
    if action_name:
        act = bpy.data.actions.get(action_name)
    if not act:
        if arm.animation_data and arm.animation_data.action:
            act = arm.animation_data.action
        elif bpy.data.actions:
            act = bpy.data.actions[0]

    if not act:
        print(f"[ERROR] No animation action found to film in {blend_path}!", file=sys.stderr)
        return False

    arm.animation_data.action = act
    # Blender 5.2 slot binding
    if hasattr(act, 'slots') and len(act.slots) > 0:
        arm.animation_data.action_slot = act.slots[0]

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution

    # Ensure lights are active
    for o in bpy.data.objects:
        if o.type == 'LIGHT':
            o.hide_render = False

    # Calibrate Camera & Orbital Rig
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

    # Calibrate height and center for Flesh Mannequin (center of mass at Y=-1.20, Z=0.60)
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

    # Ensure TrackTo constraint exists on camera
    track = next((c for c in cam.constraints if c.type == 'TRACK_TO'), None)
    if not track:
        track = cam.constraints.new('TRACK_TO')
    track.target = cam_tgt
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'

    # 8-way compass angles matching MyOS Direction Row Map:
    # Row 0: S (0°)
    # Row 1: SW (45°)
    # Row 2: W (90°)
    # Row 3: NW (135°)
    # Row 4: N (180°)
    # Row 5: NE (225°)
    # Row 6: E (270°)
    # Row 7: SE (315°)
    angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]

    f_start = int(act.frame_range[0])
    f_end = int(act.frame_range[1])
    step = (f_end - f_start) / float(num_frames)
    frame_indices = [int(round(f_start + i * step)) for i in range(num_frames)]

    atlas_w = resolution * num_frames
    atlas_h = resolution * len(angles_deg)
    master_atlas = Image.new('RGBA', (atlas_w, atlas_h), (0, 0, 0, 0))

    temp_dir = tempfile.mkdtemp(prefix="myos_film_")
    print(f"--- Filming '{act.name}' ({len(angles_deg)} dirs x {num_frames} frames @ {resolution}x{resolution}px) ---")

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

    master_atlas.save(out_png_path)
    print(f"[OK] Master 2D Spritesheet generated: {out_png_path} ({atlas_w}x{atlas_h})")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Film 8-directional 2D sprite sheet from .blend motion file")
    parser.add_argument("--blend", required=True, help="Path to input .blend file")
    parser.add_argument("--out", required=True, help="Output PNG spritesheet path")
    parser.add_argument("--action", default=None, help="Optional action name to film")
    parser.add_argument("--res", type=int, default=256, help="Tile resolution (default: 256)")
    parser.add_argument("--frames", type=int, default=8, help="Frames per direction (default: 8)")
    
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
    film_blend_action(args.blend, args.out, args.action, args.res, args.frames)
