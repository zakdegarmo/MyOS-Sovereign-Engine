import bpy, mathutils, math, os

def render_verification():
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    
    cam = bpy.data.objects.get('RenderCam')
    if not cam:
        cam_data = bpy.data.cameras.new('RenderCam')
        cam = bpy.data.objects.new('RenderCam', cam_data)
        bpy.context.scene.collection.objects.link(cam)
    cam.parent = None
    bpy.context.scene.camera = cam
    
    scene = bpy.context.scene
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    
    hair = bpy.data.objects.get('Modular_Hair_Adventurer')
    if hair:
        hair.hide_viewport = False
        hair.hide_render = False
        
    hat = bpy.data.objects.get('Modular_Mage_Hat')
    if hat:
        hat.hide_viewport = True
        hat.hide_render = True
        
    pants = bpy.data.objects.get('Modular_Adventurer_Pants')
    if pants:
        pants.hide_viewport = False
        pants.hide_render = False
    tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
    if tunic:
        tunic.hide_viewport = False
        tunic.hide_render = False
    boots = bpy.data.objects.get('Modular_Adventurer_Boots')
    if boots:
        boots.hide_viewport = False
        boots.hide_render = False

    os.makedirs('artifacts/verification', exist_ok=True)
    
    # 1. Back Neck Close-up (Rest Pose)
    arm.data.pose_position = 'REST'
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()
    
    cam.data.type = 'PERSP'
    cam.data.lens = 50
    cam.location = (0.007, 1.10, 1.15)
    cam.rotation_euler = (math.radians(95), 0, math.radians(180))
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.filepath = os.path.abspath('artifacts/verification/neck_back_closeup.png')
    bpy.ops.render.render(write_still=True)
    print("Rendered neck_back_closeup.png")
    
    # 2. Back Full Body (Rest Pose)
    cam.location = (0.007, 2.40, 0.70)
    cam.rotation_euler = (math.radians(93), 0, math.radians(180))
    scene.render.resolution_x = 512
    scene.render.resolution_y = 680
    scene.render.filepath = os.path.abspath('artifacts/verification/fullbody_back_rest.png')
    bpy.ops.render.render(write_still=True)
    print("Rendered fullbody_back_rest.png")

    # 3. Lower Leg / Pants Close-up (Jog Pose Frame 12)
    arm.data.pose_position = 'POSE'
    bpy.context.scene.frame_set(12)
    bpy.context.view_layer.update()
    
    cam.location = (-0.7, -1.1, 0.25)
    cam.rotation_euler = (math.radians(82), 0, math.radians(-32))
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.filepath = os.path.abspath('artifacts/verification/leg_pants_jog12_closeup.png')
    bpy.ops.render.render(write_still=True)
    print("Rendered leg_pants_jog12_closeup.png")
    
    # 4. Full Body Jog Frame 12 (3/4 front)
    cam.location = (-1.50, -1.90, 0.75)
    cam.rotation_euler = (math.radians(84), 0, math.radians(-38))
    scene.render.resolution_x = 512
    scene.render.resolution_y = 680
    scene.render.filepath = os.path.abspath('artifacts/verification/fullbody_jog_frame12.png')
    bpy.ops.render.render(write_still=True)
    print("Rendered fullbody_jog_frame12.png")

render_verification()
