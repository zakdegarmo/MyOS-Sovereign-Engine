import bpy, os, math

blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_base_comic.blend"
hair_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\hair"

def render_hair(h_name):
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256
    
    arm = bpy.data.objects['Armature']
    body = bpy.data.objects['LPC_Decivoxel_Flesh_Fused']
    face = bpy.data.objects.get('LPC_Face_Decal')
    if face:
        face.hide_render = False

    cam = bpy.data.objects['RenderCam']
    rot = bpy.data.objects['Cam_Rot_Empty']
    tgt = bpy.data.objects['CamTarget']
    rot.location = (0.0, -1.20, 0.62)
    tgt.location = (0.0, -1.20, 0.62)
    cam.location = (0.0, -2.15, 0.25)
    cam.data.lens = 45.0
    
    f = os.path.join(hair_dir, h_name, h_name + ".obj")
    bpy.ops.wm.obj_import(filepath=f)
    h_obj = bpy.context.selected_objects[0]
    h_obj.name = f"Hair_{h_name}"
    h_obj.rotation_euler[0] = math.radians(90)
    bpy.ops.object.transform_apply(rotation=True)
    
    xs = [v.co.x for v in h_obj.data.vertices]
    ys = [v.co.y for v in h_obj.data.vertices]
    zs = [v.co.z for v in h_obj.data.vertices]
    
    cx = (max(xs) + min(xs)) / 2.0
    cy = (max(ys) + min(ys)) / 2.0
    z_max = max(zs)
    z_min = min(zs)
    
    # Scale so crown is at 1.280 and nape is at 0.940 (height = 0.340)
    scale_x = 0.535 / (max(xs) - min(xs))
    scale_y = 0.485 / (max(ys) - min(ys))
    scale_z = 0.340 / (z_max - z_min)
    
    for v in h_obj.data.vertices:
        v.co.x = (v.co.x - cx) * scale_x
        v.co.y = (v.co.y - cy) * scale_y - 0.005
        v.co.z = 1.280 + (v.co.z - z_max) * scale_z
    h_obj.data.update()
    
    h_obj.parent = arm
    h_mod = h_obj.modifiers.new('Armature', 'ARMATURE')
    h_mod.object = arm
    vg_h = h_obj.vertex_groups.new(name='Head')
    vg_h.add(list(range(len(h_obj.data.vertices))), 1.0, 'REPLACE')
    
    mat_hair = bpy.data.materials.new(name=f"Mat_{h_name}")
    mat_hair.use_nodes = True
    nodes = mat_hair.node_tree.nodes
    nodes.clear()
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (0.28, 0.18, 0.11, 1.0)
    out = nodes.new('ShaderNodeOutputMaterial')
    mat_hair.node_tree.links.new(diff.outputs['BSDF'], out.inputs['Surface'])
    
    h_obj.data.materials.clear()
    h_obj.data.materials.append(mat_hair)
    
    mat_outline = bpy.data.materials.get('LPC_Outline_Mat')
    if mat_outline:
        h_obj.data.materials.append(mat_outline)
        mod = h_obj.modifiers.new(name='LPC_Ink_Outline', type='SOLIDIFY')
        mod.thickness = -0.004
        mod.offset = 0.0
        mod.use_flip_normals = True
        mod.material_offset = 1
    
    arm.data.pose_position = 'POSE'
    idle = bpy.data.actions.get('Idle_Loop')
    arm.animation_data.action = idle
    if hasattr(idle, 'slots') and len(idle.slots) > 0:
        arm.animation_data.action_slot = idle.slots[0]
    scene.frame_set(0)
    
    for deg in [0, 45, 90, 180]:
        rot.rotation_euler[2] = math.radians(deg)
        bpy.context.view_layer.update()
        scene.render.filepath = os.path.abspath(f'artifacts/verification/neat_{h_name}_{deg}.png')
        bpy.ops.render.render(write_still=True)
    print(f"Rendered neat {h_name}")

render_hair("short01")
render_hair("short02")
