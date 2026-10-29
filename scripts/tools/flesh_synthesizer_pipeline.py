import sys
# Ensure Python site-packages are accessible in Blender's embedded Python
sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")

import bpy
import bmesh
import mathutils
import math
import os
import json
import argparse
import base64
import numpy as np
import re
from PIL import Image

def has_word(text, *words):
    if not text:
        return False
    for w in words:
        if re.search(r'\b' + re.escape(w) + r'\b', text, re.IGNORECASE):
            return True
    return False

def make_cel_mat(name, base_rgb, shadow_rgb, highlight_rgb=None, ramp_stops=(0.35, 0.44)):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (*base_rgb, 1.0)
    diff.inputs['Roughness'].default_value = 0.0
    
    s2rgb = nodes.new('ShaderNodeShaderToRGB')
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    
    ramp.color_ramp.elements[0].position = ramp_stops[0]
    ramp.color_ramp.elements[0].color = (*shadow_rgb, 1.0)
    ramp.color_ramp.elements[1].position = ramp_stops[1]
    ramp.color_ramp.elements[1].color = (*base_rgb, 1.0)
    
    if highlight_rgb:
        elem2 = ramp.color_ramp.elements.new(0.68)
        elem2.color = (*highlight_rgb, 1.0)
    
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], out.inputs['Surface'])
    return mat

def apply_front_uv_projection(obj):
    mesh = obj.data
    uv_layer = mesh.uv_layers.get("UV_Front") or mesh.uv_layers.new(name="UV_Front")
    for poly in mesh.polygons:
        for loop_idx in poly.loop_indices:
            v = mesh.vertices[mesh.loops[loop_idx].vertex_index]
            u = 0.50 + (v.co.x / 0.56) * 0.60
            v_coord = 0.05 + (v.co.z / 1.20) * 0.85
            uv_layer.data[loop_idx].uv = (u, v_coord)

def make_composite_surface_mat(name, base_cel_rgb, ref_image):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    out = nodes.new('ShaderNodeOutputMaterial')
    
    uv_node = nodes.new('ShaderNodeUVMap')
    uv_node.uv_map = "UV_Front"
    
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = ref_image
    tex.interpolation = 'Linear'
    tex.extension = 'CLIP'
    links.new(uv_node.outputs['UV'], tex.inputs['Vector'])
    
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Roughness'].default_value = 0.0
    
    s2rgb = nodes.new('ShaderNodeShaderToRGB')
    links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = (0.55, 0.55, 0.55, 1.0)
    ramp.color_ramp.elements[1].position = 0.44
    ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    
    geom = nodes.new('ShaderNodeNewGeometry')
    sep_xyz = nodes.new('ShaderNodeSeparateXYZ')
    links.new(geom.outputs['Normal'], sep_xyz.inputs['Vector'])
    
    math_neg = nodes.new('ShaderNodeMath')
    math_neg.operation = 'MULTIPLY'
    math_neg.inputs[1].default_value = -1.0
    links.new(sep_xyz.outputs['Y'], math_neg.inputs[0])
    
    ramp_normal = nodes.new('ShaderNodeValToRGB')
    ramp_normal.color_ramp.interpolation = 'LINEAR'
    ramp_normal.color_ramp.elements[0].position = 0.10
    ramp_normal.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp_normal.color_ramp.elements[1].position = 0.60
    ramp_normal.color_ramp.elements[1].color = (1, 1, 1, 1)
    links.new(math_neg.outputs['Value'], ramp_normal.inputs['Fac'])
    
    mix_fac = nodes.new('ShaderNodeMath')
    mix_fac.operation = 'MULTIPLY'
    links.new(ramp_normal.outputs['Color'], mix_fac.inputs[0])
    links.new(tex.outputs['Alpha'], mix_fac.inputs[1])
    
    mix_color = nodes.new('ShaderNodeMix')
    mix_color.data_type = 'RGBA'
    mix_color.inputs[6].default_value = (*base_cel_rgb, 1.0)
    links.new(tex.outputs['Color'], mix_color.inputs[7])
    links.new(mix_fac.outputs['Value'], mix_color.inputs[0])
    
    mult_light = nodes.new('ShaderNodeMix')
    mult_light.data_type = 'RGBA'
    mult_light.blend_type = 'MULTIPLY'
    mult_light.inputs[0].default_value = 1.0
    links.new(mix_color.outputs[2], mult_light.inputs[6])
    links.new(ramp.outputs['Color'], mult_light.inputs[7])
    
    emis = nodes.new('ShaderNodeEmission')
    emis.inputs['Strength'].default_value = 1.0
    links.new(mult_light.outputs[2], emis.inputs['Color'])
    
    links.new(emis.outputs['Emission'], out.inputs['Surface'])
    return mat

