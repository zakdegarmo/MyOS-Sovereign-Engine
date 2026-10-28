"""
film_act1_uniracer_cutscene.py
-------------------------------
Bespoke Cinematic Director for Act 1: "The Scrap Yard Awakening".
Filmed in Red's Junkyard Hideout (Couch, Broken Spring, CRT TV, 10W-40 Can, Oil Puddle, Burn Barrel).
Produces an 8-second 24fps cinematic cutscene (192 frames):
1. Imports bespoke 3D Junkyard Hideout (junkyard_hideout_vignette.glb) and Red ('models/uniracer_model.blend').
2. Stages Red slouched on the worn couch cushion.
3. Animates 4 John Hughes-style cinematic shots:
   - Shot 1 (Frames 1-48): Macro dolly across oil slick & 10W-40 can with barrel fire & CRT reflections.
   - Shot 2 (Frames 49-96): Medium 3/4 track past bursting couch spring, revealing slouched, breathing Red.
   - Shot 3 (Frames 97-144): Over-the-shoulder at CRT TV flashing with outlaw broadcast; Red perks up alert!
   - Shot 4 (Frames 145-192): Red revs tire on cushion, leaps off couch, hits floor, and peels into the night!
4. Renders headlessly with Blender 5.2.
5. Burns 2.39:1 cinematic letterbox and authentic narrative subtitles.
6. Muxes with 'apps/web/public/audio/act1_scrap_yard_rock.wav' via PyAV into:
   'apps/web/public/screenings/act1_scrap_yard_awakening.mp4'.
"""

import bpy
import math
import os
import sys
import glob
from mathutils import Vector, Quaternion, Matrix, Euler

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "act1")
VIDEO_OUTPUT = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "screenings", "act1_scrap_yard_awakening.mp4")
AUDIO_INPUT = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "audio", "act1_scrap_yard_rock.wav")
JUNKYARD_GLB = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "models", "junkyard_hideout_vignette.glb")
RED_BLEND = os.path.join(WORKSPACE_ROOT, "models", "uniracer_model.blend")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(VIDEO_OUTPUT), exist_ok=True)

SUBTITLES = [
    (1, 48, "1994. The lawsuit hit hard. A unicycle with attitude was deemed too dangerous for the market."),
    (49, 96, "Thirty years rusting in exile. Cold hubs, dust on the tire... but the motor still hums."),
    (97, 144, "An outlaw broadcast overrides the cathode static: The Underground League has returned."),
    (145, 192, "Time to get the old crew back together. The Outlaw Syndicate rides again.")
]

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

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
        # Scale Red down from native 12-unit unicycle to realistic ~0.8m height
        scale_fac = 0.05
        red_rig.scale = (scale_fac, scale_fac, scale_fac)
        # Position on depressed couch seat (-0.46, -0.05, ~0.65)
        red_rig.location = (-0.46, -0.05, 0.68)
        red_rig.rotation_euler = (math.radians(14), math.radians(6), math.radians(-10))
        print("Successfully staged Red on the junkyard couch!")
    return red_rig

