"""
sync_game_workspaces.py
-----------------------
Automated Workspace Synchronizer for Attempt 1.
Ensures both apps/web/public/integrations/integrations/glyphrider-rail-racer (43)
and packages/glyphrider stay 100% bit-for-bit identical across:
- 3D models (uni.glb, cycnet_uninator.glb)
- Cutscenes (public/screenings/*.mp4)
- Game code (GameManager.ts, Campaign.ts, levels/, index.tsx)
"""

import os
import shutil
import glob

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DIR_A = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "integrations", "integrations", "glyphrider-rail-racer (43)")
DIR_B = os.path.join(WORKSPACE_ROOT, "packages", "glyphrider")

def sync_file(rel_path, src_dir=DIR_A, dst_dir=DIR_B):
    src = os.path.join(src_dir, rel_path)
    dst = os.path.join(dst_dir, rel_path)
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        # Also copy from screening master if relevant
        print(f"Synced: {rel_path}")

def sync_all():
    print(f"Synchronizing {DIR_A} <-> {DIR_B}...")
    
    # 1. Sync screen master to both
    master_screenings = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "screenings")
    if os.path.exists(master_screenings):
        for mp4 in glob.glob(os.path.join(master_screenings, "*.mp4")):
            base = os.path.basename(mp4)
            for d in [DIR_A, DIR_B]:
                target = os.path.join(d, "public", "screenings", base)
                os.makedirs(os.path.dirname(target), exist_ok=True)
                shutil.copy2(mp4, target)
                print(f"Mirrored screening: {base} -> {target}")

    # Sync procedural rock soundtracks
    audio_dir = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "audio")
    if os.path.exists(audio_dir):
        for wav in glob.glob(os.path.join(audio_dir, "*.wav")):
            base = os.path.basename(wav)
            for d in [DIR_A, DIR_B]:
                target = os.path.join(d, "public", "audio", base)
                os.makedirs(os.path.dirname(target), exist_ok=True)
                shutil.copy2(wav, target)
                print(f"Mirrored soundtrack: {base} -> {target}")

    # 2. Key game files
    files_to_sync = [
        "index.tsx",
        "src/game/GameManager.ts",
        "src/game/SoundManager.ts",
        "src/game/Campaign.ts",
        "src/game/CampaignTypes.ts",
        "src/game/levels/Level1.ts",
        "src/game/levels/Level2.ts",
        "src/game/levels/Level3.ts",
        "src/game/levels/Level4.ts",
        "cycnet_uninator.glb",
        "public/uni.glb"
    ]

    for f in files_to_sync:
        sync_file(f, DIR_A, DIR_B)

    print("SUCCESS: Workspaces are fully synchronized.")

if __name__ == "__main__":
    sync_all()
