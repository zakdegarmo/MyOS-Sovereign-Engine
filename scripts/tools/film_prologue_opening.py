# scripts/tools/film_prologue_opening.py
"""
film_prologue_opening.py
------------------------
Renders Zak's 2-shot 15-second Prologue Opening (360 frames @ 24fps):
  - Shot 1 (Frames 1-180): High bird's-eye descent into the vast moonlit scrap yard.
  - Shot 2 (Frames 181-360): Worm's-eye macro mud puddle reflecting overhead sodium lamp;
                           Red's knobby tire rolls slowly from right to left with water ripples.
"""

import bpy
import math
import os
import sys
from mathutils import Vector, Euler

# Windows PowerShell UTF-8
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "prologue_opening")
CANONICAL_BLEND = os.path.join(WORKSPACE_ROOT, "uniracer_model.blend")

os.makedirs(OUTPUT_DIR, exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_mat(name, color, roughness=0.5, metalness=0.0, emission=None, emission_strength=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metalness
        if emission:
            try:
                bsdf.inputs['Emission Color'].default_value = emission
                bsdf.inputs['Emission Strength'].default_value = emission_strength
            except KeyError:
                pass
    return mat

def setup_prologue_world():
    reset_scene()
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.frame_start = 1
    scene.frame_end = 360

    # Night Sky World
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.02, 0.03, 0.06, 1.0)
        bg.inputs[1].default_value = 0.50

    # Materials
    m_asphalt = create_mat("WetAsphalt", (0.10, 0.11, 0.12, 1.0), roughness=0.65, metalness=0.15)
    m_puddle = create_mat("MudPuddle", (0.03, 0.03, 0.04, 1.0), roughness=0.02, metalness=0.96)
    m_rust = create_mat("RustedSteel", (0.28, 0.15, 0.09, 1.0), roughness=0.85, metalness=0.3)
    m_tire_rubber = create_mat("WornTireRubber", (0.06, 0.07, 0.08, 1.0), roughness=0.92)
    m_lamp_glow = create_mat("SodiumLampGlow", (1.0, 0.85, 0.40, 1.0), roughness=0.1, emission=(1.0, 0.82, 0.35, 1.0), emission_strength=4.0)

    # 1. Vast Asphalt Soundstage Ground (60m x 60m)
    bpy.ops.mesh.primitive_plane_add(size=60.0, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.data.materials.append(m_asphalt)

    # 2. Reflective Mud Puddle (centered around X = -1.6, Y = -1.9, Z = 0.005)
    bpy.ops.mesh.primitive_cylinder_add(radius=1.4, depth=0.005, location=(-1.6, -1.9, 0.003))
    puddle = bpy.context.active_object
    puddle.scale = (1.4, 0.85, 1.0) # Elliptical puddle
    puddle.data.materials.append(m_puddle)

    # Secondary small mud puddles
    for px, py, pr in [(-3.8, -2.4, 0.8), (0.8, -1.6, 0.6), (-1.2, 4.0, 1.8), (5.0, 2.0, 1.5)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=pr, depth=0.004, location=(px, py, 0.002))
        p = bpy.context.active_object
        p.data.materials.append(m_puddle)

    # 3. Scrap Yard Props & Set Dressing
    # Background tire stacks
    for sx, sy in [(-8.0, 6.0), (7.0, 8.0), (-12.0, -4.0), (10.0, -6.0)]:
        for tz in range(3):
            bpy.ops.mesh.primitive_torus_add(major_radius=0.7, minor_radius=0.28, location=(sx, sy, 0.3 + tz * 0.55))
            t_obj = bpy.context.active_object
            t_obj.data.materials.append(m_tire_rubber)

    # Giant industrial sprockets leaning in the distance
    for sp_x, sp_y, sp_rot in [(-6.5, 4.0, 0.3), (6.0, 5.0, -0.4)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=1.8, depth=0.15, location=(sp_x, sp_y, 1.7))
        sp_obj = bpy.context.active_object
        sp_obj.rotation_euler = (0, math.radians(75), sp_rot)
        sp_obj.data.materials.append(m_rust)

    # 4. Sodium-Vapor Streetlamp
    # Tall pole
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=7.0, location=(-1.6, -4.5, 3.5))
    pole = bpy.context.active_object
    pole.data.materials.append(m_rust)
    # Lamp head
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.6, -3.8, 6.8))
    head = bpy.context.active_object
    head.scale = (0.5, 0.8, 0.3)
    head.data.materials.append(m_lamp_glow)

    # Sodium Streetlamp Point Light (casts strong reflection into the mud puddle!)
    sodium_light = bpy.data.lights.new(name="SodiumLight", type='POINT')
    sodium_light.energy = 450.0
    sodium_light.color = (1.0, 0.82, 0.40)
    sodium_obj = bpy.data.objects.new("SodiumLight", sodium_light)
    sodium_obj.location = (-1.6, -3.8, 6.5)
    bpy.context.scene.collection.objects.link(sodium_obj)

    # Atmospheric moonlight fill
    moon_light = bpy.data.lights.new(name="MoonLight", type='SUN')
    moon_light.energy = 1.2
    moon_light.color = (0.40, 0.65, 0.95)
    moon_obj = bpy.data.objects.new("MoonLight", moon_light)
    moon_obj.rotation_euler = (math.radians(50), math.radians(20), math.radians(-40))
    bpy.context.scene.collection.objects.link(moon_obj)

    # Camera
    cam_data = bpy.data.cameras.new("CinemaCamera")
    cam_data.sensor_width = 36
    cam_obj = bpy.data.objects.new("CinemaCamera", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # 5. Load Red from Canonical uniracer_model.blend
    print(f"Loading Red from canonical blend: {CANONICAL_BLEND}")
    with bpy.data.libraries.load(CANONICAL_BLEND, link=False) as (data_from, data_to):
        data_to.collections = ["New_Uniracer_Model"]
    
    red_col = data_to.collections[0]
    bpy.context.scene.collection.children.link(red_col)

    red_rig = None
    for obj in red_col.all_objects:
        if obj.type == 'ARMATURE':
            red_rig = obj
            break

    if red_rig:
        scale_fac = 0.034
        red_rig.scale = (scale_fac, scale_fac, scale_fac)
        print("Scaled Red armature cleanly to 0.034")

    return cam_obj, red_rig

def animate_prologue(cam_obj, red_rig):
    cam = cam_obj
    rig = red_rig

    # =========================================================================
    # SHOT 1 (Frames 1-180, ~7.5s): High Bird's-Eye Descent
    # =========================================================================
    cam.data.lens = 28 # Wide cinematic angle

    # F1: High in the night sky above scrap yard
    cam.location = (0.0, -18.0, 22.0)
    cam.rotation_euler = (math.radians(52), 0, 0)
    cam.keyframe_insert(data_path="location", frame=1)
    cam.keyframe_insert(data_path="rotation_euler", frame=1)

    # F180: Descended smoothly toward mid-level
    cam.location = (-0.5, -9.0, 9.5)
    cam.rotation_euler = (math.radians(42), 0, math.radians(-6))
    cam.keyframe_insert(data_path="location", frame=180)
    cam.keyframe_insert(data_path="rotation_euler", frame=180)

    # During Shot 1: Red is placed far in the distance or stationary
    if rig:
        rig.location = (4.0, -1.9, 0.41)
        rig.keyframe_insert(data_path="location", frame=1)
        rig.keyframe_insert(data_path="location", frame=180)

    # =========================================================================
    # SHOT 2 (Frames 181-360, ~7.5s): Worm's-Eye Mud Puddle Reflection & Roll
    # =========================================================================
    # Instant cut at Frame 181 down to water level!
    cam.data.lens = 42
    cam.data.keyframe_insert(data_path="lens", frame=180)
    cam.data.lens = 50 # Macro perspective
    cam.data.keyframe_insert(data_path="lens", frame=181)

    # Camera sitting right at water level looking across the mud puddle
    # Puddle is at (-1.6, -1.9, 0.0). Camera at (-0.4, -2.8, 0.16) looking at (-1.6, -1.9, 0.20)
    cam.location = (-0.5, -2.7, 0.18)
    cam.rotation_euler = (math.radians(85), 0, math.radians(48))
    cam.keyframe_insert(data_path="location", frame=181)
    cam.keyframe_insert(data_path="rotation_euler", frame=181)

    # Slow micro-tracking with the tire as it passes
    cam.location = (-1.1, -2.6, 0.20)
    cam.rotation_euler = (math.radians(84), 0, math.radians(35))
    cam.keyframe_insert(data_path="location", frame=360)
    cam.keyframe_insert(data_path="rotation_euler", frame=360)

    # Red rolls slowly through puddle from Right (X = 0.8) to Left (X = -4.0)
    if rig:
        # F181: Approaching puddle from screen right
        rig.location = (0.8, -1.9, 0.41)
        rig.rotation_euler = (0, 0, math.radians(-90)) # Heading -X (left)
        rig.keyframe_insert(data_path="location", frame=181)
        rig.keyframe_insert(data_path="rotation_euler", frame=181)

        # F270: Splashing through the center of the mud puddle!
        rig.location = (-1.6, -1.9, 0.41)
        rig.rotation_euler = (0, 0, math.radians(-90))
        rig.keyframe_insert(data_path="location", frame=270)
        rig.keyframe_insert(data_path="rotation_euler", frame=270)

        # F360: Exiting puddle on screen left
        rig.location = (-3.8, -1.9, 0.41)
        rig.rotation_euler = (0, 0, math.radians(-90))
        rig.keyframe_insert(data_path="location", frame=360)
        rig.keyframe_insert(data_path="rotation_euler", frame=360)

        # Animate wheel and crank rotation
        pb_wheel = rig.pose.bones.get("Bone_Wheel")
        pb_crank_l = rig.pose.bones.get("Bone_Crank_L")
        pb_crank_r = rig.pose.bones.get("Bone_Crank_R")
        pb_pedal_l = rig.pose.bones.get("Bone_Pedal_L")
        pb_pedal_r = rig.pose.bones.get("Bone_Pedal_R")

        total_dist = 4.6 # meters traveled
        wheel_radius = 0.41
        total_rot = total_dist / wheel_radius # ~11.2 radians

        for f in range(181, 361):
            t = (f - 181) / 179.0
            ang = t * total_rot
            if pb_wheel:
                pb_wheel.rotation_mode = 'XYZ'
                pb_wheel.rotation_euler = (-ang, 0, 0)
                pb_wheel.keyframe_insert(data_path="rotation_euler", frame=f)
            if pb_crank_l:
                pb_crank_l.rotation_mode = 'XYZ'
                pb_crank_l.rotation_euler = (-ang, 0, 0)
                pb_crank_l.keyframe_insert(data_path="rotation_euler", frame=f)
            if pb_crank_r:
                pb_crank_r.rotation_mode = 'XYZ'
                pb_crank_r.rotation_euler = (-ang, 0, 0)
                pb_crank_r.keyframe_insert(data_path="rotation_euler", frame=f)
            # Counter-rotate pedals so they stay level
            if pb_pedal_l:
                pb_pedal_l.rotation_mode = 'XYZ'
                pb_pedal_l.rotation_euler = (ang, 0, 0)
                pb_pedal_l.keyframe_insert(data_path="rotation_euler", frame=f)
            if pb_pedal_r:
                pb_pedal_r.rotation_mode = 'XYZ'
                pb_pedal_r.rotation_euler = (ang, 0, 0)
                pb_pedal_r.keyframe_insert(data_path="rotation_euler", frame=f)

def render_prologue():
    scene = bpy.context.scene
    print(f"🎬 Starting render of {scene.frame_end} frames to {OUTPUT_DIR}...")
    for f in range(scene.frame_start, scene.frame_end + 1):
        scene.frame_set(f)
        scene.render.filepath = os.path.join(OUTPUT_DIR, f"frame_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
        if f % 40 == 0 or f == scene.frame_end:
            pct = (f / float(scene.frame_end)) * 100.0
            print(f"  Rendered Frame {f}/{scene.frame_end} ({pct:.1f}%)")
    print("✅ Prologue frames rendered successfully!")

if __name__ == "__main__":
    cam_obj, red_rig = setup_prologue_world()
    animate_prologue(cam_obj, red_rig)
    render_prologue()
