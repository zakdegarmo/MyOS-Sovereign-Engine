import requests
import base64
import argparse
from io import BytesIO
from PIL import Image, ImageDraw

GENX_URL = "http://127.0.0.1:8000/api/generate"

def draw_openpose_skeleton(pose_type):
    """Draws a mathematical 18-point OpenPose skeleton on a 512x512 black canvas."""
    img = Image.new("RGB", (512, 512), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # OpenPose standard colors
    colors = {
        "nose": (255, 0, 0), "neck": (255, 85, 0),
        "r_sho": (255, 170, 0), "r_elb": (255, 255, 0), "r_wri": (170, 255, 0),
        "l_sho": (85, 255, 0), "l_elb": (0, 255, 0), "l_wri": (0, 255, 85),
        "m_hip": (0, 255, 170),
        "r_hip": (0, 255, 255), "r_kne": (0, 170, 255), "r_ank": (0, 85, 255),
        "l_hip": (0, 0, 255), "l_kne": (85, 0, 255), "l_ank": (170, 0, 255)
    }

    # Define the joint coordinates for 3 distinct walk poses
    if pose_type == "idle":
        joints = {
            "nose": (256, 120), "neck": (256, 180),
            "r_sho": (200, 180), "r_elb": (190, 260), "r_wri": (180, 320),
            "l_sho": (312, 180), "l_elb": (322, 260), "l_wri": (332, 320),
            "m_hip": (256, 300),
            "r_hip": (220, 300), "r_kne": (220, 380), "r_ank": (220, 460),
            "l_hip": (292, 300), "l_kne": (292, 380), "l_ank": (292, 460)
        }
    elif pose_type == "step_left":
        joints = {
            "nose": (256, 120), "neck": (256, 180),
            "r_sho": (200, 180), "r_elb": (170, 240), "r_wri": (140, 300), # Right arm swings back
            "l_sho": (312, 180), "l_elb": (342, 240), "l_wri": (372, 300), # Left arm swings forward
            "m_hip": (256, 300),
            "r_hip": (220, 300), "r_kne": (220, 380), "r_ank": (220, 460), # Right leg stays
            "l_hip": (292, 300), "l_kne": (312, 360), "l_ank": (332, 440)  # Left leg steps out
        }
    elif pose_type == "step_right":
        joints = {
            "nose": (256, 120), "neck": (256, 180),
            "r_sho": (200, 180), "r_elb": (170, 240), "r_wri": (140, 300), # Right arm forward
            "l_sho": (312, 180), "l_elb": (342, 240), "l_wri": (372, 300), # Left arm back
            "m_hip": (256, 300),
            "r_hip": (220, 300), "r_kne": (190, 360), "r_ank": (160, 440), # Right leg steps out
            "l_hip": (292, 300), "l_kne": (292, 380), "l_ank": (292, 460)  # Left leg stays
        }

    # Draw the bones (lines)
    bones = [
        ("nose", "neck"), ("neck", "r_sho"), ("r_sho", "r_elb"), ("r_elb", "r_wri"),
        ("neck", "l_sho"), ("l_sho", "l_elb"), ("l_elb", "l_wri"),
        ("neck", "m_hip"), ("m_hip", "r_hip"), ("r_hip", "r_kne"), ("r_kne", "r_ank"),
        ("m_hip", "l_hip"), ("l_hip", "l_kne"), ("l_kne", "l_ank")
    ]
    
    # Draw thicker lines for the bones
    for p1, p2 in bones:
        if p1 in joints and p2 in joints:
            # Color is based on the destination joint
            draw.line([joints[p1], joints[p2]], fill=colors[p2], width=12)

    # Draw the joints (circles)
    for j_name, coord in joints.items():
        x, y = coord
        r = 8
        draw.ellipse([x-r, y-r, x+r, y+r], fill=colors[j_name])

    return img

def generate_frame(prompt, control_img):
    """Call GenX API with the OpenPose skeleton."""
    buffered = BytesIO()
    control_img.save(buffered, format="PNG")
    c_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    res = requests.post(GENX_URL, json={
        "prompt": prompt,
        "width": 512,
        "height": 512,
        "inference_steps": 25,
        "use_gemma": False,
        "controlnet_image_b64": c_b64
    })
    
    if res.status_code == 200:
        img_data = base64.b64decode(res.json()["image_base64"])
        return Image.open(BytesIO(img_data)).convert("RGB")
    else:
        print(f"Error: {res.text}")
        return None

def main():
    print("Generating OpenPose Skeletons...")
    poses = ["idle", "step_left", "step_right"]
    
    prompt = "A high quality character concept art of a female Elf Druid wearing a green cloak, brown leather boots, holding a staff. Clear white background. Full body shot, character sheet style."
    
    # We'll stitch the results into a 3x2 grid: Top row = Skeletons, Bottom row = Generated Images
    output_grid = Image.new("RGB", (512 * 3, 512 * 2), (0,0,0))
    
    for i, pose in enumerate(poses):
        print(f"Drawing Rig: {pose}...")
        skeleton = draw_openpose_skeleton(pose)
        
        # Paste skeleton in top row
        output_grid.paste(skeleton, (i * 512, 0))
        
        print(f"Generating AI Character for {pose}...")
        ai_image = generate_frame(prompt, skeleton)
        
        if ai_image:
            # Paste AI result in bottom row
            output_grid.paste(ai_image, (i * 512, 512))
            
    out_path = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\custom\openpose_test_grid.png"
    output_grid.save(out_path)
    print(f"Saved successful rig test to {out_path}!")

if __name__ == "__main__":
    main()
