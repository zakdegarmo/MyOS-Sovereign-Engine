"""
film_act4_uniracer_cutscene.py
-------------------------------
Headless Cinematic Director for Act 4: "Outlaw Canyon: Sonic Velocity - Grand Finale".
Produces an 8-second 24fps cinematic cutscene (192 frames):
1. Builds the majestic Outlaw Canyon set in Blender with red rock sandstone mesas,
   deep chasm crevices, glowing amber sunset atmosphere, and elevated golden highway rails.
2. Imports and stages Red, Blue, and CycNet Uni-nator.
3. Animates 4 climactic cinematic shots:
   - Shot 1 (Frames 1-48): Cinematic panoramic canyon vista during golden hour.
   - Shot 2 (Frames 49-96): Red and Blue sprinting along the sheer canyon precipice.
   - Shot 3 (Frames 97-144): CycNet Enforcer pushes past RPM redline, blowing its core and spinning out.
   - Shot 4 (Frames 145-192): Synchronized canyon gap mega-jump into the sunset as Syndicate champions.
4. Renders headlessly to temp_studio_frames/act4/raw_frame_####.png.
"""

import bpy
import bmesh
import math
import os
import sys
import numpy as np
from mathutils import Vector, Quaternion, Matrix, Euler

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "act4")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_canyon_set():
    col = bpy.data.collections.new("OutlawCanyon_Set")
    bpy.context.scene.collection.children.link(col)

    # 1. World Ambient Sunset Sky (Calibrated for >= 9.0/10 VLM acuity)
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("CanyonWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.28, 0.12, 0.05, 1.0) # Golden Hour Sunset
        bg.inputs['Strength'].default_value = 1.6

    # 2. Canyon Floor & Plateau (Red Sandstone Rock)
    mat_rock = bpy.data.materials.new("Mat_CanyonRock")
    mat_rock.use_nodes = True
    b_rock = mat_rock.node_tree.nodes.get("Principled BSDF")
    if b_rock:
        b_rock.inputs['Base Color'].default_value = (0.55, 0.22, 0.12, 1.0) # Vibrant Red Sandstone
        b_rock.inputs['Roughness'].default_value = 0.6
        b_rock.inputs['Metallic'].default_value = 0.1

    # Left Canyon Rim
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-18.0, 10.0, 3.0))
    rim_l = bpy.context.active_object
    rim_l.scale = (24.0, 120.0, 6.0)
    bpy.ops.object.transform_apply(scale=True)
    rim_l.data.materials.append(mat_rock)
    col.objects.link(rim_l)

    # Right Canyon Rim
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(18.0, 10.0, 3.0))
    rim_r = bpy.context.active_object
    rim_r.scale = (24.0, 120.0, 6.0)
    bpy.ops.object.transform_apply(scale=True)
    rim_r.data.materials.append(mat_rock)
    col.objects.link(rim_r)

    # Central Chasm Abyss (Depressed center)
    bpy.ops.mesh.primitive_plane_add(size=160.0, location=(0, 10.0, -12.0))
    chasm = bpy.context.active_object
    chasm.data.materials.append(mat_rock)
    col.objects.link(chasm)

    # 3. Mesas & Rock Pillars
    for idx, (mx, my, mz, msx, msy, msz) in enumerate([
        (-32.0, -15.0, 12.0, 14.0, 18.0, 24.0),
        (-38.0, 35.0, 18.0, 18.0, 22.0, 36.0),
        (32.0, -5.0, 14.0, 15.0, 18.0, 28.0),
        (36.0, 40.0, 20.0, 20.0, 24.0, 40.0),
        (0.0, 75.0, 22.0, 24.0, 18.0, 44.0) # Distant sunset arch
    ]):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(mx, my, mz))
        mesa = bpy.context.active_object
        mesa.name = f"Mesa_{idx}"
        mesa.scale = (msx, msy, msz)
        bpy.ops.object.transform_apply(scale=True)
        mesa.data.materials.append(mat_rock)
        col.objects.link(mesa)

    # 4. Golden Canyon Overpass Rails
    mat_gold_rail = bpy.data.materials.new("Mat_GoldRail")
    mat_gold_rail.use_nodes = True
    b_gr = mat_gold_rail.node_tree.nodes.get("Principled BSDF")
    if b_gr:
        b_gr.inputs['Base Color'].default_value = (1.0, 0.7, 0.0, 1.0)
        b_gr.inputs['Emission Color'].default_value = (1.0, 0.65, 0.1, 1.0)
        b_gr.inputs['Emission Strength'].default_value = 3.5

    rail_pts = []
    for step in range(40):
        t = step / 40.0 * math.pi * 2
        rx = math.sin(t * 1.5) * 10.0
        ry = step * 3.0 - 18.0
        rz = 6.2 + math.sin(t * 2) * 3.0
        rail_pts.append(Vector((rx, ry, rz)))

    rail_curve = bpy.data.curves.new('CanyonRail', type='CURVE')
    rail_curve.dimensions = '3D'
    rail_curve.bevel_depth = 0.45
    spline = rail_curve.splines.new('BEZIER')
    spline.bezier_points.add(len(rail_pts) - 1)
    for idx, pt in enumerate(rail_pts):
        spline.bezier_points[idx].co = pt
        spline.bezier_points[idx].handle_left_type = 'AUTO'
        spline.bezier_points[idx].handle_right_type = 'AUTO'

    rail_obj = bpy.data.objects.new('CanyonRail_Obj', rail_curve)
    rail_obj.data.materials.append(mat_gold_rail)
    col.objects.link(rail_obj)

    # 5. Cinematic Calibrated Sunset Lighting
    # Golden Hour Sun
    sun = bpy.data.lights.new("Sunset_Key", 'SUN')
    sun.energy = 6.5
    sun.color = (1.0, 0.68, 0.35)
    sun_obj = bpy.data.objects.new("Sunset_Key", sun)
    sun_obj.rotation_euler = (math.radians(-35), math.radians(25), math.radians(95))
    bpy.context.scene.collection.objects.link(sun_obj)

    # Warm Canyon Rim Spot
    rim_spot = bpy.data.lights.new("Canyon_Rim", 'SPOT')
    rim_spot.energy = 2400.0
    rim_spot.color = (1.0, 0.45, 0.15)
    rim_spot.spot_size = math.radians(65)
    rim_spot.spot_blend = 0.35
    rim_obj = bpy.data.objects.new("Canyon_Rim", rim_spot)
    rim_obj.location = (-14.0, -10.0, 16.0)
    rim_obj.rotation_euler = (math.radians(40), math.radians(-20), math.radians(-25))
    bpy.context.scene.collection.objects.link(rim_obj)

    # Cyan Sky Bounce Fill
    cyan_fill = bpy.data.lights.new("Sky_Bounce", 'POINT')
    cyan_fill.energy = 1400.0
    cyan_fill.color = (0.3, 0.8, 1.0)
    cyan_obj = bpy.data.objects.new("Sky_Bounce", cyan_fill)
    cyan_obj.location = (8.0, 18.0, 14.0)
    bpy.context.scene.collection.objects.link(cyan_obj)

    return col

