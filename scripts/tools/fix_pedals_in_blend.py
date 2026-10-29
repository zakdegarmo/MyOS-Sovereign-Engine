import bpy
import mathutils

def fix_pedals_and_bones():
    arm = bpy.data.objects.get('Uniracer_Rig')
    if not arm:
        print("Armature not found!")
        return

    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')

    ebones = arm.data.edit_bones

    # Left crank is at Y = +4.3841, Z = +4.3841
    # Right crank is at Y = -4.3841, Z = -4.3841
    cy_l, cz_l = 4.3841, 4.3841
    cy_r, cz_r = -4.3841, -4.3841

    if 'Bone_Crank_L' in ebones:
        ebones['Bone_Crank_L'].head = (-3.1, 0, 0)
        ebones['Bone_Crank_L'].tail = (-3.1, cy_l, cz_l)

    if 'Bone_Pedal_L' in ebones:
        ebones['Bone_Pedal_L'].head = (-3.1, cy_l, cz_l)
        ebones['Bone_Pedal_L'].tail = (-5.5, cy_l, cz_l)

    if 'Bone_Crank_R' in ebones:
        ebones['Bone_Crank_R'].head = (3.1, 0, 0)
        ebones['Bone_Crank_R'].tail = (3.1, cy_r, cz_r)

    if 'Bone_Pedal_R' in ebones:
        ebones['Bone_Pedal_R'].head = (3.1, cy_r, cz_r)
        ebones['Bone_Pedal_R'].tail = (5.5, cy_r, cz_r)

    bpy.ops.object.mode_set(mode='OBJECT')

    # Now unparent and place pedal objects at exact locations
    pedal_l_parts = {
        'PedalSpindle_-1': mathutils.Vector((-4.3, cy_l, cz_l)),
        'PedalPlatform_-1': mathutils.Vector((-5.1, cy_l, cz_l)),
        'Reflector_-1_-1': mathutils.Vector((-5.1, cy_l - 1.28, cz_l)),
        'Reflector_-1_1': mathutils.Vector((-5.1, cy_l + 1.28, cz_l)),
    }

    pedal_r_parts = {
        'PedalSpindle_1': mathutils.Vector((4.3, cy_r, cz_r)),
        'PedalPlatform_1': mathutils.Vector((5.1, cy_r, cz_r)),
        'Reflector_1_-1': mathutils.Vector((5.1, cy_r - 1.28, cz_r)),
        'Reflector_1_1': mathutils.Vector((5.1, cy_r + 1.28, cz_r)),
    }

    for name, loc in pedal_l_parts.items():
        obj = bpy.data.objects.get(name)
        if obj:
            obj.parent = None
            obj.matrix_world.translation = loc
            # Parent to Bone_Pedal_L
            obj.parent = arm
            obj.parent_type = 'BONE'
            obj.parent_bone = 'Bone_Pedal_L'
            # Keep transform: compute matrix relative to bone
            bone = arm.data.bones['Bone_Pedal_L']
            obj.matrix_parent_inverse = (arm.matrix_world @ bone.matrix_local).inverted()

    for name, loc in pedal_r_parts.items():
        obj = bpy.data.objects.get(name)
        if obj:
            obj.parent = None
            obj.matrix_world.translation = loc
            # Parent to Bone_Pedal_R
            obj.parent = arm
            obj.parent_type = 'BONE'
            obj.parent_bone = 'Bone_Pedal_R'
            bone = arm.data.bones['Bone_Pedal_R']
            obj.matrix_parent_inverse = (arm.matrix_world @ bone.matrix_local).inverted()

    print("Pedals and bones successfully reconciled!")
    bpy.ops.wm.save_mainfile()
    print("Saved uniracer_model.blend!")

if __name__ == '__main__':
    fix_pedals_and_bones()
