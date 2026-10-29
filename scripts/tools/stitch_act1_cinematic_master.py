# scripts/tools/stitch_act1_cinematic_master.py
"""
stitch_act1_cinematic_master.py
--------------------------------
Post-processes rendered frames, applies 2.39:1 cinematic letterbox,
burns formatted 90s narrative subtitles and retro arcade title card,
muxes with rock audio track via PyAV, and outputs pristine H.264 MP4.
"""

import os
import sys
import glob
import math

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from PIL import Image, ImageDraw, ImageFont
import av

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
FRAMES_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "act1_master")
PROCESSED_DIR = os.path.join(FRAMES_DIR, "processed")
OUTPUT_MP4 = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "screenings", "act1_scrap_yard_awakening.mp4")
OUTPUT_MP4_COPY = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "screenings", "act1_uniracer_intro_final.mp4")
AUDIO_INPUT = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "audio", "act1_scrap_yard_rock.wav")

os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(os.path.dirname(OUTPUT_MP4), exist_ok=True)

SUBTITLES = [
    (1,   65,  "1994. The corporate lawsuit shut down the league. Cartridges locked away in legal purgatory."),
    (66,  125, "Thirty years in storage. Oil is thick, bearings are cold... but an outlaw frequency overrides the static."),
    (126, 175, "The Underground Syndicate is back!"),
    (176, 235, "Tonight, we take back the rails."),
    (236, 295, "UNIRACERS 2: OUTLAW SYNDICATE")
]

