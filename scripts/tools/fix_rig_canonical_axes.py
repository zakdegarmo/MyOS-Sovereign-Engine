"""
fix_rig_canonical_axes.py
-------------------------
Aligns all bones in Uniracer_Rig to have canonical Z-up rest orientations:
1. Bone_SaddleHead:
   head=(0, 0, 20.0), tail=(0, 0, 24.0), roll=0.
   Shares exact orientation with Bone_Frame -> Identity relative rotation!
2. Bone_Pedal_L:
   head=(-3.1, -4.3841, -4.3841), tail=(-3.1, -4.3841, 1.6159), roll=0.
   Shares exact Z-up orientation -> X-axis is pure horizontal rotation!
3. Bone_Pedal_R:
   head=(3.1, 4.3841, 4.3841), tail=(3.1, 4.3841, 10.3841), roll=0.
   Shares exact Z-up orientation -> X-axis is pure horizontal rotation!
4. Re-parents UniracerSaddle, pedal spindles, platforms, reflectors preserving horizontal rest orientation.
"""

import bpy
import math
import mathutils

def run():
    blend_path = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\uniracer_model.blend"
    out_glb = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\uniracer_hero.glb"

    arm = bpy.data.objects.get('Uniracer_Rig')
    coll = bpy.data.collections.get('New_Uniracer_Model')

    # 1. Reset all pose bones
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    for pb in arm.pose.bones:
        pb.matrix_basis.identity()
    bpy.ops.object.mode_set(mode='OBJECT')

    # 2. Unparent objects that we will re-bind, keeping world transforms
    objects_to_rebind = [
        'UniracerSaddle',
        'PedalSpindle_-1', 'PedalPlatform_-1', 'Reflector_-1_-1', 'Reflector_-1_1',
        'PedalSpindle_1', 'PedalPlatform_1', 'Reflector_1_-1', 'Reflector_1_1'
    ]
    world_matrices = {}
    for name in objects_to_rebind:
        obj = bpy.data.objects.get(name)
        if obj:
            world_matrices[name] = obj.matrix_world.copy()
            obj.parent = None
            obj.matrix_world = world_matrices[name]

    # 3. Update Edit Bones
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones

    # Bone_Frame: (0,0,0) to (0,0,20)
    eb['Bone_Frame'].head = (0.0, 0.0, 0.0)
    eb['Bone_Frame'].tail = (0.0, 0.0, 20.0)
    eb['Bone_Frame'].roll = 0.0

    # Bone_SaddleHead: (0,0,20) to (0,0,24) (straight UP!)
    eb['Bone_SaddleHead'].head = (0.0, 0.0, 20.0)
    eb['Bone_SaddleHead'].tail = (0.0, 0.0, 24.0)
    eb['Bone_SaddleHead'].roll = 0.0

    # Bone_Pedal_L: straight UP from crank tip!
    eb['Bone_Pedal_L'].head = (-3.1, -4.3841, -4.3841)
    eb['Bone_Pedal_L'].tail = (-3.1, -4.3841, 1.6159)
    eb['Bone_Pedal_L'].roll = 0.0

    # Bone_Pedal_R: straight UP from crank tip!
    eb['Bone_Pedal_R'].head = (3.1, 4.3841, 4.3841)
    eb['Bone_Pedal_R'].tail = (3.1, 4.3841, 10.3841)
    eb['Bone_Pedal_R'].roll = 0.0

    bpy.ops.object.mode_set(mode='OBJECT')
    print("Edit bones updated to canonical vertical orientations.")

    # 4. Re-parent objects preserving world transforms
    def bind_object_to_bone(obj_name, bone_name):
        obj = bpy.data.objects.get(obj_name)
        if not obj:
            return
        obj.matrix_world = world_matrices[obj_name]
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        arm.select_set(True)
        bpy.context.view_layer.objects.active = arm
        arm.data.bones.active = arm.data.bones[bone_name]
        bpy.ops.object.parent_set(type='BONE')
        print(f"Parented {obj_name} to {bone_name}")

    bind_object_to_bone('UniracerSaddle', 'Bone_SaddleHead')

    for name in ['PedalSpindle_-1', 'PedalPlatform_-1', 'Reflector_-1_-1', 'Reflector_-1_1']:
        bind_object_to_bone(name, 'Bone_Pedal_L')

    for name in ['PedalSpindle_1', 'PedalPlatform_1', 'Reflector_1_-1', 'Reflector_1_1']:
        bind_object_to_bone(name, 'Bone_Pedal_R')

    bpy.context.view_layer.update()

    bpy.ops.wm.save_mainfile()
    print("Saved uniracer_model.blend!")

    # 5. Export GLB
    bpy.ops.object.select_all(action='DESELECT')
    for obj in coll.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = arm

    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        use_selection=True,
        export_format='GLB',
        export_apply=False,
        export_yup=True,
        export_materials='EXPORT',
        export_armature_object_remove=False
    )
    print("Exported uniracer_hero.glb successfully!")

if __name__ == '__main__':
    run()
