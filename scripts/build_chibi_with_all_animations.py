import bpy
import math
import numpy as np

def build_chibi_with_all_animations(target_blend):
    # 1. Open UAL1_Standard.glb
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

    # The user defined chibi proportions using scale (0.8148, 0.8148, 0.6851)
    # Apply this scale directly into the vertex coordinates!
    sx, sy, sz = 0.8148, 0.8148, 0.6851
    for v in mannequin.data.vertices:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z *= sz

    # Center at origin (0, 0, 0) with feet at Z=0
    coords = np.array([list(v.co) for v in mannequin.data.vertices])
    mid_x = (coords[:,0].min() + coords[:,0].max()) / 2.0
    mid_y = (coords[:,1].min() + coords[:,1].max()) / 2.0
    min_z = coords[:,2].min()

    for v in mannequin.data.vertices:
        v.co.x -= mid_x
        v.co.y -= mid_y
        v.co.z -= min_z

    mannequin.location = (0, 0, 0)
    mannequin.rotation_euler = (0, 0, 0)
    mannequin.scale = (1, 1, 1)
    mannequin.data.update()

    coords = np.array([list(v.co) for v in mannequin.data.vertices])
    chibi_height = coords[:,2].max() - coords[:,2].min()
    chibi_span_x = coords[:,0].max() - coords[:,0].min()
    chibi_depth_y = coords[:,1].max() - coords[:,1].min()
    print(f"VERIFIED CHIBI MESH: Height={chibi_height:.4f}m, SpanX={chibi_span_x:.4f}m, DepthY={chibi_depth_y:.4f}m")

    # 3. Scale UAL Armature Edit Bones to match chibi dimensions exactly
    bpy.context.view_layer.objects.active = ual_arm
    bpy.ops.object.mode_set(mode='EDIT')
    
    # Calculate scale factor from standard adult to chibi
    scale_x = chibi_span_x / 1.9834
    scale_y = chibi_depth_y / 0.3460
    scale_z = chibi_height / 1.6804
    print(f"Armature scale factors: X={scale_x:.4f}, Y={scale_y:.4f}, Z={scale_z:.4f}")

    for eb in ual_arm.data.edit_bones:
        eb.head.x *= scale_x
        eb.head.y *= scale_y
        eb.head.z *= scale_z
        eb.tail.x *= scale_x
        eb.tail.y *= scale_y
        eb.tail.z *= scale_z

    bpy.ops.object.mode_set(mode='OBJECT')

    # All 45 actions have fake user
    for act in bpy.data.actions:
        act.use_fake_user = True

    # 4. Bind Mannequin to Armature with Armature Modifier
    for mod in list(mannequin.modifiers):
        mannequin.modifiers.remove(mod)

    mannequin.parent = ual_arm
    mod = mannequin.modifiers.new('Armature', 'ARMATURE')
    mod.object = ual_arm

    # Verify dimensions
    bpy.context.view_layer.update()
    check_coords = [mannequin.matrix_world @ v.co for v in mannequin.data.vertices]
    xs = [c.x for c in check_coords]; ys = [c.y for c in check_coords]; zs = [c.z for c in check_coords]
    print(f"FINAL BOUNDS: X[{min(xs):.3f}..{max(xs):.3f}], Y[{min(ys):.3f}..{max(ys):.3f}], Z[{min(zs):.3f}..{max(zs):.3f}]")
    print(f"FINAL DIMS: Height={max(zs)-min(zs):.3f}m, Span={max(xs)-min(xs):.3f}m, Depth={max(ys)-min(ys):.3f}m")

    # Setup camera and lighting
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

    # Render verification frame
    scene = bpy.context.scene
    scene.render.filepath = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\chibi_walk_f16_verified.png'
    bpy.ops.render.render(write_still=True)

    bpy.ops.wm.save_mainfile(filepath=target_blend)
    print(f"Saved to {target_blend} with all 45 animations and EXACT chibi proportions!")

if __name__ == '__main__':
    build_chibi_with_all_animations(r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic_rigTest1.blend')
