import bpy, mathutils, math, os

# Remove old point lights
for o in list(bpy.data.objects):
    if o.type == 'LIGHT':
        bpy.data.objects.remove(o, do_unlink=True)

# Add 3-point SUN setup
def add_sun(name, loc, rot_target, energy, color):
    ldata = bpy.data.lights.new(name=name, type='SUN')
    ldata.energy = energy
    ldata.color = color
    lobj = bpy.data.objects.new(name=name, object_data=ldata)
    lobj.location = loc
    bpy.context.scene.collection.objects.link(lobj)
    
    # Point at (0, 0, 0.75)
    dx = 0.0 - loc[0]
    dy = 0.0 - loc[1]
    dz = 0.75 - loc[2]
    rot = mathutils.Vector((dx, dy, dz)).to_track_quat('-Z', 'Y').to_euler()
    lobj.rotation_euler = rot
    return lobj

# 1. Key Light (Front-Right, high)
add_sun("KeySun", (3.0, -4.5, 5.5), (0, 0, 0.75), 5.0, (1.0, 0.98, 0.92))
# 2. Fill Light (Front-Left, mid)
add_sun("FillSun", (-3.5, -4.0, 3.5), (0, 0, 0.75), 3.0, (0.85, 0.92, 1.0))
# 3. Rim Light (Back, high)
add_sun("RimSun", (0.5, 4.5, 4.5), (0, 0, 0.75), 3.5, (1.0, 0.90, 0.98))
# 4. Soft Front Camera Fill (straight on, low angle) - ensures face has ZERO dark shadows!
add_sun("FaceFillSun", (0.0, -5.0, 1.2), (0, 0, 0.95), 1.8, (1.0, 0.98, 0.95))

# Also ensure Face Decal has slight emission so anime eyes are bright and vivid
face = bpy.data.objects.get('Chibi_Face_Decal')
if face and face.data.materials:
    mat = face.data.materials[0]
    if mat and mat.use_nodes:
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        tex = mat.node_tree.nodes.get('FaceTexture')
        if bsdf and tex:
            mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Emission Color'])
            bsdf.inputs['Emission Strength'].default_value = 0.35

# World ambient
world = bpy.context.scene.world
if world and world.use_nodes:
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (0.7, 0.75, 0.85, 1.0)
        bg.inputs['Strength'].default_value = 0.5

cam = bpy.data.objects['RenderCam']
cam.location = (0.0, -2.60, 0.95)
cam.rotation_euler = (math.radians(78), 0, 0)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.65

arm = bpy.data.objects['Armature']
arm.data.pose_position = 'POSE'
act = bpy.data.actions.get('Idle_Loop')
arm.animation_data.action = act
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()

scene = bpy.context.scene
scene.render.resolution_x = 256
scene.render.resolution_y = 256
scene.render.film_transparent = True
scene.render.filepath = os.path.abspath('temp_tiles/raw_lit_sample.png')
bpy.ops.render.render(write_still=True)
print("Rendered raw_lit_sample.png!")

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest4.blend')
print("Saved blend file with studio lighting!")
