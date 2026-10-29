import bpy
import bmesh
from mathutils import Vector

blend_file = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_and_mage_scene.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

# Find mannequin mesh
mannequin = None
mage = None

for obj in bpy.data.objects:
    if obj.type == 'MESH':
        if 'char1' in obj.name.lower() or 'moonlit' in obj.name.lower():
            mage = obj
        else:
            mannequin = obj

if mannequin and mage:
    # 1. Align ground level of mannequin so feet sit flush on platform (not sunken)
    min_z_man = min(v.co.z for v in mannequin.data.vertices)
    # Shift mannequin up so bottom of feet is Z = 0.0
    for v in mannequin.data.vertices:
        v.co.z -= min_z_man

    mesh = mannequin.data
    min_z = 0.0
    max_z = max(v.co.z for v in mesh.vertices)
    H = max_z - min_z
    
    print(f"Mannequin Total Height = {H:.3f}m")

    # Proportion targets:
    # - Head top ~ H, Chin ~ H * 0.76 (larger, wider, bulbous brain dome)
    # - Chest ~ H * 0.58 to H * 0.76 (tapered, flat belly, no paunch)
    # - Hips / Pelvis ~ H * 0.42 to H * 0.58 (lowered hips, widened pelvis)
    # - Thighs / Legs ~ H * 0.0 to H * 0.42 (slender thighs matching anime chibi silhouette)
    # - Arms ~ shortened span, wrist at mid-thigh, proportional hands

    for v in mesh.vertices:
        z = v.co.z
        x = v.co.x
        y = v.co.y
        
        # 1. HEAD (z > H * 0.74): Make wider, bulbous brain casing, cute chin
        if z > H * 0.74:
            # Expand width and depth significantly
            head_factor = (z - H * 0.74) / (H * 0.26)
            v.co.x *= 1.38  # Much wider anime skull
            v.co.y *= 1.32  # Bulbous cranium depth
            # Bulbous top crown
            if head_factor > 0.4:
                crown_expand = (head_factor - 0.4) / 0.6
                v.co.x *= (1.0 + crown_expand * 0.18)
                v.co.y *= (1.0 + crown_expand * 0.20)
                v.co.z += crown_expand * 0.03
        
        # 2. TORSO & BELLY (H * 0.44 < z <= H * 0.74): Flatten paunch, taper waist
        elif z > H * 0.44 and z <= H * 0.74:
            # Flatten paunchy belly in front (+Y or -Y depth)
            if y < 0: # Front belly
                v.co.y *= 0.68  # Flatten stomach
            v.co.x *= 0.88  # Defined anime waist
            
        # 3. HIPS & PELVIS (H * 0.36 < z <= H * 0.48): Lower hip line and widen pelvis
        elif z > H * 0.36 and z <= H * 0.48:
            v.co.x *= 1.15  # Widen hips so thighs aren't wider than hips
            v.co.z -= 0.04  # Lower hip center
            
        # 4. THIGHS & CALVES (H * 0.06 < z <= H * 0.38): Slim down thighs
        elif z > H * 0.06 and z <= H * 0.38:
            v.co.x *= 0.80  # Slimmer anime legs
            v.co.y *= 0.80  # Slimmer depth
            
        # 5. ARMS & HANDS (|x| > H * 0.18 and z > H * 0.45): Shorten arm span
        if abs(x) > H * 0.18 and z > H * 0.42:
            sign = 1 if x > 0 else -1
            dist_from_shoulder = abs(x) - H * 0.18
            # Compress arm length by 28%
            v.co.x = sign * (H * 0.18 + dist_from_shoulder * 0.72)
            v.co.y *= 0.85
            v.co.z *= 0.95

    # Recompute mesh normals
    mesh.update()
    bpy.ops.wm.save_as_mainfile(filepath=blend_file)
    print("✅ Fixed all mannequin proportions: Bulbous head, flat stomach, lowered wide hips, slim thighs, shortened arms, feet on ground!")
