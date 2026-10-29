"""
test_build_flesh_adventurer.py
Assembles flesh_adventurer.blend with properly scaled and centered 3D garments.
Renders idle and roll test frames to verify seamless body-cloth deformation.
"""

import sys
sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")

import bpy
import os
import math

def fit_clothing_item(obj, z_bounds, y_bounds, x_scale=0.10):
    zs = [v.co.z for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    
    z_min_orig, z_max_orig = min(zs), max(zs)
    y_min_orig, y_max_orig = min(ys), max(ys)
    
    z_min, z_max = z_bounds
    y_min, y_max = y_bounds
    
    scale_z = (z_max - z_min) / max(0.001, z_max_orig - z_min_orig)
    scale_y = (y_max - y_min) / max(0.001, y_max_orig - y_min_orig)
    
    for v in obj.data.vertices:
        v.co.x *= x_scale
        v.co.y = y_min + (v.co.y - y_min_orig) * scale_y
        v.co.z = z_min + (v.co.z - z_min_orig) * scale_z
    obj.data.update()

def create_cel_material(name, diffuse_rgb):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out_node = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (*diffuse_rgb, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.85
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.1
    links.new(bsdf.outputs['BSDF'], out_node.inputs['Surface'])
    return mat

def assemble_flesh_adventurer():
    base_blend = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_base_comic.blend"
    out_blend = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_adventurer.blend"
    clothes_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\clothes"

    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(base_blend))

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256

    body = bpy.data.objects['LPC_Decivoxel_Flesh_Fused']
    arm = bpy.data.objects['Armature']

    body.hide_render = False
    face = bpy.data.objects.get('LPC_Face_Decal')
    if face:
        face.hide_render = False

    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()

    mat_outline = bpy.data.materials.get('LPC_Outline_Mat')
    if not mat_outline:
        mat_outline = bpy.data.materials.new(name='LPC_Outline_Mat')
        mat_outline.use_nodes = True
        nodes = mat_outline.node_tree.nodes
        nodes.clear()
        out = nodes.new('ShaderNodeOutputMaterial')
        emit = nodes.new('ShaderNodeEmission')
        emit.inputs['Color'].default_value = (0.02, 0.02, 0.02, 1.0)
        mat_outline.node_tree.links.new(emit.outputs['Emission'], out.inputs['Surface'])

    # Garments: (ID, Folder, Filename, Z_bounds, Y_bounds, X_scale, RGB)
    outfit_pieces = [
        ('torso_tunic', 'wdg_mycenaean_tunic', 'mycenaean_tunic.obj', (0.42, 0.84), (-0.21, 0.21), 0.105, (0.12, 0.48, 0.22)),
        ('legs_cargo_pants', 'cortu_cargo_pants', 'cargo_pants.obj', (0.06, 0.58), (-0.19, 0.19), 0.088, (0.16, 0.24, 0.42)),
        ('feet_hero_boots', 'culturalibre_hero_boots_1', 'hero_boots_1.obj', (-0.005, 0.28), (-0.16, 0.20), 0.080, (0.24, 0.15, 0.09))
    ]

    for piece_id, folder, filename, z_bounds, y_bounds, x_scale, rgb_col in outfit_pieces:
        obj_path = os.path.join(clothes_dir, folder, filename)
        bpy.ops.wm.obj_import(filepath=obj_path)
        obj = bpy.context.selected_objects[0]
        obj.name = f"Adventurer_{piece_id}"
        obj.rotation_euler[0] = math.radians(90)
        bpy.ops.object.transform_apply(rotation=True)

        fit_clothing_item(obj, z_bounds, y_bounds, x_scale)

        for vg in body.vertex_groups:
            obj.vertex_groups.new(name=vg.name)
        bpy.context.view_layer.objects.active = obj
        dt = obj.modifiers.new(name='DT', type='DATA_TRANSFER')
        dt.object = body
        dt.use_vert_data = True
        dt.data_types_verts = {'VGROUP_WEIGHTS'}
        dt.vert_mapping = 'POLYINTERP_NEAREST'
        bpy.ops.object.datalayout_transfer(modifier='DT')
        bpy.ops.object.modifier_apply(modifier='DT')

        arm_mod = obj.modifiers.new(name='Armature', type='ARMATURE')
        arm_mod.object = arm

        solid = obj.modifiers.new(name='Outline', type='SOLIDIFY')
        solid.thickness = -0.010
        solid.offset = 1.0
        solid.material_offset = 1

        mat_cel = create_cel_material(f"Mat_{piece_id}", rgb_col)
        obj.data.materials.clear()
        obj.data.materials.append(mat_cel)
        obj.data.materials.append(mat_outline)
        obj.hide_render = False

    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()

    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(out_blend))
    print(f"[SUCCESS] Saved assembled master: {out_blend}")

    # Render Idle frame 0
    arm.animation_data.action = bpy.data.actions['Idle_Loop']
    scene.frame_set(int(arm.animation_data.action.frame_range[0]))
    cam_rot = bpy.data.objects.get('Cam_Rot_Empty')
    cam_rot.rotation_euler[2] = 0.0
    scene.render.filepath = os.path.abspath('adventurer_idle_preview.png')
    bpy.ops.render.render(write_still=True)
    print("[SUCCESS] Rendered Idle frame 0")

    # Render Roll frame 4
    roll_act = bpy.data.actions.get('Roll')
    if roll_act:
        arm.animation_data.action = roll_act
        f_mid = int((roll_act.frame_range[0] + roll_act.frame_range[1]) * 0.5)
        scene.frame_set(f_mid)
        bpy.context.view_layer.update()
        scene.render.filepath = os.path.abspath('adventurer_roll_preview.png')
        bpy.ops.render.render(write_still=True)
        print("[SUCCESS] Rendered Roll mid-frame")

if __name__ == "__main__":
    assemble_flesh_adventurer()
