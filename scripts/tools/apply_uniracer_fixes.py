"""
apply_uniracer_fixes.py
-----------------------
Cleanly aligns:
1. UniracerSaddle:
   - Rotates mesh 180 around Z so skinny nose (face) is at +Y (forward) and wide kicked-up spoiler is at -Y (rear).
   - Bone_SaddleHead in edit mode: head=(0, 0, 20.0), tail=(0, 4.0, 21.5).
   - Parents UniracerSaddle to Bone_SaddleHead via parent_set(type='BONE').
2. Pedals & Cranks:
   - Bone_Crank_L: head=(-3.1, 0, 0), tail=(-3.1, -4.3841, -4.3841).
   - Bone_Pedal_L: head=(-3.1, -4.3841, -4.3841), tail=(-5.5, -4.3841, -4.3841).
   - Bone_Crank_R: head=(3.1, 0, 0), tail=(3.1, 4.3841, 4.3841).
   - Bone_Pedal_R: head=(3.1, 4.3841, 4.3841), tail=(5.5, 4.3841, 4.3841).
   - Left pedal parts placed horizontally at X=-4.3..-5.1, Y=-4.3841, Z=-4.3841, parented to Bone_Pedal_L.
   - Right pedal parts placed horizontally at X=4.3..5.1, Y=4.3841, Z=4.3841, parented to Bone_Pedal_R.
"""

import bpy
import math
import mathutils

