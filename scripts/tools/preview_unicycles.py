import bpy
import os
import math

def render_preview(glb_path, out_png):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if not os.path.exists(glb_path):
        print(f"File not found: {glb_path}")
        return
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    if not obs:
        print(f"No meshes in {glb_path}")
        return

    # Select all meshes
    bpy.ops.object.select_all(action='DESELECT')
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]

    # Calculate center and radius
    from mathutils import Vector
    bbox_corners = [o.matrix_world @ Vector(corner) for o in obs for corner in o.bound_box]
    min_x = min(c.x for c in bbox_corners)
    max_x = max(c.x for c in bbox_corners)
    min_y = min(c.y for c in bbox_corners)
    max_y = max(c.y for c in bbox_corners)
    min_z = min(c.z for c in bbox_corners)
    max_z = max(c.z for c in bbox_corners)

    center = Vector(((min_x + max_x) / 2, (min_y + max_y) / 2, (min_z + max_z) / 2))
    size = max(max_x - min_x, max_y - min_y, max_z - min_z)
    print(f"[{os.path.basename(glb_path)}] Center: {center}, Size: {size}")

    cam_data = bpy.data.cameras.new("Cam")
    cam_obj = bpy.data.objects.new("Cam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    
    dist = size * 2.2
    cam_obj.location = center + Vector((dist * 0.7, -dist * 0.9, dist * 0.4))
    cam_obj.rotation_euler = (center - cam_obj.location).to_track_quat('-Z', 'Y').to_euler()

    light_data = bpy.data.lights.new("Sun", 'SUN')
    light_data.energy = 4.0
    light_obj = bpy.data.objects.new("Sun", light_data)
    bpy.context.scene.collection.objects.link(light_obj)
    light_obj.rotation_euler = (math.radians(45), math.radians(20), math.radians(-30))

    bpy.context.scene.render.resolution_x = 640
    bpy.context.scene.render.resolution_y = 480
    bpy.context.scene.render.filepath = out_png
    bpy.context.scene.render.engine = 'BLENDER_EEVEE'
    bpy.ops.render.render(write_still=True)
    print(f"Successfully rendered: {out_png}")

artifact_dir = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e"
render_preview(os.path.abspath("models/cycnet_uninator.glb"), os.path.join(artifact_dir, "preview_cycnet_uninator.png"))
render_preview(os.path.abspath("apps/web/public/assets/models/uni.glb"), os.path.join(artifact_dir, "preview_uni_glb.png"))
render_preview(os.path.abspath("apps/web/public/assets/models/uni_handcrafted_original_v1.glb"), os.path.join(artifact_dir, "preview_uni_handcrafted.png"))
