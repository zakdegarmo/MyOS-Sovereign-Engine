# scripts/tools/film_prologue_v2.py
"""
film_prologue_v2.py
-------------------
Renders the refined 2-shot 15-second Prologue Opening (360 frames @ 24fps):
  - Shot 1 (Frames 1-180, 7.5s): High atmospheric crane descent over moonlit scrap yard.
                                 Red is 100% OFF-CAMERA (parked at X = 20m).
  - Shot 2 (Frames 181-360, 7.5s): Worm's-eye macro puddle art shot (Z = 0.22m, 48mm lens).
                                  Golden sodium streetlight reflection shimmers on water ripples.
                                  Red rolls right-to-left through the puddle with pedals intact.
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
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "prologue_v2")
CANONICAL_BLEND = os.path.join(WORKSPACE_ROOT, "uniracer_model.blend")

os.makedirs(OUTPUT_DIR, exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def build_puddle_street_material():
    mat = bpy.data.materials.new(name="PuddleStreetMaterial")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    nodes.clear()

    node_out = nodes.new('ShaderNodeOutputMaterial')
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    node_texcoord = nodes.new('ShaderNodeTexCoord')

    # Puddle radial gradient mask
    node_puddle_map = nodes.new('ShaderNodeMapping')
    node_puddle_map.inputs['Scale'].default_value = (0.7, 1.3, 1.0)
    links.new(node_texcoord.outputs['Object'], node_puddle_map.inputs['Vector'])

    node_grad = nodes.new('ShaderNodeTexGradient')
    node_grad.gradient_type = 'SPHERICAL'
    links.new(node_puddle_map.outputs['Vector'], node_grad.inputs['Vector'])

    node_ramp = nodes.new('ShaderNodeValToRGB')
    node_ramp.color_ramp.interpolation = 'EASE'
    node_ramp.color_ramp.elements[0].position = 0.32
    node_ramp.color_ramp.elements[0].color = (1, 1, 1, 1) # Pure water mirror
    node_ramp.color_ramp.elements[1].position = 0.62
    node_ramp.color_ramp.elements[1].color = (0, 0, 0, 1) # Asphalt
    links.new(node_grad.outputs['Fac'], node_ramp.inputs['Fac'])

    # Roughness mapping: 0.32 wet asphalt -> 0.005 mirror puddle
    node_map_rough = nodes.new('ShaderNodeMapRange')
    node_map_rough.inputs['From Min'].default_value = 0.0
    node_map_rough.inputs['From Max'].default_value = 1.0
    node_map_rough.inputs['To Min'].default_value = 0.32
    node_map_rough.inputs['To Max'].default_value = 0.005
    links.new(node_ramp.outputs['Color'], node_map_rough.inputs['Value'])
    links.new(node_map_rough.outputs['Result'], node_bsdf.inputs['Roughness'])

    # Concentric ripple waves + noise
    node_wave = nodes.new('ShaderNodeTexWave')
    node_wave.wave_type = 'RINGS'
    node_wave.rings_direction = 'SPHERICAL'
    node_wave.inputs['Scale'].default_value = 7.5
    node_wave.inputs['Distortion'].default_value = 3.0
    node_wave.inputs['Detail'].default_value = 2.0
    node_wave.inputs['Phase Offset'].default_value = 2.5
    links.new(node_texcoord.outputs['Object'], node_wave.inputs['Vector'])

    # Bump normal
    node_bump = nodes.new('ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.16 # Subtle, liquid water waves
    node_bump.inputs['Distance'].default_value = 0.04
    links.new(node_wave.outputs['Color'], node_bump.inputs['Height'])
    links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])

    # BSDF settings
    node_bsdf.inputs['Base Color'].default_value = (0.025, 0.03, 0.035, 1.0)
    node_bsdf.inputs['Metallic'].default_value = 0.90
    node_bsdf.inputs['IOR'].default_value = 1.333
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    return mat

def create_simple_mat(name, color, roughness=0.5, metalness=0.0, emission=None, emission_strength=1.0):
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

def setup_scene():
    reset_scene()
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    try:
        scene.eevee.use_raytracing = True
    except Exception:
        pass
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.frame_start = 1
    scene.frame_end = 360

    # Color management
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.exposure = 0.5

    # World: Deep night atmosphere
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.012, 0.015, 0.025, 1.0)
        bg.inputs[1].default_value = 0.35

    # Materials
    m_ground = build_puddle_street_material()
    m_rust = create_simple_mat("RustedScrap", (0.22, 0.12, 0.08, 1.0), roughness=0.85, metalness=0.25)
    m_tire = create_simple_mat("ScrapTires", (0.05, 0.06, 0.07, 1.0), roughness=0.92)
    m_lamp_glow = create_simple_mat("SodiumGlow", (1.0, 0.75, 0.25, 1.0), roughness=0.1,
                                    emission=(1.0, 0.72, 0.22, 1.0), emission_strength=25.0)

    # Ground soundstage (40m x 40m)
    bpy.ops.mesh.primitive_plane_add(size=40.0, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.data.materials.append(m_ground)

    # Scrap Yard Clutter:
    # 1. Left tire stacks & salvage
    for sx, sy in [(-2.8, 3.2), (-6.0, 5.0), (-8.0, -1.0)]:
        for tz in range(3):
            bpy.ops.mesh.primitive_torus_add(major_radius=0.75, minor_radius=0.28, location=(sx, sy, 0.28 + tz * 0.52))
            t_obj = bpy.context.active_object
            t_obj.data.materials.append(m_tire)

    # 2. Right tire stacks & salvage
    for sx, sy in [(3.2, 3.5), (6.5, 4.0), (8.0, -2.0)]:
        for tz in range(3):
            bpy.ops.mesh.primitive_torus_add(major_radius=0.75, minor_radius=0.28, location=(sx, sy, 0.28 + tz * 0.52))
            t_obj = bpy.context.active_object
            t_obj.data.materials.append(m_tire)

    # Leaning rusted steel sprockets / girders in distance
    for gx, gy, rot in [(-4.5, 6.0, 0.4), (4.8, 6.5, -0.35), (-1.5, 9.0, 0.1)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=1.6, depth=0.15, location=(gx, gy, 1.5))
        g_obj = bpy.context.active_object
        g_obj.rotation_euler = (0, math.radians(72), rot)
        g_obj.data.materials.append(m_rust)

    # Sodium Streetlamp & Area Backlight:
    # Streetlamp post
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=6.5, location=(0.2, 4.2, 3.2))
    bpy.context.active_object.data.materials.append(m_rust)
    # Streetlamp head
    bpy.ops.mesh.primitive_cube_add(size=0.8, location=(0.2, 4.2, 6.2))
    bpy.context.active_object.data.materials.append(m_lamp_glow)

    # AREA Backlight for rich golden puddle reflection
    lamp_data = bpy.data.lights.new('SodiumBacklight', 'AREA')
    lamp_data.shape = 'RECTANGLE'
    lamp_data.size = 3.2
    lamp_data.size_y = 2.2
    lamp_data.energy = 11000.0
    lamp_data.color = (1.0, 0.72, 0.20)
    lamp_obj = bpy.data.objects.new('SodiumBacklight', lamp_data)
    lamp_obj.location = (0.2, 4.0, 2.0)
    lamp_obj.rotation_euler = (math.radians(-65), 0, 0)
    scene.collection.objects.link(lamp_obj)

    # Cool Moonlight Sun Fill
    moon_data = bpy.data.lights.new('MoonLight', 'SUN')
    moon_data.energy = 2.2
    moon_data.color = (0.35, 0.55, 0.85)
    moon_obj = bpy.data.objects.new('MoonLight', moon_data)
    moon_obj.rotation_euler = (math.radians(52), math.radians(-25), math.radians(45))
    scene.collection.objects.link(moon_obj)

    # Front fill kicker for spokes
    kicker_data = bpy.data.lights.new('FrontKicker', 'POINT')
    kicker_data.energy = 600.0
    kicker_data.color = (0.6, 0.75, 1.0)
    kicker_obj = bpy.data.objects.new('FrontKicker', kicker_data)
    kicker_obj.location = (-1.0, -2.0, 0.8)
    scene.collection.objects.link(kicker_obj)

    # Camera
    cam_data = bpy.data.cameras.new("CinemaCamera")
    cam_data.sensor_width = 36
    cam_obj = bpy.data.objects.new("CinemaCamera", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Load Red from Canonical uniracer_model.blend
    print(f"Loading Red from canonical blend: {CANONICAL_BLEND}")
    with bpy.data.libraries.load(CANONICAL_BLEND, link=False) as (data_from, data_to):
        data_to.collections = ["New_Uniracer_Model"]
    
    red_col = data_to.collections[0]
    scene.collection.children.link(red_col)

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
    # SHOT 1 (Frames 1-180, 7.5s): High Bird's-Eye Descent
    # NOTE: Zak's explicit directive: RED MUST NOT BE IN SHOT 1 AT ALL!
    # =========================================================================
    cam.data.lens = 28 # Wide cinematic vista
    cam.data.keyframe_insert(data_path="lens", frame=1)

    # Frame 1: High in the stormy night sky
    cam.location = (0.0, -16.0, 18.0)
    cam.rotation_euler = (math.radians(50), 0, 0)
    cam.keyframe_insert(data_path="location", frame=1)
    cam.keyframe_insert(data_path="rotation_euler", frame=1)

    # Frame 180: Descended toward mid-level scrap yard
    cam.location = (-0.4, -8.0, 7.5)
    cam.rotation_euler = (math.radians(40), 0, math.radians(-5))
    cam.keyframe_insert(data_path="location", frame=180)
    cam.keyframe_insert(data_path="rotation_euler", frame=180)

    # Red is PARKED FAR OFFSTAGE during Shot 1 (invisible!)
    if rig:
        rig.location = (25.0, 0.0, 0.41) # Far offscreen right
        rig.rotation_euler = (0, 0, math.radians(-90))
        rig.keyframe_insert(data_path="location", frame=1)
        rig.keyframe_insert(data_path="location", frame=180)

    # =========================================================================
    # SHOT 2 (Frames 181-360, 7.5s): Worm's-Eye Macro Puddle Art Shot
    # Style: Ground level macro framing (Z = 0.22m, 48mm lens)
    # The star is the golden sodium reflection shimmering across water ripples!
    # =========================================================================
    cam.data.lens = 48 # Macro art lens
    cam.data.keyframe_insert(data_path="lens", frame=181)

    # Camera sitting right at water level looking across the reflective puddle
    cam.location = (0.0, -2.5, 0.22)
    cam.rotation_euler = (math.radians(86), 0, 0)
    cam.keyframe_insert(data_path="location", frame=181)
    cam.keyframe_insert(data_path="rotation_euler", frame=181)

    # Subtle slow dolly/tracking forward as the tire rolls through
    cam.location = (-0.3, -2.35, 0.22)
    cam.rotation_euler = (math.radians(86), 0, math.radians(3))
    cam.keyframe_insert(data_path="location", frame=360)
    cam.keyframe_insert(data_path="rotation_euler", frame=360)

    # Red enters from screen right (X = 2.2) and rolls across puddle to screen left (X = -2.8)
    if rig:
        # F181: Approaching puddle from screen right
        rig.location = (2.2, 0.0, 0.41)
        rig.rotation_euler = (0, 0, math.radians(-90))
        rig.keyframe_insert(data_path="location", frame=181)
        rig.keyframe_insert(data_path="rotation_euler", frame=181)

        # F270: Splashing through the center of the golden reflection puddle
        rig.location = (0.0, 0.0, 0.41)
        rig.rotation_euler = (0, 0, math.radians(-90))
        rig.keyframe_insert(data_path="location", frame=270)
        rig.keyframe_insert(data_path="rotation_euler", frame=270)

        # F360: Exiting puddle on screen left
        rig.location = (-2.8, 0.0, 0.41)
        rig.rotation_euler = (0, 0, math.radians(-90))
        rig.keyframe_insert(data_path="location", frame=360)
        rig.keyframe_insert(data_path="rotation_euler", frame=360)

        # Wheel & Pedal mechanics
        pb_wheel = rig.pose.bones.get("Bone_Wheel")
        pb_crank_l = rig.pose.bones.get("Bone_Crank_L")
        pb_crank_r = rig.pose.bones.get("Bone_Crank_R")
        pb_pedal_l = rig.pose.bones.get("Bone_Pedal_L")
        pb_pedal_r = rig.pose.bones.get("Bone_Pedal_R")

        total_dist = 5.0 # meters traveled
        wheel_radius = 0.41
        total_rot = total_dist / wheel_radius # ~12.2 radians

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
    print("✅ Prologue v2 frames rendered successfully!")

if __name__ == "__main__":
    cam_obj, red_rig = setup_scene()
    animate_prologue(cam_obj, red_rig)
    render_prologue()
