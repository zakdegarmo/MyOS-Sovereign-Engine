import os
import json
import base64
import requests
import torch
from diffusers import StableDiffusionPipeline

OLLAMA_URL = "http://localhost:11434/api/generate"
SD_MODEL_ID = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\.cache\huggingface\hub\models--runwayml--stable-diffusion-v1-5\snapshots\451f4fe16113bff5a5d2269ed5ad43b0592e9a14"

def query_ollama(model: str, prompt: str, image_path: str = None) -> str:
    print(f"Querying {model}...")
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    
    if image_path:
        with open(image_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode('utf-8')
        payload["images"] = [img_b64]
        
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        response.raise_for_status()
        return response.json().get("response", "")
    except Exception as e:
        print(f"Error querying {model}: {e}")
        return ""

def main():
    reference_image = r"C:\Users\zakde\.gemini\antigravity\brain\70f23b72-45a0-444f-8974-17650b683dd0\.user_uploaded\media_1786419523087.png"
    
    # 1. Vision Analysis via LLaVA
    llava_prompt = """
    Analyze this single pixel art character sprite.
    Do not describe the background. 
    Provide a deep, technical breakdown of:
    1. The visual style (e.g. proportions, outline style, chibi vs realistic, pixel art aesthetics).
    2. The color palettes and shading techniques (e.g. flat shading, limited palette, neon accents).
    3. The lighting and textural feel (metallic armor, cloth, organic details).
    4. The specific pose, orientation, and camera perspective (e.g. strict isometric, top-down, or straight-on).
    Give me a clinical, highly detailed aesthetic description that could be used as a blueprint to recreate this exact art style.
    """
    
    aesthetic_analysis = query_ollama("llava:latest", llava_prompt, reference_image)
    print("\n--- LLaVA Analysis ---")
    print(aesthetic_analysis)
    
    if not aesthetic_analysis:
        print("Pipeline aborted: Failed to get analysis from LLaVA.")
        return

    # 2. Prompt Structuring via Gemma 4
    gemma_prompt = f"""
    You are an expert AI Prompt Engineer for Stable Diffusion 1.5. 
    I will provide you with a deep aesthetic analysis of a single reference pixel-art character. 
    Your goal is to translate this analysis into a highly optimized, comma-separated Stable Diffusion prompt to generate a NEW single character (a tough female cyberpunk bounty hunter) matching this EXACT style.

    Reference Analysis:
    {aesthetic_analysis}

    Instructions:
    - Isolate the core aesthetic keywords from the analysis.
    - IMPORTANT: The user specifically wants a Chrono Trigger JRPG aesthetic. Do NOT use the word "8-bit". 
    - You MUST include these exact phrases in your prompt: "JRPG style character, LPC sprite sheet style, true 16-bit SNES JRPG sprite, Akira Toriyama art style, crisp hand-placed pixels, orthographic 3/4 top-down perspective".
    - Combine them into a single, highly detailed positive prompt (max 75 words). 
    - Then, create a strict negative prompt to prevent 3D, realism, artifacting, 8-bit, blurry, and background clutter.
    - OUTPUT FORMAT (Strictly JSON, no markdown blocks, no other text):
    {{
        "positive_prompt": "your detailed prompt here",
        "negative_prompt": "your negative prompt here",
        "guidance_scale": 8.0,
        "inference_steps": 50
    }}
    """
    
    gemma_response = query_ollama("gemma4", gemma_prompt)
    print("\n--- Gemma Output ---")
    print(gemma_response)
    
    # Very basic JSON extraction
    try:
        # Strip markdown codeblocks if Gemma ignores the strict instruction
        cleaned = gemma_response.replace("```json", "").replace("```", "").strip()
        sd_config = json.loads(cleaned)
    except Exception as e:
        print(f"Failed to parse Gemma output as JSON: {e}")
        return

    # 3. Generation via Stable Diffusion
    print("\n--- Initializing Stable Diffusion ---")
    try:
        pipe = StableDiffusionPipeline.from_pretrained(
            SD_MODEL_ID, 
            torch_dtype=torch.float16,
            variant="fp16",
            use_safetensors=True,
            safety_checker=None
        )
        if torch.cuda.is_available():
            pipe = pipe.to("cuda")
        else:
            print("CUDA not available. GPU acceleration required for this pipeline.")
            return
            
        print("Loading Pixel Art LoRA...")
        pipe.load_lora_weights("Limbicnation/pixel-art-lora", weight_name="pytorch_lora_weights.safetensors")
        
        print(f"Generating image with prompt: {sd_config['positive_prompt']}")
        image = pipe(
            prompt=sd_config['positive_prompt'],
            negative_prompt=sd_config['negative_prompt'],
            guidance_scale=sd_config.get('guidance_scale', 8.0),
            num_inference_steps=sd_config.get('inference_steps', 50)
        ).images[0]
        
        output_path = "pipeline_test_single_output.png"
        image.save(output_path)
        print(f"\nSUCCESS: Pipeline completed. Image saved to {output_path}")
        
    except Exception as e:
        print(f"Stable diffusion generation failed: {e}")

if __name__ == "__main__":
    main()
