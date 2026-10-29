import os
import zipfile
import shutil

PAK_PATH = r"C:\Users\zakde\Downloads\CharGen_v0.9.3\CharGen\data\chargen.pak"
DEST_DIR = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\lpc"

def ingest():
    if not os.path.exists(PAK_PATH):
        print(f"Error: Could not find {PAK_PATH}")
        return

    print(f"Extracting assets from {PAK_PATH}...")
    
    count = 0
    with zipfile.ZipFile(PAK_PATH, 'r') as z:
        for file_info in z.infolist():
            if file_info.filename.startswith('textures/') and file_info.filename.endswith('.png'):
                # Strip the leading 'textures/'
                rel_path = file_info.filename[len('textures/'):]
                
                # Full destination path
                dest_path = os.path.join(DEST_DIR, rel_path)
                
                # Ensure directory exists
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                
                # Extract file manually to maintain folder structure
                with z.open(file_info) as source, open(dest_path, 'wb') as target:
                    shutil.copyfileobj(source, target)
                count += 1
                    
    print(f"Extraction complete! Extracted {count} sprites to {DEST_DIR}")

if __name__ == "__main__":
    ingest()
