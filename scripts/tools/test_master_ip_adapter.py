import torch
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel
from diffusers.utils import load_image
from PIL import Image

RIG_IMAGE = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\master_rig_sheet.png"
CHAR_IMAGE = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\elf_druid_pixel_art_1787104927456.jpg"

def main():
    print("Loading Canny ControlNet...")
    controlnet = ControlNetModel.from_pretrained(
        "lllyasviel/sd-controlnet-canny",
        torch_dtype=torch.float16,
        use_safetensors=True
    )
    
    print("Loading SD 1.5...")
    pipe = StableDiffusionControlNetPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        controlnet=controlnet,
        torch_dtype=torch.float16,
        safety_checker=None
    )
    
    print("Loading IP-Adapter...")
    pipe.load_ip_adapter(
        "h94/IP-Adapter", 
        subfolder="models", 
        weight_name="ip-adapter_sd15.bin"
    )
    
    # Move to GPU
    pipe.to("cuda")
    
    # The IP-Adapter scale controls how strongly the reference image drives the generation
    # 0.5 - 0.7 is usually the sweet spot for preserving the reference without destroying the prompt
    pipe.set_ip_adapter_scale(0.6)
    
    # Load and format the Rig Image
    print("Preparing Master Rig...")
    rig_img = Image.open(RIG_IMAGE).convert("RGB")
    w, h = rig_img.size
    w, h = (w // 8) * 8, (h // 8) * 8
    rig_img = rig_img.resize((w, h))
    
    # Load Character Image
    print("Preparing Character Reference...")
    ip_image = Image.open(CHAR_IMAGE).convert("RGB")
    
    prompt = "A master character spritesheet. Pixel art game asset, pure white background."
    negative_prompt = "blurry, realistic, 3d, out of frame, messy, deformed"
    
    print(f"Generating Master Spritesheet ({w}x{h}) using IP-Adapter... This will take a moment.")
    
    # Generate!
    images = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        image=rig_img,           # ControlNet pose condition
        ip_adapter_image=ip_image, # IP-Adapter style/character condition
        num_inference_steps=25,
        width=w,
        height=h,
        guidance_scale=7.5
    ).images
    
    out_path = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\master_ip_adapter_test.png"
    images[0].save(out_path)
    print(f"\nSUCCESS! Saved to {out_path}")

if __name__ == "__main__":
    main()
