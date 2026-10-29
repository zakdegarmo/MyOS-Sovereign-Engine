from PIL import Image
im = Image.open('assets/textures/chibi_faces/face_neutral.png')
print('Mode:', im.mode, 'Size:', im.size)
if im.mode == 'RGBA':
    ext = im.getextrema()
    print('Alpha min/max:', ext[3])