def build_volumetric_voxelmesh(arm_obj, base_obj, ref_image_path=None, grid_res=0.026, primary_rgb=(0.18, 0.20, 0.24), secondary_rgb=(0.85, 0.22, 0.18), glow_rgb=(1.0, 0.45, 0.15), extra_objs=None, char_id="golem", char_name="Golem"):
    old_vox = bpy.data.objects.get("FLESH_Voxelmesh") or bpy.data.objects.get("FLESH_Microvoxels")
    if old_vox:
        bpy.data.objects.remove(old_vox, do_unlink=True)
        
    # Completely HIDE the underlying polygon mesh and extra morph meshes from render and viewport!
    # The volumetric voxel cloud REPLACES the visible mesh entirely.
    base_obj.hide_render = True
    base_obj.hide_viewport = True
    if extra_objs:
        for obj in extra_objs:
            if obj:
                obj.hide_render = True
                obj.hide_viewport = True
                
    # 1. Ensure armature is in REST position before cage remesh and weight transfer
    orig_pose_pos = getattr(arm_obj.data, 'pose_position', 'POSE')
    arm_obj.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    bm_cage = bmesh.new()
    bm_cage.from_mesh(base_obj.data)
    
    # Merge extra morphological geometry (such as perched eyeballs and brow ridges) into cage
    if extra_objs:
        for obj in extra_objs:
            if obj and obj.data:
                bm_extra = bmesh.new()
                bm_extra.from_mesh(obj.data)
                rel_matrix = base_obj.matrix_world.inverted() @ obj.matrix_world
                for v in bm_extra.verts:
                    bm_cage.verts.new(rel_matrix @ v.co)
                bm_extra.free()
                
    cage_mesh = bpy.data.meshes.new("FLESH_Voxel_Cage_Mesh")
    bm_cage.to_mesh(cage_mesh)
    bm_cage.free()
    
    cage_obj = bpy.data.objects.new("FLESH_Voxel_Cage", cage_mesh)
    bpy.context.collection.objects.link(cage_obj)
    cage_obj.matrix_world = base_obj.matrix_world.copy()
    
    voxel_size = grid_res * 1.08  # Overlapping cubes ensure 100% gapless solid mosaic
    
    cage_obj.data.remesh_voxel_size = grid_res
    cage_obj.data.remesh_voxel_adaptivity = 0.0
    bpy.ops.object.select_all(action='DESELECT')
    cage_obj.select_set(True)
    bpy.context.view_layer.objects.active = cage_obj
    bpy.ops.object.voxel_remesh()
    
    # Transfer bone weights from base_obj to cage
    for vg in base_obj.vertex_groups:
        cage_obj.vertex_groups.new(name=vg.name)
    dt = cage_obj.modifiers.new("Weight_Transfer", 'DATA_TRANSFER')
    dt.object = base_obj
    dt.use_vert_data = True
    dt.data_types_verts = {'VGROUP_WEIGHTS'}
    dt.vert_mapping = 'POLY_NEAREST'
    bpy.ops.object.modifier_apply(modifier="Weight_Transfer")
    
    # Ensure head/eye vertices are weighted to Head bone strictly within anatomical cranial boundaries
    vg_head = cage_obj.vertex_groups.get('Head')
    if vg_head:
        head_vert_indices = [v.index for v in cage_obj.data.vertices if (v.co.z >= 0.875 or (v.co.z >= 0.80 and abs(v.co.x) <= 0.12 and abs(v.co.y) <= 0.12))]
        vg_head.add(head_vert_indices, 1.0, 'REPLACE')
        
    sampled_verts = list(cage_obj.data.vertices)
    voxel_count = len(sampled_verts)
    print(f"[Synthesizer] Synthesizing {voxel_count} contiguous volumetric voxels (size={voxel_size:.3f}m)...")
    
    # Restore armature to POSE position
    arm_obj.data.pose_position = orig_pose_pos
    bpy.context.view_layer.update()
    
    # 2. Reference Image Anatomical Registration & Distance Transform Extrapolation
    dilated_rgb = None
    y_top, y_bot = 0, 511
    z_min = min((v.co.z for v in sampled_verts), default=0.0)
    z_max = max((v.co.z for v in sampled_verts), default=1.20)
    head_x_center, head_width = 256.0, 200.0
    torso_x_center, torso_width = 256.0, 250.0
    
    if ref_image_path and os.path.exists(ref_image_path):
        try:
            from PIL import Image
            import numpy as np
            ref_img = Image.open(ref_image_path).convert('RGBA')
            w, h = ref_img.size
            arr = np.array(ref_img)
            alpha = arr[:, :, 3]
            rgb = arr[:, :, :3]
            
            # Filter white halo
            is_white = (rgb[:, :, 0] > 220) & (rgb[:, :, 1] > 220) & (rgb[:, :, 2] > 220)
            fg_mask = (alpha > 60) & (~is_white)
            
            # Nearest neighbor fill for 100% texture coverage
            try:
                from scipy.ndimage import distance_transform_edt
                indices = distance_transform_edt(~fg_mask, return_distances=False, return_indices=True)
                dilated_rgb = rgb[indices[0], indices[1]]
            except Exception:
                dilated_rgb = rgb.copy()
                
            # Compute anatomical bounding boxes
            row_counts = np.sum(fg_mask, axis=1)
            body_rows = np.where(row_counts > 30)[0]
            if len(body_rows) > 0:
                y_top = int(body_rows[0])
                y_bot = int(body_rows[-1])
                
            head_mask = fg_mask.copy()
            head_mask[:y_top, :] = False
            head_mask[int(y_top + (y_bot - y_top) * 0.25):, :] = False
            head_cols = np.where(np.sum(head_mask, axis=0) > 15)[0]
            if len(head_cols) > 0:
                head_diffs = np.diff(head_cols)
                head_split = np.where(head_diffs > 1)[0]
                head_segs = np.split(head_cols, head_split + 1)
                head_main = max(head_segs, key=len)
                head_x_center = float((head_main[0] + head_main[-1]) / 2.0)
                head_width = float(head_main[-1] - head_main[0])
                
            torso_mask = fg_mask.copy()
            torso_mask[:int(y_top + (y_bot - y_top) * 0.25), :] = False
            torso_mask[int(y_top + (y_bot - y_top) * 0.60):, :] = False
            torso_cols = np.where(np.sum(torso_mask, axis=0) > 25)[0]
            if len(torso_cols) > 0:
                torso_diffs = np.diff(torso_cols)
                torso_split = np.where(torso_diffs > 1)[0]
                torso_segs = np.split(torso_cols, torso_split + 1)
                torso_main = max(torso_segs, key=len)
                torso_x_center = float((torso_main[0] + torso_main[-1]) / 2.0)
                torso_width = float(torso_main[-1] - torso_main[0])
                
            print(f"[Voxel Texture Registration] Y:[{y_top}, {y_bot}] HeadX:{head_x_center:.1f} TorsoX:{torso_x_center:.1f}")
        except Exception as e:
            print(f"[Synthesizer Warning] Voxel texture registration fallback: {e}")
            dilated_rgb = None
            
    bm = bmesh.new()
    import random
    random.seed(42)
    
    cube_colors = []
    voxel_records = []
    
    vg_map = {vg.index: vg.name for vg in cage_obj.vertex_groups}
    
    for c_idx, src_v in enumerate(sampled_verts):
        loc = src_v.co.copy()
        rot = mathutils.Euler((
            random.uniform(-0.03, 0.03),
            random.uniform(-0.03, 0.03),
            random.uniform(-0.03, 0.03)
        ))
        bmesh.ops.create_cube(
            bm, size=voxel_size,
            matrix=mathutils.Matrix.Translation(loc) @ rot.to_matrix().to_4x4()
        )
        
        # Dominant bone group for anatomical color mapping & physics lattice
        groups = {vg_map[g.group]: g.weight for g in src_v.groups if g.group in vg_map}
        if loc.z >= 0.875 or (loc.z >= 0.80 and abs(loc.x) <= 0.12 and abs(loc.y) <= 0.12):
            top_bone = 'Head'
            top_weight = 1.0
        elif abs(loc.x) >= 0.14 and loc.z < 0.875 and loc.z >= 0.40:
            if 'Head' in groups:
                del groups['Head']
            if groups:
                top_bone = max(groups.items(), key=lambda x: x[1])[0]
                if not any(k in top_bone for k in ['Arm', 'ForeArm', 'Hand', 'Shoulder']):
                    prefix = 'Right' if loc.x < 0 else 'Left'
                    top_bone = f'{prefix}Arm'
            else:
                prefix = 'Right' if loc.x < 0 else 'Left'
                top_bone = f'{prefix}Arm'
            top_weight = 1.0
        elif loc.z < 0.45:
            if 'Head' in groups:
                del groups['Head']
            if groups:
                top_bone = max(groups.items(), key=lambda x: x[1])[0]
            else:
                prefix = 'Right' if loc.x < 0 else 'Left'
                top_bone = f'{prefix}UpLeg'
            top_weight = 1.0
        else:
            if 'Head' in groups:
                del groups['Head']
            if groups:
                top_bone = max(groups.items(), key=lambda x: x[1])[0]
            else:
                top_bone = 'Spine'
            top_weight = 1.0
                
        is_arm = any(b in top_bone for b in ['Arm', 'ForeArm', 'Hand', 'Shoulder'])
        is_leg = any(b in top_bone for b in ['UpLeg', 'Leg', 'Foot', 'Toe'])
        is_head = (top_bone == 'Head')
        
        # Bone-Guided Anatomical Texture Emulation
        if is_arm:
            # Arms: Authentic creature skin (olive frog skin) with forearm depth
            r_val, g_val, b_val = int(primary_rgb[0] * 255), int(primary_rgb[1] * 255), int(primary_rgb[2] * 255)
            if abs(loc.x) > 0.40 or loc.z < 0.60:
                r_val, g_val, b_val = int(r_val * 0.92), int(g_val * 0.94), int(b_val * 0.88)
        elif is_head:
            if loc.y > -0.02: # Back and top of skull: solid creature skin
                r_val, g_val, b_val = int(primary_rgb[0] * 255), int(primary_rgb[1] * 255), int(primary_rgb[2] * 255)
            else:
                # Face plate: full width front face
                head_box = (160, 68, 335, 185)
                x_frac = max(0.0, min(1.0, (loc.x - (-0.27)) / (0.54)))
                px = int(round(head_box[0] + x_frac * (head_box[2] - head_box[0])))
                z_frac = max(0.0, min(1.0, (loc.z - 0.84) / (1.18 - 0.84)))
                py = int(round(head_box[3] - z_frac * (head_box[3] - head_box[1])))
                px = max(head_box[0], min(head_box[2] - 1, px))
                py = max(head_box[1], min(head_box[3] - 1, py))
                
                if arr is not None and arr[py, px, 3] > 60:
                    r_val, g_val, b_val = rgb[py, px]
                else:
                    r_val, g_val, b_val = int(primary_rgb[0] * 255), int(primary_rgb[1] * 255), int(primary_rgb[2] * 255)
        elif is_leg:
            # Legs: Olive frog legs, upper hip has dark loincloth
            if loc.z > 0.44:
                r_val, g_val, b_val = int(secondary_rgb[0] * 255), int(secondary_rgb[1] * 255), int(secondary_rgb[2] * 255)
            else:
                r_val, g_val, b_val = int(primary_rgb[0] * 255), int(primary_rgb[1] * 255), int(primary_rgb[2] * 255)
                if loc.z < 0.15:
                    r_val, g_val, b_val = int(r_val * 0.88), int(g_val * 0.90), int(b_val * 0.85)
        else:
            # Torso: Brown leather vest sampled from reference plate
            if loc.y > 0.04:
                r_val, g_val, b_val = int(secondary_rgb[0] * 255), int(secondary_rgb[1] * 255), int(secondary_rgb[2] * 255)
            else:
                torso_box = (175, 190, 315, 330)
                x_frac = max(0.0, min(1.0, (loc.x - (-0.15)) / (0.30)))
                rel_x = abs(x_frac - 0.5) * 2.0
                px = int(round(230 - rel_x * 45))
                z_frac = max(0.0, min(1.0, (loc.z - 0.46) / (0.80 - 0.46)))
                py = int(round(torso_box[3] - z_frac * (torso_box[3] - torso_box[1])))
                px = max(torso_box[0], min(torso_box[2] - 1, px))
                py = max(torso_box[1], min(torso_box[3] - 1, py))
                
                if arr is not None and arr[py, px, 3] > 60:
                    r_val, g_val, b_val = rgb[py, px]
                    if g_val > r_val:
                        r_val, g_val, b_val = int(secondary_rgb[0] * 255), int(secondary_rgb[1] * 255), int(secondary_rgb[2] * 255)
                else:
                    r_val, g_val, b_val = int(secondary_rgb[0] * 255), int(secondary_rgb[1] * 255), int(secondary_rgb[2] * 255)
                
        # Directional cel shading on rear / lateral voxels
        if loc.y > 0.02:
            shade = max(0.65, 1.0 - (loc.y - 0.02) * 1.8)
            r_val = int(r_val * shade)
            g_val = int(g_val * shade)
            b_val = int(b_val * shade)
            
        color_tuple = (r_val / 255.0, g_val / 255.0, b_val / 255.0, 1.0)
        cube_colors.append(color_tuple)
        
        voxel_records.append({
            "id": c_idx,
            "pos": [round(loc.x, 4), round(loc.y, 4), round(loc.z, 4)],
            "color": [round(color_tuple[0], 3), round(color_tuple[1], 3), round(color_tuple[2], 3)],
            "bone": top_bone,
            "weight": round(top_weight, 3)
        })

        
    vox_mesh = bpy.data.meshes.new("FLESH_Voxelmesh_Mesh")
    bm.to_mesh(vox_mesh)
    bm.free()
    
    vox_obj = bpy.data.objects.new("FLESH_Voxelmesh", vox_mesh)
    bpy.context.collection.objects.link(vox_obj)
    
    # Store sampled colors into Point Domain Color Attribute
    ca = vox_mesh.color_attributes.new(name="VoxelColor", type='FLOAT_COLOR', domain='POINT')
    for c_idx, col in enumerate(cube_colors):
        for vi in range(c_idx * 8, min((c_idx + 1) * 8, len(vox_mesh.vertices))):
            ca.data[vi].color = col
            
    # Shared Voxel Cel Shader reading VoxelColor
    mat = bpy.data.materials.new(name="M_Voxelmesh_Emulated")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    attr_node = nodes.new('ShaderNodeAttribute')
    attr_node.attribute_name = 'VoxelColor'
    
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Roughness'].default_value = 0.0
    links.new(attr_node.outputs['Color'], diff.inputs['Color'])
    
    s2rgb = nodes.new('ShaderNodeShaderToRGB')
    links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].position = 0.32
    ramp.color_ramp.elements[0].color = (0.55, 0.55, 0.55, 1.0)
    ramp.color_ramp.elements[1].position = 0.45
    ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    
    mult_light = nodes.new('ShaderNodeMix')
    mult_light.data_type = 'RGBA'
    mult_light.blend_type = 'MULTIPLY'
    mult_light.inputs[0].default_value = 1.0
    links.new(attr_node.outputs['Color'], mult_light.inputs[6])
    links.new(ramp.outputs['Color'], mult_light.inputs[7])
    
    emis = nodes.new('ShaderNodeEmission')
    emis.inputs['Strength'].default_value = 1.0
    links.new(mult_light.outputs[2], emis.inputs['Color'])
    
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(emis.outputs['Emission'], out.inputs['Surface'])
    
    vox_obj.data.materials.append(mat)
    
    # Rigid bone binding per cube (100% single-bone discrete rigid assignment)
    arm_mod = vox_obj.modifiers.new("Rig_Bind", 'ARMATURE')
    arm_mod.object = arm_obj
    
    for vg in cage_obj.vertex_groups:
        vox_obj.vertex_groups.new(name=vg.name)
        
    for c_idx, rec in enumerate(voxel_records):
        cube_verts = list(range(c_idx * 8, min((c_idx + 1) * 8, len(vox_mesh.vertices))))
        t_bone = rec["bone"]
        if t_bone not in vox_obj.vertex_groups:
            vox_obj.vertex_groups.new(name=t_bone)
        vox_obj.vertex_groups[t_bone].add(cube_verts, 1.0, 'REPLACE')
                
    # Clean up temporary cage
    bpy.data.objects.remove(cage_obj, do_unlink=True)
    
    # Export Voxel Lattice JSON for Real-time WebGL / Three.js / Rapier Physics
    try:
        actions_dir = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions')
        os.makedirs(actions_dir, exist_ok=True)
        lattice_json_path = os.path.join(actions_dir, f"{char_id}_voxels.json")
        with open(lattice_json_path, 'w', encoding='utf-8') as f:
            json.dump({
                "charId": char_id,
                "name": char_name,
                "voxelCount": len(voxel_records),
                "voxelSize": voxel_size,
                "voxels": voxel_records
            }, f, indent=2)
        print(f"[Synthesizer] Exported real-time voxel lattice -> {lattice_json_path}")
    except Exception as exp_err:
        print(f"[Synthesizer Warning] Voxel JSON export error: {exp_err}")
        
    return vox_obj

