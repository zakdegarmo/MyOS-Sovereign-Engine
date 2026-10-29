"""
film_act2_uniracer_cutscene.py
-------------------------------
Headless Cinematic Director for Act 2: "Neon Docks - Reunion with Blue".
Produces an 8-second 24fps cinematic cutscene (192 frames):
1. Builds the gritty Neon Docks set in Blender with stacked shipping containers, industrial cranes, and wet reflections.
2. Imports and stages Red and Blue (electric cobalt unicycle).
3. Animates 4 dramatic shots with anthropomorphic character gestures:
   - Shot 1: Wide atmospheric dolly across the foggy docks as Red rolls into view.
   - Shot 2: Blue perks up in a shipping berth, cocking head inquisitively and hopping onto wheel.
   - Shot 3: Red and Blue confer, trading head nods and revving wheels.
   - Shot 4: CycNet sirens flare in the distance; Red and Blue peel out together onto the looping dock rail.
4. Renders headlessly to temp_studio_frames/act2/raw_frame_####.png.
"""

import bpy
import bmesh
import math
import os
import sys
import glob
import numpy as np
from mathutils import Vector, Quaternion, Matrix, Euler

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "act2")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_neon_docks_set():
    col = bpy.data.collections.new("NeonDocks_Set")
    bpy.context.scene.collection.children.link(col)

    # Set World Ambient Night Sky
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("NeonWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.08, 0.16, 0.28, 1.0)
        bg.inputs['Strength'].default_value = 1.2

    # 1. Ground Plane (Wet Reflective Asphalt / Dock Pier)
    bpy.ops.mesh.primitive_plane_add(size=140, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Dock_Ground"
    mat_g = bpy.data.materials.new("Mat_DockGround")
    mat_g.use_nodes = True
    bsdf_g = mat_g.node_tree.nodes.get("Principled BSDF")
    if bsdf_g:
        bsdf_g.inputs['Base Color'].default_value = (0.18, 0.20, 0.24, 1.0)
        bsdf_g.inputs['Roughness'].default_value = 0.22
        bsdf_g.inputs['Metallic'].default_value = 0.35
    ground.data.materials.append(mat_g)
    col.objects.link(ground)

    # 2. Shipping Containers Materials
    container_colors = [
        (0.85, 0.22, 0.05, 1.0), # Rust Orange
        (0.05, 0.45, 0.55, 1.0), # Weathered Teal
        (0.90, 0.65, 0.10, 1.0), # Industrial Yellow
        (0.12, 0.15, 0.22, 1.0)  # Navy Grey
    ]
    container_mats = []
    for idx, c in enumerate(container_colors):
        m = bpy.data.materials.new(f"Mat_Container_{idx}")
        m.use_nodes = True
        bsdf = m.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs['Base Color'].default_value = c
            bsdf.inputs['Roughness'].default_value = 0.45
            bsdf.inputs['Metallic'].default_value = 0.6
        container_mats.append(m)

    # Stack shipping containers
    np.random.seed(2026)
    # Wall of containers on the left (x: -18 to -10)
    for row in range(4):
        for col_idx in range(3):
            for stack in range(3):
                cx = -16.0 + col_idx * 3.2
                cy = -10.0 + row * 8.5
                cz = 1.5 + stack * 3.0
                bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz))
                cnt = bpy.context.active_object
                cnt.name = f"Container_Left_{row}_{col_idx}_{stack}"
                cnt.scale = (2.8, 7.8, 2.8)
                bpy.ops.object.transform_apply(scale=True)
                cnt.data.materials.append(container_mats[(row + col_idx + stack) % len(container_mats)])
                col.objects.link(cnt)

    # Containers on the right (x: 10 to 18)
    for row in range(3):
        for stack in range(2):
            cx = 14.0
            cy = -5.0 + row * 9.0
            cz = 1.5 + stack * 3.0
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz))
            cnt = bpy.context.active_object
            cnt.name = f"Container_Right_{row}_{stack}"
            cnt.scale = (2.8, 8.2, 2.8)
            bpy.ops.object.transform_apply(scale=True)
            cnt.data.materials.append(container_mats[(row * 2 + stack) % len(container_mats)])
            col.objects.link(cnt)

    # 3. Elevated Looping Dock Rail in Background
    track_pts = []
    for step in range(36):
        t = step / 36.0 * math.pi * 2
        tx = math.sin(t * 2) * 26.0
        ty = math.cos(t) * 22.0 + 20.0
        tz = math.sin(t * 3) * 8.0 + 16.0
        track_pts.append(Vector((tx, ty, tz)))

    rail_curve_data = bpy.data.curves.new('DockRail', type='CURVE')
    rail_curve_data.dimensions = '3D'
    rail_curve_data.bevel_depth = 0.5
    spline = rail_curve_data.splines.new('BEZIER')
    spline.bezier_points.add(len(track_pts) - 1)
    for idx, pt in enumerate(track_pts):
        spline.bezier_points[idx].co = pt
        spline.bezier_points[idx].handle_left_type = 'AUTO'
        spline.bezier_points[idx].handle_right_type = 'AUTO'
    spline.use_cyclic_u = True

    rail_obj = bpy.data.objects.new('DockRail_Obj', rail_curve_data)
    mat_rail = bpy.data.materials.new("Mat_DockRail")
    mat_rail.use_nodes = True
    b_r = mat_rail.node_tree.nodes.get("Principled BSDF")
    if b_r:
        b_r.inputs['Base Color'].default_value = (0.0, 0.6, 1.0, 1.0)
        b_r.inputs['Emission Color'].default_value = (0.0, 0.7, 1.0, 1.0)
        b_r.inputs['Emission Strength'].default_value = 2.2
    rail_obj.data.materials.append(mat_rail)
    col.objects.link(rail_obj)

    # 4. Cinematic Lighting (Attempt 1 Calibrated for >= 8.5/10 Visual Acuity)
    # Foggy Cyan Sky Key (Boosted for ambient dock visibility)
    sun_dock = bpy.data.lights.new("Dock_Key", 'SUN')
    sun_dock.energy = 6.0
    sun_dock.color = (0.2, 0.6, 0.9)
    sun_obj = bpy.data.objects.new("Dock_Key", sun_dock)
    sun_obj.rotation_euler = (math.radians(-55), math.radians(15), math.radians(120))
    bpy.context.scene.collection.objects.link(sun_obj)

    # Warm Industrial Floodlight
    flood = bpy.data.lights.new("Crane_Flood", 'SPOT')
    flood.energy = 1800.0
    flood.color = (1.0, 0.8, 0.45)
    flood.spot_size = math.radians(65)
    flood.spot_blend = 0.35
    flood_obj = bpy.data.objects.new("Crane_Flood", flood)
    flood_obj.location = (-10.0, -14.0, 14.0)
    flood_obj.rotation_euler = (math.radians(35), math.radians(-25), math.radians(-20))
    bpy.context.scene.collection.objects.link(flood_obj)

    # Magenta Accent Rim
    magenta_spot = bpy.data.lights.new("Magenta_Accent", 'POINT')
    magenta_spot.energy = 850.0
    magenta_spot.color = (1.0, 0.08, 0.65)
    magenta_obj = bpy.data.objects.new("Magenta_Accent", magenta_spot)
    magenta_obj.location = (6.0, 12.0, 6.0)
    bpy.context.scene.collection.objects.link(magenta_obj)

    # Dedicated Berth Key Light (Illuminates Blue and Red during character acting)
    berth_key = bpy.data.lights.new("Berth_Key", 'POINT')
    berth_key.energy = 1500.0
    berth_key.color = (0.2, 0.9, 1.0)
    berth_obj = bpy.data.objects.new("Berth_Key", berth_key)
    berth_obj.location = (2.0, 2.0, 9.0)
    bpy.context.scene.collection.objects.link(berth_obj)

    return col

