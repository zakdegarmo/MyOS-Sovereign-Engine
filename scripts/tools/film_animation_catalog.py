#!/usr/bin/env python3
"""
film_animation_catalog.py: Comprehensive Animation Showcase Film Generator for MyOS
Headlessly compiles all 43 rigged animations attached to flesh_base_comic.blend
into a continuous, titled 1.6-minute cinema reel with floating dynamic 3D title cards.
"""

import os
import sys
import math
import subprocess

# Windows UTF-8 stdout configuration
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
BLEND_PATH = os.path.abspath(os.path.join(WORKSPACE_ROOT, "flesh_base_comic.blend"))
FRAMES_DIR = os.path.abspath(os.path.join(WORKSPACE_ROOT, "temp_catalog_frames"))
OUTPUT_VIDEO = os.path.abspath(os.path.join(WORKSPACE_ROOT, "apps/web/public/screenings/mannequin_animation_catalog.mp4"))
BLENDER_EXE = os.environ.get(
    "BLENDER_EXE",
    r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
)

# Canonical 43-Action Choreography Sequence
SHOWCASE_ACTIONS = [
    # Act 1: Greetings & Idles
    ("Idle_Loop", 2, "Idle Stance Loop"),
    ("Idle_Talking_Loop", 1, "Idle Dialogue Loop"),
    ("Idle_Torch_Loop", 2, "Torch Bearer Idle"),
    
    # Act 2: Locomotion & Agility
    ("Walk_Loop", 2, "Standard Walk Loop"),
    ("Walk_Formal_Loop", 2, "Formal Dignitary Walk"),
    ("Jog_Fwd_Loop", 2, "Forward Jog Loop"),
    ("Sprint_Loop", 2, "Athletic Sprint Loop"),
    ("Jump_Start", 1, "Jump Takeoff"),
    ("Jump_Loop", 1, "Mid-Air Suspension"),
    ("Jump_Land", 1, "Impact Landing"),
    ("Roll", 2, "Acrobatic Combat Roll"),
    
    # Act 3: Melee & Unarmed Combat
    ("Punch_Jab", 2, "Quick Left Jab"),
    ("Punch_Cross", 2, "Heavy Right Cross"),
    ("Melee_Weapon_Idle", 2, "Armed Guard Stance"),
    ("Melee_Weapon_Attack", 2, "Sword Slash Arc"),
    ("Hit_Chest", 2, "Chest Impact Reaction"),
    ("Hit_Head", 2, "Head Strike Stumble"),
    ("Death01", 1, "Dramatic Fall & Collapse"),
    
    # Act 4: Ranged Weaponry & Spellcraft
    ("Pistol_Aim_Neutral", 2, "Pistol Level Aim"),
    ("Pistol_Aim_Up", 2, "Pistol High Elevation"),
    ("Pistol_Aim_Down", 2, "Pistol Low Depression"),
    ("Pistol_Shoot", 2, "Firearm Discharge & Recoil"),
    ("Pistol_Reload", 2, "Tactical Magazine Swap"),
    ("Pistol_Idle_Loop", 2, "Sidearm Ready Idle"),
    ("Spell_Simple_Enter", 1, "Spell Channel Intro"),
    ("Spell_Simple_Idle_Loop", 2, "Arcane Incantation Loop"),
    ("Spell_Simple_Shoot", 2, "Magic Missile Release"),
    ("Spell_Simple_Exit", 1, "Arcane Dispersion"),
    
    # Act 5: Life, Labor & Celebration
    ("Crouch_Idle_Loop", 1, "Stealth Crouch Stance"),
    ("Crouch_Fwd_Loop", 2, "Crouch Crawl Advance"),
    ("Sitting_Enter", 1, "Sit Down Transition"),
    ("Sitting_Idle_Loop", 1, "Seated Repose"),
    ("Sitting_Talking_Loop", 1, "Seated Dialogue"),
    ("Sitting_Exit", 1, "Rise from Seated"),
    ("Swim_Idle_Loop", 1, "Tread Water Idle"),
    ("Swim_Fwd_Loop", 2, "Freestyle Swim Stroke"),
    ("Driving_Loop", 2, "Vehicle Pilot Loop"),
    ("Fixing_Kneeling", 1, "Kneeling Mechanic Repair"),
    ("PickUp_Table", 2, "Object Table Retrieval"),
    ("Push_Loop", 1, "Heavy Load Push Loop"),
    ("Interact", 2, "Console Activation"),
    ("Dance_Loop", 3, "Triumphant Victory Dance"),
]