def make_emission_mat(name, rgb, strength=30.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    emis = nodes.new('ShaderNodeEmission')
    emis.inputs['Color'].default_value = (*rgb, 1.0)
    emis.inputs['Strength'].default_value = strength
    
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(emis.outputs['Emission'], out.inputs['Surface'])
    return mat

def extract_conformal_shell(body_obj, shell_name, filter_fn, displace_amt=0.0035, mat=None, mat_outline=None):
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
    
    delete_poly_indices = set(range(len(shell_mesh.polygons))) - set(keep_faces)
    
    bm = bmesh.new()
    bm.from_mesh(shell_mesh)
    faces_to_del = [f for f in bm.faces if f.index in delete_poly_indices]
    bmesh.ops.delete(bm, geom=faces_to_del, context='FACES_ONLY')
    loose_verts = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose_verts, context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
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
    arm_mod.object = bpy.data.objects.get('Armature')
    
    return shell_obj

def build_open_coat(arm_obj, mat_coat, mat_outline, length='knee'):
    name = "FLESH_Open_Coat_Lower"
    old = bpy.data.objects.get(name)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
        
    bm_coat = bmesh.new()
    
    if length == 'calf':
        levels = [
            (0.58, 0.175, 0.145, -0.010, 0.080),
            (0.50, 0.195, 0.160, -0.012, 0.085),
            (0.42, 0.218, 0.180, -0.015, 0.090),
            (0.32, 0.235, 0.198, -0.015, 0.095),
            (0.22, 0.250, 0.212, -0.015, 0.100),
            (0.14, 0.258, 0.222, -0.015, 0.105)
        ]
    else:
        levels = [
            (0.58, 0.175, 0.145, -0.010, 0.080),
            (0.50, 0.195, 0.160, -0.012, 0.085),
            (0.42, 0.215, 0.175, -0.015, 0.090),
            (0.34, 0.230, 0.190, -0.015, 0.095),
            (0.26, 0.240, 0.200, -0.015, 0.100)
        ]

    num_arc_steps = 18
    level_verts = []

    for z, rx, ry, y_mid, front_w in levels:
        cos_val = max(0.2, min(0.85, front_w / rx))
        alpha = math.acos(cos_val)
        start_ang = -alpha
        end_ang = math.pi + alpha
        total_span = end_ang - start_ang
        
        row = []
        for i in range(num_arc_steps):
            frac = float(i) / float(num_arc_steps - 1)
            th = start_ang + frac * total_span
            vx = rx * math.cos(th)
            vy = ry * math.sin(th) + y_mid
            row.append(bm_coat.verts.new((vx, vy, z)))
        level_verts.append(row)
        
    bm_coat.verts.ensure_lookup_table()

    for r in range(len(levels) - 1):
        for i in range(num_arc_steps - 1):
            v_tl = level_verts[r][i]
            v_tr = level_verts[r][i+1]
            v_br = level_verts[r+1][i+1]
            v_bl = level_verts[r+1][i]
            bm_coat.faces.new([v_tl, v_tr, v_br, v_bl])
            
    bmesh.ops.solidify(bm_coat, geom=bm_coat.faces, thickness=0.014)
    bmesh.ops.recalc_face_normals(bm_coat, faces=bm_coat.faces)

    mesh_coat = bpy.data.meshes.new(f"{name}_Mesh")
    bm_coat.to_mesh(mesh_coat)
    bm_coat.free()

    coat_obj = bpy.data.objects.new(name, mesh_coat)
    bpy.context.collection.objects.link(coat_obj)
    coat_obj.data.materials.append(mat_coat)
    if mat_outline:
        coat_obj.data.materials.append(mat_outline)

    arm_mod = coat_obj.modifiers.new("Rig_Bind", 'ARMATURE')
    arm_mod.object = arm_obj

    vg_hips = coat_obj.vertex_groups.new(name="Hips")
    vg_lleg = coat_obj.vertex_groups.new(name="LeftUpLeg")
    vg_rleg = coat_obj.vertex_groups.new(name="RightUpLeg")

    for v in mesh_coat.vertices:
        z = v.co.z
        x = v.co.x
        if z >= 0.48:
            vg_hips.add([v.index], 1.0, 'REPLACE')
        else:
            leg_factor = min(1.0, (0.48 - z) / 0.30)
            hips_factor = 1.0 - leg_factor
            if x > 0.02:
                vg_lleg.add([v.index], leg_factor * 0.90, 'REPLACE')
                vg_hips.add([v.index], hips_factor + leg_factor * 0.10, 'REPLACE')
            elif x < -0.02:
                vg_rleg.add([v.index], leg_factor * 0.90, 'REPLACE')
                vg_hips.add([v.index], hips_factor + leg_factor * 0.10, 'REPLACE')
            else:
                vg_hips.add([v.index], 1.0, 'REPLACE')

    return coat_obj

def build_robe_skirt(arm_obj, mat_robe, mat_outline):
    name = "FLESH_Robe_Skirt"
    old = bpy.data.objects.get(name)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
        
    bm_robe = bmesh.new()
    levels = [
        (0.56, 0.18, 0.15, -0.010),
        (0.46, 0.20, 0.17, -0.012),
        (0.34, 0.23, 0.19, -0.015),
        (0.20, 0.26, 0.22, -0.015),
        (0.08, 0.28, 0.24, -0.015)
    ]
    
    num_steps = 20
    level_verts = []
    for z, rx, ry, y_mid in levels:
        row = []
        for i in range(num_steps):
            th = (2.0 * math.pi * i) / num_steps
            vx = rx * math.cos(th)
            vy = ry * math.sin(th) + y_mid
            row.append(bm_robe.verts.new((vx, vy, z)))
        level_verts.append(row)
        
    bm_robe.verts.ensure_lookup_table()
    for r in range(len(levels) - 1):
        for i in range(num_steps):
            i_next = (i + 1) % num_steps
            v_tl = level_verts[r][i]
            v_tr = level_verts[r][i_next]
            v_br = level_verts[r+1][i_next]
            v_bl = level_verts[r+1][i]
            bm_robe.faces.new([v_tl, v_tr, v_br, v_bl])
            
    bmesh.ops.solidify(bm_robe, geom=bm_robe.faces, thickness=0.014)
    bmesh.ops.recalc_face_normals(bm_robe, faces=bm_robe.faces)
    
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    bm_robe.to_mesh(mesh)
    bm_robe.free()
    
    robe_obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(robe_obj)
    robe_obj.data.materials.append(mat_robe)
    if mat_outline:
        robe_obj.data.materials.append(mat_outline)
        
    arm_mod = robe_obj.modifiers.new("Rig_Bind", 'ARMATURE')
    arm_mod.object = arm_obj
    
    vg_hips = robe_obj.vertex_groups.new(name="Hips")
    vg_lleg = robe_obj.vertex_groups.new(name="LeftUpLeg")
    vg_rleg = robe_obj.vertex_groups.new(name="RightUpLeg")
    
    for v in mesh.vertices:
        z = v.co.z
        x = v.co.x
        if z >= 0.46:
            vg_hips.add([v.index], 1.0, 'REPLACE')
        else:
            leg_factor = min(1.0, (0.46 - z) / 0.36)
            hips_factor = 1.0 - leg_factor
            if x > 0.02:
                vg_lleg.add([v.index], leg_factor * 0.85, 'REPLACE')
                vg_hips.add([v.index], hips_factor + leg_factor * 0.15, 'REPLACE')
            elif x < -0.02:
                vg_rleg.add([v.index], leg_factor * 0.85, 'REPLACE')
                vg_hips.add([v.index], hips_factor + leg_factor * 0.15, 'REPLACE')
            else:
                vg_hips.add([v.index], 1.0, 'REPLACE')
                
    return robe_obj

def build_procedural_hair(arm_obj, style, mat_hair, mat_outline):
    name = "FLESH_Hair_Sculpt"
    old = bpy.data.objects.get(name)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
        
    bm = bmesh.new()
    
    if style == 'wild_cloud':
        clusters = [
            (-0.16, -0.02, 1.02, 0.095, (1.25, 1.0, 1.45)),
            (0.16, -0.02, 1.02, 0.095, (1.25, 1.0, 1.45)),
            (-0.14, 0.08, 1.05, 0.105, (1.2, 1.1, 1.3)),
            (0.14, 0.08, 1.05, 0.105, (1.2, 1.1, 1.3)),
            (0.0, 0.09, 1.12, 0.115, (1.3, 1.1, 1.15)),
            (-0.09, 0.01, 1.14, 0.090, (1.1, 1.0, 1.2)),
            (0.09, 0.01, 1.14, 0.090, (1.1, 1.0, 1.2)),
            (0.0, -0.08, 1.10, 0.080, (1.4, 0.9, 0.85)),
            (-0.19, -0.05, 0.94, 0.075, (1.0, 1.2, 1.3)),
            (0.19, -0.05, 0.94, 0.075, (1.0, 1.2, 1.3)),
            (0.0, 0.12, 0.98, 0.095, (1.4, 1.0, 1.2))
        ]
        for cx, cy, cz, r, scale in clusters:
            bmesh.ops.create_icosphere(
                bm, subdivisions=2, radius=r,
                matrix=(
                    mathutils.Matrix.Translation((cx, cy, cz)) @
                    mathutils.Matrix.Diagonal((*scale, 1.0))
                )
            )
    elif style == 'spikes':
        spike_locs = [
            (0.0, -0.04, 1.18, 0.06, 0.18, 0, 15, 0),
            (0.10, -0.02, 1.16, 0.05, 0.16, 12, 10, -15),
            (-0.10, -0.02, 1.16, 0.05, 0.16, -12, 10, 15),
            (0.14, 0.03, 1.08, 0.05, 0.15, 20, 0, -25),
            (-0.14, 0.03, 1.08, 0.05, 0.15, -20, 0, 25),
            (0.0, 0.08, 1.12, 0.06, 0.16, 0, -18, 0),
            (0.12, 0.08, 1.02, 0.05, 0.14, 15, -15, -20),
            (-0.12, 0.08, 1.02, 0.05, 0.14, -15, -15, 20)
        ]
        for cx, cy, cz, r, depth, rx, ry, rz in spike_locs:
            bmesh.ops.create_cone(
                bm, cap_ends=True, segments=10,
                radius1=r, radius2=0.005, depth=depth,
                matrix=(
                    mathutils.Matrix.Translation((cx, cy, cz)) @
                    mathutils.Euler((math.radians(rx), math.radians(ry), math.radians(rz))).to_matrix().to_4x4()
                )
            )
    elif style == 'cowl_hood':
        bmesh.ops.create_cone(
            bm, cap_ends=True, segments=16,
            radius1=0.18, radius2=0.08, depth=0.28,
            matrix=(
                mathutils.Matrix.Translation((0.0, 0.04, 1.06)) @
                mathutils.Euler((math.radians(-12), 0, 0)).to_matrix().to_4x4()
            )
        )
    elif style == 'helmet':
        bmesh.ops.create_cube(
            bm, size=1.0,
            matrix=(
                mathutils.Matrix.Translation((0.0, -0.02, 1.06)) @
                mathutils.Matrix.Diagonal((0.26, 0.28, 0.26, 1.0))
            )
        )
    else:
        bmesh.ops.create_icosphere(
            bm, subdivisions=3, radius=0.15,
            matrix=(
                mathutils.Matrix.Translation((0.0, 0.01, 1.05)) @
                mathutils.Matrix.Diagonal((1.1, 1.1, 1.05, 1.0))
            )
        )
        
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    
    hair_obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(hair_obj)
    hair_obj.data.materials.append(mat_hair)
    if mat_outline:
        hair_obj.data.materials.append(mat_outline)
        
    arm_mod = hair_obj.modifiers.new("Rig_Bind", 'ARMATURE')
    arm_mod.object = arm_obj
    vg = hair_obj.vertex_groups.new(name="Head")
    vg.add(range(len(mesh.vertices)), 1.0, 'REPLACE')
    
    return hair_obj

def build_facial_features(arm_obj, style, mat_hair, mat_outline):
    name = "FLESH_Facial_Details"
    old = bpy.data.objects.get(name)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
        
    bm = bmesh.new()
    
    if style in ['einstein', 'mustache']:
        for sign in [-1.0, 1.0]:
            bmesh.ops.create_cone(
                bm, cap_ends=True, segments=12,
                radius1=0.022, radius2=0.006, depth=0.075,
                matrix=(
                    mathutils.Matrix.Translation((sign * 0.034, -0.165, 0.885)) @
                    mathutils.Euler((math.radians(12), math.radians(sign * 35), math.radians(-sign * 15))).to_matrix().to_4x4()
                )
            )
        for sign in [-1.0, 1.0]:
            bmesh.ops.create_cube(
                bm, size=1.0,
                matrix=(
                    mathutils.Matrix.Translation((sign * 0.048, -0.162, 0.985)) @
                    mathutils.Euler((0, 0, math.radians(-sign * 15))).to_matrix().to_4x4() @
                    mathutils.Matrix.Diagonal((0.048, 0.014, 0.016, 1.0))
                )
            )
            
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    bm.to_mesh(mesh)
    bm.free()
    
    face_obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(face_obj)
    face_obj.data.materials.append(mat_hair)
    if mat_outline:
        face_obj.data.materials.append(mat_outline)
        
    arm_mod = face_obj.modifiers.new("Rig_Bind", 'ARMATURE')
    arm_mod.object = arm_obj
    vg = face_obj.vertex_groups.new(name="Head")
    vg.add(range(len(mesh.vertices)), 1.0, 'REPLACE')
    return face_obj

def build_hand_sigil(arm_obj, mat_glow):
    name = "FLESH_Hand_Sigil"
    old = bpy.data.objects.get(name)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
        
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.09, minor_radius=0.018,
        major_segments=24, minor_segments=8,
        location=(0, 0, 0)
    )
    sigil = bpy.context.active_object
    sigil.name = name
    sigil.data.materials.clear()
    sigil.data.materials.append(mat_glow)
    sigil.parent = arm_obj
    sigil.parent_type = 'BONE'
    sigil.parent_bone = 'LeftHand'
    sigil.location = (0.08, -0.04, 0.0)
    sigil.rotation_euler = (math.radians(90), 0, 0)
    return sigil

