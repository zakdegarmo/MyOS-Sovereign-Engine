import os
import subprocess
import time

base_in = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\lpc"
base_out = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\billboards"
detector_script = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\scripts\tools\alpha_island_detector.py"

processed = {
    "%5BLPC%5D%20Crown", "adobe%20building%20set", "alchemy", "Androgynous%20Bases",
    "Androgynous%20Long-Sleeve%20Shirt", "Androgynous%20Pants", "androgynous_short_sleeve_shirt",
    "Animations", "Aprons", "arabic%20set", "archives_processed", "assets_0", "Atlas_0", "Atlas2"
}

all_dirs = [d for d in os.listdir(base_in) if os.path.isdir(os.path.join(base_in, d))]
remaining_dirs = [d for d in all_dirs if d not in processed]

print(f"Starting batch process for {len(remaining_dirs)} directories...")

log_file = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\scripts\tools\slicing_log.txt"

with open(log_file, "w", encoding="utf-8") as log:
    for count, d in enumerate(remaining_dirs, 1):
        in_path = os.path.join(base_in, d)
        msg = f"\n[{count}/{len(remaining_dirs)}] Processing folder: {d}..."
        print(msg)
        log.write(msg + "\n")
        
        # Run the detector script
        result = subprocess.run(
            ["python", detector_script, "--input", in_path, "--out_dir", base_out],
            capture_output=True,
            text=True
        )
        
        # Filter the output to just count how many assets were extracted
        extracted_lines = [line.strip() for line in result.stdout.split('\n') if "Extracted" in line]
        total_extracted = 0
        for line in extracted_lines:
            try:
                # e.g., "-> Extracted 142 assets."
                num = int(line.split("Extracted")[1].split("assets")[0].strip())
                total_extracted += num
            except:
                pass
                
        summary = f"   -> Successfully extracted {total_extracted} total assets from '{d}'"
        print(summary)
        log.write(summary + "\n")

print("\nBatch processing complete!")