def run_blender_catalog_render():
    """Executes inside Blender to build NLA track, dynamic title cards, and render."""
    import bpy

    print("[Blender Catalog] 🎬 Initializing Animation Catalog Scene...")
    scene = bpy.context.scene

    arm = bpy.data.objects.get("Armature")
    if not arm:
        raise RuntimeError("Armature object not found!")

    bpy.context.view_layer.objects.active = arm
    arm.animation_data_clear()
    arm.animation_data_create()
    track = arm.animation_data.nla_tracks.new()
    track.name = "Showcase_Sequence"

    # Frame mapping dictionary: frame_num -> title text
    frame_title_map = {}
    curr_frame = 1

    total_actions = len(SHOWCASE_ACTIONS)
    for idx, (act_name, repeat_count, friendly_name) in enumerate(SHOWCASE_ACTIONS):
        act = bpy.data.actions.get(act_name)
        if not act:
            print(f"[Blender Catalog] ⚠️ Action '{act_name}' not found, skipping.")
            continue

        strip = track.strips.new(act_name, int(curr_frame), act)
        strip.repeat = float(repeat_count)
        start_f = int(strip.frame_start)
        end_f = int(strip.frame_end)

        title_display = f"[{idx + 1}/{total_actions}]  {friendly_name.upper()}"
        for f in range(start_f, end_f + 1):
            frame_title_map[f] = title_display

        print(f"  [{idx + 1:02d}/{total_actions}] {act_name:24} (rep={repeat_count}) -> Frames {start_f}..{end_f} ({end_f - start_f + 1}f)")
        curr_frame = end_f + 1

    total_frames = curr_frame - 1
    print(f"[Blender Catalog] Total sequence duration: {total_frames} frames ({total_frames / 30:.1f}s = {total_frames / 1800:.2f} min)")

    # Disable active action so NLA track takes complete precedence
    arm.animation_data.action = None

    # Setup 3D Dynamic Title Card above character
    if "Catalog_Label" not in bpy.data.objects:
        bpy.ops.object.text_add(location=(0.0, 2.2, 1.48), rotation=(math.radians(90), 0, 0))
        label_obj = bpy.context.active_object
        label_obj.name = "Catalog_Label"
        label_obj.data.align_x = 'CENTER'
        label_obj.data.size = 0.14

        # Glowing Neon Cyan Material
        mat_txt = bpy.data.materials.new(name="Catalog_Text_Mat")
        mat_txt.use_nodes = True
        bsdf = mat_txt.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = (0.2, 0.85, 1.0, 1.0)
            bsdf.inputs["Emission Color"].default_value = (0.15, 0.75, 1.0, 1.0)
            bsdf.inputs["Emission Strength"].default_value = 1.2
        label_obj.data.materials.append(mat_txt)
    else:
        label_obj = bpy.data.objects["Catalog_Label"]

    # Frame change handler to update the title text dynamically
    def update_catalog_title(current_scene):
        f = current_scene.frame_current
        label_obj.data.body = frame_title_map.get(f, "MYOS ANIMATION SHOWCASE")

    bpy.app.handlers.frame_change_pre.clear()
    bpy.app.handlers.frame_change_pre.append(update_catalog_title)

    # Studio Backdrop & Floor
    if "Studio_Backdrop" not in bpy.data.objects:
        bpy.ops.mesh.primitive_plane_add(size=16, location=(0, 2.5, 1.0), rotation=(math.radians(90), 0, 0))
        backdrop = bpy.context.active_object
        backdrop.name = "Studio_Backdrop"
        mat_bd = bpy.data.materials.new(name="Backdrop_Mat")
        mat_bd.use_nodes = True
        bsdf_bd = mat_bd.node_tree.nodes.get("Principled BSDF")
        if bsdf_bd:
            bsdf_bd.inputs["Base Color"].default_value = (0.10, 0.13, 0.20, 1.0) # Deep slate studio cyclorama
            bsdf_bd.inputs["Roughness"].default_value = 0.95
        backdrop.data.materials.append(mat_bd)

    if "Studio_Floor" not in bpy.data.objects:
        bpy.ops.mesh.primitive_plane_add(size=16, location=(0, 0, 0), rotation=(0, 0, 0))
        floor = bpy.context.active_object
        floor.name = "Studio_Floor"
        mat_f = bpy.data.materials.new(name="Floor_Mat")
        mat_f.use_nodes = True
        bsdf_fl = mat_f.node_tree.nodes.get("Principled BSDF")
        if bsdf_fl:
            bsdf_fl.inputs["Base Color"].default_value = (0.07, 0.09, 0.13, 1.0)
            bsdf_fl.inputs["Roughness"].default_value = 0.35
        floor.data.materials.append(mat_f)

    # Full-body Cinema Camera Framing (Calibrated: 28mm lens @ 4.6m distance)
    # Provides wide vertical framing so feet, jump height, and overhead title are 100% visible
    cam = bpy.data.objects.get("RenderCam")
    if not cam:
        cam_data = bpy.data.cameras.new("RenderCam")
        cam = bpy.data.objects.new("RenderCam", cam_data)
        bpy.context.collection.objects.link(cam)

    target = bpy.data.objects.get("CamTarget")
    if not target:
        bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0.0, 0.0, 0.60))
        target = bpy.context.active_object
        target.name = "CamTarget"
    else:
        target.location = (0.0, 0.0, 0.60)

    cam.location = (0.0, -4.6, 0.60)
    cam.data.lens = 28
    cam.constraints.clear()
    tt = cam.constraints.new(type='TRACK_TO')
    tt.target = target
    tt.track_axis = 'TRACK_NEGATIVE_Z'
    tt.up_axis = 'UP_Y'
    scene.camera = cam

    # Render Quality & Performance Optimization
    os.makedirs(FRAMES_DIR, exist_ok=True)
    scene.render.resolution_x = 640
    scene.render.resolution_y = 360
    scene.render.fps = 30
    scene.frame_start = 1
    scene.frame_end = total_frames
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"

    # Fast 4-sample EEVEE rendering (0.13s/frame = ~6 min for full 2,900+ frame film)
    scene.eevee.taa_render_samples = 4

    render_prefix = os.path.abspath(os.path.join(FRAMES_DIR, "frame_"))
    scene.render.filepath = render_prefix

    print(f"[Blender Catalog] 🎥 Rendering {total_frames} frames to {FRAMES_DIR}...")
    bpy.ops.render.render(animation=True)
    print(f"[Blender Catalog] ✅ All {total_frames} frames rendered successfully!")


