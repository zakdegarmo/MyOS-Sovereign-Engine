import bpy
import glob
import os

files = glob.glob('apps/web/public/models/meshy ai glb/**/*.glb', recursive=True)
for f in sorted(files):
    if 'texture' in f or 'Character_output' in f:
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.gltf(filepath=f)
        armatures = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
        if not armatures:
            continue
        arm = armatures[0]
        print(f"\n==================================================")
        print(f"FILE: {os.path.basename(f)}")
        print(f"==================================================")
        for act in bpy.data.actions:
            r = act.frame_range
            print(f"  - Action: {act.name:25} | Frames: {r[0]:.1f} to {r[1]:.1f} (Duration: {r[1]-r[0]:.1f})")
    except Exception as e:
        print(f"Error {f}: {e}")
