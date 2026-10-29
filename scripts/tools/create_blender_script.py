import sys
import os
import math
import argparse

# Check if running inside Blender
try:
    import bpy
    import mathutils
    IN_BLENDER = True
except ImportError:
    IN_BLENDER = False

BLENDER_SCRIPT_TEMPLATE = """
import bpy
import mathutils
import sys
import os
import math

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def setup_lighting():
    # Key light
    key_light_data = bpy.data.lights.new(name="KeyLight", type='SUN')
    key_light_data.energy = 3.0
    key_light = bpy.data.objects.new(name="KeyLight", object_data=key_light_data)
    bpy.context.collection.objects.link(key_light)
    key_light.rotation_euler = (math.radians(45), math.radians(30), math.radians(45))
    
    # Fill light
    fill_light_data = bpy.data.lights.new(name="FillLight", type='SUN')
    fill_light_data.energy = 1.5
    fill_light = bpy.data.objects.new(name="FillLight", object_data=fill_light_data)
    bpy.context.collection.objects.link(fill_light)
    fill_light.rotation_euler = (math.radians(30), math.radians(-45), math.radians(-30))

def setup_camera():
    cam_data = bpy.data.cameras.new("OrthoCam")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 2.5  # Bounding scale for character
    cam = bpy.data.objects.new("OrthoCam", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam

def set_camera_angle(cam, direction_name):
    # Standard 4-directional cardinal angles
    angles = {
        "South": (math.radians(90), 0, 0),                       # Facing Camera
        "North": (math.radians(90), 0, math.radians(180)),        # Facing Away
        "West":  (math.radians(90), 0, math.radians(-90)),       # Facing Left
        "East":  (math.radians(90), 0, math.radians(90))         # Facing Right
    }
    
    distance = 5.0
    rot = angles[direction_name]
    cam.rotation_euler = rot
    
    # Position camera based on rotation vector
    if direction_name == "South":
        cam.location = (0, -distance, 1.0)
    elif direction_name == "North":
        cam.location = (0, distance, 1.0)
    elif direction_name == "West":
        cam.location = (-distance, 0, 1.0)
    elif direction_name == "East":
        cam.location = (distance, 0, 1.0)

def render_character(glb_path, output_dir, char_name):
    clean_scene()
    setup_lighting()
    cam = setup_camera()
    
    # Configure Render Engine for 100% Transparent RGBA Output
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'BLENDER_EEVEE_NEXT') else 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256
    
    # Import GLB / GLTF 3D Character Model
    if os.path.exists(glb_path):
        bpy.ops.import_scene.gltf(filepath=glb_path)
    else:
        print(f"Error: Model not found at {glb_path}")
        return

    directions = ["North", "West", "South", "East"]
    
    # Check for animation actions
    actions = [a.name for a in bpy.data.actions] if bpy.data.actions else ["walk"]
    
    for direction in directions:
        set_camera_angle(cam, direction)
        
        # Render 8 keyframes per direction
        for frame in range(1, 9):
            scene.frame_set(frame * 3) # Sample keyframe interval
            out_file = os.path.join(output_dir, f"{char_name}_walk{direction}_{frame:02d}.png")
            scene.render.filepath = out_file
            bpy.ops.render.render(write_still=True)
            print(f"Rendered: {out_file}")

if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:]
    glb_path = args[0]
    output_dir = args[1]
    char_name = args[2]
    
    os.makedirs(output_dir, exist_ok=True)
    render_character(glb_path, output_dir, char_name)
"""

def main():
    print("Writing Blender headless automation script to scripts/tools/render_character_blender.py...")
    with open("scripts/tools/render_character_blender.py", "w") as f:
        f.write(BLENDER_SCRIPT_TEMPLATE)
    print("SUCCESS! Headless Blender renderer script created.")

if __name__ == "__main__":
    main()
