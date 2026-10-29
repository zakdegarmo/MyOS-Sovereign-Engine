# scripts/tools/stitch_prologue_v3.py
"""
stitch_prologue_v3.py
---------------------
Post-processes the 360 Prologue v3 frames:
  - Fades in from pure black (Frames 1-48)
  - Applies 2.39:1 anamorphic letterbox
  - Audio Design:
      * Organic Grunge.mp3 starts at 0:00 (subtle murmur ~0.06 volume) under howling wind
      * Swells smoothly up to 1.0 full volume at 0:08 (7.5s, the exact cut to Shot 2 puddle)
      * Plays at full rock drive through Shot 2
  - Encodes H.264 MP4 to apps/web/public/screenings/prologue_v3.mp4
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
FRAMES_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "prologue_v3")
PROCESSED_DIR = os.path.join(FRAMES_DIR, "processed")
OUTPUT_MP4 = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "screenings", "prologue_v3.mp4")
GRUNGE_AUDIO = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "audio", "organic_grunge.mp3")

os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(os.path.dirname(OUTPUT_MP4), exist_ok=True)

def generate_ambient_wind(duration, sample_rate=44100):
    """Generates low, howling wind rumble for Shot 1 atmosphere."""
    num_samples = int(duration * sample_rate)
    noise = np.random.normal(0, 1, num_samples)
    b_noise = np.cumsum(noise)
    b_noise = b_noise - np.mean(b_noise)
    max_val = np.max(np.abs(b_noise)) or 1.0
    b_noise = b_noise / max_val

    t = np.linspace(0, duration, num_samples, endpoint=False)
    gust = (np.sin(2 * np.pi * 0.25 * t) + np.sin(2 * np.pi * 0.4 * t) + 2.0) / 4.0
    wind = b_noise * gust * 0.30
    fade_in = np.minimum(1.0, np.linspace(0, 1.5, num_samples))
    fade_out = np.minimum(1.0, np.linspace(1.2, 0, num_samples))
    wind = wind * fade_in * fade_out
    return wind.astype(np.float32)

def assemble_soundtrack(total_duration=15.0, cut_time=7.5, sample_rate=44100):
    """Blends Shot 1 howling wind with a smooth music fade-in that peaks at 0:08."""
    total_samples = int(total_duration * sample_rate)
    mix_left = np.zeros(total_samples, dtype=np.float32)
    mix_right = np.zeros(total_samples, dtype=np.float32)

    # 1. Shot 1 Wind (0.0s to 7.8s)
    wind_samples = int(7.8 * sample_rate)
    wind = generate_ambient_wind(7.8, sample_rate)
    mix_left[:wind_samples] += wind
    mix_right[:wind_samples] += wind

    # 2. Organic Grunge: starts at 0:00 (fade-in), peaks at 0:08 (cut_time)
    if os.path.exists(GRUNGE_AUDIO):
        print(f"🎵 Loading authentic rock drop from {GRUNGE_AUDIO}...")
        try:
            c = av.open(GRUNGE_AUDIO)
            frames = [f.to_ndarray() for f in c.decode(audio=0)]
            g_audio = np.concatenate(frames, axis=1) # shape (2, N)

            available = min(total_samples, g_audio.shape[1])
            g_left = g_audio[0, :available].copy()
            g_right = g_audio[1, :available].copy()

            # Build smooth swell envelope:
            # Starts at 0:00 with subtle murmur (0.06), swells to 1.0 at cut_time (7.5s), stays at 1.0
            cut_idx = int(cut_time * sample_rate)
            t_fade = np.linspace(0, 1, cut_idx)
            fade_envelope = 0.06 + 0.94 * (t_fade ** 1.8) # Smooth power swell
            post_cut = np.ones(available - cut_idx)
            full_envelope = np.concatenate([fade_envelope, post_cut])

            mix_left[:available] += g_left * full_envelope
            mix_right[:available] += g_right * full_envelope
            print(f"  Applied smooth audio swell (0.06 -> 1.0 at {cut_time}s)")
        except Exception as e:
            print(f"⚠️ Audio load warning: {e}")

    # Clamp & Normalize
    peak = max(np.max(np.abs(mix_left)), np.max(np.abs(mix_right)), 1.0)
    mix_left /= peak
    mix_right /= peak

    return mix_left, mix_right

def process_frames():
    raw_frames = sorted(glob.glob(os.path.join(FRAMES_DIR, "frame_*.png")))
    if not raw_frames:
        print(f"❌ No raw frames found in {FRAMES_DIR}!")
        return []

    print(f"🎞️ Found {len(raw_frames)} frames. Processing letterbox and fades...")
    first_frame = Image.open(raw_frames[0])
    w, h = first_frame.size
    bar_height = int(h * 0.12) # 2.39:1 letterbox

    processed_paths = []

    for idx, f_path in enumerate(raw_frames):
        frame_num = idx + 1
        img = Image.open(f_path).convert('RGB')

        # Fade in from black on Shot 1 (Frames 1 to 48)
        if frame_num <= 48:
            fade_factor = frame_num / 48.0
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
    total_duration = len(processed_paths) / float(fps)

    print(f"🎥 Encoding {len(processed_paths)} frames to {OUTPUT_MP4} ({w}x{h} @ {fps}fps)...")

    container = av.open(OUTPUT_MP4, mode='w')
    v_stream = container.add_stream('libx264', rate=fps)
    v_stream.width = w
    v_stream.height = h
    v_stream.pix_fmt = 'yuv420p'
    v_stream.options = {'crf': '18', 'preset': 'fast'}

    # Build sound design
    sample_rate = 44100
    mix_l, mix_r = assemble_soundtrack(total_duration=total_duration, cut_time=7.5, sample_rate=sample_rate)
    a_stream = container.add_stream('aac', rate=sample_rate)
    a_stream.layout = 'stereo'

    # Write video frames
    for idx, f_path in enumerate(processed_paths):
        img = Image.open(f_path).convert('RGB')
        frame = av.VideoFrame.from_image(img)
        frame.pts = idx
        for packet in v_stream.encode(frame):
            container.mux(packet)

    for packet in v_stream.encode():
        container.mux(packet)

    # Encode audio frames in 1024 sample chunks
    chunk_size = 1024
    num_chunks = int(len(mix_l) / chunk_size)
    pts = 0
    for c_idx in range(num_chunks):
        start = c_idx * chunk_size
        end = start + chunk_size
        chunk_l = mix_l[start:end]
        chunk_r = mix_r[start:end]
        stereo_chunk = np.vstack([chunk_l, chunk_r])
        
        a_frame = av.AudioFrame.from_ndarray(stereo_chunk, format='fltp', layout='stereo')
        a_frame.rate = sample_rate
        a_frame.pts = pts
        pts += chunk_size
        
        for packet in a_stream.encode(a_frame):
            container.mux(packet)

    for packet in a_stream.encode():
        container.mux(packet)

    container.close()
    print(f"🎉 Pristine video encoded to {OUTPUT_MP4} ({os.path.getsize(OUTPUT_MP4)} bytes)")
    return True

if __name__ == "__main__":
    frames = process_frames()
    encode_mp4(frames)