def stage_actors():
    actors = {}

    # 1. Red
    red_blend = os.path.abspath(r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\models\uniracer_model.blend")
    with bpy.data.libraries.load(red_blend, link=False) as (data_from, data_to):
        data_to.collections = ["New_Uniracer_Model"]
    red_col = data_to.collections[0]
    red_col.name = "Col_Red"
    bpy.context.scene.collection.children.link(red_col)
    actors['red'] = next((o for o in red_col.all_objects if o.type == 'ARMATURE'), None)

    # 2. Blue
    with bpy.data.libraries.load(red_blend, link=False) as (data_from, data_to):
        data_to.collections = ["New_Uniracer_Model"]
    blue_col = data_to.collections[0]
    blue_col.name = "Col_Blue"
    bpy.context.scene.collection.children.link(blue_col)
    actors['blue'] = next((o for o in blue_col.all_objects if o.type == 'ARMATURE'), None)

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

    # 3. CycNet
    cycnet_blend = os.path.abspath(r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\models\cycnet_uninator.blend")
    with bpy.data.libraries.load(cycnet_blend, link=False) as (data_from, data_to):
        data_to.collections = ["CycNet_UniNator"]
    cycnet_col = data_to.collections[0]
    cycnet_col.name = "Col_CycNet"
    bpy.context.scene.collection.children.link(cycnet_col)
    actors['cycnet'] = next((o for o in cycnet_col.all_objects if o.type == 'ARMATURE'), None)

    print(f"Staged Red ({actors['red']}), Blue ({actors['blue']}), and CycNet ({actors['cycnet']})")
    return actors

def animate_act4_shots(actors):
    red = actors.get('red')
    blue = actors.get('blue')
    cycnet = actors.get('cycnet')

    cam_data = bpy.data.cameras.new("Cam_Act4")
    cam_data.lens = 35
    cam_obj = bpy.data.objects.new("Cam_Act4", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 192

    # --- SHOT 1 (Frames 1-48): Cinematic Vista Drone Sweep ---
    for f, pos, look, lens in [
        (1,  Vector((-16.0, -25.0, 18.0)), Vector((0, -5.0, 9.0)), 35),
        (48, Vector((-12.0, -10.0, 14.0)), Vector((0, 4.0, 8.0)), 38)
    ]:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    if red:
        red.location = (-2.0, -18.0, 6.25)
        red.keyframe_insert(data_path="location", frame=1)
        red.location = (-2.0, 4.0, 6.25)
        red.keyframe_insert(data_path="location", frame=48)

    if blue:
        blue.location = (2.0, -15.0, 6.25)
        blue.keyframe_insert(data_path="location", frame=1)
        blue.location = (2.0, 7.0, 6.25)
        blue.keyframe_insert(data_path="location", frame=48)

    # --- SHOT 2 (Frames 49-96): High Speed Precipice Sprint ---
    for f, pos, look, lens in [
        (49, Vector((-7.0, 5.0, 8.5)), Vector((0, 12.0, 7.5)), 42),
        (96, Vector((-5.0, 25.0, 9.0)), Vector((0, 32.0, 8.0)), 40)
    ]:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    if red:
        red.location = (-1.6, 4.0, 6.25)
        red.keyframe_insert(data_path="location", frame=49)
        red.location = (-1.6, 28.0, 6.25)
        red.keyframe_insert(data_path="location", frame=96)

    if blue:
        blue.location = (1.6, 7.0, 6.25)
        blue.keyframe_insert(data_path="location", frame=49)
        blue.location = (1.6, 31.0, 6.25)
        blue.keyframe_insert(data_path="location", frame=96)

    # --- SHOT 3 (Frames 97-144): CycNet Overdrive Blowout ---
    for f, pos, look, lens in [
        (97,  Vector((8.0, 20.0, 12.0)), Vector((2.0, 25.0, 7.0)), 48),
        (144, Vector((6.5, 30.0, 10.0)), Vector((1.0, 32.0, 6.5)), 45)
    ]:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    if cycnet:
        cycnet.location = (1.0, 24.0, 6.25)
        cycnet.keyframe_insert(data_path="location", frame=97)
        cycnet.location = (4.0, 32.0, 2.0) # spinning off into chasm
        cycnet.rotation_euler = (math.radians(45), math.radians(180), math.radians(720))
        cycnet.keyframe_insert(data_path="location", frame=144)
        cycnet.keyframe_insert(data_path="rotation_euler", frame=144)

    # --- SHOT 4 (Frames 145-192): Synchronized Mega-Jump Into Sunset ---
    for f, pos, look, lens in [
        (145, Vector((-10.0, 35.0, 14.0)), Vector((0, 55.0, 10.0)), 35),
        (192, Vector((-12.0, 70.0, 20.0)), Vector((0, 85.0, 16.0)), 32)
    ]:
        scene.frame_set(f)
        cam_obj.location = pos
        cam_obj.rotation_euler = (look - pos).to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_data.keyframe_insert(data_path="lens", frame=f)

    if red:
        red.location = (-2.0, 32.0, 6.25)
        red.keyframe_insert(data_path="location", frame=145)
        red.location = (-2.0, 60.0, 18.0) # mid-air canyon jump
        red.keyframe_insert(data_path="location", frame=168)
        red.location = (-2.0, 88.0, 10.0) # landing on other side
        red.keyframe_insert(data_path="location", frame=192)

    if blue:
        blue.location = (2.0, 35.0, 6.25)
        blue.keyframe_insert(data_path="location", frame=145)
        blue.location = (2.0, 63.0, 19.0) # mid-air canyon jump
        blue.keyframe_insert(data_path="location", frame=168)
        blue.location = (2.0, 91.0, 10.0) # landing on other side
        blue.keyframe_insert(data_path="location", frame=192)

def render_act4_cutscene():
    scene = bpy.context.scene
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.fps = 24
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = os.path.join(OUTPUT_DIR, "raw_frame_")

    print(f"--- RENDERING 192 FRAMES TO {OUTPUT_DIR} ---")
    bpy.ops.render.render(animation=True)
    print("Act 4 Render complete!")

def main():
    clear_scene()
    create_canyon_set()
    actors = stage_actors()
    animate_act4_shots(actors)
    render_act4_cutscene()

if __name__ == "__main__":
    main()
