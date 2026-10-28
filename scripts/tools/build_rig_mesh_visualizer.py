"""
build_rig_mesh_visualizer.py
Constructs an authentic, iconic Blender Octahedral diamond bone mesh
with spherical joint sockets, 100% rigid skinning, excluding sockets,
and locked in pristine REST T-pose.
"""

import sys
sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")

import bpy
import bmesh
import mathutils
import os

def build_rig_visualizer(source_blend="flesh_base_mannequin.blend", out_blend="artifacts/mixamo_rig_studio.blend"):
    source_blend = os.path.abspath(source_blend)
    out_blend = os.path.abspath(out_blend)
    os.makedirs(os.path.dirname(out_blend), exist_ok=True)
    
    bpy.ops.wm.open_mainfile(filepath=source_blend)
    arm = bpy.data.objects.get('Armature')
    if not arm:
        raise RuntimeError("No Armature found in base file!")
        
    arm.data.pose_position = 'REST'
    arm.animation_data_clear()
    
    print(f"Generating Octahedral Rig Mesh for Armature: {arm.name} ({len(arm.data.bones)} bones)...")
    
    old_vis = bpy.data.objects.get('Rig_Visualizer_Mesh')
    if old_vis:
        bpy.data.objects.remove(old_vis, do_unlink=True)
        
    mesh = bpy.data.meshes.new('Rig_Visualizer_Mesh')
    vis_obj = bpy.data.objects.new('Rig_Visualizer_Mesh', mesh)
    bpy.context.collection.objects.link(vis_obj)
    
    # Materials
    mat_cyan = bpy.data.materials.get('M_Bone_Cyan') or bpy.data.materials.new(name='M_Bone_Cyan')
    mat_cyan.use_nodes = True
    mat_cyan.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.0, 0.85, 1.0, 1.0)
    mat_cyan.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (0.0, 0.4, 0.6, 1.0)
    mat_cyan.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 0.5
    
    mat_gold = bpy.data.materials.get('M_Bone_Gold') or bpy.data.materials.new(name='M_Bone_Gold')
    mat_gold.use_nodes = True
    mat_gold.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (1.0, 0.75, 0.1, 1.0)
    mat_gold.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (0.6, 0.4, 0.05, 1.0)
    mat_gold.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 0.5

    mat_crimson = bpy.data.materials.get('M_Bone_Crimson') or bpy.data.materials.new(name='M_Bone_Crimson')
    mat_crimson.use_nodes = True
    mat_crimson.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (1.0, 0.25, 0.2, 1.0)
    mat_crimson.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (0.6, 0.1, 0.1, 1.0)
    mat_crimson.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 0.5

    mat_emerald = bpy.data.materials.get('M_Bone_Emerald') or bpy.data.materials.new(name='M_Bone_Emerald')
    mat_emerald.use_nodes = True
    mat_emerald.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.1, 0.9, 0.45, 1.0)
    mat_emerald.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (0.05, 0.5, 0.2, 1.0)
    mat_emerald.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 0.5

    vis_obj.data.materials.append(mat_cyan)     # 0: Spine/Head/Hips
    vis_obj.data.materials.append(mat_gold)     # 1: Left Arm
    vis_obj.data.materials.append(mat_crimson)  # 2: Right Arm
    vis_obj.data.materials.append(mat_emerald)  # 3: Legs
    
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    
    bone_data = []
    for b in arm.data.edit_bones:
        name = b.name
        nl = name.lower()
        if 'socket' in nl or 'toe' in nl or b.length < 0.035:
            continue
            
        L = b.length
        W = max(0.018, min(0.045, 0.15 * L))
        mat = b.matrix.copy()
        
        if 'left' in nl or '.l' in nl or 'l_' in nl:
            if 'arm' in nl or 'hand' in nl or 'shoulder' in nl or 'forearm' in nl:
                mat_idx = 1
            else:
                mat_idx = 3
        elif 'right' in nl or '.r' in nl or 'r_' in nl:
            if 'arm' in nl or 'hand' in nl or 'shoulder' in nl or 'forearm' in nl:
                mat_idx = 2
            else:
                mat_idx = 3
        else:
            mat_idx = 0
            
        bone_data.append((name, mat, L, W, mat_idx))
        
    bpy.ops.object.mode_set(mode='OBJECT')
    
    vg_map = {}
    for name, mat, L, W, mat_idx in bone_data:
        vg = vis_obj.vertex_groups.new(name=name)
        vg_map[name] = vg.index

    bm = bmesh.new()
    dlayer = bm.verts.layers.deform.verify()
    
    for name, mat, L, W, mat_idx in bone_data:
        grp_idx = vg_map[name]
        y_split = 0.20 * L
        local_verts = [
            mathutils.Vector((0, 0, 0)),
            mathutils.Vector((W, y_split, 0)),
            mathutils.Vector((0, y_split, W)),
            mathutils.Vector((-W, y_split, 0)),
            mathutils.Vector((0, y_split, -W)),
            mathutils.Vector((0, L, 0))
        ]
        world_verts = [bm.verts.new(mat @ v) for v in local_verts]
        for v in world_verts:
            v[dlayer][grp_idx] = 1.0
            
        faces = [
            (0, 1, 2), (0, 2, 3), (0, 3, 4), (0, 4, 1),
            (5, 2, 1), (5, 3, 2), (5, 4, 3), (5, 1, 4)
        ]
        for f in faces:
            try:
                face = bm.faces.new([world_verts[f[0]], world_verts[f[1]], world_verts[f[2]]])
                face.material_index = mat_idx
            except ValueError:
                pass
                
        # Joint sphere at head
        sphere_r = max(0.022, W * 1.15)
        head_world = mat.translation
        sphere_res = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=sphere_r, matrix=mathutils.Matrix.Translation(head_world))
        for sf in sphere_res.get('faces', []):
            sf.material_index = mat_idx
        for sv in sphere_res.get('verts', []):
            sv[dlayer][grp_idx] = 1.0
                
    bm.to_mesh(mesh)
    bm.free()
    
    arm_mod = vis_obj.modifiers.new(name='Armature', type='ARMATURE')
    arm_mod.object = arm
    
    arm.data.pose_position = 'REST'
    
    bpy.ops.wm.save_as_mainfile(filepath=out_blend)
    print(f"[OK] Successfully synthesized Octahedral Rig Visualizer Studio -> {out_blend}")
    return out_blend

if __name__ == "__main__":
    build_rig_visualizer()
