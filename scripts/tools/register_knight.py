import json
import os

manifest_path = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\lpc\mephit_manifest.json"

with open(manifest_path, 'r') as f:
    data = json.load(f)

# The UI uses the 'sprites' dictionary
sprites = data.get("sprites", {})
bodies = sprites.get("body/bodies", [])

new_body = "body/bodies/meshy_knight.png"
if new_body not in bodies:
    bodies.append(new_body)
    sprites["body/bodies"] = bodies
    data["sprites"] = sprites
    
    with open(manifest_path, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"Successfully registered {new_body} in manifest!")
else:
    print(f"{new_body} is already registered.")
