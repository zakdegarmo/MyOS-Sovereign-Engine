with open('apps/web/public/hemp_crew_lounge.html', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.splitlines(True)
for idx, l in enumerate(lines):
    if 'frankImg.src = "data:image/png;base64' in l:
        lines[idx] = '    frankImg.src = "/actions/hemp_crew/frankie_squirrel_idle.png";\n'
        print(f'Replaced frankImg.src at line {idx+1}')
        break

new_content = ''.join(lines)

old_ctrl = '<span><kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">E</kbd> Listen to Frankie\'s Rants</span>'
new_ctrl = '''<span><kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">E / R</kbd> Cue Frank Rant</span>
        <span class="text-zinc-600">|</span>
        <span><kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">1-4</kbd> Rotate Actor (N/W/S/E)</span>'''

if old_ctrl in new_content:
    new_content = new_content.replace(old_ctrl, new_ctrl)
    print('Updated Controls Overlay HUD')

old_keys = '''      if (e.key.toLowerCase() === "e") {
        triggerFrankRant();
      }'''
new_keys = '''      if (e.key.toLowerCase() === "e" || e.key.toLowerCase() === "r") {
        triggerFrankRant();
      }
      if (e.key === "1") frank.dirRow = 0; // North (Back)
      if (e.key === "2") frank.dirRow = 1; // West (Left)
      if (e.key === "3") frank.dirRow = 2; // South (Front)
      if (e.key === "4") frank.dirRow = 3; // East (Right)'''

if old_keys in new_content:
    new_content = new_content.replace(old_keys, new_keys)
    print('Updated Keydown Event Listener')

with open('apps/web/public/hemp_crew_lounge.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Updated hemp_crew_lounge.html successfully!')
