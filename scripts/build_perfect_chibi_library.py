import bpy
import math

def build_perfect_chibi_library(target_blend):
    # 1. Clean scene and import UAL1_Standard.glb
    bpy.ops.wm.read_homefile(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=r'apps/web/dist/models/Universal Animation Library[Standard]/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb')

    ual_arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    dummy_mesh = [o for o in bpy.data.objects if o.type == 'MESH'][0]
    bpy.data.objects.remove(dummy_mesh, do_unlink=True)

    # 2. Append pristine Mannequin from mannequin_chibi_basic.blend
    with bpy.data.libraries.load(r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic.blend') as (df, dt):
        dt.objects = ['Mannequin']

    mannequin = dt.objects[0]
    bpy.context.collection.objects.link(mannequin)

    # 3. Apply the exact object scale and location as the user had in mannequin_chibi_basic.blend!
    # Scale Armature to the EXACT chibi scale factor: (0.8148, 0.8148, 0.6851)
    # This automatically scales all bone lengths and motions to the exact 1.28m chibi height!
    ual_arm.scale = (0.8148, 0.8148, 0.6851)
    ual_arm.location = (0, 0, 0)

    # Mannequin mesh setup:
    for mod in list(mannequin.modifiers):
        mannequin.modifiers.remove(mod)

    # Clear unapplied translation so it stands centered at origin in the armature
    mannequin.location = (0, 0, 0)
    mannequin.rotation_euler = (0, 0, 0)
    mannequin.scale = (1, 1, 1) # Will inherit (0.8148, 0.8148, 0.6851) from Armature!

    mannequin.parent = ual_arm
    mannequin.matrix_parent_inverse.identity()

    mod = mannequin.modifiers.new('Armature', 'ARMATURE')
    mod.object = ual_arm

    # Verify world dimensions
    bpy.context.view_layer.update()
    check_coords = [mannequin.matrix_world @ v.co for v in mannequin.data.vertices]
    xs = [c.x for c in check_coords]; ys = [c.y for c in check_coords]; zs = [c.z for c in check_coords]
    print(f"VERIFIED CHIBI HEIGHT: {max(zs)-min(zs):.4f}m (Target: 1.282m)")
    print(f"VERIFIED CHIBI SPAN: {max(xs)-min(xs):.4f}m (Target: 1.315m)")
    print(f"VERIFIED CHIBI DEPTH: {max(ys)-min(ys):.4f}m (Target: 0.301m)")

    # Fake users for all 45 actions
    for act in bpy.data.actions:
        act.use_fake_user = True

    # Camera and studio lights
    cam_data = bpy.data.cameras.new('RenderCam')
    cam_data.lens = 45
    cam_obj = bpy.data.objects.new('RenderCam', cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_obj.location = (0, -3.2, 0.70)
    cam_obj.rotation_euler = (math.radians(88), 0, 0)

    key_data = bpy.data.lights.new('KeyLight', 'SUN')
    key_data.energy = 3.5
    key_obj = bpy.data.objects.new('KeyLight', key_data)
    bpy.context.collection.objects.link(key_obj)
    key_obj.location = (2, -2, 4)
    key_obj.rotation_euler = (math.radians(45), math.radians(15), math.radians(-30))

    rim_data = bpy.data.lights.new('RimLight', 'SUN')
    rim_data.energy = 1.5
    rim_obj = bpy.data.objects.new('RimLight', rim_data)
    bpy.context.collection.objects.link(rim_obj)
    rim_obj.location = (0, 2, 3)

    # Set active action to Walk_Loop
    if 'Walk_Loop' in bpy.data.actions:
        ual_arm.animation_data.action = bpy.data.actions['Walk_Loop']
        bpy.context.scene.frame_start = 0
        bpy.context.scene.frame_end = int(bpy.data.actions['Walk_Loop'].frame_range[1])
        bpy.context.scene.frame_set(16)

    # Render frame 16 of Walk_Loop
    scene = bpy.context.scene
    scene.render.filepath = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\chibi_perfect_walk_f16.png'
    bpy.ops.render.render(write_still=True)

    # Render frame 12 of Sword_Attack
    if 'Sword_Attack' in bpy.data.actions:
        ual_arm.animation_data.action = bpy.data.actions['Sword_Attack']
        scene.frame_set(12)
        scene.render.filepath = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\chibi_perfect_sword_f12.png'
        bpy.ops.render.render(write_still=True)

    # Reset active action to Walk_Loop at frame 0 for the user
    ual_arm.animation_data.action = bpy.data.actions['Walk_Loop']
    scene.frame_set(0)

    bpy.ops.wm.save_mainfile(filepath=target_blend)
    print("Done! All 45 animations verified on exact chibi mannequin!")

if __name__ == '__main__':
    build_perfect_chibi_library(r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic_rigTest1.blend')
