import sys
from PIL import Image

def pixelate_and_quantize(input_path, output_path, target_width=64, num_colors=16):
    """
    Downscales an image to create a pixel grid, reduces its color palette, 
    and upscales it back to the original size with sharp edges.
    """
    try:
        # Load the image
        img = Image.open(input_path).convert('RGB')
        original_size = img.size
        print(f"Original image size: {original_size}")
        
        # Calculate aspect ratio to determine target height
        aspect_ratio = float(original_size[1]) / float(original_size[0])
        # We don't resize the image anymore, because Stable Diffusion generates
        # "faux-pixels" that look great at 512x512. Resizing them destroys the grid.
        
        # Palette Reduction (Quantize to N colors)
        print(f"Quantizing to {num_colors} colors...")
        quantized_img = img.quantize(colors=num_colors, method=Image.Quantize.MEDIANCUT)
        
        # Convert back to RGB
        final_img = quantized_img.convert('RGB')
        
        # Save the result
        final_img.save(output_path)
        print(f"SUCCESS: Filtered image saved to {output_path}")
        
    except Exception as e:
        print(f"Error processing image: {e}")
        sys.exit(1)

if __name__ == "__main__":
    input_image = "pipeline_test_single_output.png"
    output_image = "filtered_single_output_v5.png"
    
    # Just lock the palette to 32 colors to get that crisp SNES color banding without ruining the resolution
    pixelate_and_quantize(input_image, output_image, target_width=512, num_colors=32)