def main():
    if "bpy" in sys.modules:
        run_blender_catalog_render()
        return

    print("=====================================================================")
    print("🎬 MyOS Sovereign Studio: 43-Action Mannequin Catalog Film Pipeline")
    print("=====================================================================")

    if not os.path.isfile(BLENDER_EXE):
        print(f"❌ Blender executable not found at: {BLENDER_EXE}")
        sys.exit(1)

    if not os.path.isfile(BLEND_PATH):
        print(f"❌ Blend file not found at: {BLEND_PATH}")
        sys.exit(1)

    os.makedirs(FRAMES_DIR, exist_ok=True)
    out_dir = os.path.dirname(OUTPUT_VIDEO)
    os.makedirs(out_dir, exist_ok=True)

    this_script = os.path.abspath(__file__)

    # Step 1: Headless Blender Render with unbuffered live progress streaming
    cmd = [
        BLENDER_EXE,
        "-b", BLEND_PATH,
        "-P", this_script
    ]
    print(f"[Pipeline Step 1/3] 🚀 Launching Headless Blender 5.2 (Rendering ~2,920 frames with calibrated full-body framing)...")
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace"
    )
    frame_counter = 0
    for line in proc.stdout:
        line_str = line.strip()
        if "Saved:" in line_str:
            frame_counter += 1
            if frame_counter % 50 == 0 or frame_counter == 1:
                frame_name = os.path.basename(line_str.replace("Saved: '", "").replace("'", ""))
                print(f"  🎬 [Blender Render Progress] Rendered {frame_counter} frames (latest: {frame_name})", flush=True)
        elif "[Blender Catalog]" in line_str or "Error" in line_str or "Exception" in line_str:
            print(line_str, flush=True)

    proc.wait()
    if proc.returncode != 0:
        print(f"❌ Blender execution failed with exit code {proc.returncode}!")
        sys.exit(proc.returncode)

    frame_files = [f for f in os.listdir(FRAMES_DIR) if f.startswith("frame_") and f.endswith(".png")]
    print(f"[Blender Result] Generated {len(frame_files)} frames in {FRAMES_DIR}")
    if len(frame_files) == 0:
        print("❌ No frames produced by Blender! STDOUT log:")
        print(proc.stdout)
        print(proc.stderr)
        sys.exit(1)

    # Step 2: PyAV Video Assembly
    print(f"[Pipeline Step 2/3] 🎞️ Compiling {len(frame_files)} frames with PyAV into H.264 MP4...")
    stitcher_script = os.path.join(WORKSPACE_ROOT, "scripts/tools/stitch_studio_reel.py")
    stitch_cmd = [
        sys.executable,
        stitcher_script,
        "--frames-dir", FRAMES_DIR,
        "--output", OUTPUT_VIDEO,
        "--fps", "30"
    ]
    stitch_proc = subprocess.run(
        stitch_cmd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace"
    )
    print(stitch_proc.stdout)
    if stitch_proc.returncode != 0:
        print(f"❌ PyAV stitching failed: {stitch_proc.stderr}")
        sys.exit(stitch_proc.returncode)

    # Step 3: Verification
    print(f"[Pipeline Step 3/3] 🔍 Verifying output file...")
    if os.path.isfile(OUTPUT_VIDEO):
        size_kb = os.path.getsize(OUTPUT_VIDEO) / 1024
        duration_sec = len(frame_files) / 30.0
        print(f"✅ Master Film Ready: {OUTPUT_VIDEO} ({size_kb:.1f} KB, {duration_sec:.1f}s)")
        print(f"🌐 Web Stream Endpoint: http://localhost:5173/screenings/mannequin_animation_catalog.mp4")
    else:
        print(f"❌ Output video missing at {OUTPUT_VIDEO}")
        sys.exit(1)


if __name__ == "__main__":
    main()
