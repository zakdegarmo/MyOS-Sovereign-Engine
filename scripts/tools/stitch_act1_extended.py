"""
stitch_act1_extended.py
-----------------------
Post-processes and compiles all 6 shots for the 2.5-minute extended film:
"Glyphrider: Torus Outlaws // Act 1: The 30-Year Slumber: Outlaw Awakening"

1. Ingests raw frames from temp_studio_frames/act1_extended/shot_01 .. shot_06 (3,840 frames).
2. Applies 2.39:1 widescreen cinematic letterboxing.
3. Burns formatted narrative subtitles with generous reading and atmospheric padding.
4. Muxes with the master 160-second symphonic score:
   'apps/web/public/audio/act1_scrap_yard_rock_full.wav'
5. Encodes pristine H.264 MP4 to:
   'apps/web/public/screenings/act1_scrap_yard_awakening_full.mp4'
"""

import os
import sys
import glob
from PIL import Image, ImageDraw, ImageFont
import av

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_ROOT = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "act1_extended")
FINAL_DIR = os.path.join(OUTPUT_ROOT, "final")
VIDEO_OUTPUT = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "screenings", "act1_scrap_yard_awakening_full.mp4")
AUDIO_INPUT = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "audio", "act1_scrap_yard_rock_full.wav")

os.makedirs(FINAL_DIR, exist_ok=True)
os.makedirs(os.path.dirname(VIDEO_OUTPUT), exist_ok=True)

# Subtitle Schedule: (StartFrame, EndFrame, Text)
# 24fps -> 1 second = 24 frames
SUBTITLES = [
    # Scene 1 (Frames 1 - 600)
    (72, 360, "1994. The supreme court issued the ban. A unicycle with attitude was deemed too dangerous for the market."),
    # Scene 2 (Frames 601 - 1200)
    (672, 960, "The factories shut down. The tracks were demolished. The world moved on... or so they thought."),
    # Scene 3 (Frames 1201 - 1920)
    (1272, 1680, "Thirty years rusting in the dark. Cold hubs, flat rubber, and silent bearings. But inside the chassis, the core never died."),
    # Scene 4 (Frames 1921 - 2640)
    (2040, 2400, "An encrypted pirate signal breaks through the cathode static: The Underground Syndicate has returned."),
    # Scene 5 (Frames 2641 - 3240)
    (2712, 3000, "Fresh oil in the bearings. 1000 foot-pounds of torque ready to unchain."),
    # Scene 6 (Frames 3241 - 3840)
    (3312, 3650, "Time to get the old crew back together. The Outlaw Syndicate rides again."),
    (3672, 3840, "GLYPHRIDER: TORUS OUTLAWS // ACT 1: SCRAP YARD BREAKOUT")
]

def collect_all_shot_frames():
    """Gathers all frames from shot_01 through shot_06 in order."""
    shot_folders = ["shot_01", "shot_02", "shot_03", "shot_04", "shot_05", "shot_06"]
    ordered_frames = []

    for folder in shot_folders:
        dir_path = os.path.join(OUTPUT_ROOT, folder)
        frames = sorted(glob.glob(os.path.join(dir_path, "raw_frame_*.png")))
        print(f"  • {folder}: Found {len(frames)} frames")
        ordered_frames.extend(frames)

    return ordered_frames

