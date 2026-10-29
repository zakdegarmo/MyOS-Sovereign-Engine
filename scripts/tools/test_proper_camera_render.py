import bpy
import math
import os
from mathutils import Vector

def render_calibrated_uniracer():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Load Red from models/uniracer_model.blend
    red_blend = os.path.abspath(r"models/uniracer_model.blend")
    with bpy.data.libraries.load(red_blend, link=False) as (data_from, data_to):
        data_to.collections = ["New_Uniracer_Model"]
    
    col = data_to.collections[0]
    bpy.context.scene.collection.children.link(col)
    
    # Ground Plane
    bpy.ops.mesh.primitive_plane_add(size=120, location=(0, 0, 0))
    ground = bpy.context.active_object
    mat_g = bpy.data.materials.new("Mat_Ground")
    mat_g.use_nodes = True
    ground.data.materials.append(mat_g)
    
    # Position Uniracer properly:
    # Outer radius is 12.5, so placing at Z = 12.5 puts the tire right on the ground!
    rig = next((o for o in col.all_objects if o.type == 'ARMATURE'), None)
    if rig:
        rig.location = (0, 0, 12.5)
        rig.rotation_euler = (0, 0, math.radians(25)) # Slight 3/4 turn
        
        # Give saddle a lively pose
        b_saddle = rig.pose.bones.get("Bone_SaddleHead")
        if b_saddle:
            b_saddle.rotation_euler = (math.radians(-10), 0, math.radians(15))
            
    # Key Light (Warm Rim/Key)
    light_data = bpy.data.lights.new("KeyLight", 'SUN')
    light_data.energy = 4.0
    light_data.color = (1.0, 0.95, 0.85)
    light_obj = bpy.data.objects.new("KeyLight", light_data)
    light_obj.location = (20, -30, 40)
    light_obj.rotation_euler = (math.radians(45), math.radians(15), math.radians(-30))
    bpy.context.scene.collection.objects.link(light_obj)
    
    # Fill Light (Cool Cyan Fill)
    fill_data = bpy.data.lights.new("FillLight", 'SUN')
    fill_data.energy = 1.5
    fill_data.color = (0.4, 0.7, 1.0)
    fill_obj = bpy.data.objects.new("FillLight", fill_data)
    fill_obj.rotation_euler = (math.radians(60), 0, math.radians(150))
    bpy.context.scene.collection.objects.link(fill_obj)
    
    # World
    world = bpy.data.worlds.new("CalibWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.05, 0.08, 0.14, 1.0)
        bg.inputs['Strength'].default_value = 1.0
    bpy.context.scene.world = world

    # CAMERA: Proper distance and wide focal length to frame the full ~35-unit tall unicycle!
    cam_data = bpy.data.cameras.new("CalibCam")
    cam_data.lens = 28
    cam_obj = bpy.data.objects.new("CalibCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    
    cam_pos = Vector((-45.0, -65.0, 24.0)) # 3/4 dynamic perspective
    look_target = Vector((0, 0, 16.0)) # Center of unicycle body/saddle
    cam_obj.location = cam_pos
    cam_obj.rotation_euler = (look_target - cam_pos).to_track_quat('-Z', 'Y').to_euler()
    
    # Render settings
    scene = bpy.context.scene
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.film_transparent = False
    
    output_path = os.path.abspath(r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\calibrated_uniracer_hero.png")
    scene.render.filepath = output_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered calibrated preview to: {output_path}")

if __name__ == "__main__":
    render_calibrated_uniracer()
