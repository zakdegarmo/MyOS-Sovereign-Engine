import socket

code = """
import bpy
import bmesh
from mathutils import Vector

# Find the mannequin mesh and armature
mannequin_obj = None
for obj in bpy.data.objects:
    if 'mannequin' in obj.name.lower() and obj.type == 'MESH':
        mannequin_obj = obj
        break

if not mannequin_obj:
    # Look for any mesh that is not the mage
    for obj in bpy.data.objects:
        if obj.type == 'MESH' and 'char1' not in obj.name and 'moonlit' not in obj.name.lower():
            mannequin_obj = obj
            break

if mannequin_obj:
    # 1. Scale Head to Anime Proportions: slightly wider, tapered jaw/chin, slightly larger overall
    # In Edit Mode / Mesh vertices:
    bpy.context.view_layer.objects.active = mannequin_obj
    bpy.ops.object.mode_set(mode='OBJECT')
    
    mesh = mannequin_obj.data
    # Head vertices are typically Z > 1.25 in local mesh space
    # Find bounding box Z
    min_z = min(v.co.z for v in mesh.vertices)
    max_z = max(v.co.z for v in mesh.vertices)
    height = max_z - min_z
    head_z_cutoff = max_z - height * 0.22
    
    # Measure head center
    head_verts = [v for v in mesh.vertices if v.co.z > head_z_cutoff]
    if head_verts:
        head_center_z = sum(v.co.z for v in head_verts) / len(head_verts)
        
        for v in head_verts:
            # Scale head 1.22x larger for anime chibi head-to-body ratio
            dz = v.co.z - head_center_z
            v.co.x *= 1.25  # Wider anime skull
            v.co.y *= 1.15  # Slightly deeper skull
            v.co.z = head_center_z + dz * 1.18
            
            # Taper chin towards the bottom of the face
            if dz < 0:
                taper = max(0.65, 1.0 + (dz / (height * 0.12)) * 0.35)
                v.co.x *= taper
                v.co.y *= taper
    
    # 2. Scale Hands & Fingers: Shorten hands by ~20% to match cute anime chibi mitts
    hand_x_cutoff = max(abs(v.co.x) for v in mesh.vertices) * 0.78
    hand_verts = [v for v in mesh.vertices if abs(v.co.x) > hand_x_cutoff and v.co.z < head_z_cutoff]
    for v in hand_verts:
        sign = 1 if v.co.x > 0 else -1
        # Compress finger extension towards wrist
        offset_from_wrist = abs(v.co.x) - hand_x_cutoff
        v.co.x = sign * (hand_x_cutoff + offset_from_wrist * 0.75)
        # Slightly plump chibi hand thickness
        v.co.y *= 1.08
        v.co.z *= 1.05

    mesh.update()
    print("✨ Successfully reshaped Mannequin skull to anime proportions and shortened hands!")
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("RESHAPED_ANIME_SKULL_AND_HANDS")
