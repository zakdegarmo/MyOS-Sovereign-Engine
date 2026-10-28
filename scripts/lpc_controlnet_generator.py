import os
import torch
import cv2
import numpy as np
from PIL import Image
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler

# Model paths - we use standard SD 1.5 and the user's previously cached directory if available
SD_MODEL_ID = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\.cache\huggingface\hub\models--runwayml--stable-diffusion-v1-5\snapshots\451f4fe16113bff5a5d2269ed5ad43b0592e9a14"

# If the local cache doesn't work, fallback to the HF hub ID:
if not os.path.exists(SD_MODEL_ID):
    SD_MODEL_ID = "runwayml/stable-diffusion-v1-5"

def process_canny_edge(image_path: str) -> Image.Image:
    """Load an image and extract Canny edges for ControlNet."""
    print(f"Loading template image from {image_path}...")
    image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if image is None:
        raise FileNotFoundError(f"Could not load image at {image_path}")
    
    # Add a white background if image has alpha, so we can detect outer edges against the background
    if image.shape[2] == 4:
        alpha_channel = image[:, :, 3]
        mask = alpha_channel > 0
        rgb = image[:, :, :3]
        white_bg = np.ones_like(rgb, dtype=np.uint8) * 255
        white_bg[mask] = rgb[mask]
        image = white_bg
        
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Run Canny Edge Detection
    print("Generating Canny edge map...")
    low_threshold = 100
    high_threshold = 200
    edges = cv2.Canny(gray, low_threshold, high_threshold)
    
    # Expand to 3 channels for ControlNet
    edges = edges[:, :, None]
    edges = np.concatenate([edges, edges, edges], axis=2)
    
    return Image.fromarray(edges)

def generate_lpc_sprite(prompt: str, template_path: str, output_path: str, negative_prompt: str = ""):
    print("\n--- Initializing ControlNet ---")
    controlnet_path = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\.cache\huggingface\hub\models--lllyasviel--sd-controlnet-canny\snapshots\main"
    controlnet = ControlNetModel.from_pretrained(
        controlnet_path, 
        torch_dtype=torch.float16,
        use_safetensors=True
    )
    
    print("\n--- Initializing Stable Diffusion Pipeline ---")
    pipe = StableDiffusionControlNetPipeline.from_pretrained(
        SD_MODEL_ID, 
        controlnet=controlnet,
        torch_dtype=torch.float16,
        use_safetensors=True,
        safety_checker=None
    )
    
    # Use a faster scheduler
    pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)
    
    if torch.cuda.is_available():
        pipe = pipe.to("cuda")
        print("Pipeline loaded on CUDA.")
    else:
        print("CUDA not available. This will be very slow.")
        
    print("\n--- Loading Pixel Art LoRA ---")
    try:
        pipe.load_lora_weights("Limbicnation/pixel-art-lora", weight_name="pytorch_lora_weights.safetensors")
    except Exception as e:
        print(f"Failed to load LoRA, proceeding without it: {e}")
    
    # Generate edge map
    control_image = process_canny_edge(template_path)
    
    print(f"\n--- Generating Sprite ---")
    print(f"Prompt: {prompt}")
    
    try:
        generator = torch.manual_seed(42) # For reproducibility
        result_image = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=control_image,
            num_inference_steps=20, # UniPC requires fewer steps
            guidance_scale=7.5,
            controlnet_conditioning_scale=1.0,
            generator=generator,
            width=832,
            height=1344
        ).images[0]
        
        # Save results
        control_image.save(output_path.replace('.png', '_edges.png'))
        result_image.save(output_path)
        print(f"\nSUCCESS! Sprite saved to {output_path}")
        print(f"Edge map saved to {output_path.replace('.png', '_edges.png')} for reference.")
        
    except torch.cuda.OutOfMemoryError:
        print("\nCUDA OutOfMemoryError! The 832x1344 resolution is too large for your GPU.")
        print("We may need to tile or use SDXL/optimizations.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate LPC sprites using ControlNet")
    parser.add_argument("--prompt", type=str, default="16-bit retro JRPG sprite sheet, fantasy dwarf blacksmith, full body, perfectly aligned, pixel art style, masterpiece", help="The text prompt")
    parser.add_argument("--template", type=str, default=r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\lpc\lpc_character_bases-v2\LPC Character Bases\Human\Male\Universal.png", help="Path to base template image")
    parser.add_argument("--output", type=str, default="output_sprite.png", help="Path to save the output")
    
    args = parser.parse_args()
    
    neg = "blurry, smooth, 3d, realistic, messy pixels, artifacting, noisy, bad proportions, photographic, background detail"
    
    generate_lpc_sprite(args.prompt, args.template, args.output, neg)
