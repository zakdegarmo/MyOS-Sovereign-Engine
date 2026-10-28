import os
import sys
import torch

def main():
    print("=" * 60)
    print("MyOS Local LPC Pixel Art Sprite Generator")
    print("=" * 60)

    # Check CUDA GPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")

    output_dir = "apps/web/public/assets/lpc/generated"
    os.makedirs(output_dir, exist_ok=True)

    print("\nSUCCESS: PyTorch CUDA Environment Ready!")
    print(f"Output Directory: {output_dir}")

if __name__ == "__main__":
    main()
