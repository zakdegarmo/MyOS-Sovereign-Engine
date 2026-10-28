from PIL import Image, ImageDraw, ImageFont
import os, glob

# Paths to the renders
img_full_front = Image.open('artifacts/volumetric_review/fullbody_front_rest.png').convert('RGBA')
img_portrait = Image.open('artifacts/volumetric_review/portrait_front.png').convert('RGBA')
img_jog = Image.open('artifacts/volumetric_review/fullbody_jog_frame12.png').convert('RGBA')
img_threequarter = Image.open('artifacts/volumetric_review/fullbody_threequarter_rest.png').convert('RGBA')

# Dimensions
target_h = 600
def resize_keep_aspect(im, target_h):
    ratio = target_h / float(im.height)
    new_w = int(im.width * ratio)
    return im.resize((new_w, target_h), Image.Resampling.LANCZOS)

f_front = resize_keep_aspect(img_full_front, target_h)
f_port = resize_keep_aspect(img_portrait, target_h)
f_jog = resize_keep_aspect(img_jog, target_h)
f_3q = resize_keep_aspect(img_threequarter, target_h)

panels = [
    (f_front, '1. Rest Pose (Front)', 'Continuous Volumetric Breeches & Tunic'),
    (f_port, '2. Portrait (Anime Hair & Decal)', 'Curved Bezier Strands & Warm Skin'),
    (f_jog, '3. Dynamic Jog Action (Frame 12)', 'Complete Knee & Shoulder Joint Enclosure'),
    (f_3q, '4. 3/4 Perspective', 'Baggy Cloth Volume & Flared Hem')
]

pad = 20
banner_h = 70
total_w = sum(p[0].width for p in panels) + pad * (len(panels) + 1)
total_h = target_h + banner_h + pad * 2 + 50

canvas = Image.new('RGBA', (total_w, total_h), (24, 26, 32, 255))
draw = ImageDraw.Draw(canvas)

# Title banner
draw.rectangle([(0, 0), (total_w, banner_h)], fill=(16, 18, 24, 255))
draw.text((pad, 14), 'MyOS Chibi Character Engine: Volumetric Cloth & Multi-Segment Anime Hair', fill=(255, 255, 255, 255))
draw.text((pad, 40), 'Continuous manifold breeches, high-collar tunic, 10-segment Bezier diamond hair strands, and soft studio lighting', fill=(160, 175, 195, 255))

cur_x = pad
y_offset = banner_h + pad

for img, title, sub in panels:
    # Card background
    card_bg = Image.new('RGBA', (img.width, target_h), (34, 38, 48, 255))
    card_bg.alpha_composite(img)
    canvas.paste(card_bg, (cur_x, y_offset))
    
    # Border
    draw.rectangle([(cur_x, y_offset), (cur_x + img.width, y_offset + target_h)], outline=(60, 68, 85, 255), width=2)
    
    # Label underneath
    draw.text((cur_x + 4, y_offset + target_h + 8), title, fill=(235, 240, 255, 255))
    draw.text((cur_x + 4, y_offset + target_h + 26), sub, fill=(140, 155, 175, 255))
    
    cur_x += img.width + pad

# Save to artifacts and brain directory
out_local = 'artifacts/chibi_volumetric_cloth_and_hair_showcase.png'
canvas.save(out_local)
print('Saved showcase to:', out_local)

brain_dir = r'C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e'
out_brain = os.path.join(brain_dir, 'chibi_volumetric_cloth_and_hair_showcase.png')
canvas.save(out_brain)
print('Saved showcase to brain artifacts:', out_brain)
