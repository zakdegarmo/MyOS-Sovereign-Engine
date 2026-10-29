import socket

code = """
import bpy

# Find the Mage mesh and the Native Mannequin mesh/armature
mage_mesh = None
mannequin_armature = None
mannequin_mesh = None

for obj in bpy.data.objects:
    if 'char1' in obj.name or 'Moonlit' in obj.name or ('Mesh' in obj.name and 'Mannequin' not in obj.name and obj.type == 'MESH'):
        if obj.type == 'MESH':
            mage_mesh = obj
    if 'human_mannequin' in obj.name or 'Mannequin' in obj.name:
        if obj.type == 'ARMATURE':
            mannequin_armature = obj
        elif obj.type == 'MESH':
            mannequin_mesh = obj

# Measure Mage Bounding Box Dimensions
if mage_mesh:
    mage_dims = mage_mesh.dimensions
    print(f"Mage Dimensions: X={mage_dims.x:.3f}, Y={mage_dims.y:.3f}, Z={mage_dims.z:.3f}")
    
    # Align Mannequin position and match scale precisely to Mage
    if mannequin_armature:
        # Move Mannequin to stand right next to Mage at X=0, Y=0
        mannequin_armature.location = (0, 0, 0)
        if mage_mesh.parent:
            mage_mesh.parent.location = (0.75, 0, 0)
        else:
            mage_mesh.location = (0.75, 0, 0)
            
        # Compute exact scale factor to match Mage height
        if mannequin_mesh:
            current_z = mannequin_mesh.dimensions.z
            if current_z > 0:
                scale_factor = mage_dims.z / current_z
                mannequin_armature.scale = (scale_factor, scale_factor, scale_factor)
                print(f"Scaled Mannequin Armature by {scale_factor:.3f} to match Mage height exactly!")

# Frame both in viewport for clear side-by-side inspection
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for region in area.regions:
            if region.type == 'WINDOW':
                override = {'area': area, 'region': region}
                bpy.ops.view3d.view_all(override)
                break
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("PROPORTION_MATCH_EXECUTED")
