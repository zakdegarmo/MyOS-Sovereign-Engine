import bpy, os, math

blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_larry_technician.blend"
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))

scene = bpy.context.scene
scene.render.resolution_x = 256
scene.render.resolution_y = 256
scene.render.film_transparent = True

arm = bpy.data.objects['Armature']
rot = bpy.data.objects['Cam_Rot_Empty']
cam = bpy.data.objects['RenderCam']

os.makedirs('artifacts/verification', exist_ok=True)

test_actions = [
    ("Walk_Loop", 4, "walk_f4"),
    ("Sprint_Loop", 4, "sprint_f4"),
    ("Fixing_Kneeling", 4, "repair_f4"),
    ("Hit_Chest", 2, "damage_f2")
]

for act_name, frame, label in test_actions:
    act = bpy.data.actions.get(act_name)
    if not act:
        print(f"Action {act_name} not found!")
        continue
    arm.animation_data.action = act
    scene.frame_set(frame)
    
    for deg in [0, 45, 90]:
        rot.rotation_euler[2] = math.radians(deg)
        bpy.context.view_layer.update()
        scene.render.filepath = os.path.abspath(f'artifacts/verification/motion_{label}_{deg}.png')
        bpy.ops.render.render(write_still=True)
    print(f"Rendered {label}")
