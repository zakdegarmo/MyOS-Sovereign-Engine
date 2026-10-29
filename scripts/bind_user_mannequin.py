import bpy
import math

# 1. Open the user's pristine file mannequin_chibi_basic.blend
bpy.ops.wm.open_mainfile(filepath=r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic.blend')

user_mesh = bpy.data.objects.get('Mannequin')
if not user_mesh:
    raise ValueError("Mannequin not found in mannequin_chibi_basic.blend!")

print("User mesh confirmed:")
print("  Name:", user_mesh.name)
print("  Materials:", [mat.name for mat in user_mesh.data.materials if mat])
print("  Vertices:", len(user_mesh.data.vertices))
print("  Scale:", user_mesh.scale)
print("  Dimensions:", user_mesh.dimensions)

# Remove any old armature from mannequin_chibi_basic.blend
for o in list(bpy.data.objects):
    if o.type == 'ARMATURE':
        bpy.data.objects.remove(o, do_unlink=True)

# 2. Import UAL1_Standard.glb into the scene
bpy.ops.import_scene.gltf(filepath=r'apps/web/dist/models/Universal Animation Library[Standard]/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb')

# Find imported objects
ual_arm = None
for o in list(bpy.data.objects):
    if o.type == 'ARMATURE':
        ual_arm = o
    elif o.type == 'MESH' and o != user_mesh:
        print("DELETING UNREAL ROBOT MESH:", o.name, [mat.name for mat in o.data.materials if mat])
        bpy.data.objects.remove(o, do_unlink=True)

if not ual_arm:
    raise ValueError("UAL armature not found!")

# 3. Center the user's mannequin at (0, 0, 0) preserving its exact chibi scale
# In mannequin_chibi_basic.blend, the user had loc (1.592, 1.258, 0).
# Center in X and Y so it stands right at the origin!
user_mesh.location = (0, 0, 0)

# Scale the UAL Armature by the user's EXACT chibi scale factor: (0.8148, 0.8148, 0.6851)
ual_arm.scale = (0.8148, 0.8148, 0.6851)
ual_arm.location = (0, 0, 0)

# 4. Bind the USER'S Mannequin to the Armature
for mod in list(user_mesh.modifiers):
    user_mesh.modifiers.remove(mod)

user_mesh.parent = ual_arm
user_mesh.matrix_parent_inverse.identity()
mod = user_mesh.modifiers.new('Armature', 'ARMATURE')
mod.object = ual_arm

# Make all 45 actions have fake user so they stay saved
for act in bpy.data.actions:
    act.use_fake_user = True

# Verify that ONLY the user's mesh exists
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
print(f"Total meshes in scene: {len(meshes)}")
for m in meshes:
    print(f"  Mesh: {m.name}, Materials: {[mat.name for mat in m.data.materials if mat]}, Verts: {len(m.data.vertices)}")

# Camera and lighting setup
cam = bpy.data.objects.get('RenderCam')
if not cam:
    cam_data = bpy.data.cameras.new('RenderCam')
    cam = bpy.data.objects.new('RenderCam', cam_data)
    bpy.context.collection.objects.link(cam)
bpy.context.scene.camera = cam
cam.location = (0, -3.2, 0.70)
cam.rotation_euler = (math.radians(88), 0, 0)
cam.data.lens = 45

key = bpy.data.objects.get('KeyLight')
if not key:
    key_data = bpy.data.lights.new('KeyLight', 'SUN')
    key = bpy.data.objects.new('KeyLight', key_data)
    bpy.context.collection.objects.link(key)
key.data.energy = 3.5
key.location = (2, -2, 4)
key.rotation_euler = (math.radians(45), math.radians(15), math.radians(-30))

rim = bpy.data.objects.get('RimLight')
if not rim:
    rim_data = bpy.data.lights.new('RimLight', 'SUN')
    rim = bpy.data.objects.new('RimLight', rim_data)
    bpy.context.collection.objects.link(rim)
rim.data.energy = 1.5
rim.location = (0, 2, 3)

# Set action to Walk_Loop frame 16
if 'Walk_Loop' in bpy.data.actions:
    ual_arm.animation_data.action = bpy.data.actions['Walk_Loop']
    bpy.context.scene.frame_start = 0
    bpy.context.scene.frame_end = int(bpy.data.actions['Walk_Loop'].frame_range[1])
    bpy.context.scene.frame_set(16)

# Render verification frame
scene = bpy.context.scene
scene.render.filepath = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\user_white_chibi_walk_f16.png'
bpy.ops.render.render(write_still=True)

# Save to mannequin_chibi_basic_rigTest1.blend
bpy.ops.wm.save_mainfile(filepath=r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic_rigTest1.blend')
print("Successfully configured user's white chibi mannequin with all 45 animations!")
