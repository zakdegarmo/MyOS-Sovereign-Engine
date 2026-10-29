#!/usr/bin/env python3
"""
tpose_canonicalizer.py
Universal Pose Matching & T-Pose Canonicalizer for MyOS Flesh Golem Pipeline.

Transforms arbitrary action-posed character art (crouching, angled weapons, 3/4 views)
into a normalized, centered front-facing canonical reference plate.

Supports two complementary modes:
1. Deterministic Anatomical Centering (instant, zero-VRAM):
   - Removes background, isolates creature's core body mass from extended weapons/spears,
   - Rescales and centers head, torso, and feet into canonical framing matching Blender armature rest bounds.
2. Local Diffusion Pose Transfer (GPU RTX 4060 Ti):
   - Uses cached SD 1.5 + ControlNet + IP-Adapter to synthesize a true symmetrical A-pose
     plate preserving exact colors, textures, face details, and apparel.
"""

import os
import sys
import argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def draw_apose_skeleton(width=512, height=512):
    """Draws standard 18-point OpenPose A-pose skeleton matching Blender armature rest pose."""
    img = Image.new("RGB", (width, height), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    colors = {
        "nose": (255, 0, 0), "neck": (255, 85, 0),
        "r_sho": (255, 170, 0), "r_elb": (255, 255, 0), "r_wri": (170, 255, 0),
        "l_sho": (85, 255, 0), "l_elb": (0, 255, 0), "l_wri": (0, 255, 85),
        "m_hip": (0, 255, 170),
        "r_hip": (0, 255, 255), "r_kne": (0, 170, 255), "r_ank": (0, 85, 255),
        "l_hip": (0, 0, 255), "l_kne": (85, 0, 255), "l_ank": (170, 0, 255)
    }

    joints = {
        "nose": (256, 110), "neck": (256, 165),
        "r_sho": (195, 175), "r_elb": (150, 235), "r_wri": (115, 300),
        "l_sho": (317, 175), "l_elb": (362, 235), "l_wri": (397, 300),
        "m_hip": (256, 290),
        "r_hip": (220, 290), "r_kne": (210, 385), "r_ank": (205, 470),
        "l_hip": (292, 290), "l_kne": (302, 385), "l_ank": (307, 470)
    }

    bones = [
        ("nose", "neck"), ("neck", "r_sho"), ("r_sho", "r_elb"), ("r_elb", "r_wri"),
        ("neck", "l_sho"), ("l_sho", "l_elb"), ("l_elb", "l_wri"),
        ("neck", "m_hip"), ("m_hip", "r_hip"), ("r_hip", "r_kne"), ("r_kne", "r_ank"),
        ("m_hip", "l_hip"), ("l_hip", "l_kne"), ("l_kne", "l_ank")
    ]

    for p1, p2 in bones:
        if p1 in joints and p2 in joints:
            draw.line([joints[p1], joints[p2]], fill=colors[p2], width=12)

    for j_name, coord in joints.items():
        x, y = coord
        r = 8
        draw.ellipse([x - r, y - r, x + r, y + r], fill=colors[j_name])

    return img

def draw_apose_silhouette_edge(width=512, height=512):
    """Draws a clean silhouette edge map of an A-pose mannequin for Canny ControlNet."""
    img = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(img)
    
    # Head
    draw.ellipse([216, 60, 296, 150], fill=255)
    # Neck
    draw.rectangle([244, 140, 268, 170], fill=255)
    # Torso
    draw.polygon([(200, 170), (312, 170), (290, 295), (222, 295)], fill=255)
    # Arms (Left and Right A-pose)
    draw.polygon([(195, 175), (140, 235), (105, 300), (125, 310), (160, 245), (205, 195)], fill=255)
    draw.polygon([(317, 175), (372, 235), (407, 300), (387, 310), (352, 245), (307, 195)], fill=255)
    # Legs
    draw.polygon([(220, 290), (200, 380), (195, 470), (225, 470), (230, 380), (245, 290)], fill=255)
    draw.polygon([(292, 290), (312, 380), (317, 470), (287, 470), (282, 380), (267, 290)], fill=255)
    
    # Find edges using filter
    edges = img.filter(ImageFilter.FIND_EDGES)
    return edges.convert("RGB")

def deterministic_anatomical_normalize(img: Image.Image, target_size=(512, 512)) -> Image.Image:
    """
    Isolates creature foreground, strips solid/light background to true alpha,
    isolates head from external weapons/spears using contiguous pixel analysis,
    and centers creature in standard canonical framing:
    - Center X of face at 256
    - Head top at Y ~75
    - Feet at Y ~455
    """
    img_rgba = img.convert("RGBA")
    arr = np.array(img_rgba)
    
    # Strip white / light background to transparent alpha
    is_bg = (arr[:, :, 0] > 238) & (arr[:, :, 1] > 238) & (arr[:, :, 2] > 238)
    arr[is_bg, 3] = 0
    
    is_fg = arr[:, :, 3] > 30
    ys, xs = np.where(is_fg)
    if len(xs) == 0 or len(ys) == 0:
        return img_rgba.resize(target_size, Image.Resampling.LANCZOS)
        
    # Find head cluster (first row with width of creature > 80px)
    row_counts = is_fg.sum(axis=1)
    valid_rows = np.where(row_counts > 80)[0]
    head_top_y = valid_rows[0] if len(valid_rows) > 0 else ys.min()
    head_row = min(head_top_y + 35, ys.max())
    
    # Find largest contiguous segment on that row (filters out spear shaft / weapons)
    row_pixels = np.where(is_fg[head_row])[0]
    if len(row_pixels) > 0:
        diffs = np.diff(row_pixels)
        splits = np.where(diffs > 5)[0] + 1
        segments = np.split(row_pixels, splits)
        largest_seg = max(segments, key=len)
        head_center_x = (largest_seg[0] + largest_seg[-1]) / 2.0
    else:
        head_center_x = (xs.min() + xs.max()) / 2.0
        
    feet_y = ys.max()
    body_height = max(60, feet_y - head_top_y)
    
    target_height = 380
    scale = target_height / float(body_height)
    
    clean_img = Image.fromarray(arr)
    nw = int(clean_img.width * scale)
    nh = int(clean_img.height * scale)
    resized = clean_img.resize((nw, nh), Image.Resampling.LANCZOS)
    
    scaled_hcx = int(head_center_x * scale)
    scaled_hty = int(head_top_y * scale)
    
    paste_x = (target_size[0] // 2) - scaled_hcx
    paste_y = 75 - scaled_hty
    
    plate = Image.new("RGBA", target_size, (0, 0, 0, 0))
    plate.paste(resized, (paste_x, paste_y), resized)
    return plate

def generate_diffusion_apose(input_img_path: str, output_path: str, prompt: str = "") -> bool:
    """
    Runs local Stable Diffusion 1.5 + Canny/OpenPose ControlNet + IP-Adapter
    on NVIDIA RTX 4060 Ti to synthesize a true symmetrical A-pose character plate.
    """
    try:
        import torch
        from diffusers import StableDiffusionControlNetPipeline, ControlNetModel
        
        if not torch.cuda.is_available():
            print("[T-Pose GPU] CUDA not available, using deterministic fallback.")
            return False
            
        model_path = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\.cache\huggingface\hub\models--runwayml--stable-diffusion-v1-5\snapshots\451f4fe16113bff5a5d2269ed5ad43b0592e9a14"
        canny_path = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\.cache\huggingface\hub\models--lllyasviel--sd-controlnet-canny\snapshots\main"
        
        if not os.path.exists(canny_path) or not os.path.exists(model_path):
            print("[T-Pose GPU] Cached model paths not found, using deterministic fallback.")
            return False
            
        print("[T-Pose GPU] Initializing ControlNet + SD 1.5 Pipeline on RTX 4060 Ti...")
        controlnet = ControlNetModel.from_pretrained(
            canny_path,
            torch_dtype=torch.float16,
            use_safetensors=True
        )
        pipe = StableDiffusionControlNetPipeline.from_pretrained(
            model_path,
            controlnet=controlnet,
            torch_dtype=torch.float16,
            safety_checker=None
        ).to("cuda")
        
        # Load IP-Adapter
        try:
            print("[T-Pose GPU] Loading IP-Adapter...")
            pipe.load_ip_adapter(
                "h94/IP-Adapter",
                subfolder="models",
                weight_name="ip-adapter_sd15.bin"
            )
            pipe.set_ip_adapter_scale(0.65)
        except Exception as e:
            print(f"[T-Pose GPU] IP-Adapter load notice: {e} (Continuing with ControlNet)")
            
        # Prepare A-pose edge conditioning image
        canny_apose = draw_apose_silhouette_edge(512, 512)
        ref_image = Image.open(input_img_path).convert("RGB").resize((512, 512))
        
        full_prompt = (
            f"Front-facing character standing symmetrically in canonical A-pose, full body shot, "
            f"centered, pure white background, concept art character sheet. {prompt}"
        )
        neg_prompt = "crouching, angled, dynamic action pose, asymmetrical, spear across chest, cropped, 3d render, blurry"
        
        print(f"[T-Pose GPU] Generating canonical plate (20 steps)...")
        gen_kwargs = {
            "prompt": full_prompt,
            "negative_prompt": neg_prompt,
            "image": canny_apose,
            "num_inference_steps": 20,
            "guidance_scale": 7.5,
            "width": 512,
            "height": 512
        }
        if hasattr(pipe, "ip_adapter_image") or "ip_adapter_image" in pipe.__call__.__code__.co_varnames:
            gen_kwargs["ip_adapter_image"] = ref_image
            
        result = pipe(**gen_kwargs).images[0]
        result.save(output_path)
        print(f"[T-Pose GPU] Canonical A-pose synthesized successfully -> {output_path}")
        return True
    except Exception as e:
        print(f"[T-Pose GPU Error] {e}")
        return False

def canonicalize_character_image(input_img_path: str, output_path: str, use_gpu: bool = False, prompt: str = "") -> str:
    """
    High-level entrypoint: Takes any character image and saves a 512x512 canonical A-pose plate.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    if use_gpu:
        success = generate_diffusion_apose(input_img_path, output_path, prompt=prompt)
        if success and os.path.exists(output_path):
            return output_path
            
    # Deterministic anatomical normalization fallback
    print(f"[T-Pose] Running Deterministic Anatomical Normalization on {input_img_path}...")
    src_img = Image.open(input_img_path)
    canonical_plate = deterministic_anatomical_normalize(src_img, target_size=(512, 512))
    canonical_plate.save(output_path)
    print(f"[T-Pose] Canonical Plate Saved -> {output_path}")
    return output_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MyOS Flesh Golem T-Pose Canonicalizer")
    parser.add_argument("--input", required=True, help="Input character image path")
    parser.add_argument("--output", required=True, help="Output canonical plate path")
    parser.add_argument("--gpu", action="store_true", help="Enable local diffusion GPU pose transfer")
    parser.add_argument("--prompt", default="", help="Optional prompt description")
    args = parser.parse_args()
    
    canonicalize_character_image(args.input, args.output, use_gpu=args.gpu, prompt=args.prompt)
