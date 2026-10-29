"""
film_act1_extended_cutscene.py
-------------------------------
Modular Cinematic Director for the 2.5-Minute Extended Short Film:
"Glyphrider: Torus Outlaws // Act 1: The 30-Year Slumber: Outlaw Awakening"

Total Duration: 160.0 Seconds (3,840 Frames @ 24fps) across 6 Distinct Scenes:
- Shot 1 (Frames 1-600, 25.0s): The Graveyard Outskirts (High-Angle Crane Descent)
- Shot 2 (Frames 1-600, 25.0s): Relics of the Golden Age (Macro Slider across Oil Slick & Wrench)
- Shot 3 (Frames 1-720, 30.0s): The 30-Year Slumber (Couch, Bursting Spring, Red Breathing Cycles)
- Shot 4 (Frames 1-720, 30.0s): The Pirate Frequency (Rack Focus Spokes to CRT TV Alert)
- Shot 5 (Frames 1-600, 25.0s): Resurfacing & Bearing Ignition (Lube Slick, Bearing Whine, Tire Rev)
- Shot 6 (Frames 1-600, 25.0s): Breakout & Peelout (Airborne Leap, Suspension Slam, Night Peelout)

Usage:
  blender.exe --background --python scripts/tools/film_act1_extended_cutscene.py -- --shot 1
  blender.exe --background --python scripts/tools/film_act1_extended_cutscene.py -- --shot all
"""

import bpy
import math
import os
import sys
import argparse
from mathutils import Vector, Quaternion, Matrix, Euler

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_ROOT = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "act1_extended")
JUNKYARD_GLB = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "models", "junkyard_hideout_vignette.glb")
RED_BLEND = os.path.join(WORKSPACE_ROOT, "models", "uniracer_model.blend")

os.makedirs(OUTPUT_ROOT, exist_ok=True)

def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    parser = argparse.ArgumentParser(description="Render extended cutscene shots")
    parser.add_argument("--shot", type=str, default="all", help="Shot to render: 1, 2, 3, 4, 5, 6, or all")
    return parser.parse_args(argv)

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def setup_world_and_lighting():
    scene = bpy.context.scene

    # Ambient World Environment
    world = scene.world
    if not world:
        world = bpy.data.worlds.new("JunkyardWorld")
        scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.04, 0.05, 0.07, 1.0)
        bg.inputs[1].default_value = 0.65

    # 1. Warm Tungsten Overhead Work Light (shop bulb above couch)
    shop_light = bpy.data.lights.new(name="WorkLight", type='POINT')
    shop_light.energy = 160.0
    shop_light.color = (1.0, 0.88, 0.72)
    shop_obj = bpy.data.objects.new("WorkLight", shop_light)
    shop_obj.location = (0.2, -0.6, 2.5)
    bpy.context.scene.collection.objects.link(shop_obj)

    # 2. Cool Moonlit Rim / Key (Slanted from container door)
    moon_sun = bpy.data.lights.new(name="MoonlightRim", type='SUN')
    moon_sun.energy = 3.2
    moon_sun.color = (0.50, 0.72, 1.0)
    moon_obj = bpy.data.objects.new("MoonlightRim", moon_sun)
    moon_obj.location = (3.0, -3.0, 4.0)
    moon_obj.rotation_euler = (math.radians(48), math.radians(18), math.radians(-32))
    bpy.context.scene.collection.objects.link(moon_obj)

    # 3. CRT Screen Glow Point Light (Electric Cyan)
    crt_light = bpy.data.lights.new(name="CRT_ScreenLight", type='POINT')
    crt_light.energy = 85.0
    crt_light.color = (0.28, 0.82, 1.0)
    crt_light_obj = bpy.data.objects.new("CRT_ScreenLight", crt_light)
    crt_light_obj.location = (1.30, -0.75, 0.70)
    bpy.context.scene.collection.objects.link(crt_light_obj)

    # 4. Burning Fire Glow inside barrel (Warm Ember Orange)
    barrel_light = bpy.data.lights.new(name="BarrelFireLight", type='POINT')
    barrel_light.energy = 110.0
    barrel_light.color = (1.0, 0.40, 0.05)
    barrel_light_obj = bpy.data.objects.new("BarrelFireLight", barrel_light)
    barrel_light_obj.location = (-2.4, 1.5, 1.1)
    bpy.context.scene.collection.objects.link(barrel_light_obj)

    # 5. Character Fill Light (Gentle warm fill to highlight Red's red chassis)
    fill_light = bpy.data.lights.new(name="RedFill", type='POINT')
    fill_light.energy = 55.0
    fill_light.color = (0.95, 0.85, 0.75)
    fill_light_obj = bpy.data.objects.new("RedFill", fill_light)
    fill_light_obj.location = (-0.5, -1.8, 1.2)
    bpy.context.scene.collection.objects.link(fill_light_obj)

