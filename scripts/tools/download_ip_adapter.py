import torch
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel

def main():
    print("Initializing dummy pipeline to trigger downloads...")
    # Use global cache (SD1.5 and Canny are already here!)
    controlnet = ControlNetModel.from_pretrained(
        "lllyasviel/sd-controlnet-canny",
        torch_dtype=torch.float16,
        use_safetensors=True
    )
    
    pipe = StableDiffusionControlNetPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        controlnet=controlnet,
        torch_dtype=torch.float16,
        safety_checker=None
    )
    
    print("\n--- INITIATING IP-ADAPTER DOWNLOAD ---")
    
    pipe.load_ip_adapter(
        "h94/IP-Adapter", 
        subfolder="models", 
        weight_name="ip-adapter_sd15.bin"
    )
    
    print("\nSUCCESS! IP-Adapter and Vision Encoders are fully downloaded and cached locally.")

if __name__ == "__main__":
    main()
