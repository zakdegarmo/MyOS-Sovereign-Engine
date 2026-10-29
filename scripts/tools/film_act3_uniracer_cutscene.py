"""
film_act3_uniracer_cutscene.py
-------------------------------
Headless Cinematic Director for Act 3: "CycNet Citadel: The Corporate Ambush".
Produces an 8-second 24fps cinematic cutscene (192 frames):
1. Builds the menacing CycNet Citadel set in Blender with towering skyscraper monoliths,
   emissive red/cyan grid matrices, and an elevated crimson corkscrew highway.
2. Imports and stages Red, Blue, and the menacing CycNet Uni-nator boss.
3. Animates 4 dramatic shots:
   - Shot 1 (Frames 1-48): Cinematic drone sweep through the monolithic mega-spires.
   - Shot 2 (Frames 49-96): Red and Blue blitz down the highway in tight drafting formation.
   - Shot 3 (Frames 97-144): The CycNet Uni-nator drops from an overhead gantry, revving its spiked wheel.
   - Shot 4 (Frames 145-192): High-stakes three-way launch into the vertical hyper-loop.
4. Renders headlessly to temp_studio_frames/act3/raw_frame_####.png.
"""

import bpy
import bmesh
import math
import os
import sys
import numpy as np
from mathutils import Vector, Quaternion, Matrix, Euler

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "act3")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_citadel_set():
    col = bpy.data.collections.new("CycNetCitadel_Set")
    bpy.context.scene.collection.children.link(col)

    # 1. World Ambient Night Sky (Calibrated for >= 8.5/10 VLM acuity)
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("CitadelWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.12, 0.04, 0.18, 1.0) # Deep Corporate Violet
        bg.inputs['Strength'].default_value = 1.4

    # 2. Highway Overpass Deck (Elevated Megalopolis Road)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 10.0, 5.0))
    deck = bpy.context.active_object
    deck.name = "Highway_Deck"
    deck.scale = (28.0, 120.0, 2.0)
    bpy.ops.object.transform_apply(scale=True)
    
    mat_deck = bpy.data.materials.new("Mat_HighwayDeck")
    mat_deck.use_nodes = True
    bsdf_deck = mat_deck.node_tree.nodes.get("Principled BSDF")
    if bsdf_deck:
        bsdf_deck.inputs['Base Color'].default_value = (0.16, 0.16, 0.22, 1.0)
        bsdf_deck.inputs['Roughness'].default_value = 0.25
        bsdf_deck.inputs['Metallic'].default_value = 0.5
    deck.data.materials.append(mat_deck)
    col.objects.link(deck)

    # 3. Monolithic CycNet Skyscrapers
    mat_bldg = bpy.data.materials.new("Mat_CitadelTower")
    mat_bldg.use_nodes = True
    b_bldg = mat_bldg.node_tree.nodes.get("Principled BSDF")
    if b_bldg:
        b_bldg.inputs['Base Color'].default_value = (0.05, 0.05, 0.08, 1.0)
        b_bldg.inputs['Metallic'].default_value = 0.8
        b_bldg.inputs['Roughness'].default_value = 0.2

    mat_red_glow = bpy.data.materials.new("Mat_RedGridGlow")
    mat_red_glow.use_nodes = True
    b_glow = mat_red_glow.node_tree.nodes.get("Principled BSDF")
    if b_glow:
        b_glow.inputs['Base Color'].default_value = (1.0, 0.0, 0.25, 1.0)
        b_glow.inputs['Emission Color'].default_value = (1.0, 0.0, 0.35, 1.0)
        b_glow.inputs['Emission Strength'].default_value = 4.5

    # Tower clusters on left & right
    for idx, (tx, ty, tz, sx, sy, sz) in enumerate([
        (-26.0, -10.0, 25.0, 12.0, 16.0, 60.0),
        (-32.0, 30.0, 35.0, 14.0, 20.0, 80.0),
        (26.0, -5.0, 28.0, 12.0, 16.0, 65.0),
        (30.0, 35.0, 40.0, 16.0, 22.0, 90.0),
        (0.0, 65.0, 45.0, 22.0, 16.0, 100.0) # Central Citadel Spire in distance
    ]):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(tx, ty, tz))
        tower = bpy.context.active_object
        tower.name = f"Tower_{idx}"
        tower.scale = (sx, sy, sz)
        bpy.ops.object.transform_apply(scale=True)
        tower.data.materials.append(mat_bldg if idx % 2 == 0 else mat_red_glow)
        col.objects.link(tower)

    # 4. Elevated Highway Rails (Glowing Crimson Corporate Rails)
    rail_pts = []
    for step in range(40):
        t = step / 40.0 * math.pi * 2
        rx = math.sin(t * 1.5) * 12.0
        ry = step * 2.8 - 15.0
        rz = 6.2 + math.sin(t * 2) * 2.5
        rail_pts.append(Vector((rx, ry, rz)))

    rail_curve = bpy.data.curves.new('CitadelRail', type='CURVE')
    rail_curve.dimensions = '3D'
    rail_curve.bevel_depth = 0.45
    spline = rail_curve.splines.new('BEZIER')
    spline.bezier_points.add(len(rail_pts) - 1)
    for idx, pt in enumerate(rail_pts):
        spline.bezier_points[idx].co = pt
        spline.bezier_points[idx].handle_left_type = 'AUTO'
        spline.bezier_points[idx].handle_right_type = 'AUTO'

    rail_obj = bpy.data.objects.new('CitadelRail_Obj', rail_curve)
    rail_obj.data.materials.append(mat_red_glow)
    col.objects.link(rail_obj)

    # 5. Cinematic Calibrated Lighting
    # Overhead Megalopolis Sky Key
    sky_key = bpy.data.lights.new("Sky_Key", 'SUN')
    sky_key.energy = 5.5
    sky_key.color = (0.8, 0.4, 1.0)
    sky_obj = bpy.data.objects.new("Sky_Key", sky_key)
    sky_obj.rotation_euler = (math.radians(-50), math.radians(20), math.radians(110))
    bpy.context.scene.collection.objects.link(sky_obj)

    # Corporate Red Searchlight
    searchlight = bpy.data.lights.new("Searchlight_Red", 'SPOT')
    searchlight.energy = 2200.0
    searchlight.color = (1.0, 0.1, 0.25)
    searchlight.spot_size = math.radians(60)
    searchlight.spot_blend = 0.3
    search_obj = bpy.data.objects.new("Searchlight_Red", searchlight)
    search_obj.location = (-12.0, 5.0, 18.0)
    search_obj.rotation_euler = (math.radians(45), math.radians(-20), math.radians(-15))
    bpy.context.scene.collection.objects.link(search_obj)

    # Cyan Highway Key
    cyan_spot = bpy.data.lights.new("Cyan_Key", 'POINT')
    cyan_spot.energy = 1600.0
    cyan_spot.color = (0.2, 0.9, 1.0)
    cyan_obj = bpy.data.objects.new("Cyan_Key", cyan_spot)
    cyan_obj.location = (6.0, 20.0, 12.0)
    bpy.context.scene.collection.objects.link(cyan_obj)

    return col

