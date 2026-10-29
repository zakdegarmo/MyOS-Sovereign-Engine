"""
render_uniracer_8dir_sprites.py
--------------------------------
Renders 8 canonical directions (S, SE, E, NE, N, NW, W, SW) of the new 3D Uniracer
model into crisp 128x128 True HD frames and compiles an 8-direction spritesheet
for Sprite Lab and MyOS avatar / environmental integration.
"""

import bpy
import math
import os
import shutil

def render_8dir_sprites():
    print("=== Rendering 8-Directional Uniracer Sprites ===")
    
    # 1. Clear scene & run build script to get the unicycle in pristine state
    import importlib.util
    build_script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "build_uniracer_model.py"))
    spec = importlib.util.spec_from_file_location("build_uniracer_model", build_script_path)
    build_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build_mod)

    # Call main setup from build script without re-exporting
    build_mod.clear_scene()
    mats = build_mod.create_materials()
    build_mod.build_wheel_and_tire(mats)
    build_mod.build_fork_and_frame(mats)
    build_mod.build_cranks_and_pedals(mats)
    build_mod.build_uniracer_saddle(mats)
    build_mod.setup_studio_lighting()

    output_dir = os.path.abspath(r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\sprites\uniracer")
    brain_dir = os.path.abspath(r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e")
    os.makedirs(output_dir, exist_ok=True)

    # Setup Orthographic / Isometric Camera
    cam_data = bpy.data.cameras.new(name="SpriteCam")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 32.0 # Fits 25-unit unicycle with comfortable margin
    cam_obj = bpy.data.objects.new("SpriteCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # Render settings: 128x128 transparent PNG
    scene = bpy.context.scene
    scene.render.resolution_x = 128
    scene.render.resolution_y = 128
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'

    # Camera target at center of unicycle (0, 0, 11)
    target = bpy.data.objects.new("CamTarget", None)
    target.location = (0, 0, 11)
    scene.collection.objects.link(target)
    
    constraint = cam_obj.constraints.new(type='TRACK_TO')
    constraint.track_axis = 'TRACK_NEGATIVE_Z'
    constraint.up_axis = 'UP_Y'
    constraint.target = target

    # 8 Canonical Directions:
    # 0: South (Front, 0 deg)
    # 1: South-East (45 deg)
    # 2: East (Right Side Profile, 90 deg)
    # 3: North-East (135 deg)
    # 4: North (Back, 180 deg)
    # 5: North-West (225 deg)
    # 6: West (Left Side Profile, 270 deg)
    # 7: South-West (315 deg)
    # 8 Canonical Directions in exact eightWayDirRows order:
    # 0: South (Front, 0 deg)
    # 1: South-West (DL, 45 deg)
    # 2: West (Left Side Profile, 90 deg)
    # 3: North-West (UL, 135 deg)
    # 4: North (Back, 180 deg)
    # 5: North-East (UR, 225 deg)
    # 6: East (Right Side Profile, 270 deg)
    # 7: South-East (DR, 315 deg)
    directions = [
        ("south", 0),
        ("southwest", 45),
        ("west", 90),
        ("northwest", 135),
        ("north", 180),
        ("northeast", 225),
        ("east", 270),
        ("southeast", 315)
    ]

    elevation_angle = math.radians(28) # 2.5D / isometric pitch down
    cam_distance = 60.0

    rendered_files = []

    for name, deg in directions:
        rad = math.radians(deg)
        # Orbit in XY plane, elevated along Z
        # When deg = 0 (South), camera is at -Y looking +Y towards front of unicycle
        cam_x = cam_distance * math.sin(rad) * math.cos(elevation_angle)
        cam_y = -cam_distance * math.cos(rad) * math.cos(elevation_angle)
        cam_z = 11.0 + cam_distance * math.sin(elevation_angle)
        
        cam_obj.location = (cam_x, cam_y, cam_z)
        bpy.context.view_layer.update()

        frame_path = os.path.join(output_dir, f"uniracer_{name}.png")
        scene.render.filepath = frame_path
        bpy.ops.render.render(write_still=True)
        rendered_files.append(frame_path)
        print(f"Rendered: {frame_path}")

    # Compile 8-direction horizontal filmstrip (1024 x 128)
    try:
        from PIL import Image
        strip = Image.new("RGBA", (128 * len(rendered_files), 128), (0, 0, 0, 0))
        for idx, fpath in enumerate(rendered_files):
            img = Image.open(fpath)
            strip.paste(img, (idx * 128, 0))
        
        sheet_path = os.path.join(output_dir, "uniracer_8dir_sheet.png")
        strip.save(sheet_path)
        print(f"Saved 8-Direction Spritesheet to: {sheet_path}")

        # Also copy preview to brain
        brain_sheet = os.path.join(brain_dir, "uniracer_8dir_sheet.png")
        strip.save(brain_sheet)
        print(f"Copied spritesheet preview to brain: {brain_sheet}")
    except Exception as e:
        print(f"PIL sheet compilation note: {e}")

    print("=== 8-Directional Sprite Rendering Complete! ===")

if __name__ == "__main__":
    render_8dir_sprites()
