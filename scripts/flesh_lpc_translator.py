import sys
import os
import math

sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy
import bmesh
from PIL import Image

def make_cel_mat(name, color_base, color_shadow):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new('ShaderNodeOutputMaterial')
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Roughness'].default_value = 0.0
    s2rgb = nodes.new('ShaderNodeShaderToRGB')
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (*color_shadow, 1.0)
    ramp.color_ramp.elements[1].position = 0.40
    ramp.color_ramp.elements[1].color = (*color_base, 1.0)

    links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], out.inputs['Surface'])
    return mat

def setup_sockets(arm):
    sockets = [
        ('Head_Socket', 'Head', (0.0, -0.05, 0.28)),
        ('Shoulder.L_Socket', 'LeftShoulder', (0.05, 0.0, 0.0)),
        ('Shoulder.R_Socket', 'RightShoulder', (-0.05, 0.0, 0.0)),
        ('Hand.L_Socket', 'LeftHand', (0.0, 0.0, -0.05)),
        ('Hand.R_Socket', 'RightHand', (0.0, 0.0, -0.05)),
        ('Back_Socket', 'Spine01', (0.0, 0.12, 0.0))
    ]
    for sock_name, bone_name, offset in sockets:
        if sock_name not in bpy.data.objects and bone_name in arm.data.bones:
            empty = bpy.data.objects.new(sock_name, None)
            empty.empty_display_type = 'ARROWS'
            empty.empty_display_size = 0.05
            bpy.context.collection.objects.link(empty)
            empty.parent = arm
            empty.parent_type = 'BONE'
            empty.parent_bone = bone_name
            empty.location = offset
            print(f'Created socket: {sock_name} -> {bone_name}')

def extract_conformal_shell(base_mesh, name, filter_fn, displace_amt, mat, mat_outline):
    shell = base_mesh.copy()
    shell.data = base_mesh.data.copy()
    shell.name = name
    bpy.context.collection.objects.link(shell)

    bpy.context.view_layer.objects.active = shell
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(shell.data)

    verts_to_delete = [v for v in bm.verts if not filter_fn(v)]
    bmesh.ops.delete(bm, geom=verts_to_delete, context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.update_edit_mesh(shell.data)
    bpy.ops.object.mode_set(mode='OBJECT')

    disp = shell.modifiers.new(name='Thickness', type='DISPLACE')
    disp.strength = displace_amt

    shell.data.materials.clear()
    shell.data.materials.append(mat)
    if mat_outline:
        shell.data.materials.append(mat_outline)

    return shell

def build_wardrobe(body, tunic_color, pants_color, boots_color, belt_color):
    mat_outline = bpy.data.materials.get('LPC_Outline_Mat')

    mat_tunic = make_cel_mat('M_Tunic_Cel', tunic_color, [c * 0.4 for c in tunic_color])
    tunic = extract_conformal_shell(
        body, 'LPC_Clothing_Tunic',
        filter_fn=lambda v: 0.40 <= v.co.z <= 0.81 and abs(v.co.x) <= 0.28,
        displace_amt=0.0035, mat=mat_tunic, mat_outline=mat_outline
    )

    mat_pants = make_cel_mat('M_Pants_Cel', pants_color, [c * 0.45 for c in pants_color])
    pants = extract_conformal_shell(
        body, 'LPC_Clothing_Pants',
        filter_fn=lambda v: 0.12 <= v.co.z <= 0.56 and abs(v.co.x) <= 0.24,
        displace_amt=0.0020, mat=mat_pants, mat_outline=mat_outline
    )

    mat_boots = make_cel_mat('M_Boots_Cel', boots_color, [c * 0.45 for c in boots_color])
    boots = extract_conformal_shell(
        body, 'LPC_Clothing_Boots',
        filter_fn=lambda v: v.co.z <= 0.18,
        displace_amt=0.0035, mat=mat_boots, mat_outline=mat_outline
    )

    mat_belt = make_cel_mat('M_Belt_Cel', belt_color, [c * 0.45 for c in belt_color])
    belt = extract_conformal_shell(
        body, 'LPC_Clothing_Belt',
        filter_fn=lambda v: 0.50 <= v.co.z <= 0.56 and abs(v.co.x) <= 0.165,
        displace_amt=0.0055, mat=mat_belt, mat_outline=mat_outline
    )

    return [tunic, pants, boots, belt]

def film_8way_action_atlas(out_atlas_path, action_name='Walk_Loop', num_frames=8, resolution=128, supersample=512):
    arm = bpy.data.objects['Armature']
    walk_act = bpy.data.actions.get(action_name)
    if not walk_act:
        raise RuntimeError(f'Action {action_name} not found!')
    arm.animation_data.action = walk_act

    scene = bpy.context.scene
    scene.render.resolution_x = supersample
    scene.render.resolution_y = supersample
    scene.render.film_transparent = True

    center_y = -1.20
    center_z = 0.60

    cam_rot = bpy.data.objects.get('Cam_Rot_Empty')
    if cam_rot:
        cam_rot.location = (0.0, center_y, center_z)

    cam_target = bpy.data.objects.get('CamTarget')
    if cam_target:
        cam_target.location = (0.0, center_y, center_z)

    cam = bpy.data.objects['RenderCam']
    cam.location = (0.0, -2.40, 0.25)

    angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]
    f_start = int(walk_act.frame_range[0])
    f_end = int(walk_act.frame_range[1])
    step = (f_end - f_start) / float(num_frames)
    frame_indices = [int(round(f_start + i * step)) for i in range(num_frames)]

    master_atlas = Image.new('RGBA', (resolution * num_frames, resolution * len(angles_deg)), (0, 0, 0, 0))
    temp_dir = os.path.abspath('temp_film_frames')
    os.makedirs(temp_dir, exist_ok=True)

    print(f'Filming {len(angles_deg)} directions x {num_frames} frames into atlas...')

    for row_idx, deg in enumerate(angles_deg):
        cam_rot.rotation_euler[2] = math.radians(deg)
        bpy.context.view_layer.update()

        for col_idx, f_num in enumerate(frame_indices):
            scene.frame_set(f_num)
            bpy.context.view_layer.update()

            tmp_path = os.path.join(temp_dir, f'render_r{row_idx}_c{col_idx}.png')
            scene.render.filepath = tmp_path
            bpy.ops.render.render(write_still=True)

            with Image.open(tmp_path) as im:
                tile = im.convert('RGBA').resize((resolution, resolution), Image.Resampling.LANCZOS)
                master_atlas.paste(tile, (col_idx * resolution, row_idx * resolution), tile)

            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    os.makedirs(os.path.dirname(os.path.abspath(out_atlas_path)), exist_ok=True)
    master_atlas.save(out_atlas_path)
    print(f'Action Atlas compiled successfully -> {out_atlas_path}')

