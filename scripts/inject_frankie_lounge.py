import base64

sheet_path = r"apps\web\public\actions\hemp_crew\frankie_squirrel_idle.png"
with open(sheet_path, "rb") as f:
    b64_data = base64.b64encode(f.read()).decode("utf-8")

html_path = r"apps\web\public\hemp_crew_lounge.html"
with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace frankImg.src
old_src_start = 'const frankImg = new Image();\n    frankImg.src = "'
old_src_idx = content.find(old_src_start)
if old_src_idx != -1:
    old_src_end = content.find('";', old_src_idx)
    new_src_str = f'const frankImg = new Image();\n    frankImg.src = "data:image/png;base64,{b64_data}'
    content = content[:old_src_idx] + new_src_str + content[old_src_end:]
    print("Replaced frankImg base64 successfully!")

# Replace frank object definition
old_frank_def = """const frank = {
      x: 520,
      y: 560,
      width: 175,
      height: 155,
      twitchTimer: 0,
      twitchOffset: 0,
      twitchRot: 0,
      cackleTimer: 0
    };"""

new_frank_def = """const frank = {
      x: 520,
      y: 560,
      width: 175,
      height: 175,
      dirRow: 2, // 2 = South (front facing)
      frame: 0,
      animTimer: 0,
      animSpeed: 6,
      twitchTimer: 0,
      twitchOffset: 0,
      twitchRot: 0,
      cackleTimer: 0
    };"""

if old_frank_def in content:
    content = content.replace(old_frank_def, new_frank_def)
    print("Replaced frank object state!")

# Update animation update in updateEntities()
old_anim_update = """      // Frank's Manic Twitching Physics
      frank.twitchTimer += 0.15;"""

new_anim_update = """      // Frank 3D Animated Kinematic Frame Update
      frank.animTimer += 1;
      if (frank.animTimer >= frank.animSpeed) {
        frank.animTimer = 0;
        frank.frame = (frank.frame + 1) % 8;
      }

      // Frank's Manic Twitching Physics
      frank.twitchTimer += 0.15;"""

if old_anim_update in content:
    content = content.replace(old_anim_update, new_anim_update)
    print("Added frank frame animation timer!")

# Update frank draw in drawScene()
old_frank_draw = """      // 3. Draw Frankie 'Nuts' Gallagher (On Persian Rug)
      if (frankImg.complete && frankImg.naturalWidth > 0) {
        ctx.save();
        ctx.translate(frank.x, frank.y + frank.twitchOffset);
        ctx.rotate(frank.twitchRot);
        
        // Shadow on rug
        ctx.beginPath();
        ctx.ellipse(0, 55, 65, 20, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fill();

        ctx.drawImage(
          frankImg, 
          -frank.width / 2, 
          -frank.height / 2 - 10, 
          frank.width, 
          frank.height
        );
        ctx.restore();
      }"""

new_frank_draw = """      // 3. Draw Frankie 'Nuts' Gallagher Animated 3D Spritesheet (On Persian Rug)
      if (frankImg.complete && frankImg.naturalWidth > 0) {
        ctx.save();
        ctx.translate(frank.x, frank.y + frank.twitchOffset);
        ctx.rotate(frank.twitchRot);
        
        // Shadow on rug
        ctx.beginPath();
        ctx.ellipse(0, 65, 70, 22, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fill();

        const fTileW = 128;
        const fTileH = 128;
        const fsx = frank.frame * fTileW;
        const fsy = frank.dirRow * fTileH;

        ctx.drawImage(
          frankImg,
          fsx, fsy, fTileW, fTileH,
          -frank.width / 2, 
          -frank.height / 2 - 10, 
          frank.width, 
          frank.height
        );
        ctx.restore();
      }"""

if old_frank_draw in content:
    content = content.replace(old_frank_draw, new_frank_draw)
    print("Updated frank draw call with 128x128 sprite slices!")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Successfully saved updated hemp_crew_lounge.html!")
