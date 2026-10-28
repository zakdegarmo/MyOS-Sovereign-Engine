import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy, mathutils, math, os
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

# 1. Setup exact studio lighting
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

add_sun("KeySun", (2.5, -3.5, 4.5), 3.0, (1.0, 0.98, 0.92))
add_sun("FillSun", (-3.0, -2.5, 3.0), 1.8, (0.7, 0.85, 1.0))
add_sun("RimSun", (0.0, 4.0, 3.5), 2.2, (0.9, 0.8, 1.0))

# World ambient
world = bpy.context.scene.world
if world:
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (0.5, 0.55, 0.65, 1.0)
        bg.inputs['Strength'].default_value = 0.5

# Skin material tone
man = bpy.data.objects['Mannequin']
if man and man.data.materials:
    mat_skin = man.data.materials[0]
    if mat_skin:
        bsdf = mat_skin.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            # Warm healthy anime peach skin tone
            bsdf.inputs['Base Color'].default_value = (0.95, 0.76, 0.66, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.40

# Face Decal
face = bpy.data.objects.get('Chibi_Face_Decal')
if face and face.data.materials:
    mat_face = face.data.materials[0]
    if mat_face:
        bsdf = mat_face.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Emission Strength'].default_value = 0.0

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
raw_path = os.path.abspath('temp_tiles/studio_raw_idle0.png')
scene.render.filepath = raw_path
bpy.ops.render.render(write_still=True)

# 2. Advanced Cel-Shading & Cartoon Inking Engine
def cartoonize_tile(im, outline_px=2, cel_steps=4):
    im = im.convert('RGBA')
    w, h = im.size
    r, g, b, a = im.split()
    alpha_np = np.array(a)
    mask = alpha_np > 25

    # A. Color Vibrancy Boost
    enh_color = ImageEnhance.Color(im)
    im_boost = enh_color.enhance(1.20)
    enh_con = ImageEnhance.Contrast(im_boost)
    im_boost = enh_con.enhance(1.15)
    
    rgb = np.array(im_boost.convert('RGB'), dtype=np.float32) / 255.0

    # B. Stepped Anime Cel-Shading Quantization
    # Calculate luminance
    lum = 0.299 * rgb[:,:,0] + 0.587 * rgb[:,:,1] + 0.114 * rgb[:,:,2]
    
    # 4-step cel quantization table
    # Shadow (0.42), Mid-Low (0.65), Mid-High (0.84), Highlight (1.00)
    lum_cel = np.copy(lum)
    lum_cel[(lum < 0.38) & mask] = 0.42
    lum_cel[(lum >= 0.38) & (lum < 0.62) & mask] = 0.65
    lum_cel[(lum >= 0.62) & (lum < 0.82) & mask] = 0.84
    lum_cel[(lum >= 0.82) & mask] = 1.00
    
    scale = np.zeros_like(lum)
    np.divide(lum_cel, lum, out=scale, where=(lum > 0.02))
    scale = np.clip(scale, 0.6, 1.4)
    
    rgb_cel = np.clip(rgb * np.expand_dims(scale, 2), 0.0, 1.0)
    
    # C. Major Seam Inking (Detect strong boundaries between distinct objects)
    # Sobel gradient on RGB channels
    dx = np.zeros_like(rgb)
    dy = np.zeros_like(rgb)
    dx[:, 1:-1, :] = rgb[:, 2:, :] - rgb[:, :-2, :]
    dy[1:-1, :, :] = rgb[2:, :, :] - rgb[:-2, :, :]
    grad = np.sqrt(np.sum(dx**2 + dy**2, axis=2))
    
    # Exclude face center from harsh inking so delicate eyes remain pure
    # Face center is roughly x in [100, 156], y in [70, 125]
    y_coords, x_coords = np.ogrid[:h, :w]
    is_face_box = (x_coords >= 100) & (x_coords <= 156) & (y_coords >= 70) & (y_coords <= 125)
    
    # Internal ink edges
    is_seam = (grad > 0.28) & mask & (~is_face_box)
    
    ink_rgb = np.array([0.08, 0.09, 0.13]) # Dark navy-charcoal ink
    for c in range(3):
        rgb_cel[is_seam, c] = rgb_cel[is_seam, c] * 0.25 + ink_rgb[c] * 0.75
        
    cel_img = Image.fromarray((rgb_cel * 255).astype(np.uint8))
    cel_img.putalpha(a)
    
    # D. Thick Cartoon Silhouette Outline
    # Create binary mask of character
    sil = Image.fromarray((mask * 255).astype(np.uint8))
    # Dilate by outline_px (e.g. 2px thickness = 5x5 kernel)
    sil_dil = sil.filter(ImageFilter.MaxFilter(2 * outline_px + 1))
    outline_mask = np.array(sil_dil) > 100
    
    # Composite into final drawn sprite
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    # Dark ink outline layer
    ink_layer = Image.new('RGBA', (w, h), (18, 20, 28, 255))
    out.paste(ink_layer, (0, 0), Image.fromarray((outline_mask * 255).astype(np.uint8)))
    # Paste cel-shaded character inside outline
    out.paste(cel_img, (0, 0), cel_img)
    return out

raw_img = Image.open(raw_path)
drawn_img = cartoonize_tile(raw_img, outline_px=2)
drawn_path = os.path.abspath('artifacts/verification/drawn_chibi_sample.png')
drawn_img.save(drawn_path)
print(f"Rendered and saved drawn cartoon sprite to {drawn_path}!")

# Also save blend file
bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest4.blend')
print("Saved blend file with studio lighting & skin tone!")