def run():
    arm = bpy.data.objects.get('Uniracer_Rig')
    coll = bpy.data.collections.get('New_Uniracer_Model')
    if not arm or not coll:
        raise RuntimeError("Uniracer_Rig or New_Uniracer_Model not found!")

    # 1. Reset all pose bones to identity
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    for pb in arm.pose.bones:
        pb.matrix_basis.identity()
    bpy.ops.object.mode_set(mode='OBJECT')

    # 2. Update Armature Edit Bones
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones

    # Wheel
    eb['Bone_Wheel'].head = (0.0, 0.0, 0.0)
    eb['Bone_Wheel'].tail = (0.0, 0.0, 6.0)
    eb['Bone_Wheel'].roll = 0.0

    # Crank L & Pedal L (matching CrankArm_-1 at -Y, -Z)
    eb['Bone_Crank_L'].head = (-3.1, 0.0, 0.0)
    eb['Bone_Crank_L'].tail = (-3.1, -4.3841, -4.3841)
    eb['Bone_Crank_L'].roll = 0.0

    eb['Bone_Pedal_L'].head = (-3.1, -4.3841, -4.3841)
    eb['Bone_Pedal_L'].tail = (-5.5, -4.3841, -4.3841)
    eb['Bone_Pedal_L'].roll = 0.0

    # Crank R & Pedal R (matching CrankArm_1 at +Y, +Z)
    eb['Bone_Crank_R'].head = (3.1, 0.0, 0.0)
    eb['Bone_Crank_R'].tail = (3.1, 4.3841, 4.3841)
    eb['Bone_Crank_R'].roll = 0.0

    eb['Bone_Pedal_R'].head = (3.1, 4.3841, 4.3841)
    eb['Bone_Pedal_R'].tail = (5.5, 4.3841, 4.3841)
    eb['Bone_Pedal_R'].roll = 0.0

    # Frame & Saddle Head (forward along +Y)
    eb['Bone_Frame'].head = (0.0, 0.0, 0.0)
    eb['Bone_Frame'].tail = (0.0, 0.0, 20.0)
    eb['Bone_Frame'].roll = 0.0

    eb['Bone_SaddleHead'].head = (0.0, 0.0, 20.0)
    eb['Bone_SaddleHead'].tail = (0.0, 4.0, 21.5)
    eb['Bone_SaddleHead'].roll = 0.0

    bpy.ops.object.mode_set(mode='OBJECT')
    print("Armature edit bones updated.")

    # 3. Orient Saddle Mesh
    saddle = bpy.data.objects.get('UniracerSaddle')
    if saddle:
        # Unparent
        saddle.parent = None
        saddle.location = (0, 0, 0)
        saddle.rotation_euler = (0, 0, 0)
        saddle.scale = (1, 1, 1)
        saddle.matrix_world.identity()

        # Check raw vertex orientation
        verts = [v.co for v in saddle.data.vertices]
        min_y = min(v.y for v in verts); max_y = max(v.y for v in verts)
        front_v = [v for v in verts if v.y > (max_y - 1.5)]
        w_front = max(v.x for v in front_v) - min(v.x for v in front_v)

        # If front (+Y) is wide (spoiler), flip mesh 180 deg around Z
        if w_front > 5.0:
            print(f"Flipping saddle mesh 180 deg (front was {w_front:.2f})...")
            for v in saddle.data.vertices:
                v.co.x = -v.co.x
                v.co.y = -v.co.y
            saddle.data.update()

        # Parent to Bone_SaddleHead via parent_set(type='BONE')
        bpy.ops.object.select_all(action='DESELECT')
        saddle.select_set(True)
        arm.select_set(True)
        bpy.context.view_layer.objects.active = arm
        arm.data.bones.active = arm.data.bones['Bone_SaddleHead']
        bpy.ops.object.parent_set(type='BONE')
        print("Saddle parented to Bone_SaddleHead.")

    # 4. Clean Rebuild & Placement of Pedal Assemblies
    mat_chrome = bpy.data.materials.get("Mat_Chrome")
    mat_pedals = bpy.data.materials.get("Mat_Pedals")
    mat_refl = bpy.data.materials.get("Mat_Reflector")

    pedal_names = [
        'PedalSpindle_-1', 'PedalPlatform_-1', 'Reflector_-1_-1', 'Reflector_-1_1',
        'PedalSpindle_1', 'PedalPlatform_1', 'Reflector_1_-1', 'Reflector_1_1'
    ]
    for n in pedal_names:
        o = bpy.data.objects.get(n)
        if o:
            bpy.data.objects.remove(o, do_unlink=True)

    # Function to build and parent a pedal assembly
    def build_pedal_assembly(side, cy, cz, bone_name):
        x_base = 3.1 * side
        parts = []

        # Spindle
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.3, depth=1.8, vertices=16,
            location=(x_base + 0.9 * side, cy, cz),
            rotation=(0, math.radians(90), 0)
        )
        spindle = bpy.context.active_object
        spindle.name = f"PedalSpindle_{side}"
        if mat_chrome:
            spindle.data.materials.append(mat_chrome)
        parts.append(spindle)

        # Platform (Horizontal: width X=1.5, length Y=2.5, height Z=0.6)
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(x_base + 1.7 * side, cy, cz)
        )
        platform = bpy.context.active_object
        platform.name = f"PedalPlatform_{side}"
        platform.scale = (1.5, 2.5, 0.6)
        if mat_pedals:
            platform.data.materials.append(mat_pedals)
        bpy.ops.object.shade_smooth()
        parts.append(platform)

        # Amber Reflectors (front and rear)
        for r_dir in [-1, 1]:
            ref_y = cy + (1.28 * r_dir)
            bpy.ops.mesh.primitive_cube_add(
                size=1.0,
                location=(x_base + 1.7 * side, ref_y, cz)
            )
            refl = bpy.context.active_object
            refl.name = f"Reflector_{side}_{r_dir}"
            refl.scale = (1.1, 0.12, 0.35)
            if mat_refl:
                refl.data.materials.append(mat_refl)
            parts.append(refl)

        # Ensure in collection
        for p in parts:
            if p.name not in coll.objects:
                coll.objects.link(p)
            if p.name in bpy.context.scene.collection.objects:
                bpy.context.scene.collection.objects.unlink(p)

            # Parent to bone preserving world transform
            bpy.ops.object.select_all(action='DESELECT')
            p.select_set(True)
            arm.select_set(True)
            bpy.context.view_layer.objects.active = arm
            arm.data.bones.active = arm.data.bones[bone_name]
            bpy.ops.object.parent_set(type='BONE')

    # Left: side=-1, Y=-4.3841, Z=-4.3841
    build_pedal_assembly(-1, -4.3841, -4.3841, 'Bone_Pedal_L')
    # Right: side=1, Y=4.3841, Z=4.3841
    build_pedal_assembly(1, 4.3841, 4.3841, 'Bone_Pedal_R')

    bpy.context.view_layer.update()

    # 5. Final Diagnostic Verification
    print("\n=== FINAL WORLD VERIFICATION ===")
    for name in ['CrankArm_-1', 'PedalPlatform_-1', 'PedalSpindle_-1', 'CrankArm_1', 'PedalPlatform_1', 'PedalSpindle_1', 'UniracerSaddle']:
        obj = bpy.data.objects.get(name)
        mw = obj.matrix_world
        verts = [mw @ v.co for v in obj.data.vertices]
        cx = sum(v.x for v in verts) / len(verts)
        cy = sum(v.y for v in verts) / len(verts)
        cz = sum(v.z for v in verts) / len(verts)
        print(f"{name:20} center=({cx:6.2f}, {cy:6.2f}, {cz:6.2f}) bone={obj.parent_bone}")

    # Verify Saddle front/back
    s_verts = [saddle.matrix_world @ v.co for v in saddle.data.vertices]
    min_y = min(v.y for v in s_verts); max_y = max(v.y for v in s_verts)
    front_v = [v for v in s_verts if v.y > (max_y - 1.5)]
    back_v = [v for v in s_verts if v.y < (min_y + 1.5)]
    print(f"\nSaddle World Front (+Y): width={max(v.x for v in front_v) - min(v.x for v in front_v):.2f}, avg Z={sum(v.z for v in front_v)/len(front_v):.2f}")
    print(f"Saddle World Back (-Y): width={max(v.x for v in back_v) - min(v.x for v in back_v):.2f}, avg Z={sum(v.z for v in back_v)/len(back_v):.2f}")

    bpy.ops.wm.save_mainfile()
    print("\nSaved uniracer_model.blend successfully!")

if __name__ == '__main__':
    run()
