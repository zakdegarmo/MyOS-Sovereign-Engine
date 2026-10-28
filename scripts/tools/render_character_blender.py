
import bpy
import mathutils
import sys
import os
import math

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def setup_lighting():
    # 1. Front Key Light (Neutral Daylight)
    key_light_data = bpy.data.lights.new(name="KeyLight", type='SUN')
    key_light_data.energy = 4.5
    key_light_data.color = (1.0, 1.0, 1.0)
    key_light = bpy.data.objects.new(name="KeyLight", object_data=key_light_data)
    bpy.context.collection.objects.link(key_light)
    key_light.rotation_euler = (math.radians(50), math.radians(25), math.radians(45))
    
    # 2. Front-Left Fill Light (Soft Neutral Fill)
    fill_light_data = bpy.data.lights.new(name="FillLight", type='SUN')
    fill_light_data.energy = 2.5
    fill_light_data.color = (1.0, 1.0, 1.0)
    fill_light = bpy.data.objects.new(name="FillLight", object_data=fill_light_data)
    bpy.context.collection.objects.link(fill_light)
    fill_light.rotation_euler = (math.radians(35), math.radians(-50), math.radians(-35))
    
    # 3. Rim / Top Light (Sharp crisp silhouette definition)
    rim_light_data = bpy.data.lights.new(name="RimLight", type='SUN')
    rim_light_data.energy = 3.0
    rim_light_data.color = (1.0, 1.0, 1.0)
    rim_light = bpy.data.objects.new(name="RimLight", object_data=rim_light_data)
    bpy.context.collection.objects.link(rim_light)
    rim_light.rotation_euler = (math.radians(-60), math.radians(0), math.radians(180))
    
    # 4. Ambient World Environment Lighting
    if bpy.context.scene.world:
        bpy.context.scene.world.use_nodes = True
        bg = bpy.context.scene.world.node_tree.nodes.get('Background')
        if bg:
            bg.inputs['Color'].default_value = (1.0, 1.0, 1.0, 1.0)
            bg.inputs['Strength'].default_value = 0.5

def setup_camera():
    cam_data = bpy.data.cameras.new("OrthoCam")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 2.5  # Bounding scale for character
    cam = bpy.data.objects.new("OrthoCam", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam

def set_camera_angle(cam, direction_name):
    # Standard 8-directional angles matching 2.5D game viewports:
    # In standard 3D space, Character faces towards -Y (Forward towards player / South) or +Y:
    # Camera at -Y looking towards origin sees character FRONT (South / Facing player) -> yaw = 0 deg
    # Camera at +Y looking towards origin sees character BACK (North / Facing away) -> yaw = 180 deg
    # Camera at +X looking towards origin sees character RIGHT side (East / Facing Right) -> yaw = -90 deg
    # Camera at -X looking towards origin sees character LEFT side (West / Facing Left) -> yaw = 90 deg
    
    angle_map = {
        "South": 0.0,
        "SouthEast": -45.0,
        "East": -90.0,
        "NorthEast": -135.0,
        "North": 180.0,
        "NorthWest": 135.0,
        "West": 90.0,
        "SouthWest": 45.0
    }
    
    yaw_deg = angle_map.get(direction_name, 180.0)
    yaw_rad = math.radians(yaw_deg)
    
    distance = 5.0
    cam.rotation_euler = (math.radians(90), 0, yaw_rad)
    
    # Cam location: camera positioned at (distance * sin(yaw), -distance * cos(yaw))
    # When yaw = 180 deg (South): loc = (0, +distance) -> looks at front of character (+Y face)
    # When yaw = 0 deg (North): loc = (0, -distance) -> looks at back of character (-Y back of head)
    cam.location = (
        distance * math.sin(yaw_rad),
        -distance * math.cos(yaw_rad),
        0.85
    )

def render_character(glb_path, output_dir, char_name, directions=None):
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

    # Assign imported animation action to the Armature
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == 'ARMATURE']
    if armatures and bpy.data.actions:
        arm = armatures[0]
        if not arm.animation_data:
            arm.animation_data_create()
            
        # CRITICAL: Clear all NLA tracks so they do not override the chosen action
        while arm.animation_data.nla_tracks:
            arm.animation_data.nla_tracks.remove(arm.animation_data.nla_tracks[0])
            
        walk_actions = [a for a in bpy.data.actions if 'walk' in a.name.lower()]
        action = walk_actions[0] if walk_actions else bpy.data.actions[0]
        arm.animation_data.action = action
        frame_start = int(action.frame_range[0])
        frame_end = int(action.frame_range[1])
        frame_count = max(1, frame_end - frame_start)
        print(f"Bound Action: '{action.name}' (Frames {frame_start} to {frame_end}) to Armature '{arm.name}' (NLA Tracks Cleared)")
    else:
        frame_start, frame_end, frame_count = 0, 24, 24

    if directions is None:
        directions = ["North", "NorthWest", "West", "SouthWest", "South", "SouthEast", "East", "NorthEast"]
    
    for direction in directions:
        set_camera_angle(cam, direction)
        
        # Render 8 evenly-spaced keyframes across the animation cycle
        for step_idx in range(8):
            frame_num = int(frame_start + (step_idx / 8.0) * frame_count)
            scene.frame_set(frame_num)
            out_file = os.path.join(output_dir, f"{char_name}_walk{direction}_{step_idx + 1:02d}.png")
            scene.render.filepath = out_file
            bpy.ops.render.render(write_still=True)
            print(f"Rendered: {out_file} (Frame {frame_num})")

if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:]
    glb_path = args[0]
    output_dir = args[1]
    char_name = args[2]
    
    os.makedirs(output_dir, exist_ok=True)
    render_character(glb_path, output_dir, char_name)
    
    os.makedirs(output_dir, exist_ok=True)
    render_character(glb_path, output_dir, char_name)
