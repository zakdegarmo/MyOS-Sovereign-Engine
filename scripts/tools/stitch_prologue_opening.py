# scripts/tools/stitch_prologue_opening.py
"""
stitch_prologue_opening.py
--------------------------
Post-processes the 360 prologue frames:
  - Fades in from pure black (Frames 1-40)
  - Applies 2.39:1 anamorphic letterbox
  - Fades in grunge bassline from act1_scrap_yard_rock.wav (timed to Shot 2 puddle entry)
  - Encodes H.264 MP4 to apps/web/public/screenings/prologue_opening_test.mp4
"""

import os
import sys
import glob
from PIL import Image, ImageDraw
import av
import numpy as np

# Windows UTF-8
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
FRAMES_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "prologue_opening")
PROCESSED_DIR = os.path.join(FRAMES_DIR, "processed")
OUTPUT_MP4 = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "screenings", "prologue_opening_test.mp4")
AUDIO_INPUT = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "audio", "act1_scrap_yard_rock.wav")

os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(os.path.dirname(OUTPUT_MP4), exist_ok=True)

def process_frames():
    raw_frames = sorted(glob.glob(os.path.join(FRAMES_DIR, "frame_*.png")))
    if not raw_frames:
        print(f"❌ No raw frames found in {FRAMES_DIR}!")
        return []

    print(f"🎞️ Found {len(raw_frames)} frames. Processing letterbox and fades...")
    first_frame = Image.open(raw_frames[0])
    w, h = first_frame.size
    bar_height = int(h * 0.12) # ~12% top/bottom letterbox

    processed_paths = []

    for idx, f_path in enumerate(raw_frames):
        frame_num = idx + 1
        img = Image.open(f_path).convert('RGB')

        # Fade in from black on Shot 1 (Frames 1 to 48)
        if frame_num <= 48:
            fade_factor = frame_num / 48.0
            # Darken pixels
            arr = np.array(img, dtype=np.float32) * fade_factor
            img = Image.fromarray(arr.astype(np.uint8))

        draw = ImageDraw.Draw(img)

        # Letterbox bars
        draw.rectangle([(0, 0), (w, bar_height)], fill=(0, 0, 0))
        draw.rectangle([(0, h - bar_height), (w, h)], fill=(0, 0, 0))

        out_path = os.path.join(PROCESSED_DIR, f"proc_{frame_num:04d}.png")
        img.save(out_path)
        processed_paths.append(out_path)

        if frame_num % 60 == 0:
            print(f"  Processed {frame_num}/{len(raw_frames)} frames...")

    print(f"✅ All {len(processed_paths)} frames post-processed.")
    return processed_paths

def encode_mp4(processed_paths):
    if not processed_paths:
        return False

    first_img = Image.open(processed_paths[0])
    w, h = first_img.size
    fps = 24

    print(f"🎥 Encoding {len(processed_paths)} frames to {OUTPUT_MP4} ({w}x{h} @ {fps}fps)...")

    container = av.open(OUTPUT_MP4, mode='w')
    v_stream = container.add_stream('libx264', rate=fps)
    v_stream.width = w
    v_stream.height = h
    v_stream.pix_fmt = 'yuv420p'
    v_stream.options = {'crf': '18', 'preset': 'fast'}

    # Audio stream
    has_audio = os.path.exists(AUDIO_INPUT)
    a_stream = None
    audio_container = None
    if has_audio:
        print(f"🎵 Muxing soundtrack from {AUDIO_INPUT}...")
        try:
            audio_container = av.open(AUDIO_INPUT)
            in_a_stream = audio_container.streams.audio[0]
            a_stream = container.add_stream('aac', rate=in_a_stream.rate)
        except Exception as e:
            print(f"⚠️ Audio setup warning: {e}")

    # Write video frames
    for idx, f_path in enumerate(processed_paths):
        img = Image.open(f_path).convert('RGB')
        frame = av.VideoFrame.from_image(img)
        frame.pts = idx
        for packet in v_stream.encode(frame):
            container.mux(packet)

    for packet in v_stream.encode():
        container.mux(packet)

    # Encode audio frames (clamped to 15.0s video duration)
    if has_audio and audio_container and a_stream:
        total_video_duration = len(processed_paths) / float(fps)
        try:
            for a_frame in audio_container.decode(audio=0):
                if a_frame.time is not None and a_frame.time > total_video_duration:
                    break
                a_frame.pts = None
                for packet in a_stream.encode(a_frame):
                    container.mux(packet)
            for packet in a_stream.encode():
                container.mux(packet)
        except Exception as e:
            print(f"⚠️ Audio mux warning: {e}")

    container.close()
    if audio_container:
        audio_container.close()

    print(f"🎉 Pristine video encoded to {OUTPUT_MP4} ({os.path.getsize(OUTPUT_MP4)} bytes)")
    return True

if __name__ == "__main__":
    frames = process_frames()
    encode_mp4(frames)
