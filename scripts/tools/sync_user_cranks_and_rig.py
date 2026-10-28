"""
sync_user_cranks_and_rig.py
---------------------------
Preserves the user's manual placement of the crank arms (CrankArm_-1 and CrankArm_1),
aligns Bone_Crank_L and Bone_Crank_R exactly along the crank arms from axle to pedal,
and exports the definitive uniracer_hero.glb.
"""

import bpy
import mathutils

def run():
    blend_path = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\uniracer_model.blend"
    out_glb = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\uniracer_hero.glb"

    arm = bpy.data.objects.get('Uniracer_Rig')
    coll = bpy.data.collections.get('New_Uniracer_Model')

    # 1. Reset all pose bones to identity
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    for pb in arm.pose.bones:
        pb.matrix_basis.identity()
    bpy.ops.object.mode_set(mode='OBJECT')

    # 2. Record the exact world matrices of all parts
    c_l = bpy.data.objects.get('CrankArm_-1')
    c_r = bpy.data.objects.get('CrankArm_1')
    mw_crank_l = c_l.matrix_world.copy()
    mw_crank_r = c_r.matrix_world.copy()

    # Unparent everything temporarily, preserving world transforms
    all_rebind = [
        'CrankArm_-1', 'CrankArm_1',
        'PedalSpindle_-1', 'PedalPlatform_-1', 'Reflector_-1_-1', 'Reflector_-1_1',
        'PedalSpindle_1', 'PedalPlatform_1', 'Reflector_1_-1', 'Reflector_1_1',
        'UniracerSaddle'
    ]
    world_matrices = {}
    for name in all_rebind:
        obj = bpy.data.objects.get(name)
        if obj:
            world_matrices[name] = obj.matrix_world.copy()
            obj.parent = None
            obj.matrix_world = world_matrices[name]

    # 3. Update Edit Bones to connect axle (0, 0) to pedal ends (+-4.3841, +-4.3841)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones

    # Wheel
    eb['Bone_Wheel'].head = (0.0, 0.0, 0.0)
    eb['Bone_Wheel'].tail = (0.0, 0.0, 6.0)
    eb['Bone_Wheel'].roll = 0.0

    # Left Crank & Pedal (points down and back to -4.3841, -4.3841)
    eb['Bone_Crank_L'].head = (-3.1, 0.0, 0.0)
    eb['Bone_Crank_L'].tail = (-3.1, -4.3841, -4.3841)
    eb['Bone_Crank_L'].roll = 0.0

    eb['Bone_Pedal_L'].head = (-3.1, -4.3841, -4.3841)
    eb['Bone_Pedal_L'].tail = (-5.5, -4.3841, -4.3841)
    eb['Bone_Pedal_L'].roll = 0.0

    # Right Crank & Pedal (points up and forward to +4.3841, +4.3841)
    eb['Bone_Crank_R'].head = (3.1, 0.0, 0.0)
    eb['Bone_Crank_R'].tail = (3.1, 4.3841, 4.3841)
    eb['Bone_Crank_R'].roll = 0.0

    eb['Bone_Pedal_R'].head = (3.1, 4.3841, 4.3841)
    eb['Bone_Pedal_R'].tail = (5.5, 4.3841, 4.3841)
    eb['Bone_Pedal_R'].roll = 0.0

    # Frame & Saddle Head
    eb['Bone_Frame'].head = (0.0, 0.0, 0.0)
    eb['Bone_Frame'].tail = (0.0, 0.0, 20.0)
    eb['Bone_Frame'].roll = 0.0

    eb['Bone_SaddleHead'].head = (0.0, 0.0, 20.0)
    eb['Bone_SaddleHead'].tail = (0.0, 0.0, 24.0)
    eb['Bone_SaddleHead'].roll = 0.0

    bpy.ops.object.mode_set(mode='OBJECT')

    # 4. Re-parent all parts cleanly using parent_set(type='BONE')
    def bind_to_bone(obj_name, bone_name):
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

    bind_to_bone('CrankArm_-1', 'Bone_Crank_L')
    bind_to_bone('CrankArm_1', 'Bone_Crank_R')

    for name in ['PedalSpindle_-1', 'PedalPlatform_-1', 'Reflector_-1_-1', 'Reflector_-1_1']:
        bind_to_bone(name, 'Bone_Pedal_L')

    for name in ['PedalSpindle_1', 'PedalPlatform_1', 'Reflector_1_-1', 'Reflector_1_1']:
        bind_to_bone(name, 'Bone_Pedal_R')

    bind_to_bone('UniracerSaddle', 'Bone_SaddleHead')

    bpy.context.view_layer.update()

    # 5. Diagnostic Print
    print("=== FINAL REBOUND WORLD TRANSFORMS ===")
    for name in ['CrankArm_-1', 'PedalPlatform_-1', 'CrankArm_1', 'PedalPlatform_1', 'UniracerSaddle']:
        obj = bpy.data.objects.get(name)
        mw = obj.matrix_world
        verts = [mw @ v.co for v in obj.data.vertices]
        print(f"{name:20}: bone={obj.parent_bone} world_loc={mw.to_translation()} center=({sum(v.x for v in verts)/len(verts):.2f}, {sum(v.y for v in verts)/len(verts):.2f}, {sum(v.z for v in verts)/len(verts):.2f})")

    bpy.ops.wm.save_mainfile()
    print("Saved uniracer_model.blend!")

    # 6. Export to GLB
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
    print("Successfully exported uniracer_hero.glb!")

if __name__ == '__main__':
    run()