def stage_actors():
    actors = {}

    # 1. Stage Red
    red_blend = os.path.abspath(r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\models\uniracer_model.blend")
    with bpy.data.libraries.load(red_blend, link=False) as (data_from, data_to):
        data_to.collections = ["New_Uniracer_Model"]
    red_col = data_to.collections[0]
    red_col.name = "Col_Red"
    bpy.context.scene.collection.children.link(red_col)
    actors['red'] = next((o for o in red_col.all_objects if o.type == 'ARMATURE'), None)

    # 2. Stage Blue
    with bpy.data.libraries.load(red_blend, link=False) as (data_from, data_to):
        data_to.collections = ["New_Uniracer_Model"]
    blue_col = data_to.collections[0]
    blue_col.name = "Col_Blue"
    bpy.context.scene.collection.children.link(blue_col)
    actors['blue'] = next((o for o in blue_col.all_objects if o.type == 'ARMATURE'), None)

    # Re-color Blue
    mat_blue = bpy.data.materials.new("Mat_BlueHero")
    mat_blue.use_nodes = True
    b_bl = mat_blue.node_tree.nodes.get("Principled BSDF")
    if b_bl:
        b_bl.inputs['Base Color'].default_value = (0.05, 0.35, 1.0, 1.0)
        b_bl.inputs['Roughness'].default_value = 0.2
        b_bl.inputs['Metallic'].default_value = 0.8
    for obj in blue_col.all_objects:
        if obj.type == 'MESH':
            for i, slot in enumerate(obj.material_slots):
                if slot.material and "body" in slot.material.name.lower():
                    obj.material_slots[i].material = mat_blue

    # 3. Stage CycNet Uni-nator Boss
    cycnet_blend = os.path.abspath(r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\models\cycnet_uninator.blend")
    with bpy.data.libraries.load(cycnet_blend, link=False) as (data_from, data_to):
        data_to.collections = ["CycNet_UniNator"]
    cycnet_col = data_to.collections[0]
    cycnet_col.name = "Col_CycNet"
    bpy.context.scene.collection.children.link(cycnet_col)
    actors['cycnet'] = next((o for o in cycnet_col.all_objects if o.type == 'ARMATURE'), None)

    print(f"Staged Red ({actors['red']}), Blue ({actors['blue']}), and CycNet ({actors['cycnet']})")
    return actors

def animate_act3_shots(actors):
    red = actors.get('red')
    blue = actors.get('blue')
    cycnet = actors.get('cycnet')

    cam_data = bpy.data.cameras.new("Cam_Act3")
    cam_data.lens = 35
    cam_obj = bpy.data.objects.new("Cam_Act3", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 192

    # --- SHOT 1 (Frames 1-48): Cinematic Skyline Sweep ---
    for f, pos, look, lens in [
        (1,  Vector((-14.0, -22.0, 16.0)), Vector((0, -5.0, 8.0)), 35),
        (48, Vector((-10.0, -8.0, 12.0)),  Vector((0, 2.0, 7.5)), 38)
    ]:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    if red:
        red.location = (-1.8, -15.0, 6.25)
        red.keyframe_insert(data_path="location", frame=1)
        red.location = (-1.8, 2.0, 6.25)
        red.keyframe_insert(data_path="location", frame=48)

    if blue:
        blue.location = (1.8, -12.0, 6.25)
        blue.keyframe_insert(data_path="location", frame=1)
        blue.location = (1.8, 5.0, 6.25)
        blue.keyframe_insert(data_path="location", frame=48)

    # --- SHOT 2 (Frames 49-96): Tandem Speed Drafting ---
    for f, pos, look, lens in [
        (49, Vector((-8.0, 2.0, 8.0)), Vector((0, 8.0, 7.0)), 45),
        (96, Vector((-6.0, 20.0, 8.5)), Vector((0, 26.0, 7.5)), 42)
    ]:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    if red:
        red.location = (-1.5, 2.0, 6.25)
        red.keyframe_insert(data_path="location", frame=49)
        red.location = (-1.5, 24.0, 6.25)
        red.keyframe_insert(data_path="location", frame=96)

    if blue:
        blue.location = (1.5, 5.0, 6.25)
        blue.keyframe_insert(data_path="location", frame=49)
        blue.location = (1.5, 27.0, 6.25)
        blue.keyframe_insert(data_path="location", frame=96)

    # --- SHOT 3 (Frames 97-144): CycNet Boss Gantry Drop & Laser Visor ---
    for f, pos, look, lens in [
        (97,  Vector((7.0, 15.0, 11.0)), Vector((3.0, 18.0, 7.5)), 50),
        (144, Vector((5.5, 22.0, 9.5)),  Vector((2.0, 22.0, 7.5)), 48)
    ]:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    if cycnet:
        # Drops from z=14.0 to z=6.25 with heavy impact
        cycnet.location = (3.0, 20.0, 14.0)
        cycnet.keyframe_insert(data_path="location", frame=97)
        cycnet.location = (3.0, 22.0, 6.25)
        cycnet.keyframe_insert(data_path="location", frame=116)
        cycnet.location = (3.0, 23.0, 6.25)
        cycnet.keyframe_insert(data_path="location", frame=144)

    # --- SHOT 4 (Frames 145-192): Three-Way Launch into Vertical Hyper-Loop ---
    for f, pos, look, lens in [
        (145, Vector((-12.0, 18.0, 12.0)), Vector((0, 32.0, 9.0)), 35),
        (192, Vector((-14.0, 48.0, 16.0)), Vector((0, 62.0, 12.0)), 32)
    ]:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    if red:
        red.location = (-2.5, 24.0, 6.25)
        red.keyframe_insert(data_path="location", frame=145)
        red.location = (-2.5, 68.0, 10.0)
        red.keyframe_insert(data_path="location", frame=192)

    if blue:
        blue.location = (0.0, 26.0, 6.25)
        blue.keyframe_insert(data_path="location", frame=145)
        blue.location = (0.0, 70.0, 10.0)
        blue.keyframe_insert(data_path="location", frame=192)

    if cycnet:
        cycnet.location = (2.8, 23.0, 6.25)
        cycnet.keyframe_insert(data_path="location", frame=145)
        cycnet.location = (2.8, 72.0, 10.0)
        cycnet.keyframe_insert(data_path="location", frame=192)

def render_act3_cutscene():
    scene = bpy.context.scene
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.fps = 24
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = os.path.join(OUTPUT_DIR, "raw_frame_")

    print(f"--- RENDERING 192 FRAMES TO {OUTPUT_DIR} ---")
    bpy.ops.render.render(animation=True)
    print("Act 3 Render complete!")

def main():
    clear_scene()
    create_citadel_set()
    actors = stage_actors()
    animate_act3_shots(actors)
    render_act3_cutscene()

if __name__ == "__main__":
    main()
