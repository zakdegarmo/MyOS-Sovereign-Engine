import bpy, os, math

blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_base_comic.blend"
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))

clothes_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\clothes"
hair_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\hair"

body = bpy.data.objects['LPC_Decivoxel_Flesh_Fused']
arm = bpy.data.objects['Armature']

# Print head bounding box in rest pose
head_verts = [v.co for v in body.data.vertices if any(body.vertex_groups[g.group].name == 'Head' and g.weight > 0.5 for g in v.groups)]
if head_verts:
    min_x = min(v.x for v in head_verts)
    max_x = max(v.x for v in head_verts)
    min_y = min(v.y for v in head_verts)
    max_y = max(v.y for v in head_verts)
    min_z = min(v.z for v in head_verts)
    max_z = max(v.z for v in head_verts)
    print(f"Head bounds in REST: X=[{min_x:.3f}, {max_x:.3f}], Y=[{min_y:.3f}, {max_y:.3f}], Z=[{min_z:.3f}, {max_z:.3f}]")

# Print neck bounds in rest pose
neck_verts = [v.co for v in body.data.vertices if any(body.vertex_groups[g.group].name == 'neck' and g.weight > 0.5 for g in v.groups)]
if neck_verts:
    min_z = min(v.z for v in neck_verts)
    max_z = max(v.z for v in neck_verts)
    print(f"Neck bounds in REST: Z=[{min_z:.3f}, {max_z:.3f}]")

# Print torso (Spine/Spine01) bounds
torso_verts = [v.co for v in body.data.vertices if any(body.vertex_groups[g.group].name in ['Spine', 'Spine01'] and g.weight > 0.3 for g in v.groups)]
if torso_verts:
    min_z = min(v.z for v in torso_verts)
    max_z = max(v.z for v in torso_verts)
    min_y = min(v.y for v in torso_verts)
    max_y = max(v.y for v in torso_verts)
    min_x = min(v.x for v in torso_verts)
    max_x = max(v.x for v in torso_verts)
    print(f"Torso bounds in REST: X=[{min_x:.3f}, {max_x:.3f}], Y=[{min_y:.3f}, {max_y:.3f}], Z=[{min_z:.3f}, {max_z:.3f}]")
