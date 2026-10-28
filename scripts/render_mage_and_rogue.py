import subprocess, sys

for hero in ['mage', 'rogue']:
    print(f"\n==========================================")
    print(f"Starting headless filming for: {hero.upper()}")
    print(f"==========================================")
    cmd = [
        r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe",
        "-b",
        "--python",
        "scripts/render_hero_spritesheets.py",
        "--",
        hero
    ]
    res = subprocess.run(cmd)
    if res.returncode != 0:
        print(f"Error rendering {hero}: code {res.returncode}")
        sys.exit(res.returncode)
    print(f"Completed {hero.upper()} successfully!")

print("\n=== ALL MAGE AND ROGUE ACTION SPRITESHEETS COMPLETED ===")