def analyze_image_palette(img_path):
    if not os.path.exists(img_path):
        return None
    try:
        im = Image.open(img_path).convert("RGBA")
        w, h = im.size
        arr = np.array(im)
        
        rgb = arr[:, :, :3].astype(float)
        alpha = arr[:, :, 3]
        
        # 1. Sample 12x12 corner patches to detect solid/studio backgrounds
        c_tl = rgb[:12, :12]
        c_tr = rgb[:12, -12:]
        c_bl = rgb[-12:, :12]
        c_br = rgb[-12:, -12:]
        corners = np.concatenate([c.reshape(-1, 3) for c in [c_tl, c_tr, c_bl, c_br]], axis=0)
        corner_mean = np.mean(corners, axis=0)
        corner_std = np.std(corners, axis=0).mean()
        
        # If corners are uniform (white, light grey, dark studio, etc.)
        if corner_std < 24 or corner_mean.mean() > 225 or corner_mean.mean() < 25:
            dist_bg = np.linalg.norm(rgb - corner_mean, axis=-1)
            is_fg = (alpha > 60) & (dist_bg > 30)
        else:
            is_fg = alpha > 60
            
        if not np.any(is_fg):
            is_fg = alpha > 60
            
        fg_pixels = rgb[is_fg] / 255.0
        
        fg_head = is_fg[:int(h*0.35), :]
        fg_mid  = is_fg[int(h*0.35):int(h*0.68), :]
        fg_bot  = is_fg[int(h*0.68):, :]
        
        def slice_median(slice_mask, y_start, y_end, default=(0.5, 0.5, 0.5)):
            if not np.any(slice_mask):
                return default
            pixels = rgb[y_start:y_end, :][slice_mask] / 255.0
            med = np.median(pixels, axis=0)
            return (float(med[0]), float(med[1]), float(med[2]))
            
        hair_rgb = slice_median(fg_head, 0, int(h*0.35), default=(0.85, 0.85, 0.88))
        torso_rgb = slice_median(fg_mid, int(h*0.35), int(h*0.68), default=(0.75, 0.65, 0.50))
        pants_rgb = slice_median(fg_bot, int(h*0.68), h, default=(0.14, 0.14, 0.18))
        
        # Dynamic Skin Tone Detection (check for creature greens, orcs, goblins, or image skin)
        greens = fg_pixels[(fg_pixels[:, 1] > fg_pixels[:, 0]*0.90) & (fg_pixels[:, 1] > fg_pixels[:, 2]*1.15) & (fg_pixels[:, 1] > 0.16)]
        if len(greens) > 400:
            med_g = np.median(greens, axis=0)
            skin_rgb = (float(med_g[0]), float(med_g[1]), float(med_g[2]))
        else:
            # Use foreground head median as skin if no hair or humanoid
            skin_rgb = hair_rgb if hair_rgb != (0.85, 0.85, 0.88) else (0.94, 0.80, 0.70)
        
        return {
            'skin': skin_rgb,
            'hair': hair_rgb,
            'torso': torso_rgb,
            'pants': pants_rgb,
            'accent': (0.92, 0.80, 0.22)
        }
    except Exception as e:
        print(f"[Palette Analyzer Warning] {e}")
        return None

