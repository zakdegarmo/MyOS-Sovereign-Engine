# scripts/tools/film_prologue_v3.py
"""
film_prologue_v3.py
-------------------
Renders the polished 2-shot 15-second Prologue Opening (360 frames @ 24fps):
  - Shot 1 (Frames 1-180, 7.5s): High atmospheric crane descent over moonlit scrap yard.
                                 Red is 100% OFF-CAMERA (parked at X = 25m).
  - Shot 2 (Frames 181-360, 7.5s): Worm's-eye macro puddle art shot (Z = 0.33m, 40mm lens).
                                  - Candy Red frame applied to fork legs, crown, and dropouts!
                                  - Forward wheel rotation (+ang) matching -X movement!
                                  - Balanced 4800W golden amber area backlight (no clipping).
                                  - Real liquid ripple waves on puddle surface.
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
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "prologue_v3")
CANONICAL_BLEND = os.path.join(WORKSPACE_ROOT, "uniracer_model.blend")

os.makedirs(OUTPUT_DIR, exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def build_puddle_street_material(ripple_obj=None):
    mat = bpy.data.materials.new(name="PuddleStreetMaterial")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    nodes.clear()

    node_out = nodes.new('ShaderNodeOutputMaterial')
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    node_texcoord = nodes.new('ShaderNodeTexCoord')
    if ripple_obj:
        node_texcoord.object = ripple_obj

    # Puddle radial gradient mask in World/Object space
    node_world_coord = nodes.new('ShaderNodeTexCoord')
    node_puddle_map = nodes.new('ShaderNodeMapping')
    node_puddle_map.inputs['Scale'].default_value = (0.7, 1.3, 1.0)
    links.new(node_world_coord.outputs['Object'], node_puddle_map.inputs['Vector'])

    node_grad = nodes.new('ShaderNodeTexGradient')
    node_grad.gradient_type = 'SPHERICAL'
    links.new(node_puddle_map.outputs['Vector'], node_grad.inputs['Vector'])

    node_ramp = nodes.new('ShaderNodeValToRGB')
    node_ramp.color_ramp.interpolation = 'EASE'
    node_ramp.color_ramp.elements[0].position = 0.30
    node_ramp.color_ramp.elements[0].color = (1, 1, 1, 1) # Pure water mirror
    node_ramp.color_ramp.elements[1].position = 0.60
    node_ramp.color_ramp.elements[1].color = (0, 0, 0, 1) # Asphalt
    links.new(node_grad.outputs['Fac'], node_ramp.inputs['Fac'])

    # Roughness mapping: 0.35 wet asphalt -> 0.005 mirror puddle
    node_map_rough = nodes.new('ShaderNodeMapRange')
    node_map_rough.inputs['From Min'].default_value = 0.0
    node_map_rough.inputs['From Max'].default_value = 1.0
    node_map_rough.inputs['To Min'].default_value = 0.35
    node_map_rough.inputs['To Max'].default_value = 0.005
    links.new(node_ramp.outputs['Color'], node_map_rough.inputs['Value'])
    links.new(node_map_rough.outputs['Result'], node_bsdf.inputs['Roughness'])

    # Concentric ripple waves centered on tire contact
    node_wave = nodes.new('ShaderNodeTexWave')
    node_wave.wave_type = 'RINGS'
    node_wave.rings_direction = 'SPHERICAL'
    node_wave.inputs['Scale'].default_value = 10.0
    node_wave.inputs['Distortion'].default_value = 3.5
    node_wave.inputs['Detail'].default_value = 2.0
    node_wave.inputs['Phase Offset'].default_value = 2.5
    links.new(node_texcoord.outputs['Object'], node_wave.inputs['Vector'])

    # Ambient surface noise for organic water tension
    node_noise = nodes.new('ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 22.0
    node_noise.inputs['Detail'].default_value = 3.0
    links.new(node_world_coord.outputs['Object'], node_noise.inputs['Vector'])

    # Add wave + noise
    node_add_wave = nodes.new('ShaderNodeMath')
    node_add_wave.operation = 'ADD'
    links.new(node_noise.outputs['Fac'], node_add_wave.inputs[0])
    links.new(node_wave.outputs['Color'], node_add_wave.inputs[1])

    # Bump normal
    node_bump = nodes.new('ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.22 # Crisp, liquid water ripples
    node_bump.inputs['Distance'].default_value = 0.04
    links.new(node_add_wave.outputs['Value'], node_bump.inputs['Height'])
    links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])

    # BSDF settings
    node_bsdf.inputs['Base Color'].default_value = (0.02, 0.025, 0.03, 1.0)
    node_bsdf.inputs['Metallic'].default_value = 0.85
    node_bsdf.inputs['IOR'].default_value = 1.333
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    return mat, node_wave

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
    scene.view_settings.exposure = 0.45

    # World: Deep night atmosphere
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.012, 0.015, 0.025, 1.0)
        bg.inputs[1].default_value = 0.35

    # Dynamic Ripple Tracker Empty
    ripple_empty = bpy.data.objects.new("RippleCenter", None)
    ripple_empty.empty_display_type = 'SPHERE'
    ripple_empty.empty_display_size = 0.25
    ripple_empty.location = (0.0, 0.0, 0.0)
    scene.collection.objects.link(ripple_empty)

    # Materials
    m_ground, node_wave = build_puddle_street_material(ripple_empty)
    m_rust = create_simple_mat("RustedScrap", (0.22, 0.12, 0.08, 1.0), roughness=0.85, metalness=0.25)
    m_tire = create_simple_mat("ScrapTires", (0.05, 0.06, 0.07, 1.0), roughness=0.92)
    m_lamp_glow = create_simple_mat("SodiumGlow", (1.0, 0.72, 0.20, 1.0), roughness=0.1,
                                    emission=(1.0, 0.70, 0.18, 1.0), emission_strength=20.0)

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

    # Streetlamp post
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=6.5, location=(0.2, 4.2, 3.2))
    bpy.context.active_object.data.materials.append(m_rust)
    # Streetlamp head
    bpy.ops.mesh.primitive_cube_add(size=0.8, location=(0.2, 4.2, 6.2))
    bpy.context.active_object.data.materials.append(m_lamp_glow)

    # Balanced Area Backlight (warm amber 4800W, no white clipping!)
    lamp_data = bpy.data.lights.new('SodiumBacklight', 'AREA')
    lamp_data.shape = 'ELLIPSE'
    lamp_data.size = 3.5
    lamp_data.size_y = 2.2
    lamp_data.energy = 4800.0
    lamp_data.color = (1.0, 0.68, 0.18)
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

    # Front fill kicker for spokes and frame
    kicker_data = bpy.data.lights.new('FrontKicker', 'POINT')
    kicker_data.energy = 800.0
    kicker_data.color = (0.7, 0.80, 1.0)
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

    # Ensure Red's Frame is CANDY RED!
    mat_body = bpy.data.materials.get("Mat_Body")
    frame_object_names = [
        "ForkLeg_1", "ForkLeg_-1", "ForkCrown", 
        "Dropout_1", "Dropout_-1", "SeatClamp"
    ]
    for obj in red_col.all_objects:
        if obj.name in frame_object_names and mat_body:
            obj.data.materials.clear()
            obj.data.materials.append(mat_body)
            print(f"Applied candy red Mat_Body to {obj.name}!")

    red_rig = None
    for obj in red_col.all_objects:
        if obj.type == 'ARMATURE':
            red_rig = obj
            break

    if red_rig:
        scale_fac = 0.034
        red_rig.scale = (scale_fac, scale_fac, scale_fac)
        print("Scaled Red armature cleanly to 0.034")

    return cam_obj, red_rig, ripple_empty, node_wave

def animate_prologue(cam_obj, red_rig, ripple_empty, node_wave):
    cam = cam_obj
    rig = red_rig

    # =========================================================================
    # SHOT 1 (Frames 1-180, 7.5s): High Bird's-Eye Descent
    # NOTE: RED MUST NOT BE IN SHOT 1 AT ALL!
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
    # Style: Ground level macro framing (Z = 0.33m, 40mm lens, tilt 83 deg)
    # Framed to highlight the candy red frame, chrome spokes, and golden ripples!
    # =========================================================================
    cam.data.lens = 40
    cam.data.keyframe_insert(data_path="lens", frame=181)

    # Camera sitting at water level looking across the reflective puddle
    cam.location = (0.0, -2.6, 0.33)
    cam.rotation_euler = (math.radians(83), 0, 0)
    cam.keyframe_insert(data_path="location", frame=181)
    cam.keyframe_insert(data_path="rotation_euler", frame=181)

    # Subtle slow dolly/tracking forward as the tire rolls through
    cam.location = (-0.3, -2.45, 0.33)
    cam.rotation_euler = (math.radians(83), 0, math.radians(2.5))
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

        # Wheel & Pedal mechanics + Dynamic Ripple Tracking
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
            # Wheel and cranks roll FORWARD (+ang) towards -X!
            if pb_wheel:
                pb_wheel.rotation_mode = 'XYZ'
                pb_wheel.rotation_euler = (ang, 0, 0)
                pb_wheel.keyframe_insert(data_path="rotation_euler", frame=f)
            if pb_crank_l:
                pb_crank_l.rotation_mode = 'XYZ'
                pb_crank_l.rotation_euler = (ang, 0, 0)
                pb_crank_l.keyframe_insert(data_path="rotation_euler", frame=f)
            if pb_crank_r:
                pb_crank_r.rotation_mode = 'XYZ'
                pb_crank_r.rotation_euler = (ang, 0, 0)
                pb_crank_r.keyframe_insert(data_path="rotation_euler", frame=f)
            # Counter-rotate pedals (-ang) so platforms stay level!
            if pb_pedal_l:
                pb_pedal_l.rotation_mode = 'XYZ'
                pb_pedal_l.rotation_euler = (-ang, 0, 0)
                pb_pedal_l.keyframe_insert(data_path="rotation_euler", frame=f)
            if pb_pedal_r:
                pb_pedal_r.rotation_mode = 'XYZ'
                pb_pedal_r.rotation_euler = (-ang, 0, 0)
                pb_pedal_r.keyframe_insert(data_path="rotation_euler", frame=f)

            # Dynamic Liquid Water Ripples centered on tire contact point
            x_contact = 2.2 - t * 5.0
            if ripple_empty:
                ripple_empty.location = (x_contact, 0.0, 0.0)
                ripple_empty.keyframe_insert(data_path="location", frame=f)
            if node_wave:
                wave_phase = 2.5 + t * 36.0
                node_wave.inputs['Phase Offset'].default_value = wave_phase
                node_wave.inputs['Phase Offset'].keyframe_insert(data_path="default_value", frame=f)

def render_prologue(frame_list=None):
    scene = bpy.context.scene
    frames_to_render = frame_list if frame_list else list(range(scene.frame_start, scene.frame_end + 1))
    total_frames = len(frames_to_render)
    print(f"🎬 Starting render of Prologue v3 ({total_frames} frames) to {OUTPUT_DIR}...")
    for idx, f in enumerate(frames_to_render, 1):
        scene.frame_set(f)
        scene.render.filepath = os.path.join(OUTPUT_DIR, f"frame_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
        if idx % 30 == 0 or idx == total_frames:
            pct = (idx / float(total_frames)) * 100.0
            print(f"  Rendered Frame {f} [{idx}/{total_frames}] ({pct:.1f}%)")
    print("✅ Prologue v3 frames rendered successfully!")

if __name__ == "__main__":
    cam_obj, red_rig, ripple_empty, node_wave = setup_scene()
    animate_prologue(cam_obj, red_rig, ripple_empty, node_wave)
    
    target_frames = None
    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1:]
        for i, arg in enumerate(args):
            if arg == "--frames" and i + 1 < len(args):
                target_frames = [int(x.strip()) for x in args[i + 1].split(",") if x.strip()]
            elif arg == "--test-shots":
                target_frames = [90, 240, 270, 320]
                
    render_prologue(frame_list=target_frames)
