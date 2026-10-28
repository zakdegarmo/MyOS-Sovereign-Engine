import bpy, mathutils, math, os

# 1. Reset lights to exact Moonlit Mage 3-Sun setup
for o in list(bpy.data.objects):
    if o.type == 'LIGHT':
        bpy.data.objects.remove(o, do_unlink=True)

def add_sun(name, loc, energy, color):
    ldata = bpy.data.lights.new(name=name, type='SUN')
    ldata.energy = energy
    ldata.color = color
    lobj = bpy.data.objects.new(name=name, object_data=ldata)
    lobj.location = loc
    bpy.context.scene.collection.objects.link(lobj)
    
    dx = 0.0 - loc[0]
    dy = 0.0 - loc[1]
    dz = 0.75 - loc[2]
    rot = mathutils.Vector((dx, dy, dz)).to_track_quat('-Z', 'Y').to_euler()
    lobj.rotation_euler = rot
    return lobj

add_sun("KeyLight", (3, -4, 6), 4.5, (1.0, 0.98, 0.92))
add_sun("FillLight", (-4, -3, 4), 2.5, (0.6, 0.8, 1.0))
add_sun("RimLight", (0, 5, 4), 3.0, (0.85, 0.6, 1.0))

# Reset face decal material
face = bpy.data.objects.get('Chibi_Face_Decal')
if face and face.data.materials:
    mat = face.data.materials[0]
    if mat and mat.use_nodes:
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Emission Strength'].default_value = 0.0

# Set World
world = bpy.context.scene.world
if world and world.use_nodes:
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (0.05, 0.05, 0.08, 1.0)
        bg.inputs['Strength'].default_value = 0.2

# Check Freestyle line art rendering
scene = bpy.context.scene
scene.render.use_freestyle = True
freestyle = scene.view_layers[0].freestyle_settings
freestyle.as_contour = True
freestyle.as_crease = True
freestyle.as_silhouette = True
freestyle.crease_angle = math.radians(135)

lineset = freestyle.linesets[0] if freestyle.linesets else freestyle.linesets.new("ToonLines")
lineset.select_silhouette = True
lineset.select_crease = True
lineset.select_border = True
lineset.select_contour = True

linestyle = lineset.linestyle
linestyle.thickness = 2.5
linestyle.color = (0.08, 0.08, 0.12)

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

scene.render.resolution_x = 256
scene.render.resolution_y = 256
scene.render.film_transparent = True
scene.render.filepath = os.path.abspath('temp_tiles/test_freestyle_toon.png')
bpy.ops.render.render(write_still=True)
print("Rendered test_freestyle_toon.png!")