def build_amphibian_features(body_obj, arm_obj, mat_skin, mat_outline, mat_eye, mat_pupil):
    # 1. Morph Head Vertices for Amphibian Skull Shape
    vg_head = body_obj.vertex_groups.get('Head')
    head_idx = vg_head.index if vg_head else -1

    for v in body_obj.data.vertices:
        is_head = any(g.group == head_idx and g.weight > 0.2 for g in v.groups) or v.co.z >= 0.82
        if is_head and v.co.z >= 0.80:
            dz = v.co.z - 0.80
            t = min(1.0, max(0.0, dz / 0.44))
            # Widen skull horizontally
            v.co.x *= (1.0 + 0.38 * t)
            # Squat skull vertically
            v.co.z = 0.80 + dz * 0.86
            # Broaden snout / jaw forward
            if v.co.y < 0:
                v.co.y *= (1.0 + 0.25 * (1.0 - abs(t - 0.45)))

    body_obj.data.update()

    # 2. Perched Brow Ridges (Frog Skin)
    name_brows = "FLESH_Frog_Brows"
    old_b = bpy.data.objects.get(name_brows)
    if old_b:
        bpy.data.objects.remove(old_b, do_unlink=True)
        
    bm_brows = bmesh.new()
    for sign in [-1.0, 1.0]:
        bmesh.ops.create_icosphere(
            bm_brows, subdivisions=2, radius=0.088,
            matrix=(
                mathutils.Matrix.Translation((sign * 0.165, -0.08, 1.10)) @
                mathutils.Matrix.Diagonal((1.1, 1.15, 1.05, 1.0))
            )
        )
    bmesh.ops.recalc_face_normals(bm_brows, faces=bm_brows.faces)
    mesh_brows = bpy.data.meshes.new(f"{name_brows}_Mesh")
    bm_brows.to_mesh(mesh_brows)
    bm_brows.free()

    brow_obj = bpy.data.objects.new(name_brows, mesh_brows)
    bpy.context.collection.objects.link(brow_obj)
    brow_obj.data.materials.append(mat_skin)
    if mat_outline:
        brow_obj.data.materials.append(mat_outline)

    arm_b = brow_obj.modifiers.new("Rig_Bind", 'ARMATURE')
    arm_b.object = arm_obj
    vg_b = brow_obj.vertex_groups.new(name="Head")
    vg_b.add(range(len(mesh_brows.vertices)), 1.0, 'REPLACE')

    # 3. Bulbous Golden Eyeballs
    name_eyes = "FLESH_Frog_Eyeballs"
    old_e = bpy.data.objects.get(name_eyes)
    if old_e:
        bpy.data.objects.remove(old_e, do_unlink=True)
        
    bm_balls = bmesh.new()
    for sign in [-1.0, 1.0]:
        bmesh.ops.create_icosphere(
            bm_balls, subdivisions=2, radius=0.078,
            matrix=(
                mathutils.Matrix.Translation((sign * 0.165, -0.125, 1.115)) @
                mathutils.Matrix.Diagonal((1.0, 1.05, 1.0, 1.0))
            )
        )
    bmesh.ops.recalc_face_normals(bm_balls, faces=bm_balls.faces)
    mesh_balls = bpy.data.meshes.new(f"{name_eyes}_Mesh")
    bm_balls.to_mesh(mesh_balls)
    bm_balls.free()

    balls_obj = bpy.data.objects.new(name_eyes, mesh_balls)
    bpy.context.collection.objects.link(balls_obj)
    balls_obj.data.materials.append(mat_eye)
    if mat_outline:
        balls_obj.data.materials.append(mat_outline)

    arm_e = balls_obj.modifiers.new("Rig_Bind", 'ARMATURE')
    arm_e.object = arm_obj
    vg_e = balls_obj.vertex_groups.new(name="Head")
    vg_e.add(range(len(mesh_balls.vertices)), 1.0, 'REPLACE')

    # 4. Slit Pupils & Curved Frown Mouth
    name_pupils = "FLESH_Frog_Pupils"
    old_p = bpy.data.objects.get(name_pupils)
    if old_p:
        bpy.data.objects.remove(old_p, do_unlink=True)
        
    bm_pupils = bmesh.new()
    for sign in [-1.0, 1.0]:
        bmesh.ops.create_cube(
            bm_pupils, size=1.0,
            matrix=(
                mathutils.Matrix.Translation((sign * 0.165, -0.202, 1.115)) @
                mathutils.Euler((0, 0, math.radians(-sign * 5))).to_matrix().to_4x4() @
                mathutils.Matrix.Diagonal((0.052, 0.012, 0.018, 1.0))
            )
        )
    # Curved wide mouth slit
    for sign in [-1.0, 1.0]:
        bmesh.ops.create_cube(
            bm_pupils, size=1.0,
            matrix=(
                mathutils.Matrix.Translation((sign * 0.08, -0.278, 0.935)) @
                mathutils.Euler((0, 0, math.radians(-sign * 8))).to_matrix().to_4x4() @
                mathutils.Matrix.Diagonal((0.15, 0.018, 0.016, 1.0))
            )
        )
        
    bmesh.ops.recalc_face_normals(bm_pupils, faces=bm_pupils.faces)
    mesh_pupils = bpy.data.meshes.new(f"{name_pupils}_Mesh")
    bm_pupils.to_mesh(mesh_pupils)
    bm_pupils.free()

    pupils_obj = bpy.data.objects.new(name_pupils, mesh_pupils)
    bpy.context.collection.objects.link(pupils_obj)
    pupils_obj.data.materials.append(mat_pupil)

    arm_p = pupils_obj.modifiers.new("Rig_Bind", 'ARMATURE')
    arm_p.object = arm_obj
    vg_p = pupils_obj.vertex_groups.new(name="Head")
    vg_p.add(range(len(mesh_pupils.vertices)), 1.0, 'REPLACE')
    
    return [brow_obj, balls_obj, pupils_obj]

def attach_spear(arm_obj):
    old_s = bpy.data.objects.get('spear_A')
    if old_s:
        bpy.data.objects.remove(old_s, do_unlink=True)
        
    spear_path = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\weapons\kaykit_fantasy_weapons\spear_A.gltf')
    if not os.path.exists(spear_path):
        print(f"[Weapon Warning] Spear model not found at {spear_path}")
        return None
        
    bpy.ops.import_scene.gltf(filepath=spear_path)
    spear = bpy.data.objects.get('spear_A')
    if not spear:
        return None
        
    # Translate along shaft so grip sits in palm, and rotate 90 deg around X so spearhead points upright
    spear.data.transform(mathutils.Matrix.Translation((0, 0, -0.45)))
    spear.data.transform(mathutils.Matrix.Rotation(math.radians(90), 4, 'X'))
    spear.parent = arm_obj
    spear.parent_type = 'BONE'
    spear.parent_bone = 'RightHand'
    spear.scale = (0.50, 0.50, 0.50)
    spear.location = (0.02, 0.05, 0.10)
    return spear

def attach_sword(arm_obj):
    old_w = bpy.data.objects.get('sword_A')
    if old_w:
        bpy.data.objects.remove(old_w, do_unlink=True)
        
    sword_path = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\weapons\kaykit_fantasy_weapons\sword_A.gltf')
    if not os.path.exists(sword_path):
        return None
        
    bpy.ops.import_scene.gltf(filepath=sword_path)
    sword = bpy.data.objects.get('sword_A')
    if not sword:
        return None
        
    sword.data.transform(mathutils.Matrix.Rotation(math.radians(90), 4, 'X'))
    sword.parent = arm_obj
    sword.parent_type = 'BONE'
    sword.parent_bone = 'RightHand'
    sword.scale = (0.55, 0.55, 0.55)
    sword.location = (0.02, 0.04, 0.05)
    return sword

