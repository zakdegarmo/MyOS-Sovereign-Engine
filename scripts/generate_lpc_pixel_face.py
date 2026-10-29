from PIL import Image, ImageDraw
import os

FACE_TEX_PATH = os.path.abspath('assets/textures/lpc/lpc_face_authentic_pixel.png')
os.makedirs(os.path.dirname(FACE_TEX_PATH), exist_ok=True)

face_img = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
draw = ImageDraw.Draw(face_img)

pixel_size = 42
grid_w = 14
grid_h = 7
start_x = 512 - (grid_w * pixel_size) // 2
start_y = 512 - (grid_h * pixel_size) // 2

HEX_COLORS = {
    'SKIN': (0xf9, 0xd5, 0xba, 0),        
    'PEACH_SHAD': (0xe4, 0xa4, 0x7c, 220), 
    'CREVICE': (0xcc, 0x86, 0x65, 255),    
    'LASH': (0x99, 0x42, 0x3c, 255),       
    'PUPIL': (0x27, 0x19, 0x20, 255),      
    'CYAN': (0x57, 0xce, 0xe4, 255),       
    'BLUE': (0x56, 0x86, 0xae, 255),       
    'NAVY': (0x2a, 0x3c, 0x49, 255),       
    'WHITE': (0xf2, 0xf7, 0xf8, 255),      
    'BROW': (0xa6, 0x5c, 0x40, 240),       
    'MOUTH': (0xcc, 0x86, 0x65, 230),      
    'NOSE': (0xd8, 0x8f, 0x70, 200),       
}

FACE_MAP = [
    ['SKIN','BROW','BROW','BROW','SKIN','SKIN','SKIN','SKIN','SKIN','BROW','BROW','BROW','SKIN','SKIN'],
    ['SKIN','PEACH_SHAD','LASH','LASH','PEACH_SHAD','SKIN','SKIN','SKIN','PEACH_SHAD','LASH','LASH','PEACH_SHAD','SKIN','SKIN'],
    ['PEACH_SHAD','CYAN','PUPIL','PUPIL','CYAN','SKIN','SKIN','SKIN','CYAN','PUPIL','PUPIL','CYAN','PEACH_SHAD','SKIN'],
    ['PEACH_SHAD','WHITE','PUPIL','BLUE','WHITE','SKIN','NOSE','NOSE','WHITE','BLUE','PUPIL','WHITE','PEACH_SHAD','SKIN'],
    ['SKIN','WHITE','NAVY','NAVY','SKIN','SKIN','SKIN','SKIN','SKIN','NAVY','NAVY','WHITE','SKIN','SKIN'],
    ['PEACH_SHAD','PEACH_SHAD','SKIN','SKIN','SKIN','MOUTH','MOUTH','SKIN','SKIN','SKIN','PEACH_SHAD','PEACH_SHAD','SKIN','SKIN'],
    ['SKIN','SKIN','SKIN','SKIN','SKIN','CREVICE','CREVICE','SKIN','SKIN','SKIN','SKIN','SKIN','SKIN','SKIN'],
]

for r, row in enumerate(FACE_MAP):
    for c, cell_type in enumerate(row):
        color = HEX_COLORS[cell_type]
        if color[3] > 0:
            px = start_x + c * pixel_size
            py = start_y + r * pixel_size
            draw.rectangle([px, py, px + pixel_size - 1, py + pixel_size - 1], fill=color)

face_img.save(FACE_TEX_PATH)
print(f'Generated canonical LPC pixel face texture -> {FACE_TEX_PATH}')
