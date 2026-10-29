import sys
sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")
import bpy, os, math
from PIL import Image

def make_cel_mat(name, base_rgb, shadow_rgb):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (*base_rgb, 1.0)
    
    s2rgb = nodes.new('ShaderNodeShaderToRGB')
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].position = 0.45
    ramp.color_ramp.elements[0].color = (*shadow_rgb, 1.0)
    ramp.color_ramp.elements[1].position = 0.48
    ramp.color_ramp.elements[1].color = (*base_rgb, 1.0)
    
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], out.inputs['Surface'])
    return mat

def extract_conformal_shell(body_obj, shell_name, filter_fn, displace_amt=0.002, mat=None, mat_outline=None):
    old = bpy.data.objects.get(shell_name)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
        
    mesh = body_obj.data
    keep_faces = []
    for p in mesh.polygons:
        vs = [mesh.vertices[vi] for vi in p.vertices]
        if any(filter_fn(v) for v in vs):
            keep_faces.append(p.index)
            
    shell_mesh = mesh.copy()
    shell_mesh.name = shell_name + '_Mesh'
    shell_obj = bpy.data.objects.new(shell_name, shell_mesh)
    bpy.context.collection.objects.link(shell_obj)
    
    shell_obj.matrix_world = body_obj.matrix_world.copy()
    
    # Delete non-selected faces
    delete_poly_indices = set(range(len(shell_mesh.polygons))) - set(keep_faces)
    shell_mesh.polygons.foreach_set("select", [i in delete_poly_indices for i in range(len(shell_mesh.polygons))])
    
    # In bmesh remove unselected
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(shell_mesh)
    faces_to_del = [f for f in bm.faces if f.index in delete_poly_indices]
    bmesh.ops.delete(bm, geom=faces_to_del, context='FACES_ONLY')
    bm.to_mesh(shell_mesh)
    bm.free()
    
    shell_obj.data.materials.clear()
    if mat:
        shell_obj.data.materials.append(mat)
    if mat_outline:
        shell_obj.data.materials.append(mat_outline)
        
    disp = shell_obj.modifiers.new(name="Conformal_Displace", type='DISPLACE')
    disp.mid_level = 0.0
    disp.strength = displace_amt
    
    arm_mod = shell_obj.modifiers.new(name="Rig_Bind", type='ARMATURE')
    arm_mod.object = body_obj.modifiers.get('Armature').object if body_obj.modifiers.get('Armature') else bpy.data.objects.get('Armature')
    
    return shell_obj

def film_action(action_name, out_path, num_frames=8, resolution=128, supersample=256):
    arm = bpy.data.objects['Armature']
    act = bpy.data.actions.get(action_name)
    if not act:
        print(f"Action {action_name} not found, skipping!")
        return
    arm.animation_data.action = act
    
    scene = bpy.context.scene
    scene.render.resolution_x = supersample
    scene.render.resolution_y = supersample
    scene.render.film_transparent = True
    
    # Calibrated Grounding coordinates
    center_y = -1.20
    center_z = 0.96
    
    cam_rot = bpy.data.objects['Cam_Rot_Empty']
    cam_rot.location = (0.0, center_y, center_z)
    
    cam_tgt = bpy.data.objects.get('CamTarget')
    if cam_tgt:
        cam_tgt.location = (0.0, center_y, center_z)
        
    cam = bpy.data.objects['RenderCam']
    cam.location = (0.0, -2.40, 0.25)
    
    # 8-way compass angles matching Direction Row Map:
    # Row 0: S (0)
    # Row 1: SW (45)
    # Row 2: W (90)
    # Row 3: NW (135)
    # Row 4: N (180)
    # Row 5: NE (225)
    # Row 6: E (270)
    # Row 7: SE (315)
    angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]
    
    f_start = int(act.frame_range[0])
    f_end = int(act.frame_range[1])
    step = (f_end - f_start) / float(num_frames)
    frame_indices = [int(round(f_start + i * step)) for i in range(num_frames)]
    
    master_atlas = Image.new('RGBA', (resolution * num_frames, resolution * len(angles_deg)), (0, 0, 0, 0))
    temp_dir = os.path.abspath('temp_film_trilogy')
    os.makedirs(temp_dir, exist_ok=True)
    
    print(f"--- Filming {action_name} ({len(angles_deg)} dirs x {num_frames} frames) -> {out_path} ---")
    
    for row_idx, deg in enumerate(angles_deg):
        cam_rot.rotation_euler[2] = math.radians(deg)
        bpy.context.view_layer.update()
        
        for col_idx, f_num in enumerate(frame_indices):
            scene.frame_set(f_num)
            bpy.context.view_layer.update()
            
            tmp_path = os.path.join(temp_dir, f"r{row_idx}_c{col_idx}.png")
            scene.render.filepath = tmp_path
            bpy.ops.render.render(write_still=True)
            
            with Image.open(tmp_path) as im:
                tile = im.convert('RGBA').resize((resolution, resolution), Image.Resampling.LANCZOS)
                master_atlas.paste(tile, (col_idx * resolution, row_idx * resolution), tile)
                
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    master_atlas.save(out_path)
    print(f"Saved: {out_path}")

