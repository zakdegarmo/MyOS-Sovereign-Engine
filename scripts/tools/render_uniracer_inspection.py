"""
render_uniracer_inspection.py
-----------------------------
Renders multi-angle inspection frames of uniracer_model.blend to verify:
1. Front view: The skinny nose acts as the forward-facing "face" of the unicycle.
2. Side/Perspective view: Pedals attached directly to crank arm ends, horizontal platforms, amber reflectors.
"""

import bpy
import math
import os

def render_previews():
    blend_path = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\uniracer_model.blend"
    artifact_dir = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e"
    os.makedirs(artifact_dir, exist_ok=True)

    # Setup camera and lighting
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'RenderSettings') and 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
    scene.render.resolution_x = 960
    scene.render.resolution_y = 720
    scene.render.film_transparent = False

    # World background
    if not scene.world:
        scene.world = bpy.data.worlds.new("World")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.05, 0.05, 0.07, 1.0)
        bg.inputs['Strength'].default_value = 1.0

    # Ensure lights exist
    for l_name, loc, energy in [
        ("KeyLight", (20, -25, 30), 4000),
        ("FillLight", (-25, -20, 20), 2000),
        ("RimLight", (0, 30, 25), 3500),
    ]:
        light_obj = bpy.data.objects.get(l_name)
        if not light_obj:
            light_data = bpy.data.lights.new(name=l_name, type='POINT')
            light_obj = bpy.data.objects.new(name=l_name, object_data=light_data)
            bpy.context.scene.collection.objects.link(light_obj)
        light_obj.location = loc
        light_obj.data.energy = energy

    # Create aim target
    aim_obj = bpy.data.objects.get("AimTarget")
    if not aim_obj:
        aim_obj = bpy.data.objects.new("AimTarget", None)
        bpy.context.scene.collection.objects.link(aim_obj)
    aim_obj.location = (0, 0, 10)

    cam_obj = bpy.data.objects.get("InspectCam")
    if not cam_obj:
        cam_data = bpy.data.cameras.new(name="InspectCam")
        cam_obj = bpy.data.objects.new(name="InspectCam", object_data=cam_data)
        bpy.context.scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    cam_obj.data.lens = 45

    # Add track constraint
    cam_obj.constraints.clear()
    track = cam_obj.constraints.new(type='TRACK_TO')
    track.target = aim_obj
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'

    # 1. Hero 3/4 Perspective View (Full unicycle framing)
    cam_obj.location = (45, -55, 20)
    bpy.context.view_layer.update()
    out_persp = os.path.join(artifact_dir, "uniracer_repaired_perspective.png")
    scene.render.filepath = out_persp
    bpy.ops.render.render(write_still=True)
    print("Rendered perspective preview to:", out_persp)

    # 2. Front View (Directly in front facing the unicycle)
    cam_obj.location = (0, 45, 10)
    bpy.context.view_layer.update()
    out_front = os.path.join(artifact_dir, "uniracer_repaired_front_face.png")
    scene.render.filepath = out_front
    bpy.ops.render.render(write_still=True)
    print("Rendered front face preview to:", out_front)

    # 3. Side View (Showing crank angles and saddle kick)
    cam_obj.location = (50, 0, 10)
    bpy.context.view_layer.update()
    out_side = os.path.join(artifact_dir, "uniracer_repaired_side_profile.png")
    scene.render.filepath = out_side
    bpy.ops.render.render(write_still=True)
    print("Rendered side profile preview to:", out_side)

    # Copy perspective preview to web app preview asset
    web_preview = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\sprites\uniracer\uniracer_red_preview.png"
    import shutil
    shutil.copy2(out_persp, web_preview)
    print("Copied preview to:", web_preview)

if __name__ == '__main__':
    render_previews()
