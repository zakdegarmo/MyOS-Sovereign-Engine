import bpy
import os

print("=== Creating Clean Base FLESH Mannequin (flesh_base_mannequin.blend) ===")

SRC_BLEND = os.path.abspath('mannequin_decivoxel_flesh_studio.blend')
OUT_BLEND = os.path.abspath('flesh_base_mannequin.blend')

bpy.ops.wm.open_mainfile(filepath=SRC_BLEND)

# 1. Identify and remove all reference billboards, temporary props, and unused objects
objects_to_remove = []
for obj in bpy.data.objects:
    name = obj.name
    # Remove billboards and reference meshes
    if any(k in name for k in ['SideBySide', 'DirectOverlay', 'Mannequin', 'Modular_', 'Chibi_Face', 'Plane']):
        objects_to_remove.append(obj)

for obj in objects_to_remove:
    print(f"Removing unused object: {obj.name}")
    bpy.data.objects.remove(obj, do_unlink=True)

# 2. Ensure only essential objects exist:
essential_names = [
    'Armature', 
    'LPC_Decivoxel_Flesh_Fused', 
    'LPC_Face_Decal', 
    'RenderCam', 
    'CamTarget', 
    'Cam_Rot_Empty', 
    'KeySun', 
    'FillSun', 
    'RimSun'
]

remaining = [o.name for o in bpy.data.objects]
print("Remaining objects in clean base:", remaining)

# 3. Purge orphaned data blocks (materials, meshes, textures, images)
for block in list(bpy.data.meshes):
    if block.users == 0:
        bpy.data.meshes.remove(block)

for block in list(bpy.data.materials):
    if block.users == 0:
        bpy.data.materials.remove(block)

for block in list(bpy.data.images):
    if block.users == 0:
        bpy.data.images.remove(block)

# 4. Set rest pose and clear pose transforms
arm = bpy.data.objects.get('Armature')
if arm:
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.pose.transforms_clear()
    bpy.ops.object.mode_set(mode='OBJECT')

# Save as new base file
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
print(f"Clean Base FLESH Mannequin saved to: {OUT_BLEND}")
print(f"File size: {os.path.getsize(OUT_BLEND) / (1024*1024):.2f} MB")
