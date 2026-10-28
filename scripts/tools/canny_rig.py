import requests
import base64
from io import BytesIO
from PIL import Image, ImageDraw

GENX_URL = "http://127.0.0.1:8000/api/generate"

def draw_canny_skeleton(pose_type):
    """Draws a stick figure using thin white lines to trick the Canny model."""
    img = Image.new("RGB", (512, 512), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # We will use pure white for the edges
    color = (255, 255, 255)

    # Define the joint coordinates for 3 distinct walk poses
    if pose_type == "idle":
        joints = {
            "head": (256, 120), "neck": (256, 180),
            "r_sho": (200, 180), "r_elb": (190, 260), "r_wri": (180, 320),
            "l_sho": (312, 180), "l_elb": (322, 260), "l_wri": (332, 320),
            "m_hip": (256, 300),
            "r_hip": (220, 300), "r_kne": (220, 380), "r_ank": (220, 460),
            "l_hip": (292, 300), "l_kne": (292, 380), "l_ank": (292, 460)
        }
    elif pose_type == "step_left":
        joints = {
            "head": (256, 120), "neck": (256, 180),
            "r_sho": (200, 180), "r_elb": (170, 240), "r_wri": (140, 300), 
            "l_sho": (312, 180), "l_elb": (342, 240), "l_wri": (372, 300), 
            "m_hip": (256, 300),
            "r_hip": (220, 300), "r_kne": (220, 380), "r_ank": (220, 460), 
            "l_hip": (292, 300), "l_kne": (312, 360), "l_ank": (332, 440)  
        }
    elif pose_type == "step_right":
        joints = {
            "head": (256, 120), "neck": (256, 180),
            "r_sho": (200, 180), "r_elb": (170, 240), "r_wri": (140, 300), 
            "l_sho": (312, 180), "l_elb": (342, 240), "l_wri": (372, 300), 
            "m_hip": (256, 300),
            "r_hip": (220, 300), "r_kne": (190, 360), "r_ank": (160, 440), 
            "l_hip": (292, 300), "l_kne": (292, 380), "l_ank": (292, 460)  
        }

    # Draw the bones (lines)
    bones = [
        ("head", "neck"), ("neck", "r_sho"), ("r_sho", "r_elb"), ("r_elb", "r_wri"),
        ("neck", "l_sho"), ("l_sho", "l_elb"), ("l_elb", "l_wri"),
        ("neck", "m_hip"), ("m_hip", "r_hip"), ("r_hip", "r_kne"), ("r_kne", "r_ank"),
        ("m_hip", "l_hip"), ("l_hip", "l_kne"), ("l_kne", "l_ank")
    ]
    
    # Draw thin lines to simulate a Canny Edge map
    for p1, p2 in bones:
        if p1 in joints and p2 in joints:
            draw.line([joints[p1], joints[p2]], fill=color, width=2)
            
    # Draw the head outline
    hx, hy = joints["head"]
    draw.ellipse([hx-30, hy-40, hx+30, hy+40], outline=color, width=2)

    return img

def generate_frame(prompt, control_img):
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
    print("Generating Canny Skeletons...")
    poses = ["idle", "step_left", "step_right"]
    
    prompt = "A high quality character concept art of a female Elf Druid wearing a green cloak, brown leather boots, holding a staff. Clear white background. Full body shot, character sheet style."
    
    # Stitch into a 3x2 grid
    output_grid = Image.new("RGB", (512 * 3, 512 * 2), (0,0,0))
    
    for i, pose in enumerate(poses):
        print(f"Drawing Canny Rig: {pose}...")
        skeleton = draw_canny_skeleton(pose)
        output_grid.paste(skeleton, (i * 512, 0))
        
        print(f"Generating AI Character for {pose}...")
        ai_image = generate_frame(prompt, skeleton)
        
        if ai_image:
            output_grid.paste(ai_image, (i * 512, 512))
            
    out_path = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\custom\canny_rig_test.png"
    output_grid.save(out_path)
    print(f"Saved successful Canny rig test to {out_path}!")

if __name__ == "__main__":
    main()