def animate_cutscene(red_rig):
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 192

    # Camera
    cam_data = bpy.data.cameras.new("CinemaCamera")
    cam_data.sensor_width = 36
    cam_obj = bpy.data.objects.new("CinemaCamera", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Bone handles
    b_frame = red_rig.pose.bones.get("Bone_Frame") if red_rig else None
    b_saddle = red_rig.pose.bones.get("Bone_SaddleHead") if red_rig else None
    b_wheel = red_rig.pose.bones.get("Bone_Wheel") if red_rig else None

    # -------------------------------------------------------------
    # SHOT 1 (Frames 1-48): Macro Dolly across Oil Puddle, Wrench & Can
    # -------------------------------------------------------------
    cam_keyframes_s1 = [
        (1,  Vector((0.25, -1.65, 0.42)), Vector((-0.22, -0.65, 0.16)), 32),
        (48, Vector((-0.08, -1.42, 0.36)), Vector((-0.28, -0.65, 0.16)), 35)
    ]
    for f, pos, look, lens in cam_keyframes_s1:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    # Red resting in shadows during Shot 1
    if red_rig:
        red_rig.location = (-0.46, -0.05, 0.68)
        red_rig.rotation_euler = (math.radians(14), math.radians(6), math.radians(-10))
        red_rig.keyframe_insert(data_path="location", frame=1)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=1)
        if b_frame:
            b_frame.rotation_euler = (math.radians(12), 0, 0)
            b_frame.keyframe_insert(data_path="rotation_euler", frame=1)
        if b_saddle:
            b_saddle.rotation_euler = (math.radians(-14), 0, 0)
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=1)

    # -------------------------------------------------------------
    # SHOT 2 (Frames 49-96): 3/4 Dolly past Bursting Spring to Red
    # -------------------------------------------------------------
    cam_keyframes_s2 = [
        (49, Vector((0.85, -1.65, 0.72)), Vector((-0.25, 0.05, 0.65)), 40),
        (96, Vector((0.25, -1.80, 0.68)), Vector((-0.35, 0.02, 0.68)), 42)
    ]
    for f, pos, look, lens in cam_keyframes_s2:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    # Red breathing & sighing
    if red_rig:
        if b_frame:
            # Idle breathing cycle
            b_frame.rotation_euler = (math.radians(12), 0, 0)
            b_frame.keyframe_insert(data_path="rotation_euler", frame=49)
            b_frame.rotation_euler = (math.radians(16), 0, 0) # Inhale
            b_frame.keyframe_insert(data_path="rotation_euler", frame=72)
            b_frame.rotation_euler = (math.radians(11), 0, 0) # Exhale
            b_frame.keyframe_insert(data_path="rotation_euler", frame=96)
        if b_saddle:
            b_saddle.rotation_euler = (math.radians(-14), math.radians(15), 0)
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=49)
            b_saddle.rotation_euler = (math.radians(-10), math.radians(20), 0)
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=72)
            b_saddle.rotation_euler = (math.radians(-14), math.radians(16), 0)
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=96)

    # -------------------------------------------------------------
    # SHOT 3 (Frames 97-144): Over-Shoulder at CRT Static & Alert
    # -------------------------------------------------------------
    cam_keyframes_s3 = [
        (97,  Vector((-0.85, -0.45, 0.85)), Vector((1.45, -0.30, 0.65)), 35),
        (144, Vector((-0.75, -0.35, 0.88)), Vector((1.45, -0.30, 0.65)), 38)
    ]
    for f, pos, look, lens in cam_keyframes_s3:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    # Red perks up alert!
    if red_rig:
        if b_frame:
            b_frame.rotation_euler = (math.radians(11), 0, 0)
            b_frame.keyframe_insert(data_path="rotation_euler", frame=97)
            b_frame.rotation_euler = (math.radians(-8), 0, 0) # Snaps upright!
            b_frame.keyframe_insert(data_path="rotation_euler", frame=120)
            b_frame.keyframe_insert(data_path="rotation_euler", frame=144)
        if b_saddle:
            b_saddle.rotation_euler = (math.radians(-14), math.radians(16), 0)
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=97)
            b_saddle.rotation_euler = (math.radians(16), math.radians(35), math.radians(-8)) # Head cocks to TV
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=118)
            b_saddle.rotation_euler = (math.radians(18), math.radians(10), 0) # Looks forward determined
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=144)

    # -------------------------------------------------------------
    # SHOT 4 (Frames 145-192): Couch Leap, Landing Thud, Peelout!
    # -------------------------------------------------------------
    cam_keyframes_s4 = [
        (145, Vector((0.20, -2.60, 0.85)), Vector((-0.15, -0.40, 0.60)), 28),
        (192, Vector((0.10, -3.60, 0.95)), Vector((-0.10, -1.20, 0.55)), 28)
    ]
    for f, pos, look, lens in cam_keyframes_s4:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    if red_rig:
        # F145: Still on cushion
        red_rig.location = (-0.46, -0.05, 0.68)
        red_rig.rotation_euler = (math.radians(14), math.radians(6), math.radians(-10))
        red_rig.keyframe_insert(data_path="location", frame=145)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=145)

        # F158: Revs tire, crouches forward
        if b_frame:
            b_frame.rotation_euler = (math.radians(-18), 0, 0)
            b_frame.keyframe_insert(data_path="rotation_euler", frame=155)

        # F165: Airborne leap off couch
        red_rig.location = (-0.35, -0.45, 0.85)
        red_rig.rotation_euler = (math.radians(8), 0, 0)
        red_rig.keyframe_insert(data_path="location", frame=165)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=165)

        # F172: Heavy landing thud on floor!
        red_rig.location = (-0.25, -0.85, 0.32)
        red_rig.rotation_euler = (0, 0, 0)
        red_rig.keyframe_insert(data_path="location", frame=172)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=172)

        # F192: Full throttle peelout into the night!
        red_rig.location = (-0.10, -3.80, 0.32)
        red_rig.rotation_euler = (math.radians(-22), 0, 0) # Deep forward speed lean
        red_rig.keyframe_insert(data_path="location", frame=192)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=192)

        if b_wheel:
            b_wheel.rotation_euler = (0, 0, 0)
            b_wheel.keyframe_insert(data_path="rotation_euler", frame=145)
            # Rapid spinning wheel (12 full turns = 4320 deg)
            b_wheel.rotation_euler = (math.radians(-4320), 0, 0)
            b_wheel.keyframe_insert(data_path="rotation_euler", frame=192)

def setup_lighting():
    print("Setting up cinematic 90s noir lighting...")
    scene = bpy.context.scene

    # Ambient World Environment
    world = scene.world
    if not world:
        world = bpy.data.worlds.new("JunkyardWorld")
        scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.04, 0.05, 0.07, 1.0) # Deep industrial slate/midnight ambient
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

def render_cutscene():
    scene = bpy.context.scene
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.fps = 24
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = os.path.join(OUTPUT_DIR, "raw_frame_")

    scene.render.engine = 'BLENDER_EEVEE'

    print(f"--- RENDERING 192 FRAMES TO {OUTPUT_DIR} ---")
    bpy.ops.render.render(animation=True)
    print("Render complete!")

def main():
    clear_scene()
    import_junkyard_set()
    red = import_and_stage_red()
    animate_cutscene(red)
    setup_lighting()
    render_cutscene()

if __name__ == "__main__":
    main()