def film_8way_damage_breakaway_action(arm_obj, vox_obj, out_path, num_frames=8, resolution=256, supersample=256):
    act = bpy.data.actions.get('Hit_Chest')
    if not act:
        print("[Damage Warning] Hit_Chest action not found, skipping breakaway filming.")
        return False
    arm_obj.animation_data.action = act
    
    impact_center = mathutils.Vector((0.01, -0.07, 0.62))
    impact_radius = 0.12
    
    mesh = vox_obj.data
    num_cubes = len(mesh.vertices) // 8
    dislodge_indices = []
    
    for c_idx in range(num_cubes):
        v_indices = list(range(c_idx * 8, (c_idx + 1) * 8))
        center = sum((mesh.vertices[vi].co for vi in v_indices), mathutils.Vector((0, 0, 0))) / 8.0
        if (center - impact_center).length <= impact_radius and center.y < -0.01:
            dislodge_indices.append(c_idx)
            
    if not dislodge_indices:
        return False
        
    print(f"[Damage Action] Dislodging {len(dislodge_indices)} chest voxels under kinetic impact physics!")
    
    breakaway_mesh = mesh.copy()
    breakaway_obj = bpy.data.objects.new("FLESH_Breakaway_Voxels", breakaway_mesh)
    bpy.context.collection.objects.link(breakaway_obj)
    breakaway_obj.matrix_world = vox_obj.matrix_world.copy()
    if vox_obj.data.materials:
        breakaway_obj.data.materials.append(vox_obj.data.materials[0])
        
    orig_coords_main = [v.co.copy() for v in mesh.vertices]
    for c_idx in dislodge_indices:
        for vi in range(c_idx * 8, (c_idx + 1) * 8):
            mesh.vertices[vi].co = mathutils.Vector((0, 0, -100))
    mesh.update()
    
    dislodge_set = set(dislodge_indices)
    for c_idx in range(num_cubes):
        if c_idx not in dislodge_set:
            for vi in range(c_idx * 8, (c_idx + 1) * 8):
                breakaway_mesh.vertices[vi].co = mathutils.Vector((0, 0, -100))
    breakaway_mesh.update()
    
    for m in list(breakaway_obj.modifiers):
        if m.type == 'ARMATURE':
            breakaway_obj.modifiers.remove(m)
            
    import random
    random.seed(42)
    cube_velocities = []
    cube_initial_centers = []
    
    for c_idx in dislodge_indices:
        v_indices = list(range(c_idx * 8, (c_idx + 1) * 8))
        center = sum((breakaway_mesh.vertices[vi].co for vi in v_indices), mathutils.Vector((0, 0, 0))) / 8.0
        cube_initial_centers.append(center.copy())
        
        dir_vec = (center - impact_center).normalized() if (center - impact_center).length > 0.001 else mathutils.Vector((0, -1, 0))
        vel = dir_vec * random.uniform(0.35, 0.75) + mathutils.Vector((
            random.uniform(-0.15, 0.15),
            -random.uniform(0.30, 0.65),
            random.uniform(0.10, 0.45)
        ))
        rot_axis = mathutils.Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized()
        rot_speed = random.uniform(3.0, 8.0)
        cube_velocities.append((vel, rot_axis, rot_speed))
        
    scene = bpy.context.scene
    scene.render.resolution_x = supersample
    scene.render.resolution_y = supersample
    scene.render.film_transparent = True
    
    cam_rot = bpy.data.objects['Cam_Rot_Empty']
    angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]
    
    f_start = int(act.frame_range[0])
    f_end = int(act.frame_range[1])
    step = (f_end - f_start) / float(num_frames)
    frame_indices = [int(round(f_start + i * step)) for i in range(num_frames)]
    
    master_atlas = Image.new('RGBA', (resolution * num_frames, resolution * len(angles_deg)), (0, 0, 0, 0))
    temp_dir = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\temp_film_golem')
    os.makedirs(temp_dir, exist_ok=True)
    
    print(f"--- Filming 8-Way Damage (Kinetic Voxel Breakaway) -> {out_path} ({resolution}x{resolution} tiles) ---")
    
    for row_idx, deg in enumerate(angles_deg):
        cam_rot.rotation_euler[2] = math.radians(deg)
        bpy.context.view_layer.update()
        
        for col_idx, f_num in enumerate(frame_indices):
            scene.frame_set(f_num)
            
            if col_idx >= 2:
                dt = (col_idx - 1.5) * 0.12
                gravity = mathutils.Vector((0, 0, -1.8)) * (dt * dt)
                for idx, c_idx in enumerate(dislodge_indices):
                    vel, rot_axis, rot_speed = cube_velocities[idx]
                    disp = vel * dt + gravity
                    rot_mat = mathutils.Matrix.Rotation(rot_speed * dt, 4, rot_axis)
                    orig_c = cube_initial_centers[idx]
                    curr_c = orig_c + disp
                    for vi in range(c_idx * 8, (c_idx + 1) * 8):
                        rel = orig_coords_main[vi] - orig_c
                        breakaway_mesh.vertices[vi].co = curr_c + (rot_mat @ rel)
                breakaway_mesh.update()
            else:
                for idx, c_idx in enumerate(dislodge_indices):
                    for vi in range(c_idx * 8, (c_idx + 1) * 8):
                        breakaway_mesh.vertices[vi].co = mathutils.Vector((0, 0, -100))
                breakaway_mesh.update()
                
            bpy.context.view_layer.update()
            
            tmp_path = os.path.join(temp_dir, f"r{row_idx}_c{col_idx}.png")
            scene.render.filepath = tmp_path
            bpy.ops.render.render(write_still=True)
            
            with Image.open(tmp_path) as im:
                tile = im.convert('RGBA')
                if tile.size != (resolution, resolution):
                    tile = tile.resize((resolution, resolution), Image.Resampling.LANCZOS)
                master_atlas.paste(tile, (col_idx * resolution, row_idx * resolution), tile)
                
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    master_atlas.save(out_path)
    print(f"Successfully saved 8-way damage breakaway action atlas: {out_path}")
    
    for vi, co in enumerate(orig_coords_main):
        mesh.vertices[vi].co = co
    mesh.update()
    bpy.data.objects.remove(breakaway_obj, do_unlink=True)
    return True

def film_8way_action(action_name, out_path, num_frames=8, resolution=256, supersample=256):
    arm = bpy.data.objects['Armature']
    if action_name == 'Hit_Chest':
        vox_obj = bpy.data.objects.get("FLESH_Voxelmesh")
        if vox_obj:
            success = film_8way_damage_breakaway_action(arm, vox_obj, out_path, num_frames=num_frames, resolution=resolution, supersample=supersample)
            if success:
                return
    act = bpy.data.actions.get(action_name)
    if not act:
        print(f"Action {action_name} not found, skipping!")
        return
    arm.animation_data.action = act
    
    scene = bpy.context.scene
    scene.render.resolution_x = supersample
    scene.render.resolution_y = supersample
    scene.render.film_transparent = True
    
    cam_rot = bpy.data.objects['Cam_Rot_Empty']
    angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]
    
    f_start = int(act.frame_range[0])
    f_end = int(act.frame_range[1])
    step = (f_end - f_start) / float(num_frames)
    frame_indices = [int(round(f_start + i * step)) for i in range(num_frames)]
    
    master_atlas = Image.new('RGBA', (resolution * num_frames, resolution * len(angles_deg)), (0, 0, 0, 0))
    temp_dir = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\temp_film_golem')
    os.makedirs(temp_dir, exist_ok=True)
    
    print(f"--- Filming 8-Way {action_name} -> {out_path} ({resolution}x{resolution} tiles) ---")
    
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
                tile = im.convert('RGBA')
                if tile.size != (resolution, resolution):
                    tile = tile.resize((resolution, resolution), Image.Resampling.LANCZOS)
                master_atlas.paste(tile, (col_idx * resolution, row_idx * resolution), tile)
                
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    master_atlas.save(out_path)
    print(f"Successfully saved 8-way action atlas: {out_path}")