def post_process_frames(frames):
    if not frames:
        print("[ERROR] No rendered raw frames found!")
        return False

    total_frames = len(frames)
    print(f"\n[INFO] Post-processing {total_frames} frames (Letterbox + Subtitles)...")

    first_frame = Image.open(frames[0])
    w, h = first_frame.size
    bar_height = int(h * 0.12) # ~12% cinematic letterbox bars

    # Process in batches to display progress
    for idx, f_path in enumerate(frames):
        global_frame_num = idx + 1
        img = Image.open(f_path).convert('RGB')
        draw = ImageDraw.Draw(img)

        # 1. 2.39:1 Letterbox bars
        draw.rectangle([(0, 0), (w, bar_height)], fill=(0, 0, 0))
        draw.rectangle([(0, h - bar_height), (w, h)], fill=(0, 0, 0))

        # 2. Matching Subtitle
        current_sub = ""
        for start_f, end_f, text in SUBTITLES:
            if start_f <= global_frame_num <= end_f:
                current_sub = text
                break

        if current_sub:
            sub_y = h - int(bar_height * 0.72)
            bbox = draw.textbbox((0, 0), current_sub)
            text_w = bbox[2] - bbox[0]
            text_x = max(20, (w - text_w) // 2)
            # Drop shadow
            draw.text((text_x + 1, sub_y + 1), current_sub, fill=(0, 0, 0))
            # Nostalgic yellow arcade caption
            is_title = "GLYPHRIDER" in current_sub
            color = (0, 255, 255) if is_title else (255, 230, 95)
            draw.text((text_x, sub_y), current_sub, fill=color)

        # Header Title in Cyan
        draw.text((25, int(bar_height * 0.3)), "GLYPHRIDER: TORUS OUTLAWS // ACT 1: PROLOGUE", fill=(0, 255, 255))

        out_frame = os.path.join(FINAL_DIR, f"final_frame_{global_frame_num:05d}.png")
        img.save(out_frame)

        if global_frame_num % 400 == 0 or global_frame_num == total_frames:
            print(f"  Processed {global_frame_num} / {total_frames} frames ({global_frame_num / total_frames * 100:.1f}%)")

    print("[SUCCESS] All frames post-processed!")
    return True

def stitch_with_audio():
    processed_frames = sorted(glob.glob(os.path.join(FINAL_DIR, "final_frame_*.png")))
    if not processed_frames:
        print("[ERROR] No processed frames found!")
        return False

    first_frame = Image.open(processed_frames[0])
    w, h = first_frame.size

    print(f"\n[INFO] Compiling H.264 MP4 with PyAV ({len(processed_frames)} frames @ 24fps = {len(processed_frames)/24:.1f}s)...")
    container = av.open(VIDEO_OUTPUT, mode='w', format='mp4', options={'movflags': 'faststart'})

    v_stream = container.add_stream('libx264', rate=24)
    v_stream.width = w
    v_stream.height = h
    v_stream.pix_fmt = 'yuv420p'
    v_stream.options = {'crf': '20', 'preset': 'fast'}

    # Audio stream
    has_audio = False
    a_stream = None
    resampler = None
    a_input = None

    if os.path.exists(AUDIO_INPUT):
        try:
            a_input = av.open(AUDIO_INPUT)
            if len(a_input.streams.audio) > 0:
                in_a = a_input.streams.audio[0]
                a_stream = container.add_stream('aac', rate=44100)
                resampler = av.AudioResampler(format='fltp', layout='stereo', rate=44100)
                has_audio = True
                print(f"[AUDIO] Muxing symphonic soundtrack: {AUDIO_INPUT}")
        except Exception as e:
            print(f"[WARNING] Audio open warning: {e}")

    # Encode Video Frames
    total_f = len(processed_frames)
    for idx, f_path in enumerate(processed_frames):
        frame_img = Image.open(f_path)
        frame_av = av.VideoFrame.from_image(frame_img)
        frame_av.pts = idx
        for packet in v_stream.encode(frame_av):
            container.mux(packet)
        if (idx + 1) % 500 == 0 or (idx + 1) == total_f:
            print(f"  Encoded {idx + 1} / {total_f} video frames...")

    for packet in v_stream.encode():
        container.mux(packet)

    # Encode Audio Samples
    if has_audio and a_input and a_stream and resampler:
        try:
            audio_pts = 0
            for frame in a_input.decode(audio=0):
                resampled = resampler.resample(frame)
                for r_frame in resampled:
                    r_frame.pts = audio_pts
                    audio_pts += r_frame.samples
                    for packet in a_stream.encode(r_frame):
                        container.mux(packet)
            for packet in a_stream.encode():
                container.mux(packet)
            a_input.close()
            print("[AUDIO] Audio muxing complete!")
        except Exception as e:
            print(f"[WARNING] Audio encoding warning: {e}")

    container.close()
    file_size_mb = os.path.getsize(VIDEO_OUTPUT) / (1024 * 1024)
    print(f"\n[SUCCESS] Extended Cutscene Reel baked to:\n  {VIDEO_OUTPUT} ({file_size_mb:.2f} MB)")
    return True

def main():
    print("=== EXTENDED CUTSCENE STITCHER & COMPILER ===")
    frames = collect_all_shot_frames()
    if post_process_frames(frames):
        stitch_with_audio()

if __name__ == "__main__":
    main()
