import os
import torch
import argparse
from PIL import Image
from diffusers import StableDiffusionControlNetImg2ImgPipeline, ControlNetModel, UniPCMultistepScheduler
from diffusers.utils import load_image
import numpy as np
import cv2

# Paths (Update if needed)
SD_MODEL = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\.cache\huggingface\hub\models--runwayml--stable-diffusion-v1-5\snapshots\451f4fe16113bff5a5d2269ed5ad43b0592e9a14"
CONTROLNET_DIR = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\.cache\huggingface\hub\models--lllyasviel--sd-controlnet-canny\snapshots\main"
LORA_PATH = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\genX"

def get_canny_image(image_path, low_threshold=100, high_threshold=200):
    image = load_image(image_path)
    image = np.array(image)
    
    # Check if image has alpha, and paste over black background to ensure edges are sharp
    if image.shape[2] == 4:
        bg = np.zeros_like(image[:,:,:3])
        alpha = image[:,:,3] / 255.0
        for c in range(3):
            bg[:,:,c] = (image[:,:,c] * alpha).astype(np.uint8)
        image = bg
        
    image = cv2.Canny(image, low_threshold, high_threshold)
    image = image[:, :, None]
    image = np.concatenate([image, image, image], axis=2)
    return Image.fromarray(image)

def create_green_screen_base(image_path):
    img = Image.open(image_path).convert("RGBA")
    
    # Create pure green background
    green_bg = Image.new("RGBA", img.size, (0, 255, 0, 255))
    
    # Composite the transparent sprite over the green background
    green_bg.alpha_composite(img)
    
    # Return as RGB (SD pipelines expect RGB)
    return green_bg.convert("RGB")

def strip_green_screen(image_path, out_path, tolerance=60):
    img = cv2.imread(image_path, cv2.IMREAD_COLOR)
    
    # Convert BGR to HSV for better color masking
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Pure green in HSV is roughly H=60, S=255, V=255
    # We set a range to catch variations of green SD might generate
    lower_green = np.array([40, 50, 50])
    upper_green = np.array([80, 255, 255])
    
    # Create mask of green pixels
    mask = cv2.inRange(hsv, lower_green, upper_green)
    
    # Invert mask (we want the non-green pixels to be opaque)
    mask_inv = cv2.bitwise_not(mask)
    
    # Add alpha channel
    b, g, r = cv2.split(img)
    rgba = [b, g, r, mask_inv]
    dst = cv2.merge(rgba, 4)
    
    cv2.imwrite(out_path, dst)

def manifest(base_image_path, prompt, negative_prompt, out_path, strength=0.45):
    print(f"Loading ControlNet from {CONTROLNET_DIR}...")
    controlnet = ControlNetModel.from_pretrained(
        CONTROLNET_DIR, 
        torch_dtype=torch.float16,
        use_safetensors=True
    )
    
    print(f"Loading Stable Diffusion Img2Img Pipeline from {SD_MODEL}...")
    pipe = StableDiffusionControlNetImg2ImgPipeline.from_pretrained(
        SD_MODEL, 
        controlnet=controlnet, 
        torch_dtype=torch.float16,
        variant="fp16",
        use_safetensors=True,
        safety_checker=None
    )
    
    print("Moving to CUDA and enabling attention slicing...")
    pipe.to("cuda")
    pipe.enable_attention_slicing()
    
    # Speed up inference
    pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)
    
    try:
        print("Attempting to load Pixel Art LoRA...")
        pipe.load_lora_weights("Limbicnation/pixel-art-lora", weight_name="pytorch_lora_weights.safetensors")
        print("LoRA loaded successfully.")
    except Exception as e:
        print(f"Could not load Pixel Art LoRA. Relying purely on prompting. Error: {e}")

    print("Generating Canny edge map...")
    canny_image = get_canny_image(base_image_path)
    
    print("Preparing green-screen base image...")
    init_image = create_green_screen_base(base_image_path)
    
    prompt = f"{prompt}, solid green background"
    
    print(f"Manifesting Sprite with prompt: '{prompt}' (Strength: {strength})...")
    output = pipe(
        prompt,
        image=init_image,
        control_image=canny_image,
        negative_prompt=negative_prompt,
        num_inference_steps=25,
        strength=strength,
        guidance_scale=7.5,
        controlnet_conditioning_scale=1.0,
        width=832,
        height=1344
    ).images[0]
    
    temp_path = out_path.replace(".png", "_temp.png")
    output.save(temp_path)
    
    print("Stripping green screen...")
    strip_green_screen(temp_path, out_path)
    
    # Cleanup temp file
    if os.path.exists(temp_path):
        os.remove(temp_path)
        
    print(f"Manifestation complete! Saved to {out_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manifest a new LPC Sprite using Img2Img")
    parser.add_argument("--base", required=True, help="Path to base LPC sprite (PNG)")
    parser.add_argument("--prompt", required=True, help="Positive SD prompt")
    parser.add_argument("--negative", default="blurry, watermark, text, realistic, 3d render, photograph, cropped, ugly, bad anatomy", help="Negative SD prompt")
    parser.add_argument("--out", default="manifested_sprite.png", help="Output path")
    parser.add_argument("--strength", type=float, default=0.45, help="Denoising strength (0.0 to 1.0, lower preserves more original image)")
    
    args = parser.parse_args()
    manifest(args.base, args.prompt, args.negative, args.out, args.strength)