def main():
    blend = os.path.abspath('flesh_female_mannequin.blend')
    bpy.ops.wm.open_mainfile(filepath=blend)
    
    body = [o for o in bpy.data.objects if 'LPC_Decivoxel_Flesh' in o.name][0]
    
    for l in bpy.data.objects:
        if l.type == 'LIGHT':
            l.hide_render = False

    # Ensure facial decal is bound to Head bone cleanly without conflicting constraints
    face = bpy.data.objects.get('LPC_Face_Decal_Female')
    arm = bpy.data.objects['Armature']
    if face:
        face.constraints.clear()
        face.modifiers.clear()
        face.parent = arm
        face.parent_type = 'OBJECT'
        face.matrix_parent_inverse = arm.matrix_world.inverted()
        face.location = (0, 0, 0)
        face.rotation_euler = (0, 0, 0)
        face.scale = (1, 1, 1)
        arm_mod = face.modifiers.new('Armature', 'ARMATURE')
        arm_mod.object = arm
        vg = face.vertex_groups.get('Head') or face.vertex_groups.new(name='Head')
        vg.add(list(range(len(face.data.vertices))), 1.0, 'REPLACE')
        sw = face.modifiers.new('FaceShrinkwrap', 'SHRINKWRAP')
        sw.target = body
        sw.wrap_method = 'NEAREST_SURFACEPOINT'
        sw.offset = 0.002
        face.visible_shadow = False
        print("Verified face decal clean armature bind and conformal shrinkwrap.")
        
    mat_outline = bpy.data.materials.get('M_Outline')
    mat_tunic = make_cel_mat('M_Tunic_Cel', (0.16, 0.48, 0.20), (0.08, 0.24, 0.10))
    tunic = extract_conformal_shell(body, 'LPC_Clothing_Tunic', lambda v: 0.48 <= v.co.z <= 0.88 and abs(v.co.x) <= 0.24, 0.0035, mat_tunic, mat_outline)
    
    mat_pants = make_cel_mat('M_Pants_Cel', (0.16, 0.32, 0.40), (0.08, 0.16, 0.20))
    pants = extract_conformal_shell(body, 'LPC_Clothing_Pants', lambda v: 0.12 <= v.co.z <= 0.56 and abs(v.co.x) <= 0.24, 0.0020, mat_pants, mat_outline)
    
    mat_boots = make_cel_mat('M_Boots_Cel', (0.35, 0.22, 0.14), (0.17, 0.11, 0.07))
    boots = extract_conformal_shell(body, 'LPC_Clothing_Boots', lambda v: v.co.z <= 0.18, 0.0035, mat_boots, mat_outline)
    
    trilogy = [
        ('Idle_Loop', 'idle', 'flesh_female_adventurer_idle.png', 'clothing_layer_forest_traveler_idle.png'),
        ('Walk_Loop', 'walk', 'flesh_female_adventurer_walk.png', 'clothing_layer_forest_traveler_walk.png'),
        ('Jog_Fwd_Loop', 'run', 'flesh_female_adventurer_run.png', 'clothing_layer_forest_traveler_run.png')
    ]
    
    actions_dir = os.path.abspath('apps/web/public/actions')
    
    for act_name, key, char_file, layer_file in trilogy:
        char_out = os.path.join(actions_dir, char_file)
        layer_out = os.path.join(actions_dir, layer_file)
        
        # 1. Film Full Composite Heroine
        body.hide_render = False
        if face: face.hide_render = False
        tunic.hide_render = False
        pants.hide_render = False
        boots.hide_render = False
        for o in bpy.data.objects:
            if 'Hair' in o.name: o.hide_render = False
        film_action(act_name, char_out)
        
        # 2. Film Isolated Clothing Layer (Transparent paperdoll layer)
        body.hide_render = True
        if face: face.hide_render = True
        for o in bpy.data.objects:
            if 'Hair' in o.name: o.hide_render = True
        tunic.hide_render = False
        pants.hide_render = False
        boots.hide_render = False
        film_action(act_name, layer_out)

    print("=== CORE TRILOGY FILMING COMPLETE ===")

if __name__ == '__main__':
    main()
