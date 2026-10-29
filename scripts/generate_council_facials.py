import os
from PIL import Image, ImageDraw

# Correct path for LPC textures
BASE_PATH = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\lpc"

PILLAR_COLORS = [
    (239, 68, 68, 255),   # Self
    (251, 191, 36, 255),  # Thought
    (244, 63, 94, 255),   # Logic
    (16, 185, 129, 255),  # Unity
    (139, 92, 246, 255),  # Existence
    (249, 115, 22, 255),  # Improvement
    (14, 165, 233, 255),  # Mastery
    (236, 72, 153, 255),  # Resonance
    (168, 85, 247, 255),  # Transcendence
    (100, 116, 139, 255)  # Omni
]

def generate_layer(layer_name, draw_fn):
    dir_path = os.path.join(BASE_PATH, layer_name)
    os.makedirs(dir_path, exist_ok=True)
    
    for i, color in enumerate(PILLAR_COLORS):
        # Create a 64x64 transparent image (since our compositor now handles 64x64)
        img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw_fn(draw, color)
        img.save(os.path.join(dir_path, f"{i}.png"))
        print(f"Generated {layer_name}/{i}.png")

def draw_eyes(draw, color):
    # Two small dots for eyes
    draw.rectangle([24, 24, 28, 28], fill=color) # Left eye
    draw.rectangle([36, 24, 40, 28], fill=color) # Right eye

def draw_mouth(draw, color):
    # A small line for mouth
    draw.rectangle([26, 36, 38, 38], fill=color)

if __name__ == "__main__":
    print("Generating Councilor Facial Proteins...")
    generate_layer("eyes", draw_eyes)
    generate_layer("mouth", draw_mouth)
    print("Done!")
