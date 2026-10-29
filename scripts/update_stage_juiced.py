import base64

sheet_bee = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee_juiced_idle.png"
pub_html = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\playable_squirrel_stage.html"
art_html = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\playable_squirrel_stage.html"

with open(sheet_bee, "rb") as f:
    b64_new = base64.b64encode(f.read()).decode("utf-8")

with open(pub_html, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the beeImg src
import re
updated = re.sub(r'beeImg\.src\s*=\s*"data:image/png;base64,[^"]+"', f'beeImg.src = "data:image/png;base64,{b64_new}"', content)

with open(pub_html, "w", encoding="utf-8") as f:
    f.write(updated)
with open(art_html, "w", encoding="utf-8") as f:
    f.write(updated)

print("Updated stage with JUICED Doob-bee spritesheet!")
