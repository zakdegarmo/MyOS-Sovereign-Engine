#!/usr/bin/env python3
"""
film_hello_world.py: Deterministic "Hello World" Film Generator for MyOS
Demonstrates the foundational headless Blender-to-PyAV pipeline:
1. Loads flesh_base_comic.blend headlessly
2. Animates the flesh mannequin waving hello with natural ease curves
3. Stitches rendered PNG frames into apps/web/public/screenings/hello_world.mp4
"""

import os
import sys
import math
import subprocess

# Set UTF-8 encoding for Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
BLEND_PATH = os.path.abspath(os.path.join(WORKSPACE_ROOT, "flesh_base_comic.blend"))
FRAMES_DIR = os.path.abspath(os.path.join(WORKSPACE_ROOT, "temp_hello_world_frames"))
OUTPUT_VIDEO = os.path.abspath(os.path.join(WORKSPACE_ROOT, "apps/web/public/screenings/hello_world.mp4"))
BLENDER_EXE = os.environ.get(
    "BLENDER_EXE",
    r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
)


def run_blender_render(resolution_x=640, resolution_y=360, total_frames=75):
    """Executes inside Blender to set up staging, keyframes, and render frames."""
    try:
        import bpy
        print(f"[Blender Engine] 🎬 Initializing Hello World scene...")
        scene = bpy.context.scene

        # 1. Clean animation data and enter pose mode
        arm = bpy.data.objects.get("Armature")
        if not arm:
            raise RuntimeError("Armature not found in blend file!")

        bpy.context.view_layer.objects.active = arm
        arm.animation_data_clear()
        bpy.ops.object.mode_set(mode='POSE')

        for pb in arm.pose.bones:
            pb.matrix_basis.identity()

        action = bpy.data.actions.new(name="Wave_Hello")
        arm.animation_data_create()
        arm.animation_data.action = action

        # 2. Bone references
        pb_l_arm = arm.pose.bones.get("LeftArm")
        pb_l_fa = arm.pose.bones.get("LeftForeArm")
        pb_r_arm = arm.pose.bones.get("RightArm")
        pb_r_forearm = arm.pose.bones.get("RightForeArm")
        pb_r_hand = arm.pose.bones.get("RightHand")
        pb_head = arm.pose.bones.get("Head")

        animated_bones = [pb_l_arm, pb_l_fa, pb_r_arm, pb_r_forearm, pb_r_hand, pb_head]
        for b in animated_bones:
            if b:
                b.rotation_mode = "XYZ"

        # 3. Left arm resting naturally at side across entire animation
        for f in [1, total_frames]:
            scene.frame_set(f)
            if pb_l_arm:
                pb_l_arm.rotation_euler = (math.radians(-75), math.radians(5), math.radians(5))
                pb_l_arm.keyframe_insert(data_path="rotation_euler", frame=f)
            if pb_l_fa:
                pb_l_fa.rotation_euler = (math.radians(-10), 0, 0)
                pb_l_fa.keyframe_insert(data_path="rotation_euler", frame=f)

        # 4. Head subtle tilt during the wave
        head_keys = [
            (1, (0, 0, 0)),
            (15, (math.radians(-3), math.radians(6), math.radians(4))),
            (55, (math.radians(-3), math.radians(6), math.radians(4))),
            (72, (0, 0, 0)),
            (total_frames, (0, 0, 0))
        ]
        for f, rot in head_keys:
            scene.frame_set(f)
            if pb_head:
                pb_head.rotation_euler = rot
                pb_head.keyframe_insert(data_path="rotation_euler", frame=f)

        # 5. Right arm waving choreography
        # Bezier interpolation is Blender's default for keyframe_insert
        arm_keys = [
            # Frame, Arm Rot, Forearm Rot, Hand Rot
            (1, (-75, -5, -5), (-10, 0, 0), (0, 0, 0)),
            (14, (20, 20, 45), (85, 0, 0), (20, 0, 0)),
            (22, (20, 20, 45), (85, 35, 0), (20, 30, 0)),
            (30, (20, 20, 45), (85, -30, 0), (20, -30, 0)),
            (38, (20, 20, 45), (85, 35, 0), (20, 30, 0)),
            (46, (20, 20, 45), (85, -30, 0), (20, -30, 0)),
            (54, (20, 20, 45), (85, 0, 0), (20, 0, 0)),
            (68, (-75, -5, -5), (-10, 0, 0), (0, 0, 0)),
            (total_frames, (-75, -5, -5), (-10, 0, 0), (0, 0, 0)),
        ]

        for f, a_deg, fa_deg, h_deg in arm_keys:
            scene.frame_set(f)
            if pb_r_arm:
                pb_r_arm.rotation_euler = (math.radians(a_deg[0]), math.radians(a_deg[1]), math.radians(a_deg[2]))
                pb_r_arm.keyframe_insert(data_path="rotation_euler", frame=f)
            if pb_r_forearm:
                pb_r_forearm.rotation_euler = (math.radians(fa_deg[0]), math.radians(fa_deg[1]), math.radians(fa_deg[2]))
                pb_r_forearm.keyframe_insert(data_path="rotation_euler", frame=f)
            if pb_r_hand:
                pb_r_hand.rotation_euler = (math.radians(h_deg[0]), math.radians(h_deg[1]), math.radians(h_deg[2]))
                pb_r_hand.keyframe_insert(data_path="rotation_euler", frame=f)

        bpy.ops.object.mode_set(mode='OBJECT')

        # 6. Studio Backdrop & Floor
        if "Studio_Backdrop" not in bpy.data.objects:
            bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 2.5, 1.0), rotation=(math.radians(90), 0, 0))
            backdrop = bpy.context.active_object
            backdrop.name = "Studio_Backdrop"
            mat = bpy.data.materials.new(name="Backdrop_Mat")
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (0.12, 0.16, 0.24, 1.0)
                bsdf.inputs["Roughness"].default_value = 0.9
            backdrop.data.materials.append(mat)

        if "Studio_Floor" not in bpy.data.objects:
            bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 0, 0), rotation=(0, 0, 0))
            floor = bpy.context.active_object
            floor.name = "Studio_Floor"
            mat_f = bpy.data.materials.new(name="Floor_Mat")
            mat_f.use_nodes = True
            bsdf_f = mat_f.node_tree.nodes.get("Principled BSDF")
            if bsdf_f:
                bsdf_f.inputs["Base Color"].default_value = (0.08, 0.10, 0.15, 1.0)
                bsdf_f.inputs["Roughness"].default_value = 0.3
            floor.data.materials.append(mat_f)

        # 7. Render Camera Setup
        cam = bpy.data.objects.get("RenderCam")
        if not cam:
            cam_data = bpy.data.cameras.new("RenderCam")
            cam = bpy.data.objects.new("RenderCam", cam_data)
            bpy.context.collection.objects.link(cam)

        cam.location = (0.0, -2.4, 0.65)
        cam.rotation_euler = (math.radians(90), 0, 0)
        cam.data.lens = 38
        scene.camera = cam

        # 8. Render Settings
        os.makedirs(FRAMES_DIR, exist_ok=True)
        scene.render.resolution_x = resolution_x
        scene.render.resolution_y = resolution_y
        scene.render.fps = 30
        scene.frame_start = 1
        scene.frame_end = total_frames
        scene.render.image_settings.file_format = "PNG"
        scene.render.image_settings.color_mode = "RGB"

        render_prefix = os.path.abspath(os.path.join(FRAMES_DIR, "frame_"))
        scene.render.filepath = render_prefix

        print(f"[Blender Engine] 🎥 Rendering {total_frames} frames ({resolution_x}x{resolution_y}) to {FRAMES_DIR}...")
        bpy.ops.render.render(animation=True)
        print(f"[Blender Engine] ✅ Frame rendering complete!")
    except Exception as e:
        print(f"[Blender Engine] ❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def main():
    # If running inside Blender python environment
    if "bpy" in sys.modules:
        run_blender_render(resolution_x=640, resolution_y=360, total_frames=75)
        return

    print("==========================================================")
    print("🎬 MyOS Sovereign Studio: Hello World Film Generation")
    print("==========================================================")

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

    # Step 1: Headless Blender Render
    cmd = [
        BLENDER_EXE,
        "-b", BLEND_PATH,
        "-P", this_script
    ]
    print(f"[Pipeline Step 1/3] 🚀 Launching Headless Blender 5.2...")
    proc = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace"
    )
    if proc.returncode != 0:
        print("❌ Blender execution failed!")
        print(proc.stdout)
        print(proc.stderr)
        sys.exit(proc.returncode)

    # Verify frames rendered
    frame_files = [f for f in os.listdir(FRAMES_DIR) if f.startswith("frame_") and f.endswith(".png")]
    print(f"[Blender Result] Generated {len(frame_files)} frames in {FRAMES_DIR}")
    if len(frame_files) == 0:
        print("❌ No frames were produced by Blender! STDOUT log:")
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
        print(f"✅ Master Film Ready: {OUTPUT_VIDEO} ({size_kb:.1f} KB)")
        print(f"🌐 Web Stream Endpoint: http://localhost:5173/screenings/hello_world.mp4")
    else:
        print(f"❌ Output video missing at {OUTPUT_VIDEO}")
        sys.exit(1)


if __name__ == "__main__":
    main()