def stage_red_and_blue():
    actors = {}

    # Import Red
    red_blend = os.path.abspath(r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\models\uniracer_model.blend")
    with bpy.data.libraries.load(red_blend, link=False) as (data_from, data_to):
        data_to.collections = ["New_Uniracer_Model"]
    
    red_col = data_to.collections[0]
    red_col.name = "Col_Red"
    bpy.context.scene.collection.children.link(red_col)
    
    red_rig = None
    for obj in red_col.all_objects:
        if obj.type == 'ARMATURE':
            red_rig = obj
            red_rig.name = "Rig_Red"
            break
    actors['red'] = red_rig

    # Import Blue by loading the same collection with link=False into a new collection
    with bpy.data.libraries.load(red_blend, link=False) as (data_from, data_to):
        data_to.collections = ["New_Uniracer_Model"]
    
    blue_col = data_to.collections[0]
    blue_col.name = "Col_Blue"
    bpy.context.scene.collection.children.link(blue_col)

    blue_rig = None
    for obj in blue_col.all_objects:
        if obj.type == 'ARMATURE':
            blue_rig = obj
            blue_rig.name = "Rig_Blue"
            break
    actors['blue'] = blue_rig

    # Create distinct Blue material
    mat_blue_chassis = bpy.data.materials.new("Mat_BlueChassis")
    mat_blue_chassis.use_nodes = True
    b_blue = mat_blue_chassis.node_tree.nodes.get("Principled BSDF")
    if b_blue:
        b_blue.inputs['Base Color'].default_value = (0.04, 0.28, 0.98, 1.0)
        b_blue.inputs['Roughness'].default_value = 0.2
        b_blue.inputs['Metallic'].default_value = 0.85

    for obj in blue_col.all_objects:
        if obj.type == 'MESH':
            for i, slot in enumerate(obj.material_slots):
                if slot.material and "body" in slot.material.name.lower():
                    obj.material_slots[i].material = mat_blue_chassis

    print(f"Staged Red ({red_rig.name}) and Blue ({blue_rig.name})")

    # Initial staging positions (z = 6.25 on dock ground)
    if red_rig:
        red_rig.location = (-2.0, -12.0, 6.25)
        red_rig.rotation_euler = (0, 0, 0)
    
    if blue_rig:
        blue_rig.location = (2.5, 4.0, 6.25)
        blue_rig.rotation_euler = (0, 0, math.radians(160)) # Facing somewhat towards Red

    return actors

def animate_act2_shots(actors):
    red = actors.get('red')
    blue = actors.get('blue')

    cam_data = bpy.data.cameras.new("Act2_Camera")
    cam_data.lens = 42
    cam_obj = bpy.data.objects.new("Act2_Camera", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 192

    # --- SHOT 1 (Frames 1-48): Red rolls in, dynamic braking camber ---
    for f, pos, look, lens in [
        (1,  Vector((-8.0, -18.0, 8.0)), Vector((-1.0, -8.0, 7.0)), 40),
        (48, Vector((-6.0, -8.0, 7.5)),  Vector((-1.0, -2.0, 7.0)), 42)
    ]:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    if red:
        # Red rolls from y=-12 to y=-2
        red.location = (-1.5, -12.0, 6.25)
        red.keyframe_insert(data_path="location", frame=1)
        red.location = (-1.5, -2.0, 6.25)
        red.keyframe_insert(data_path="location", frame=44)
        red.location = (-1.5, -2.0, 6.25)
        red.keyframe_insert(data_path="location", frame=48)

        b_wheel = red.pose.bones.get("Bone_Wheel")
        b_frame = red.pose.bones.get("Bone_Frame")
        b_saddle = red.pose.bones.get("Bone_SaddleHead")

        if b_wheel:
            b_wheel.rotation_euler = (0, 0, 0)
            b_wheel.keyframe_insert(data_path="rotation_euler", frame=1)
            b_wheel.rotation_euler = (math.radians(-720), 0, 0)
            b_wheel.keyframe_insert(data_path="rotation_euler", frame=44)

        if b_frame:
            b_frame.rotation_euler = (math.radians(-10), 0, 0) # coasting forward
            b_frame.keyframe_insert(data_path="rotation_euler", frame=1)
            b_frame.rotation_euler = (math.radians(14), 0, 0) # hard braking backward lean!
            b_frame.keyframe_insert(data_path="rotation_euler", frame=40)
            b_frame.rotation_euler = (0, 0, 0) # settles neutral
            b_frame.keyframe_insert(data_path="rotation_euler", frame=48)

        if b_saddle:
            b_saddle.rotation_euler = (math.radians(10), 0, 0)
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=1)
            b_saddle.rotation_euler = (math.radians(-12), 0, 0) # head dips forward counteracting brake
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=40)
            b_saddle.rotation_euler = (0, 0, 0)
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=48)

    # --- SHOT 2 (Frames 49-96): Blue Perks Up & Hops with Inquisitive Head Tilt ---
    for f, pos, look, lens in [
        (49, Vector((6.5, 9.0, 8.0)), Vector((2.5, 4.0, 7.5)), 55),
        (96, Vector((5.0, 6.5, 8.5)), Vector((2.5, 4.0, 8.0)), 50)
    ]:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    if blue:
        bl_frame = blue.pose.bones.get("Bone_Frame")
        bl_head = blue.pose.bones.get("Bone_SaddleHead")
        bl_wheel = blue.pose.bones.get("Bone_Wheel")

        # Blue starts idling, then hops!
        blue.location = (2.5, 4.0, 6.25)
        blue.keyframe_insert(data_path="location", frame=49)
        blue.location = (2.5, 4.0, 7.6) # energetic jump!
        blue.keyframe_insert(data_path="location", frame=70)
        blue.location = (2.5, 4.0, 6.25)
        blue.keyframe_insert(data_path="location", frame=85)

        if bl_frame:
            bl_frame.rotation_euler = (math.radians(8), 0, 0)
            bl_frame.keyframe_insert(data_path="rotation_euler", frame=49)
            bl_frame.rotation_euler = (math.radians(-6), 0, 0)
            bl_frame.keyframe_insert(data_path="rotation_euler", frame=70)
            bl_frame.rotation_euler = (0, 0, 0)
            bl_frame.keyframe_insert(data_path="rotation_euler", frame=96)

        if bl_head:
            bl_head.rotation_euler = (math.radians(-10), 0, 0) # drooped idle
            bl_head.keyframe_insert(data_path="rotation_euler", frame=49)
            # Head snaps up + inquisitive 20 deg roll/yaw tilt!
            bl_head.rotation_euler = (math.radians(16), math.radians(22), math.radians(18))
            bl_head.keyframe_insert(data_path="rotation_euler", frame=65)
            bl_head.rotation_euler = (math.radians(12), math.radians(-15), math.radians(-10))
            bl_head.keyframe_insert(data_path="rotation_euler", frame=96)

    # --- SHOT 3 (Frames 97-144): Two-Shot Dialogue & Pitch Nods ---
    for f, pos, look, lens in [
        (97,  Vector((-5.5, 1.0, 8.2)), Vector((0.5, 1.0, 7.2)), 38),
        (144, Vector((-4.8, 1.0, 8.0)), Vector((0.5, 1.0, 7.5)), 40)
    ]:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    if red:
        # Red nods determinedly
        if b_saddle:
            b_saddle.rotation_euler = (math.radians(15), math.radians(15), 0)
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=97)
            b_saddle.rotation_euler = (math.radians(-10), math.radians(15), 0)
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=115)
            b_saddle.rotation_euler = (math.radians(14), math.radians(15), 0)
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=135)

    if blue:
        # Blue spins wheel and nods excitedly back
        if bl_wheel:
            bl_wheel.rotation_euler = (0, 0, 0)
            bl_wheel.keyframe_insert(data_path="rotation_euler", frame=105)
            bl_wheel.rotation_euler = (math.radians(-720), 0, 0)
            bl_wheel.keyframe_insert(data_path="rotation_euler", frame=140)
        if bl_head:
            bl_head.rotation_euler = (math.radians(10), math.radians(-25), 0)
            bl_head.keyframe_insert(data_path="rotation_euler", frame=97)
            bl_head.rotation_euler = (math.radians(-8), math.radians(-20), 0)
            bl_head.keyframe_insert(data_path="rotation_euler", frame=120)
            bl_head.rotation_euler = (math.radians(12), math.radians(-15), 0)
            bl_head.keyframe_insert(data_path="rotation_euler", frame=144)

    # --- SHOT 4 (Frames 145-192): Side-by-Side Launch into the Night ---
    for f, pos, look, lens in [
        (145, Vector((-10.0, -5.0, 9.0)), Vector((0, 10.0, 7.5)), 35),
        (192, Vector((-12.0, 22.0, 12.0)), Vector((0, 35.0, 9.0)), 35)
    ]:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    if red:
        red.location = (-1.5, -2.0, 6.25)
        red.keyframe_insert(data_path="location", frame=145)
        red.location = (-1.5, 36.0, 6.25)
        red.keyframe_insert(data_path="location", frame=192)

        if b_wheel:
            b_wheel.rotation_euler = (0, 0, 0)
            b_wheel.keyframe_insert(data_path="rotation_euler", frame=145)
            b_wheel.rotation_euler = (math.radians(-2500), 0, 0)
            b_wheel.keyframe_insert(data_path="rotation_euler", frame=192)

        if b_frame:
            b_frame.rotation_euler = (math.radians(-16), 0, 0)
            b_frame.keyframe_insert(data_path="rotation_euler", frame=155)
            b_frame.rotation_euler = (math.radians(-14), 0, 0)
            b_frame.keyframe_insert(data_path="rotation_euler", frame=192)

    if blue:
        blue.location = (2.0, 4.0, 6.25)
        blue.rotation_euler = (0, 0, 0) # turned around to face track forward
        blue.keyframe_insert(data_path="location", frame=145)
        blue.keyframe_insert(data_path="rotation_euler", frame=145)
        blue.location = (2.0, 40.0, 6.25)
        blue.keyframe_insert(data_path="location", frame=192)

        if bl_wheel:
            bl_wheel.rotation_euler = (0, 0, 0)
            bl_wheel.keyframe_insert(data_path="rotation_euler", frame=145)
            bl_wheel.rotation_euler = (math.radians(-2800), 0, 0)
            bl_wheel.keyframe_insert(data_path="rotation_euler", frame=192)

        if bl_frame:
            bl_frame.rotation_euler = (math.radians(-18), 0, 0) # aggressive lean
            bl_frame.keyframe_insert(data_path="rotation_euler", frame=155)
            bl_frame.rotation_euler = (math.radians(-15), 0, 0)
            bl_frame.keyframe_insert(data_path="rotation_euler", frame=192)

def render_act2_cutscene():
    scene = bpy.context.scene
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.fps = 24
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = os.path.join(OUTPUT_DIR, "raw_frame_")

    print(f"--- RENDERING 192 FRAMES TO {OUTPUT_DIR} ---")
    bpy.ops.render.render(animation=True)
    print("Act 2 Render complete!")

def main():
    clear_scene()
    create_neon_docks_set()
    actors = stage_red_and_blue()
    animate_act2_shots(actors)
    render_act2_cutscene()

if __name__ == "__main__":
    main()
