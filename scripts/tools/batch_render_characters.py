import subprocess
import os
import sys

BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
RENDER_SCRIPT = "scripts/tools/render_character_blender.py"
COMPILE_SCRIPT = "compile_blender_renders.py"
REGISTER_SCRIPT = "scripts/tools/register_character.py"

CHARACTERS = [
    {
        "id": "sir_valor",
        "name": "Sir Valor",
        "glb": "apps/web/public/models/meshy ai glb/rigged/Meshy_AI_Sir_Valor_biped/Meshy_AI_Sir_Valor_biped_Animation_Walking_withSkin.glb",
        "billboard_dir": "C:/assets/billboards/sir_valor_blender",
        "output_png": "apps/web/public/assets/lpc/body/bodies/sir_valor.png"
    },
    {
        "id": "sunlit_paladin",
        "name": "Sunlit Paladin",
        "glb": "apps/web/public/models/meshy ai glb/rigged/Meshy_AI_Sunlit_Paladin_biped/Meshy_AI_Sunlit_Paladin_biped/Meshy_AI_Sunlit_Paladin_biped_Animation_Walking_withSkin.glb",
        "billboard_dir": "C:/assets/billboards/sunlit_paladin_blender",
        "output_png": "apps/web/public/assets/lpc/body/bodies/sunlit_paladin.png"
    },
    {
        "id": "midnight_huntsman",
        "name": "Midnight Huntsman",
        "glb": "apps/web/public/models/meshy ai glb/rigged/Meshy_AI_Midnight_Huntsman_biped/Meshy_AI_Midnight_Huntsman_biped/Meshy_AI_Midnight_Huntsman_biped_Animation_Walking_withSkin.glb",
        "billboard_dir": "C:/assets/billboards/midnight_huntsman_blender",
        "output_png": "apps/web/public/assets/lpc/body/bodies/midnight_huntsman.png"
    },
    {
        "id": "wilderness_scout",
        "name": "Wilderness Scout",
        "glb": "apps/web/public/models/meshy ai glb/rigged/Meshy_AI_Wilderness_Scout_biped/Meshy_AI_Wilderness_Scout_biped_Meshy_AI_Meshy_Merged_Animations.glb",
        "billboard_dir": "C:/assets/billboards/wilderness_scout_blender",
        "output_png": "apps/web/public/assets/lpc/body/bodies/wilderness_scout.png"
    },
    {
        "id": "moonlit_mage",
        "name": "Moonlit Mage",
        "glb": "apps/web/public/models/meshy ai glb/rigged/Meshy_AI_Moonlit_Mage_biped/Meshy_AI_Moonlit_Mage_biped/Meshy_AI_Moonlit_Mage_biped_Meshy_AI_Meshy_Merged_Animations.glb",
        "billboard_dir": "C:/assets/billboards/moonlit_mage_blender",
        "output_png": "apps/web/public/assets/lpc/body/bodies/moonlit_mage.png"
    },
    {
        "id": "armored_adventurer",
        "name": "Armored Adventurer",
        "glb": "apps/web/public/models/meshy ai glb/rigged/Meshy_AI_Armored_Adventurer_biped/Meshy_AI_Armored_Adventurer_biped/Meshy_AI_Armored_Adventurer_biped_Meshy_AI_Meshy_Merged_Animations.glb",
        "billboard_dir": "C:/assets/billboards/armored_adventurer_blender",
        "output_png": "apps/web/public/assets/lpc/body/bodies/armored_adventurer.png"
    },
    {
        "id": "azure_adventurer",
        "name": "Azure Adventurer",
        "glb": "apps/web/public/models/meshy ai glb/rigged/Meshy_AI_Azure_Adventurer_biped/Meshy_AI_Azure_Adventurer_biped/Meshy_AI_Azure_Adventurer_biped_Meshy_AI_Meshy_Merged_Animations.glb",
        "billboard_dir": "C:/assets/billboards/azure_adventurer_blender",
        "output_png": "apps/web/public/assets/lpc/body/bodies/azure_adventurer.png"
    }
]

def main():
    for char in CHARACTERS:
        cid = char["id"]
        cname = char["name"]
        glb = char["glb"]
        bdir = char["billboard_dir"]
        out_png = char["output_png"]
        
        print(f"--- PROCESSING CHARACTER: {cname} ({cid}) ---")
        
        if not os.path.exists(glb):
            print(f"[!] Error: GLB file not found: {glb}")
            continue
            
        # 1. Render in Blender 5.2
        print(f"[*] Rendering 32 frames in Blender 5.2...")
        cmd_render = [
            BLENDER_EXE,
            "--background",
            "--python", RENDER_SCRIPT,
            "--", glb, bdir, cid
        ]
        res = subprocess.run(cmd_render, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"[X] Blender render error for {cid}:\n{res.stderr}")
            continue
        print(f"[+] Rendered successfully to {bdir}")
        
        # 2. Compile into LPC Master Spritesheet
        print(f"[*] Compiling LPC True HD spritesheet with miniature wash...")
        cmd_compile = [
            sys.executable,
            COMPILE_SCRIPT,
            bdir, out_png, cid
        ]
        res = subprocess.run(cmd_compile, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"[X] Compilation error for {cid}:\n{res.stderr}")
            continue
        print(f"[+] Compiled: {out_png}")
        
        # 3. Register in Manifest
        cmd_reg = [
            sys.executable,
            REGISTER_SCRIPT,
            "--name", cid
        ]
        subprocess.run(cmd_reg, capture_output=True, text=True)
        print(f"[+] Registered in mephit_manifest.json")
        
    print("\n>>> ALL 5 CHARACTERS SUCCESSFULLY PROCESSED AND COMPILED! <<<")

if __name__ == "__main__":
    main()