def run_flesh_synthesis(recipe_data):
    char_id = (recipe_data.get('id') or recipe_data.get('name') or 'custom_golem').lower().replace(' ', '_').replace('-', '_')
    char_name = recipe_data.get('name') or char_id.replace('_', ' ').title()
    prompt = recipe_data.get('prompt') or ''
    prompt_lower = (prompt + ' ' + char_id).lower()
    
    print(f"============================================================")
    print(f"=== SOVEREIGN FLESH GOLEM PIPELINE: {char_name} ({char_id}) ===")
    print(f"============================================================")
    
    img_path = recipe_data.get('image_path')
    raw_b64 = recipe_data.get('image_base64')
    
    # Check if image_base64 or image_path is a relative web path (e.g. /assets/portraits/...)
    web_public = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public')
    for candidate_src in [img_path, raw_b64]:
        if candidate_src and isinstance(candidate_src, str) and (candidate_src.startswith('/') or candidate_src.startswith('assets') or candidate_src.startswith('actions')):
            rel = candidate_src.lstrip('/\\')
            candidate_path = os.path.join(web_public, rel)
            if os.path.exists(candidate_path):
                img_path = candidate_path
                break

    if not img_path and raw_b64 and isinstance(raw_b64, str):
        try:
            temp_img_dir = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\temp_tiles')
            os.makedirs(temp_img_dir, exist_ok=True)
            candidate_out = os.path.join(temp_img_dir, f"ref_{char_id}.png")
            b64 = raw_b64.split(',', 1)[1] if ',' in raw_b64 else raw_b64
            with open(candidate_out, 'wb') as f:
                f.write(base64.b64decode(b64))
            img_path = candidate_out
            print(f"Decoded input reference image -> {img_path}")
        except Exception as b64_err:
            print(f"[Reference Image Decode Notice] {b64_err} (Continuing with procedural palette)")
            img_path = None
        
    extracted_palette = analyze_image_palette(img_path) if (img_path and os.path.exists(img_path)) else None
    
    # 1. Species & Archetype Detection
    is_amphibian = has_word(prompt_lower, 'bullywug', 'frog', 'toad', 'grung', 'amphibian', 'kuotoa', 'kuo-toa')
    is_reptilian = has_word(prompt_lower, 'lizard', 'lizardfolk', 'kobold', 'dragonborn', 'serpent', 'snake', 'yuan-ti')
    is_goblinoid = has_word(prompt_lower, 'orc', 'goblin', 'hobgoblin', 'bugbear', 'troll')
    is_dragon = has_word(prompt_lower, 'dragon', 'wyrm', 'drake', 'apex_wyrm')
    
    archetype = recipe_data.get('archetype', 'auto')
    if archetype == 'auto':
        if is_dragon:
            archetype = 'wyrm'
        elif has_word(prompt_lower, 'wolf', 'beast', 'displacer', 'rust monster', 'quadruped'):
            archetype = 'quadruped'
        elif has_word(prompt_lower, 'beholder', 'mimic', 'blob', 'slime', 'aberration', 'blobfish'):
            archetype = 'blob'
        else:
            archetype = 'humanoid'

    style = recipe_data.get('style', 'auto')
    if style == 'auto':
        if img_path and os.path.exists(img_path):
            style = 'uv_composite'
        else:
            style = 'pixel_art'

    print(f"[Synthesizer Config] Archetype: {archetype.upper()} | Style: {style.upper()}")
    
    # Automatic Canonicalization of Reference Art
    canonical_plate_path = recipe_data.get('canonical_image_path')
    if not canonical_plate_path and img_path and os.path.exists(img_path):
        temp_dir = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\temp_tiles')
        canonical_plate_path = os.path.join(temp_dir, f"canonical_{char_id}.png")
        try:
            tools_dir = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\scripts\tools')
            if tools_dir not in sys.path:
                sys.path.append(tools_dir)
            from tpose_canonicalizer import canonicalize_character_image
            canonicalize_character_image(img_path, canonical_plate_path, prompt=prompt)
            print(f"[Canonicalizer] Autonomously synthesized canonical plate -> {canonical_plate_path}")
        except Exception as canon_err:
            print(f"[Canonicalizer Notice] {canon_err} (Using direct reference art)")
            canonical_plate_path = img_path

    is_female = recipe_data.get('gender') == 'female' or has_word(prompt_lower, 'female', 'woman', 'girl', 'sorceress', 'heroine', 'lunaria')
    
    if archetype == 'wyrm':
        base_blend = r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\apex_wyrm_dragon.blend'
    elif archetype == 'quadruped':
        base_blend = r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\characters\displacer_beast_production.blend'
    elif archetype == 'blob':
        base_blend = r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\game_monster_beholder.blend'
    else:
        base_blend = r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_female_mannequin.blend' if is_female else r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_male_mannequin.blend'
    
    print(f"Opening Master FLESH Base Model: {base_blend}")
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(base_blend))
    
    arm = bpy.data.objects.get('Armature') or bpy.data.objects.get('Root') or bpy.data.objects.get('Rig')
    body = bpy.data.objects.get('LPC_Decivoxel_Flesh_Male') or bpy.data.objects.get('LPC_Decivoxel_Flesh_Female') or bpy.data.objects.get('LPC_Decivoxel_Flesh_Fused') or bpy.data.objects.get('Mesh')
    
    for extra in ['Modular_Hair_JRPG_Adventurer', 'Modular_Hair_JRPG_Heroine_Locks', 'LPC_Face_Decal_Male', 'LPC_Face_Decal_Female', 'LPC_Face_Decal']:
        obj = bpy.data.objects.get(extra)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)
            
    mat_outline = bpy.data.materials.get('LPC_Outline_Mat') or bpy.data.materials.get('M_Outline')
    
    # 2. Material Cel Configuration
    if is_amphibian:
        default_skin = (0.45, 0.52, 0.22)   # Frog green / olive
        default_torso = (0.38, 0.24, 0.14)  # Leather hide vest
        default_pants = (0.30, 0.20, 0.12)  # Dark hide loincloth
    elif is_goblinoid:
        default_skin = (0.38, 0.50, 0.25)
        default_torso = (0.42, 0.28, 0.18)
        default_pants = (0.22, 0.18, 0.14)
    else:
        default_skin = (0.95, 0.82, 0.72)
        default_torso = (0.78, 0.68, 0.52)
        default_pants = (0.13, 0.13, 0.17)

    skin_rgb = extracted_palette['skin'] if extracted_palette else default_skin
    hair_rgb = extracted_palette['hair'] if extracted_palette else (0.98, 0.98, 0.98)
    torso_rgb = extracted_palette['torso'] if extracted_palette else default_torso
    pants_rgb = extracted_palette['pants'] if extracted_palette else default_pants
    accent_rgb = extracted_palette['accent'] if extracted_palette else (0.92, 0.80, 0.22)
    
    if has_word(prompt_lower, 'einstein'):
        hair_rgb = (0.98, 0.98, 1.0)
        torso_rgb = (0.80, 0.70, 0.54)
        pants_rgb = (0.13, 0.13, 0.16)
    elif has_word(prompt_lower, 'rogue', 'shadow', 'ninja', 'assassin'):
        hair_rgb = (0.15, 0.15, 0.18)
        torso_rgb = (0.16, 0.18, 0.24)
        pants_rgb = (0.10, 0.11, 0.14)
    elif has_word(prompt_lower, 'paladin', 'knight', 'crusader'):
        hair_rgb = (0.85, 0.70, 0.25)
        torso_rgb = (0.70, 0.72, 0.78)
        pants_rgb = (0.20, 0.22, 0.28)
    elif (not is_amphibian) and has_word(prompt_lower, 'mage', 'sorcerer', 'sorceress', 'wizard', 'witch', 'warlock'):
        hair_rgb = (0.92, 0.88, 0.96)
        torso_rgb = (0.35, 0.15, 0.50)
        pants_rgb = (0.18, 0.10, 0.28)
        
    mat_skin = make_cel_mat('M_Skin_Procedural', skin_rgb, tuple(c * 0.7 for c in skin_rgb), ramp_stops=(0.32, 0.40))
    mat_hair = make_cel_mat('M_Hair_Procedural', hair_rgb, tuple(c * 0.75 for c in hair_rgb), ramp_stops=(0.25, 0.35))
    mat_torso = make_cel_mat('M_Torso_Procedural', torso_rgb, tuple(c * 0.6 for c in torso_rgb), highlight_rgb=tuple(min(1.0, c * 1.15) for c in torso_rgb), ramp_stops=(0.35, 0.45))
    mat_pants = make_cel_mat('M_Pants_Procedural', pants_rgb, tuple(c * 0.5 for c in pants_rgb), ramp_stops=(0.30, 0.40))
    mat_accent = make_cel_mat('M_Accent_Procedural', accent_rgb, tuple(c * 0.6 for c in accent_rgb), ramp_stops=(0.25, 0.35))
    mat_glow = make_emission_mat('M_Sigil_Glow', (0.2, 0.85, 1.0), strength=35.0)
    
    mat_eye = make_cel_mat('M_Frog_Eye', (0.92, 0.82, 0.25), (0.65, 0.52, 0.12), ramp_stops=(0.35, 0.48))
    mat_pupil = make_cel_mat('M_Frog_Pupil', (0.05, 0.05, 0.05), (0.02, 0.02, 0.02))

    if body:
        body.data.materials.clear()
        
        # Apply Selected Style
        if style == 'uv_composite' and canonical_plate_path and os.path.exists(canonical_plate_path):
            print(f"[Synthesizer] Applying Front UV Surface Compositor with: {canonical_plate_path}")
            ref_tex = bpy.data.images.load(canonical_plate_path)
            apply_front_uv_projection(body)
            mat_comp = make_composite_surface_mat('M_Skin_UV_Composite', skin_rgb, ref_tex)
            body.data.materials.append(mat_comp)
        elif style == 'microvoxel':
            # In microvoxel mode, the body mesh is hidden completely by build_volumetric_voxelmesh
            pass
        elif style == 'cel_shaded':
            mat_skin_smooth = make_cel_mat('M_Skin_CelSmooth', skin_rgb, tuple(c * 0.65 for c in skin_rgb), ramp_stops=(0.30, 0.48))
            body.data.materials.append(mat_skin_smooth)
        else: # pixel_art default
            body.data.materials.append(mat_skin)
            
        if mat_outline and style != 'microvoxel':
            body.data.materials.append(mat_outline)
            
    # 3. Creature Morphology (Amphibian Head Morph & Perched Eyes)
    morph_features = []
    if is_amphibian and style != 'uv_composite':
        morph_features = build_amphibian_features(body, arm, mat_skin, mat_outline, mat_eye, mat_pupil)

    # Add True Volumetric Voxelmesh if microvoxel style requested
    if style == 'microvoxel' and body and arm:
        print("[Synthesizer] Generating True Volumetric Voxelmesh Hull...")
        build_volumetric_voxelmesh(
            arm, body,
            ref_image_path=canonical_plate_path or img_path,
            grid_res=0.026,
            primary_rgb=skin_rgb,
            secondary_rgb=torso_rgb,
            glow_rgb=(0.2, 0.85, 1.0) if has_word(prompt_lower, 'arcane', 'magic', 'sigil') else (1.0, 0.40, 0.15),
            extra_objs=morph_features,
            char_id=char_id,
            char_name=char_name
        )
        
    vg_map = {vg.index: vg.name for vg in body.vertex_groups} if body else {}
    arm_bones = {'LeftShoulder', 'LeftArm', 'LeftForeArm', 'RightShoulder', 'RightArm', 'RightForeArm'}
    hand_bones = {'LeftHand', 'RightHand'}
    leg_bones = {'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase'}

    # 4. Outfits & Procedural Conformal Shell Generation
    is_coat = has_word(prompt_lower, 'coat', 'trenchcoat', 'jacket', 'einstein', 'suit', 'labcoat')
    is_robe = (not is_amphibian) and has_word(prompt_lower, 'robe', 'gown', 'sorcerer', 'sorceress', 'wizard')
    is_hide = is_amphibian or has_word(prompt_lower, 'hide', 'loincloth', 'barbarian', 'tribal', 'feral')

    if style in ('uv_composite', 'microvoxel'):
        # In UV composite and microvoxel modes, the pure creature hull / voxel cloud defines the form without civilian clothing overrides
        pass
    elif is_hide:
        # Sleeveless hide armor/vest (bare arms)
        def is_hide_vest_vert(v):
            groups = {vg_map[g.group]: g.weight for g in v.groups if g.group in vg_map}
            in_spine = any(groups.get(b, 0) > 0.15 for b in {'Spine', 'Spine01'})
            in_arm = any(groups.get(b, 0) > 0.25 for b in arm_bones)
            return in_spine and not in_arm and (0.46 <= v.co.z <= 0.80)

        extract_conformal_shell(
            body, 'FLESH_Hide_Vest',
            filter_fn=is_hide_vest_vert,
            displace_amt=0.0050, mat=mat_torso, mat_outline=mat_outline
        )
        
        # Ragged loincloth wrap (bare legs and feet)
        def is_loincloth_vert(v):
            groups = {vg_map[g.group]: g.weight for g in v.groups if g.group in vg_map}
            in_hips = groups.get('Hips', 0) > 0.12
            in_upper_leg = any(groups.get(b, 0) > 0.15 for b in {'LeftUpLeg', 'RightUpLeg'})
            return (in_hips or in_upper_leg) and (0.34 <= v.co.z <= 0.54)

        extract_conformal_shell(
            body, 'FLESH_Loincloth',
            filter_fn=is_loincloth_vert,
            displace_amt=0.0045, mat=mat_pants, mat_outline=mat_outline
        )
    elif is_coat:
        def is_pants_vert(v):
            groups = {vg_map[g.group]: g.weight for g in v.groups if g.group in vg_map}
            in_leg = any(groups.get(b, 0) > 0.1 for b in leg_bones)
            in_hips = groups.get('Hips', 0) > 0.1 and v.co.z <= 0.54
            return in_leg or in_hips

        extract_conformal_shell(
            body, 'FLESH_Trousers',
            filter_fn=is_pants_vert,
            displace_amt=0.0035, mat=mat_pants, mat_outline=mat_outline
        )
        
        def is_upper_coat_vert(v):
            groups = {vg_map[g.group]: g.weight for g in v.groups if g.group in vg_map}
            in_arm = any(groups.get(b, 0) > 0.15 for b in arm_bones)
            in_hand = any(groups.get(b, 0) > 0.5 for b in hand_bones)
            if in_arm and not in_hand:
                return True
            in_spine = any(groups.get(b, 0) > 0.12 for b in {'Spine', 'Spine01'})
            if in_spine:
                return (v.co.y >= -0.075 or abs(v.co.x) >= 0.085) and v.co.z >= 0.46
            return False

        extract_conformal_shell(
            body, 'FLESH_Upper_Coat',
            filter_fn=is_upper_coat_vert,
            displace_amt=0.0060, mat=mat_torso, mat_outline=mat_outline
        )
        build_open_coat(arm, mat_torso, mat_outline, length='calf')
        
        def is_vest_vert(v):
            groups = {vg_map[g.group]: g.weight for g in v.groups if g.group in vg_map}
            in_spine = any(groups.get(b, 0) > 0.15 for b in {'Spine', 'Spine01'})
            return in_spine and (0.48 <= v.co.z <= 0.74) and abs(v.co.x) <= 0.088 and v.co.y < -0.04

        extract_conformal_shell(
            body, 'FLESH_Vest',
            filter_fn=is_vest_vert,
            displace_amt=0.0042, mat=mat_pants, mat_outline=mat_outline
        )
    elif is_robe:
        def is_pants_vert(v):
            groups = {vg_map[g.group]: g.weight for g in v.groups if g.group in vg_map}
            in_leg = any(groups.get(b, 0) > 0.1 for b in leg_bones)
            in_hips = groups.get('Hips', 0) > 0.1 and v.co.z <= 0.54
            return in_leg or in_hips

        extract_conformal_shell(
            body, 'FLESH_Trousers',
            filter_fn=is_pants_vert,
            displace_amt=0.0035, mat=mat_pants, mat_outline=mat_outline
        )
        
        def is_tunic_vert(v):
            groups = {vg_map[g.group]: g.weight for g in v.groups if g.group in vg_map}
            in_arm = any(groups.get(b, 0) > 0.15 for b in arm_bones)
            in_spine = any(groups.get(b, 0) > 0.15 for b in {'Spine', 'Spine01', 'neck'})
            return in_arm or in_spine

        extract_conformal_shell(
            body, 'FLESH_Robe_Top',
            filter_fn=is_tunic_vert,
            displace_amt=0.0050, mat=mat_torso, mat_outline=mat_outline
        )
        build_robe_skirt(arm, mat_torso, mat_outline)
    else:
        def is_pants_vert(v):
            groups = {vg_map[g.group]: g.weight for g in v.groups if g.group in vg_map}
            in_leg = any(groups.get(b, 0) > 0.1 for b in leg_bones)
            in_hips = groups.get('Hips', 0) > 0.1 and v.co.z <= 0.54
            return in_leg or in_hips

        extract_conformal_shell(
            body, 'FLESH_Trousers',
            filter_fn=is_pants_vert,
            displace_amt=0.0035, mat=mat_pants, mat_outline=mat_outline
        )
        
        def is_tunic_vert(v):
            groups = {vg_map[g.group]: g.weight for g in v.groups if g.group in vg_map}
            in_spine = any(groups.get(b, 0) > 0.15 for b in {'Spine', 'Spine01'})
            return in_spine and (0.44 <= v.co.z <= 0.82)

        extract_conformal_shell(
            body, 'FLESH_Tunic',
            filter_fn=is_tunic_vert,
            displace_amt=0.0045, mat=mat_torso, mat_outline=mat_outline
        )

    # 5. Hair & Facial Features
    if (not is_amphibian) and (style not in ('uv_composite', 'microvoxel')):
        hair_style = 'wild_cloud' if has_word(prompt_lower, 'wild', 'cloud', 'einstein', 'curly') else \
                     'cowl_hood' if has_word(prompt_lower, 'cowl', 'hood', 'rogue') else \
                     'helmet' if has_word(prompt_lower, 'helmet', 'cyber', 'helm', 'mecha') else \
                     'spikes' if has_word(prompt_lower, 'spike', 'spiky', 'hero', 'anime', 'paladin') else \
                     'classic'
                     
        build_procedural_hair(arm, hair_style, mat_hair, mat_outline)
        
        if has_word(prompt_lower, 'einstein', 'mustache', 'walrus', 'beard'):
            build_facial_features(arm, 'mustache', mat_hair, mat_outline)

    # 6. Weapon / Handheld Equipment Attachment
    has_spear = is_amphibian or has_word(prompt_lower, 'spear', 'polearm', 'javelin', 'trident', 'pike')
    has_sword = (not has_spear) and has_word(prompt_lower, 'sword', 'blade')
    has_sigil = (not is_amphibian) and (not has_spear) and (not has_sword) and has_word(prompt_lower, 'einstein', 'sigil', 'quantum', 'relativity', 'magic', 'arcane', 'orb')

    if has_spear:
        attach_spear(arm)
    elif has_sword:
        attach_sword(arm)
    elif has_sigil:
        build_hand_sigil(arm, mat_glow)

    # 6. Save Golem Blend Artifact
    out_blend_dir = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\artifacts\flesh_golems')
    os.makedirs(out_blend_dir, exist_ok=True)
    out_blend = os.path.join(out_blend_dir, f"{char_id}.blend")
    bpy.ops.wm.save_as_mainfile(filepath=out_blend)
    print(f"Saved Rigged FLESH Golem Model -> {out_blend}")

    # 7. Camera Turntable & Action Filming
    cam_rot = bpy.data.objects['Cam_Rot_Empty']
    cam_rot.location = (0.0, -1.20, 0.96)
    cam_rot.rotation_euler = (0, 0, 0)
    cam_tgt = bpy.data.objects['CamTarget']
    cam_tgt.location = (0.0, -1.20, 0.96)
    cam = bpy.data.objects['RenderCam']
    cam.location = (0.0, -2.40, 0.25)
    
    scene = bpy.context.scene
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    
    actions_dir = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions')
    os.makedirs(actions_dir, exist_ok=True)
    
    # Preview Portrait (Frame 1 Idle)
    arm.animation_data.action = bpy.data.actions['Idle_Loop']
    scene.frame_set(1)
    bpy.context.view_layer.update()
    
    out_preview = os.path.join(actions_dir, f"{char_id}_preview.png")
    scene.render.filepath = out_preview
    bpy.ops.render.render(write_still=True)
    print(f"Rendered Preview Portrait -> {out_preview}")

    # 8-Way Action Spritesheets (256x256 tiles, 2048x2048 master sheet)
    render_full = recipe_data.get('renderFull', True)
    actions_to_film = [
        ('Idle_Loop', f"{char_id}_idle_loop.png"),
        ('Walk_Loop', f"{char_id}_walk_loop.png"),
    ]
    if render_full:
        actions_to_film.extend([
            ('Jog_Fwd_Loop', f"{char_id}_run_loop.png"),
            ('Spell_Simple_Shoot', f"{char_id}_spellcast_loop.png"),
            ('Hit_Chest', f"{char_id}_damage_loop.png")
        ])
        
    for act_name, filename in actions_to_film:
        full_out_path = os.path.join(actions_dir, filename)
        film_8way_action(act_name, full_out_path, num_frames=8, resolution=256, supersample=256)

    # 8. Register in Engine Manifest
    manifest_path = os.path.abspath(r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\myos_sprites_manifest.json')
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
            
        manifest['sprites'][char_id] = {
            "id": char_id,
            "name": f"{char_name} (FLESH Golem)",
            "category": "heroes",
            "badge": "FLESH GOLEM",
            "badgeColor": "bg-gradient-to-r from-amber-600/30 to-yellow-600/30 text-amber-300 border-amber-500/50",
            "description": prompt if len(prompt) > 10 else f"Synthesized FLESH golem translated from 2D reference art and procedural geometry.",
            "tileSize": 256,
            "grid": {
                "cols": 8,
                "rows": 8
            },
            "scale": 1.0,
            "defaultAction": "idle",
            "previewUrl": f"/actions/{char_id}_preview.png",
            "actions": {
                "idle": f"/actions/{char_id}_idle_loop.png",
                "walk": f"/actions/{char_id}_walk_loop.png",
                "run": f"/actions/{char_id}_run_loop.png" if render_full else f"/actions/{char_id}_walk_loop.png",
                "spellcast": f"/actions/{char_id}_spellcast_loop.png" if render_full else f"/actions/{char_id}_idle_loop.png",
                "damage": f"/actions/{char_id}_damage_loop.png" if render_full else f"/actions/{char_id}_idle_loop.png"
            },
            "pillarAlignment": "thought"
        }
        
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2)
            
        print(f"Registered {char_id} in {manifest_path}")
    except Exception as e:
        print(f"[Manifest Registration Error] {e}")

    print("=== SOVEREIGN FLESH GOLEM PIPELINE COMPLETE ===")