def import_junkyard_set():
    if not os.path.exists(JUNKYARD_GLB):
        print(f"Error: GLB not found at {JUNKYARD_GLB}")
        return
    print(f"Importing Junkyard Vignette from {JUNKYARD_GLB}...")
    bpy.ops.import_scene.gltf(filepath=JUNKYARD_GLB)

def import_and_stage_red():
    print(f"Importing Red from {RED_BLEND}...")
    with bpy.data.libraries.load(RED_BLEND, link=False) as (data_from, data_to):
        data_to.collections = ["New_Uniracer_Model"]
    
    red_col = data_to.collections[0]
    bpy.context.scene.collection.children.link(red_col)

    red_rig = None
    for obj in red_col.all_objects:
        if obj.type == 'ARMATURE':
            red_rig = obj
            break

    if red_rig:
        scale_fac = 0.05
        red_rig.scale = (scale_fac, scale_fac, scale_fac)
        red_rig.location = (-0.46, -0.05, 0.68)
        red_rig.rotation_euler = (math.radians(14), math.radians(6), math.radians(-10))
    return red_rig

def build_camera(scene):
    cam_data = bpy.data.cameras.new("DirectorCam")
    cam_data.sensor_width = 36
    cam_obj = bpy.data.objects.new("DirectorCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    return cam_obj, cam_data

# =============================================================================
# SCENE DIRECTORS
# =============================================================================

def setup_shot_1(scene, cam_obj, cam_data, red_rig):
    """Shot 1: The Graveyard Outskirts (600 frames, 25.0s @ 24fps) - High Crane Descent"""
    scene.frame_start = 1
    scene.frame_end = 600

    cam_kfs = [
        (1,   Vector((1.8, -4.5, 3.2)), Vector((-0.2, 0.2, 0.4)), 32),
        (600, Vector((0.6, -3.2, 1.2)), Vector((-0.2, 0.0, 0.5)), 28)
    ]
    for f, pos, look, lens in cam_kfs:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert("location", frame=f)
        cam_obj.keyframe_insert("rotation_euler", frame=f)
        cam_data.keyframe_insert("lens", frame=f)

    if red_rig:
        red_rig.location = (-0.46, -0.05, 0.68)
        red_rig.rotation_euler = (math.radians(14), math.radians(6), math.radians(-10))
        red_rig.keyframe_insert("location", frame=1)
        red_rig.keyframe_insert("rotation_euler", frame=1)

def setup_shot_2(scene, cam_obj, cam_data, red_rig):
    """Shot 2: Relics of the Golden Age (600 frames, 25.0s @ 24fps) - Macro Slider Oil Slick"""
    scene.frame_start = 1
    scene.frame_end = 600

    cam_kfs = [
        (1,   Vector((0.40, -1.75, 0.45)), Vector((-0.18, -0.65, 0.16)), 32),
        (600, Vector((-0.18, -1.35, 0.32)), Vector((-0.30, -0.65, 0.16)), 36)
    ]
    for f, pos, look, lens in cam_kfs:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert("location", frame=f)
        cam_obj.keyframe_insert("rotation_euler", frame=f)
        cam_data.keyframe_insert("lens", frame=f)

    if red_rig:
        red_rig.location = (-0.46, -0.05, 0.68)
        red_rig.rotation_euler = (math.radians(14), math.radians(6), math.radians(-10))
        red_rig.keyframe_insert("location", frame=1)

def setup_shot_3(scene, cam_obj, cam_data, red_rig):
    """Shot 3: The 30-Year Slumber (720 frames, 30.0s @ 24fps) - Couch Dolly & 3 Breathing Cycles"""
    scene.frame_start = 1
    scene.frame_end = 720

    cam_kfs = [
        (1,   Vector((0.95, -1.85, 0.78)), Vector((-0.20, 0.05, 0.65)), 38),
        (720, Vector((0.15, -1.45, 0.70)), Vector((-0.42, -0.05, 0.68)), 42)
    ]
    for f, pos, look, lens in cam_kfs:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert("location", frame=f)
        cam_obj.keyframe_insert("rotation_euler", frame=f)
        cam_data.keyframe_insert("lens", frame=f)

    if red_rig:
        red_rig.location = (-0.46, -0.05, 0.68)
        red_rig.rotation_euler = (math.radians(14), math.radians(6), math.radians(-10))
        red_rig.keyframe_insert("location", frame=1)
        red_rig.keyframe_insert("rotation_euler", frame=1)

        b_frame = red_rig.pose.bones.get("Bone_Frame")
        b_saddle = red_rig.pose.bones.get("Bone_SaddleHead")

        # 3 Deep Breathing Cycles (each ~240 frames = 10s)
        for cycle in range(3):
            base_f = cycle * 240
            f_inhale = base_f + 100
            f_hold = base_f + 130
            f_exhale = base_f + 240

            if b_frame:
                scene.frame_set(base_f + 1)
                b_frame.rotation_euler = (math.radians(11), 0, 0)
                b_frame.keyframe_insert("rotation_euler", frame=base_f + 1)

                scene.frame_set(f_inhale)
                b_frame.rotation_euler = (math.radians(17), 0, 0) # Inhale expansion
                b_frame.keyframe_insert("rotation_euler", frame=f_inhale)

                scene.frame_set(f_hold)
                b_frame.rotation_euler = (math.radians(16.5), 0, 0)
                b_frame.keyframe_insert("rotation_euler", frame=f_hold)

                scene.frame_set(f_exhale)
                b_frame.rotation_euler = (math.radians(10.5), 0, 0) # Exhale drop
                b_frame.keyframe_insert("rotation_euler", frame=f_exhale)

            if b_saddle:
                scene.frame_set(base_f + 1)
                b_saddle.rotation_euler = (math.radians(-14), math.radians(14), 0)
                b_saddle.keyframe_insert("rotation_euler", frame=base_f + 1)

                scene.frame_set(f_inhale)
                b_saddle.rotation_euler = (math.radians(-8), math.radians(18), 0)
                b_saddle.keyframe_insert("rotation_euler", frame=f_inhale)

                scene.frame_set(f_exhale)
                b_saddle.rotation_euler = (math.radians(-15), math.radians(12), 0)
                b_saddle.keyframe_insert("rotation_euler", frame=f_exhale)

def setup_shot_4(scene, cam_obj, cam_data, red_rig):
    """Shot 4: The Pirate Frequency (720 frames, 30.0s @ 24fps) - Spokes to CRT TV Rack Focus & Alert"""
    scene.frame_start = 1
    scene.frame_end = 720

    cam_kfs = [
        (1,   Vector((-0.88, -0.48, 0.84)), Vector((1.45, -0.30, 0.65)), 34),
        (720, Vector((-0.72, -0.32, 0.88)), Vector((1.45, -0.30, 0.65)), 38)
    ]
    for f, pos, look, lens in cam_kfs:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert("location", frame=f)
        cam_obj.keyframe_insert("rotation_euler", frame=f)
        cam_data.keyframe_insert("lens", frame=f)

    if red_rig:
        red_rig.location = (-0.46, -0.05, 0.68)
        red_rig.rotation_euler = (math.radians(14), math.radians(6), math.radians(-10))
        red_rig.keyframe_insert("location", frame=1)

        b_frame = red_rig.pose.bones.get("Bone_Frame")
        b_saddle = red_rig.pose.bones.get("Bone_SaddleHead")

        # F1-360: Slouched resting in CRT glow
        if b_frame:
            b_frame.rotation_euler = (math.radians(12), 0, 0)
            b_frame.keyframe_insert("rotation_euler", frame=1)
            b_frame.keyframe_insert("rotation_euler", frame=350)
            # F390: Snaps upright!
            b_frame.rotation_euler = (math.radians(-10), 0, 0)
            b_frame.keyframe_insert("rotation_euler", frame=390)
            b_frame.keyframe_insert("rotation_euler", frame=720)

        # F360: Head turns sharply toward CRT TV
        if b_saddle:
            b_saddle.rotation_euler = (math.radians(-14), math.radians(14), 0)
            b_saddle.keyframe_insert("rotation_euler", frame=1)
            b_saddle.keyframe_insert("rotation_euler", frame=350)
            # Head turns with razor focus
            b_saddle.rotation_euler = (math.radians(18), math.radians(42), math.radians(-10))
            b_saddle.keyframe_insert("rotation_euler", frame=385)
            # Eyes/head track with lethal determination
            b_saddle.rotation_euler = (math.radians(20), math.radians(25), 0)
            b_saddle.keyframe_insert("rotation_euler", frame=540)
            b_saddle.keyframe_insert("rotation_euler", frame=720)

def setup_shot_5(scene, cam_obj, cam_data, red_rig):
    """Shot 5: Resurfacing & Ignition (600 frames, 25.0s @ 24fps) - Slide off couch, lube & tire rev"""
    scene.frame_start = 1
    scene.frame_end = 600

    cam_kfs = [
        (1,   Vector((0.35, -2.10, 0.55)), Vector((-0.30, -0.40, 0.40)), 30),
        (600, Vector((0.10, -1.80, 0.42)), Vector((-0.25, -0.65, 0.25)), 32)
    ]
    for f, pos, look, lens in cam_kfs:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert("location", frame=f)
        cam_obj.keyframe_insert("rotation_euler", frame=f)
        cam_data.keyframe_insert("lens", frame=f)

    if red_rig:
        b_frame = red_rig.pose.bones.get("Bone_Frame")
        b_wheel = red_rig.pose.bones.get("Bone_Wheel")

        # F1: On couch
        red_rig.location = (-0.46, -0.05, 0.68)
        red_rig.rotation_euler = (math.radians(14), math.radians(6), math.radians(-10))
        red_rig.keyframe_insert("location", frame=1)
        red_rig.keyframe_insert("rotation_euler", frame=1)

        # F120: Rolls down to oil puddle on floor
        red_rig.location = (-0.35, -0.65, 0.32)
        red_rig.rotation_euler = (0, 0, 0)
        red_rig.keyframe_insert("location", frame=120)
        red_rig.keyframe_insert("rotation_euler", frame=120)

        # F240 - F600: Revs wheel in oil puddle, smoke/sparks, aggressive lean
        if b_frame:
            b_frame.rotation_euler = (math.radians(-6), 0, 0)
            b_frame.keyframe_insert("rotation_euler", frame=1)
            b_frame.rotation_euler = (math.radians(-22), 0, 0) # Deep power crouch
            b_frame.keyframe_insert("rotation_euler", frame=240)
            b_frame.keyframe_insert("rotation_euler", frame=600)

        if b_wheel:
            b_wheel.rotation_euler = (0, 0, 0)
            b_wheel.keyframe_insert("rotation_euler", frame=1)
            b_wheel.keyframe_insert("rotation_euler", frame=180)
            # Rapid spinning wheel (40 full turns = 14400 deg)
            b_wheel.rotation_euler = (math.radians(-14400), 0, 0)
            b_wheel.keyframe_insert("rotation_euler", frame=600)

def setup_shot_6(scene, cam_obj, cam_data, red_rig):
    """Shot 6: Breakout & Peelout (600 frames, 25.0s @ 24fps) - Leap, suspension slam, night peelout"""
    scene.frame_start = 1
    scene.frame_end = 600

    cam_kfs = [
        (1,   Vector((0.25, -2.80, 0.90)), Vector((-0.15, -0.40, 0.55)), 28),
        (600, Vector((0.08, -3.90, 1.05)), Vector((-0.08, -1.40, 0.50)), 28)
    ]
    for f, pos, look, lens in cam_kfs:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert("location", frame=f)
        cam_obj.keyframe_insert("rotation_euler", frame=f)
        cam_data.keyframe_insert("lens", frame=f)

    if red_rig:
        b_frame = red_rig.pose.bones.get("Bone_Frame")
        b_wheel = red_rig.pose.bones.get("Bone_Wheel")

        # F1 - F150: Revving on floor, building torque
        red_rig.location = (-0.35, -0.65, 0.32)
        red_rig.rotation_euler = (math.radians(-18), 0, 0)
        red_rig.keyframe_insert("location", frame=1)
        red_rig.keyframe_insert("rotation_euler", frame=1)

        # F220: Huge acrobatic launch leap into the air
        red_rig.location = (-0.25, -1.25, 0.92)
        red_rig.rotation_euler = (math.radians(12), 0, 0)
        red_rig.keyframe_insert("location", frame=220)
        red_rig.keyframe_insert("rotation_euler", frame=220)

        # F290: Suspension impact crash on concrete floor!
        red_rig.location = (-0.20, -1.85, 0.32)
        red_rig.rotation_euler = (0, 0, 0)
        red_rig.keyframe_insert("location", frame=290)
        red_rig.keyframe_insert("rotation_euler", frame=290)

        # F340: Powerslide recovery & forward attack lean
        red_rig.location = (-0.18, -2.10, 0.32)
        red_rig.rotation_euler = (math.radians(-24), 0, 0)
        red_rig.keyframe_insert("location", frame=340)
        red_rig.keyframe_insert("rotation_euler", frame=340)

        # F600: Full-throttle breakout scream into the night past camera!
        red_rig.location = (-0.05, -5.50, 0.32)
        red_rig.rotation_euler = (math.radians(-26), 0, 0)
        red_rig.keyframe_insert("location", frame=600)
        red_rig.keyframe_insert("rotation_euler", frame=600)

        if b_wheel:
            b_wheel.rotation_euler = (0, 0, 0)
            b_wheel.keyframe_insert("rotation_euler", frame=1)
            b_wheel.rotation_euler = (math.radians(-21600), 0, 0) # 60 full turns
            b_wheel.keyframe_insert("rotation_euler", frame=600)

SHOT_CONFIGS = {
    "1": ("shot_01", 600, setup_shot_1),
    "2": ("shot_02", 600, setup_shot_2),
    "3": ("shot_03", 720, setup_shot_3),
    "4": ("shot_04", 720, setup_shot_4),
    "5": ("shot_05", 600, setup_shot_5),
    "6": ("shot_06", 600, setup_shot_6),
}

def render_shot(shot_key):
    folder_name, frame_count, setup_fn = SHOT_CONFIGS[shot_key]
    out_dir = os.path.join(OUTPUT_ROOT, folder_name)
    os.makedirs(out_dir, exist_ok=True)

    print(f"\n==========================================")
    print(f"🎬 DIRECTING SHOT {shot_key} ({folder_name}): {frame_count} FRAMES")
    print(f"==========================================")

    clear_scene()
    setup_world_and_lighting()
    import_junkyard_set()
    red = import_and_stage_red()

    scene = bpy.context.scene
    cam_obj, cam_data = build_camera(scene)
    setup_fn(scene, cam_obj, cam_data, red)

    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.fps = 24
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = os.path.join(out_dir, "raw_frame_")
    scene.render.engine = 'BLENDER_EEVEE'

    print(f"Rendering {frame_count} frames to {out_dir}...")
    bpy.ops.render.render(animation=True)
    print(f"[SUCCESS] Shot {shot_key} render complete!\n")

def main():
    args = parse_args()
    if args.shot == "all":
        for k in sorted(SHOT_CONFIGS.keys()):
            render_shot(k)
    elif "," in args.shot:
        for k in [s.strip() for s in args.shot.split(",")]:
            if k in SHOT_CONFIGS:
                render_shot(k)
    elif args.shot in SHOT_CONFIGS:
        render_shot(args.shot)
    else:
        print(f"Unknown shot: {args.shot}. Options: 1, 2, 3, 4, 5, 6, all, or comma-separated e.g. 2,3,4,5,6")

if __name__ == "__main__":
    main()