def run_translator(blend_path, out_char_atlas, out_clothing_atlas):
    print(f'Loading blend: {blend_path}')
    bpy.ops.wm.open_mainfile(filepath=blend_path)

    arm = bpy.data.objects['Armature']
    setup_sockets(arm)

    body = None
    for o in bpy.data.objects:
        if 'LPC_Decivoxel_Flesh' in o.name:
            body = o
            break
    if not body:
        raise RuntimeError('No flesh body mesh found in scene!')

    tunic_color = (0.16, 0.48, 0.20)
    pants_color = (0.16, 0.32, 0.40)
    boots_color = (0.35, 0.22, 0.14)
    belt_color = (0.24, 0.14, 0.08)

    wardrobe = build_wardrobe(body, tunic_color, pants_color, boots_color, belt_color)
    print(f'Wardrobe created: {[w.name for w in wardrobe]}')

    # Film Full Character Atlas
    film_8way_action_atlas(out_char_atlas, action_name='Walk_Loop', num_frames=8, resolution=128, supersample=512)

    # Film Isolated Clothing Layer
    body.hide_render = True
    for o in bpy.data.objects:
        if 'Hair' in o.name or 'Face_Decal' in o.name:
            o.hide_render = True

    film_8way_action_atlas(out_clothing_atlas, action_name='Walk_Loop', num_frames=8, resolution=128, supersample=512)
    print('All Action Atlases successfully generated!')

if __name__ == '__main__':
    blend = os.path.abspath('flesh_female_mannequin.blend')
    char_out = os.path.abspath('apps/web/public/actions/flesh_female_adventurer_walk.png')
    layer_out = os.path.abspath('apps/web/public/actions/clothing_layer_forest_traveler_walk.png')
    run_translator(blend, char_out, layer_out)