if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    parser = argparse.ArgumentParser()
    parser.add_argument('--recipe', type=str, help='Path to recipe JSON')
    parser.add_argument('--id', type=str, help='Character ID slug')
    parser.add_argument('--name', type=str, help='Character Display Name')
    parser.add_argument('--image', type=str, help='Path to reference image')
    parser.add_argument('--prompt', type=str, help='Character prompt')
    parser.add_argument('--gender', type=str, default='auto')
    parser.add_argument('--style', type=str, default='auto', help='Visual Style (uv_composite, pixel_art, microvoxel, cel_shaded)')
    parser.add_argument('--archetype', type=str, default='auto', help='Creature Archetype (humanoid, wyrm, quadruped, blob)')
    parser.add_argument('--canonical', type=str, help='Path to pre-canonicalized plate')
    parser.add_argument('--full', action='store_true', help='Render all actions')
    
    parsed = parser.parse_args(args)
    
    recipe = {}
    if parsed.recipe and os.path.exists(parsed.recipe):
        with open(parsed.recipe, 'r', encoding='utf-8') as f:
            recipe = json.load(f)
            
    if parsed.id: recipe['id'] = parsed.id
    if parsed.name: recipe['name'] = parsed.name
    if parsed.image: recipe['image_path'] = parsed.image
    if parsed.prompt: recipe['prompt'] = parsed.prompt
    if parsed.gender != 'auto': recipe['gender'] = parsed.gender
    if parsed.style != 'auto': recipe['style'] = parsed.style
    if parsed.archetype != 'auto': recipe['archetype'] = parsed.archetype
    if parsed.canonical: recipe['canonical_image_path'] = parsed.canonical
    if parsed.full: recipe['renderFull'] = True
    
    run_flesh_synthesis(recipe)
