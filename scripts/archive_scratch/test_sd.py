import torch
from diffusers import StableDiffusionPipeline
import os

model_id = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\.cache\huggingface\hub\models--runwayml--stable-diffusion-v1-5\snapshots\451f4fe16113bff5a5d2269ed5ad43b0592e9a14"

print("Loading pipeline...")
pipe = StableDiffusionPipeline.from_pretrained(
    model_id, 
    torch_dtype=torch.float16,
    variant="fp16",
    use_safetensors=True,
    safety_checker=None
)

# Use CUDA if available
if torch.cuda.is_available():
    pipe = pipe.to("cuda")
    print("Using CUDA for generation.")
else:
    print("CUDA not available, running on CPU (this will be slow).")

prompt = "highly detailed 16-bit pixel art sprite of a tough cyberpunk soldier holding a futuristic gun, high resolution, intricate subpixel details, modern retro aesthetic, sharp focus, vibrant colors, isolated on pure white background, masterpiece"
negative_prompt = "blurry, low quality, messy pixels, artifacting, 3d, realistic, photograph, bad proportions, noisy, ugly"

print(f"Generating image for prompt: '{prompt}'")
# Generate the image with better settings
image = pipe(
    prompt=prompt, 
    negative_prompt=negative_prompt, 
    num_inference_steps=50, 
    guidance_scale=8.0
).images[0]

output_path = "test_soldier_sprite.png"
image.save(output_path)
print(f"Image successfully saved to {output_path}")