def generate_title_card(w, h):
    img = Image.new("RGB", (w, h), "#050010")
    draw = ImageDraw.Draw(img)

    # 1. 90s perspective cyan/purple grid
    cx, cy = w // 2, int(h * 0.62)
    for y in range(cy, h, 20):
        draw.line([(0, y), (w, y)], fill="#1e1b4b", width=1)
    for x in range(-300, w + 300, 48):
        draw.line([(cx, cy), (x, h)], fill="#2e1065", width=1)

    # 2. Glowing synthwave sun
    sr = 110
    for r in range(sr, 0, -2):
        t = 1.0 - (r / sr)
        draw.ellipse([cx - r, cy - 85 - r, cx + r, cy - 85 + r], fill=(int(244 * t + 30), int(63 * t + 10), int(94 * t + 30)))

    # 3. Horizontal sun blinder stripes
    for sy in range(cy - 65, cy + 25, 12):
        draw.rectangle([cx - sr - 10, sy, cx + sr + 10, sy + 4], fill="#050010")

    # 4. Typography
    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/impact.ttf", 76)
        font_sub = ImageFont.truetype("C:/Windows/Fonts/impact.ttf", 56)
        font_tag = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 22)
        font_start = ImageFont.truetype("C:/Windows/Fonts/impact.ttf", 28)
    except Exception:
        font_title = font_sub = font_tag = font_start = ImageFont.load_default()

    def draw_glow_text(text, x, y, font, fill, glow):
        for ox, oy in [(-3,-3), (3,-3), (-3,3), (3,3), (0, -4), (0, 4), (-4, 0), (4, 0)]:
            draw.text((x + ox, y + oy), text, font=font, fill=glow)
        draw.text((x, y), text, font=font, fill=fill)

    # Draw centered title
    t1 = "UNIRACERS 2"
    b1 = draw.textbbox((0, 0), t1, font=font_title)
    w1 = b1[2] - b1[0]
    draw_glow_text(t1, (w - w1) // 2, cy - 195, font_title, "#ffffff", "#06b6d4")

    t2 = "OUTLAW SYNDICATE"
    b2 = draw.textbbox((0, 0), t2, font=font_sub)
    w2 = b2[2] - b2[0]
    draw_glow_text(t2, (w - w2) // 2, cy - 120, font_sub, "#fde047", "#dc2626")

    t3 = "• 30 YEARS IN LEGAL EXILE • THE TORUS OVERLORDS RIDE AGAIN •"
    b3 = draw.textbbox((0, 0), t3, font=font_tag)
    w3 = b3[2] - b3[0]
    draw.text(((w - w3) // 2 + 2, cy + 32), t3, font=font_tag, fill="#000000")
    draw.text(((w - w3) // 2, cy + 30), t3, font=font_tag, fill="#38bdf8")

    t4 = "► PRESS ANY KEY TO EMBODY ◄"
    b4 = draw.textbbox((0, 0), t4, font=font_start)
    w4 = b4[2] - b4[0]
    draw_glow_text(t4, (w - w4) // 2, h - 85, font_start, "#facc15", "#b45309")

    # Letterbox
    bar = int(h * 0.12)
    draw.rectangle([(0, 0), (w, bar)], fill=(0, 0, 0))
    draw.rectangle([(0, h - bar), (w, h)], fill=(0, 0, 0))
    return img

def post_process_all_frames():
    raw_frames = sorted(glob.glob(os.path.join(FRAMES_DIR, "raw_frame_*.png")))
    if not raw_frames:
        print(f"❌ No raw frames found in {FRAMES_DIR}!")
        return []

    print(f"🎞️ Found {len(raw_frames)} frames. Applying cinematic letterbox & subtitles...")
    first_frame = Image.open(raw_frames[0])
    w, h = first_frame.size
    bar_height = int(h * 0.12)

    try:
        font_sub = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 22)
        font_head = ImageFont.truetype("C:/Windows/Fonts/impact.ttf", 18)
    except Exception:
        font_sub = font_head = ImageFont.load_default()

    processed_paths = []

    for idx, f_path in enumerate(raw_frames):
        frame_num = idx + 1
        img = Image.open(f_path).convert('RGB')
        draw = ImageDraw.Draw(img)

        # 1. Letterbox bars
        draw.rectangle([(0, 0), (w, bar_height)], fill=(0, 0, 0))
        draw.rectangle([(0, h - bar_height), (w, h)], fill=(0, 0, 0))

        # 2. Cinematic header
        draw.text((45, bar_height - 24), "GLYPHRIDER: TORUS OUTLAWS // ACT 1: PROLOGUE", font=font_head, fill="#22d3ee")

        # 3. Subtitles
        active_sub = None
        for start, end, text in SUBTITLES:
            if start <= frame_num <= end:
                active_sub = text
                break

        if active_sub:
            bbox = draw.textbbox((0, 0), active_sub, font=font_sub)
            tw = bbox[2] - bbox[0]
            tx = (w - tw) // 2
            ty = h - bar_height + 25
            for ox, oy in [(-2, 0), (2, 0), (0, -2), (0, 2), (-1, -1), (1, 1), (-1, 1), (1, -1)]:
                draw.text((tx + ox, ty + oy), active_sub, font=font_sub, fill="#000000")
            draw.text((tx, ty), active_sub, font=font_sub, fill="#fef08a")

        out_path = os.path.join(PROCESSED_DIR, f"proc_{frame_num:04d}.png")
        img.save(out_path)
        processed_paths.append(out_path)

        if frame_num % 50 == 0:
            print(f"  Processed {frame_num}/{len(raw_frames)} frames...")

    # Generate 60 frames of title card (Frames 301-360)
    print("🎨 Generating cinematic title card sequence (Frames 301-360)...")
    title_img = generate_title_card(w, h)
    for tf in range(len(raw_frames) + 1, len(raw_frames) + 61):
        out_path = os.path.join(PROCESSED_DIR, f"proc_{tf:04d}.png")
        title_img.save(out_path)
        processed_paths.append(out_path)

    print(f"✅ Total {len(processed_paths)} frames ready for PyAV encoding!")
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

    # Audio muxing
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

    # Encode audio frames
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

    # Copy to act1_uniracer_intro_final.mp4
    import shutil
    shutil.copyfile(OUTPUT_MP4, OUTPUT_MP4_COPY)
    print(f"📋 Copied to {OUTPUT_MP4_COPY}")
    return True

if __name__ == "__main__":
    frames = post_process_all_frames()
    encode_mp4(frames)
