import bpy, math

man = bpy.data.objects['Mannequin']
mw = man.matrix_world

# Check radius of thigh at Z=0.45 (Left leg, cx=0.117, cy=1.25)
thigh_pts = [(mw @ v.co) for v in man.data.vertices if 0.43 <= (mw @ v.co).z <= 0.47 and (mw @ v.co).x > 0.0]
if thigh_pts:
    r_thigh = max(math.sqrt((p.x - 0.117)**2 + (p.y - 1.251)**2) for p in thigh_pts)
    print(f'Thigh radius at Z=0.45: {r_thigh:.3f}m')

# Check radius of knee ball at Z=0.35
knee_pts = [(mw @ v.co) for v in man.data.vertices if 0.33 <= (mw @ v.co).z <= 0.37 and (mw @ v.co).x > 0.0]
if knee_pts:
    r_knee = max(math.sqrt((p.x - 0.117)**2 + (p.y - 1.251)**2) for p in knee_pts)
    print(f'Knee ball radius at Z=0.35: {r_knee:.3f}m')

# Check radius of calf at Z=0.20
calf_pts = [(mw @ v.co) for v in man.data.vertices if 0.18 <= (mw @ v.co).z <= 0.22 and (mw @ v.co).x > 0.0]
if calf_pts:
    r_calf = max(math.sqrt((p.x - 0.117)**2 + (p.y - 1.261)**2) for p in calf_pts)
    print(f'Calf radius at Z=0.20: {r_calf:.3f}m')

# Check radius of shoulder ball at X=0.147, Y=1.271, Z=0.980
shoulder_pts = [(mw @ v.co) for v in man.data.vertices if 0.12 <= (mw @ v.co).x <= 0.18 and 0.94 <= (mw @ v.co).z <= 1.02]
if shoulder_pts:
    r_shoulder = max(math.sqrt((p.x - 0.147)**2 + (p.y - 1.271)**2 + (p.z - 0.980)**2) for p in shoulder_pts)
    print(f'Shoulder ball radius: {r_shoulder:.3f}m')

# Check torso width/depth at chest Z=0.85 and waist Z=0.68
chest_pts = [(mw @ v.co) for v in man.data.vertices if 0.83 <= (mw @ v.co).z <= 0.87]
if chest_pts:
    dx = max(p.x for p in chest_pts) - min(p.x for p in chest_pts)
    dy = max(p.y for p in chest_pts) - min(p.y for p in chest_pts)
    print(f'Chest bounds at Z=0.85: width={dx:.3f}m, depth={dy:.3f}m')

waist_pts = [(mw @ v.co) for v in man.data.vertices if 0.66 <= (mw @ v.co).z <= 0.70]
if waist_pts:
    dx = max(p.x for p in waist_pts) - min(p.x for p in waist_pts)
    dy = max(p.y for p in waist_pts) - min(p.y for p in waist_pts)
    print(f'Waist bounds at Z=0.68: width={dx:.3f}m, depth={dy:.3f}m')
