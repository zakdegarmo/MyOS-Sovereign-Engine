import bpy
import math

def transfer_library(target_blend):
    # 1. Clean scene and import UAL1_Standard.glb
    bpy.ops.wm.read_homefile(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=r'apps/web/dist/models/Universal Animation Library[Standard]/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb')

    ual_arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    dummy_mesh = [o for o in bpy.data.objects if o.type == 'MESH'][0]
    bpy.data.objects.remove(dummy_mesh, do_unlink=True)

    # 2. Append Mannequin mesh from mannequin_chibi_basic.blend
    with bpy.data.libraries.load(r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic.blend') as (df, dt):
        dt.objects = ['Mannequin']

    mannequin = dt.objects[0]
    bpy.context.collection.objects.link(mannequin)

    # Center mannequin at origin
    mannequin.location = (0, 0, 0)
    mannequin.rotation_euler = (0, 0, 0)
    mannequin.scale = (1, 1, 1)

    # Ensure clean vertex normals and single Armature modifier
    for mod in list(mannequin.modifiers):
        mannequin.modifiers.remove(mod)

    mannequin.parent = ual_arm
    mod = mannequin.modifiers.new('Armature', 'ARMATURE')
    mod.object = ual_arm

    # Make all actions have fake user so they are permanently preserved
    print("Packing actions with Fake User:")
    for act in bpy.data.actions:
        act.use_fake_user = True
        print(f"  - {act.name}")

    # Set default active action to 'Walk_Loop'
    if 'Walk_Loop' in bpy.data.actions:
        ual_arm.animation_data.action = bpy.data.actions['Walk_Loop']
        bpy.context.scene.frame_start = 0
        bpy.context.scene.frame_end = int(bpy.data.actions['Walk_Loop'].frame_range[1])
        bpy.context.scene.frame_set(0)

    # Setup studio lighting and camera
    cam_data = bpy.data.cameras.new('RenderCam')
    cam_obj = bpy.data.objects.new('RenderCam', cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_obj.location = (0, -3.2, 0.95)
    cam_obj.rotation_euler = (math.radians(85), 0, 0)

    # Key light
    key_data = bpy.data.lights.new('KeyLight', 'SUN')
    key_data.energy = 2.5
    key_obj = bpy.data.objects.new('KeyLight', key_data)
    bpy.context.collection.objects.link(key_obj)
    key_obj.location = (2, -2, 4)

    # Fill light
    fill_data = bpy.data.lights.new('FillLight', 'SUN')
    fill_data.energy = 1.0
    fill_obj = bpy.data.objects.new('FillLight', fill_data)
    bpy.context.collection.objects.link(fill_obj)
    fill_obj.location = (-2, -1, 3)

    # Rim light
    rim_data = bpy.data.lights.new('RimLight', 'SUN')
    rim_data.energy = 1.5
    rim_obj = bpy.data.objects.new('RimLight', rim_data)
    bpy.context.collection.objects.link(rim_obj)
    rim_obj.location = (0, 3, 2)

    # Make Armature active in Pose Mode
    bpy.context.view_layer.objects.active = ual_arm
    ual_arm.select_set(True)

    # Save to target blend
    bpy.ops.wm.save_mainfile(filepath=target_blend)
    print(f"Successfully loaded all {len(bpy.data.actions)} real MoCap animations into {target_blend}!")

if __name__ == '__main__':
    transfer_library(r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic_rigTest1.blend')
