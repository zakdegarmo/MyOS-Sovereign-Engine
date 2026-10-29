import bpy, mathutils, math, os

def setup_scene():
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
    
    # Ensure active hair is visible
    hair = bpy.data.objects.get('Modular_Hair_Adventurer')
    if hair:
        hair.hide_viewport = False
        hair.hide_render = False
        
    # Ensure mage hat is hidden for hair inspection
    hat = bpy.data.objects.get('Modular_Mage_Hat')
    if hat:
        hat.hide_viewport = True
        hat.hide_render = True
        
    # Ensure clothes are visible
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

    os.makedirs('artifacts/volumetric_review', exist_ok=True)
    return cam, arm

def render_views():
    cam, arm = setup_scene()
    
    # View 1: Full body Front (Rest Pose)
    arm.data.pose_position = 'REST'
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()
    
    cam.data.type = 'PERSP'
    cam.data.lens = 50
    cam.location = (0.007, -2.30, 0.65)
    cam.rotation_euler = (math.radians(88), 0, 0)
    bpy.context.scene.render.resolution_x = 512
    bpy.context.scene.render.resolution_y = 680
    bpy.context.scene.render.filepath = os.path.abspath('artifacts/volumetric_review/fullbody_front_rest.png')
    bpy.ops.render.render(write_still=True)
    print("Rendered fullbody_front_rest.png")
    
    # View 2: Full body 3/4 Perspective (Rest Pose)
    cam.location = (-1.50, -1.90, 0.75)
    cam.rotation_euler = (math.radians(84), 0, math.radians(-38))
    bpy.context.scene.render.filepath = os.path.abspath('artifacts/volumetric_review/fullbody_threequarter_rest.png')
    bpy.ops.render.render(write_still=True)
    print("Rendered fullbody_threequarter_rest.png")

    # View 3: Close-up Portrait 3/4 Perspective (Rest Pose)
    cam.location = (-0.65, -0.85, 1.22)
    cam.rotation_euler = (math.radians(88), 0, math.radians(-38))
    bpy.context.scene.render.resolution_x = 512
    bpy.context.scene.render.resolution_y = 512
    bpy.context.scene.render.filepath = os.path.abspath('artifacts/volumetric_review/portrait_threequarter.png')
    bpy.ops.render.render(write_still=True)
    print("Rendered portrait_threequarter.png")

    # View 4: Close-up Portrait Front (Rest Pose)
    cam.location = (0.007, -1.05, 1.20)
    cam.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.scene.render.filepath = os.path.abspath('artifacts/volumetric_review/portrait_front.png')
    bpy.ops.render.render(write_still=True)
    print("Rendered portrait_front.png")

    # View 5: Dynamic Action Pose (Jog_Fwd_Loop frame 12)
    arm.data.pose_position = 'POSE'
    bpy.context.scene.frame_set(12)
    bpy.context.view_layer.update()
    
    cam.location = (-1.50, -1.90, 0.75)
    cam.rotation_euler = (math.radians(84), 0, math.radians(-38))
    bpy.context.scene.render.resolution_x = 512
    bpy.context.scene.render.resolution_y = 680
    bpy.context.scene.render.filepath = os.path.abspath('artifacts/volumetric_review/fullbody_jog_frame12.png')
    bpy.ops.render.render(write_still=True)
    print("Rendered fullbody_jog_frame12.png")

    # Reset back to Jog_Fwd_Loop and POSE frame 0
    arm.data.pose_position = 'POSE'
    bpy.context.scene.frame_set(0)
    bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest4.blend')

render_views()
