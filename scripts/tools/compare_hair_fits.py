import bpy, bmesh, os, math, mathutils

blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_base_comic.blend"
hair_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\hair"

def test_hair_model(h_name):
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256
    
    arm = bpy.data.objects['Armature']
    body = bpy.data.objects['LPC_Decivoxel_Flesh_Fused']
    face = bpy.data.objects.get('LPC_Face_Decal')
    
    cam = bpy.data.objects['RenderCam']
    rot = bpy.data.objects['Cam_Rot_Empty']
    tgt = bpy.data.objects['CamTarget']
    rot.location = (0.0, -1.20, 0.62)
    tgt.location = (0.0, -1.20, 0.62)
    cam.location = (0.0, -2.15, 0.25)
    cam.data.lens = 45.0
    
    # Import hair
    f = os.path.join(hair_dir, h_name, h_name + ".obj")
    bpy.ops.wm.obj_import(filepath=f)
    h_obj = bpy.context.selected_objects[0]
    h_obj.rotation_euler[0] = math.radians(90)
    bpy.ops.object.transform_apply(rotation=True)
    
    xs = [v.co.x for v in h_obj.data.vertices]
    ys = [v.co.y for v in h_obj.data.vertices]
    zs = [v.co.z for v in h_obj.data.vertices]
    
    cx = (max(xs) + min(xs)) / 2.0
    cy = (max(ys) + min(ys)) / 2.0
    z_max = max(zs)
    z_min = min(zs)
    
    target_width = 0.520
    target_depth = 0.470
    target_height = 0.310 # Crown 1.27 to Nape 0.96
    
    scale_x = target_width / (max(xs) - min(xs))
    scale_y = target_depth / (max(ys) - min(ys))
    scale_z = target_height / (z_max - z_min)
    
    for v in h_obj.data.vertices:
        v.co.x = (v.co.x - cx) * scale_x
        v.co.y = (v.co.y - cy) * scale_y - 0.010
        v.co.z = 1.275 + (v.co.z - z_max) * scale_z
        
    h_obj.data.update()
    
    mat_hair = bpy.data.materials.new(name=f"{h_name}_mat")
    mat_hair.use_nodes = True
    nodes = mat_hair.node_tree.nodes
    nodes.clear()
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (0.24, 0.15, 0.09, 1.0)
    out = nodes.new('ShaderNodeOutputMaterial')
    mat_hair.node_tree.links.new(diff.outputs['BSDF'], out.inputs['Surface'])
    h_obj.data.materials.append(mat_hair)
    
    for deg in [0, 45, 90, 180]:
        rot.rotation_euler[2] = math.radians(deg)
        bpy.context.view_layer.update()
        scene.render.filepath = os.path.abspath(f'artifacts/verification/hair_{h_name}_{deg}.png')
        bpy.ops.render.render(write_still=True)
    print(f"Rendered {h_name}")

for h in ["short01", "short02", "short04"]:
    test_hair_model(h)
